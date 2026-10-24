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
          "QA-RH-FIN-CANDIDATE-029 solo permite un PaymentIntent local"
        );
      }

      const intent: IntentState = {
        id: "pi_rh_patch_cancel_029_001",
        status: "requires_payment_method",
        client_secret: "pi_rh_patch_cancel_029_001_secret_qa_local",
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
    if (!intent) {
      throw new Error(`PaymentIntent local desconocido: ${id}`);
    }
    return { ...intent };
  });

  const updatePaymentIntentMetadata = vi.fn(
    async (id: string, metadata: Record<string, string>) => {
      const intent = intents.get(id);
      if (!intent) {
        throw new Error(`PaymentIntent local desconocido: ${id}`);
      }
      intent.metadata = { ...metadata };
      events.push({ type: "PAYMENT_INTENT_METADATA_UPDATED", intentId: id });
      return { ...intent };
    }
  );

  const cancelPaymentIntent = vi.fn(async (id: string) => {
    cancelCalls.push(id);
    events.push({ type: "PAYMENT_INTENT_CANCEL_CALLED", intentId: id });
    const intent = intents.get(id);
    if (!intent) {
      throw new Error(`PaymentIntent local desconocido: ${id}`);
    }
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
        id: "re_rh_patch_cancel_029_001",
        payment_intent: paymentIntentId,
        amount: amountMinor,
        currency: currency.toLowerCase(),
        status: "succeeded",
        created: 1_800_000_022,
      };
    }
  );

  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error(
        "No se configuró el webhook local de QA-RH-FIN-CANDIDATE-029"
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
 * FULL LOCAL MOCK: stripe.service queda sustituido antes de importar app.
 * PaymentIntent, cancelaciones, refunds y webhooks existen solo en memoria;
 * este archivo no carga Stripe real ni efectúa llamadas de red.
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

import { QueryTypes } from "sequelize";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { reservationFinancialExposure } from "../../src/services/pago.service";
import { createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-RH-FIN-CANDIDATE-029: PATCH no cancela una ReservaHabitacion con PaymentIntent procesando";

interface ReservationRow {
  id: number;
  estado: string;
  total: string;
}

interface PaymentRow {
  id: number;
  reserva_habitacion_id: number;
  monto: string;
  metodo: string;
  estado: string;
  moneda: string;
  id_transaccion_externo: string;
  approved_refunds: string;
}

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
  const date = new Date(
    Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day") + days
    )
  );
  return date.toISOString().slice(0, 10);
};

const persistedSnapshot = async (reservationId: number) => {
  const reservations = (await sequelize.query(
    `
      SELECT id, estado, total::numeric(10, 2)::text AS total
      FROM reservas_habitacion
      WHERE id = :reservationId;
    `,
    {
      replacements: { reservationId },
      type: QueryTypes.SELECT,
    }
  )) as ReservationRow[];
  const payments = (await sequelize.query(
    `
      SELECT
        p.id,
        p.reserva_habitacion_id,
        p.monto::numeric(10, 2)::text AS monto,
        p.metodo,
        p.estado,
        p.moneda,
        p.id_transaccion_externo,
        COALESCE(SUM(r.monto) FILTER (WHERE r.estado = 'aprobado'), 0)
          ::numeric(10, 2)::text AS approved_refunds
      FROM pagos p
      LEFT JOIN reembolsos r ON r.pago_id = p.id
      WHERE p.reserva_habitacion_id = :reservationId
      GROUP BY p.id
      ORDER BY p.id ASC;
    `,
    {
      replacements: { reservationId },
      type: QueryTypes.SELECT,
    }
  )) as PaymentRow[];
  const approvedStates = new Set([
    "aprobado",
    "reembolsado_parcial",
    "reembolsado",
  ]);
  const approved = payments.reduce(
    (sum, payment) =>
      approvedStates.has(payment.estado)
        ? sum +
          Math.max(
            0,
            Number(payment.monto) - Number(payment.approved_refunds)
          )
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
    reservationCount: reservations.length,
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

describe("PATCH de cancelación financiera de ReservaHabitacion", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const gerente = await createAuthenticatedUser({
        rol: ROLES.GERENTE_HABITACIONES,
      });
      const hotel = await createHotelFixture({ capacidad: 2, tarifa: 100 });
      const clientAuthorization = `Bearer ${cliente.token}`;
      const managerAuthorization = `Bearer ${gerente.token}`;
      const fechaEntrada = getHotelDatePlusDays(10);
      const fechaSalida = getHotelDatePlusDays(11);

      const reservationResponse = await request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", clientAuthorization)
        .send({
          habitacion_id: hotel.habitacion.id,
          fecha_entrada: fechaEntrada,
          fecha_salida: fechaSalida,
          numero_huespedes: 1,
        });

      expect(reservationResponse.status).toBe(201);
      expect(reservationResponse.body.data).toMatchObject({
        estado: "pendiente",
        total: "100.00",
      });
      const reservationId = Number(reservationResponse.body.data.id);

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", clientAuthorization)
        .send({
          reserva_habitacion_id: reservationId,
          monto: 100,
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-rh-fin-candidate-029-direct",
        });

      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.body.data).toMatchObject({
        estado: "procesando",
        monto: "100.00",
        payment_intent_id: "pi_rh_patch_cancel_029_001",
      });
      const paymentId = Number(paymentResponse.body.data.pago_id);
      const intent = stripeMock.intents.get("pi_rh_patch_cancel_029_001");
      expect(intent).toBeDefined();
      expect(intent!.status).toBe("requires_payment_method");
      expect(intent!.amount).toBe(10000);
      expect(intent!.currency).toBe("gtq");
      expect(intent!.metadata).toMatchObject({
        pago_id: String(paymentId),
        reserva_habitacion_id: String(reservationId),
        tipo_pago: "total",
      });

      const beforeCancellation = await persistedSnapshot(reservationId);
      const beforeExposure = await reservationFinancialExposure(
        reservationId,
        undefined
      );
      expect(beforeCancellation.reservation).toMatchObject({
        id: reservationId,
        estado: "pendiente",
        total: "100.00",
      });
      expect(beforeCancellation.payments).toHaveLength(1);
      expect(beforeCancellation.payments[0]).toMatchObject({
        id: paymentId,
        reserva_habitacion_id: reservationId,
        monto: "100.00",
        metodo: "tarjeta",
        estado: "procesando",
        moneda: "GTQ",
        id_transaccion_externo: intent!.id,
      });
      expect(beforeCancellation.approved).toBe(0);
      expect(beforeCancellation.processing).toBe(100);
      expect(beforeExposure).toEqual({
        approved: 0,
        processing: 100,
        total: 100,
      });

      const cancellationResponse = await request(app)
        .patch(`/api/reservas-habitacion/${reservationId}`)
        .set("Authorization", managerAuthorization)
        .send({ estado: "cancelada" });
      const afterCancellation = await persistedSnapshot(reservationId);
      const afterCancellationExposure = await reservationFinancialExposure(
        reservationId,
        undefined
      );
      const intentStatusAfterPatch = intent!.status;
      const cancelCallsAfterPatch = [...stripeMock.cancelCalls];
      const cancellationRejectedSafely =
        cancellationResponse.status === 409 &&
        cancellationResponse.body.code ===
          "RESERVATION_HAS_PROCESSING_PAYMENT" &&
        afterCancellation.reservation?.estado === "pendiente" &&
        afterCancellation.reservation?.total === "100.00" &&
        afterCancellation.payments.length === 1 &&
        afterCancellation.payments[0]?.estado === "procesando" &&
        afterCancellation.approved === 0 &&
        afterCancellation.processing === 100 &&
        afterCancellationExposure.approved === 0 &&
        afterCancellationExposure.processing === 100 &&
        afterCancellationExposure.total === 100 &&
        intentStatusAfterPatch !== "canceled" &&
        cancelCallsAfterPatch.length === 0;
      const cancellationPermitted =
        [200, 204].includes(cancellationResponse.status) &&
        afterCancellation.reservation?.estado === "cancelada";
      const uncanceledProcessingWindow =
        cancellationPermitted &&
        afterCancellation.payments.length === 1 &&
        afterCancellation.payments[0]?.estado === "procesando" &&
        intent!.status !== "canceled" &&
        stripeMock.cancelCalls.length === 0;

      let firstWebhookResponse: any = null;
      let secondWebhookResponse: any = null;
      let afterFirstWebhook = afterCancellation;
      let afterSecondWebhook = afterCancellation;
      let afterFirstWebhookExposure = afterCancellationExposure;
      let afterSecondWebhookExposure = afterCancellationExposure;
      let webhookEvent: any = null;

      if (cancellationPermitted) {
        expect.soft(
          afterCancellation.payments[0]?.estado,
          "Si PATCH permite cancelar, el Pago original debe seguir observable como procesando antes del webhook"
        ).toBe("procesando");
        expect.soft(
          intent!.status,
          "Si PATCH permite cancelar, el PaymentIntent asociado no debe haber sido cancelado silenciosamente"
        ).not.toBe("canceled");

        // Única mutación externa simulada: el intent original llega a succeeded.
        intent!.status = "succeeded";
        stripeMock.events.push({
          type: "PAYMENT_INTENT_SUCCEEDED_EXTERNALLY",
          intentId: intent!.id,
        });
        webhookEvent = {
          id: "evt_rh_patch_cancel_029_001",
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
        afterFirstWebhookExposure = await reservationFinancialExposure(
          reservationId,
          undefined
        );

        // Replay exacto: mismo id, tipo y objeto del primer delivery.
        secondWebhookResponse = await sendWebhook(webhookEvent);
        afterSecondWebhook = await persistedSnapshot(reservationId);
        afterSecondWebhookExposure = await reservationFinancialExposure(
          reservationId,
          undefined
        );
      }

      const externalSucceeded = intent!.status === "succeeded";
      const externalNet = externalSucceeded
        ? Math.max(0, intent!.amount - intent!.refundedAmount) / 100
        : 0;
      const divergenceAfterFirst = Math.max(
        0,
        externalNet - afterFirstWebhook.approved
      );
      const divergenceAfterReplay = Math.max(
        0,
        externalNet - afterSecondWebhook.approved
      );
      const cancellationAllowsChargeableWindow = uncanceledProcessingWindow;
      const succeededWithoutDurableReconciliation =
        externalSucceeded &&
        divergenceAfterReplay > 0 &&
        afterSecondWebhook.payments[0]?.estado === "procesando" &&
        afterSecondWebhook.approvedRefunds === 0;
      const canceledReservationReceivesIncoherentCharge =
        externalNet > 0 &&
        afterSecondWebhook.reservation?.estado === "cancelada";
      const webhookAcceptedAgainstTerminalReservation =
        cancellationPermitted &&
        firstWebhookResponse?.status === 200 &&
        afterFirstWebhook.reservation?.estado === "cancelada";
      const financialViolation =
        cancellationPermitted ||
        cancellationAllowsChargeableWindow ||
        succeededWithoutDurableReconciliation ||
        canceledReservationReceivesIncoherentCharge ||
        webhookAcceptedAgainstTerminalReservation;
      const unexpected500 = [
        reservationResponse,
        paymentResponse,
        cancellationResponse,
        firstWebhookResponse,
        secondWebhookResponse,
      ].some((response) => response?.status === 500);

      const evidence = {
        qaId: "QA-RH-FIN-CANDIDATE-029",
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        paymentMethod: "tarjeta",
        ids: {
          reservationId,
          paymentId,
          paymentIntentId: intent!.id,
          webhookEventId: webhookEvent?.id ?? null,
        },
        beforeCancellation: {
          reservation: beforeCancellation.reservation,
          payments: beforeCancellation.payments,
          approved: beforeCancellation.approved.toFixed(2),
          processing: beforeCancellation.processing.toFixed(2),
          helperExposure: beforeExposure,
        },
        cancellation: {
          endpoint: `PATCH /api/reservas-habitacion/${reservationId}`,
          payload: { estado: "cancelada" },
          http: cancellationResponse.status,
          code: cancellationResponse.body.code ?? null,
          body: cancellationResponse.body,
          rejectedSafely: cancellationRejectedSafely,
          permitted: cancellationPermitted,
          uncanceledProcessingWindow,
          database: afterCancellation,
          helperExposure: afterCancellationExposure,
          intentStatus: intentStatusAfterPatch,
          intentCanceled: intentStatusAfterPatch === "canceled",
          cancelCalls: cancelCallsAfterPatch,
        },
        webhook: {
          executed: cancellationPermitted,
          externalIntentState: intent!.status,
          first: firstWebhookResponse
            ? {
                http: firstWebhookResponse.status,
                code: firstWebhookResponse.body.code ?? null,
                body: firstWebhookResponse.body,
                database: afterFirstWebhook,
                helperExposure: afterFirstWebhookExposure,
                divergence: divergenceAfterFirst.toFixed(2),
              }
            : "NOT RUN: cancellation blocked or intent compensated",
          exactReplay: secondWebhookResponse
            ? {
                http: secondWebhookResponse.status,
                code: secondWebhookResponse.body.code ?? null,
                body: secondWebhookResponse.body,
                database: afterSecondWebhook,
                helperExposure: afterSecondWebhookExposure,
                divergence: divergenceAfterReplay.toFixed(2),
              }
            : "NOT RUN: cancellation blocked or intent compensated",
          sameEventDeliveredTwice:
            stripeMock.constructEvent.mock.calls.length === 2,
        },
        stripe: {
          intent: { ...intent },
          intentCount: stripeMock.intents.size,
          createCalls: stripeMock.createPaymentIntent.mock.calls.length,
          retrieveCalls: stripeMock.retrievePaymentIntent.mock.calls.length,
          cancelCalls: [...stripeMock.cancelCalls],
          refundCalls: [...stripeMock.refundCalls],
          constructEventCalls: stripeMock.constructEvent.mock.calls.length,
          events: stripeMock.events,
        },
        finalDatabase: {
          reservation: afterSecondWebhook.reservation,
          payments: afterSecondWebhook.payments,
          reservationCount: afterSecondWebhook.reservationCount,
          paymentCount: afterSecondWebhook.payments.length,
          approved: afterSecondWebhook.approved.toFixed(2),
          processing: afterSecondWebhook.processing.toFixed(2),
          approvedRefunds: afterSecondWebhook.approvedRefunds.toFixed(2),
          helperExposure: afterSecondWebhookExposure,
        },
        financial: {
          externalNet: externalNet.toFixed(2),
          localApprovedNet: afterSecondWebhook.approved.toFixed(2),
          divergenceAfterFirst: divergenceAfterFirst.toFixed(2),
          divergenceAfterReplay: divergenceAfterReplay.toFixed(2),
          cancellationAllowsChargeableWindow,
          succeededWithoutDurableReconciliation,
          canceledReservationReceivesIncoherentCharge,
          webhookAcceptedAgainstTerminalReservation,
          financialViolation,
        },
        http: { unexpected500 },
        regressionObserved: {
          qa022:
            "DELETE no se ejerció; esta prueba usa exclusivamente PATCH y no modifica ni reabre QA-022",
          qa021:
            "payload exclusivamente estado=cancelada; no se mutaron campos económicos ni se reabre QA-021",
          qa028:
            "el Pago permanece procesando y approved=0 antes del PATCH; no es el escenario aprobado de QA-028",
          existingTestsModified: false,
        },
        expected: {
          safeOutcome:
            "PATCH 409 RESERVATION_HAS_PROCESSING_PAYMENT, reserva pendiente, Pago procesando, intent asociado no cancelado y webhook no ejecutado",
          financialViolation: false,
          unexpected500: false,
        },
      };

      console.log(
        "[QA-RH-FIN-CANDIDATE-029]",
        JSON.stringify(evidence, null, 2)
      );

      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.intents).toHaveLength(1);
      expect(afterSecondWebhook.payments).toHaveLength(1);
      expect.soft(unexpected500, "El ciclo no debe producir HTTP 500").toBe(
        false
      );
      expect.soft(
        cancellationResponse.status,
        "PATCH estado=cancelada debe bloquearse mientras processing > 0"
      ).toBe(409);
      expect.soft(
        cancellationResponse.body.code,
        "PATCH debe usar el código financiero específico"
      ).toBe("RESERVATION_HAS_PROCESSING_PAYMENT");
      expect.soft(
        cancellationRejectedSafely,
        "PATCH debe conservar reserva pendiente, Pago procesando y exposición Q100"
      ).toBe(true);
      expect.soft(
        stripeMock.constructEvent.mock.calls.length,
        "El webhook no corre si PATCH es bloqueado; si el bypass ocurre se entrega y repite exactamente el mismo succeeded"
      ).toBe(cancellationPermitted ? 2 : 0);
      expect.soft(
        financialViolation,
        "PATCH no debe cancelar con exposición procesando ni dejar divergencia o cobro incoherente sobre una reserva cancelada"
      ).toBe(false);
    },
    30000
  );
});
