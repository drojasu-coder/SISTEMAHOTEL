import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAmenidad, createReservaAmenidadFixture } from "../fixtures/amenidades";
import { createSucursal } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const PRIVATE_BASE = "/api/reservas-amenidad/mis-reservas";

describe("Recorrido cliente de reservas de amenidad", () => {
  it("lista por identidad JWT sin reutilizar la colección administrativa", async () => {
    const sucursal = await createSucursal({
      nombre: "Hotel amenidad cliente QA",
      direccion: "Avenida amenidad 30",
    });
    const amenidad = await createAmenidad({
      sucursal_id: sucursal.id,
      nombre: "Piscina cliente QA",
      aforo_maximo: 12,
    });
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const reservaA = await createReservaAmenidadFixture({
      usuario_id: clienteA.usuario.id,
      amenidad_id: amenidad.id,
      fecha: "2027-11-10",
    });
    const reservaB = await createReservaAmenidadFixture({
      usuario_id: clienteB.usuario.id,
      amenidad_id: amenidad.id,
      fecha: "2027-11-11",
    });

    const persisted = await sequelize.query<{ id: number; usuario_id: number }>(
      `SELECT id, usuario_id FROM reservas_amenidad ORDER BY id ASC`,
      { type: QueryTypes.SELECT }
    );
    expect(persisted).toEqual([
      { id: reservaA.id, usuario_id: clienteA.usuario.id },
      { id: reservaB.id, usuario_id: clienteB.usuario.id },
    ]);

    const response = await request(app)
      .get(PRIVATE_BASE)
      .set("Authorization", `Bearer ${clienteA.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.map((item: any) => item.id)).toEqual([reservaA.id]);
    expect(response.body.data[0]).toMatchObject({
      id: reservaA.id,
      usuario_id: clienteA.usuario.id,
      amenidad_id: amenidad.id,
      fecha: "2027-11-10",
      franja_horaria: "10:00-11:00",
      mobiliario: "ninguno",
      estado: "confirmada",
      Amenidad: {
        id: amenidad.id,
        sucursal_id: sucursal.id,
        nombre: "Piscina cliente QA",
        aforo_maximo: 12,
        Sucursal: {
          id: sucursal.id,
          nombre: "Hotel amenidad cliente QA",
        },
      },
    });
  });

  it("permite detalle privado propio y responde 404 al ID ajeno", async () => {
    const sucursal = await createSucursal({
      nombre: "Hotel detalle amenidad QA",
    });
    const amenidad = await createAmenidad({
      sucursal_id: sucursal.id,
      nombre: "Sauna detalle QA",
      aforo_maximo: 8,
    });
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const reservaA = await createReservaAmenidadFixture({
      usuario_id: clienteA.usuario.id,
      amenidad_id: amenidad.id,
    });

    const [own, foreign] = await Promise.all([
      request(app)
        .get(`${PRIVATE_BASE}/${reservaA.id}`)
        .set("Authorization", `Bearer ${clienteA.token}`),
      request(app)
        .get(`${PRIVATE_BASE}/${reservaA.id}`)
        .set("Authorization", `Bearer ${clienteB.token}`),
    ]);

    expect(foreign.status).toBe(404);
    expect(own.status).toBe(200);
    expect(own.body.data).toMatchObject({
      id: reservaA.id,
      usuario_id: clienteA.usuario.id,
      amenidad_id: amenidad.id,
      fecha: "2027-06-10",
      franja_horaria: "10:00-11:00",
      mobiliario: "ninguno",
      estado: "confirmada",
      Amenidad: {
        id: amenidad.id,
        sucursal_id: sucursal.id,
        nombre: "Sauna detalle QA",
        aforo_maximo: 8,
        Sucursal: {
          id: sucursal.id,
          nombre: "Hotel detalle amenidad QA",
        },
      },
    });
  });

  it("rechaza un ID privado inválido de forma controlada sin 500", async () => {
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });

    const response = await request(app)
      .get(`${PRIVATE_BASE}/abc`)
      .set("Authorization", `Bearer ${cliente.token}`);

    expect(response.status).toBe(400);
    expect(response.status).not.toBe(500);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("exige JWT en colección y detalle privados", async () => {
    const [anonymousList, anonymousDetail] = await Promise.all([
      request(app).get(PRIVATE_BASE),
      request(app).get(`${PRIVATE_BASE}/1`),
    ]);

    expect(anonymousList.status).toBe(401);
    expect(anonymousDetail.status).toBe(401);
  });

  it("conserva los GET globales exclusivos de admin", async () => {
    const amenidad = await createAmenidad();
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const reserva = await createReservaAmenidadFixture({
      usuario_id: cliente.usuario.id,
      amenidad_id: amenidad.id,
    });

    const [clientList, clientDetail, adminList, adminDetail] = await Promise.all([
      request(app).get("/api/reservas-amenidad").set("Authorization", `Bearer ${cliente.token}`),
      request(app).get(`/api/reservas-amenidad/${reserva.id}`).set("Authorization", `Bearer ${cliente.token}`),
      request(app).get("/api/reservas-amenidad").set("Authorization", `Bearer ${admin.token}`),
      request(app).get(`/api/reservas-amenidad/${reserva.id}`).set("Authorization", `Bearer ${admin.token}`),
    ]);

    expect(clientList.status).toBe(403);
    expect(clientDetail.status).toBe(403);
    expect(adminList.status).toBe(200);
    expect(adminDetail.status).toBe(200);
  });
});
