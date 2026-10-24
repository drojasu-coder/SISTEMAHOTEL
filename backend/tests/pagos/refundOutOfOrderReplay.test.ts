import { describe, expect, it, vi } from "vitest";

const stripeMock = vi.hoisted(() => {
  const webhook = { event: null as any };
  const refundCalls: Array<{
    paymentIntentId: string;
    amount: number;
    currency: string;
    reason?: string;
    idempotencyKey?: string;
  }> = [];

  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => ({
      id: "pi_refund_order_016",
      status: "requires_payment_method",
      client_secret: "pi_refund_order_016_secret_qa_local",
      amount: Math.round(Number(amount) * 100),
      currency: currency.toLowerCase(),
      metadata: { ...metadata },
      idempotency_key: idempotencyKey,
    })
  );

  const createRefund = vi.fn(
    async (
      paymentIntentId: string,
      amount: number | string,
      currency: string,
      reason?: string,
      idempotencyKey?: string
    ) => {
      refundCalls.push({
        paymentIntentId,
        amount: Number(amount),
        currency,
        reason,
        idempotencyKey,
      });

      if (refundCalls.length === 1) {
        return {
          id: "re_016_001",
          payment_intent: paymentIntentId,
          amount: Math.round(Number(amount) * 100),
          currency: currency.toLowerCase(),
          reason: reason ?? null,
          status: "pending",
          created: 1_800_000_100,
        };
      }

      if (refundCalls.length === 2) {
        return {
          id: "re_016_002",
          payment_intent: paymentIntentId,
          amount: Math.round(Number(amount) * 100),
          currency: currency.toLowerCase(),
          reason: reason ?? null,
          status: "succeeded",
          created: 1_800_000_300,
        };
      }

      throw new Error("QA-PAY-FIN-CANDIDATE-016 recibió un refund Stripe inesperado");
    }
  );

  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error("No se configuró el webhook Stripe local de QA");
    }
    return webhook.event;
  });
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(`${method} no permitido en QA-PAY-FIN-CANDIDATE-016`);
    });

  return {
    webhook,
    refundCalls,
    createPaymentIntent,
    createRefund,
    constructEvent,
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
  };
});

/**
 * Stripe queda reemplazado antes de importar app. Intents, refunds y webhooks
 * existen solo en memoria: no se carga el SDK real ni se realizan cargos.
 */
vi.mock("../../src/services/stripe.service", () => ({
  toStripeAmount: (amount: number | string, currency: string) => {
    if (currency !== "GTQ") {
      throw new Error(`Moneda inesperada en mock Stripe: ${currency}`);
    }
    return Math.round(Number(amount) * 100);
  },
  stripeService: {
    createPaymentIntent: stripeMock.createPaymentIntent,
    retrievePaymentIntent: stripeMock.retrievePaymentIntent,
    cancelPaymentIntent: stripeMock.cancelPaymentIntent,
    createRefund: stripeMock.createRefund,
    constructEvent: stripeMock.constructEvent,
  },
}));

import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createRecursoActividad } from "../fixtures/actividades";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const { Carrito, Pago, Reembolso, ReservaActividad } = db;

const TEST_NAME =
  "QA-PAY-FIN-CANDIDATE-016: un refund aprobado no se degrada por eventos antiguos fuera de orden";

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const financialSnapshot = async (paymentId: number) => {
  const payment = await Pago.findByPk(paymentId);
  const refunds = await Reembolso.findAll({
    where: { pago_id: paymentId },
    order: [["id", "ASC"]],
  });
  const approvedRefunded = round(
    refunds
      .filter((refund: any) => refund.estado === "aprobado")
      .reduce(
        (sum: number, refund: any) => sum + Number(refund.monto),
        0
      )
  );

  return {
    payment,
    refunds,
    approvedRefunded,
    net: round(Number(payment?.monto ?? 0) - approvedRefunded),
    secondRefundCapacity: round(
      Number(payment?.monto ?? 0) - approvedRefunded
    ),
  };
};

const sendWebhook = async (event: any) => {
  stripeMock.webhook.event = event;
  return request(app)
    .post("/api/pagos/stripe/webhook")
    .set("Stripe-Signature", "t=1,v1=qa-local-signature")
    .set("Content-Type", "application/json")
    .send(JSON.stringify({ id: event.id }));
};

describe("Orden monotónico de eventos Stripe de reembolso", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
      const recurso = await createRecursoActividad({ precio_hora: "100.00" });
      const clientAuthorization = `Bearer ${cliente.token}`;
      const adminAuthorization = `Bearer ${admin.token}`;

      const reservationResponse = await request(app)
        .post("/api/reservas-actividad")
        .set("Authorization", clientAuthorization)
        .send({
          recurso_id: recurso.id,
          fecha: "2027-06-10",
          hora_inicio: "10:00",
          hora_fin: "11:00",
          con_equipo: false,
        });
      expect(reservationResponse.status).toBe(201);
      expect(reservationResponse.body.data.total).toBe("100.00");

      const reservationId = Number(reservationResponse.body.data.id);
      const reservation = await ReservaActividad.findByPk(reservationId);
      expect(reservation).not.toBeNull();
      expect(reservation.total).toBe("100.00");

      const cartResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", clientAuthorization)
        .send({});
      expect(cartResponse.status).toBe(201);
      const cartId = Number(cartResponse.body.data.id);

      const itemResponse = await request(app)
        .post(`/api/carritos/${cartId}/items`)
        .set("Authorization", clientAuthorization)
        .send({ tipo_item: "actividad", referencia_id: reservationId });
      expect(itemResponse.status).toBe(201);
      expect(itemResponse.body.data.precio).toBe("100.00");

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", clientAuthorization)
        .send({
          carrito_id: cartId,
          monto: "100.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-pay-fin-016-payment",
        });
      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.body.data.estado).toBe("procesando");
      expect(paymentResponse.body.data.payment_intent_id).toBe(
        "pi_refund_order_016"
      );
      const paymentId = Number(paymentResponse.body.data.pago_id);

      const paymentSucceededResponse = await sendWebhook({
        id: "evt_016_payment_succeeded",
        created: 1_800_000_000,
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_refund_order_016",
            status: "succeeded",
            amount: 10000,
            currency: "gtq",
            metadata: { pago_id: String(paymentId), carrito_id: String(cartId) },
          },
        },
      });
      expect(paymentSucceededResponse.status).toBe(200);

      const approvedPayment = await Pago.findByPk(paymentId);
      const paidCart = await Carrito.findByPk(cartId);
      expect(approvedPayment.estado).toBe("aprobado");
      expect(approvedPayment.monto).toBe("100.00");
      expect(paidCart.estado).toBe("pagado");

      const refundResponse = await request(app)
        .post(`/api/pagos/${paymentId}/reembolso`)
        .set("Authorization", adminAuthorization)
        .send({
          monto: "40.00",
          motivo: "requested_by_customer",
          idempotency_key: "qa-pay-fin-016-refund-40",
        });
      expect(refundResponse.status).toBe(200);
      expect(refundResponse.body.data.id_reembolso_externo).toBe("re_016_001");
      expect(refundResponse.body.data.estado).toBe("pendiente");

      const succeededRefundResponse = await sendWebhook({
        id: "evt_016_refund_succeeded_new",
        created: 1_800_000_200,
        type: "refund.updated",
        data: {
          object: {
            id: "re_016_001",
            payment_intent: "pi_refund_order_016",
            amount: 4000,
            currency: "gtq",
            reason: "requested_by_customer",
            status: "succeeded",
            created: 1_800_000_100,
          },
        },
      });
      expect(succeededRefundResponse.status).toBe(200);

      const afterSucceeded = await financialSnapshot(paymentId);
      expect(afterSucceeded.refunds).toHaveLength(1);
      expect(afterSucceeded.refunds[0].id_reembolso_externo).toBe("re_016_001");
      expect(afterSucceeded.refunds[0].estado).toBe("aprobado");
      expect(afterSucceeded.refunds[0].monto).toBe("40.00");
      expect(afterSucceeded.payment.estado).toBe("reembolsado_parcial");
      expect(afterSucceeded.approvedRefunded).toBe(40);
      expect(afterSucceeded.net).toBe(60);
      expect(afterSucceeded.secondRefundCapacity).toBe(60);

      const oldPendingResponse = await sendWebhook({
        id: "evt_016_refund_created_old",
        created: 1_800_000_050,
        type: "refund.created",
        data: {
          object: {
            id: "re_016_001",
            payment_intent: "pi_refund_order_016",
            amount: 4000,
            currency: "gtq",
            reason: "requested_by_customer",
            status: "pending",
            created: 1_800_000_100,
          },
        },
      });
      const afterOldPending = await financialSnapshot(paymentId);

      const oldFailedResponse = await sendWebhook({
        id: "evt_016_refund_failed_old",
        created: 1_800_000_075,
        type: "refund.failed",
        data: {
          object: {
            id: "re_016_001",
            payment_intent: "pi_refund_order_016",
            amount: 4000,
            currency: "gtq",
            reason: "requested_by_customer",
            status: "failed",
            created: 1_800_000_100,
          },
        },
      });
      const afterOldFailed = await financialSnapshot(paymentId);

      const secondRefundResponse = await request(app)
        .post(`/api/pagos/${paymentId}/reembolso`)
        .set("Authorization", adminAuthorization)
        .send({
          monto: "60.00",
          motivo: "requested_by_customer",
          idempotency_key: "qa-pay-fin-016-refund-60",
        });
      const final = await financialSnapshot(paymentId);

      const evidence = {
        qaId: "QA-PAY-FIN-CANDIDATE-016",
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        http: {
          reservation: reservationResponse.status,
          createCart: cartResponse.status,
          addItem: itemResponse.status,
          createPayment: paymentResponse.status,
          paymentSucceededWebhook: paymentSucceededResponse.status,
          createPartialRefund: refundResponse.status,
          newSucceededWebhook: succeededRefundResponse.status,
          oldPendingWebhook: oldPendingResponse.status,
          oldFailedWebhook: oldFailedResponse.status,
          secondRefund: {
            status: secondRefundResponse.status,
            code: secondRefundResponse.body?.code ?? null,
          },
          unexpected500: [
            reservationResponse,
            cartResponse,
            itemResponse,
            paymentResponse,
            paymentSucceededResponse,
            refundResponse,
            succeededRefundResponse,
            oldPendingResponse,
            oldFailedResponse,
            secondRefundResponse,
          ].some((response) => response.status >= 500),
        },
        persisted: {
          afterSucceeded: {
            refundState: afterSucceeded.refunds[0]?.estado ?? null,
            paymentState: afterSucceeded.payment?.estado ?? null,
            approvedRefunded: afterSucceeded.approvedRefunded.toFixed(2),
            net: afterSucceeded.net.toFixed(2),
            secondRefundCapacity:
              afterSucceeded.secondRefundCapacity.toFixed(2),
          },
          afterOldPending: {
            refundState: afterOldPending.refunds[0]?.estado ?? null,
            paymentState: afterOldPending.payment?.estado ?? null,
            approvedRefunded: afterOldPending.approvedRefunded.toFixed(2),
            net: afterOldPending.net.toFixed(2),
            secondRefundCapacity:
              afterOldPending.secondRefundCapacity.toFixed(2),
          },
          afterOldFailed: {
            refundState: afterOldFailed.refunds[0]?.estado ?? null,
            paymentState: afterOldFailed.payment?.estado ?? null,
            approvedRefunded: afterOldFailed.approvedRefunded.toFixed(2),
            net: afterOldFailed.net.toFixed(2),
            secondRefundCapacity:
              afterOldFailed.secondRefundCapacity.toFixed(2),
          },
          final: {
            paymentState: final.payment?.estado ?? null,
            refunds: final.refunds.map((refund: any) => ({
              externalId: refund.id_reembolso_externo,
              state: refund.estado,
              amount: refund.monto,
            })),
            approvedRefunded: final.approvedRefunded.toFixed(2),
            net: final.net.toFixed(2),
          },
        },
        expected: {
          afterEveryOldEvent:
            "refund aprobado / pago reembolsado_parcial / aprobado Q40.00 / neto Q60.00 / capacidad Q60.00",
          final:
            "dos refunds aprobados Q40.00+Q60.00 / pago reembolsado / neto Q0.00",
        },
        stripeRefundCalls: stripeMock.refundCalls,
      };

      console.log(
        "[QA-PAY-FIN-CANDIDATE-016]",
        JSON.stringify(evidence, null, 2)
      );

      expect(oldPendingResponse.status).toBe(200);
      expect(oldFailedResponse.status).toBe(200);
      expect(secondRefundResponse.status).toBe(200);
      expect(secondRefundResponse.body.data.id_reembolso_externo).toBe(
        "re_016_002"
      );
      expect.soft(
        afterOldPending.refunds[0]?.estado,
        "refund.created pending antiguo no puede degradar un refund aprobado"
      ).toBe("aprobado");
      expect.soft(afterOldPending.payment?.estado).toBe("reembolsado_parcial");
      expect.soft(afterOldPending.approvedRefunded).toBe(40);
      expect.soft(afterOldPending.net).toBe(60);
      expect.soft(afterOldPending.secondRefundCapacity).toBe(60);
      expect.soft(
        afterOldFailed.refunds[0]?.estado,
        "refund.failed antiguo no puede degradar un refund aprobado"
      ).toBe("aprobado");
      expect.soft(afterOldFailed.payment?.estado).toBe("reembolsado_parcial");
      expect.soft(afterOldFailed.approvedRefunded).toBe(40);
      expect.soft(afterOldFailed.net).toBe(60);
      expect.soft(afterOldFailed.secondRefundCapacity).toBe(60);
      expect.soft(final.refunds).toHaveLength(2);
      expect.soft(final.refunds[0]?.estado).toBe("aprobado");
      expect.soft(final.refunds[1]?.estado).toBe("aprobado");
      expect.soft(final.payment?.estado).toBe("reembolsado");
      expect.soft(final.approvedRefunded).toBe(100);
      expect.soft(final.net).toBe(0);
      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.createRefund).toHaveBeenCalledTimes(2);
      expect(stripeMock.constructEvent).toHaveBeenCalledTimes(4);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
    },
    30000
  );
});
