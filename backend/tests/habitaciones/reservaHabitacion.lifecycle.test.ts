import { describe, expect, it } from "vitest";
import { QueryTypes } from "sequelize";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

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

describe("Ciclo de vida de ReservaHabitacion", () => {
  it("QA-RH-FUNC-CANDIDATE-025: rechaza finalizar una estancia cuya fecha_salida sigue futura", async () => {
    const currentLocalDate = getHotelDatePlusDays(0);
    const fechaEntrada = getHotelDatePlusDays(2);
    const fechaSalida = getHotelDatePlusDays(4);
    const hotel = await createHotelFixture();
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

    const reservaId = Number(created.body.data.id);
    const confirmed = await request(app)
      .patch(`/api/reservas-habitacion/${reservaId}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ estado: "confirmada" });

    expect(
      confirmed.status,
      `Precondición inválida al confirmar reserva: ${JSON.stringify(confirmed.body)}`
    ).toBe(200);

    const initialRows = (await sequelize.query(
      `
        SELECT
          id,
          habitacion_id,
          fecha_entrada::text AS fecha_entrada,
          fecha_salida::text AS fecha_salida,
          estado
        FROM reservas_habitacion
        WHERE id = :reservaId;
      `,
      {
        replacements: { reservaId },
        type: QueryTypes.SELECT,
      }
    )) as ReservationRow[];

    expect(initialRows).toHaveLength(1);
    expect(initialRows[0].estado).toBe("confirmada");

    const isFuture = initialRows[0].fecha_salida > currentLocalDate;
    expect(
      isFuture,
      `Precondición inválida: fecha_salida=${initialRows[0].fecha_salida} debe ser futura respecto de fecha local actual=${currentLocalDate}`
    ).toBe(true);

    const finalizeAttempt = await request(app)
      .patch(`/api/reservas-habitacion/${reservaId}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ estado: "finalizada" });

    const persistedAfterAttempt = (await sequelize.query(
      `
        SELECT
          id,
          habitacion_id,
          fecha_entrada::text AS fecha_entrada,
          fecha_salida::text AS fecha_salida,
          estado
        FROM reservas_habitacion
        WHERE id = :reservaId;
      `,
      {
        replacements: { reservaId },
        type: QueryTypes.SELECT,
      }
    )) as ReservationRow[];

    const overlapAttempt = await request(app)
      .post("/api/reservas-habitacion")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({
        habitacion_id: hotel.habitacion.id,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        numero_huespedes: 1,
      });

    const overlappingRows = (await sequelize.query(
      `
        SELECT
          id,
          habitacion_id,
          fecha_entrada::text AS fecha_entrada,
          fecha_salida::text AS fecha_salida,
          estado
        FROM reservas_habitacion
        WHERE habitacion_id = :habitacionId
          AND fecha_entrada < CAST(:fechaSalida AS date)
          AND fecha_salida > CAST(:fechaEntrada AS date)
        ORDER BY id;
      `,
      {
        replacements: {
          habitacionId: hotel.habitacion.id,
          fechaEntrada,
          fechaSalida,
        },
        type: QueryTypes.SELECT,
      }
    )) as ReservationRow[];

    console.log("[QA-RH-FUNC-CANDIDATE-025 EVIDENCE]", {
      hotelTimeZone: process.env.APP_TIMEZONE || "America/Guatemala",
      hotelLocalToday: currentLocalDate,
      interval: { fechaEntrada, fechaSalida },
      isFuture,
      initialPersistedState: initialRows[0]?.estado ?? null,
      finalizeAttempt: {
        status: finalizeAttempt.status,
        code: finalizeAttempt.body?.code ?? null,
        body: finalizeAttempt.body,
      },
      persistedStateAfterAttempt: persistedAfterAttempt[0]?.estado ?? null,
      overlapAttempt: {
        status: overlapAttempt.status,
        code: overlapAttempt.body?.code ?? null,
        body: overlapAttempt.body,
      },
      overlappingRows,
    });

    expect.soft(finalizeAttempt.status).toBe(409);
    expect.soft(finalizeAttempt.body?.code).toBe("RESERVATION_NOT_FINISHED");
    expect.soft(persistedAfterAttempt[0]?.estado).toBe("confirmada");
    expect.soft(overlapAttempt.status).toBe(409);
    expect.soft(overlapAttempt.body?.code).toBe("HABITACION_NO_DISPONIBLE");
    expect.soft(overlappingRows).toHaveLength(1);
  });
});
