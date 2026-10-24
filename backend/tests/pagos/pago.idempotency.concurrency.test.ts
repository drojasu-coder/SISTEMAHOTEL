import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const stripeMock = vi.hoisted(() => {
  let sequence = 0;
  const intents = new Map<string, Record<string, unknown>>();

  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => {
      sequence += 1;
      const id = `pi_idempotency_qa_${String(sequence).padStart(3, "0")}`;
      const intent = {
        id,
        status: "requires_payment_method",
        client_secret: `${id}_secret_qa_local`,
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata,
        idempotency_key: idempotencyKey,
      };

      intents.set(id, intent);
      return intent;
    }
  );

  const retrievePaymentIntent = vi.fn(async (id: string) => {
    const intent = intents.get(id);
    if (!intent) {
      throw new Error(`PaymentIntent QA desconocido: ${id}`);
    }
    return intent;
  });

  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(`${method} no permitido en este test`);
    });

  const cancelPaymentIntent = forbidden("cancelPaymentIntent");
  const createRefund = forbidden("createRefund");
  const constructEvent = forbidden("constructEvent");

  return {
    intents,
    createPaymentIntent,
    retrievePaymentIntent,
    cancelPaymentIntent,
    createRefund,
    constructEvent,
    reset: () => {
      sequence = 0;
      intents.clear();
      createPaymentIntent.mockClear();
      retrievePaymentIntent.mockClear();
      cancelPaymentIntent.mockClear();
      createRefund.mockClear();
      constructEvent.mockClear();
    },
  };
});

/**
 * Mock completo y local: stripe.service.ts y el SDK real de Stripe no se
 * evalúan. Este archivo no puede generar tráfico, usar credenciales ni crear
 * cargos reales.
 */
vi.mock("../../src/services/stripe.service", () => ({
  toStripeAmount: (amount: number | string, currency: string) => {
    if (currency !== "GTQ") {
      throw new Error("Moneda inesperada en mock Stripe QA");
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
  ReservaActividad,
} = db;

type ActivityCartSetup = {
  token: string;
  carritoId: number;
};

const setupActivityCart = async (
  label: string,
  fecha: string
): Promise<ActivityCartSetup> => {
  const cliente = await createAuthenticatedUser({
    rol: ROLES.CLIENTE,
    email: `qa-pay-conc-011-${label}@hotel.test`,
  });
  const recurso = await createRecursoActividad({
    nombre: `Recurso QA idempotencia ${label}`,
    precio_hora: "100.00",
  });

  const reservaResponse = await request(app)
    .post("/api/reservas-actividad")
    .set("Authorization", `Bearer ${cliente.token}`)
    .send({
      recurso_id: recurso.id,
      fecha,
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

  const carritoResponse = await request(app)
    .post("/api/carritos")
    .set("Authorization", `Bearer ${cliente.token}`)
    .send({});

  expect(carritoResponse.status).toBe(201);
  const carritoId = carritoResponse.body.data.id as number;

  const itemResponse = await request(app)
    .post(`/api/carritos/${carritoId}/items`)
    .set("Authorization", `Bearer ${cliente.token}`)
    .send({
      tipo_item: "actividad",
      referencia_id: reserva.id,
    });

  expect(itemResponse.status).toBe(201);
  expect(itemResponse.body.data.precio).toBe("100.00");

  const persistedItems = await CarritoItem.findAll({
    where: { carrito_id: carritoId },
  });
  expect(persistedItems).toHaveLength(1);
  expect(
    Number(persistedItems[0].precio) * Number(persistedItems[0].cantidad)
  ).toBe(100);

  return {
    token: cliente.token,
    carritoId,
  };
};

const cardRequest = (carritoId: number, idempotencyKey: string) => ({
  carrito_id: carritoId,
  monto: "100.00",
  metodo: "tarjeta",
  tipo_pago: "total",
  moneda: "GTQ",
  idempotency_key: idempotencyKey,
});

const responseResult = (response: any) => ({
  status: response.status,
  code: response.body.code ?? null,
  paymentId: response.body.data?.pago_id ?? response.body.data?.id ?? null,
  paymentIntentId: response.body.data?.payment_intent_id ?? null,
});

const assertForbiddenStripeOperations = () => {
  expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
  expect(stripeMock.createRefund).not.toHaveBeenCalled();
  expect(stripeMock.constructEvent).not.toHaveBeenCalled();
};

beforeEach(() => {
  stripeMock.reset();
});

describe("QA-PAY-CONC-CANDIDATE-011 idempotencia de pagos", () => {
  it(
    "SEQUENTIAL CONTRACT: replay de tarjeta conserva HTTP 201 y el mismo pago e intent",
    async () => {
      const { token, carritoId } = await setupActivityCart(
        "sequential",
        "2027-06-10"
      );
      const idempotencyKey = "qa-pay-conc-011-sequential";
      const payload = cardRequest(carritoId, idempotencyKey);

      const first = await request(app)
        .post("/api/pagos")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);
      const replay = await request(app)
        .post("/api/pagos")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      const payments = await Pago.findAll({
        where: { carrito_id: carritoId },
        order: [["id", "ASC"]],
      });
      const keyRows = await Pago.count({
        where: { idempotency_key: idempotencyKey },
      });

      console.log(
        "[QA-PAY-CONC-CANDIDATE-011][SEQUENTIAL CONTRACT]",
        JSON.stringify(
          {
            stripeMode: "MOCK",
            realStripeCharges: false,
            first: responseResult(first),
            replay: responseResult(replay),
            database: {
              localPayments: payments.map((payment: any) => ({
                id: payment.id,
                estado: payment.estado,
                monto: payment.monto,
                tipoPago: payment.tipo_pago,
                externalId: payment.id_transaccion_externo,
                idempotencyKey: payment.idempotency_key,
              })),
              keyRows,
            },
            stripe: {
              createCalls: stripeMock.createPaymentIntent.mock.calls.length,
              retrieveCalls:
                stripeMock.retrievePaymentIntent.mock.calls.length,
            },
          },
          null,
          2
        )
      );

      expect(first.status).toBe(201);
      expect(replay.status).toBe(201);
      expect(replay.body.data.pago_id).toBe(first.body.data.pago_id);
      expect(replay.body.data.payment_intent_id).toBe(
        first.body.data.payment_intent_id
      );
      expect(payments).toHaveLength(1);
      expect(keyRows).toBe(1);
      expect(payments[0].id).toBe(first.body.data.pago_id);
      expect(payments[0].id_transaccion_externo).toBe(
        first.body.data.payment_intent_id
      );
      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.retrievePaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.retrievePaymentIntent).toHaveBeenCalledWith(
        first.body.data.payment_intent_id
      );
      assertForbiddenStripeOperations();
    },
    30000
  );

  it(
    "CONCURRENT SAME KEY: 20 replays convergen al mismo pago sin errores",
    async () => {
      const { token, carritoId } = await setupActivityCart(
        "concurrent",
        "2027-06-11"
      );
      const idempotencyKey = "qa-pay-conc-011-concurrent";
      const payload = cardRequest(carritoId, idempotencyKey);

      const responses = await Promise.all(
        Array.from({ length: 20 }, () =>
          request(app)
            .post("/api/pagos")
            .set("Authorization", `Bearer ${token}`)
            .send(payload)
        )
      );

      const payments = await Pago.findAll({
        where: { carrito_id: carritoId },
        order: [["id", "ASC"]],
      });
      const keyRows = await Pago.count({
        where: { idempotency_key: idempotencyKey },
      });
      const cart = await Carrito.findByPk(carritoId);
      const distribution = responses.reduce(
        (result: Record<string, number>, response) => {
          const key = `${response.status}:${response.body.code ?? "NO_CODE"}`;
          result[key] = (result[key] ?? 0) + 1;
          return result;
        },
        {}
      );
      const results = responses.map(responseResult);
      const paymentIds = results.map((result) => result.paymentId);
      const intentIds = results.map((result) => result.paymentIntentId);
      const distinctPaymentIds = [...new Set(paymentIds)];
      const distinctIntentIds = [...new Set(intentIds)];
      const errorCodes = responses
        .filter((response) => response.status >= 400)
        .map((response) => response.body.code ?? "NO_CODE");
      const unexpectedServerErrors = responses.filter(
        (response) => response.status >= 500
      );
      const persistedExposure = payments.reduce(
        (total: number, payment: any) =>
          ["procesando", "pendiente", "aprobado"].includes(payment.estado)
            ? total + Number(payment.monto)
            : total,
        0
      );

      console.log(
        "[QA-PAY-CONC-CANDIDATE-011][CONCURRENT SAME KEY]",
        JSON.stringify(
          {
            stripeMode: "MOCK",
            realStripeCharges: false,
            concurrentRequests: responses.length,
            http: {
              distribution,
              results,
              paymentIds,
              distinctPaymentIds,
              intentIds,
              distinctIntentIds,
              errorCodes,
              unexpectedServerErrors: unexpectedServerErrors.length,
            },
            database: {
              localCount: payments.length,
              keyRows,
              states: payments.reduce(
                (states: Record<string, number>, payment: any) => {
                  states[payment.estado] = (states[payment.estado] ?? 0) + 1;
                  return states;
                },
                {}
              ),
              persistedExposure: persistedExposure.toFixed(2),
              cartState: cart?.estado ?? null,
              payments: payments.map((payment: any) => ({
                id: payment.id,
                estado: payment.estado,
                monto: payment.monto,
                tipoPago: payment.tipo_pago,
                externalId: payment.id_transaccion_externo,
                idempotencyKey: payment.idempotency_key,
              })),
            },
            stripe: {
              createCalls: stripeMock.createPaymentIntent.mock.calls.length,
              retrieveCalls:
                stripeMock.retrievePaymentIntent.mock.calls.length,
              createdIntentIds: [...stripeMock.intents.keys()],
            },
            exposureViolation007:
              stripeMock.createPaymentIntent.mock.calls.length > 1 ||
              payments.filter((payment: any) => payment.estado === "procesando")
                .length > 1 ||
              persistedExposure > 100,
          },
          null,
          2
        )
      );

      expect(responses).toHaveLength(20);
      expect(unexpectedServerErrors).toHaveLength(0);
      expect(errorCodes).toHaveLength(0);
      expect(responses.every((response) => response.status === 201)).toBe(true);
      expect(distinctPaymentIds).toHaveLength(1);
      expect(distinctPaymentIds[0]).not.toBeNull();
      expect(distinctIntentIds).toHaveLength(1);
      expect(distinctIntentIds[0]).not.toBeNull();
      expect(payments).toHaveLength(1);
      expect(keyRows).toBe(1);
      expect(payments[0].id).toBe(distinctPaymentIds[0]);
      expect(payments[0].id_transaccion_externo).toBe(distinctIntentIds[0]);
      expect(payments[0].estado).toBe("procesando");
      expect(persistedExposure).toBe(100);
      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.retrievePaymentIntent).toHaveBeenCalledTimes(19);
      assertForbiddenStripeOperations();
    },
    30000
  );

  it(
    "FINGERPRINT TYPE: cambiar solo tipo_pago responde 409 IDEMPOTENCY_CONFLICT",
    async () => {
      const { token, carritoId } = await setupActivityCart(
        "fingerprint",
        "2027-06-12"
      );
      const idempotencyKey = "qa-pay-conc-011-fingerprint-type";
      const originalPayload = {
        carrito_id: carritoId,
        monto: "100.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: idempotencyKey,
      };

      const original = await request(app)
        .post("/api/pagos")
        .set("Authorization", `Bearer ${token}`)
        .send(originalPayload);
      const replay = await request(app)
        .post("/api/pagos")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...originalPayload,
          tipo_pago: "saldo",
        });

      const payments = await Pago.findAll({
        where: { carrito_id: carritoId },
        order: [["id", "ASC"]],
      });
      const keyRows = await Pago.count({
        where: { idempotency_key: idempotencyKey },
      });

      console.log(
        "[QA-PAY-CONC-CANDIDATE-011][FINGERPRINT TYPE]",
        JSON.stringify(
          {
            stripeMode: "MOCK",
            realStripeCharges: false,
            fingerprintIncludesTipoPago: replay.status === 409 &&
              replay.body.code === "IDEMPOTENCY_CONFLICT",
            original: {
              requestTipoPago: originalPayload.tipo_pago,
              ...responseResult(original),
            },
            replay: {
              requestTipoPago: "saldo",
              ...responseResult(replay),
            },
            database: {
              localCount: payments.length,
              keyRows,
              rows: payments.map((payment: any) => ({
                id: payment.id,
                estado: payment.estado,
                monto: payment.monto,
                metodo: payment.metodo,
                tipoPago: payment.tipo_pago,
                idempotencyKey: payment.idempotency_key,
              })),
            },
            stripe: {
              createCalls: stripeMock.createPaymentIntent.mock.calls.length,
              retrieveCalls:
                stripeMock.retrievePaymentIntent.mock.calls.length,
            },
          },
          null,
          2
        )
      );

      expect(original.status).toBe(201);
      expect(original.body.data.estado).toBe("procesando");
      expect(replay.status).toBe(409);
      expect(replay.body.code).toBe("IDEMPOTENCY_CONFLICT");
      expect(payments).toHaveLength(1);
      expect(keyRows).toBe(1);
      expect(payments[0].id).toBe(original.body.data.pago_id);
      expect(payments[0].tipo_pago).toBe("total");
      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      assertForbiddenStripeOperations();
    },
    30000
  );
});
