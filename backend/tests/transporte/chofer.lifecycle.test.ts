import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app";
import { env } from "../../src/config/env";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const { Chofer, Vehiculo, ReservaTransporte } = db;

describe("Ciclo de vida de Chofer", () => {
  it("QA-TR-FUNC-CANDIDATE-042: rechaza desactivar un chofer con una reserva futura confirmada", async () => {
    const currentLocalDateTime = new Date().toISOString();

    const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    targetDate.setUTCSeconds(0, 0);
    const fechaHora = targetDate.toISOString().replace(".000Z", "Z");

    const blockMs = env.TRANSPORT_BLOCK_MINUTES * 60 * 1000;
    const reservationStart = new Date(fechaHora);
    const reservationEnd = new Date(reservationStart.getTime() + blockMs);
    const isFuture = reservationStart.getTime() > Date.now();

    const cliente = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
    });

    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
    });

    const chofer = await Chofer.create({
      nombre: "Chofer QA 042",
      licencia: "QA-042",
      activo: true,
    });

    const vehiculo = await Vehiculo.create({
      tipo: "sedan",
      capacidad: 4,
      placa: "QA042",
    });

    const payload = {
      origen: "Aeropuerto QA 042",
      destino: "Hotel QA 042",
      fecha_hora: fechaHora,
      numero_pasajeros: 2,
    };

    const reservationCreateResponse = await request(app)
      .post("/api/reservas-transporte")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send(payload);

    expect(
      reservationCreateResponse.status,
      `Precondición inválida al crear la reserva: ${JSON.stringify(reservationCreateResponse.body)}`
    ).toBe(201);

    const reservaId = reservationCreateResponse.body.data.id;

    // Estado antes del intento de desactivación
    const initialChofer = await Chofer.findByPk(chofer.id);
    const initialReservation = await ReservaTransporte.findByPk(reservaId);

    expect(initialChofer?.activo).toBe(true);
    expect(initialReservation?.estado).toBe("confirmada");
    expect(initialReservation?.chofer_id).toBe(chofer.id);
    expect(initialReservation?.vehiculo_id).toBe(vehiculo.id);

    // Intento de desactivación administrativa del chofer
    const deactivationAttempt = await request(app)
      .patch(`/api/choferes/${chofer.id}/estado`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        activo: false,
      });

    // Estado en PostgreSQL después del intento
    const choferAfterAttempt = await Chofer.findByPk(chofer.id);
    const reservationAfterAttempt = await ReservaTransporte.findByPk(reservaId);

    const automaticCancellation = reservationAfterAttempt?.estado === "cancelada";
    const automaticUnassign = reservationAfterAttempt?.chofer_id == null;
    const automaticReassignment =
      reservationAfterAttempt?.chofer_id != null &&
      reservationAfterAttempt.chofer_id !== chofer.id;

    const inactiveDriverWithFutureConfirmedReservation =
      choferAfterAttempt?.activo === false &&
      reservationAfterAttempt?.estado === "confirmada" &&
      reservationAfterAttempt?.chofer_id === chofer.id;

    console.log("[QA-TR-FUNC-CANDIDATE-042]", {
      approvedProductRule: {
        futureConfirmedReservationsBlockDeactivation: true,
        automaticCancellation: false,
        automaticUnassign: false,
        automaticReassignment: false,
      },
      currentLocalDateTime,
      driverId: chofer.id,
      driverActiveBefore: initialChofer?.activo,
      vehicleId: vehiculo.id,
      reservationId: reservaId,
      reservationStateBefore: initialReservation?.estado,
      reservationDriverBefore: initialReservation?.chofer_id,
      reservationVehicleBefore: initialReservation?.vehiculo_id,
      reservationStart: reservationStart.toISOString(),
      reservationEnd: reservationEnd.toISOString(),
      isFuture,
      deactivationAttemptStatus: deactivationAttempt.status,
      deactivationAttemptCode: deactivationAttempt.body?.code ?? null,
      deactivationAttemptBody: deactivationAttempt.body,
      driverActiveAfter: choferAfterAttempt?.activo,
      reservationStateAfter: reservationAfterAttempt?.estado,
      reservationDriverAfter: reservationAfterAttempt?.chofer_id,
      reservationVehicleAfter: reservationAfterAttempt?.vehiculo_id,
      automaticCancellation,
      automaticUnassign,
      automaticReassignment,
      inactiveDriverWithFutureConfirmedReservation,
      businessRuleViolation: inactiveDriverWithFutureConfirmedReservation,
    });

    // Expresamos el comportamiento seguro esperado (política de producto)
    expect.soft(
      deactivationAttempt.status,
      "Una reserva futura confirmada debe bloquear la desactivación del chofer (HTTP 409)"
    ).toBe(409);

    expect.soft(
      deactivationAttempt.body?.code,
      "El intento debe retornar un código de error de conflicto adecuado"
    ).toBe("DRIVER_HAS_FUTURE_RESERVATIONS");

    expect.soft(
      choferAfterAttempt?.activo,
      "El chofer debe continuar activo tras el intento rechazado"
    ).toBe(true);

    expect.soft(
      reservationAfterAttempt?.estado,
      "La desactivación no debe cancelar ni alterar silenciosamente la reserva"
    ).toBe("confirmada");

    expect.soft(
      reservationAfterAttempt?.chofer_id,
      "La desactivación no debe desasignar ni reasignar silenciosamente la reserva"
    ).toBe(chofer.id);

    expect.soft(
      reservationAfterAttempt?.vehiculo_id,
      "El vehículo debe permanecer asignado a la reserva"
    ).toBe(vehiculo.id);
  });
});
