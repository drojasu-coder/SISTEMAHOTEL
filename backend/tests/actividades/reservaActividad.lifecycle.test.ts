import {
  describe,
  expect,
  it,
} from "vitest";

import request
  from "supertest";

import app
  from "../../src/app";

import {
  ROLES,
} from "../../src/constants/roles";

import {
  createRecursoActividad,
} from "../fixtures/actividades";

import {
  createAuthenticatedUser,
} from "../helpers/auth";

const getHotelDatePlusDays = (
  days: number
) => {
  const timeZone =
    process.env.APP_TIMEZONE ||
    "America/Guatemala";

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const getPart = (
    type: string
  ) =>
    Number(
      parts.find(
        (part) =>
          part.type === type
      )?.value
    );

  const futureDate =
    new Date(
      Date.UTC(
        getPart("year"),
        getPart("month") - 1,
        getPart("day") + days
      )
    );

  return futureDate
    .toISOString()
    .slice(0, 10);
};

describe(
  "Ciclo de vida de ReservaActividad",
  () => {
    it(
      "QA-RA-FUNC-CANDIDATE-004: rechaza completar una reserva cuya actividad todavía no ha finalizado",
      async () => {
        const fecha =
          getHotelDatePlusDays(2);

        const horaInicio =
          "10:00";

        const horaFin =
          "11:00";

        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const created =
          await request(app)
            .post(
              "/api/reservas-actividad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              recurso_id:
                recurso.id,
              fecha,
              hora_inicio:
                horaInicio,
              hora_fin:
                horaFin,
              con_equipo:
                false,
            });

        expect(
          created.status,
          `Precondición inválida al crear reserva: ${JSON.stringify(created.body)}`
        ).toBe(201);

        const reservaId =
          created.body.data.id;

        const db =
          require(
            "../../src/models"
          );

        const {
          ReservaActividad,
        } = db;

        const initialPersisted =
          await ReservaActividad.findByPk(
            reservaId
          );

        expect(
          initialPersisted
        ).not.toBeNull();

        expect(
          initialPersisted.estado
        ).toBe("confirmada");

        const blockedBeforeAttempt =
          await request(app)
            .post(
              "/api/reservas-actividad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              recurso_id:
                recurso.id,
              fecha,
              hora_inicio:
                horaInicio,
              hora_fin:
                horaFin,
              con_equipo:
                false,
            });

        expect(
          blockedBeforeAttempt.status,
          `La reserva confirmada no bloqueó inicialmente el recurso: ${JSON.stringify(blockedBeforeAttempt.body)}`
        ).toBe(409);

        expect(
          blockedBeforeAttempt.body.code
        ).toBe(
          "RESOURCE_OVERLAP"
        );

        const completeAttempt =
          await request(app)
            .patch(
              `/api/reservas-actividad/${reservaId}/estado`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              estado:
                "completada",
            });

        const persistedAfterAttempt =
          await ReservaActividad.findByPk(
            reservaId
          );

        const blockedAfterAttempt =
          await request(app)
            .post(
              "/api/reservas-actividad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              recurso_id:
                recurso.id,
              fecha,
              hora_inicio:
                horaInicio,
              hora_fin:
                horaFin,
              con_equipo:
                false,
            });

        console.log(
          "[QA-RA-FUNC-CANDIDATE-004]",
          {
            reservationDate:
              fecha,
            startTime:
              horaInicio,
            endTime:
              horaFin,
            completeAttemptHttp:
              completeAttempt.status,
            completeAttemptCode:
              completeAttempt.body.code ??
              null,
            persistedStateAfterAttempt:
              persistedAfterAttempt?.estado ??
              null,
            resourceProbeHttp:
              blockedAfterAttempt.status,
            resourceProbeCode:
              blockedAfterAttempt.body.code ??
              null,
          }
        );

        expect.soft(
          completeAttempt.status,
          `Una actividad futura (${fecha} ${horaInicio}-${horaFin}) no puede completarse anticipadamente`
        ).toBe(409);

        expect.soft(
          completeAttempt.body.code
        ).toBe(
          "RESERVATION_NOT_FINISHED"
        );

        expect.soft(
          persistedAfterAttempt?.estado
        ).toBe(
          "confirmada"
        );

        expect.soft(
          blockedAfterAttempt.status,
          `El recurso debe seguir bloqueado por la reserva confirmada: ${JSON.stringify(blockedAfterAttempt.body)}`
        ).toBe(409);

        expect.soft(
          blockedAfterAttempt.body.code
        ).toBe(
          "RESOURCE_OVERLAP"
        );
      }
    );
  }
);
