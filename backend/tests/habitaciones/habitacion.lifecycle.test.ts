import { describe, expect, it } from "vitest";
import { QueryTypes } from "sequelize";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

type RoomRow = {
  id: number;
  estado: string;
};

type ReservationRow = {
  id: number;
  habitacion_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  estado: string;
};

const getHotelDatePlusDays = (days: number) => {
  const timeZone = process.env.APP_TIMEZONE || "America/Guatemala";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const date = new Date(
    Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day") + days
    )
  );

  return date.toISOString().slice(0, 10);
};

const getRoom = async (roomId: number) =>
  (await sequelize.query(
    `
      SELECT id, estado
      FROM habitaciones
      WHERE id = :roomId;
    `,
    {
      replacements: { roomId },
      type: QueryTypes.SELECT,
    }
  )) as RoomRow[];

const getReservation = async (reservationId: number) =>
  (await sequelize.query(
    `
      SELECT
        id,
        habitacion_id,
        fecha_entrada::text AS fecha_entrada,
        fecha_salida::text AS fecha_salida,
        estado
      FROM reservas_habitacion
      WHERE id = :reservationId;
    `,
    {
      replacements: { reservationId },
      type: QueryTypes.SELECT,
    }
  )) as ReservationRow[];

describe("Ciclo de vida de Habitación", () => {
  it("QA-RH-FUNC-CANDIDATE-026: rechaza mantenimiento con una reserva futura activa y permite reservar limpieza", async () => {
    const currentLocalDate = getHotelDatePlusDays(0);
    const fechaEntrada = getHotelDatePlusDays(2);
    const fechaSalida = getHotelDatePlusDays(4);
    const hotel = await createHotelFixture({ estadoHabitacion: "disponible" });
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });

    const created = await request(app)
      .post("/api/reservas-habitacion")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({
        habitacion_id: hotel.habitacion.id,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        numero_huespedes: 1,
      });

    expect(
      created.status,
      `Precondición inválida al crear reserva: ${JSON.stringify(created.body)}`
    ).toBe(201);

    const reservationId = Number(created.body.data.id);
    const initialRoomRows = await getRoom(hotel.habitacion.id);
    const initialReservationRows = await getReservation(reservationId);

    expect(initialRoomRows).toHaveLength(1);
    expect(initialReservationRows).toHaveLength(1);
    expect(initialRoomRows[0].estado).toBe("disponible");
    expect(initialReservationRows[0]).toMatchObject({
      habitacion_id: hotel.habitacion.id,
      fecha_entrada: fechaEntrada,
      fecha_salida: fechaSalida,
      estado: "pendiente",
    });

    const isFuture = initialReservationRows[0].fecha_entrada > currentLocalDate;
    expect(
      isFuture,
      `Precondición inválida: fecha_entrada=${initialReservationRows[0].fecha_entrada} debe ser futura respecto de fecha local actual=${currentLocalDate}`
    ).toBe(true);

    const maintenanceAttempt = await request(app)
      .patch(`/api/habitaciones/${hotel.habitacion.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ estado: "mantenimiento" });

    const roomRowsAfterAttempt = await getRoom(hotel.habitacion.id);
    const reservationRowsAfterAttempt = await getReservation(reservationId);

    expect(roomRowsAfterAttempt).toHaveLength(1);
    expect(reservationRowsAfterAttempt).toHaveLength(1);

    const cleaningHotel = await createHotelFixture({
      estadoHabitacion: "limpieza",
    });
    const cleaningReservation = await request(app)
      .post("/api/reservas-habitacion")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({
        habitacion_id: cleaningHotel.habitacion.id,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        numero_huespedes: 1,
      });

    expect(
      cleaningReservation.status,
      `Limpieza no debe bloquear una reserva futura: ${JSON.stringify(cleaningReservation.body)}`
    ).toBe(201);

    const cleaningReservationRows = await getReservation(
      Number(cleaningReservation.body.data.id)
    );
    expect(cleaningReservationRows).toHaveLength(1);
    expect(cleaningReservationRows[0]).toMatchObject({
      habitacion_id: cleaningHotel.habitacion.id,
      fecha_entrada: fechaEntrada,
      fecha_salida: fechaSalida,
      estado: "pendiente",
    });

    const reservationUnchanged =
      JSON.stringify(reservationRowsAfterAttempt[0]) ===
      JSON.stringify(initialReservationRows[0]);
    const automaticCancellation =
      reservationRowsAfterAttempt[0].estado === "cancelada";
    const automaticReassignment =
      reservationRowsAfterAttempt[0].habitacion_id !== hotel.habitacion.id;

    console.log("[QA-RH-FUNC-CANDIDATE-026 EVIDENCE]", {
      hotelTimeZone: process.env.APP_TIMEZONE || "America/Guatemala",
      hotelLocalToday: currentLocalDate,
      interval: { fechaEntrada, fechaSalida },
      isFuture,
      initialRoomState: initialRoomRows[0].estado,
      initialReservation: initialReservationRows[0],
      maintenanceAttempt: {
        status: maintenanceAttempt.status,
        code: maintenanceAttempt.body?.code ?? null,
        body: maintenanceAttempt.body,
      },
      roomStateAfterAttempt: roomRowsAfterAttempt[0].estado,
      reservationAfterAttempt: reservationRowsAfterAttempt[0],
      reservationUnchanged,
      automaticCancellation,
      automaticReassignment,
      maintenanceRoomWithFutureReservation:
        roomRowsAfterAttempt[0].estado === "mantenimiento" &&
        reservationRowsAfterAttempt[0].habitacion_id === hotel.habitacion.id &&
        ["pendiente", "confirmada"].includes(
          reservationRowsAfterAttempt[0].estado
        ),
      cleaning: {
        roomId: cleaningHotel.habitacion.id,
        status: cleaningReservation.status,
        code: cleaningReservation.body?.code ?? null,
        persistedReservation: cleaningReservationRows[0],
      },
    });

    expect.soft(maintenanceAttempt.status).toBe(409);
    expect.soft(maintenanceAttempt.body?.code).toBe(
      "ROOM_HAS_FUTURE_RESERVATIONS"
    );
    expect.soft(roomRowsAfterAttempt[0].estado).toBe(
      initialRoomRows[0].estado
    );
    expect.soft(reservationUnchanged).toBe(true);
    expect.soft(automaticCancellation).toBe(false);
    expect.soft(automaticReassignment).toBe(false);
  });
});
