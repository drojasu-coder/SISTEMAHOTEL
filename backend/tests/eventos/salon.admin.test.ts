import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { createSalonEvento, createReservaEventoFixture } from "../fixtures/eventos";
import { createSucursal } from "../fixtures/hotel";

const db = require("../../src/models");
const { Salon, ReservaEvento } = db;

const authorization = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("Contrato HTTP y persistencia de administración de salones", () => {
  it("GET /api/salones serializa la asociación real como Sucursal con sus datos persistidos", async () => {
    const sucursal = await createSucursal({
      nombre: "Sucursal QA Contrato Salón",
      ciudad: "Quetzaltenango",
      activa: true,
    });
    const salon = await createSalonEvento({
      sucursal_id: sucursal.id,
      nombre: "Salón QA Contrato Sucursal",
      capacidad_maxima: 75,
      tarifa_base: 1800.25,
    });

    const response = await request(app).get("/api/salones");

    expect(response.status).toBe(200);
    const persistedSalon = response.body.data.find((item: { id: number }) => item.id === salon.id);
    expect(persistedSalon).toBeDefined();
    expect(persistedSalon.Sucursal).toEqual({
      id: sucursal.id,
      nombre: "Sucursal QA Contrato Salón",
      ciudad: "Quetzaltenango",
      activa: true,
    });
    expect(persistedSalon).not.toHaveProperty("sucursal");
  });

  it("POST con sucursal inexistente devuelve 404 BRANCH_NOT_FOUND y no persiste el salón", async () => {
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const nombre = "Salón QA Sucursal Inexistente";
    const before = await Salon.count();

    const response = await request(app)
      .post("/api/salones")
      .set(authorization(admin.token))
      .send({
        sucursal_id: 999999,
        nombre,
        capacidad_maxima: 50,
        tarifa_base: 950,
        descripcion: "No debe persistirse",
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("BRANCH_NOT_FOUND");
    expect(await Salon.count()).toBe(before);
    expect(await Salon.findOne({ where: { nombre } })).toBeNull();
  });

  it("DELETE elimina de PostgreSQL un salón temporal sin reservas", async () => {
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const salon = await createSalonEvento({ nombre: "Salón QA Eliminable Único" });

    const response = await request(app)
      .delete(`/api/salones/${salon.id}`)
      .set(authorization(admin.token));

    expect(response.status).toBe(204);
    expect(await Salon.findByPk(salon.id)).toBeNull();
  });

  it("DELETE con reserva devuelve 409 EVENT_ROOM_IN_USE y conserva salón y reserva", async () => {
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const salon = await createSalonEvento({ nombre: "Salón QA En Uso Único" });
    const reserva = await createReservaEventoFixture({
      usuario_id: cliente.usuario.id,
      salon_id: salon.id,
    });

    const response = await request(app)
      .delete(`/api/salones/${salon.id}`)
      .set(authorization(admin.token));

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("EVENT_ROOM_IN_USE");
    expect(await Salon.findByPk(salon.id)).not.toBeNull();
    expect(await ReservaEvento.findByPk(reserva.id)).not.toBeNull();
  });

  it("las mutaciones requieren JWT y rol admin: rechaza anónimo/cliente y permite admin", async () => {
    const sucursal = await createSucursal({ nombre: "Sucursal QA Autorización Salón" });
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const body = {
      sucursal_id: sucursal.id,
      nombre: "Salón QA Autorización Admin",
      capacidad_maxima: 40,
      tarifa_base: 1200,
      descripcion: "Contrato de autorización",
    };

    const anonymousResponse = await request(app).post("/api/salones").send(body);
    const clientResponse = await request(app)
      .post("/api/salones")
      .set(authorization(cliente.token))
      .send(body);

    expect(anonymousResponse.status).toBe(401);
    expect(clientResponse.status).toBe(403);
    expect(await Salon.count({ where: { nombre: body.nombre } })).toBe(0);

    const adminResponse = await request(app)
      .post("/api/salones")
      .set(authorization(admin.token))
      .send(body);

    expect(adminResponse.status).toBe(201);
    const persisted = await Salon.findOne({ where: { nombre: body.nombre } });
    expect(persisted).not.toBeNull();
    expect(persisted.sucursal_id).toBe(sucursal.id);
  });
});
