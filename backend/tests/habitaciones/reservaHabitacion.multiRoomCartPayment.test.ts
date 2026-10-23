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
      idempotencyKey?: string,
    ) => {
      if (intents.size !== 0) {
        throw new Error(
          "QA-RH-FIN-CANDIDATE-030 solo permite un PaymentIntent local persistible",
        );
      }

      const intent: IntentState = {
        id: "pi_rh_multi_room_cart_030_001",
        status: "requires_payment_method",
        client_secret: "pi_rh_multi_room_cart_030_001_secret_qa_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };
      intents.set(intent.id, intent);
      return { ...intent };
    },
  );
  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error(
        "No se configuró el webhook local de QA-RH-FIN-CANDIDATE-030",
      );
    }
    return webhook.event;
  });
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-RH-FIN-CANDIDATE-030`,
      );
    });

  return {
    intents,
    webhook,
    createPaymentIntent,
    constructEvent,
    updatePaymentIntentMetadata: forbidden("updatePaymentIntentMetadata"),
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
    createRefund: forbidden("createRefund"),
  };
});

/**
 * FULL LOCAL MOCK: sustituye stripe.service antes de importar app. El único
 * PaymentIntent y el webhook viven exclusivamente en memoria; no se carga el
 * SDK, no hay tráfico de red y no existe posibilidad de cargos reales.
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
    updatePaymentIntentMetadata: stripeMock.updatePaymentIntentMetadata,
    retrievePaymentIntent: stripeMock.retrievePaymentIntent,
    cancelPaymentIntent: stripeMock.cancelPaymentIntent,
    createRefund: stripeMock.createRefund,
    constructEvent: stripeMock.constructEvent,
  },
}));

import { QueryTypes } from "sequelize";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import {
  isReservationFullyPaid,
  reservationFinancialExposure,
} from "../../src/services/pago.service";
import { createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-RH-FIN-CANDIDATE-030: un carrito multi-habitación no duplica ni acepta exposición parcial como pago total";

interface CartRow {
  id: number;
  estado: string;
  item_count: string;
  total: string;
}

interface ReservationRow {
  id: number;
  habitacion_id: number;
  estado: string;
  total: string;
}

interface PaymentRow {
  id: number;
  carrito_id: number;
  reserva_habitacion_id: number | null;
  monto: string;
  metodo: string;
  tipo_pago: string;
  estado: string;
  id_transaccion_externo: string | null;
  approved_refunds: string;
}

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const getHotelDatePlusDays = (days: number) => {
  const timeZone = process.env.APP_TIMEZONE || "America/Guatemala";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return new Date(
    Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day") + days,
    ),
  )
    .toISOString()
    .slice(0, 10);
};

const getDatabaseSnapshot = async (
  cartId: number,
  reservationIds: number[],
) => {
  const carts = (await sequelize.query(
    `
      SELECT
        c.id,
        c.estado,
        COUNT(ci.id)::text AS item_count,
        COALESCE(SUM(ci.precio * ci.cantidad), 0)
          ::numeric(10, 2)::text AS total
      FROM carritos c
      LEFT JOIN carrito_items ci ON ci.carrito_id = c.id
      WHERE c.id = :cartId
      GROUP BY c.id, c.estado;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as CartRow[];
  const reservations = (await sequelize.query(
    `
      SELECT
        id,
        habitacion_id,
        estado,
        total::numeric(10, 2)::text AS total
      FROM reservas_habitacion
      WHERE id IN (:reservationIds)
      ORDER BY id ASC;
    `,
    { replacements: { reservationIds }, type: QueryTypes.SELECT },
  )) as ReservationRow[];
  const payments = (await sequelize.query(
    `
      SELECT
        p.id,
        p.carrito_id,
        p.reserva_habitacion_id,
        p.monto::numeric(10, 2)::text AS monto,
        p.metodo,
        p.tipo_pago,
        p.estado,
        p.id_transaccion_externo,
        COALESCE(r.approved_refunds, 0)::numeric(10, 2)::text
          AS approved_refunds
      FROM pagos p
      LEFT JOIN (
        SELECT pago_id, SUM(monto) AS approved_refunds
        FROM reembolsos
        WHERE estado = 'aprobado'
        GROUP BY pago_id
      ) r ON r.pago_id = p.id
      WHERE p.carrito_id = :cartId
      ORDER BY p.id ASC;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as PaymentRow[];
  const approvedStates = new Set([
    "aprobado",
    "reembolsado_parcial",
    "reembolsado",
  ]);
  const approved = round(
    payments.reduce(
      (sum, payment) =>
        approvedStates.has(payment.estado)
          ? sum +
            Math.max(
              0,
              Number(payment.monto) - Number(payment.approved_refunds),
            )
          : sum,
      0,
    ),
  );
  const processing = round(
    payments
      .filter((payment) => payment.estado === "procesando")
      .reduce((sum, payment) => sum + Number(payment.monto), 0),
  );

  return {
    cart: carts[0] ?? null,
    reservations,
    payments,
    realMoney: {
      approved,
      processing,
      total: round(approved + processing),
    },
  };
};

describe("Pago de carrito con dos ReservaHabitacion", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const hotelA = await createHotelFixture({ capacidad: 2, tarifa: 100 });
      const hotelB = await createHotelFixture({ capacidad: 2, tarifa: 100 });
      const authorization = `Bearer ${cliente.token}`;
      const fechaEntrada = getHotelDatePlusDays(10);
      const fechaSalida = getHotelDatePlusDays(11);

      const reservationResponses = await Promise.all(
        [hotelA.habitacion.id, hotelB.habitacion.id].map((habitacionId) =>
          request(app)
            .post("/api/reservas-habitacion")
            .set("Authorization", authorization)
            .send({
              habitacion_id: habitacionId,
              fecha_entrada: fechaEntrada,
              fecha_salida: fechaSalida,
              numero_huespedes: 1,
            }),
        ),
      );
      for (const response of reservationResponses) {
        expect(response.status, JSON.stringify(response.body)).toBe(201);
        expect(response.body.data.total).toBe("100.00");
      }
      const reservationIds = reservationResponses.map((response) =>
        Number(response.body.data.id),
      );
      expect(new Set(reservationIds).size).toBe(2);

      const cartResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", authorization)
        .send({});
      expect(cartResponse.status, JSON.stringify(cartResponse.body)).toBe(201);
      const cartId = Number(cartResponse.body.data.id);

      const addResponses = [];
      for (const reservationId of reservationIds) {
        const response = await request(app)
          .post(`/api/carritos/${cartId}/items`)
          .set("Authorization", authorization)
          .send({ tipo_item: "habitacion", referencia_id: reservationId });
        addResponses.push(response);
        expect(response.status, JSON.stringify(response.body)).toBe(201);
        expect(response.body.data.precio).toBe("100.00");
      }

      const cartItemsResponse = await request(app)
        .get(`/api/carritos/${cartId}/items`)
        .set("Authorization", authorization);
      expect(cartItemsResponse.status).toBe(200);
      expect(cartItemsResponse.body.data.items).toHaveLength(2);
      expect(Number(cartItemsResponse.body.data.total)).toBe(200);

      const before = await getDatabaseSnapshot(cartId, reservationIds);
      const beforeExposures = await Promise.all(
        reservationIds.map((id) => reservationFinancialExposure(id, undefined)),
      );
      const beforeFullyPaid = await Promise.all(
        reservationIds.map((id) => isReservationFullyPaid(id, 100, undefined)),
      );
      expect(before.cart).toMatchObject({
        id: cartId,
        estado: "activo",
        item_count: "2",
        total: "200.00",
      });
      expect(before.reservations).toHaveLength(2);
      expect(before.payments).toHaveLength(0);
      expect(beforeExposures).toEqual([
        { approved: 0, processing: 0, total: 0 },
        { approved: 0, processing: 0, total: 0 },
      ]);
      expect(beforeFullyPaid).toEqual([false, false]);

      const partialAttempt = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          carrito_id: cartId,
          monto: "100.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-rh-fin-candidate-030-partial-cart-total",
        });
      const afterPartialAttempt = await getDatabaseSnapshot(
        cartId,
        reservationIds,
      );
      const partialSafelyRejected =
        partialAttempt.status >= 400 &&
        partialAttempt.status < 500 &&
        afterPartialAttempt.payments.length === 0 &&
        stripeMock.createPaymentIntent.mock.calls.length === 0 &&
        stripeMock.intents.size === 0;

      // Si el intento parcial fue rechazado sin efectos, se permite un único
      // pago real Q200 para medir la atribución del pago compartido.
      let acceptedPaymentResponse: any = null;
      let fullFallbackResponse: any = null;
      if (partialAttempt.status === 201) {
        acceptedPaymentResponse = partialAttempt;
      } else if (partialSafelyRejected) {
        fullFallbackResponse = await request(app)
          .post("/api/pagos")
          .set("Authorization", authorization)
          .send({
            carrito_id: cartId,
            monto: "200.00",
            metodo: "tarjeta",
            tipo_pago: "total",
            moneda: "GTQ",
            idempotency_key: "qa-rh-fin-candidate-030-full-cart-total",
          });
        acceptedPaymentResponse =
          fullFallbackResponse.status === 201 ? fullFallbackResponse : null;
      }

      const persistedBeforeWebhook = await getDatabaseSnapshot(
        cartId,
        reservationIds,
      );
      const intent = [...stripeMock.intents.values()][0] ?? null;
      let webhookResponse: any = null;
      if (acceptedPaymentResponse && intent) {
        expect(acceptedPaymentResponse.body.data.estado).toBe("procesando");
        intent.status = "succeeded";
        stripeMock.webhook.event = {
          id: "evt_rh_multi_room_cart_030_001",
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: intent.id,
              status: intent.status,
              amount: intent.amount,
              currency: intent.currency,
              metadata: { ...intent.metadata },
            },
          },
        };
        webhookResponse = await request(app)
          .post("/api/pagos/stripe/webhook")
          .set("Stripe-Signature", "t=1,v1=qa-local-signature")
          .set("Content-Type", "application/json")
          .send(JSON.stringify({ id: "evt_rh_multi_room_cart_030_001" }));
      }

      const final = await getDatabaseSnapshot(cartId, reservationIds);
      const finalExposures = await Promise.all(
        reservationIds.map((id) => reservationFinancialExposure(id, undefined)),
      );
      const finalFullyPaid = await Promise.all(
        reservationIds.map((id) => isReservationFullyPaid(id, 100, undefined)),
      );
      const cartFinancialSummary = await request(app)
        .get(`/api/pagos/resumen?carrito_id=${cartId}`)
        .set("Authorization", authorization);
      const attributedExposureSum = round(
        finalExposures.reduce((sum, exposure) => sum + exposure.total, 0),
      );
      const cartOutstanding =
        cartFinancialSummary.status === 200
          ? Number(cartFinancialSummary.body.data.saldo)
          : null;
      const bothReservationsTreatedFullyPaid = finalFullyPaid.every(Boolean);
      const incorrectFullyPaidDecision =
        final.realMoney.approved < 200 &&
        bothReservationsTreatedFullyPaid &&
        cartOutstanding !== null &&
        cartOutstanding > 0;
      const attributionViolation =
        attributedExposureSum > final.realMoney.total &&
        incorrectFullyPaidDecision;
      const subpaymentAcceptedAsFull = partialAttempt.status === 201;
      const unexpected500 = [
        ...reservationResponses,
        cartResponse,
        ...addResponses,
        cartItemsResponse,
        partialAttempt,
        fullFallbackResponse,
        webhookResponse,
        cartFinancialSummary,
      ].some((response) => response?.status === 500);

      const evidence = {
        qaId: "QA-RH-FIN-CANDIDATE-030",
        result:
          subpaymentAcceptedAsFull || attributionViolation
            ? "CONFIRMED"
            : "NOT_REPRODUCED",
        file:
          "backend/tests/habitaciones/reservaHabitacion.multiRoomCartPayment.test.ts",
        database: "hotel_test_db",
        stripe: {
          mode: "FULL_LOCAL_MOCK",
          realNetworkCalls: 0,
          createPaymentIntentCalls:
            stripeMock.createPaymentIntent.mock.calls.length,
          intents: [...stripeMock.intents.values()].map((value) => ({
            id: value.id,
            amountMinor: value.amount,
            amountGTQ: (value.amount / 100).toFixed(2),
            state: value.status,
            metadata: value.metadata,
          })),
          webhookCalls: stripeMock.constructEvent.mock.calls.length,
        },
        cart: {
          id: cartId,
          initialState: before.cart?.estado ?? null,
          initialTotal: before.cart?.total ?? null,
          initialItems: before.cart?.item_count ?? null,
          finalState: final.cart?.estado ?? null,
          finalTotal: final.cart?.total ?? null,
          finalItems: final.cart?.item_count ?? null,
          summaryHttp: cartFinancialSummary.status,
          summaryCode: cartFinancialSummary.body.code ?? null,
          summary: cartFinancialSummary.body.data ?? null,
        },
        reservations: {
          ids: reservationIds,
          roomIds: [
            Number(hotelA.habitacion.id),
            Number(hotelB.habitacion.id),
          ],
          dates: { fechaEntrada, fechaSalida },
          before: before.reservations,
          final: final.reservations,
        },
        before: {
          exposures: beforeExposures,
          fullyPaidDecisions: beforeFullyPaid,
          paymentCount: before.payments.length,
        },
        paymentAttempt: {
          amount: "100.00",
          type: "total",
          method: "tarjeta",
          origin: "carrito",
          http: partialAttempt.status,
          code: partialAttempt.body.code ?? null,
          body: partialAttempt.body,
          safelyRejectedWithoutPersistence: partialSafelyRejected,
          persistedCountAfterAttempt: afterPartialAttempt.payments.length,
          intentCountAfterAttempt: partialSafelyRejected
            ? 0
            : stripeMock.intents.size,
        },
        fallbackFullPayment: fullFallbackResponse
          ? {
              amount: "200.00",
              http: fullFallbackResponse.status,
              code: fullFallbackResponse.body.code ?? null,
            }
          : "NOT_RUN",
        persistedBeforeWebhook: {
          payments: persistedBeforeWebhook.payments,
          realMoney: persistedBeforeWebhook.realMoney,
        },
        webhook: webhookResponse
          ? {
              http: webhookResponse.status,
              code: webhookResponse.body.code ?? null,
              result: webhookResponse.body,
            }
          : "NOT_RUN",
        finalDatabase: {
          cart: final.cart,
          reservations: final.reservations,
          payments: final.payments,
          paymentCount: final.payments.length,
          realApproved: final.realMoney.approved.toFixed(2),
          realProcessing: final.realMoney.processing.toFixed(2),
          realApprovedPlusProcessing: final.realMoney.total.toFixed(2),
          exposures: {
            A: finalExposures[0],
            B: finalExposures[1],
          },
          attributedExposureSum: attributedExposureSum.toFixed(2),
          fullyPaidDecisions: {
            A: finalFullyPaid[0],
            B: finalFullyPaid[1],
          },
        },
        outcome: {
          subpaymentAcceptedAsFull,
          bothReservationsTreatedFullyPaid,
          incorrectFullyPaidDecision,
          attributionViolation,
          unexpected500,
        },
        regressions: {
          qa020: "not_reexecuted; un solo origen carrito y un solo pago",
          qa027: "not_reopened; no DELETE ni segundo pago",
          qa028: "not_reopened; no PATCH",
          qa029: "not_reopened; no cancelación ni PATCH",
        },
        counts: {
          reservations: final.reservations.length,
          carts: 1,
          cartItems: Number(final.cart?.item_count ?? 0),
          paymentAttempts: fullFallbackResponse ? 2 : 1,
          persistedPayments: final.payments.length,
          paymentIntents: stripeMock.intents.size,
          webhooks: stripeMock.constructEvent.mock.calls.length,
          directPayments: 0,
          cashPayments: 0,
          secondCarts: 0,
        },
        expected: {
          partialAttempt:
            "4xx sin Pago ni PaymentIntent para tipo_pago=total Q100 contra carrito Q200",
          attribution:
            "la suma atribuida a A/B no supera dinero real y no declara ambas reservas pagadas mientras el carrito conserva saldo",
          cartItems: "dos items intactos por total Q200.00",
        },
      };

      console.log(
        "[QA-RH-FIN-CANDIDATE-030]",
        JSON.stringify(evidence, null, 2),
      );

      expect.soft(
        unexpected500,
        "El flujo financiero no debe producir HTTP 500",
      ).toBe(false);
      expect.soft(
        partialSafelyRejected,
        "tipo_pago=total Q100 contra un carrito Q200 debe rechazarse sin Pago ni PaymentIntent",
      ).toBe(true);
      if (partialSafelyRejected) {
        expect.soft(
          fullFallbackResponse?.status,
          "Tras el rechazo limpio, el único pago persistible Q200 debe poder crearse",
        ).toBe(201);
      }
      expect.soft(final.cart?.item_count, "Los dos CarritoItem deben permanecer").toBe(
        "2",
      );
      expect.soft(final.cart?.total).toBe("200.00");
      expect.soft(final.reservations).toHaveLength(2);
      expect.soft(final.payments.length).toBeLessThanOrEqual(1);
      expect.soft(stripeMock.intents.size).toBeLessThanOrEqual(1);
      expect.soft(
        attributedExposureSum,
        "La suma de exposición atribuida a las dos reservas no debe superar el dinero real aprobado/procesando",
      ).toBeLessThanOrEqual(final.realMoney.total);
      expect.soft(
        incorrectFullyPaidDecision,
        "No se puede tratar A y B como totalmente pagadas mientras PostgreSQL conserva Q100 de saldo en el carrito",
      ).toBe(false);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.updatePaymentIntentMetadata).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
    },
    30000,
  );
});
