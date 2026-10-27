import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const db = require("../../src/models");
const { CitaBienestar, ServicioBienestar, Terapeuta } = db;
const PRIVATE_BASE = "/api/citas-spa/mis-reservas";

const createSpaResources = async (suffix: string) => {
  const servicio = await ServicioBienestar.create({
    nombre: `Masaje recorrido cliente QA ${suffix}`,
    duracion_minutos: 60,
    precio: "250.00",
  });
  const terapeuta = await Terapeuta.create({
    nombre: `Terapeuta recorrido cliente QA ${suffix}`,
    activo: true,
  });
  return { servicio, terapeuta };
};

const createAppointment = async (usuarioId: number, fecha: string) => {
  const { servicio, terapeuta } = await createSpaResources(fecha);
  const cita = await CitaBienestar.create({
    usuario_id: usuarioId,
    servicio_bienestar_id: servicio.id,
    terapeuta_id: terapeuta.id,
    fecha,
    hora_inicio: "10:00:00",
    hora_fin: "11:00:00",
    estado: "confirmada",
  });

  return { cita, servicio, terapeuta };
};

describe("Recorrido cliente de citas Spa", () => {
  it("lista únicamente las citas de la identidad del JWT", async () => {
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const citaA = await createAppointment(clienteA.usuario.id, "2027-11-10");
    const citaB = await createAppointment(clienteB.usuario.id, "2027-11-11");

    const persisted = await sequelize.query<{ id: number; usuario_id: number }>(
      `SELECT id, usuario_id FROM citas_bienestar ORDER BY id ASC`,
      { type: QueryTypes.SELECT }
    );
    expect(persisted).toEqual([
      { id: citaA.cita.id, usuario_id: clienteA.usuario.id },
      { id: citaB.cita.id, usuario_id: clienteB.usuario.id },
    ]);

    const response = await request(app)
      .get(PRIVATE_BASE)
      .set("Authorization", `Bearer ${clienteA.token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.map((item: any) => item.id)).toEqual([citaA.cita.id]);
    expect(response.body.data[0]).toMatchObject({
      id: citaA.cita.id,
      usuario_id: clienteA.usuario.id,
      servicio_bienestar_id: citaA.servicio.id,
      terapeuta_id: citaA.terapeuta.id,
      fecha: "2027-11-10",
      hora_inicio: "10:00:00",
      hora_fin: "11:00:00",
      estado: "confirmada",
      ServicioBienestar: {
        nombre: "Masaje recorrido cliente QA 2027-11-10",
        duracion_minutos: 60,
        precio: "250.00",
      },
      Terapeuta: {
        nombre: "Terapeuta recorrido cliente QA 2027-11-10",
        activo: true,
      },
    });
    expect(response.body.data[0]).not.toHaveProperty("Terapeutum");
  });

  it("permite detalle propio y oculta el ajeno con 404", async () => {
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const citaA = await createAppointment(clienteA.usuario.id, "2027-11-10");

    const [own, foreign] = await Promise.all([
      request(app)
        .get(`${PRIVATE_BASE}/${citaA.cita.id}`)
        .set("Authorization", `Bearer ${clienteA.token}`),
      request(app)
        .get(`${PRIVATE_BASE}/${citaA.cita.id}`)
        .set("Authorization", `Bearer ${clienteB.token}`),
    ]);

    expect(foreign.status).toBe(404);
    expect(own.status).toBe(200);
    expect(own.body.data).toMatchObject({
      id: citaA.cita.id,
      usuario_id: clienteA.usuario.id,
      servicio_bienestar_id: citaA.servicio.id,
      terapeuta_id: citaA.terapeuta.id,
      fecha: "2027-11-10",
      hora_inicio: "10:00:00",
      hora_fin: "11:00:00",
      estado: "confirmada",
      ServicioBienestar: {
        nombre: "Masaje recorrido cliente QA 2027-11-10",
        duracion_minutos: 60,
        precio: "250.00",
      },
      Terapeuta: {
        nombre: "Terapeuta recorrido cliente QA 2027-11-10",
        activo: true,
      },
    });
    expect(own.body.data).not.toHaveProperty("Terapeutum");
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

  it("mantiene colección y detalle globales exclusivos de admin", async () => {
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const cita = await createAppointment(cliente.usuario.id, "2027-11-10");

    const [clientList, clientDetail, adminList, adminDetail] = await Promise.all([
      request(app).get("/api/citas-spa").set("Authorization", `Bearer ${cliente.token}`),
      request(app).get(`/api/citas-spa/${cita.cita.id}`).set("Authorization", `Bearer ${cliente.token}`),
      request(app).get("/api/citas-spa").set("Authorization", `Bearer ${admin.token}`),
      request(app).get(`/api/citas-spa/${cita.cita.id}`).set("Authorization", `Bearer ${admin.token}`),
    ]);

    expect(clientList.status).toBe(403);
    expect(clientDetail.status).toBe(403);
    expect(adminList.status).toBe(200);
    expect(adminDetail.status).toBe(200);
  });
});
