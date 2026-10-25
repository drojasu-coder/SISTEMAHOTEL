import {
  describe,
  expect,
  it,
} from "vitest";

import request
  from "supertest";
import {
  QueryTypes,
} from "sequelize";

import app
  from "../../src/app";
import {
  ROLES,
} from "../../src/constants/roles";

import {
  createAuthenticatedUser,
} from "../helpers/auth";
import {
  sequelize,
} from "../helpers/db";

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

interface AppointmentRow {
  id: number;
  usuario_id: number;
  terapeuta_id: number;
  servicio_bienestar_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

describe(
  "Reactivación de CitaBienestar y traslape de terapeuta",
  () => {
    it(
      "QA-SPA-FUNC-CANDIDATE-048: rechaza reactivar una cita cancelada si el terapeuta ya tiene una cita confirmada incompatible",
      async () => {
        const serviceDuration =
          60;
        const bufferMinutes =
          15;
        const targetDate =
          getHotelDatePlusDays(30);
        const targetStart =
          "10:00";
        const targetEnd =
          "11:00";

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

        const therapistCreated =
          await request(app)
            .post(
              "/api/terapeutas"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              nombre:
                "Terapeuta QA Reactivación 048",
              activo:
                true,
            });

        expect(
          therapistCreated.status,
          `Precondición inválida al crear terapeuta: ${JSON.stringify(therapistCreated.body)}`
        ).toBe(201);

        const therapistId =
          therapistCreated.body.data.id as number;

        const serviceCreated =
          await request(app)
            .post(
              "/api/servicios-spa"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              nombre:
                "Servicio QA Reactivación 048",
              duracion_minutos:
                serviceDuration,
              precio:
                275.5,
            });

        expect(
          serviceCreated.status,
          `Precondición inválida al crear servicio: ${JSON.stringify(serviceCreated.body)}`
        ).toBe(201);

        const serviceId =
          serviceCreated.body.data.id as number;

        const appointmentPayload = {
          terapeuta_id:
            therapistId,
          servicio_bienestar_id:
            serviceId,
          fecha:
            targetDate,
          hora_inicio:
            targetStart,
        };

        const appointmentACreated =
          await request(app)
            .post(
              "/api/citas-spa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send(
              appointmentPayload
            );

        expect(
          appointmentACreated.status,
          `Precondición inválida al crear cita A: ${JSON.stringify(appointmentACreated.body)}`
        ).toBe(201);

        const appointmentAId =
          appointmentACreated.body.data.id as number;

        const [appointmentABeforeCancel] =
          await sequelize.query<AppointmentRow>(
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
              WHERE id = :appointmentAId;
            `,
            {
              replacements: {
                appointmentAId,
              },
              type:
                QueryTypes.SELECT,
            }
          );

        expect(
          appointmentABeforeCancel?.estado
        ).toBe("confirmada");
        expect(
          appointmentABeforeCancel?.hora_fin
        ).toBe("11:00:00");

        const appointmentACancelled =
          await request(app)
            .patch(
              `/api/citas-spa/${appointmentAId}/estado`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              estado:
                "cancelada",
            });

        expect(
          appointmentACancelled.status,
          `Precondición inválida al cancelar cita A: ${JSON.stringify(appointmentACancelled.body)}`
        ).toBe(200);

        const [appointmentAAfterCancel] =
          await sequelize.query<AppointmentRow>(
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
              WHERE id = :appointmentAId;
            `,
            {
              replacements: {
                appointmentAId,
              },
              type:
                QueryTypes.SELECT,
            }
          );

        expect(
          appointmentAAfterCancel?.estado
        ).toBe("cancelada");

        const appointmentBCreated =
          await request(app)
            .post(
              "/api/citas-spa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send(
              appointmentPayload
            );

        expect(
          appointmentBCreated.status,
          `Precondición inválida al crear cita B después de cancelar A: ${JSON.stringify(appointmentBCreated.body)}`
        ).toBe(201);

        const appointmentBId =
          appointmentBCreated.body.data.id as number;

        const [appointmentBBeforeReactivation] =
          await sequelize.query<AppointmentRow>(
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
              WHERE id = :appointmentBId;
            `,
            {
              replacements: {
                appointmentBId,
              },
              type:
                QueryTypes.SELECT,
            }
          );

        expect(
          appointmentBBeforeReactivation?.estado
        ).toBe("confirmada");

        const reactivationAttempt =
          await request(app)
            .patch(
              `/api/citas-spa/${appointmentAId}/estado`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              estado:
                "confirmada",
            });

        const finalAppointments =
          await sequelize.query<AppointmentRow>(
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
              WHERE id IN (
                :appointmentAId,
                :appointmentBId
              )
              ORDER BY id;
            `,
            {
              replacements: {
                appointmentAId,
                appointmentBId,
              },
              type:
                QueryTypes.SELECT,
            }
          );

        const confirmedOverlaps =
          await sequelize.query<AppointmentRow>(
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
                AND fecha = :targetDate
                AND estado = 'confirmada'
                AND hora_inicio < TIME '11:15:00'
                AND hora_fin > TIME '09:45:00'
              ORDER BY id;
            `,
            {
              replacements: {
                therapistId,
                targetDate,
              },
              type:
                QueryTypes.SELECT,
            }
          );

        const finalA =
          finalAppointments.find(
            (appointment) =>
              appointment.id ===
              appointmentAId
          );
        const finalB =
          finalAppointments.find(
            (appointment) =>
              appointment.id ===
              appointmentBId
          );
        const confirmedIds =
          confirmedOverlaps.map(
            (appointment) =>
              appointment.id
          );
        const relevantStatuses = [
          appointmentACreated.status,
          appointmentACancelled.status,
          appointmentBCreated.status,
          reactivationAttempt.status,
        ];
        const unexpected500 =
          relevantStatuses.some(
            (status) =>
              status >= 500
          );

        console.log(
          "[QA-SPA-FUNC-CANDIDATE-048]",
          {
            database:
              "hotel_test_db",
            clientId:
              Number(cliente.usuario.id),
            adminId:
              Number(admin.usuario.id),
            therapistId,
            serviceId,
            serviceDuration,
            bufferMinutes,
            targetDate,
            targetStart,
            targetEnd,
            appointmentAId,
            appointmentACreateHttp:
              appointmentACreated.status,
            appointmentACreateCode:
              appointmentACreated.body.code ??
              null,
            appointmentAStateBeforeCancel:
              appointmentABeforeCancel?.estado ??
              null,
            appointmentACancelHttp:
              appointmentACancelled.status,
            appointmentACancelCode:
              appointmentACancelled.body.code ??
              null,
            appointmentAStateAfterCancel:
              appointmentAAfterCancel?.estado ??
              null,
            appointmentBId,
            appointmentBCreateHttp:
              appointmentBCreated.status,
            appointmentBCreateCode:
              appointmentBCreated.body.code ??
              null,
            appointmentBState:
              appointmentBBeforeReactivation?.estado ??
              null,
            reactivationHttp:
              reactivationAttempt.status,
            reactivationCode:
              reactivationAttempt.body.code ??
              null,
            appointmentAStateAfterReactivation:
              finalA?.estado ??
              null,
            appointmentBStateAfterReactivation:
              finalB?.estado ??
              null,
            confirmedOverlapCount:
              confirmedOverlaps.length,
            confirmedIds,
            finalDatabaseRows:
              finalAppointments,
            confirmedOverlapRows:
              confirmedOverlaps,
            citaLockInUpdateStatus:
              true,
            therapistLockInUpdateStatus:
              false,
            overlapCheckInUpdateStatus:
              false,
            unexpected500,
          }
        );

        expect.soft(
          unexpected500,
          "Los endpoints del escenario no deben devolver errores 500"
        ).toBe(false);

        expect.soft(
          reactivationAttempt.status,
          `Reactivar A debe rechazarse porque B ya confirma la misma ventana: ${JSON.stringify(reactivationAttempt.body)}`
        ).toBe(409);

        expect.soft(
          reactivationAttempt.body.code
        ).toBe(
          "THERAPIST_BUSY_OR_BUFFER"
        );

        expect.soft(
          finalA?.estado,
          "La cita A debe permanecer cancelada tras una reactivación incompatible"
        ).toBe("cancelada");

        expect.soft(
          finalB?.estado,
          "La cita B confirmada no debe cambiar"
        ).toBe("confirmada");

        expect.soft(
          confirmedOverlaps.length,
          `PostgreSQL encontró citas confirmadas incompatibles: ${JSON.stringify(confirmedOverlaps)}`
        ).toBe(1);

        expect.soft(
          confirmedIds
        ).toEqual([
          appointmentBId,
        ]);
      }
    );
  }
);
