import { QueryTypes } from "sequelize";
import request, { Response } from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app";
import { env } from "../../src/config/env";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const db = require("../../src/models");

const {
  Chofer,
  Vehiculo,
} = db;

type TransportReservationRow = {
  id: number;
  usuario_id: number;
  chofer_id: number | null;
  vehiculo_id: number | null;
  fecha_hora: string;
  estado: string;
};

const responseEvidence = (
  response: Response
) => ({
  status: response.status,
  code:
    response.body?.code ??
    null,
  id:
    response.body?.data?.id ??
    null,
  estado:
    response.body?.data?.estado ??
    null,
  chofer_id:
    response.body?.data
      ?.chofer_id ?? null,
  vehiculo_id:
    response.body?.data
      ?.vehiculo_id ?? null,
  fecha_hora:
    response.body?.data
      ?.fecha_hora ?? null,
  body: response.body,
});

describe(
  "QA-TR-CONC-CANDIDATE-041",
  () => {
    it(
      "QA-TR-CONC-CANDIDATE-041: CREATE concurrente no confirma traslados solapados con el mismo chofer o vehículo",
      async () => {
        const cliente =
          await createAuthenticatedUser({
            rol: ROLES.CLIENTE,
          });

        const chofer =
          await Chofer.create({
            nombre:
              "Chofer único QA 041",
            licencia:
              "QA-041",
            activo: true,
          });

        const vehiculo =
          await Vehiculo.create({
            tipo: "sedan",
            capacidad: 4,
            placa: "QA041",
          });

        const [resourceCounts] =
          await sequelize.query<{
            active_drivers: string;
            suitable_vehicles: string;
          }>(
            `
              SELECT
                (SELECT COUNT(*) FROM choferes WHERE activo = true)::text
                  AS active_drivers,
                (SELECT COUNT(*) FROM vehiculos WHERE capacidad >= 2)::text
                  AS suitable_vehicles;
            `,
            {
              type: QueryTypes.SELECT,
            }
          );

        expect(
          Number(
            resourceCounts.active_drivers
          )
        ).toBe(1);
        expect(
          Number(
            resourceCounts.suitable_vehicles
          )
        ).toBe(1);

        const targetDate =
          new Date(
            Date.now() +
              7 * 24 * 60 * 60 *
                1000
          );
        targetDate.setUTCSeconds(
          0,
          0
        );
        const fechaHora =
          targetDate
            .toISOString()
            .replace(
              ".000Z",
              "Z"
            );

        const payload = {
          origen:
            "Aeropuerto QA 041",
          destino:
            "Hotel QA 041",
          fecha_hora: fechaHora,
          numero_pasajeros: 2,
        };

        const createReservation = () =>
          request(app)
            .post(
              "/api/reservas-transporte"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send(payload);

        // El par inicial aislado fue seguro. La ventana sigue siendo plausible
        // porque disponibilidad se leyó antes de los locks y no se revalida;
        // ampliamos una sola vez al máximo acotado: 10 pares/20 requests.
        const responses =
          await Promise.all(
            Array.from(
              {
                length: 20,
              },
              () =>
                createReservation()
            )
          );

        const blockMs =
          env.TRANSPORT_BLOCK_MINUTES *
          60 *
          1000;
        const lowerBound =
          new Date(
            targetDate.getTime() -
              blockMs
          );
        const upperBound =
          new Date(
            targetDate.getTime() +
              blockMs
          );

        const finalRows =
          await sequelize.query<TransportReservationRow>(
            `
              SELECT
                id,
                usuario_id,
                chofer_id,
                vehiculo_id,
                fecha_hora::text AS fecha_hora,
                estado
              FROM reservas_transporte
              WHERE usuario_id = :usuarioId
                AND fecha_hora = CAST(:fechaHora AS timestamptz)
              ORDER BY id;
            `,
            {
              replacements: {
                usuarioId:
                  cliente.usuario.id,
                fechaHora,
              },
              type: QueryTypes.SELECT,
            }
          );

        // Misma definición de solape que producción: fecha_hora > target-bloque
        // y fecha_hora < target+bloque; solo estado confirmada bloquea recursos.
        const driverOverlaps =
          await sequelize.query<TransportReservationRow>(
            `
              SELECT
                id,
                usuario_id,
                chofer_id,
                vehiculo_id,
                fecha_hora::text AS fecha_hora,
                estado
              FROM reservas_transporte
              WHERE estado = 'confirmada'
                AND chofer_id = :choferId
                AND fecha_hora > CAST(:lowerBound AS timestamptz)
                AND fecha_hora < CAST(:upperBound AS timestamptz)
              ORDER BY id;
            `,
            {
              replacements: {
                choferId: chofer.id,
                lowerBound:
                  lowerBound.toISOString(),
                upperBound:
                  upperBound.toISOString(),
              },
              type: QueryTypes.SELECT,
            }
          );

        const vehicleOverlaps =
          await sequelize.query<TransportReservationRow>(
            `
              SELECT
                id,
                usuario_id,
                chofer_id,
                vehiculo_id,
                fecha_hora::text AS fecha_hora,
                estado
              FROM reservas_transporte
              WHERE estado = 'confirmada'
                AND vehiculo_id = :vehiculoId
                AND fecha_hora > CAST(:lowerBound AS timestamptz)
                AND fecha_hora < CAST(:upperBound AS timestamptz)
              ORDER BY id;
            `,
            {
              replacements: {
                vehiculoId:
                  vehiculo.id,
                lowerBound:
                  lowerBound.toISOString(),
                upperBound:
                  upperBound.toISOString(),
              },
              type: QueryTypes.SELECT,
            }
          );

        const serializedResponses =
          JSON.stringify(
            responses.map(
              responseEvidence
            )
          );
        const errors = {
          postgres40P01:
            /40P01/i.test(
              serializedResponses
            ),
          deadlock:
            /deadlock/i.test(
              serializedResponses
            ),
          timeout:
            /time(?:d out|out)/i.test(
              serializedResponses
            ),
          unexpected500:
            responses.some(
              (response) =>
                response.status ===
                500
            ),
        };

        console.log(
          "[QA-TR-CONC-CANDIDATE-041 EVIDENCE]",
          {
            flow:
              "POST /api/reservas-transporte (CREATE autoasigna)",
            synchronization:
              "one bounded batch (10 logical pairs) via one Promise.all",
            pairs: 10,
            requests: 20,
            date: fechaHora,
            interval: {
              blockMinutes:
                env.TRANSPORT_BLOCK_MINUTES,
              productionPredicate:
                "fecha_hora > target-block AND fecha_hora < target+block",
              lowerBound:
                lowerBound.toISOString(),
              upperBound:
                upperBound.toISOString(),
            },
            resources: {
              choferId: chofer.id,
              vehiculoId:
                vehiculo.id,
              activeDrivers:
                Number(
                  resourceCounts.active_drivers
                ),
              suitableVehicles:
                Number(
                  resourceCounts.suitable_vehicles
                ),
            },
            http:
              responses.map(
                responseEvidence
              ),
            responseDistribution:
              responses.reduce<
                Record<string, number>
              >(
                (
                  distribution,
                  response
                ) => {
                  const key = `${response.status}:${response.body?.code ?? "NO_CODE"}`;
                  distribution[key] =
                    (distribution[
                      key
                    ] ?? 0) + 1;
                  return distribution;
                },
                {}
              ),
            finalRows,
            driverOverlaps,
            vehicleOverlaps,
            DRIVER_OVERLAP_COUNT:
              driverOverlaps.length,
            VEHICLE_OVERLAP_COUNT:
              vehicleOverlaps.length,
            doubles: {
              driver:
                driverOverlaps.length >
                1,
              vehicle:
                vehicleOverlaps.length >
                1,
            },
            staticFlowInspection: {
              availabilityCheckBeforeLocks:
                "yes: getBlockedResourceIds SELECTs confirmed reservations without row lock",
              vehicleLock:
                "Vehiculo.findOne FOR UPDATE SKIP LOCKED",
              driverLock:
                "Chofer.findOne FOR UPDATE SKIP LOCKED",
              revalidationAfterLocks:
                "no",
            },
            errors,
          }
        );

        // Una respuesta pendiente o de conflicto para el perdedor es segura.
        for (const response of responses) {
          expect(
            [201, 409]
          ).toContain(
            response.status
          );
        }
        expect(
          errors.unexpected500
        ).toBe(false);

        // Condición RED: PostgreSQL no puede terminar con dos confirmadas
        // solapadas que compartan cualquiera de los recursos disputados.
        expect(
          driverOverlaps.length
        ).toBeLessThanOrEqual(1);
        expect(
          vehicleOverlaps.length
        ).toBeLessThanOrEqual(1);
      }
    );
  }
);
