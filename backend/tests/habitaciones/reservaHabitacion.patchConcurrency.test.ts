import { describe, expect, it } from "vitest";
import request, { Response } from "supertest";
import { QueryTypes } from "sequelize";

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

const TARGET_START = "2036-04-10";
const TARGET_END = "2036-04-13";

const responseEvidence = (response: Response) => ({
  status: response.status,
  code: response.body?.code ?? null,
  body: response.body,
});

describe("QA-RH-CONC-CANDIDATE-023", () => {
  it("QA-RH-CONC-CANDIDATE-023: dos PATCH no pueden mover dos reservas activas a la misma habitación e intervalo", async () => {
    const [sourceA, sourceB, target] = await Promise.all([
      createHotelFixture(),
      createHotelFixture(),
      createHotelFixture(),
    ]);
    const cliente = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
    });
    const admin = await createAuthenticatedUser({
      rol: ROLES.ADMIN,
    });

    const createReservation = (habitacionId: number) =>
      request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", `Bearer ${cliente.token}`)
        .send({
          habitacion_id: habitacionId,
          fecha_entrada: TARGET_START,
          fecha_salida: TARGET_END,
          numero_huespedes: 2,
        });

    const createdA = await createReservation(sourceA.habitacion.id);
    const createdB = await createReservation(sourceB.habitacion.id);

    if (createdA.status !== 201 || createdB.status !== 201) {
      throw new Error(
        `Fixture inválido: A=${createdA.status}/${JSON.stringify(createdA.body)}, B=${createdB.status}/${JSON.stringify(createdB.body)}`
      );
    }

    const reservationAId = Number(createdA.body.data.id);
    const reservationBId = Number(createdB.body.data.id);

    // Primer y único par: exactamente dos PATCH HTTP reales lanzados juntos.
    const responses = await Promise.all([
      request(app)
        .patch(`/api/reservas-habitacion/${reservationAId}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          habitacion_id: target.habitacion.id,
          fecha_entrada: TARGET_START,
          fecha_salida: TARGET_END,
        }),
      request(app)
        .patch(`/api/reservas-habitacion/${reservationBId}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          habitacion_id: target.habitacion.id,
          fecha_entrada: TARGET_START,
          fecha_salida: TARGET_END,
        }),
    ]);

    // PostgreSQL es la fuente de verdad: se consulta después del par completo.
    const activeOverlaps = (await sequelize.query(
      `
        SELECT
          id,
          habitacion_id,
          fecha_entrada::text AS fecha_entrada,
          fecha_salida::text AS fecha_salida,
          estado
        FROM reservas_habitacion
        WHERE habitacion_id = :targetRoomId
          AND estado IN ('pendiente', 'confirmada')
          AND fecha_entrada < CAST(:targetEnd AS date)
          AND fecha_salida > CAST(:targetStart AS date)
        ORDER BY id;
      `,
      {
        replacements: {
          targetRoomId: target.habitacion.id,
          targetStart: TARGET_START,
          targetEnd: TARGET_END,
        },
        type: QueryTypes.SELECT,
      }
    )) as ReservationRow[];

    const finalReservations = (await sequelize.query(
      `
        SELECT
          id,
          habitacion_id,
          fecha_entrada::text AS fecha_entrada,
          fecha_salida::text AS fecha_salida,
          estado
        FROM reservas_habitacion
        WHERE id IN (:reservationAId, :reservationBId)
        ORDER BY id;
      `,
      {
        replacements: {
          reservationAId,
          reservationBId,
        },
        type: QueryTypes.SELECT,
      }
    )) as ReservationRow[];

    const serializedResponses = JSON.stringify(
      responses.map(responseEvidence)
    );
    const concurrencyErrorEvidence = {
      postgres40P01: /40P01/i.test(serializedResponses),
      constraint: /constraint/i.test(serializedResponses),
      sequelize: /sequelize/i.test(serializedResponses),
      deadlock: /deadlock/i.test(serializedResponses),
      timeout: /time(?:d out|out)/i.test(serializedResponses),
      unexpected500: responses.some((response) => response.status === 500),
    };

    console.log("[QA-RH-CONC-CANDIDATE-023 EVIDENCE]", {
      synchronization: "one uncoordinated pair via Promise.all",
      pairs: 1,
      requests: 2,
      http: responses.map(responseEvidence),
      responseDistribution: responses.reduce<Record<string, number>>(
        (distribution, response) => {
          const key = `${response.status}:${response.body?.code ?? "NO_CODE"}`;
          distribution[key] = (distribution[key] ?? 0) + 1;
          return distribution;
        },
        {}
      ),
      concurrencyErrorEvidence,
      lockInspection: {
        sourceReservationRows: "SELECT FOR UPDATE, one distinct source row per PATCH",
        destinationRoomRow: "no lock observed in update path",
        conflictingReservationRows: "availability SELECT without row lock",
        serializationLockSharedByBothRequests: "none observed",
        evidentiaryWeight: "inspection only; confirmation depends on PostgreSQL final state",
      },
      target: {
        habitacion_id: target.habitacion.id,
        fecha_entrada: TARGET_START,
        fecha_salida: TARGET_END,
      },
      finalReservations,
      activeOverlaps,
      ACTIVE_OVERLAP_COUNT: activeOverlaps.length,
    });

    // Única condición RED: PostgreSQL terminó con más de una reserva activa solapada.
    expect(activeOverlaps.length).toBeLessThanOrEqual(1);
  });
});
