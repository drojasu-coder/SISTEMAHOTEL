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
      if (intents.size !== 0) {
        throw new Error(
          "createPaymentIntent recibió más de una llamada en QA-PAY-FIN-CANDIDATE-013"
        );
      }

      const intent: IntentState = {
        id: "pi_crosscart_001",
        status: "requires_payment_method",
        client_secret:
          "pi_crosscart_001_secret_qa_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata,
        idempotency_key: idempotencyKey,
      };

      intents.set(intent.id, intent);
      return { ...intent };
    }
  );

  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-PAY-FIN-CANDIDATE-013`
      );
    });

  return {
    intents,
    createPaymentIntent,
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
 * Mock completo y local: stripe.service.ts y el SDK real de Stripe no se
 * evalúan. El único PaymentIntent existe exclusivamente en memoria.
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
          "Moneda inesperada en mock Stripe QA"
        );
      }

      return Math.round(Number(amount) * 100);
    },
    stripeService: {
      createPaymentIntent:
        stripeMock.createPaymentIntent,
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
  Op,
} from "sequelize";
import request from "supertest";

import app from "../../src/app";
import {
  ROLES,
} from "../../src/constants/roles";
import {
  processStripeWebhook,
} from "../../src/services/pago.service";
import {
  createRecursoActividad,
} from "../fixtures/actividades";
import {
  createAuthenticatedUser,
} from "../helpers/auth";

const db = require("../../src/models");

const {
  Carrito,
  CarritoItem,
  Pago,
  Reembolso,
  ReservaActividad,
} = db;

const TEST_NAME =
  "QA-PAY-FIN-CANDIDATE-013: rechaza reutilizar una actividad con pago Stripe procesando en un carrito expirado";

const approvedMoneyStates = new Set([
  "aprobado",
  "reembolsado_parcial",
  "reembolsado",
]);

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) /
  100;

const financialSnapshot = async (
  cartIds: number[]
) => {
  const payments =
    cartIds.length === 0
      ? []
      : await Pago.findAll({
          where: {
            carrito_id: {
              [Op.in]: cartIds,
            },
          },
          order: [["id", "ASC"]],
        });
  const paymentIds = payments.map((payment: any) =>
    Number(payment.id)
  );
  const refunds =
    paymentIds.length === 0
      ? []
      : await Reembolso.findAll({
          where: {
            pago_id: {
              [Op.in]: paymentIds,
            },
          },
          order: [["id", "ASC"]],
        });

  const approvedNet = round(
    payments.reduce((sum: number, payment: any) => {
      if (!approvedMoneyStates.has(payment.estado)) {
        return sum;
      }

      const approvedRefunds = refunds
        .filter(
          (refund: any) =>
            Number(refund.pago_id) ===
              Number(payment.id) &&
            refund.estado === "aprobado"
        )
        .reduce(
          (refunded: number, refund: any) =>
            refunded + Number(refund.monto),
          0
        );

      return (
        sum +
        Math.max(
          0,
          Number(payment.monto) - approvedRefunds
        )
      );
    }, 0)
  );
  const processing = round(
    payments
      .filter(
        (payment: any) =>
          payment.estado === "procesando"
      )
      .reduce(
        (sum: number, payment: any) =>
          sum + Number(payment.monto),
        0
      )
  );

  return {
    payments,
    refunds,
    approvedNet,
    processing,
    // El PI del pago procesando ya está representado aquí; no se suma otra vez.
    totalActiveExposure: round(
      approvedNet + processing
    ),
  };
};

describe(
  "Exposición cross-cart de pago de actividad procesando",
  () => {
    it(
      TEST_NAME,
      async () => {
        const cliente =
          await createAuthenticatedUser({
            rol: ROLES.CLIENTE,
          });
        const recurso =
          await createRecursoActividad({
            precio_hora: "100.00",
          });

        const reservaResponse = await request(app)
          .post("/api/reservas-actividad")
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            recurso_id: recurso.id,
            fecha: "2027-06-10",
            hora_inicio: "10:00",
            hora_fin: "11:00",
            con_equipo: false,
          });

        expect(reservaResponse.status).toBe(201);
        expect(reservaResponse.body.data.total).toBe(
          "100.00"
        );

        const reservaId = Number(
          reservaResponse.body.data.id
        );
        const reservaInicial =
          await ReservaActividad.findByPk(reservaId);

        expect(reservaInicial).not.toBeNull();
        expect(reservaInicial.total).toBe("100.00");

        const cartAResponse = await request(app)
          .post("/api/carritos")
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({});

        expect(cartAResponse.status).toBe(201);
        const cartAId = Number(
          cartAResponse.body.data.id
        );

        const addAResponse = await request(app)
          .post(`/api/carritos/${cartAId}/items`)
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            tipo_item: "actividad",
            referencia_id: reservaId,
          });

        expect(addAResponse.status).toBe(201);
        expect(addAResponse.body.data.precio).toBe(
          "100.00"
        );

        const paymentAResponse = await request(app)
          .post("/api/pagos")
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            carrito_id: cartAId,
            monto: "100.00",
            metodo: "tarjeta",
            tipo_pago: "total",
            moneda: "GTQ",
          });

        expect(paymentAResponse.status).toBe(201);
        expect(paymentAResponse.body.data.estado).toBe(
          "procesando"
        );
        expect(
          paymentAResponse.body.data.payment_intent_id
        ).toBe("pi_crosscart_001");
        expect(
          stripeMock.createPaymentIntent
        ).toHaveBeenCalledTimes(1);

        const paymentAId = Number(
          paymentAResponse.body.data.pago_id
        );
        const beforeB = await financialSnapshot([
          cartAId,
        ]);
        const paymentABeforeB = await Pago.findByPk(
          paymentAId
        );

        expect(paymentABeforeB).not.toBeNull();
        expect(paymentABeforeB.estado).toBe(
          "procesando"
        );
        expect(paymentABeforeB.monto).toBe("100.00");
        expect(
          paymentABeforeB.id_transaccion_externo
        ).toBe("pi_crosscart_001");
        expect(beforeB.approvedNet).toBe(0);
        expect(beforeB.processing).toBe(100);
        expect(beforeB.totalActiveExposure).toBe(100);

        const cartABeforeExpiration =
          await Carrito.findByPk(cartAId);
        expect(cartABeforeExpiration).not.toBeNull();

        await cartABeforeExpiration.update({
          expira_en: new Date(Date.now() - 60_000),
        });

        const cartBResponse = await request(app)
          .post("/api/carritos")
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({});

        expect(cartBResponse.status).toBe(201);
        const cartBId = Number(
          cartBResponse.body.data.id
        );
        const cartAAfterExpiration =
          await Carrito.findByPk(cartAId);
        const itemAAfterExpiration =
          await CarritoItem.findOne({
            where: {
              carrito_id: cartAId,
              tipo_item: "actividad",
              referencia_id: reservaId,
            },
          });
        const paymentAAfterExpiration =
          await Pago.findByPk(paymentAId);

        expect(cartAAfterExpiration.estado).toBe(
          "expirado"
        );
        expect(itemAAfterExpiration).not.toBeNull();
        expect(paymentAAfterExpiration).not.toBeNull();
        expect(paymentAAfterExpiration.estado).toBe(
          "procesando"
        );
        expect(
          paymentAAfterExpiration.id_transaccion_externo
        ).toBe("pi_crosscart_001");
        expect(
          stripeMock.intents.has("pi_crosscart_001")
        ).toBe(true);

        const addBResponse = await request(app)
          .post(`/api/carritos/${cartBId}/items`)
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            tipo_item: "actividad",
            referencia_id: reservaId,
          });

        let paymentBResponse: any = null;

        if (addBResponse.status === 201) {
          paymentBResponse = await request(app)
            .post("/api/pagos")
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              carrito_id: cartBId,
              monto: "100.00",
              metodo: "efectivo",
              tipo_pago: "total",
              moneda: "GTQ",
              idempotency_key:
                "qa-pay-fin-candidate-013-b",
            });
        }

        const paymentBId = paymentBResponse?.body.data?.id
          ? Number(paymentBResponse.body.data.id)
          : null;
        const paymentBAfterApi = paymentBId
          ? await Pago.findByPk(paymentBId)
          : null;
        const paymentBApproved =
          paymentBResponse?.status === 201 &&
          paymentBResponse.body.data?.estado ===
            "aprobado" &&
          paymentBAfterApi?.estado === "aprobado" &&
          Number(paymentBAfterApi?.monto) === 100;

        const intent = stripeMock.intents.get(
          "pi_crosscart_001"
        );
        expect(intent).toBeDefined();
        intent!.status = "succeeded";

        const webhookObject = {
          id: intent!.id,
          status: intent!.status,
          amount: 10000,
          currency: "gtq",
          metadata: {
            pago_id: String(paymentAId),
          },
        };
        let webhookOutcome: Record<string, unknown>;

        try {
          const result = await processStripeWebhook(
            webhookObject,
            "payment_intent.succeeded"
          );
          webhookOutcome = {
            result: "RETURNED",
            paymentId: result?.id ?? null,
            paymentState: result?.estado ?? null,
          };
        } catch (error: any) {
          webhookOutcome = {
            result: "THREW",
            name: error?.name ?? null,
            statusCode: error?.statusCode ?? null,
            code: error?.code ?? null,
            message: error?.message ?? String(error),
          };
        }

        const finalCartA = await Carrito.findByPk(
          cartAId
        );
        const finalCartB = await Carrito.findByPk(
          cartBId
        );
        const finalReserva =
          await ReservaActividad.findByPk(reservaId);
        const finalItems = await CarritoItem.findAll({
          where: {
            tipo_item: "actividad",
            referencia_id: reservaId,
          },
          order: [["id", "ASC"]],
        });
        const referenceCartIds = [
          ...new Set<number>(
            finalItems.map((item: any) =>
              Number(item.carrito_id)
            )
          ),
        ];
        const finalFinancial = await financialSnapshot(
          referenceCartIds
        );
        const finalPaymentA =
          finalFinancial.payments.find(
            (payment: any) =>
              Number(payment.id) === paymentAId
          ) ?? null;
        const finalItemB = finalItems.find(
          (item: any) =>
            Number(item.carrito_id) === cartBId
        );
        const externalSucceededExposure =
          intent!.status === "succeeded"
            ? round(intent!.amount / 100)
            : 0;
        const externalLocalDivergence =
          intent!.status === "succeeded" &&
          !approvedMoneyStates.has(
            finalPaymentA?.estado ?? ""
          );
        const secondPaymentResult = paymentBResponse
          ? `HTTP ${paymentBResponse.status} ${paymentBResponse.body.data?.estado ?? paymentBResponse.body.code ?? "NO_STATE"} Q${paymentBResponse.body.data?.monto ?? "NO_AMOUNT"}`
          : "NOT RUN";

        console.log(
          "[QA-PAY-FIN-CANDIDATE-013]",
          JSON.stringify(
            {
              stripeMode: "FULL_LOCAL_MOCK",
              realStripeCalls: 0,
              invariant:
                "Una actividad con Q100 procesando en Stripe no puede reutilizarse en otro carrito ni superar Q100 de exposición activa",
              beforeCartB: {
                approvedNet:
                  beforeB.approvedNet.toFixed(2),
                processing:
                  beforeB.processing.toFixed(2),
                totalActiveExposure:
                  beforeB.totalActiveExposure.toFixed(2),
                paymentA:
                  paymentABeforeB.toJSON(),
              },
              expirationSetup: {
                changedFieldOnly: "expira_en",
                cartA:
                  cartAAfterExpiration.toJSON(),
                itemAPreserved:
                  itemAAfterExpiration.toJSON(),
                paymentAPreserved:
                  paymentAAfterExpiration.toJSON(),
                externalIntentPreserved:
                  stripeMock.intents.has(
                    "pi_crosscart_001"
                  ),
              },
              http: {
                addA: {
                  status: addAResponse.status,
                  body: addAResponse.body,
                },
                paymentA: {
                  status: paymentAResponse.status,
                  body: paymentAResponse.body,
                },
                createCartB: {
                  status: cartBResponse.status,
                  body: cartBResponse.body,
                },
                addB: {
                  status: addBResponse.status,
                  body: addBResponse.body,
                },
                paymentB: paymentBResponse
                  ? {
                      status: paymentBResponse.status,
                      body: paymentBResponse.body,
                    }
                  : "NOT RUN",
              },
              paymentBApproved,
              externalIntent: {
                id: intent!.id,
                status: intent!.status,
                amount: intent!.amount,
                currency: intent!.currency,
                externalSucceededExposure:
                  externalSucceededExposure.toFixed(2),
              },
              webhook: {
                eventType:
                  "payment_intent.succeeded",
                object: webhookObject,
                outcome: webhookOutcome,
              },
              database: {
                cartA: finalCartA?.toJSON() ?? null,
                cartB: finalCartB?.toJSON() ?? null,
                reserva:
                  finalReserva?.toJSON() ?? null,
                items: finalItems.map((item: any) =>
                  item.toJSON()
                ),
                payments:
                  finalFinancial.payments.map(
                    (payment: any) =>
                      payment.toJSON()
                  ),
                refunds: finalFinancial.refunds.map(
                  (refund: any) => refund.toJSON()
                ),
                itemB:
                  finalItemB?.toJSON() ?? null,
              },
              exposure: {
                approvedNetLocal:
                  finalFinancial.approvedNet.toFixed(2),
                processingLocal:
                  finalFinancial.processing.toFixed(2),
                totalActiveExposure:
                  finalFinancial.totalActiveExposure.toFixed(
                    2
                  ),
                definition:
                  "approved local net + processing local; el PI externo del pago procesando no se cuenta dos veces",
                externalLocalDivergence,
                maximumLegitimate: "100.00",
              },
              expected: {
                addBStatus: 409,
                itemB: null,
                paymentB: "NOT RUN",
                totalActiveExposureMax: "100.00",
              },
            },
            null,
            2
          )
        );

        expect.soft(
          addBResponse.status,
          "Una actividad con exposición procesando debe rechazarse al agregarla a otro carrito"
        ).toBe(409);
        expect.soft(
          finalItemB ?? null,
          "El carrito B no debe persistir la referencia comprometida por el pago procesando de A"
        ).toBeNull();
        expect.soft(
          secondPaymentResult,
          "El pago B no debe ejecutarse porque el add B debe rechazarse"
        ).toBe("NOT RUN");
        expect.soft(
          finalFinancial.totalActiveExposure,
          "La exposición local aprobada neta más procesando para la actividad no debe superar Q100.00"
        ).toBeLessThanOrEqual(100);

        expect(
          stripeMock.retrievePaymentIntent
        ).not.toHaveBeenCalled();
        expect(
          stripeMock.cancelPaymentIntent
        ).not.toHaveBeenCalled();
        expect(stripeMock.createRefund).not.toHaveBeenCalled();
        expect(stripeMock.constructEvent).not.toHaveBeenCalled();
      },
      30000
    );
  }
);
