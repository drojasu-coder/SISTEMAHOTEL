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
      idempotencyKey?: string
    ) => {
      const sequence = intents.size + 1;
      const id = `pi_rh_cart_history_027_${sequence}`;
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
  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error(
        "No se configuró el webhook local de QA-RH-FIN-CANDIDATE-027"
      );
    }
    return webhook.event;
  });
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-RH-FIN-CANDIDATE-027`
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
 * FULL LOCAL MOCK: sustituye stripe.service antes de importar app. Los intents
 * y el webhook viven solo en memoria; no se carga Stripe ni existe tráfico de
 * red o posibilidad de generar cargos reales.
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
import { reservationFinancialExposure } from "../../src/services/pago.service";
import { createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-RH-FIN-CANDIDATE-027: conserva el historial aprobado de una ReservaHabitacion al eliminar su item";

interface PaymentRow {
  id: number;
  reserva_habitacion_id: number | null;
  carrito_id: number | null;
  monto: string;
  metodo: string;
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
  const date = new Date(
    Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day") + days
    )
  );
  return date.toISOString().slice(0, 10);
};

const getKnownOriginPayments = async (
  reservationId: number,
  cartId: number
) =>
  (await sequelize.query(
    `
      SELECT
        p.id,
        p.reserva_habitacion_id,
        p.carrito_id,
        p.monto::numeric(10, 2)::text AS monto,
        p.metodo,
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
      WHERE p.reserva_habitacion_id = :reservationId
         OR p.carrito_id = :cartId
      ORDER BY p.id ASC;
    `,
    {
      replacements: { reservationId, cartId },
      type: QueryTypes.SELECT,
    }
  )) as PaymentRow[];

const realExposure = (payments: PaymentRow[]) => {
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
              Number(payment.monto) - Number(payment.approved_refunds)
            )
          : sum,
      0
    )
  );
  const processing = round(
    payments
      .filter((payment) => payment.estado === "procesando")
      .reduce((sum, payment) => sum + Number(payment.monto), 0)
  );
  return { approved, processing, total: round(approved + processing) };
};

describe("Historial financiero de ReservaHabitacion pagada mediante carrito", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const hotel = await createHotelFixture({ capacidad: 2, tarifa: 100 });
      const authorization = `Bearer ${cliente.token}`;
      const fechaEntrada = getHotelDatePlusDays(10);
      const fechaSalida = getHotelDatePlusDays(11);

      const reservationResponse = await request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", authorization)
        .send({
          habitacion_id: hotel.habitacion.id,
          fecha_entrada: fechaEntrada,
          fecha_salida: fechaSalida,
          numero_huespedes: 1,
        });

      expect(
        reservationResponse.status,
        JSON.stringify(reservationResponse.body)
      ).toBe(201);
      expect(reservationResponse.body.data.total).toBe("100.00");
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
        .send({
          tipo_item: "habitacion",
          referencia_id: reservationId,
        });
      expect(addResponse.status, JSON.stringify(addResponse.body)).toBe(201);
      expect(addResponse.body.data.precio).toBe("100.00");
      const itemId = Number(addResponse.body.data.id);
      const itemAtPayment = (await sequelize.query(
        `
          SELECT id, carrito_id, tipo_item, referencia_id,
                 precio::numeric(10, 2)::text AS precio
          FROM carrito_items
          WHERE id = :itemId;
        `,
        { replacements: { itemId }, type: QueryTypes.SELECT }
      )) as Array<Record<string, unknown>>;
      expect(itemAtPayment).toHaveLength(1);

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          carrito_id: cartId,
          monto: "100.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-rh-fin-candidate-027-cart",
        });
      expect(paymentResponse.status, JSON.stringify(paymentResponse.body)).toBe(
        201
      );
      expect(paymentResponse.body.data.estado).toBe("procesando");
      const historicalPaymentId = Number(paymentResponse.body.data.pago_id);
      const firstIntentId = String(
        paymentResponse.body.data.payment_intent_id
      );
      const firstIntent = stripeMock.intents.get(firstIntentId);
      expect(firstIntent).toBeDefined();
      expect(firstIntent!.amount).toBe(10000);

      firstIntent!.status = "succeeded";
      stripeMock.webhook.event = {
        id: "evt_rh_cart_history_027_1",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: firstIntent!.id,
            status: firstIntent!.status,
            amount: firstIntent!.amount,
            currency: firstIntent!.currency,
            metadata: { ...firstIntent!.metadata },
          },
        },
      };
      const webhookResponse = await request(app)
        .post("/api/pagos/stripe/webhook")
        .set("Stripe-Signature", "t=1,v1=qa-local-signature")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ id: "evt_rh_cart_history_027_1" }));
      expect(webhookResponse.status, JSON.stringify(webhookResponse.body)).toBe(
        200
      );

      const beforePayments = await getKnownOriginPayments(
        reservationId,
        cartId
      );
      const beforeDetected = await reservationFinancialExposure(
        reservationId,
        undefined
      );
      expect(beforePayments).toHaveLength(1);
      expect(beforePayments[0]).toMatchObject({
        id: historicalPaymentId,
        carrito_id: cartId,
        reserva_habitacion_id: null,
        monto: "100.00",
        metodo: "tarjeta",
        estado: "aprobado",
      });
      expect(beforeDetected).toEqual({
        approved: 100,
        processing: 0,
        total: 100,
      });

      const deleteResponse = await request(app)
        .delete(`/api/carritos/${cartId}/items/${itemId}`)
        .set("Authorization", authorization);
      const itemAfterRows = (await sequelize.query(
        `SELECT id FROM carrito_items WHERE id = :itemId;`,
        { replacements: { itemId }, type: QueryTypes.SELECT }
      )) as Array<{ id: number }>;
      const itemAfter = itemAfterRows.length === 1 ? "present" : "absent";

      const historicalPaymentRows = await getKnownOriginPayments(
        reservationId,
        cartId
      );
      const historicalPayment =
        historicalPaymentRows.find(
          (payment) => Number(payment.id) === historicalPaymentId
        ) ?? null;
      const afterDetected = await reservationFinancialExposure(
        reservationId,
        undefined
      );

      const secondDirectResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          reserva_habitacion_id: reservationId,
          monto: "100.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-rh-fin-candidate-027-direct-second",
        });

      const finalPayments = await getKnownOriginPayments(
        reservationId,
        cartId
      );
      const finalReal = realExposure(finalPayments);
      const secondPayment =
        finalPayments.find(
          (payment) => Number(payment.id) !== historicalPaymentId
        ) ?? null;
      const linkPreserved =
        afterDetected.approved === 100 &&
        afterDetected.processing === 0 &&
        afterDetected.total === 100;
      const safelyRejectedDelete =
        deleteResponse.status === 409 &&
        itemAfter === "present" &&
        linkPreserved;
      const safelyAllowedDelete =
        deleteResponse.status === 204 &&
        itemAfter === "absent" &&
        linkPreserved;
      const violation =
        !linkPreserved ||
        secondDirectResponse.status === 201 ||
        stripeMock.intents.size > 1 ||
        finalPayments.length > 1 ||
        finalReal.total > 100;
      const unexpected500 = [
        reservationResponse,
        cartResponse,
        addResponse,
        paymentResponse,
        webhookResponse,
        deleteResponse,
        secondDirectResponse,
      ].some((response) => response.status === 500);

      const evidence = {
        qaId: "QA-RH-FIN-CANDIDATE-027",
        database: "hotel_test_db",
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        ids: { reservationId, cartId, itemId, historicalPaymentId },
        reservationTotal: "100.00",
        http: {
          add: {
            status: addResponse.status,
            code: addResponse.body.code ?? null,
          },
          cartPayment: {
            status: paymentResponse.status,
            code: paymentResponse.body.code ?? null,
          },
          webhook: {
            status: webhookResponse.status,
            code: webhookResponse.body.code ?? null,
          },
          delete: {
            status: deleteResponse.status,
            code: deleteResponse.body.code ?? null,
          },
          secondDirect: {
            status: secondDirectResponse.status,
            code: secondDirectResponse.body.code ?? null,
          },
          unexpected500,
        },
        historicalPayment: historicalPayment
          ? {
              method: historicalPayment.metodo,
              amount: historicalPayment.monto,
              state: historicalPayment.estado,
              persisted: true,
            }
          : null,
        before: {
          item: "present",
          approvedDetected: beforeDetected.approved.toFixed(2),
          processingDetected: beforeDetected.processing.toFixed(2),
          totalDetected: beforeDetected.total.toFixed(2),
        },
        afterDelete: {
          item: itemAfter,
          approvedDetected: afterDetected.approved.toFixed(2),
          processingDetected: afterDetected.processing.toFixed(2),
          totalDetected: afterDetected.total.toFixed(2),
          linkPreserved,
        },
        secondPayment: secondPayment
          ? {
              id: secondPayment.id,
              state: secondPayment.estado,
              amount: secondPayment.monto,
            }
          : { persisted: false, state: null },
        final: {
          paymentIntentCount: stripeMock.intents.size,
          localPaymentCount: finalPayments.length,
          realApproved: finalReal.approved.toFixed(2),
          processing: finalReal.processing.toFixed(2),
          totalActive: finalReal.total.toFixed(2),
          maximumLegitimate: "100.00",
          violation,
        },
        safeOutcome: { safelyRejectedDelete, safelyAllowedDelete },
        regressions: {
          qa020: finalReal.total <= 100,
          qa014: deleteResponse.status !== 204 || itemAfter === "absent",
          existingTestsReexecuted: false,
        },
      };

      console.log(
        "[QA-RH-FIN-CANDIDATE-027]",
        JSON.stringify(evidence, null, 2)
      );

      expect.soft(unexpected500, "El flujo no debe producir HTTP 500").toBe(
        false
      );
      if (deleteResponse.status === 409) {
        expect.soft(deleteResponse.body.code).toBe("CART_NOT_ACTIVE");
      }
      expect.soft(historicalPayment, "El Pago aprobado debe persistir").not.toBe(
        null
      );
      expect.soft(
        safelyRejectedDelete || safelyAllowedDelete,
        "DELETE debe rechazarse conservando el vínculo o eliminar sin perder la exposición histórica"
      ).toBe(true);
      expect.soft(
        secondDirectResponse.status,
        "El pago directo duplicado debe rechazarse"
      ).toBe(409);
      expect.soft(secondDirectResponse.body.code).toBe(
        "RESERVATION_ALREADY_PAID"
      );
      expect.soft(
        secondPayment,
        "No debe persistirse un segundo Pago sobre la obligación cubierta"
      ).toBeNull();
      expect.soft(stripeMock.intents.size).toBe(1);
      expect.soft(finalPayments).toHaveLength(1);
      expect.soft(finalReal.total).toBeLessThanOrEqual(100);
      expect.soft(violation, "La exposición no debe superar Q100.00").toBe(
        false
      );
      expect(stripeMock.constructEvent).toHaveBeenCalledTimes(1);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
    },
    30000
  );
});
