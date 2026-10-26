import { QueryTypes } from "sequelize";
import request from "supertest";
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
    refundedAmount: number;
  };

  const intents = new Map<string, IntentState>();
  const webhook = { event: null as any };
  const events: Array<Record<string, unknown>> = [];
  const cancelCalls: string[] = [];
  const refundCalls: Array<{
    paymentIntentId: string;
    amount: number;
    currency: string;
  }> = [];

  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string,
    ) => {
      if (intents.size !== 0) {
        throw new Error(
          "QA-SPA-FIN-CANDIDATE-047 solo permite un PaymentIntent local",
        );
      }

      const intent: IntentState = {
        id: "pi_spa_cancel_047_001",
        status: "requires_payment_method",
        client_secret: "pi_spa_cancel_047_001_secret_qa_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
        refundedAmount: 0,
      };
      intents.set(intent.id, intent);
      events.push({
        type: "PAYMENT_INTENT_CREATED",
        intentId: intent.id,
        status: intent.status,
      });
      return { ...intent };
    },
  );

  const retrievePaymentIntent = vi.fn(async (id: string) => {
    const intent = intents.get(id);
    events.push({ type: "PAYMENT_INTENT_RETRIEVED", intentId: id });
    if (!intent) throw new Error(`PaymentIntent local desconocido: ${id}`);
    return { ...intent };
  });

  const updatePaymentIntentMetadata = vi.fn(
    async (id: string, metadata: Record<string, string>) => {
      const intent = intents.get(id);
      if (!intent) throw new Error(`PaymentIntent local desconocido: ${id}`);
      intent.metadata = { ...metadata };
      events.push({ type: "PAYMENT_INTENT_METADATA_UPDATED", intentId: id });
      return { ...intent };
    },
  );

  const cancelPaymentIntent = vi.fn(async (id: string) => {
    cancelCalls.push(id);
    events.push({ type: "PAYMENT_INTENT_CANCEL_CALLED", intentId: id });
    const intent = intents.get(id);
    if (!intent) throw new Error(`PaymentIntent local desconocido: ${id}`);
    if (intent.status === "succeeded") {
      throw new Error(`PaymentIntent local ya cobrado: ${id}`);
    }
    intent.status = "canceled";
    events.push({ type: "PAYMENT_INTENT_CANCELED", intentId: id });
    return { ...intent };
  });

  const createRefund = vi.fn(
    async (
      paymentIntentId: string,
      amount: number | string,
      currency: string,
    ) => {
      const intent = intents.get(paymentIntentId);
      if (!intent) {
        throw new Error(`PaymentIntent local desconocido: ${paymentIntentId}`);
      }
      const amountMinor = Math.round(Number(amount) * 100);
      intent.refundedAmount += amountMinor;
      refundCalls.push({
        paymentIntentId,
        amount: Number(amount),
        currency,
      });
      events.push({
        type: "PAYMENT_INTENT_REFUNDED",
        intentId: paymentIntentId,
        amountMinor,
      });
      return {
        id: "re_spa_cancel_047_001",
        payment_intent: paymentIntentId,
        amount: amountMinor,
        currency: currency.toLowerCase(),
        status: "succeeded",
        created: 1_800_000_047,
      };
    },
  );

  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error(
        "No se configuró el webhook local de QA-SPA-FIN-CANDIDATE-047",
      );
    }
    events.push({
      type: "WEBHOOK_CONSTRUCTED",
      eventId: webhook.event.id,
      eventType: webhook.event.type,
    });
    return webhook.event;
  });

  return {
    intents,
    webhook,
    events,
    cancelCalls,
    refundCalls,
    createPaymentIntent,
    retrievePaymentIntent,
    updatePaymentIntentMetadata,
    cancelPaymentIntent,
    createRefund,
    constructEvent,
  };
});

/**
 * FULL LOCAL MOCK: PaymentIntent, cancelación, refund y webhook viven solo en
 * memoria. El SDK real de Stripe no se carga y no hay tráfico ni cargos reales.
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
    updatePaymentIntentMetadata: stripeMock.updatePaymentIntentMetadata,
    cancelPaymentIntent: stripeMock.cancelPaymentIntent,
    createRefund: stripeMock.createRefund,
    constructEvent: stripeMock.constructEvent,
  },
}));

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-SPA-FIN-CANDIDATE-047: no cancela una CitaBienestar con PaymentIntent procesando activo";

interface CitaRow {
  id: number;
  usuario_id: number;
  terapeuta_id: number;
  servicio_bienestar_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

interface CartRow {
  id: number;
  usuario_id: number;
  estado: string;
}

interface ItemRow {
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

interface RefundRow {
  id: number;
  pago_id: number;
  monto: string;
  estado: string;
  id_reembolso_externo: string | null;
}

const futureHotelDate = (days: number) => {
  const timeZone = process.env.APP_TIMEZONE || "America/Guatemala";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  const date = new Date(
    Date.UTC(part("year"), part("month") - 1, part("day") + days),
  );
  return date.toISOString().slice(0, 10);
};

const persistedSnapshot = async (citaId: number, cartId: number) => {
  const citas = (await sequelize.query(
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
      WHERE id = :citaId;
    `,
    { replacements: { citaId }, type: QueryTypes.SELECT },
  )) as CitaRow[];
  const carts = (await sequelize.query(
    `
      SELECT id, usuario_id, estado
      FROM carritos
      WHERE id = :cartId;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as CartRow[];
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
        AND tipo_item = 'bienestar'
        AND referencia_id = :citaId
      ORDER BY id ASC;
    `,
    { replacements: { cartId, citaId }, type: QueryTypes.SELECT },
  )) as ItemRow[];
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
  const refunds = (await sequelize.query(
    `
      SELECT
        r.id,
        r.pago_id,
        r.monto::numeric(10, 2)::text AS monto,
        r.estado,
        r.id_reembolso_externo
      FROM reembolsos r
      INNER JOIN pagos p ON p.id = r.pago_id
      WHERE p.carrito_id = :cartId
      ORDER BY r.id ASC;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as RefundRow[];
  const approved = payments.reduce(
    (sum, payment) =>
      ["aprobado", "reembolsado_parcial", "reembolsado"].includes(
        payment.estado,
      )
        ? sum +
          Math.max(
            0,
            Number(payment.monto) - Number(payment.approved_refunds),
          )
        : sum,
    0,
  );
  const processing = payments
    .filter((payment) => payment.estado === "procesando")
    .reduce((sum, payment) => sum + Number(payment.monto), 0);

  return {
    cita: citas[0] ?? null,
    cart: carts[0] ?? null,
    items,
    payments,
    refunds,
    approved,
    processing,
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

describe("Cancelación financiera de CitaBienestar", () => {
  it(
    TEST_NAME,
    async () => {
      const databaseRows = (await sequelize.query(
        "SELECT current_database() AS database;",
        { type: QueryTypes.SELECT },
      )) as Array<{ database: string }>;
      expect(databaseRows[0]?.database).toBe("hotel_test_db");

      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
      const clientAuthorization = `Bearer ${cliente.token}`;
      const adminAuthorization = `Bearer ${admin.token}`;

      const therapistResponse = await request(app)
        .post("/api/terapeutas")
        .set("Authorization", adminAuthorization)
        .send({
          nombre: "Terapeuta QA SPA FIN 047",
          activo: true,
        });
      expect(therapistResponse.status).toBe(201);
      const therapistId = Number(therapistResponse.body.data.id);

      const serviceResponse = await request(app)
        .post("/api/servicios-spa")
        .set("Authorization", adminAuthorization)
        .send({
          nombre: "Masaje QA SPA FIN 047",
          duracion_minutos: 60,
          precio: 350,
        });
      expect(serviceResponse.status).toBe(201);
      expect(Number(serviceResponse.body.data.precio)).toBe(350);
      const serviceId = Number(serviceResponse.body.data.id);

      const citaResponse = await request(app)
        .post("/api/citas-spa")
        .set("Authorization", clientAuthorization)
        .send({
          terapeuta_id: therapistId,
          servicio_bienestar_id: serviceId,
          fecha: futureHotelDate(30),
          hora_inicio: "10:00",
        });
      expect(citaResponse.status).toBe(201);
      expect(citaResponse.body.data.estado).toBe("confirmada");
      expect(Number(citaResponse.body.data.usuario_id)).toBe(
        Number(cliente.usuario.id),
      );
      const citaId = Number(citaResponse.body.data.id);

      const cartResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", clientAuthorization)
        .send({});
      expect(cartResponse.status).toBe(201);
      const cartId = Number(cartResponse.body.data.id);

      const addResponse = await request(app)
        .post(`/api/carritos/${cartId}/items`)
        .set("Authorization", clientAuthorization)
        .send({ tipo_item: "bienestar", referencia_id: citaId });
      expect(addResponse.status).toBe(201);
      expect(Number(addResponse.body.data.precio)).toBe(350);
      const cartItemId = Number(addResponse.body.data.id);

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", clientAuthorization)
        .send({
          carrito_id: cartId,
          monto: "350.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-spa-fin-candidate-047-card",
        });
      expect(
        paymentResponse.status,
        `Precondición inválida al crear Pago: ${JSON.stringify(paymentResponse.body)}`,
      ).toBe(201);
      expect(paymentResponse.body.data).toMatchObject({
        estado: "procesando",
        monto: "350.00",
        payment_intent_id: "pi_spa_cancel_047_001",
      });
      const paymentId = Number(paymentResponse.body.data.pago_id);
      const intent = stripeMock.intents.get("pi_spa_cancel_047_001");
      expect(intent).toBeDefined();
      expect(intent).toMatchObject({
        status: "requires_payment_method",
        amount: 35000,
        currency: "gtq",
      });
      expect(intent!.metadata).toMatchObject({
        pago_id: String(paymentId),
        carrito_id: String(cartId),
        tipo_pago: "total",
      });

      const beforeCancellation = await persistedSnapshot(citaId, cartId);
      expect(beforeCancellation.cita).toMatchObject({
        id: citaId,
        usuario_id: Number(cliente.usuario.id),
        terapeuta_id: therapistId,
        servicio_bienestar_id: serviceId,
        estado: "confirmada",
      });
      expect(beforeCancellation.cart).toMatchObject({
        id: cartId,
        usuario_id: Number(cliente.usuario.id),
        estado: "activo",
      });
      expect(beforeCancellation.items).toHaveLength(1);
      expect(beforeCancellation.items[0]).toMatchObject({
        id: cartItemId,
        precio: "350.00",
        cantidad: 1,
      });
      expect(beforeCancellation.payments).toHaveLength(1);
      expect(beforeCancellation.payments[0]).toMatchObject({
        id: paymentId,
        carrito_id: cartId,
        monto: "350.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        estado: "procesando",
        moneda: "GTQ",
        pasarela: "stripe",
        id_transaccion_externo: intent!.id,
        approved_refunds: "0.00",
      });
      expect(beforeCancellation.approved).toBe(0);
      expect(beforeCancellation.processing).toBe(350);

      const intentStatusBeforeCancellation = intent!.status;
      const cancellationResponse = await request(app)
        .patch(`/api/citas-spa/${citaId}/estado`)
        .set("Authorization", adminAuthorization)
        .send({ estado: "cancelada" });
      const afterCancellation = await persistedSnapshot(citaId, cartId);
      const intentStatusAfterCancellation = intent!.status;
      const cancelCallsAfterCancellation = [...stripeMock.cancelCalls];
      const refundCallsAfterCancellation = [...stripeMock.refundCalls];

      const cancellationRejectedSafely =
        cancellationResponse.status === 409 &&
        afterCancellation.cita?.estado === "confirmada" &&
        afterCancellation.cart?.estado === "activo" &&
        afterCancellation.payments[0]?.estado === "procesando" &&
        afterCancellation.approved === 0 &&
        afterCancellation.processing === 350 &&
        intentStatusAfterCancellation === "requires_payment_method";
      const cancellationPermitted =
        cancellationResponse.status === 200 &&
        afterCancellation.cita?.estado === "cancelada";
      const cancellationCompensatedSafely =
        cancellationPermitted &&
        intentStatusAfterCancellation === "canceled" &&
        cancelCallsAfterCancellation.length === 1 &&
        afterCancellation.processing === 0 &&
        afterCancellation.payments[0]?.estado !== "procesando";
      const uncanceledProcessingWindow =
        cancellationPermitted &&
        afterCancellation.payments[0]?.estado === "procesando" &&
        afterCancellation.processing === 350 &&
        intentStatusAfterCancellation !== "canceled" &&
        cancelCallsAfterCancellation.length === 0 &&
        refundCallsAfterCancellation.length === 0;

      let webhookEvent: any = null;
      let firstWebhookResponse: any = null;
      let replayWebhookResponse: any = null;
      let afterFirstWebhook = afterCancellation;
      let afterReplay = afterCancellation;

      if (uncanceledProcessingWindow) {
        // Única mutación externa simulada: el intent original llega a succeeded.
        intent!.status = "succeeded";
        stripeMock.events.push({
          type: "PAYMENT_INTENT_SUCCEEDED_EXTERNALLY",
          intentId: intent!.id,
        });
        webhookEvent = {
          id: "evt_spa_cancel_047_001",
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

        firstWebhookResponse = await sendWebhook(webhookEvent);
        afterFirstWebhook = await persistedSnapshot(citaId, cartId);

        // Replay exacto: misma instancia, id, tipo y objeto del primer delivery.
        replayWebhookResponse = await sendWebhook(webhookEvent);
        afterReplay = await persistedSnapshot(citaId, cartId);
      }

      const externalSucceeded = intent!.status === "succeeded";
      const externalNet = externalSucceeded
        ? Math.max(0, intent!.amount - intent!.refundedAmount) / 100
        : 0;
      const divergenceAfterFirst = Math.max(
        0,
        externalNet - afterFirstWebhook.approved,
      );
      const divergenceAfterReplay = Math.max(
        0,
        externalNet - afterReplay.approved,
      );
      const externalLocalDivergence =
        externalSucceeded && divergenceAfterReplay > 0;
      const succeededWithoutDurableReconciliation =
        externalLocalDivergence &&
        afterReplay.cita?.estado === "cancelada" &&
        afterReplay.payments[0]?.estado === "procesando" &&
        afterReplay.processing === 350 &&
        afterReplay.approved === 0;
      const canceledAppointmentWithExternalMoney =
        externalNet > 0 && afterReplay.cita?.estado === "cancelada";
      const financialViolation =
        uncanceledProcessingWindow ||
        succeededWithoutDurableReconciliation ||
        canceledAppointmentWithExternalMoney;
      const safeOutcome =
        cancellationRejectedSafely || cancellationCompensatedSafely;
      const unexpected500 = [
        therapistResponse,
        serviceResponse,
        citaResponse,
        cartResponse,
        addResponse,
        paymentResponse,
        cancellationResponse,
        firstWebhookResponse,
        replayWebhookResponse,
      ].some((response) => response?.status === 500);

      const evidence = {
        qaId: "QA-SPA-FIN-CANDIDATE-047",
        database: databaseRows[0]?.database,
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        actors: {
          clientId: Number(cliente.usuario.id),
          adminId: Number(admin.usuario.id),
        },
        ids: {
          therapistId,
          serviceId,
          citaId,
          cartId,
          cartItemId,
          paymentId,
          paymentIntentId: intent!.id,
          webhookEventId: webhookEvent?.id ?? null,
        },
        fixture: {
          servicePrice: "350.00",
          serviceDurationMinutes: 60,
          citaDate: beforeCancellation.cita?.fecha,
        },
        paymentCreate: {
          http: paymentResponse.status,
          code: paymentResponse.body.code ?? null,
          body: paymentResponse.body,
        },
        beforeCancellation: {
          database: beforeCancellation,
          intentStatus: intentStatusBeforeCancellation,
        },
        cancellation: {
          endpoint: `PATCH /api/citas-spa/${citaId}/estado`,
          payload: { estado: "cancelada" },
          http: cancellationResponse.status,
          code: cancellationResponse.body.code ?? null,
          body: cancellationResponse.body,
          database: afterCancellation,
          intentStatus: intentStatusAfterCancellation,
          intentCanceledByBackend:
            cancelCallsAfterCancellation.includes(intent!.id),
          refundCreated:
            refundCallsAfterCancellation.length > 0 ||
            afterCancellation.refunds.length > 0,
          rejectedSafely: cancellationRejectedSafely,
          compensatedSafely: cancellationCompensatedSafely,
          uncanceledProcessingWindow,
        },
        webhook: {
          executed: uncanceledProcessingWindow,
          first: firstWebhookResponse
            ? {
                http: firstWebhookResponse.status,
                code: firstWebhookResponse.body.code ?? null,
                body: firstWebhookResponse.body,
                database: afterFirstWebhook,
                divergence: divergenceAfterFirst.toFixed(2),
              }
            : "NOT RUN: cancelación bloqueada o compensada",
          replay: replayWebhookResponse
            ? {
                exactSameEvent: true,
                http: replayWebhookResponse.status,
                code: replayWebhookResponse.body.code ?? null,
                body: replayWebhookResponse.body,
                database: afterReplay,
                divergence: divergenceAfterReplay.toFixed(2),
              }
            : "NOT RUN: cancelación bloqueada o compensada",
        },
        stripe: {
          intent: { ...intent },
          createCalls: stripeMock.createPaymentIntent.mock.calls.length,
          retrieveCalls: stripeMock.retrievePaymentIntent.mock.calls.length,
          metadataCalls:
            stripeMock.updatePaymentIntentMetadata.mock.calls.length,
          cancelCalls: [...stripeMock.cancelCalls],
          refundCalls: [...stripeMock.refundCalls],
          constructEventCalls: stripeMock.constructEvent.mock.calls.length,
          events: stripeMock.events,
        },
        finalDatabase: afterReplay,
        financial: {
          externalNet: externalNet.toFixed(2),
          localApprovedNet: afterReplay.approved.toFixed(2),
          localProcessing: afterReplay.processing.toFixed(2),
          divergenceAfterFirst: divergenceAfterFirst.toFixed(2),
          divergenceAfterReplay: divergenceAfterReplay.toFixed(2),
          externalLocalDivergence,
          succeededWithoutDurableReconciliation,
          canceledAppointmentWithExternalMoney,
          financialViolation,
          safeOutcome,
        },
        http: { unexpected500 },
        scope: {
          regression044Observed: "NONE: no ejecutado ni reabierto",
          regression045Observed: "NONE: no ejecutado ni reabierto",
          regression046Observed: "NONE: no ejecutado ni reabierto",
          candidate048Investigated: false,
        },
        expected: {
          preferred:
            "HTTP 409, cita confirmada, Pago procesando e intent activo; webhook no ejecutado",
          alternative:
            "compensación verificable: PaymentIntent canceled y Pago sin exposición procesando antes de cancelar",
          externalLocalDivergence: false,
          financialViolation: false,
        },
      };

      console.log(
        "[QA-SPA-FIN-CANDIDATE-047]",
        JSON.stringify(evidence, null, 2),
      );

      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.intents.size).toBe(1);
      expect(afterReplay.payments).toHaveLength(1);
      expect.soft(unexpected500, "El flujo no debe producir HTTP 500").toBe(
        false,
      );
      expect.soft(
        safeOutcome,
        "La cancelación debe responder 409 o compensar de forma durable antes de cancelar la cita",
      ).toBe(true);
      expect.soft(
        stripeMock.constructEvent.mock.calls.length,
        "Ante la ventana vulnerable se entregan el succeeded y un replay exactamente igual",
      ).toBe(uncanceledProcessingWindow ? 2 : 0);
      expect.soft(
        externalLocalDivergence,
        "Stripe succeeded debe reconciliarse durablemente con el ledger local incluso después del replay",
      ).toBe(false);
      expect.soft(
        financialViolation,
        "Nunca debe coexistir cita cancelada con Pago procesando e intent activo ni dinero externo divergente",
      ).toBe(false);
    },
    30000,
  );
});
