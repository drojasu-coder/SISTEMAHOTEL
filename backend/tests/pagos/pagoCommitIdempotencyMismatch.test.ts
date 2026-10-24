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

  const intentsByKey = new Map<string, IntentState>();
  const events: Array<Record<string, unknown>> = [];
  const webhook = { event: null as any };
  let logicalCreates = 0;

  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => {
      if (!idempotencyKey) {
        throw new Error(
          "QA-PAY-TX-CANDIDATE-015 exige una idempotency key"
        );
      }

      const existing = intentsByKey.get(idempotencyKey);
      if (existing) {
        events.push({
          event: "STRIPE_IDEMPOTENT_REPLAY",
          intentId: existing.id,
          idempotencyKey,
          requestedMetadataPagoId: metadata.pago_id,
          preservedMetadataPagoId: existing.metadata.pago_id,
        });
        return { ...existing, metadata: { ...existing.metadata } };
      }

      logicalCreates += 1;
      const intent: IntentState = {
        id: "pi_commit_001",
        status: "requires_payment_method",
        client_secret: "pi_commit_001_secret_qa_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };
      intentsByKey.set(idempotencyKey, intent);
      events.push({
        event: "STRIPE_CREATE_SUCCESS",
        intentId: intent.id,
        idempotencyKey,
        metadataPagoId: intent.metadata.pago_id,
      });
      return { ...intent, metadata: { ...intent.metadata } };
    }
  );

  const updatePaymentIntentMetadata = vi.fn(
    async (intentId: string, metadata: Record<string, string>) => {
      const intentEntry = Array.from(intentsByKey.entries()).find(
        ([, intent]) => intent.id === intentId
      );
      if (!intentEntry) {
        throw new Error(
          `PaymentIntent inexistente en mock Stripe: ${intentId}`
        );
      }

      const [idempotencyKey, intent] = intentEntry;
      const previousMetadata = { ...intent.metadata };

      // Equivale a paymentIntents.update(id, { metadata }): únicamente la
      // llamada explícita de producción puede reconciliar estos metadatos.
      intent.metadata = { ...intent.metadata, ...metadata };
      events.push({
        event: "STRIPE_METADATA_UPDATE",
        intentId: intent.id,
        idempotencyKey,
        previousMetadata,
        requestedMetadata: { ...metadata },
        finalMetadata: { ...intent.metadata },
      });

      return { ...intent, metadata: { ...intent.metadata } };
    }
  );

  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error("No se configuró el webhook Stripe local");
    }
    return webhook.event;
  });

  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-PAY-TX-CANDIDATE-015`
      );
    });

  return {
    intentsByKey,
    events,
    webhook,
    createPaymentIntent,
    updatePaymentIntentMetadata,
    constructEvent,
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
    createRefund: forbidden("createRefund"),
    logicalCreateCount: () => logicalCreates,
  };
});

/**
 * Mock local completo. El SDK de Stripe no se evalúa y la idempotencia se
 * comporta como Stripe: la misma key devuelve el intent original sin reemplazar
 * metadata. Este archivo no puede efectuar llamadas ni cargos reales.
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

import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createRecursoActividad } from "../fixtures/actividades";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const { Carrito, CarritoItem, Pago, ReservaActividad } = db;

const TEST_NAME =
  "QA-PAY-TX-CANDIDATE-015: conserva asociación reconciliable tras fallo de COMMIT y retry idempotente";

describe("Atomicidad COMMIT e idempotencia externa de pagos", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
        email: "qa-pay-tx-015@hotel.test",
      });
      const recurso = await createRecursoActividad({
        nombre: "Recurso QA COMMIT idempotente",
        precio_hora: "100.00",
      });
      const authorization = `Bearer ${cliente.token}`;

      const reservaResponse = await request(app)
        .post("/api/reservas-actividad")
        .set("Authorization", authorization)
        .send({
          recurso_id: recurso.id,
          fecha: "2027-06-20",
          hora_inicio: "10:00",
          hora_fin: "11:00",
          con_equipo: false,
        });

      expect(reservaResponse.status).toBe(201);
      expect(reservaResponse.body.data.total).toBe("100.00");
      const reserva = await ReservaActividad.findByPk(
        reservaResponse.body.data.id
      );
      expect(reserva).not.toBeNull();
      expect(reserva.total).toBe("100.00");

      const cartResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", authorization)
        .send({});
      expect(cartResponse.status).toBe(201);
      const carritoId = Number(cartResponse.body.data.id);

      const itemResponse = await request(app)
        .post(`/api/carritos/${carritoId}/items`)
        .set("Authorization", authorization)
        .send({
          tipo_item: "actividad",
          referencia_id: reserva.id,
        });
      expect(itemResponse.status).toBe(201);
      expect(itemResponse.body.data.precio).toBe("100.00");

      const items = await CarritoItem.findAll({
        where: { carrito_id: carritoId },
      });
      expect(items).toHaveLength(1);
      expect(
        items.reduce(
          (sum: number, item: any) =>
            sum + Number(item.precio) * Number(item.cantidad),
          0
        )
      ).toBe(100);

      const idempotencyKey = "qa-pay-tx-015-commit-key";
      const paymentPayload = {
        carrito_id: carritoId,
        monto: "100.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: idempotencyKey,
      };

      const queryInterface: any = db.sequelize.getQueryInterface();
      const originalCommitTransaction = queryInterface.commitTransaction;
      const originalRollbackTransaction = queryInterface.rollbackTransaction;
      const originalPagoUpdate = Pago.prototype.update;
      let commitFailureInjected = 0;
      let externalIdUpdateCompleted = 0;

      const updateSpy = vi
        .spyOn(Pago.prototype, "update")
        .mockImplementation(async function (
          this: any,
          values: Record<string, unknown>,
          options?: Record<string, unknown>
        ) {
          const result = await originalPagoUpdate.call(this, values, options);
          if (values.id_transaccion_externo === "pi_commit_001") {
            externalIdUpdateCompleted += 1;
            stripeMock.events.push({
              event: "LOCAL_EXTERNAL_ID_UPDATE_SUCCESS",
              paymentId: Number(this.id),
              externalId: values.id_transaccion_externo,
            });
          }
          return result;
        });

      const commitSpy = vi
        .spyOn(queryInterface, "commitTransaction")
        .mockImplementation(async function (
          this: any,
          transaction: any,
          options?: Record<string, unknown>
        ) {
          const stripeSucceeded = stripeMock.events.some(
            (event) => event.event === "STRIPE_CREATE_SUCCESS"
          );
          const associationUpdated = stripeMock.events.some(
            (event) => event.event === "LOCAL_EXTERNAL_ID_UPDATE_SUCCESS"
          );

          if (
            commitFailureInjected === 0 &&
            stripeSucceeded &&
            associationUpdated
          ) {
            commitFailureInjected += 1;
            stripeMock.events.push({
              event: "COMMIT_FAILURE_INJECTED",
              afterStripeSuccess: stripeSucceeded,
              afterLocalExternalIdUpdate: associationUpdated,
            });

            // Simula que PostgreSQL aborta la transacción justo al intentar
            // COMMIT. No falla Pago.update ni ninguna operación anterior.
            await originalRollbackTransaction.call(
              this,
              transaction,
              options
            );
            throw new Error("QA injected COMMIT failure");
          }

          return originalCommitTransaction.call(this, transaction, options);
        });

      let firstResponse: any;
      try {
        firstResponse = await request(app)
          .post("/api/pagos")
          .set("Authorization", authorization)
          .send(paymentPayload);
      } finally {
        commitSpy.mockRestore();
        updateSpy.mockRestore();
      }

      const firstIntent = stripeMock.intentsByKey.get(idempotencyKey);
      const firstIntentMetadataPagoId = firstIntent?.metadata.pago_id ?? null;
      const firstLocalPaymentId = Number(firstIntentMetadataPagoId);
      const paymentsAfterFirst = await Pago.findAll({
        where: { carrito_id: carritoId },
        order: [["id", "ASC"]],
      });
      const firstPaymentDurable = await Pago.findByPk(firstLocalPaymentId);
      const cartAfterFirst = await Carrito.findByPk(carritoId);
      const itemsAfterFirst = await CarritoItem.findAll({
        where: { carrito_id: carritoId },
      });

      const retryResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send(paymentPayload);

      const retryLocalPaymentId = Number(
        retryResponse.body.data?.pago_id ?? retryResponse.body.data?.id
      );
      const retryIntentId = retryResponse.body.data?.payment_intent_id ?? null;
      const intentAfterRetry = stripeMock.intentsByKey.get(idempotencyKey)!;
      const paymentsAfterRetry = await Pago.findAll({
        where: { carrito_id: carritoId },
        order: [["id", "ASC"]],
      });
      const retryPayment = await Pago.findByPk(retryLocalPaymentId);
      const localExternalPagoIdMatch =
        intentAfterRetry.metadata.pago_id === String(retryLocalPaymentId);

      intentAfterRetry.status = "succeeded";
      stripeMock.webhook.event = {
        id: "evt_commit_001",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: intentAfterRetry.id,
            status: intentAfterRetry.status,
            amount: intentAfterRetry.amount,
            currency: intentAfterRetry.currency,
            metadata: { ...intentAfterRetry.metadata },
          },
        },
      };

      const webhookResponse: any = await request(app)
        .post("/api/pagos/stripe/webhook")
        .set("Stripe-Signature", "t=1,v1=qa-local-signature")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ id: "evt_commit_001" }));

      const finalPayment = await Pago.findByPk(retryLocalPaymentId);
      const finalCart = await Carrito.findByPk(carritoId);
      const stripeSuccessIndex = stripeMock.events.findIndex(
        (event) => event.event === "STRIPE_CREATE_SUCCESS"
      );
      const localUpdateIndex = stripeMock.events.findIndex(
        (event) => event.event === "LOCAL_EXTERNAL_ID_UPDATE_SUCCESS"
      );
      const commitFailureIndex = stripeMock.events.findIndex(
        (event) => event.event === "COMMIT_FAILURE_INJECTED"
      );
      const failureAfterStripeSuccess =
        stripeSuccessIndex >= 0 && commitFailureIndex > stripeSuccessIndex;
      const failureAfterLocalExternalIdUpdate =
        localUpdateIndex >= 0 && commitFailureIndex > localUpdateIndex;
      const firstTransactionRollback =
        paymentsAfterFirst.length === 0 && firstPaymentDurable === null;
      const metadataUpdateCalls =
        stripeMock.updatePaymentIntentMetadata.mock.calls.length;
      const metadataUpdateEvents = stripeMock.events.filter(
        (event) => event.event === "STRIPE_METADATA_UPDATE"
      ).length;
      const reconciliationFailure =
        !localExternalPagoIdMatch ||
        webhookResponse?.status !== 200 ||
        finalPayment?.estado !== "aprobado";

      const evidence = {
        qaId: "QA-PAY-TX-CANDIDATE-015",
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCharges: false,
        setup: {
          reservationTotalHttp: reservaResponse.body.data.total,
          reservationTotalDatabase: reserva.total,
          cartItemPrice: itemResponse.body.data.precio,
          cartTotalDatabase: "100.00",
        },
        chronologicalEvents: stripeMock.events,
        firstAttempt: {
          http: {
            status: firstResponse.status,
            code: firstResponse.body.code ?? null,
            body: firstResponse.body,
          },
          localPaymentId: firstLocalPaymentId,
          stripeIntentId: firstIntent?.id ?? null,
          intentMetadataPagoId: firstIntentMetadataPagoId,
          commitFailureInjected: commitFailureInjected === 1,
          externalIdUpdateCompleted,
          failureAfterStripeSuccess,
          failureAfterLocalExternalIdUpdate,
          transactionRollback: firstTransactionRollback,
          localPaymentDurable: Boolean(firstPaymentDurable),
          databasePaymentCount: paymentsAfterFirst.length,
          cartState: cartAfterFirst?.estado ?? null,
          cartItems: itemsAfterFirst.length,
        },
        retry: {
          sameIdempotencyKey:
            stripeMock.createPaymentIntent.mock.calls.length === 2 &&
            stripeMock.createPaymentIntent.mock.calls.every(
              (call) => call[3] === idempotencyKey
            ),
          http: {
            status: retryResponse.status,
            code: retryResponse.body.code ?? null,
            body: retryResponse.body,
          },
          localPaymentId: retryLocalPaymentId,
          paymentIntentId: retryIntentId,
          externalCreateInvocations:
            stripeMock.createPaymentIntent.mock.calls.length,
          externalLogicalCreates: stripeMock.logicalCreateCount(),
          metadataUpdateCalls,
          intentMetadataPagoId: intentAfterRetry.metadata.pago_id,
          localExternalPagoIdMatch,
          databasePayments: paymentsAfterRetry.map((payment: any) => ({
            id: Number(payment.id),
            estado: payment.estado,
            monto: payment.monto,
            externalId: payment.id_transaccion_externo,
            idempotencyKey: payment.idempotency_key,
          })),
        },
        webhook: webhookResponse
          ? {
              status: webhookResponse.status,
              code: webhookResponse.body.code ?? null,
              body: webhookResponse.body,
            }
          : "NOT RUN",
        final: {
          payment: finalPayment?.toJSON() ?? null,
          cart: finalCart?.toJSON() ?? null,
          externalIntent: { ...intentAfterRetry },
          finalMetadataPagoId: intentAfterRetry.metadata.pago_id,
          metadataUpdateCalls,
          reconciliationFailure,
          financialViolation: reconciliationFailure,
        },
        expected: {
          localExternalPagoIdMatch: true,
          finalMetadataPagoId: String(retryLocalPaymentId),
          webhookStatus: 200,
          paymentState: "aprobado",
          cartState: "pagado",
          reconciliationFailure: false,
          financialViolation: false,
        },
      };

      console.log(
        "[QA-PAY-TX-CANDIDATE-015]",
        JSON.stringify(evidence, null, 2)
      );

      // Primero se descarta que el RED provenga del setup o de la inyección.
      expect(firstResponse.status).toBe(500);
      expect(firstResponse.body.code).toBe("INTERNAL_SERVER_ERROR");
      expect(firstIntent?.id).toBe("pi_commit_001");
      expect(Number.isInteger(firstLocalPaymentId)).toBe(true);
      expect(commitFailureInjected).toBe(1);
      expect(externalIdUpdateCompleted).toBe(1);
      expect(failureAfterStripeSuccess).toBe(true);
      expect(failureAfterLocalExternalIdUpdate).toBe(true);
      expect(firstTransactionRollback).toBe(true);
      expect(firstPaymentDurable).toBeNull();
      expect(cartAfterFirst.estado).toBe("activo");
      expect(itemsAfterFirst).toHaveLength(1);

      expect(retryResponse.status).toBe(201);
      expect(retryIntentId).toBe("pi_commit_001");
      expect(retryLocalPaymentId).not.toBe(firstLocalPaymentId);
      expect(paymentsAfterRetry).toHaveLength(1);
      expect(retryPayment).not.toBeNull();
      expect(retryPayment.id_transaccion_externo).toBe("pi_commit_001");
      expect(retryPayment.idempotency_key).toBe(idempotencyKey);
      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(2);
      expect(stripeMock.logicalCreateCount()).toBe(1);
      expect(metadataUpdateEvents).toBe(metadataUpdateCalls);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
      expect(stripeMock.constructEvent).toHaveBeenCalledTimes(1);

      // Invariante RED: el Pago durable B debe ser el pago identificado por la
      // metadata reconciliada explícitamente, y succeeded debe reconciliar B y carrito.
      expect(
        {
          localExternalPagoIdMatch,
          finalMetadataPagoId: intentAfterRetry.metadata.pago_id,
          webhookStatus: webhookResponse?.status ?? null,
          paymentState: finalPayment?.estado ?? null,
          cartState: finalCart?.estado ?? null,
          reconciliationFailure,
          financialViolation: reconciliationFailure,
        },
        "El retry idempotente no debe asociar B a un PaymentIntent cuya metadata aún identifica al Pago A rollbackeado"
      ).toEqual({
        localExternalPagoIdMatch: true,
        finalMetadataPagoId: String(retryLocalPaymentId),
        webhookStatus: 200,
        paymentState: "aprobado",
        cartState: "pagado",
        reconciliationFailure: false,
        financialViolation: false,
      });
    },
    30000
  );
});
