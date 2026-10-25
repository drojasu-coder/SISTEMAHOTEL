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
      idempotencyKey?: string
    ) => {
      if (intents.size !== 0) {
        throw new Error(
          "QA-EVT-FIN-CANDIDATE-038 solo permite un PaymentIntent local"
        );
      }

      const intent: IntentState = {
        id: "pi_evt_cancel_038_001",
        status: "requires_payment_method",
        client_secret: "pi_evt_cancel_038_001_secret_qa_local",
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
    }
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
    }
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
      currency: string
    ) => {
      const intent = intents.get(paymentIntentId);
      if (!intent) {
        throw new Error(`PaymentIntent local desconocido: ${paymentIntentId}`);
      }
      const amountMinor = Math.round(Number(amount) * 100);
      intent.refundedAmount += amountMinor;
      refundCalls.push({ paymentIntentId, amount: Number(amount), currency });
      events.push({
        type: "PAYMENT_INTENT_REFUNDED",
        intentId: paymentIntentId,
        amountMinor,
      });
      return {
        id: "re_evt_cancel_038_001",
        payment_intent: paymentIntentId,
        amount: amountMinor,
        currency: currency.toLowerCase(),
        status: "succeeded",
        created: 1_800_000_038,
      };
    }
  );

  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error(
        "No se configuró el webhook local de QA-EVT-FIN-CANDIDATE-038"
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
 * FULL LOCAL MOCK: intent, cancelaciones, refunds y webhook viven solo en
 * memoria. El SDK real de Stripe no se carga y no existe tráfico de red.
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
import { eventFinancialExposure } from "../../src/services/pago.service";
import { createSalonEvento } from "../fixtures/eventos";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-EVT-FIN-CANDIDATE-038: no cancela un evento con PaymentIntent procesando activo";

interface ReservationRow {
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

const persistedSnapshot = async (reservationId: number) => {
  const reservations = (await sequelize.query(
    `
      SELECT
        id,
        salon_id,
        estado,
        total::numeric(10, 2)::text AS total,
        anticipo::numeric(10, 2)::text AS anticipo
      FROM reservas_evento
      WHERE id = :reservationId;
    `,
    { replacements: { reservationId }, type: QueryTypes.SELECT }
  )) as ReservationRow[];
  const cartItems = (await sequelize.query(
    `
      SELECT
        id,
        carrito_id,
        tipo_item,
        referencia_id,
        precio::numeric(10, 2)::text AS precio,
        cantidad
      FROM carrito_items
      WHERE tipo_item = 'evento'
        AND referencia_id = :reservationId
      ORDER BY id ASC;
    `,
    { replacements: { reservationId }, type: QueryTypes.SELECT }
  )) as CartItemRow[];
  const payments = (await sequelize.query(
    `
      SELECT DISTINCT
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
      INNER JOIN carrito_items ci ON ci.carrito_id = p.carrito_id
      WHERE ci.tipo_item = 'evento'
        AND ci.referencia_id = :reservationId
      ORDER BY p.id ASC;
    `,
    { replacements: { reservationId }, type: QueryTypes.SELECT }
  )) as PaymentRow[];
  const approved = payments.reduce(
    (sum, payment) =>
      ["aprobado", "reembolsado_parcial", "reembolsado"].includes(
        payment.estado
      )
        ? sum + Math.max(0, Number(payment.monto) - Number(payment.approved_refunds))
        : sum,
    0
  );
  const processing = payments
    .filter((payment) => payment.estado === "procesando")
    .reduce((sum, payment) => sum + Number(payment.monto), 0);
  const approvedRefunds = payments.reduce(
    (sum, payment) => sum + Number(payment.approved_refunds),
    0
  );

  return {
    reservation: reservations[0] ?? null,
    cartItems,
    payments,
    approved,
    processing,
    approvedRefunds,
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

describe("Cancelación financiera de ReservaEvento", () => {
  it(
    TEST_NAME,
    async () => {
      const databaseRows = (await sequelize.query(
        "SELECT current_database() AS database;",
        { type: QueryTypes.SELECT }
      )) as Array<{ database: string }>;
      expect(databaseRows[0]?.database).toBe("hotel_test_db");

      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const authorization = `Bearer ${cliente.token}`;
      const salon = await createSalonEvento({
        capacidad_maxima: 100,
        tarifa_base: 5000,
      });

      const reservationResponse = await request(app)
        .post("/api/reservas-evento")
        .set("Authorization", authorization)
        .send({
          salon_id: salon.id,
          tipo_evento: "boda",
          fecha: "2035-10-10",
          hora_inicio: "10:00",
          hora_fin: "14:00",
          numero_invitados: 50,
        });
      expect(reservationResponse.status).toBe(201);
      expect(reservationResponse.body.data).toMatchObject({
        estado: "cotizacion",
        total: "5000.00",
      });
      const reservationId = Number(reservationResponse.body.data.id);

      const cartResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", authorization)
        .send({});
      expect(cartResponse.status).toBe(201);
      const cartId = Number(cartResponse.body.data.id);

      const addResponse = await request(app)
        .post(`/api/carritos/${cartId}/items`)
        .set("Authorization", authorization)
        .send({ tipo_item: "evento", referencia_id: reservationId });
      expect(addResponse.status).toBe(201);
      expect(Number(addResponse.body.data.precio)).toBe(5000);

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          carrito_id: cartId,
          monto: "5000.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-evt-fin-candidate-038",
        });
      expect(
        paymentResponse.status,
        `Precondición inválida al crear Pago: ${JSON.stringify(paymentResponse.body)}`
      ).toBe(201);
      expect(paymentResponse.body.data).toMatchObject({
        estado: "procesando",
        monto: "5000.00",
        payment_intent_id: "pi_evt_cancel_038_001",
      });
      const paymentId = Number(paymentResponse.body.data.pago_id);
      const intent = stripeMock.intents.get("pi_evt_cancel_038_001");
      expect(intent).toBeDefined();
      expect(intent).toMatchObject({
        status: "requires_payment_method",
        amount: 500000,
        currency: "gtq",
      });
      expect(intent!.metadata).toMatchObject({
        pago_id: String(paymentId),
        carrito_id: String(cartId),
        tipo_pago: "total",
      });

      const beforeCancellation = await persistedSnapshot(reservationId);
      const beforeExposure = await eventFinancialExposure(reservationId, undefined);
      expect(beforeCancellation.reservation).toMatchObject({
        id: reservationId,
        salon_id: Number(salon.id),
        estado: "cotizacion",
        total: "5000.00",
      });
      expect(beforeCancellation.cartItems).toHaveLength(1);
      expect(beforeCancellation.payments).toHaveLength(1);
      expect(beforeCancellation.payments[0]).toMatchObject({
        id: paymentId,
        carrito_id: cartId,
        monto: "5000.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        estado: "procesando",
        moneda: "GTQ",
        pasarela: "stripe",
        id_transaccion_externo: intent!.id,
        approved_refunds: "0.00",
      });
      expect(beforeCancellation.approved).toBe(0);
      expect(beforeCancellation.processing).toBe(5000);
      expect(beforeExposure).toEqual({
        approved: 0,
        processing: 5000,
        total: 5000,
      });

      // PATCH general no admite estado; la ruta real de cancelación no recibe body.
      const cancellationResponse = await request(app)
        .patch(`/api/reservas-evento/${reservationId}/cancelar`)
        .set("Authorization", authorization);
      const afterCancellation = await persistedSnapshot(reservationId);
      const afterCancellationExposure = await eventFinancialExposure(
        reservationId,
        undefined
      );
      const intentStatusAfterCancellation = intent!.status;
      const cancelCallsAfterCancellation = [...stripeMock.cancelCalls];
      const refundCallsAfterCancellation = [...stripeMock.refundCalls];
      const cancellationRejectedSafely =
        cancellationResponse.status === 409 &&
        cancellationResponse.body.code === "RESERVATION_HAS_PROCESSING_PAYMENT" &&
        afterCancellation.reservation?.estado === "cotizacion" &&
        afterCancellation.payments[0]?.estado === "procesando" &&
        afterCancellationExposure.approved === 0 &&
        afterCancellationExposure.processing === 5000 &&
        intentStatusAfterCancellation === "requires_payment_method" &&
        cancelCallsAfterCancellation.length === 0 &&
        refundCallsAfterCancellation.length === 0;
      const cancellationPermitted =
        cancellationResponse.status === 200 &&
        afterCancellation.reservation?.estado === "cancelada";
      const cancellationCompensatedSafely =
        cancellationPermitted &&
        intentStatusAfterCancellation === "canceled" &&
        cancelCallsAfterCancellation.length === 1 &&
        afterCancellation.processing === 0 &&
        afterCancellationExposure.processing === 0 &&
        afterCancellation.payments[0]?.estado !== "procesando";
      const violationA =
        cancellationPermitted &&
        afterCancellation.payments[0]?.estado === "procesando" &&
        intentStatusAfterCancellation !== "canceled" &&
        cancelCallsAfterCancellation.length === 0 &&
        refundCallsAfterCancellation.length === 0;

      let firstWebhookResponse: any = null;
      let replayWebhookResponse: any = null;
      let afterFirstWebhook = afterCancellation;
      let afterReplay = afterCancellation;
      let afterFirstWebhookExposure = afterCancellationExposure;
      let afterReplayExposure = afterCancellationExposure;
      let webhookEvent: any = null;
      let divergenceAfterFirst = 0;

      if (violationA) {
        intent!.status = "succeeded";
        stripeMock.events.push({
          type: "PAYMENT_INTENT_SUCCEEDED_EXTERNALLY",
          intentId: intent!.id,
        });
        webhookEvent = {
          id: "evt_evt_cancel_038_001",
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
        afterFirstWebhook = await persistedSnapshot(reservationId);
        afterFirstWebhookExposure = await eventFinancialExposure(
          reservationId,
          undefined
        );
        const externalNetAfterFirst =
          Math.max(0, intent!.amount - intent!.refundedAmount) / 100;
        divergenceAfterFirst = Math.max(
          0,
          externalNetAfterFirst - afterFirstWebhook.approved
        );

        if (divergenceAfterFirst > 0) {
          // Replay exacto y único: mismo id, tipo y objeto del primer delivery.
          replayWebhookResponse = await sendWebhook(webhookEvent);
          afterReplay = await persistedSnapshot(reservationId);
          afterReplayExposure = await eventFinancialExposure(
            reservationId,
            undefined
          );
        } else {
          afterReplay = afterFirstWebhook;
          afterReplayExposure = afterFirstWebhookExposure;
        }
      }

      const externalSucceeded = intent!.status === "succeeded";
      const externalNet = externalSucceeded
        ? Math.max(0, intent!.amount - intent!.refundedAmount) / 100
        : 0;
      const divergenceAfterReplay = Math.max(
        0,
        externalNet - afterReplay.approved
      );
      const violationB =
        externalSucceeded &&
        afterReplay.reservation?.estado === "cancelada" &&
        afterReplay.payments[0]?.estado !== "aprobado" &&
        divergenceAfterReplay > 0;
      const violationC =
        externalSucceeded &&
        externalNet > 0 &&
        afterReplay.reservation?.estado === "cancelada" &&
        afterReplay.approved > 0 &&
        afterReplay.approvedRefunds === 0;
      const financialViolation = violationA || violationB || violationC;
      const safeOutcome =
        cancellationRejectedSafely || cancellationCompensatedSafely;
      const unexpected500 = [
        reservationResponse,
        cartResponse,
        addResponse,
        paymentResponse,
        cancellationResponse,
        firstWebhookResponse,
        replayWebhookResponse,
      ].some((response) => response?.status === 500);

      const evidence = {
        qaId: "QA-EVT-FIN-CANDIDATE-038",
        database: databaseRows[0]?.database,
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        ids: {
          clienteId: Number(cliente.usuario.id),
          salonId: Number(salon.id),
          reservationId,
          cartId,
          cartItemId: Number(beforeCancellation.cartItems[0].id),
          paymentId,
          paymentIntentId: intent!.id,
          webhookEventId: webhookEvent?.id ?? null,
        },
        amounts: {
          salon: "5000.00",
          reservation: beforeCancellation.reservation?.total,
          payment: beforeCancellation.payments[0].monto,
          intentMinor: intent!.amount,
        },
        beforeCancellation: {
          database: beforeCancellation,
          helperExposure: beforeExposure,
          intentStatus: "requires_payment_method",
        },
        cancellation: {
          endpoint: `PATCH /api/reservas-evento/${reservationId}/cancelar`,
          payload: "NO BODY",
          http: cancellationResponse.status,
          code: cancellationResponse.body.code ?? null,
          body: cancellationResponse.body,
          database: afterCancellation,
          helperExposure: afterCancellationExposure,
          intentStatus: intentStatusAfterCancellation,
          cancelCalls: cancelCallsAfterCancellation,
          refundCalls: refundCallsAfterCancellation,
          rejectedSafely: cancellationRejectedSafely,
          compensatedSafely: cancellationCompensatedSafely,
          activeProcessingWindow: violationA,
        },
        webhook: {
          executed: violationA,
          first: firstWebhookResponse
            ? {
                http: firstWebhookResponse.status,
                code: firstWebhookResponse.body.code ?? null,
                body: firstWebhookResponse.body,
                database: afterFirstWebhook,
                helperExposure: afterFirstWebhookExposure,
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
                helperExposure: afterReplayExposure,
                divergence: divergenceAfterReplay.toFixed(2),
              }
            : "NOT RUN: no hubo divergencia tras el primer webhook",
          constructEventCalls: stripeMock.constructEvent.mock.calls.length,
        },
        stripe: {
          intent: { ...intent },
          intentCount: stripeMock.intents.size,
          createCalls: stripeMock.createPaymentIntent.mock.calls.length,
          retrieveCalls: stripeMock.retrievePaymentIntent.mock.calls.length,
          updateMetadataCalls:
            stripeMock.updatePaymentIntentMetadata.mock.calls.length,
          cancelCalls: [...stripeMock.cancelCalls],
          refundCalls: [...stripeMock.refundCalls],
          constructEventCalls: stripeMock.constructEvent.mock.calls.length,
          events: stripeMock.events,
        },
        finalDatabase: {
          ...afterReplay,
          helperExposure: afterReplayExposure,
        },
        financial: {
          externalNet: externalNet.toFixed(2),
          localApprovedNet: afterReplay.approved.toFixed(2),
          localProcessing: afterReplay.processing.toFixed(2),
          divergenceAfterFirst: divergenceAfterFirst.toFixed(2),
          divergenceAfterReplay: divergenceAfterReplay.toFixed(2),
          violationA,
          violationB,
          violationC,
          financialViolation,
          safeOutcome,
        },
        http: { unexpected500 },
        regressions035Through037: "NONE: tests cerrados intactos y no ejecutados",
        expected: {
          preferred:
            "HTTP 409 RESERVATION_HAS_PROCESSING_PAYMENT; reserva cotizacion; Pago procesando; intent activo",
          alternative: "compensación verificable y atómica antes de cancelar",
          financialViolation: false,
        },
      };

      console.log(
        "[QA-EVT-FIN-CANDIDATE-038]",
        JSON.stringify(evidence, null, 2)
      );

      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.intents).toHaveLength(1);
      expect(afterReplay.payments).toHaveLength(1);
      expect.soft(unexpected500, "El flujo no debe producir HTTP 500").toBe(false);
      expect.soft(
        safeOutcome,
        "La cancelación debe rechazarse con 409 y código financiero o compensar de forma verificable"
      ).toBe(true);
      expect.soft(
        stripeMock.constructEvent.mock.calls.length,
        "Ante la ventana activa se entrega succeeded y solo se repite si el primer webhook diverge"
      ).toBe(violationA ? (divergenceAfterFirst > 0 ? 2 : 1) : 0);
      expect.soft(
        financialViolation,
        "No debe existir cancelada+procesando+intent activo, divergencia tras succeeded ni cobro aprobado incoherente"
      ).toBe(false);
    },
    30000
  );
});
