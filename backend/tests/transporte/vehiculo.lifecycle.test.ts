import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app";
import { env } from "../../src/config/env";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const { Chofer, Vehiculo, ReservaTransporte } = db;

describe("Ciclo de vida de Vehiculo", () => {
  it("QA-TR-DATA-CANDIDATE-043: rechaza reducir la capacidad por debajo de pasajeros de reserva futura confirmada", async () => {
    const currentDateTime = new Date().toISOString();

    const targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    targetDate.setUTCSeconds(0, 0);
    const fechaHora = targetDate.toISOString().replace(".000Z", "Z");

    const blockMs = env.TRANSPORT_BLOCK_MINUTES * 60 * 1000;
    const reservationStart = new Date(fechaHora);
    const isFuture = reservationStart.getTime() > Date.now();

    const cliente = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
    });

    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
    });

    const chofer = await Chofer.create({
      nombre: "Chofer QA 043",
      licencia: "QA-043",
      activo: true,
    });

    const vehiculo = await Vehiculo.create({
      tipo: "sedan",
      capacidad: 4,
      placa: "QA043",
    });

    const payload = {
      origen: "Aeropuerto QA 043",
      destino: "Hotel QA 043",
      fecha_hora: fechaHora,
      numero_pasajeros: 4,
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

    // Estado antes de la mutación de capacidad
    const initialVehiculo = await Vehiculo.findByPk(vehiculo.id);
    const initialReservation = await ReservaTransporte.findByPk(reservaId);

    expect(initialVehiculo?.capacidad).toBe(4);
    expect(initialReservation?.estado).toBe("confirmada");
    expect(initialReservation?.numero_pasajeros).toBe(4);
    expect(initialReservation?.vehiculo_id).toBe(vehiculo.id);
    expect(initialReservation?.chofer_id).toBe(chofer.id);

    // Intento administrativo de mutar capacidad a 1 (menor que los 4 pasajeros de la reserva)
    const patchResponse = await request(app)
      .patch(`/api/vehiculos/${vehiculo.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        capacidad: 1,
      });

    // Estado en PostgreSQL después del intento
    const vehiculoAfterAttempt = await Vehiculo.findByPk(vehiculo.id);
    const reservationAfterAttempt = await ReservaTransporte.findByPk(reservaId);

    const automaticCancellation = reservationAfterAttempt?.estado === "cancelada";
    const automaticReassignment =
      reservationAfterAttempt?.vehiculo_id != null &&
      reservationAfterAttempt.vehiculo_id !== vehiculo.id;

    const passengersExceedVehicleCapacity =
      vehiculoAfterAttempt?.capacidad !== undefined &&
      reservationAfterAttempt?.numero_pasajeros !== undefined &&
      reservationAfterAttempt.estado === "confirmada" &&
      reservationAfterAttempt.vehiculo_id === vehiculo.id &&
      vehiculoAfterAttempt.capacidad < reservationAfterAttempt.numero_pasajeros;

    console.log("[QA-TR-DATA-CANDIDATE-043]", {
      approvedProductRule: {
        futureConfirmedReservationsBlockCapacityReduction: true,
        automaticCancellation: false,
        automaticReassignment: false,
      },
      currentDateTime,
      vehicleId: vehiculo.id,
      vehicleCapacityBefore: initialVehiculo?.capacidad,
      driverId: chofer.id,
      reservationId: reservaId,
      reservationStateBefore: initialReservation?.estado,
      reservationPassengersBefore: initialReservation?.numero_pasajeros,
      reservationVehicleBefore: initialReservation?.vehiculo_id,
      reservationStart: reservationStart.toISOString(),
      isFuture,
      patchStatus: patchResponse.status,
      patchCode: patchResponse.body?.code ?? null,
      patchBody: patchResponse.body,
      vehicleCapacityAfter: vehiculoAfterAttempt?.capacidad,
      reservationStateAfter: reservationAfterAttempt?.estado,
      reservationPassengersAfter: reservationAfterAttempt?.numero_pasajeros,
      reservationVehicleAfter: reservationAfterAttempt?.vehiculo_id,
      automaticCancellation,
      automaticReassignment,
      passengersExceedVehicleCapacity,
      businessRuleViolation: passengersExceedVehicleCapacity,
    });

    // Asertamos el comportamiento seguro esperado (política de producto)
    expect.soft(
      patchResponse.status,
      "Una reserva futura confirmada con más pasajeros debe bloquear la reducción de capacidad del vehículo (HTTP 409)"
    ).toBe(409);

    expect.soft(
      patchResponse.body?.code,
      "El intento debe retornar un código de error de conflicto adecuado"
    ).toBe("VEHICLE_CAPACITY_CONFLICT");

    expect.soft(
      vehiculoAfterAttempt?.capacidad,
      "La capacidad del vehículo debe mantenerse en su valor seguro previo"
    ).toBe(4);

    expect.soft(
      reservationAfterAttempt?.estado,
      "La mutación rechazada no debe cancelar silenciosamente la reserva"
    ).toBe("confirmada");

    expect.soft(
      reservationAfterAttempt?.numero_pasajeros,
      "El número de pasajeros no debe alterarse"
    ).toBe(4);

    expect.soft(
      reservationAfterAttempt?.vehiculo_id,
      "El vehículo debe permanecer asignado a la reserva"
    ).toBe(vehiculo.id);
  });
});
