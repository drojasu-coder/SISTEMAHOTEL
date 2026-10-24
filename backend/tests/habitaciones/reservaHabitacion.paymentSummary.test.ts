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
  };

  const intents = new Map<string, IntentState>();
  const webhook = { event: null as any };
  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
    ) => {
      const intent: IntentState = {
        id: "pi_rh_summary_031_001",
        status: "requires_payment_method",
        client_secret: "pi_rh_summary_031_001_secret_qa_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
      };
      intents.set(intent.id, intent);
      return { ...intent };
    },
  );
  const createRefund = vi.fn(
    async (
      paymentIntentId: string,
      amount: number | string,
      currency: string,
    ) => ({
      id: "re_rh_summary_031_001",
      payment_intent: paymentIntentId,
      amount: Math.round(Number(amount) * 100),
      currency: currency.toLowerCase(),
      status: "succeeded",
      created: 1_800_000_031,
    }),
  );
  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error(
        "No se configuró el webhook local de QA-RH-FIN-CANDIDATE-031",
      );
    }
    return webhook.event;
  });
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(`${method} no permitido en QA-RH-FIN-CANDIDATE-031`);
    });

  return {
    intents,
    webhook,
    createPaymentIntent,
    createRefund,
    constructEvent,
    updatePaymentIntentMetadata: forbidden("updatePaymentIntentMetadata"),
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
  };
});

/**
 * FULL LOCAL MOCK: PaymentIntent, refund y webhook viven solo en memoria.
 * stripe.service queda sustituido antes de importar app; no hay red ni cargos.
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
    createRefund: stripeMock.createRefund,
    constructEvent: stripeMock.constructEvent,
    updatePaymentIntentMetadata: stripeMock.updatePaymentIntentMetadata,
    retrievePaymentIntent: stripeMock.retrievePaymentIntent,
    cancelPaymentIntent: stripeMock.cancelPaymentIntent,
  },
}));

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { reservationFinancialExposure } from "../../src/services/pago.service";
import { createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-RH-FIN-CANDIDATE-031: el resumen de ReservaHabitacion incluye el pago y reembolso de su carrito";

interface FinancialRow {
  reservation_id: number;
  reservation_total: string;
  reservation_state: string;
  cart_id: number;
  cart_state: string;
  cart_item_count: string;
  payment_id: number;
  payment_amount: string;
  payment_state: string;
  payment_origin_reservation_id: number | null;
  approved_refunded: string;
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
  const part = (type: string) =>
    Number(parts.find((value) => value.type === type)?.value);
  return new Date(
    Date.UTC(part("year"), part("month") - 1, part("day") + days),
  )
    .toISOString()
    .slice(0, 10);
};

const persistedFinancialState = async (
  reservationId: number,
  cartId: number,
) => {
  const rows = (await sequelize.query(
    `
      SELECT
        rh.id AS reservation_id,
        rh.total::numeric(10, 2)::text AS reservation_total,
        rh.estado AS reservation_state,
        c.id AS cart_id,
        c.estado AS cart_state,
        COUNT(DISTINCT ci.id)::text AS cart_item_count,
        p.id AS payment_id,
        p.monto::numeric(10, 2)::text AS payment_amount,
        p.estado AS payment_state,
        p.reserva_habitacion_id AS payment_origin_reservation_id,
        COALESCE(SUM(r.monto) FILTER (WHERE r.estado = 'aprobado'), 0)
          ::numeric(10, 2)::text AS approved_refunded
      FROM reservas_habitacion rh
      JOIN carritos c ON c.id = :cartId
      JOIN carrito_items ci
        ON ci.carrito_id = c.id
       AND ci.tipo_item = 'habitacion'
       AND ci.referencia_id = rh.id
      JOIN pagos p ON p.carrito_id = c.id
      LEFT JOIN reembolsos r ON r.pago_id = p.id
      WHERE rh.id = :reservationId
      GROUP BY rh.id, c.id, p.id;
    `,
    {
      replacements: { reservationId, cartId },
      type: QueryTypes.SELECT,
    },
  )) as FinancialRow[];
  const row = rows[0] ?? null;
  const grossApproved = row && [
    "aprobado",
    "reembolsado_parcial",
    "reembolsado",
  ].includes(row.payment_state)
    ? Number(row.payment_amount)
    : 0;
  const refunded = Number(row?.approved_refunded ?? 0);
  const netApproved = round(Math.max(0, grossApproved - refunded));
  const remaining = round(
    Math.max(0, Number(row?.reservation_total ?? 0) - netApproved),
  );

  return { row, grossApproved, refunded, netApproved, remaining };
};

const semanticSummary = (response: any) => ({
  total: Number(response.body.data?.total),
  netApproved: Number(response.body.data?.aprobado),
  remaining: Number(response.body.data?.saldo),
});

describe("Resumen financiero de ReservaHabitacion pagada por carrito", () => {
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
      expect(reservationResponse.status, JSON.stringify(reservationResponse.body)).toBe(201);
      expect(reservationResponse.body.data.total).toBe("100.00");
      const reservationId = Number(reservationResponse.body.data.id);

      const cartResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", authorization)
        .send({});
      expect(cartResponse.status, JSON.stringify(cartResponse.body)).toBe(201);
      const cartId = Number(cartResponse.body.data.id);

      const itemResponse = await request(app)
        .post(`/api/carritos/${cartId}/items`)
        .set("Authorization", authorization)
        .send({ tipo_item: "habitacion", referencia_id: reservationId });
      expect(itemResponse.status, JSON.stringify(itemResponse.body)).toBe(201);
      expect(itemResponse.body.data.precio).toBe("100.00");

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          carrito_id: cartId,
          monto: "100.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-rh-fin-candidate-031-payment",
        });
      expect(paymentResponse.status, JSON.stringify(paymentResponse.body)).toBe(201);
      expect(paymentResponse.body.data.estado).toBe("procesando");
      const paymentId = Number(paymentResponse.body.data.pago_id);
      const intent = stripeMock.intents.get("pi_rh_summary_031_001");
      expect(intent).toBeDefined();
      intent!.status = "succeeded";
      stripeMock.webhook.event = {
        id: "evt_rh_summary_031_payment_succeeded",
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
      const webhookResponse = await request(app)
        .post("/api/pagos/stripe/webhook")
        .set("Stripe-Signature", "t=1,v1=qa-local-signature")
        .set("Content-Type", "application/json")
        .send(JSON.stringify({ id: "evt_rh_summary_031_payment_succeeded" }));
      expect(webhookResponse.status, JSON.stringify(webhookResponse.body)).toBe(200);

      const initialPersisted = await persistedFinancialState(reservationId, cartId);
      const initialExposure = await reservationFinancialExposure(
        reservationId,
        undefined,
      );
      const initialSummaryResponse = await request(app)
        .get(`/api/pagos/resumen?reserva_habitacion_id=${reservationId}`)
        .set("Authorization", authorization);
      const initialSummary = semanticSummary(initialSummaryResponse);
      const initialExpected = {
        total: Number(initialPersisted.row?.reservation_total),
        netApproved: initialExposure.approved,
        remaining: round(
          Number(initialPersisted.row?.reservation_total) - initialExposure.approved,
        ),
      };
      const initialMatch =
        initialSummaryResponse.status === 200 &&
        initialSummary.total === initialExpected.total &&
        initialSummary.netApproved === initialExpected.netApproved &&
        initialSummary.remaining === initialExpected.remaining;

      let refundResponse: any = null;
      let refundPersisted: Awaited<ReturnType<typeof persistedFinancialState>> | null = null;
      let refundExposure: Awaited<ReturnType<typeof reservationFinancialExposure>> | null = null;
      let refundSummaryResponse: any = null;
      let refundSummary: ReturnType<typeof semanticSummary> | null = null;
      let refundExpected: ReturnType<typeof semanticSummary> | null = null;
      let refundMatch: boolean | null = null;

      if (initialMatch) {
        const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
        refundResponse = await request(app)
          .post(`/api/pagos/${paymentId}/reembolso`)
          .set("Authorization", `Bearer ${admin.token}`)
          .send({
            monto: "40.00",
            motivo: "requested_by_customer",
            idempotency_key: "qa-rh-fin-candidate-031-refund-40",
          });
        refundPersisted = await persistedFinancialState(reservationId, cartId);
        refundExposure = await reservationFinancialExposure(reservationId, undefined);
        refundSummaryResponse = await request(app)
          .get(`/api/pagos/resumen?reserva_habitacion_id=${reservationId}`)
          .set("Authorization", authorization);
        refundSummary = semanticSummary(refundSummaryResponse);
        refundExpected = {
          total: Number(refundPersisted.row?.reservation_total),
          netApproved: refundExposure.approved,
          remaining: round(
            Number(refundPersisted.row?.reservation_total) - refundExposure.approved,
          ),
        };
        refundMatch =
          refundResponse.status === 200 &&
          refundSummaryResponse.status === 200 &&
          refundPersisted.grossApproved === 100 &&
          refundPersisted.refunded === 40 &&
          refundPersisted.netApproved === 60 &&
          refundPersisted.remaining === 40 &&
          refundSummary.total === refundExpected.total &&
          refundSummary.netApproved === refundExpected.netApproved &&
          refundSummary.remaining === refundExpected.remaining;
      }

      const unexpected500 = [
        reservationResponse,
        cartResponse,
        itemResponse,
        paymentResponse,
        webhookResponse,
        initialSummaryResponse,
        refundResponse,
        refundSummaryResponse,
      ].some((response) => response?.status === 500);
      const evidence = {
        qaId: "QA-RH-FIN-CANDIDATE-031",
        result: initialMatch && refundMatch !== false ? "NOT_REPRODUCED" : "CONFIRMED",
        database: "hotel_test_db",
        stripe: {
          mode: "FULL_LOCAL_MOCK",
          realNetworkCalls: 0,
          intent: intent
            ? { id: intent.id, amountMinor: intent.amount, state: intent.status }
            : null,
          createPaymentIntentCalls: stripeMock.createPaymentIntent.mock.calls.length,
          createRefundCalls: stripeMock.createRefund.mock.calls.length,
          webhookCalls: stripeMock.constructEvent.mock.calls.length,
        },
        ids: { reservationId, cartId, paymentId },
        origin: "carrito",
        initial: {
          http: initialSummaryResponse.status,
          endpoint: `/api/pagos/resumen?reserva_habitacion_id=${reservationId}`,
          persisted: initialPersisted,
          exposure: initialExposure,
          summaryFields: initialSummaryResponse.body.data ?? null,
          summarySemantic: initialSummary,
          expectedSemantic: initialExpected,
          match: initialMatch,
        },
        refund: initialMatch
          ? {
              amount: "40.00",
              http: refundResponse.status,
              persisted: refundPersisted,
              exposure: refundExposure,
              summaryHttp: refundSummaryResponse.status,
              summaryFields: refundSummaryResponse.body.data ?? null,
              summarySemantic: refundSummary,
              expectedSemantic: refundExpected,
              match: refundMatch,
            }
          : "NOT_RUN_INITIAL_SUMMARY_MISMATCH",
        violation: initialMatch
          ? refundMatch === false
            ? "El resumen posterior al reembolso no coincide con la exposición/persistencia"
            : null
          : "El resumen inicial omite el pago aprobado originado en el carrito",
        unexpected500,
        regressions: {
          qa020: "observado indirectamente: exposición agregada del único origen carrito",
          qa030: "observado indirectamente: atribución Q100 de carrito a una única reserva Q100",
        },
      };

      console.log("[QA-RH-FIN-CANDIDATE-031]", JSON.stringify(evidence, null, 2));

      expect.soft(unexpected500, "El flujo no debe producir HTTP 500").toBe(false);
      expect.soft(initialPersisted.row).toMatchObject({
        reservation_id: reservationId,
        reservation_total: "100.00",
        cart_id: cartId,
        cart_item_count: "1",
        payment_id: paymentId,
        payment_amount: "100.00",
        payment_state: "aprobado",
        payment_origin_reservation_id: null,
        approved_refunded: "0.00",
      });
      expect.soft(initialExposure).toEqual({ approved: 100, processing: 0, total: 100 });
      expect.soft(initialSummaryResponse.status).toBe(200);
      expect.soft(
        initialSummary,
        "El resumen por reserva debe incluir semánticamente el aprobado neto de pagos hechos mediante su carrito",
      ).toEqual(initialExpected);
      if (initialMatch) {
        expect.soft(refundResponse.status).toBe(200);
        expect.soft(refundPersisted).toMatchObject({
          grossApproved: 100,
          refunded: 40,
          netApproved: 60,
          remaining: 40,
        });
        expect.soft(refundExposure).toEqual({ approved: 60, processing: 0, total: 60 });
        expect.soft(refundSummary).toEqual(refundExpected);
      }
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.updatePaymentIntentMetadata).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
    },
    30000,
  );
});
