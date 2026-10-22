import {
  describe,
  expect,
  it,
} from "vitest";
import {
  QueryTypes,
} from "sequelize";
import request from "supertest";

import app from "../../src/app";
import {
  ROLES,
} from "../../src/constants/roles";
import {
  createHotelFixture,
} from "../fixtures/hotel";
import {
  createAuthenticatedUser,
} from "../helpers/auth";
import {
  sequelize,
} from "../helpers/db";

const TEST_NAME =
  "QA-RH-AUTH-CANDIDATE-019: cliente no puede autoaprobar un pago directo en efectivo";

interface PersistedReservation {
  id: number;
  usuario_id: number;
  estado: string;
  total: string;
}

interface PersistedPayment {
  id: number;
  reserva_habitacion_id: number;
  monto: string;
  metodo: string;
  estado: string;
  fecha_pago: Date | string | null;
}

interface FinancialState {
  approved: string;
  net_approved: string;
}

const getReservation = async (
  reservationId: number
) => {
  const rows =
    await sequelize.query(
      `
        SELECT
          id,
          usuario_id,
          estado,
          total::numeric(10, 2)::text AS total
        FROM reservas_habitacion
        WHERE id = :reservationId;
      `,
      {
        replacements: {
          reservationId,
        },
        type: QueryTypes.SELECT,
      }
    ) as PersistedReservation[];

  return rows[0] ?? null;
};

const getPayments = async (
  reservationId: number
) =>
  await sequelize.query(
    `
      SELECT
        id,
        reserva_habitacion_id,
        monto::numeric(10, 2)::text AS monto,
        metodo,
        estado,
        fecha_pago
      FROM pagos
      WHERE reserva_habitacion_id = :reservationId
      ORDER BY id ASC;
    `,
    {
      replacements: {
        reservationId,
      },
      type: QueryTypes.SELECT,
    }
  ) as PersistedPayment[];

const getFinancialState = async (
  reservationId: number
) => {
  const rows =
    await sequelize.query(
      `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN p.estado IN (
                  'aprobado',
                  'reembolsado_parcial',
                  'reembolsado'
                )
                THEN p.monto
                ELSE 0
              END
            ),
            0
          )::numeric(10, 2)::text AS approved,
          COALESCE(
            SUM(
              CASE
                WHEN p.estado IN (
                  'aprobado',
                  'reembolsado_parcial',
                  'reembolsado'
                )
                THEN GREATEST(
                  p.monto - COALESCE(r.approved_refunds, 0),
                  0
                )
                ELSE 0
              END
            ),
            0
          )::numeric(10, 2)::text AS net_approved
        FROM pagos p
        LEFT JOIN (
          SELECT
            pago_id,
            SUM(monto) AS approved_refunds
          FROM reembolsos
          WHERE estado = 'aprobado'
          GROUP BY pago_id
        ) r ON r.pago_id = p.id
        WHERE p.reserva_habitacion_id = :reservationId;
      `,
      {
        replacements: {
          reservationId,
        },
        type: QueryTypes.SELECT,
      }
    ) as FinancialState[];

  return rows[0];
};

describe(
  "Autorización de pago directo en efectivo de ReservaHabitacion",
  () => {
    it(
      TEST_NAME,
      async () => {
        const cliente =
          await createAuthenticatedUser({
            rol: ROLES.CLIENTE,
          });
        const hotel =
          await createHotelFixture({
            capacidad: 2,
            tarifa: 100,
          });
        const authorization =
          `Bearer ${cliente.token}`;

        const reservationResponse =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              authorization
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,
              fecha_entrada:
                "2035-06-10",
              fecha_salida:
                "2035-06-11",
              numero_huespedes: 1,
            });

        expect(
          reservationResponse.status
        ).toBe(201);

        const reservationId =
          Number(
            reservationResponse.body.data.id
          );
        const reservationBefore =
          await getReservation(
            reservationId
          );
        const financialBefore =
          await getFinancialState(
            reservationId
          );

        expect(
          reservationResponse.body.data.usuario_id
        ).toBe(cliente.usuario.id);
        expect(
          reservationResponse.body.data.estado
        ).toBe("pendiente");
        expect(
          reservationResponse.body.data.total
        ).toBe("100.00");
        expect(
          reservationBefore
        ).not.toBeNull();
        expect(
          reservationBefore?.usuario_id
        ).toBe(cliente.usuario.id);
        expect(
          reservationBefore?.estado
        ).toBe("pendiente");
        expect(
          reservationBefore?.total
        ).toBe("100.00");
        expect(
          financialBefore.approved
        ).toBe("0.00");
        expect(
          financialBefore.net_approved
        ).toBe("0.00");

        const paymentResponse =
          await request(app)
            .post("/api/pagos")
            .set(
              "Authorization",
              authorization
            )
            .send({
              reserva_habitacion_id:
                reservationId,
              monto: 100,
              metodo: "efectivo",
              tipo_pago: "total",
              moneda: "GTQ",
              idempotency_key:
                "qa-rh-auth-candidate-019-cash",
            });

        const persistedPayments =
          await getPayments(
            reservationId
          );
        const persistedPayment =
          persistedPayments[0] ?? null;
        const reservationAfter =
          await getReservation(
            reservationId
          );
        const financialAfter =
          await getFinancialState(
            reservationId
          );
        const adminApprovalInvolved =
          false;
        const clientSelfApprovedCashPayment =
          paymentResponse.status === 201 &&
          persistedPayments.length === 1 &&
          persistedPayment?.metodo ===
            "efectivo" &&
          persistedPayment.estado ===
            "aprobado" &&
          persistedPayment.monto ===
            "100.00" &&
          persistedPayment.fecha_pago !==
            null &&
          !adminApprovalInvolved;
        const authorizationViolation =
          clientSelfApprovedCashPayment;
        const controlledAuthorizationOutcome =
          paymentResponse.status === 403 ||
          (
            persistedPayments.length === 1 &&
            persistedPayment?.estado ===
              "pendiente"
          );

        console.log(
          "[QA-RH-AUTH-CANDIDATE-019]",
          JSON.stringify(
            {
              database:
                "hotel_test_db",
              authenticatedRole:
                "cliente",
              reservationOwnership:
                "OWN",
              reservationInitialState:
                reservationBefore?.estado ??
                null,
              reservationTotal:
                reservationBefore?.total ??
                null,
              approvedBefore:
                financialBefore.approved,
              netApprovedBefore:
                financialBefore.net_approved,
              requestMethod:
                "efectivo",
              paymentAttempt: {
                http:
                  paymentResponse.status,
                code:
                  paymentResponse.body.code ??
                  null,
              },
              paymentPersisted:
                persistedPayment !== null,
              paymentMethod:
                persistedPayment?.metodo ??
                null,
              paymentState:
                persistedPayment?.estado ??
                null,
              paymentAmount:
                persistedPayment?.monto ??
                null,
              paymentDate:
                persistedPayment?.fecha_pago
                  ? new Date(
                      persistedPayment.fecha_pago
                    ).toISOString()
                  : null,
              reservationStateAfter:
                reservationAfter?.estado ??
                null,
              approvedAfter:
                financialAfter.approved,
              netApprovedAfter:
                financialAfter.net_approved,
              adminApprovalInvolved,
              clientSelfApprovedCashPayment,
              authorizationViolation,
              realStripeCharges: false,
            },
            null,
            2
          )
        );

        expect.soft(
          controlledAuthorizationOutcome,
          "El cliente debe recibir HTTP 403 o dejar el pago en pendiente de aprobación administrativa"
        ).toBe(true);
        expect.soft(
          financialAfter.approved,
          "El intento del cliente no debe producir dinero aprobado"
        ).toBe("0.00");
        expect.soft(
          financialAfter.net_approved,
          "El intento del cliente no debe producir dinero neto aprobado"
        ).toBe("0.00");
        expect.soft(
          reservationAfter?.estado,
          "La reserva no debe confirmarse financieramente por efectivo autodeclarado"
        ).toBe("pendiente");
        expect.soft(
          clientSelfApprovedCashPayment
        ).toBe(false);
        expect.soft(
          authorizationViolation
        ).toBe(false);
      },
      30000
    );
  }
);
