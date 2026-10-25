import { QueryTypes } from "sequelize";
import request, { Response } from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

type WellnessAppointmentRow = {
  id: number;
  usuario_id: number;
  terapeuta_id: number;
  servicio_bienestar_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
};

const REQUESTS = 20;
const BUFFER_MINUTES = 15;
const TARGET_START = "10:00";

const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

const responseEvidence = (response: Response) => ({
  status: response.status,
  code: response.body?.code ?? null,
  id: response.body?.data?.id ?? null,
  estado: response.body?.data?.estado ?? null,
  body: response.body,
});

describe("QA-SPA-CONC-CANDIDATE-045", () => {
  it("QA-SPA-CONC-CANDIDATE-045: CREATE concurrente no confirma citas incompatibles para el mismo terapeuta", async () => {
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const adminAuthorization = `Bearer ${admin.token}`;
    const clientAuthorization = `Bearer ${cliente.token}`;

    const therapistResponse = await request(app)
      .post("/api/terapeutas")
      .set("Authorization", adminAuthorization)
      .send({
        nombre: "Terapeuta QA SPA CONC 045",
        activo: true,
      });
    expect(therapistResponse.status).toBe(201);
    const therapistId = Number(therapistResponse.body.data.id);

    const serviceResponse = await request(app)
      .post("/api/servicios-spa")
      .set("Authorization", adminAuthorization)
      .send({
        nombre: "Masaje QA SPA CONC 045",
        duracion_minutos: 60,
        precio: 350,
      });
    expect(serviceResponse.status).toBe(201);
    expect(Number(serviceResponse.body.data.precio)).toBe(350);
    const serviceId = Number(serviceResponse.body.data.id);

    const [persistedService] = await sequelize.query<{
      id: number;
      duracion_minutos: number;
      precio: string;
    }>(
      `
        SELECT id, duracion_minutos, precio::text AS precio
        FROM servicios_bienestar
        WHERE id = :serviceId;
      `,
      {
        replacements: { serviceId },
        type: QueryTypes.SELECT,
      }
    );
    expect(persistedService).toBeDefined();
    expect(Number(persistedService.precio)).toBe(350);

    const targetDateValue = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    const targetDate = targetDateValue.toISOString().slice(0, 10);
    const serviceDuration = Number(persistedService.duracion_minutos);
    const targetStartMinutes = 10 * 60;
    const targetEnd = minutesToTime(targetStartMinutes + serviceDuration);
    const blockedWindowStart = minutesToTime(
      Math.max(targetStartMinutes - BUFFER_MINUTES, 0)
    );
    const blockedWindowEnd = minutesToTime(
      targetStartMinutes + serviceDuration + BUFFER_MINUTES
    );
    const payload = {
      terapeuta_id: therapistId,
      servicio_bienestar_id: serviceId,
      fecha: targetDate,
      hora_inicio: TARGET_START,
    };

    const responses = await Promise.all(
      Array.from({ length: REQUESTS }, () =>
        request(app)
          .post("/api/citas-spa")
          .set("Authorization", clientAuthorization)
          .send(payload)
      )
    );

    // Misma semántica productiva: solo confirmada bloquea y el conflicto usa
    // inicio existente < fin nueva + 15 e inicioConBuffer < fin existente.
    const confirmedOverlaps = await sequelize.query<WellnessAppointmentRow>(
      `
        SELECT
          id,
          usuario_id,
          terapeuta_id,
          servicio_bienestar_id,
          fecha::text AS fecha,
          hora_inicio::text AS hora_inicio,
          hora_fin::text AS hora_fin,
          estado
        FROM citas_bienestar
        WHERE terapeuta_id = :therapistId
          AND fecha = CAST(:targetDate AS date)
          AND estado = 'confirmada'
          AND hora_inicio < CAST(:blockedWindowEnd AS time)
          AND hora_fin > CAST(:blockedWindowStart AS time)
        ORDER BY id;
      `,
      {
        replacements: {
          therapistId,
          targetDate,
          blockedWindowStart,
          blockedWindowEnd,
        },
        type: QueryTypes.SELECT,
      }
    );

    const responseDistribution = responses.reduce<Record<string, number>>(
      (distribution, response) => {
        const key = `${response.status}:${response.body?.code ?? "NO_CODE"}`;
        distribution[key] = (distribution[key] ?? 0) + 1;
        return distribution;
      },
      {}
    );
    const httpSummary = {
      created201: responses.filter((response) => response.status === 201).length,
      conflict409: responses.filter((response) => response.status === 409).length,
      other: responses.filter(
        (response) => response.status !== 201 && response.status !== 409
      ).length,
    };
    const serializedResponses = JSON.stringify(
      responses.map(responseEvidence)
    );
    const postgresErrors = {
      code40P01: /40P01/i.test(serializedResponses),
      deadlock: /deadlock/i.test(serializedResponses),
      serialization: /(?:40001|serializ)/i.test(serializedResponses),
      timeout: /time(?:d out|out)/i.test(serializedResponses),
    };
    const unexpected500 = responses.some((response) => response.status === 500);

    console.log("[QA-SPA-CONC-CANDIDATE-045 EVIDENCE]", {
      flow: "POST /api/citas-spa",
      synchronization: "one natural uncoordinated batch via Promise.all",
      requests: REQUESTS,
      clientId: Number(cliente.usuario.id),
      therapistId,
      serviceId,
      servicePrice: persistedService.precio,
      serviceDuration,
      bufferMinutes: BUFFER_MINUTES,
      target: {
        date: targetDate,
        start: `${TARGET_START}:00`,
        end: targetEnd,
        blockedWindowStart,
        blockedWindowEnd,
        productionPredicate:
          "estado = confirmada AND hora_inicio < blockedWindowEnd AND hora_fin > blockedWindowStart",
      },
      httpSummary,
      responseDistribution,
      http: responses.map(responseEvidence),
      postgresErrors,
      unexpected500,
      confirmedOverlaps,
      confirmedAppointmentIds: confirmedOverlaps.map((row) => Number(row.id)),
      CONFIRMED_OVERLAP_COUNT: confirmedOverlaps.length,
      MAX_ALLOWED: 1,
      DOUBLE_BOOKING: confirmedOverlaps.length > 1,
    });

    // Única condición RED: un 500 aislado no confirma este candidato; la
    // fuente de verdad es el estado final incompatible persistido en PostgreSQL.
    expect(confirmedOverlaps.length).toBeLessThanOrEqual(1);
  });
});
