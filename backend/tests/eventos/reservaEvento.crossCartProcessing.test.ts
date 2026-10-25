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
  let sequence = 0;

  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => {
      sequence += 1;
      const id = `pi_evt_fin_035_${sequence}`;
      const intent: IntentState = {
        id,
        status: "requires_payment_method",
        client_secret: `${id}_secret_qa_local`,
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };

      intents.set(id, intent);
      return { ...intent };
    }
  );

  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-EVT-FIN-CANDIDATE-035`
      );
    });

  return {
    intents,
    createPaymentIntent,
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
    createRefund: forbidden("createRefund"),
    constructEvent: forbidden("constructEvent"),
  };
});

/** Stripe queda completamente reemplazado por intents locales en memoria. */
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
import { createSalonEvento } from "../fixtures/eventos";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const {
  Carrito,
  CarritoItem,
  Pago,
  ReservaEvento,
} = db;

const TEST_NAME =
  "QA-EVT-FIN-CANDIDATE-035: no permite un segundo intento de pago del mismo evento tras expirar C1";

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

describe("Exposición financiera cross-cart de eventos", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });
      const authorization = `Bearer ${cliente.token}`;
      const salon = await createSalonEvento({
        tarifa_base: 5000,
      });

      const reservaResponse = await request(app)
        .post("/api/reservas-evento")
        .set("Authorization", authorization)
        .send({
          salon_id: salon.id,
          tipo_evento: "boda",
          fecha: "2027-06-10",
          hora_inicio: "10:00",
          hora_fin: "14:00",
          numero_invitados: 50,
        });

      expect(reservaResponse.status).toBe(201);
      expect(Number(reservaResponse.body.data.total)).toBe(5000);
      expect(Number(reservaResponse.body.data.anticipo)).toBe(1500);

      const reservaId = Number(reservaResponse.body.data.id);
      const cartAResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", authorization)
        .send({});

      expect(cartAResponse.status).toBe(201);
      const cartAId = Number(cartAResponse.body.data.id);

      const addAResponse = await request(app)
        .post(`/api/carritos/${cartAId}/items`)
        .set("Authorization", authorization)
        .send({
          tipo_item: "evento",
          referencia_id: reservaId,
        });

      expect(addAResponse.status).toBe(201);
      expect(Number(addAResponse.body.data.precio)).toBe(5000);

      const paymentAResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          carrito_id: cartAId,
          monto: "5000.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-evt-fin-candidate-035-c1",
        });

      expect(paymentAResponse.status).toBe(201);
      expect(paymentAResponse.body.data.estado).toBe("procesando");
      expect(paymentAResponse.body.data.monto).toBe("5000.00");
      expect(paymentAResponse.body.data.payment_intent_id).toBe(
        "pi_evt_fin_035_1"
      );
      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);

      const cartABeforeExpiration = await Carrito.findByPk(cartAId);
      expect(cartABeforeExpiration).not.toBeNull();
      await cartABeforeExpiration.update({
        expira_en: new Date(Date.now() - 60_000),
      });

      const cartBResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", authorization)
        .send({});

      expect(cartBResponse.status).toBe(201);
      const cartBId = Number(cartBResponse.body.data.id);
      const cartAExpired = await Carrito.findByPk(cartAId);
      expect(cartAExpired.estado).toBe("expirado");

      const addBResponse = await request(app)
        .post(`/api/carritos/${cartBId}/items`)
        .set("Authorization", authorization)
        .send({
          tipo_item: "evento",
          referencia_id: reservaId,
        });

      let paymentBResponse: any = null;
      if (addBResponse.status === 201) {
        paymentBResponse = await request(app)
          .post("/api/pagos")
          .set("Authorization", authorization)
          .send({
            carrito_id: cartBId,
            monto: "5000.00",
            metodo: "tarjeta",
            tipo_pago: "total",
            moneda: "GTQ",
            idempotency_key: "qa-evt-fin-candidate-035-c2",
          });
      }

      const [finalCartA, finalCartB, finalReserva, itemsA, itemsB, paymentsA, paymentsB] =
        await Promise.all([
          Carrito.findByPk(cartAId),
          Carrito.findByPk(cartBId),
          ReservaEvento.findByPk(reservaId),
          CarritoItem.findAll({
            where: { carrito_id: cartAId },
            order: [["id", "ASC"]],
          }),
          CarritoItem.findAll({
            where: { carrito_id: cartBId },
            order: [["id", "ASC"]],
          }),
          Pago.findAll({
            where: { carrito_id: cartAId },
            order: [["id", "ASC"]],
          }),
          Pago.findAll({
            where: { carrito_id: cartBId },
            order: [["id", "ASC"]],
          }),
        ]);

      const allPayments = [...paymentsA, ...paymentsB];
      const processing = round(
        allPayments
          .filter((payment: any) => payment.estado === "procesando")
          .reduce(
            (sum: number, payment: any) => sum + Number(payment.monto),
            0
          )
      );
      const approved = round(
        allPayments
          .filter((payment: any) =>
            ["aprobado", "reembolsado_parcial", "reembolsado"].includes(
              payment.estado
            )
          )
          .reduce(
            (sum: number, payment: any) => sum + Number(payment.monto),
            0
          )
      );
      const totalActiveExposure = round(approved + processing);
      const eventTotal = Number(finalReserva.total);
      const excessExposure = round(
        Math.max(0, totalActiveExposure - eventTotal)
      );
      const secondPaymentResult = paymentBResponse
        ? `HTTP ${paymentBResponse.status} ${paymentBResponse.body.data?.estado ?? paymentBResponse.body.code ?? "NO_STATE"} Q${paymentBResponse.body.data?.monto ?? "NO_AMOUNT"}`
        : "NOT RUN";

      console.log(
        "[QA-EVT-FIN-CANDIDATE-035]",
        JSON.stringify(
          {
            qaId: "QA-EVT-FIN-CANDIDATE-035",
            stripeMode: "FULL_LOCAL_MOCK",
            realStripeCalls: 0,
            invariant:
              "Un evento con Q5000.00 ya comprometidos por un pago Stripe procesando en C1 no puede recrearse ni generar un segundo intento de pago en C2 tras expirar C1",
            calculation: {
              eventTotal: eventTotal.toFixed(2),
              approved: approved.toFixed(2),
              processing: processing.toFixed(2),
              totalActiveExposure: totalActiveExposure.toFixed(2),
              excessExposure: excessExposure.toFixed(2),
              formula:
                "exposición activa = pagos aprobados netos + pagos procesando",
            },
            http: {
              createReservation: reservaResponse.status,
              createCartA: cartAResponse.status,
              addToCartA: addAResponse.status,
              paymentA: {
                status: paymentAResponse.status,
                body: paymentAResponse.body,
              },
              createCartB: cartBResponse.status,
              addToCartB: {
                status: addBResponse.status,
                body: addBResponse.body,
              },
              secondPayment: paymentBResponse
                ? {
                    status: paymentBResponse.status,
                    body: paymentBResponse.body,
                  }
                : "NOT RUN",
            },
            database: {
              reservation: finalReserva.toJSON(),
              cartA: {
                cart: finalCartA.toJSON(),
                items: itemsA.map((item: any) => item.toJSON()),
                payments: paymentsA.map((payment: any) => payment.toJSON()),
              },
              cartB: {
                cart: finalCartB.toJSON(),
                items: itemsB.map((item: any) => item.toJSON()),
                payments: paymentsB.map((payment: any) => payment.toJSON()),
              },
            },
            stripeMock: {
              createPaymentIntentCalls:
                stripeMock.createPaymentIntent.mock.calls.length,
              intents: [...stripeMock.intents.values()],
              forbiddenCalls: {
                retrieve:
                  stripeMock.retrievePaymentIntent.mock.calls.length,
                cancel: stripeMock.cancelPaymentIntent.mock.calls.length,
                refund: stripeMock.createRefund.mock.calls.length,
                webhook: stripeMock.constructEvent.mock.calls.length,
              },
            },
            expected: {
              addToCartB: "HTTP 409 CART_REFERENCE_NOT_AVAILABLE",
              secondPayment: "NOT RUN",
              createPaymentIntentCalls: 1,
              maximumActiveExposure: "5000.00",
            },
          },
          null,
          2
        )
      );

      expect.soft(
        addBResponse.status,
        "C2 debe rechazar el evento ya comprometido por el pago procesando de C1"
      ).toBe(409);
      expect.soft(addBResponse.body.code).toBe(
        "CART_REFERENCE_NOT_AVAILABLE"
      );
      expect.soft(
        itemsB,
        "C2 no debe persistir una segunda copia del mismo evento"
      ).toHaveLength(0);
      expect.soft(
        secondPaymentResult,
        "El segundo intento no debe llegar al endpoint de pagos"
      ).toBe("NOT RUN");
      expect.soft(
        paymentsB,
        "C2 no debe persistir un segundo pago para el mismo evento"
      ).toHaveLength(0);
      expect.soft(
        stripeMock.createPaymentIntent.mock.calls.length,
        "Stripe local debe observar solamente el intento original de C1"
      ).toBe(1);
      expect.soft(
        totalActiveExposure,
        "La exposición activa acumulada no debe superar el total del evento"
      ).toBeLessThanOrEqual(eventTotal);

      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
      expect(stripeMock.constructEvent).not.toHaveBeenCalled();
    },
    30000
  );
});
