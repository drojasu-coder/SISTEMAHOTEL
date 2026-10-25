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
      const id = `pi_spa_fin_044_${sequence}`;
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
        `${method} no permitido en QA-SPA-FIN-CANDIDATE-044`
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

/** Stripe queda totalmente sustituido por PaymentIntents locales en memoria. */
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

import { Op } from "sequelize";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const {
  Carrito,
  CarritoItem,
  CitaBienestar,
  Pago,
  Reembolso,
} = db;

const TEST_NAME =
  "QA-SPA-FIN-CANDIDATE-044: rechaza una segunda exposición procesando de la misma cita tras expirar C1";
const MAXIMUM_LEGITIMATE_EXPOSURE = 350;
const approvedStates = new Set([
  "aprobado",
  "reembolsado_parcial",
  "reembolsado",
]);

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const referenceFinancialSnapshot = async (citaId: number) => {
  const items = await CarritoItem.findAll({
    where: {
      tipo_item: "bienestar",
      referencia_id: citaId,
    },
    order: [["id", "ASC"]],
  });
  const cartIds = [
    ...new Set<number>(
      items.map((item: any) => Number(item.carrito_id))
    ),
  ];
  const payments = cartIds.length === 0
    ? []
    : await Pago.findAll({
        where: {
          carrito_id: { [Op.in]: cartIds },
        },
        order: [["id", "ASC"]],
      });
  const approvedPayments = payments.filter((payment: any) =>
    approvedStates.has(String(payment.estado))
  );
  const refunds = approvedPayments.length === 0
    ? []
    : await Reembolso.findAll({
        where: {
          pago_id: {
            [Op.in]: approvedPayments.map((payment: any) => payment.id),
          },
          estado: "aprobado",
        },
        order: [["id", "ASC"]],
      });

  const approvedNet = round(
    approvedPayments.reduce((sum: number, payment: any) => {
      const refunded = refunds
        .filter(
          (refund: any) =>
            Number(refund.pago_id) === Number(payment.id)
        )
        .reduce(
          (refundSum: number, refund: any) =>
            refundSum + Number(refund.monto),
          0
        );

      return sum + Math.max(0, Number(payment.monto) - refunded);
    }, 0)
  );
  const processing = round(
    payments
      .filter((payment: any) => payment.estado === "procesando")
      .reduce(
        (sum: number, payment: any) =>
          sum + Number(payment.monto),
        0
      )
  );

  return {
    items,
    cartIds,
    payments,
    refunds,
    approvedNet,
    processing,
    totalActiveExposure: round(approvedNet + processing),
  };
};

describe("Exposición financiera cross-cart de CitaBienestar", () => {
  it(
    TEST_NAME,
    async () => {
      const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const adminAuthorization = `Bearer ${admin.token}`;
      const clientAuthorization = `Bearer ${cliente.token}`;

      const therapistResponse = await request(app)
        .post("/api/terapeutas")
        .set("Authorization", adminAuthorization)
        .send({
          nombre: "Terapeuta QA SPA FIN 044",
          activo: true,
        });
      expect(therapistResponse.status).toBe(201);
      const therapistId = Number(therapistResponse.body.data.id);

      const serviceResponse = await request(app)
        .post("/api/servicios-spa")
        .set("Authorization", adminAuthorization)
        .send({
          nombre: "Masaje QA SPA FIN 044",
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
          fecha: "2027-11-10",
          hora_inicio: "10:00",
        });
      expect(citaResponse.status).toBe(201);
      expect(citaResponse.body.data.estado).toBe("confirmada");
      expect(Number(citaResponse.body.data.usuario_id)).toBe(
        Number(cliente.usuario.id)
      );
      const citaId = Number(citaResponse.body.data.id);

      const cartAResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", clientAuthorization)
        .send({});
      expect(cartAResponse.status).toBe(201);
      const cartAId = Number(cartAResponse.body.data.id);

      const addAResponse = await request(app)
        .post(`/api/carritos/${cartAId}/items`)
        .set("Authorization", clientAuthorization)
        .send({
          tipo_item: "bienestar",
          referencia_id: citaId,
        });
      expect(addAResponse.status).toBe(201);
      expect(addAResponse.body.data.tipo_item).toBe("bienestar");
      expect(Number(addAResponse.body.data.referencia_id)).toBe(citaId);
      expect(Number(addAResponse.body.data.precio)).toBe(350);
      const itemAId = Number(addAResponse.body.data.id);

      const cartABeforeExpiration = await Carrito.findByPk(cartAId);
      expect(cartABeforeExpiration).not.toBeNull();
      expect(cartABeforeExpiration.estado).toBe("activo");

      const paymentAResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", clientAuthorization)
        .send({
          carrito_id: cartAId,
          monto: "350.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-spa-fin-candidate-044-c1",
        });
      expect(paymentAResponse.status).toBe(201);
      expect(paymentAResponse.body.data.estado).toBe("procesando");
      expect(paymentAResponse.body.data.monto).toBe("350.00");
      expect(paymentAResponse.body.data.payment_intent_id).toBe(
        "pi_spa_fin_044_1"
      );
      const paymentAId = Number(paymentAResponse.body.data.pago_id);
      const paymentABeforeExpiration = await Pago.findByPk(paymentAId);
      expect(paymentABeforeExpiration).not.toBeNull();
      expect(paymentABeforeExpiration.estado).toBe("procesando");
      expect(paymentABeforeExpiration.monto).toBe("350.00");
      expect(paymentABeforeExpiration.id_transaccion_externo).toBe(
        "pi_spa_fin_044_1"
      );

      await cartABeforeExpiration.update({
        expira_en: new Date(Date.now() - 60_000),
      });

      const cartBResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", clientAuthorization)
        .send({});
      expect(cartBResponse.status).toBe(201);
      const cartBId = Number(cartBResponse.body.data.id);

      const cartAExpired = await Carrito.findByPk(cartAId);
      const itemAAfterExpiration = await CarritoItem.findByPk(itemAId);
      const paymentAAfterExpiration = await Pago.findByPk(paymentAId);
      const citaAfterExpiration = await CitaBienestar.findByPk(citaId);
      expect(cartAExpired.estado).toBe("expirado");
      expect(itemAAfterExpiration).not.toBeNull();
      expect(paymentAAfterExpiration.estado).toBe("procesando");
      expect(citaAfterExpiration.estado).toBe("confirmada");

      const addBResponse = await request(app)
        .post(`/api/carritos/${cartBId}/items`)
        .set("Authorization", clientAuthorization)
        .send({
          tipo_item: "bienestar",
          referencia_id: citaId,
        });

      let paymentBResponse: any = null;
      if (addBResponse.status === 201) {
        paymentBResponse = await request(app)
          .post("/api/pagos")
          .set("Authorization", clientAuthorization)
          .send({
            carrito_id: cartBId,
            monto: "350.00",
            metodo: "tarjeta",
            tipo_pago: "total",
            moneda: "GTQ",
            idempotency_key: "qa-spa-fin-candidate-044-c2",
          });
      }

      const finalCartA = await Carrito.findByPk(cartAId);
      const finalCartB = await Carrito.findByPk(cartBId);
      const finalCita = await CitaBienestar.findByPk(citaId);
      const finalFinancial = await referenceFinancialSnapshot(citaId);
      const finalItemsA = finalFinancial.items.filter(
        (item: any) => Number(item.carrito_id) === cartAId
      );
      const finalItemsB = finalFinancial.items.filter(
        (item: any) => Number(item.carrito_id) === cartBId
      );
      const finalPaymentsA = finalFinancial.payments.filter(
        (payment: any) => Number(payment.carrito_id) === cartAId
      );
      const finalPaymentsB = finalFinancial.payments.filter(
        (payment: any) => Number(payment.carrito_id) === cartBId
      );
      const processingFromA = round(
        finalPaymentsA
          .filter((payment: any) => payment.estado === "procesando")
          .reduce(
            (sum: number, payment: any) =>
              sum + Number(payment.monto),
            0
          )
      );
      const processingFromB = round(
        finalPaymentsB
          .filter((payment: any) => payment.estado === "procesando")
          .reduce(
            (sum: number, payment: any) =>
              sum + Number(payment.monto),
            0
          )
      );
      const paymentBId = paymentBResponse?.body.data?.pago_id
        ? Number(paymentBResponse.body.data.pago_id)
        : null;
      const finalPaymentB = paymentBId
        ? await Pago.findByPk(paymentBId)
        : null;
      const secondPaymentResult = paymentBResponse
        ? `HTTP ${paymentBResponse.status} ${paymentBResponse.body.data?.estado ?? paymentBResponse.body.code ?? "NO_CODE"}`
        : "NOT RUN";
      const financialViolation =
        finalFinancial.totalActiveExposure > MAXIMUM_LEGITIMATE_EXPOSURE;

      console.log(
        "[QA-SPA-FIN-CANDIDATE-044]",
        JSON.stringify(
          {
            qaId: "QA-SPA-FIN-CANDIDATE-044",
            stripeMode: "FULL_LOCAL_MOCK",
            realStripeCalls: 0,
            invariant:
              "Para una CitaBienestar, dinero aprobado neto más pagos procesando en todos sus carritos históricos no puede superar Q350.00",
            ids: {
              clientId: Number(cliente.usuario.id),
              therapistId,
              serviceId,
              citaId,
              cartAId,
              itemAId,
              paymentAId,
              cartBId,
              itemBIds: finalItemsB.map((item: any) => Number(item.id)),
              paymentBId,
              paymentIntentIds: [...stripeMock.intents.keys()],
            },
            http: {
              therapistCreate: therapistResponse.status,
              serviceCreate: serviceResponse.status,
              citaCreate: citaResponse.status,
              cartACreate: cartAResponse.status,
              addA: { status: addAResponse.status, body: addAResponse.body },
              paymentA: {
                status: paymentAResponse.status,
                body: paymentAResponse.body,
              },
              cartBCreate: cartBResponse.status,
              addB: { status: addBResponse.status, body: addBResponse.body },
              paymentB: paymentBResponse
                ? {
                    status: paymentBResponse.status,
                    body: paymentBResponse.body,
                  }
                : "NOT RUN",
            },
            database: {
              cita: finalCita?.toJSON() ?? null,
              cartA: finalCartA?.toJSON() ?? null,
              cartB: finalCartB?.toJSON() ?? null,
              itemRows: finalFinancial.items.map((item: any) => item.toJSON()),
              paymentRows: finalFinancial.payments.map((payment: any) =>
                payment.toJSON()
              ),
              refundRows: finalFinancial.refunds.map((refund: any) =>
                refund.toJSON()
              ),
              paymentBAfterApi: finalPaymentB?.toJSON() ?? null,
            },
            stripeMock: {
              paymentIntentsCreated:
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
            exposure: {
              approvedNet: finalFinancial.approvedNet.toFixed(2),
              processing: finalFinancial.processing.toFixed(2),
              processingFromC1: processingFromA.toFixed(2),
              processingFromC2: processingFromB.toFixed(2),
              totalActiveExposure:
                finalFinancial.totalActiveExposure.toFixed(2),
              maximumLegitimateExposure:
                MAXIMUM_LEGITIMATE_EXPOSURE.toFixed(2),
              doubleProcessingExposure:
                processingFromA === 350 && processingFromB === 350,
              financialViolation,
            },
            expectedSafeBehavior: {
              addB: "HTTP 409 CART_REFERENCE_NOT_AVAILABLE",
              itemBCount: 0,
              paymentB: "NOT RUN",
              localPaymentCount: 1,
              paymentIntentCount: 1,
              maximumActiveExposure: "350.00",
              citaState: "confirmada",
            },
          },
          null,
          2
        )
      );

      expect.soft(
        addBResponse.status,
        "C2 debe rechazar la cita ya comprometida por el pago procesando de C1"
      ).toBe(409);
      expect.soft(addBResponse.body.code).toBe(
        "CART_REFERENCE_NOT_AVAILABLE"
      );
      expect.soft(
        finalItemsB,
        "C2 no debe persistir una segunda copia de la cita"
      ).toHaveLength(0);
      expect.soft(
        secondPaymentResult,
        "P2 no debe intentarse si la cita ya tiene Q350 procesando"
      ).toBe("NOT RUN");
      expect.soft(
        finalPaymentsB,
        "C2 no debe persistir un segundo pago para la cita"
      ).toHaveLength(0);
      expect.soft(
        stripeMock.createPaymentIntent.mock.calls.length,
        "Solo debe existir el PaymentIntent original de C1"
      ).toBe(1);
      expect.soft(
        finalFinancial.totalActiveExposure,
        "La exposición activa agregada de la cita no debe superar Q350.00"
      ).toBeLessThanOrEqual(MAXIMUM_LEGITIMATE_EXPOSURE);
      expect.soft(finalCita.estado).toBe("confirmada");
      expect.soft(finalItemsA).toHaveLength(1);
      expect.soft(finalPaymentsA).toHaveLength(1);

      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
      expect(stripeMock.constructEvent).not.toHaveBeenCalled();
    },
    30000
  );
});
