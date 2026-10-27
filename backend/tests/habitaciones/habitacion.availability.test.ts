import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import {
  createHabitacion,
  createSucursal,
  createTipoHabitacion,
} from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const db = require("../../src/models");
const { ReservaHabitacion } = db;
const ENDPOINT = "/api/habitaciones/disponibles";

const query = {
  sucursal_id: 0,
  fecha_entrada: "2027-12-10",
  fecha_salida: "2027-12-13",
  numero_huespedes: 2,
};

const persistReservation = async (
  usuarioId: number,
  habitacionId: number,
  fechaEntrada: string,
  fechaSalida: string,
  estado: string
) => ReservaHabitacion.create({
  usuario_id: usuarioId,
  habitacion_id: habitacionId,
  fecha_entrada: fechaEntrada,
  fecha_salida: fechaSalida,
  numero_huespedes: 1,
  estado,
  total: "100.00",
});

describe("GET /api/habitaciones/disponibles", () => {
  it("exige autenticación y conserva la gestión de habitaciones restringida", async () => {
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

    const [anonymousAvailability, clientAdminCreate] = await Promise.all([
      request(app).get(ENDPOINT).query({ ...query, sucursal_id: 1 }),
      request(app)
        .post("/api/habitaciones")
        .set("Authorization", `Bearer ${cliente.token}`)
        .send({}),
    ]);

    expect(anonymousAvailability.status).toBe(401);
    expect(clientAdminCreate.status).toBe(403);
  });

  it("filtra sede, tipo, capacidad, mantenimiento y traslapes bloqueantes", async () => {
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const sucursal = await createSucursal({
      nombre: "Sede disponibilidad QA",
      direccion: "Avenida habitaciones 60",
    });
    const otraSucursal = await createSucursal({ nombre: "Otra sede QA" });
    const tipo = await createTipoHabitacion({
      nombre: "Suite disponibilidad QA",
      capacidad_maxima: 4,
      tarifa_noche: 125,
      descripcion: "Suite usada por el recorrido cliente QA",
    });
    const tipoPequeno = await createTipoHabitacion({
      nombre: "Individual disponibilidad QA",
      capacidad_maxima: 1,
      tarifa_noche: 80,
    });
    const otroTipo = await createTipoHabitacion({
      nombre: "Otro tipo disponibilidad QA",
      capacidad_maxima: 4,
      tarifa_noche: 90,
    });

    const libre = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, numero: "D-101" });
    const ocupadaHoyReservable = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, numero: "D-102", estado: "ocupada" });
    const mantenimiento = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, numero: "D-103", estado: "mantenimiento" });
    const capacidadInsuficiente = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipoPequeno.id, numero: "D-104" });
    const tipoNoSolicitado = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: otroTipo.id, numero: "D-105" });
    const otraSede = await createHabitacion({ sucursal_id: otraSucursal.id, tipo_habitacion_id: tipo.id, numero: "D-106" });
    const pendienteTraslapada = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, numero: "D-107" });
    const confirmadaTraslapada = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, numero: "D-108" });
    const canceladaTraslapada = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, numero: "D-109" });
    const terminaAlEntrar = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, numero: "D-110" });
    const iniciaAlSalir = await createHabitacion({ sucursal_id: sucursal.id, tipo_habitacion_id: tipo.id, numero: "D-111" });

    await Promise.all([
      persistReservation(cliente.usuario.id, pendienteTraslapada.id, "2027-12-09", "2027-12-11", "pendiente"),
      persistReservation(cliente.usuario.id, confirmadaTraslapada.id, "2027-12-12", "2027-12-14", "confirmada"),
      persistReservation(cliente.usuario.id, canceladaTraslapada.id, "2027-12-11", "2027-12-12", "cancelada"),
      persistReservation(cliente.usuario.id, terminaAlEntrar.id, "2027-12-08", "2027-12-10", "confirmada"),
      persistReservation(cliente.usuario.id, iniciaAlSalir.id, "2027-12-13", "2027-12-15", "pendiente"),
    ]);

    const persistedReservations = await sequelize.query<{
      habitacion_id: number;
      estado: string;
      fecha_entrada: string;
      fecha_salida: string;
    }>(
      `SELECT habitacion_id, estado, fecha_entrada::text, fecha_salida::text
       FROM reservas_habitacion ORDER BY habitacion_id ASC`,
      { type: QueryTypes.SELECT }
    );
    expect(persistedReservations).toHaveLength(5);

    const [response, typeFilteredResponse] = await Promise.all([
      request(app)
        .get(ENDPOINT)
        .set("Authorization", `Bearer ${cliente.token}`)
        .query({
          ...query,
          sucursal_id: sucursal.id,
        }),
      request(app)
        .get(ENDPOINT)
        .set("Authorization", `Bearer ${cliente.token}`)
        .query({
          ...query,
          sucursal_id: sucursal.id,
          tipo_habitacion_id: tipo.id,
        }),
    ]);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "Habitaciones disponibles obtenidas correctamente",
    });

    const returnedIds = response.body.data.map((item: any) => item.id);
    expect(returnedIds).toEqual(expect.arrayContaining([
      libre.id,
      ocupadaHoyReservable.id,
      tipoNoSolicitado.id,
      canceladaTraslapada.id,
      terminaAlEntrar.id,
      iniciaAlSalir.id,
    ]));
    expect(returnedIds).not.toEqual(expect.arrayContaining([
      mantenimiento.id,
      capacidadInsuficiente.id,
      otraSede.id,
      pendienteTraslapada.id,
      confirmadaTraslapada.id,
    ]));

    const freeRoom = response.body.data.find((item: any) => item.id === libre.id);
    expect(freeRoom).toMatchObject({
      id: libre.id,
      numero: "D-101",
      estado: "disponible",
      sucursal_id: sucursal.id,
      tipo_habitacion_id: tipo.id,
      noches: 3,
      tarifa_noche: "125.00",
      total_estimado: "375.00",
      Sucursal: {
        id: sucursal.id,
        nombre: "Sede disponibilidad QA",
        direccion: "Avenida habitaciones 60",
      },
      TipoHabitacion: {
        id: tipo.id,
        nombre: "Suite disponibilidad QA",
        capacidad_maxima: 4,
        tarifa_noche: "125.00",
        descripcion: "Suite usada por el recorrido cliente QA",
      },
    });

    expect(typeFilteredResponse.status).toBe(200);
    expect(
      typeFilteredResponse.body.data.every(
        (item: any) => item.tipo_habitacion_id === tipo.id
      )
    ).toBe(true);
    expect(typeFilteredResponse.body.data.map((item: any) => item.id)).not.toContain(
      tipoNoSolicitado.id
    );
  });

  it("valida formato, orden temporal, pasado y existencia de sede", async () => {
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const sucursal = await createSucursal();
    const authorization = `Bearer ${cliente.token}`;

    const [malformed, equalDates, past, missingBranch] = await Promise.all([
      request(app).get(ENDPOINT).set("Authorization", authorization).query({
        ...query,
        sucursal_id: sucursal.id,
        fecha_entrada: "10-12-2027",
      }),
      request(app).get(ENDPOINT).set("Authorization", authorization).query({
        ...query,
        sucursal_id: sucursal.id,
        fecha_salida: query.fecha_entrada,
      }),
      request(app).get(ENDPOINT).set("Authorization", authorization).query({
        ...query,
        sucursal_id: sucursal.id,
        fecha_entrada: "2020-01-10",
        fecha_salida: "2020-01-12",
      }),
      request(app).get(ENDPOINT).set("Authorization", authorization).query({
        ...query,
        sucursal_id: 999999,
      }),
    ]);

    expect(malformed.status).toBe(400);
    expect(equalDates.status).toBe(422);
    expect(equalDates.body.code).toBe("FECHAS_INVALIDAS");
    expect(past.status).toBe(422);
    expect(past.body.code).toBe("ROOM_RESERVATION_DATE_IN_PAST");
    expect(missingBranch.status).toBe(404);
    expect(missingBranch.body.code).toBe("SUCURSAL_NOT_FOUND");
  });
});
