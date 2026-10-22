import { describe, expect, it, vi } from "vitest";

const stripeMock = vi.hoisted(() => {
  type LocalIntent = {
    id: string;
    status: string;
    client_secret: string;
    amount: number;
    currency: string;
    metadata: Record<string, string>;
    idempotency_key?: string;
  };

  let sequence = 0;
  const intents = new Map<string, LocalIntent>();
  const webhook = { event: null as any };
  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => {
      sequence += 1;
      const id = `pi_pay_conc_018_${sequence}`;
      const intent: LocalIntent = {
        id,
        status: "requires_payment_method",
        client_secret: `${id}_secret_qa_local`,
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };
      intents.set(id, intent);
      return { ...intent, metadata: { ...intent.metadata } };
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
      throw new Error(`${method} no permitido en QA-PAY-CONC-CANDIDATE-018`);
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
 * Mock local completo. El módulo real y el SDK de Stripe no se evalúan; todos
 * los intents y eventos existen solo en memoria y no pueden generar cargos.
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
const { Carrito, Pago, Reembolso, ReservaActividad } = db;

const withTimeout = async <T>(
  promise: Promise<T>,
  milliseconds: number,
  label: string
): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} excedió ${milliseconds} ms`)),
          milliseconds
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const errorCodes = (error: any) => ({
  code: error?.code ?? null,
  originalCode: error?.original?.code ?? null,
  parentCode: error?.parent?.code ?? null,
  causeCode: error?.cause?.code ?? null,
  name: error?.name ?? null,
  message: error?.message ?? null,
});

const isDeadlock = (error: any) =>
  [
    error?.code,
    error?.original?.code,
    error?.parent?.code,
    error?.cause?.code,
  ].includes("40P01");

const setupCartWithApprovedStripePayment = async () => {
  const cliente = await createAuthenticatedUser({
    rol: ROLES.CLIENTE,
    email: "qa-pay-conc-018@hotel.test",
  });
  const recurso = await createRecursoActividad({
    nombre: "Recurso QA lock order 018",
    precio_hora: "100.00",
  });

  const reservaResponse = await request(app)
    .post("/api/reservas-actividad")
    .set("Authorization", `Bearer ${cliente.token}`)
    .send({
      recurso_id: recurso.id,
      fecha: "2027-08-18",
      hora_inicio: "10:00",
      hora_fin: "11:00",
      con_equipo: false,
    });
  expect(reservaResponse.status).toBe(201);
  expect(reservaResponse.body.data.total).toBe("100.00");

  const reserva = await ReservaActividad.findByPk(reservaResponse.body.data.id);
  expect(reserva).not.toBeNull();
  expect(reserva.total).toBe("100.00");

  const cartResponse = await request(app)
    .post("/api/carritos")
    .set("Authorization", `Bearer ${cliente.token}`)
    .send({});
  expect(cartResponse.status).toBe(201);
  const carritoId = Number(cartResponse.body.data.id);

  const itemResponse = await request(app)
    .post(`/api/carritos/${carritoId}/items`)
    .set("Authorization", `Bearer ${cliente.token}`)
    .send({ tipo_item: "actividad", referencia_id: reserva.id });
  expect(itemResponse.status).toBe(201);
  expect(itemResponse.body.data.precio).toBe("100.00");

  const initialPaymentResponse = await request(app)
    .post("/api/pagos")
    .set("Authorization", `Bearer ${cliente.token}`)
    .send({
      carrito_id: carritoId,
      monto: "40.00",
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      idempotency_key: "qa-pay-conc-018-p0",
    });
  expect(initialPaymentResponse.status).toBe(201);
  const paymentId = Number(initialPaymentResponse.body.data.pago_id);
  const intentId = String(initialPaymentResponse.body.data.payment_intent_id);
  const intent = stripeMock.intents.get(intentId);
  expect(intent).toBeDefined();
  expect(intent?.amount).toBe(4000);

  stripeMock.webhook.event = {
    id: "evt_pay_conc_018_initial",
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: intentId,
        status: "succeeded",
        amount: intent!.amount,
        currency: intent!.currency,
        metadata: { ...intent!.metadata },
      },
    },
  };

  const initialWebhookResponse = await request(app)
    .post("/api/pagos/stripe/webhook")
    .set("Stripe-Signature", "t=1,v1=qa-local-signature")
    .set("Content-Type", "application/json")
    .send(JSON.stringify({ id: "evt_pay_conc_018_initial" }));
  expect(initialWebhookResponse.status).toBe(200);

  const [payment, cart] = await Promise.all([
    Pago.findByPk(paymentId),
    Carrito.findByPk(carritoId),
  ]);
  expect(payment?.estado).toBe("aprobado");
  expect(payment?.monto).toBe("40.00");
  expect(cart?.estado).toBe("activo");

  return {
    token: cliente.token,
    carritoId,
    paymentId,
    intentId,
    replayEvent: {
      id: "evt_pay_conc_018_replay",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: intentId,
          status: "succeeded",
          amount: intent!.amount,
          currency: intent!.currency,
          metadata: { ...intent!.metadata },
        },
      },
    },
  };
};

describe("QA-PAY-CONC-CANDIDATE-018 lock order createPago/webhook", () => {
  it(
    "QA-PAY-CONC-CANDIDATE-018: createPago y replay webhook no deben formar deadlock por orden inverso",
    async () => {
      const setup = await setupCartWithApprovedStripePayment();
      const capturedLockErrors: Array<{ path: string; error: any }> = [];
      const lockTrace: string[] = [];
      let webhookTransaction: any = null;
      let createPagoTransaction: any = null;
      let initialUnlockedLookupObserved = false;
      let createCartLockObserved = false;
      let createPaymentLockObserved = false;
      let webhookCartLockObserved = false;
      let webhookPaymentLockObserved = false;
      let pairTimedOut = false;

      const originalPagoFindOne = Pago.findOne.bind(Pago);
      const originalPagoFindAll = Pago.findAll.bind(Pago);
      const originalCartFindByPk = Carrito.findByPk.bind(Carrito);

      const pagoFindOneSpy = vi
        .spyOn(Pago, "findOne")
        .mockImplementation(async (...args: any[]) => {
          const options = args[0] ?? {};
          try {
            const result = await originalPagoFindOne(...args);
            if (
              options.where?.id_transaccion_externo === setup.intentId &&
              options.transaction &&
              !options.lock &&
              !initialUnlockedLookupObserved
            ) {
              webhookTransaction = options.transaction;
              initialUnlockedLookupObserved = true;
              lockTrace.push("webhook:PAGO:initial-unlocked-read");
            } else if (
              options.lock &&
              options.where?.id_transaccion_externo === setup.intentId &&
              options.transaction === webhookTransaction &&
              !webhookPaymentLockObserved
            ) {
              webhookPaymentLockObserved = true;
              lockTrace.push("webhook:PAGO:second-lock-acquired");
            }
            return result;
          } catch (error) {
            capturedLockErrors.push({ path: "Pago.findOne", error });
            throw error;
          }
        });

      const cartFindByPkSpy = vi
        .spyOn(Carrito, "findByPk")
        .mockImplementation(async (...args: any[]) => {
          const [id, options = {}] = args;
          try {
            const result = await originalCartFindByPk(...args);
            if (
              options.lock &&
              Number(id) === setup.carritoId &&
              options.transaction === webhookTransaction &&
              !webhookCartLockObserved
            ) {
              webhookCartLockObserved = true;
              lockTrace.push("webhook:CARRITO:first-lock-acquired");
            } else if (
              options.lock &&
              Number(id) === setup.carritoId &&
              options.transaction &&
              options.transaction !== webhookTransaction &&
              !createCartLockObserved
            ) {
              createPagoTransaction = options.transaction;
              createCartLockObserved = true;
              lockTrace.push("createPago:CARRITO:first-lock-acquired");
            }
            return result;
          } catch (error) {
            capturedLockErrors.push({ path: "Carrito.findByPk", error });
            throw error;
          }
        });

      const pagoFindAllSpy = vi
        .spyOn(Pago, "findAll")
        .mockImplementation(async (...args: any[]) => {
          const options = args[0] ?? {};
          try {
            const result = await originalPagoFindAll(...args);
            if (
              options.lock &&
              Number(options.where?.carrito_id) === setup.carritoId &&
              options.transaction === createPagoTransaction &&
              !createPaymentLockObserved
            ) {
              createPaymentLockObserved = true;
              lockTrace.push("createPago:PAGO:second-lock-acquired");
            }
            return result;
          } catch (error) {
            capturedLockErrors.push({ path: "Pago.findAll", error });
            throw error;
          }
        });

      stripeMock.webhook.event = setup.replayEvent;

      let createResponse: any = null;
      let webhookResponse: any = null;
      try {
        const webhookPromise = request(app)
          .post("/api/pagos/stripe/webhook")
          .set("Stripe-Signature", "t=2,v1=qa-local-signature")
          .set("Content-Type", "application/json")
          .send(JSON.stringify({ id: "evt_pay_conc_018_replay" }))
          .then((response) => response);

        const createPromise = request(app)
          .post("/api/pagos")
          .set("Authorization", `Bearer ${setup.token}`)
          .send({
            carrito_id: setup.carritoId,
            monto: "60.00",
            metodo: "tarjeta",
            tipo_pago: "saldo",
            moneda: "GTQ",
            idempotency_key: "qa-pay-conc-018-balance",
          })
          .then((response) => response);

        try {
          [createResponse, webhookResponse] = await withTimeout(
            Promise.all([createPromise, webhookPromise]),
            12000,
            "par concurrente createPago/webhook"
          );
        } catch (error: any) {
          pairTimedOut = /excedió 12000 ms/.test(String(error?.message));
          throw error;
        }
      } finally {
        pagoFindOneSpy.mockRestore();
        cartFindByPkSpy.mockRestore();
        pagoFindAllSpy.mockRestore();
      }

      const payments = await Pago.findAll({
        where: { carrito_id: setup.carritoId },
        order: [["id", "ASC"]],
      });
      const refunds = await Reembolso.findAll({
        where: { pago_id: payments.map((payment: any) => payment.id) },
      });
      const cart = await Carrito.findByPk(setup.carritoId);
      const refundedByPayment = new Map<number, number>();
      for (const refund of refunds) {
        if (refund.estado !== "aprobado") continue;
        const paymentId = Number(refund.pago_id);
        refundedByPayment.set(
          paymentId,
          (refundedByPayment.get(paymentId) ?? 0) + Number(refund.monto)
        );
      }
      const approvedAmount = payments.reduce(
        (sum: number, payment: any) =>
          ["aprobado", "reembolsado_parcial", "reembolsado"].includes(
            payment.estado
          )
            ? sum +
              Math.max(
                0,
                Number(payment.monto) -
                  (refundedByPayment.get(Number(payment.id)) ?? 0)
              )
            : sum,
        0
      );
      const processingExposure = payments.reduce(
        (sum: number, payment: any) =>
          payment.estado === "procesando"
            ? sum + Number(payment.monto)
            : sum,
        0
      );
      const postgresErrors = capturedLockErrors.map(({ path, error }) => ({
        path,
        ...errorCodes(error),
      }));
      const deadlockObserved = capturedLockErrors.some(({ error }) =>
        isDeadlock(error)
      );
      const http500Observed =
        createResponse?.status === 500 || webhookResponse?.status === 500;
      const createPagoLockOrder = lockTrace
        .filter(
          (entry) =>
            entry.endsWith("lock-acquired") &&
            entry.startsWith("createPago:")
        )
        .map((entry) => entry.split(":")[1]);
      const webhookLockOrder = lockTrace
        .filter(
          (entry) =>
            entry.endsWith("lock-acquired") && entry.startsWith("webhook:")
        )
        .map((entry) => entry.split(":")[1]);
      const hasOrder = (order: string[], first: string, second: string) => {
        const firstIndex = order.indexOf(first);
        const secondIndex = order.indexOf(second);
        return firstIndex !== -1 && secondIndex > firstIndex;
      };
      const lockOrderInversion =
        hasOrder(createPagoLockOrder, "CARRITO", "PAGO") &&
        hasOrder(webhookLockOrder, "PAGO", "CARRITO");
      const totalActiveExposure = approvedAmount + processingExposure;
      const financialCorruption =
        approvedAmount < 0 ||
        totalActiveExposure > 100 ||
        payments.filter((payment: any) => payment.estado === "procesando")
          .length > 1;

      const evidence = {
        qaId: "QA-PAY-CONC-CANDIDATE-018",
        database: "hotel_test_db",
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCharges: 0,
        concurrentPairs: 1,
        synchronization: {
          method:
            "vi.spyOn sobre métodos reales; atribución por identidad de transaction, sin barreras entre locks FOR UPDATE",
          lockTrace,
          initialUnlockedLookupObserved,
          createPagoTransactionIdentified: Boolean(createPagoTransaction),
          webhookTransactionIdentified: Boolean(webhookTransaction),
          distinctTransactions:
            Boolean(createPagoTransaction) &&
            Boolean(webhookTransaction) &&
            createPagoTransaction !== webhookTransaction,
          createPagoLockOrder,
          webhookLockOrder,
          createPagoFirstLock: "Carrito.findByPk FOR UPDATE",
          createPagoSecondLock: "Pago.findAll FOR UPDATE (approvedAmount)",
          webhookInitialLookup: "Pago.findOne sin lock",
          webhookFirstLock: "Carrito.findByPk FOR UPDATE",
          webhookSecondLock: "Pago.findOne FOR UPDATE",
          lockOrderInversion,
        },
        http: {
          createPago: {
            status: createResponse?.status ?? null,
            code: createResponse?.body?.code ?? null,
            body: createResponse?.body ?? null,
          },
          webhook: {
            status: webhookResponse?.status ?? null,
            code: webhookResponse?.body?.code ?? null,
            body: webhookResponse?.body ?? null,
          },
          http500Observed,
        },
        postgres: {
          errors: postgresErrors,
          deadlockObserved,
          timeoutObserved: pairTimedOut,
        },
        finalDatabase: {
          paymentRows: payments.length,
          payments: payments.map((payment: any) => ({
            id: Number(payment.id),
            monto: payment.monto,
            estado: payment.estado,
            externalId: payment.id_transaccion_externo,
            tipoPago: payment.tipo_pago,
          })),
          cartState: cart?.estado ?? null,
          approvedAmount: approvedAmount.toFixed(2),
          processingExposure: processingExposure.toFixed(2),
          totalActiveExposure: totalActiveExposure.toFixed(2),
          financialCorruption,
        },
      };

      console.log(
        "[QA-PAY-CONC-CANDIDATE-018]",
        JSON.stringify(evidence, null, 2)
      );

      expect(lockTrace).toContain("webhook:PAGO:initial-unlocked-read");
      expect(lockTrace).toContain("createPago:CARRITO:first-lock-acquired");
      expect(lockTrace).toContain("webhook:CARRITO:first-lock-acquired");
      expect(lockTrace).toContain("createPago:PAGO:second-lock-acquired");
      expect(lockTrace).toContain("webhook:PAGO:second-lock-acquired");
      expect(initialUnlockedLookupObserved).toBe(true);
      expect(createPagoTransaction).not.toBeNull();
      expect(webhookTransaction).not.toBeNull();
      expect(createPagoTransaction).not.toBe(webhookTransaction);
      expect(createPagoLockOrder).toEqual(["CARRITO", "PAGO"]);
      expect(webhookLockOrder).toEqual(["CARRITO", "PAGO"]);
      expect.soft(
        lockOrderInversion,
        "createPago y webhook no deben adquirir Carrito/Pago en orden inverso"
      ).toBe(false);
      expect.soft(deadlockObserved, "PostgreSQL no debe emitir 40P01").toBe(
        false
      );
      expect.soft(pairTimedOut, "El par concurrente no debe expirar").toBe(false);
      expect.soft(http500Observed, "Ningún endpoint debe responder HTTP 500").toBe(
        false
      );
      expect.soft(createResponse?.status).toBe(201);
      expect.soft(webhookResponse?.status).toBe(200);
      expect.soft(payments).toHaveLength(2);
      expect.soft(payments[0]?.estado).toBe("aprobado");
      expect.soft(payments[0]?.monto).toBe("40.00");
      expect.soft(payments[1]?.estado).toBe("procesando");
      expect.soft(payments[1]?.monto).toBe("60.00");
      expect.soft(cart?.estado).toBe("activo");
      expect.soft(approvedAmount).toBe(40);
      expect.soft(processingExposure).toBe(60);
      expect.soft(totalActiveExposure).toBeLessThanOrEqual(100);
      expect.soft(financialCorruption).toBe(false);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
      expect(stripeMock.updatePaymentIntentMetadata).not.toHaveBeenCalled();
    },
    30000
  );
});
