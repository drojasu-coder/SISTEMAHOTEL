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
  createInstructor,
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

  return new Date(
    Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day") + days
    )
  )
    .toISOString()
    .slice(0, 10);
};

describe(
  "Ciclo de vida de InstructorActividad",
  () => {
    it(
      "QA-RA-FUNC-CANDIDATE-005: rechaza desactivar un instructor con una reserva futura confirmada",
      async () => {
        const fecha =
          getHotelDatePlusDays(2);

        const horaInicio =
          "10:00";

        const horaFin =
          "11:00";

        const instructor =
          await createInstructor({
            activo: true,
          });

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
              instructor_id:
                instructor.id,
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
          `Precondición inválida al crear la reserva: ${JSON.stringify(created.body)}`
        ).toBe(201);

        const reservaId =
          created.body.data.id;

        const db =
          require(
            "../../src/models"
          );

        const {
          Instructor,
          ReservaActividad,
        } = db;

        const initialInstructor =
          await Instructor.findByPk(
            instructor.id
          );

        const initialReservation =
          await ReservaActividad.findByPk(
            reservaId
          );

        expect(
          initialInstructor?.activo
        ).toBe(true);

        expect(
          initialReservation?.estado
        ).toBe("confirmada");

        expect(
          initialReservation?.instructor_id
        ).toBe(instructor.id);

        const deactivationAttempt =
          await request(app)
            .patch(
              `/api/instructores/${instructor.id}`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              activo: false,
            });

        const instructorAfterAttempt =
          await Instructor.findByPk(
            instructor.id
          );

        const reservationAfterAttempt =
          await ReservaActividad.findByPk(
            reservaId
          );

        const automaticCancellation =
          reservationAfterAttempt?.estado ===
          "cancelada";

        const automaticUnassign =
          reservationAfterAttempt?.instructor_id ==
          null;

        const automaticReassignment =
          reservationAfterAttempt?.instructor_id !=
            null &&
          reservationAfterAttempt.instructor_id !==
            instructor.id;

        const inactiveInstructorWithFutureConfirmedReservation =
          instructorAfterAttempt?.activo ===
            false &&
          reservationAfterAttempt?.estado ===
            "confirmada" &&
          reservationAfterAttempt?.instructor_id ===
            instructor.id;

        console.log(
          "[QA-RA-FUNC-CANDIDATE-005]",
          {
            approvedProductRule: {
              futureActiveReservationsBlockDeactivation:
                true,
              automaticReservationCancellation:
                false,
              historicalRelationsPreserved:
                true,
              inactiveInstructorAssignableToNewReservations:
                false,
            },
            instructorInitialState:
              initialInstructor?.activo,
            reservationInitialState:
              initialReservation?.estado,
            reservationInitialInstructor:
              initialReservation?.instructor_id,
            reservationDate:
              fecha,
            startTime:
              horaInicio,
            endTime:
              horaFin,
            isFuture:
              fecha >
              getHotelDatePlusDays(0),
            deactivationAttemptHttp:
              deactivationAttempt.status,
            deactivationAttemptCode:
              deactivationAttempt.body.code ??
              null,
            instructorStateAfterAttempt:
              instructorAfterAttempt?.activo,
            reservationStateAfterAttempt:
              reservationAfterAttempt?.estado,
            reservationInstructorAfterAttempt:
              reservationAfterAttempt?.instructor_id,
            automaticCancellation,
            automaticUnassign,
            automaticReassignment,
            inactiveInstructorWithFutureConfirmedReservation,
          }
        );

        expect.soft(
          deactivationAttempt.status,
          "Una reserva futura confirmada debe bloquear la desactivación del instructor"
        ).toBe(409);

        expect.soft(
          deactivationAttempt.body.code
        ).toBe(
          "INSTRUCTOR_HAS_FUTURE_RESERVATIONS"
        );

        expect.soft(
          instructorAfterAttempt?.activo,
          "El instructor debe continuar activo tras el intento rechazado"
        ).toBe(true);

        expect.soft(
          reservationAfterAttempt?.estado,
          "La desactivación no debe cancelar ni alterar silenciosamente la reserva"
        ).toBe("confirmada");

        expect.soft(
          reservationAfterAttempt?.instructor_id,
          "La desactivación no debe desasignar ni reasignar silenciosamente la reserva"
        ).toBe(instructor.id);

        /*
         * Alcance aprobado, documentado pero no ampliado en este RED:
         * reservas canceladas, completadas legítimamente e históricas finalizadas
         * no bloquean; un instructor inactivo no es asignable ni puede intervenir
         * en reactivaciones/reasignaciones; las relaciones históricas se preservan.
         */
      }
    );
  }
);
