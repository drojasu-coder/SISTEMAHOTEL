import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import {
  createInstructor,
  createRecursoActividad,
  createReservaActividadFixture,
} from "../fixtures/actividades";
import { createSucursal } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const PRIVATE_BASE = "/api/reservas-actividad/mis-reservas";

describe("Recorrido cliente de reservas de actividad", () => {
  it("lista únicamente lo propio usando la identidad del JWT", async () => {
    const sucursal = await createSucursal({
      nombre: "Hotel actividad cliente QA",
      direccion: "Avenida actividad 40",
    });
    const recurso = await createRecursoActividad({
      sucursal_id: sucursal.id,
      tipo: "piscina",
      nombre: "Piscina actividad cliente QA",
    });
    const instructor = await createInstructor({
      nombre: "Instructor cliente QA",
      especialidad: "Natación",
      activo: true,
    });
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const reservaA = await createReservaActividadFixture({
      usuario_id: clienteA.usuario.id,
      recurso_id: recurso.id,
      instructor_id: instructor.id,
      fecha: "2027-11-10",
      con_equipo: true,
    });
    const reservaB = await createReservaActividadFixture({
      usuario_id: clienteB.usuario.id,
      recurso_id: recurso.id,
      fecha: "2027-11-11",
    });

    const persisted = await sequelize.query<{ id: number; usuario_id: number }>(
      `SELECT id, usuario_id FROM reservas_actividad ORDER BY id ASC`,
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
      recurso_id: recurso.id,
      instructor_id: instructor.id,
      fecha: "2027-11-10",
      hora_inicio: "10:00:00",
      hora_fin: "11:00:00",
      con_equipo: true,
      estado: "confirmada",
      RecursoActividad: {
        id: recurso.id,
        sucursal_id: sucursal.id,
        tipo: "piscina",
        nombre: "Piscina actividad cliente QA",
        Sucursal: {
          id: sucursal.id,
          nombre: "Hotel actividad cliente QA",
          direccion: "Avenida actividad 40",
        },
      },
      Instructor: {
        id: instructor.id,
        nombre: "Instructor cliente QA",
        especialidad: "Natación",
        activo: true,
      },
    });
  });

  it("permite detalle propio y enmascara el ajeno con 404", async () => {
    const sucursal = await createSucursal({
      nombre: "Hotel detalle actividad QA",
      direccion: "Calle actividad 50",
    });
    const recurso = await createRecursoActividad({
      sucursal_id: sucursal.id,
      tipo: "salon",
      nombre: "Salón actividad detalle QA",
    });
    const instructor = await createInstructor({
      nombre: "Instructor detalle QA",
      especialidad: "Yoga",
      activo: true,
    });
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const reservaA = await createReservaActividadFixture({
      usuario_id: clienteA.usuario.id,
      recurso_id: recurso.id,
      instructor_id: instructor.id,
      con_equipo: true,
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
      recurso_id: recurso.id,
      instructor_id: instructor.id,
      fecha: "2027-06-10",
      hora_inicio: "10:00:00",
      hora_fin: "11:00:00",
      con_equipo: true,
      estado: "confirmada",
      RecursoActividad: {
        id: recurso.id,
        sucursal_id: sucursal.id,
        tipo: "salon",
        nombre: "Salón actividad detalle QA",
        Sucursal: {
          id: sucursal.id,
          nombre: "Hotel detalle actividad QA",
          direccion: "Calle actividad 50",
        },
      },
      Instructor: {
        id: instructor.id,
        nombre: "Instructor detalle QA",
        especialidad: "Yoga",
        activo: true,
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

  it("mantiene los GET globales restringidos a admin", async () => {
    const recurso = await createRecursoActividad();
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const reserva = await createReservaActividadFixture({
      usuario_id: cliente.usuario.id,
      recurso_id: recurso.id,
    });

    const [clientList, clientDetail, adminList, adminDetail] = await Promise.all([
      request(app).get("/api/reservas-actividad").set("Authorization", `Bearer ${cliente.token}`),
      request(app).get(`/api/reservas-actividad/${reserva.id}`).set("Authorization", `Bearer ${cliente.token}`),
      request(app).get("/api/reservas-actividad").set("Authorization", `Bearer ${admin.token}`),
      request(app).get(`/api/reservas-actividad/${reserva.id}`).set("Authorization", `Bearer ${admin.token}`),
    ]);

    expect(clientList.status).toBe(403);
    expect(clientDetail.status).toBe(403);
    expect(adminList.status).toBe(200);
    expect(adminDetail.status).toBe(200);
  });
});
