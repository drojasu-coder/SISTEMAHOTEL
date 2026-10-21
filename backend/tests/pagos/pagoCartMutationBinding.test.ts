import { describe, expect, it, vi } from "vitest";

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
  const webhook = { event: null as any };
  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => {
      if (intents.size !== 0) {
        throw new Error(
          "QA-CART-FIN-CANDIDATE-014 solo permite un PaymentIntent local"
        );
      }

      const intent: IntentState = {
        id: "pi_cart_mutation_001",
        status: "requires_payment_method",
        client_secret: "pi_cart_mutation_001_secret_qa_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };

      intents.set(intent.id, intent);
      return { ...intent };
    }
  );
  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error("No se configuró el webhook local de QA");
    }
    return webhook.event;
  });
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-CART-FIN-CANDIDATE-014`
      );
    });

  return {
    intents,
    webhook,
    createPaymentIntent,
    constructEvent,
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
    createRefund: forbidden("createRefund"),
  };
});

/**
 * Stripe queda reemplazado por completo antes de importar app. El intent y el
 * webhook existen solo en memoria; este archivo nunca carga el SDK real.
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
const {
  Carrito,
  CarritoItem,
  Pago,
  Reembolso,
  ReservaActividad,
} = db;

const TEST_NAME =
  "QA-CART-FIN-CANDIDATE-014: no reasigna una autorización Stripe al reemplazar el item del carrito";

const approvedStates = new Set([
  "aprobado",
  "reembolsado_parcial",
  "reembolsado",
]);

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const persistedSnapshot = async (carritoId: number) => {
  const cart = await Carrito.findByPk(carritoId);
  const items = await CarritoItem.findAll({
    where: { carrito_id: carritoId },
    order: [["id", "ASC"]],
  });
  const payments = await Pago.findAll({
    where: { carrito_id: carritoId },
    order: [["id", "ASC"]],
  });
  const paymentIds = payments.map((payment: any) => Number(payment.id));
  const refunds = paymentIds.length
    ? await Reembolso.findAll({
        where: { pago_id: paymentIds },
        order: [["id", "ASC"]],
      })
    : [];
  const total = round(
    items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.precio) * Number(item.cantidad),
      0
    )
  );
  const approved = round(
    payments.reduce((sum: number, payment: any) => {
      if (!approvedStates.has(payment.estado)) return sum;
      const refunded = refunds
        .filter(
          (refund: any) =>
            Number(refund.pago_id) === Number(payment.id) &&
            refund.estado === "aprobado"
        )
        .reduce(
          (refundSum: number, refund: any) =>
            refundSum + Number(refund.monto),
          0
        );
      return sum + Math.max(0, Number(payment.monto) - refunded);
    }, 0)
  );

  return { cart, items, payments, refunds, total, approved };
};

describe("Binding financiero del contenido de carrito", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });
      const recurso = await createRecursoActividad({
        precio_hora: "100.00",
      });
      const authorization = `Bearer ${cliente.token}`;

      const createReservation = (horaInicio: string, horaFin: string) =>
        request(app)
          .post("/api/reservas-actividad")
          .set("Authorization", authorization)
          .send({
            recurso_id: recurso.id,
            fecha: "2027-06-10",
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            con_equipo: false,
          });

      const reservaAResponse = await createReservation("10:00", "11:00");
      const reservaBResponse = await createReservation("12:00", "13:00");

      expect(reservaAResponse.status).toBe(201);
      expect(reservaAResponse.body.data.total).toBe("100.00");
      expect(reservaBResponse.status).toBe(201);
      expect(reservaBResponse.body.data.total).toBe("100.00");

      const reservaAId = Number(reservaAResponse.body.data.id);
      const reservaBId = Number(reservaBResponse.body.data.id);
      const [reservaAInicial, reservaBInicial] = await Promise.all([
        ReservaActividad.findByPk(reservaAId),
        ReservaActividad.findByPk(reservaBId),
      ]);

      expect(reservaAInicial).not.toBeNull();
      expect(reservaBInicial).not.toBeNull();
      expect(reservaAInicial.total).toBe("100.00");
      expect(reservaBInicial.total).toBe("100.00");

      const cartResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", authorization)
        .send({});

      expect(cartResponse.status).toBe(201);
      const carritoId = Number(cartResponse.body.data.id);

      const addAResponse = await request(app)
        .post(`/api/carritos/${carritoId}/items`)
        .set("Authorization", authorization)
        .send({
          tipo_item: "actividad",
          referencia_id: reservaAId,
        });

      expect(addAResponse.status).toBe(201);
      expect(addAResponse.body.data.referencia_id).toBe(reservaAId);
      expect(addAResponse.body.data.precio).toBe("100.00");
      const itemAId = Number(addAResponse.body.data.id);

      const cartWithAResponse = await request(app)
        .get(`/api/carritos/${carritoId}/items`)
        .set("Authorization", authorization);

      expect(cartWithAResponse.status).toBe(200);
      expect(cartWithAResponse.body.data.items).toHaveLength(1);
      expect(Number(cartWithAResponse.body.data.total)).toBe(100);

      const atAuthorization = await persistedSnapshot(carritoId);
      expect(atAuthorization.cart.estado).toBe("activo");
      expect(atAuthorization.items).toHaveLength(1);
      expect(Number(atAuthorization.items[0].id)).toBe(itemAId);
      expect(Number(atAuthorization.items[0].referencia_id)).toBe(reservaAId);
      expect(atAuthorization.total).toBe(100);

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          carrito_id: carritoId,
          monto: "100.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
        });

      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.body.data.estado).toBe("procesando");
      expect(paymentResponse.body.data.monto).toBe("100.00");
      expect(paymentResponse.body.data.payment_intent_id).toBe(
        "pi_cart_mutation_001"
      );

      const pagoId = Number(paymentResponse.body.data.pago_id);
      const intent = stripeMock.intents.get("pi_cart_mutation_001");
      expect(intent).toBeDefined();
      expect(intent!.amount).toBe(10000);
      expect(intent!.currency).toBe("gtq");
      expect(intent!.metadata.pago_id).toBe(String(pagoId));
      expect(intent!.metadata.carrito_id).toBe(String(carritoId));

      const paymentBeforeMutation = await Pago.findByPk(pagoId);
      expect(paymentBeforeMutation).not.toBeNull();
      expect(paymentBeforeMutation.estado).toBe("procesando");
      expect(paymentBeforeMutation.monto).toBe("100.00");
      expect(paymentBeforeMutation.id_transaccion_externo).toBe(
        "pi_cart_mutation_001"
      );

      const deleteAResponse = await request(app)
        .delete(`/api/carritos/${carritoId}/items/${itemAId}`)
        .set("Authorization", authorization);

      let addBResponse: any = null;
      if (deleteAResponse.status === 204) {
        addBResponse = await request(app)
          .post(`/api/carritos/${carritoId}/items`)
          .set("Authorization", authorization)
          .send({
            tipo_item: "actividad",
            referencia_id: reservaBId,
          });
      }

      const beforeWebhook = await persistedSnapshot(carritoId);
      const itemABeforeWebhook = beforeWebhook.items.find(
        (item: any) => Number(item.referencia_id) === reservaAId
      );
      const itemBBeforeWebhook = beforeWebhook.items.find(
        (item: any) => Number(item.referencia_id) === reservaBId
      );
      const paymentBeforeWebhook = beforeWebhook.payments.find(
        (payment: any) => Number(payment.id) === pagoId
      );
      const replacementPermitted =
        deleteAResponse.status === 204 &&
        addBResponse?.status === 201 &&
        !itemABeforeWebhook &&
        Boolean(itemBBeforeWebhook) &&
        beforeWebhook.items.length === 1 &&
        beforeWebhook.total === 100 &&
        paymentBeforeWebhook?.estado === "procesando";

      let webhookResponse: any = null;
      if (replacementPermitted) {
        intent!.status = "succeeded";
        stripeMock.webhook.event = {
          id: "evt_cart_mutation_001",
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: intent!.id,
              status: intent!.status,
              amount: intent!.amount,
              currency: intent!.currency,
              metadata: { ...intent!.metadata },
            },
          },
        };

        webhookResponse = await request(app)
          .post("/api/pagos/stripe/webhook")
          .set("Stripe-Signature", "t=1,v1=qa-local-signature")
          .set("Content-Type", "application/json")
          .send(JSON.stringify({ id: "evt_cart_mutation_001" }));
      }

      const final = await persistedSnapshot(carritoId);
      const [reservaAFinal, reservaBFinal] = await Promise.all([
        ReservaActividad.findByPk(reservaAId),
        ReservaActividad.findByPk(reservaBId),
      ]);
      const finalPayment = final.payments.find(
        (payment: any) => Number(payment.id) === pagoId
      );
      const finalItemA = final.items.find(
        (item: any) => Number(item.referencia_id) === reservaAId
      );
      const finalItemB = final.items.find(
        (item: any) => Number(item.referencia_id) === reservaBId
      );
      const paymentColumns = Object.keys(finalPayment?.toJSON() ?? {});
      const metadataKeys = Object.keys(intent!.metadata);
      const itemBindingFields = [
        "item_id",
        "carrito_item_id",
        "tipo_item",
        "referencia_id",
        "reserva_actividad_id",
        "cart_snapshot",
        "snapshot",
        "cart_version",
      ];
      const metadataHasItemBinding = itemBindingFields.some((field) =>
        metadataKeys.includes(field)
      );
      const paymentHasItemBinding = itemBindingFields.some((field) =>
        paymentColumns.includes(field)
      );
      const authorizationReassigned =
        replacementPermitted &&
        webhookResponse?.status === 200 &&
        finalPayment?.estado === "aprobado" &&
        final.cart?.estado === "pagado" &&
        final.items.length === 1 &&
        !finalItemA &&
        Boolean(finalItemB) &&
        final.total === 100 &&
        final.approved === 100 &&
        !metadataHasItemBinding &&
        !paymentHasItemBinding;

      const evidence = {
        qaId: "QA-CART-FIN-CANDIDATE-014",
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        http: {
          reservaA: reservaAResponse.status,
          reservaB: reservaBResponse.status,
          createCart: cartResponse.status,
          addA: addAResponse.status,
          createPayment: paymentResponse.status,
          deleteA: {
            status: deleteAResponse.status,
            code: deleteAResponse.body?.code ?? null,
          },
          addB: addBResponse
            ? {
                status: addBResponse.status,
                code: addBResponse.body?.code ?? null,
              }
            : "NOT RUN",
          webhook: webhookResponse
            ? {
                status: webhookResponse.status,
                code: webhookResponse.body?.code ?? null,
                body: webhookResponse.body,
              }
            : "NOT RUN",
        },
        demonstrated: {
          A_deleteAfterIntentPermitted:
            deleteAResponse.status === 204 && !itemABeforeWebhook,
          B_replacementInSameCartPermitted: replacementPermitted,
          C_succeededAuthorizationReassigned: authorizationReassigned,
        },
        authorizationSnapshot: {
          cartId: carritoId,
          total: atAuthorization.total.toFixed(2),
          items: atAuthorization.items.map((item: any) => ({
            id: Number(item.id),
            tipo_item: item.tipo_item,
            referencia_id: Number(item.referencia_id),
            precio: item.precio,
            cantidad: item.cantidad,
          })),
        },
        paymentIntent: {
          id: intent!.id,
          status: intent!.status,
          amount: intent!.amount,
          currency: intent!.currency,
          metadata: intent!.metadata,
        },
        itemBinding: {
          metadataKeys,
          metadataHasItemBinding,
          paymentColumns,
          paymentHasItemBinding,
          boundOnlyToCartId:
            intent!.metadata.carrito_id === String(carritoId) &&
            !metadataHasItemBinding &&
            !paymentHasItemBinding,
        },
        beforeWebhook: {
          cart: beforeWebhook.cart?.toJSON() ?? null,
          total: beforeWebhook.total.toFixed(2),
          approvedAmount: beforeWebhook.approved.toFixed(2),
          items: beforeWebhook.items.map((item: any) => item.toJSON()),
          payment: paymentBeforeWebhook?.toJSON() ?? null,
        },
        finalDatabase: {
          cart: final.cart?.toJSON() ?? null,
          total: final.total.toFixed(2),
          approvedAmount: final.approved.toFixed(2),
          items: final.items.map((item: any) => item.toJSON()),
          payments: final.payments.map((payment: any) => payment.toJSON()),
          refunds: final.refunds.map((refund: any) => refund.toJSON()),
          reservaA: reservaAFinal?.toJSON() ?? null,
          reservaB: reservaBFinal?.toJSON() ?? null,
        },
        authorizationReassigned,
        expected: {
          authorizationReassigned: false,
          rule:
            "La autorización creada para el snapshot con A no puede aprobar y pagar el carrito mutado que contiene B",
        },
      };

      console.log(
        "[QA-CART-FIN-CANDIDATE-014]",
        JSON.stringify(evidence, null, 2)
      );

      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
      expect(stripeMock.constructEvent).toHaveBeenCalledTimes(
        replacementPermitted ? 1 : 0
      );
      expect.soft(reservaAFinal.total).toBe("100.00");
      expect.soft(reservaBFinal.total).toBe("100.00");
      expect.soft(
        authorizationReassigned,
        "Un PaymentIntent autorizado cuando el carrito contenía A no debe aprobar el reemplazo B"
      ).toBe(false);
    },
    30000
  );
});
