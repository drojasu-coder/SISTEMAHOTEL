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
          "QA-EVT-FIN-CANDIDATE-039 solo permite un PaymentIntent local",
        );
      }

      const intent: IntentState = {
        id: "pi_evt_multi_event_cart_039_001",
        status: "requires_payment_method",
        client_secret: "pi_evt_multi_event_cart_039_001_secret_qa_local",
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
        "No se configuró el webhook local de QA-EVT-FIN-CANDIDATE-039",
      );
    }
    return webhook.event;
  });
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-EVT-FIN-CANDIDATE-039`,
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
 * FULL LOCAL MOCK: Stripe queda sustituido antes de importar app. El único
 * PaymentIntent y el webhook viven en memoria; no hay red ni cargos reales.
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
import { eventFinancialExposure } from "../../src/services/pago.service";
import { createSalonEvento } from "../fixtures/eventos";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-EVT-FIN-CANDIDATE-039: un pago total cubre dos eventos sin límite individual ni atribución duplicada";

interface CartRow {
  id: number;
  estado: string;
  item_count: string;
  total: string;
}

interface EventRow {
  id: number;
  salon_id: number;
  estado: string;
  total: string;
  anticipo: string;
}

interface CartItemRow {
  id: number;
  carrito_id: number;
  tipo_item: string;
  referencia_id: number;
  precio: string;
  cantidad: number;
}

interface PaymentRow {
  id: number;
  carrito_id: number;
  monto: string;
  metodo: string;
  tipo_pago: string;
  estado: string;
  moneda: string;
  pasarela: string | null;
  id_transaccion_externo: string | null;
  approved_refunds: string;
}

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

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
  const events = (await sequelize.query(
    `
      SELECT
        id,
        salon_id,
        estado,
        total::numeric(10, 2)::text AS total,
        anticipo::numeric(10, 2)::text AS anticipo
      FROM reservas_evento
      WHERE id IN (:reservationIds)
      ORDER BY id ASC;
    `,
    { replacements: { reservationIds }, type: QueryTypes.SELECT },
  )) as EventRow[];
  const items = (await sequelize.query(
    `
      SELECT
        id,
        carrito_id,
        tipo_item,
        referencia_id,
        precio::numeric(10, 2)::text AS precio,
        cantidad
      FROM carrito_items
      WHERE carrito_id = :cartId
      ORDER BY id ASC;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as CartItemRow[];
  const payments = (await sequelize.query(
    `
      SELECT
        p.id,
        p.carrito_id,
        p.monto::numeric(10, 2)::text AS monto,
        p.metodo,
        p.tipo_pago,
        p.estado,
        p.moneda,
        p.pasarela,
        p.id_transaccion_externo,
        COALESCE((
          SELECT SUM(r.monto)
          FROM reembolsos r
          WHERE r.pago_id = p.id
            AND r.estado = 'aprobado'
        ), 0)::numeric(10, 2)::text AS approved_refunds
      FROM pagos p
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
    events,
    items,
    payments,
    realMoney: {
      approved,
      processing,
      total: round(approved + processing),
    },
  };
};

describe("Pago de carrito con dos ReservaEvento", () => {
  it(
    TEST_NAME,
    async () => {
      const databaseRows = (await sequelize.query(
        "SELECT current_database() AS database;",
        { type: QueryTypes.SELECT },
      )) as Array<{ database: string }>;
      expect(databaseRows[0]?.database).toBe("hotel_test_db");

      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const authorization = `Bearer ${cliente.token}`;
      const salonA = await createSalonEvento({ tarifa_base: 5000 });
      const salonB = await createSalonEvento({ tarifa_base: 5000 });
      const reservationPayloads = [
        {
          salon_id: Number(salonA.id),
          tipo_evento: "boda",
          fecha: "2035-10-10",
          hora_inicio: "10:00",
          hora_fin: "14:00",
          numero_invitados: 50,
        },
        {
          salon_id: Number(salonB.id),
          tipo_evento: "ejecutivo",
          fecha: "2035-10-10",
          hora_inicio: "10:00",
          hora_fin: "14:00",
          numero_invitados: 50,
        },
      ];
      const reservationResponses = [];
      for (const payload of reservationPayloads) {
        const response = await request(app)
          .post("/api/reservas-evento")
          .set("Authorization", authorization)
          .send(payload);
        reservationResponses.push(response);
        expect(response.status, JSON.stringify(response.body)).toBe(201);
        expect(response.body.data.estado).toBe("cotizacion");
        expect(Number(response.body.data.total)).toBe(5000);
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
          .send({ tipo_item: "evento", referencia_id: reservationId });
        addResponses.push(response);
        expect(response.status, JSON.stringify(response.body)).toBe(201);
        expect(Number(response.body.data.precio)).toBe(5000);
      }

      const cartItemsResponse = await request(app)
        .get(`/api/carritos/${cartId}/items`)
        .set("Authorization", authorization);
      expect(cartItemsResponse.status, JSON.stringify(cartItemsResponse.body)).toBe(
        200,
      );
      expect(cartItemsResponse.body.data.items).toHaveLength(2);
      expect(Number(cartItemsResponse.body.data.total)).toBe(10000);

      const summaryBefore = await request(app)
        .get(`/api/pagos/resumen?carrito_id=${cartId}`)
        .set("Authorization", authorization);
      expect(summaryBefore.status, JSON.stringify(summaryBefore.body)).toBe(200);
      expect(Number(summaryBefore.body.data.total)).toBe(10000);
      expect(Number(summaryBefore.body.data.saldo)).toBe(10000);

      const before = await getDatabaseSnapshot(cartId, reservationIds);
      const beforeExposures = await Promise.all(
        reservationIds.map((id) => eventFinancialExposure(id, undefined)),
      );
      expect(before.cart).toMatchObject({
        id: cartId,
        estado: "activo",
        item_count: "2",
        total: "10000.00",
      });
      expect(before.events).toHaveLength(2);
      expect(before.events.map((event) => event.total)).toEqual([
        "5000.00",
        "5000.00",
      ]);
      expect(before.items).toHaveLength(2);
      expect(before.items.map((item) => item.precio)).toEqual([
        "5000.00",
        "5000.00",
      ]);
      expect(before.payments).toHaveLength(0);
      expect(beforeExposures).toEqual([
        { approved: 0, processing: 0, total: 0 },
        { approved: 0, processing: 0, total: 0 },
      ]);

      // Único intento de pago del escenario principal.
      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          carrito_id: cartId,
          monto: "10000.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-evt-fin-candidate-039-total",
        });

      const persistedBeforeWebhook = await getDatabaseSnapshot(
        cartId,
        reservationIds,
      );
      const intent = [...stripeMock.intents.values()][0] ?? null;
      let webhookResponse: any = null;
      if (paymentResponse.status === 201 && intent) {
        expect(paymentResponse.body.data.estado).toBe("procesando");
        expect(paymentResponse.body.data.monto).toBe("10000.00");
        expect(intent).toMatchObject({
          id: "pi_evt_multi_event_cart_039_001",
          status: "requires_payment_method",
          amount: 1000000,
          currency: "gtq",
        });

        intent.status = "succeeded";
        stripeMock.webhook.event = {
          id: "evt_evt_multi_event_cart_039_001",
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
          .send(JSON.stringify({ id: "evt_evt_multi_event_cart_039_001" }));
      }

      const final = await getDatabaseSnapshot(cartId, reservationIds);
      const finalExposures = await Promise.all(
        reservationIds.map((id) => eventFinancialExposure(id, undefined)),
      );
      const attributedExposureSum = round(
        finalExposures.reduce((sum, exposure) => sum + exposure.total, 0),
      );
      const derivedRemaining = final.events.map((event, index) =>
        round(Math.max(0, Number(event.total) - finalExposures[index].total)),
      );
      const safelyAccepted =
        paymentResponse.status === 201 &&
        persistedBeforeWebhook.payments.length === 1 &&
        persistedBeforeWebhook.payments[0].estado === "procesando" &&
        persistedBeforeWebhook.payments[0].monto === "10000.00" &&
        intent?.amount === 1000000;
      const attributionMatchesRealMoney =
        attributedExposureSum === final.realMoney.total;
      const duplicatedAttribution =
        attributedExposureSum > final.realMoney.total;
      const safeInvariant =
        safelyAccepted &&
        webhookResponse?.status === 200 &&
        final.payments.length === 1 &&
        final.payments[0].estado === "aprobado" &&
        final.cart?.estado === "pagado" &&
        final.realMoney.approved === 10000 &&
        attributionMatchesRealMoney &&
        !duplicatedAttribution;
      const blockedByIndividualLimit =
        paymentResponse.status === 409 &&
        paymentResponse.body.code === "PAYMENT_EXCEEDS_BALANCE";
      const unexpected500 = [
        ...reservationResponses,
        cartResponse,
        ...addResponses,
        cartItemsResponse,
        summaryBefore,
        paymentResponse,
        webhookResponse,
      ].some((response) => response?.status === 500);

      const evidence = {
        qaId: "QA-EVT-FIN-CANDIDATE-039",
        result:
          blockedByIndividualLimit || duplicatedAttribution
            ? "CONFIRMED"
            : safeInvariant
              ? "NOT_REPRODUCED"
              : "BLOCKED",
        test: {
          file: "backend/tests/eventos/reservaEvento.multiEventCartPayment.test.ts",
          name: TEST_NAME,
        },
        database: databaseRows[0]?.database,
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
        ids: {
          clienteId: Number(cliente.usuario.id),
          salonAId: Number(salonA.id),
          salonBId: Number(salonB.id),
          reservaEventoAId: reservationIds[0],
          reservaEventoBId: reservationIds[1],
          cartId,
          cartItemIds: before.items.map((item) => Number(item.id)),
          paymentId: final.payments[0]?.id ?? null,
          paymentIntentId: intent?.id ?? null,
        },
        pricesAndTotals: {
          salonA: "5000.00",
          salonB: "5000.00",
          eventA: before.events[0]?.total ?? null,
          eventB: before.events[1]?.total ?? null,
          itemA: before.items[0]?.precio ?? null,
          itemB: before.items[1]?.precio ?? null,
          cart: before.cart?.total ?? null,
          itemCount: before.cart?.item_count ?? null,
        },
        paymentAttempt: {
          attempts: 1,
          endpoint: "POST /api/pagos",
          amount: "10000.00",
          type: "total",
          method: "tarjeta",
          http: paymentResponse.status,
          code: paymentResponse.body.code ?? null,
          body: paymentResponse.body,
          blockedByIndividualLimit,
        },
        observableRemaining: {
          before: {
            eventA: round(5000 - beforeExposures[0].total).toFixed(2),
            eventB: round(5000 - beforeExposures[1].total).toFixed(2),
            globalFromHttpSummary: Number(
              summaryBefore.body.data.saldo,
            ).toFixed(2),
          },
          after: {
            eventA: derivedRemaining[0].toFixed(2),
            eventB: derivedRemaining[1].toFixed(2),
            globalFromPersistedMoney: round(
              Math.max(0, 10000 - final.realMoney.total),
            ).toFixed(2),
          },
          rejectedInternalLimiterValue:
            paymentResponse.status === 201
              ? "NOT_APPLICABLE"
              : "NOT OBSERVABLE: la respuesta no expone remaining y el test no instrumenta producción",
        },
        persistedBeforeWebhook: {
          cart: persistedBeforeWebhook.cart,
          payments: persistedBeforeWebhook.payments,
          realMoney: persistedBeforeWebhook.realMoney,
        },
        webhook: webhookResponse
          ? {
              status: webhookResponse.status,
              code: webhookResponse.body.code ?? null,
              body: webhookResponse.body,
            }
          : "NOT RUN: el pago total fue rechazado antes de crear PaymentIntent",
        finalDatabase: {
          cart: final.cart,
          events: final.events,
          items: final.items,
          payments: final.payments,
          realMoney: {
            approved: final.realMoney.approved.toFixed(2),
            processing: final.realMoney.processing.toFixed(2),
            approvedPlusProcessing: final.realMoney.total.toFixed(2),
          },
          attribution: {
            eventA: finalExposures[0],
            eventB: finalExposures[1],
            sum: attributedExposureSum.toFixed(2),
            matchesRealMoney: attributionMatchesRealMoney,
            duplicated: duplicatedAttribution,
          },
        },
        outcome: {
          safelyAccepted,
          blockedByIndividualLimit,
          attributionMatchesRealMoney,
          duplicatedAttribution,
          safeInvariant,
          unexpected500,
        },
        regressions035To038: "NONE; no se ejecutaron ni modificaron",
        excludedScope: {
          rooms: 0,
          activities: 0,
          services: 0,
          secondCarts: 0,
          expirations: 0,
          patches: 0,
          cancellations: 0,
          partialPaymentVariant: "NOT RUN",
        },
        suspectedExecutionPath:
          "createPago -> validateOpenOrigin (carrito Q10000) -> eventExposureBalance; calcula Math.min de saldos individuales Q5000/Q5000 y compara el pago global Q10000 contra remaining Q5000",
        expected:
          "HTTP 201, un Pago procesando y un PaymentIntent por Q10000; webhook succeeded aprueba el Pago, paga el carrito y la suma atribuida A+B es exactamente Q10000 sin duplicación",
      };

      console.log(
        "[QA-EVT-FIN-CANDIDATE-039]",
        JSON.stringify(evidence, null, 2),
      );

      expect.soft(unexpected500, "El flujo no debe producir HTTP 500").toBe(false);
      expect.soft(
        paymentResponse.status,
        "El pago total Q10000 del carrito con dos obligaciones independientes Q5000 debe aceptarse",
      ).toBe(201);
      expect.soft(
        safeInvariant,
        "El pago debe aprobarse y atribuir exactamente Q10000 entre A/B, nunca Q10000 a cada evento",
      ).toBe(true);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.updatePaymentIntentMetadata).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
    },
    30000,
  );
});
