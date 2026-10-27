import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createSucursal } from "../fixtures/hotel";
import { createMesa, createReservaMesaFixture } from "../fixtures/restaurante";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const PRIVATE_BASE = "/api/reservas-mesa/mis-reservas";

describe("Recorrido cliente de reservas de mesa", () => {
  it("obtiene desde el JWT solo las reservas del cliente autenticado", async () => {
    const sucursal = await createSucursal({
      nombre: "Hotel restaurante cliente QA",
      direccion: "Avenida restaurante 10",
    });
    const mesa = await createMesa({
      sucursal_id: sucursal.id,
      zona: "Terraza cliente QA",
      capacidad: 6,
      estado: "disponible",
    });
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const reservaA = await createReservaMesaFixture({
      usuario_id: clienteA.usuario.id,
      mesa_id: mesa.id,
      fecha: "2027-11-10",
    });
    const reservaB = await createReservaMesaFixture({
      usuario_id: clienteB.usuario.id,
      mesa_id: mesa.id,
      fecha: "2027-11-11",
    });

    const persisted = await sequelize.query<{ id: number; usuario_id: number }>(
      `SELECT id, usuario_id FROM reservas_mesa ORDER BY id ASC`,
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
    expect(response.body.status).toBe("success");
    expect(response.body.data.map((item: any) => item.id)).toEqual([reservaA.id]);
    expect(response.body.data[0]).toMatchObject({
      id: reservaA.id,
      usuario_id: clienteA.usuario.id,
      mesa_id: mesa.id,
      fecha: "2027-11-10",
      hora: "10:00:00",
      numero_comensales: 2,
      estado: "confirmada",
      Mesa: {
        id: mesa.id,
        sucursal_id: sucursal.id,
        zona: "Terraza cliente QA",
        capacidad: 6,
        estado: "disponible",
        Sucursal: {
          id: sucursal.id,
          nombre: "Hotel restaurante cliente QA",
          direccion: "Avenida restaurante 10",
        },
      },
    });
  });

  it("permite el detalle propio y oculta el ajeno con 404", async () => {
    const sucursal = await createSucursal({
      nombre: "Hotel detalle restaurante QA",
      direccion: "Calle detalle restaurante 20",
    });
    const mesa = await createMesa({
      sucursal_id: sucursal.id,
      zona: "Salón detalle QA",
      capacidad: 4,
      estado: "disponible",
    });
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const reservaA = await createReservaMesaFixture({
      usuario_id: clienteA.usuario.id,
      mesa_id: mesa.id,
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
      mesa_id: mesa.id,
      fecha: "2027-06-10",
      hora: "10:00:00",
      numero_comensales: 2,
      estado: "confirmada",
      Mesa: {
        id: mesa.id,
        sucursal_id: sucursal.id,
        zona: "Salón detalle QA",
        capacidad: 4,
        estado: "disponible",
        Sucursal: {
          id: sucursal.id,
          nombre: "Hotel detalle restaurante QA",
          direccion: "Calle detalle restaurante 20",
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

  it("mantiene colección y detalle globales reservados para admin", async () => {
    const mesa = await createMesa();
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const reserva = await createReservaMesaFixture({
      usuario_id: cliente.usuario.id,
      mesa_id: mesa.id,
    });

    const [clientList, clientDetail, adminList, adminDetail] = await Promise.all([
      request(app).get("/api/reservas-mesa").set("Authorization", `Bearer ${cliente.token}`),
      request(app).get(`/api/reservas-mesa/${reserva.id}`).set("Authorization", `Bearer ${cliente.token}`),
      request(app).get("/api/reservas-mesa").set("Authorization", `Bearer ${admin.token}`),
      request(app).get(`/api/reservas-mesa/${reserva.id}`).set("Authorization", `Bearer ${admin.token}`),
    ]);

    expect(clientList.status).toBe(403);
    expect(clientDetail.status).toBe(403);
    expect(adminList.status).toBe(200);
    expect(adminDetail.status).toBe(200);
  });
});
