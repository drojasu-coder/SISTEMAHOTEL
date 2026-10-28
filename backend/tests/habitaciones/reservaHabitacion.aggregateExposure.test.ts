import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const stripeMock = vi.hoisted(() => {
  type IntentState = {
    id: string;
    status: string;
    client_secret: string;
    amount: number;
    currency: string;
    metadata: Record<string, string>;
    idempotency_key?: string;
  };

  const intents = new Map<string, IntentState>();
  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => {
      const sequence = intents.size + 1;
      const id = `pi_rh_aggregate_020_${sequence}`;
      const intent: IntentState = {
        id,
        status: "requires_payment_method",
        client_secret: `${id}_secret_qa_local`,
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };

      intents.set(id, intent);
      return { ...intent };
    }
  );
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-RH-FIN-CANDIDATE-020`
      );
    });

  return {
    intents,
    createPaymentIntent,
    updatePaymentIntentMetadata: forbidden(
      "updatePaymentIntentMetadata"
    ),
    retrievePaymentIntent: forbidden(
      "retrievePaymentIntent"
    ),
    cancelPaymentIntent: forbidden(
      "cancelPaymentIntent"
    ),
    createRefund: forbidden("createRefund"),
    constructEvent: forbidden("constructEvent"),
  };
});

/**
 * Stripe queda reemplazado antes de importar app. Los PaymentIntents existen
 * solo en memoria y ninguna ruta de este archivo puede cargar el SDK real.
 */
vi.mock(
  "../../src/services/stripe.service",
  () => ({
    toStripeAmount: (
      amount: number | string,
      currency: string
    ) => {
      if (currency !== "GTQ") {
        throw new Error(
          `Moneda inesperada en mock Stripe: ${currency}`
        );
      }

      return Math.round(Number(amount) * 100);
    },
    stripeService: {
      createPaymentIntent:
        stripeMock.createPaymentIntent,
      updatePaymentIntentMetadata:
        stripeMock.updatePaymentIntentMetadata,
      retrievePaymentIntent:
        stripeMock.retrievePaymentIntent,
      cancelPaymentIntent:
        stripeMock.cancelPaymentIntent,
      createRefund: stripeMock.createRefund,
      constructEvent: stripeMock.constructEvent,
    },
  })
);

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
  "QA-RH-FIN-CANDIDATE-020: pago directo y carrito agregan exposición por ReservaHabitacion sin superar su total";

interface PersistedPayment {
  id: number;
  reserva_habitacion_id: number | null;
  carrito_id: number | null;
  monto: string;
  metodo: string;
  estado: string;
  id_transaccion_externo: string | null;
  approved_refunds: string;
}

interface PersistedReservation {
  id: number;
  estado: string;
  total: string;
}

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) /
  100;

const getAggregateExposure = async (
  reservationId: number
) => {
  const payments = await sequelize.query(
    `
      SELECT
        p.id,
        p.reserva_habitacion_id,
        p.carrito_id,
        p.monto::numeric(10, 2)::text AS monto,
        p.metodo,
        p.estado,
        p.id_transaccion_externo,
        COALESCE(r.approved_refunds, 0)::numeric(10, 2)::text
          AS approved_refunds
      FROM pagos p
      LEFT JOIN (
        SELECT
          pago_id,
          SUM(monto) AS approved_refunds
        FROM reembolsos
        WHERE estado = 'aprobado'
        GROUP BY pago_id
      ) r ON r.pago_id = p.id
      WHERE
        p.reserva_habitacion_id = :reservationId
        OR (
          p.carrito_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM carrito_items ci
            WHERE ci.carrito_id = p.carrito_id
              AND ci.tipo_item = 'habitacion'
              AND ci.referencia_id = :reservationId
          )
        )
      ORDER BY p.id ASC;
    `,
    {
      replacements: {
        reservationId,
      },
      type: QueryTypes.SELECT,
    }
  ) as PersistedPayment[];
  const approvedStates = new Set([
    "aprobado",
    "reembolsado_parcial",
    "reembolsado",
  ]);
  const approvedNet = round(
    payments.reduce(
      (sum, payment) =>
        approvedStates.has(payment.estado)
          ? sum +
            Math.max(
              0,
              Number(payment.monto) -
                Number(payment.approved_refunds)
            )
          : sum,
      0
    )
  );
  const processing = round(
    payments
      .filter(
        (payment) =>
          payment.estado === "procesando"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.monto),
        0
      )
  );

  return {
    payments,
    approvedNet,
    processing,
    totalActiveExposure: round(
      approvedNet + processing
    ),
  };
};

const getReservation = async (
  reservationId: number
) => {
  const rows = await sequelize.query(
    `
      SELECT
        id,
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

describe(
  "Exposición financiera agregada de ReservaHabitacion",
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
            .post("/api/reservas-habitacion")
            .set(
              "Authorization",
              authorization
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,
              fecha_entrada: "2035-07-10",
              fecha_salida: "2035-07-11",
              numero_huespedes: 1,
            });

        expect(reservationResponse.status).toBe(201);
        expect(
          reservationResponse.body.data.estado
        ).toBe("pendiente");
        expect(
          reservationResponse.body.data.total
        ).toBe("100.00");

        const reservationId = Number(
          reservationResponse.body.data.id
        );
        const directPaymentResponse =
          await request(app)
            .post("/api/pagos")
            .set(
              "Authorization",
              authorization
            )
            .send({
              reserva_habitacion_id:
                reservationId,
              monto: "100.00",
              metodo: "tarjeta",
              tipo_pago: "total",
              moneda: "GTQ",
              idempotency_key:
                "qa-rh-fin-candidate-020-direct",
            });

        expect(directPaymentResponse.status).toBe(201);
        expect(
          directPaymentResponse.body.data.estado
        ).toBe("procesando");
        expect(
          directPaymentResponse.body.data.monto
        ).toBe("100.00");

        const directPaymentId = Number(
          directPaymentResponse.body.data.pago_id
        );
        const exposureAfterDirect =
          await getAggregateExposure(
            reservationId
          );

        expect(exposureAfterDirect.approvedNet).toBe(0);
        expect(exposureAfterDirect.processing).toBe(100);
        expect(
          exposureAfterDirect.totalActiveExposure
        ).toBe(100);

        const cartResponse = await request(app)
          .post("/api/carritos")
          .set(
            "Authorization",
            authorization
          )
          .send({});

        expect(cartResponse.status).toBe(201);
        const cartId = Number(
          cartResponse.body.data.id
        );
        const addResponse = await request(app)
          .post(`/api/carritos/${cartId}/items`)
          .set(
            "Authorization",
            authorization
          )
          .send({
            tipo_item: "habitacion",
            referencia_id: reservationId,
          });

        let cartPaymentResponse: any = null;

        if (addResponse.status === 201) {
          cartPaymentResponse = await request(app)
            .post("/api/pagos")
            .set(
              "Authorization",
              authorization
            )
            .send({
              carrito_id: cartId,
              monto: "100.00",
              metodo: "tarjeta",
              tipo_pago: "total",
              moneda: "GTQ",
              idempotency_key:
                "qa-rh-fin-candidate-020-cart",
            });
        }

        const finalReservation =
          await getReservation(reservationId);
        const finalExposure =
          await getAggregateExposure(
            reservationId
          );
        const intents = [
          ...stripeMock.intents.values(),
        ];
        const activeIntentExposure = round(
          intents
            .filter((intent) =>
              [
                "requires_payment_method",
                "requires_confirmation",
                "requires_action",
                "processing",
                "succeeded",
              ].includes(intent.status)
            )
            .reduce(
              (sum, intent) =>
                sum + intent.amount / 100,
              0
            )
        );
        const unexpected500 = [
          reservationResponse,
          directPaymentResponse,
          cartResponse,
          addResponse,
          cartPaymentResponse,
        ].some(
          (response) => response?.status === 500
        );

        console.log(
          "[QA-RH-FIN-CANDIDATE-020]",
          JSON.stringify(
            {
              scenario: "A_DIRECTO_MAS_CARRITO",
              stripeMode: "FULL_LOCAL_MOCK",
              realStripeCalls: 0,
              reservation: {
                id: reservationId,
                total: finalReservation?.total ?? null,
                state:
                  finalReservation?.estado ?? null,
              },
              ids: {
                reservationId,
                cartId,
                directPaymentId,
                cartPaymentId:
                  cartPaymentResponse?.body.data
                    ?.pago_id ?? null,
              },
              http: {
                reservation: {
                  status:
                    reservationResponse.status,
                  code:
                    reservationResponse.body.code ??
                    null,
                },
                directPayment: {
                  status:
                    directPaymentResponse.status,
                  code:
                    directPaymentResponse.body.code ??
                    null,
                  state:
                    directPaymentResponse.body.data
                      ?.estado ?? null,
                  amount:
                    directPaymentResponse.body.data
                      ?.monto ?? null,
                },
                createCart: {
                  status: cartResponse.status,
                  code:
                    cartResponse.body.code ?? null,
                },
                addReservationToCart: {
                  status: addResponse.status,
                  code: addResponse.body.code ?? null,
                },
                cartPayment: cartPaymentResponse
                  ? {
                      status:
                        cartPaymentResponse.status,
                      code:
                        cartPaymentResponse.body.code ??
                        null,
                      state:
                        cartPaymentResponse.body.data
                          ?.estado ?? null,
                      amount:
                        cartPaymentResponse.body.data
                          ?.monto ?? null,
                    }
                  : "NOT_RUN_ADD_REJECTED",
                unexpected500,
              },
              exposureAfterDirect: {
                approvedNet:
                  exposureAfterDirect.approvedNet.toFixed(
                    2
                  ),
                processing:
                  exposureAfterDirect.processing.toFixed(
                    2
                  ),
                totalActive:
                  exposureAfterDirect.totalActiveExposure.toFixed(
                    2
                  ),
              },
              finalDatabase: {
                payments:
                  finalExposure.payments.map(
                    (payment) => payment
                  ),
                approvedNet:
                  finalExposure.approvedNet.toFixed(
                    2
                  ),
                processing:
                  finalExposure.processing.toFixed(
                    2
                  ),
                totalActiveExposure:
                  finalExposure.totalActiveExposure.toFixed(
                    2
                  ),
                maximumLegitimate: "100.00",
              },
              paymentIntents: {
                count: intents.length,
                activeExposure:
                  activeIntentExposure.toFixed(2),
                intents: intents.map((intent) => ({
                  id: intent.id,
                  status: intent.status,
                  amount: intent.amount,
                  amountGTQ: (
                    intent.amount / 100
                  ).toFixed(2),
                  metadata: intent.metadata,
                })),
              },
              expected: {
                rule:
                  "approved net + processing agregados por ReservaHabitacion.id entre origen directo y carritos no superan el total",
                safeOutcome:
                  "rechazar el segundo compromiso en add o pago, sin crear una segunda exposición activa",
                maximumActiveExposure: "100.00",
              },
            },
            null,
            2
          )
        );

        expect.soft(
          unexpected500,
          "El flujo negativo no debe producir HTTP 500"
        ).toBe(false);
        expect.soft(
          finalExposure.totalActiveExposure,
          "La exposición aprobada neta más procesando, agregada entre pago directo y carritos para la misma ReservaHabitacion, no debe superar Q100.00"
        ).toBeLessThanOrEqual(100);
        expect.soft(
          activeIntentExposure,
          "Los PaymentIntents locales activos de la misma reserva no deben autorizar más de Q100.00"
        ).toBeLessThanOrEqual(100);

        expect(
          stripeMock.updatePaymentIntentMetadata
        ).not.toHaveBeenCalled();
        /**
         * La reconciliación previa al cobro (BE-014, posterior a este caso)
         * consulta en modo lectura los intentos ya existentes de la reserva.
         * Aquí el mock falla en cada consulta (Stripe no disponible): solo se
         * admite consultar intentos propios y el fallo debe conservar la
         * exposición (pago directo sigue "procesando", carrito rechazado 409).
         */
        const knownIntentIds = intents.map((intent) => intent.id);
        for (const [intentId] of stripeMock.retrievePaymentIntent.mock.calls as unknown as [string][]) {
          expect(knownIntentIds).toContain(intentId);
        }
        expect(cartPaymentResponse?.status).toBe(409);
        expect(
          finalExposure.payments.filter(
            (payment: any) => payment.estado === "procesando"
          )
        ).toHaveLength(1);
        expect(
          stripeMock.cancelPaymentIntent
        ).not.toHaveBeenCalled();
        expect(
          stripeMock.createRefund
        ).not.toHaveBeenCalled();
        expect(
          stripeMock.constructEvent
        ).not.toHaveBeenCalled();
      },
      30000
    );
  }
);
