import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { createInstructor, createRecursoActividad } from "../fixtures/actividades";

const db = require("../../src/models");
const { ReservaActividad } = db;

/**
 * Regla de precio de alquileres por hora:
 * total = (precio_hora + precio_instructor_hora si se eligió instructor) × horas.
 * El equipamiento no tiene unidad de cobro definida: con tarifa > 0 no se acepta
 * en línea; con tarifa 0 se puede solicitar sin cargo.
 */
describe("Reservas de actividad · complementos y total", () => {
  const recursoConTarifas = async (tarifas: { precio_equipo?: string; precio_instructor_hora?: string }) => {
    const recurso = await createRecursoActividad({ precio_hora: "100.00" });
    await recurso.update(tarifas);
    return recurso;
  };

  const reservar = async (body: Record<string, unknown>) => {
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    return request(app).post("/api/reservas-actividad").set("Authorization", `Bearer ${cliente.token}`).send(body);
  };

  it("sin complementos cobra solo la tarifa del recurso por la duración (1 h 30 min)", async () => {
    const recurso = await recursoConTarifas({ precio_equipo: "25.00", precio_instructor_hora: "50.00" });
    const response = await reservar({ recurso_id: recurso.id, fecha: "2027-06-10", hora_inicio: "10:00", hora_fin: "11:30" });
    expect(response.status).toBe(201);
    expect(response.body.data.total).toBe("150.00");
  });

  it("con instructor suma su tarifa por hora y el importe persistido coincide", async () => {
    const recurso = await recursoConTarifas({ precio_instructor_hora: "50.00" });
    const instructor = await createInstructor();
    const response = await reservar({ recurso_id: recurso.id, instructor_id: instructor.id, fecha: "2027-06-11", hora_inicio: "09:00", hora_fin: "11:00" });
    expect(response.status).toBe(201);
    expect(response.body.data.total).toBe("300.00");
    const persisted = await ReservaActividad.findByPk(response.body.data.id);
    expect(persisted.total).toBe("300.00");
  });

  it("rechaza el equipamiento con tarifa sin unidad de cobro definida y no crea la reserva", async () => {
    const recurso = await recursoConTarifas({ precio_equipo: "25.00" });
    const response = await reservar({ recurso_id: recurso.id, fecha: "2027-06-12", hora_inicio: "10:00", hora_fin: "11:00", con_equipo: true });
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("EQUIPMENT_NOT_BOOKABLE");
    expect(await ReservaActividad.count({ where: { recurso_id: recurso.id } })).toBe(0);
  });

  it("acepta el equipamiento sin cargo cuando su tarifa es 0 y no altera el total", async () => {
    const recurso = await recursoConTarifas({ precio_equipo: "0.00" });
    const response = await reservar({ recurso_id: recurso.id, fecha: "2027-06-13", hora_inicio: "10:00", hora_fin: "11:00", con_equipo: true });
    expect(response.status).toBe(201);
    expect(response.body.data.total).toBe("100.00");
    expect(response.body.data.con_equipo).toBe(true);
  });

  it("no permite activar después un equipamiento cobrable sin recalcular el total", async () => {
    const recurso = await recursoConTarifas({ precio_equipo: "25.00" });
    const creada = await reservar({ recurso_id: recurso.id, fecha: "2027-06-14", hora_inicio: "10:00", hora_fin: "11:00" });
    expect(creada.status).toBe(201);
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const response = await request(app)
      .patch(`/api/reservas-actividad/${creada.body.data.id}/estado`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ con_equipo: true });
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("EQUIPMENT_NOT_BOOKABLE");
    const persisted = await ReservaActividad.findByPk(creada.body.data.id);
    expect(persisted.con_equipo).toBe(false);
    expect(persisted.total).toBe("100.00");
  });
});
