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
      if (intents.size !== 0) {
        throw new Error(
          "QA-RH-FIN-CANDIDATE-021 solo permite un PaymentIntent local"
        );
      }

      const intent: IntentState = {
        id: "pi_rh_mutation_021_001",
        status: "requires_payment_method",
        client_secret:
          "pi_rh_mutation_021_001_secret_qa_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };

      intents.set(intent.id, intent);
      return { ...intent };
    }
  );
  const constructEvent = vi.fn(() => {
    if (!webhook.event) {
      throw new Error(
        "No se configuró el webhook local de QA-RH-FIN-CANDIDATE-021"
      );
    }
    return webhook.event;
  });
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-RH-FIN-CANDIDATE-021`
      );
    });

  return {
    intents,
    webhook,
    createPaymentIntent,
    constructEvent,
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
    createRefund: forbidden("createRefund"),
  };
});

/**
 * FULL LOCAL MOCK: reemplaza stripe.service antes de importar app. El único
 * PaymentIntent y el evento firmado existen solo en memoria; no se carga el
 * SDK ni se realiza ninguna llamada de red a Stripe.
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
    cancelPaymentIntent: stripeMock.cancelPaymentIntent,
    createRefund: stripeMock.createRefund,
    constructEvent: stripeMock.constructEvent,
  },
}));

import { QueryTypes } from "sequelize";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-RH-FIN-CANDIDATE-021: vincula la autorización Stripe al total inmutable de ReservaHabitacion";

interface ReservationRow {
  id: number;
  habitacion_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  estado: string;
  total: string;
}

interface PaymentRow {
  id: number;
  reserva_habitacion_id: number;
  carrito_id: number | null;
  monto: string;
  metodo: string;
  estado: string;
  moneda: string;
  id_transaccion_externo: string;
  approved_refunds: string;
}

const persistedSnapshot = async (reservationId: number) => {
  const reservations = (await sequelize.query(
    `
      SELECT
        id,
        habitacion_id,
        fecha_entrada::text AS fecha_entrada,
        fecha_salida::text AS fecha_salida,
        estado,
        total::numeric(10, 2)::text AS total
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
        p.carrito_id,
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

  return {
    reservation: reservations[0] ?? null,
    payments,
    approved,
    processing,
  };
};

describe("Binding financiero al mutar ReservaHabitacion", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });
      const gerente = await createAuthenticatedUser({
        rol: ROLES.GERENTE_HABITACIONES,
      });
      const hotel = await createHotelFixture({
        capacidad: 2,
        tarifa: 100,
      });
      const clientAuthorization = `Bearer ${cliente.token}`;
      const managerAuthorization = `Bearer ${gerente.token}`;

      const reservationResponse = await request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", clientAuthorization)
        .send({
          habitacion_id: hotel.habitacion.id,
          fecha_entrada: "2035-07-10",
          fecha_salida: "2035-07-13",
          numero_huespedes: 1,
        });

      expect(reservationResponse.status).toBe(201);
      expect(reservationResponse.body.data.total).toBe("300.00");
      expect(reservationResponse.body.data.estado).toBe("pendiente");

      const reservationId = Number(reservationResponse.body.data.id);
      const authorizationSnapshot = await persistedSnapshot(reservationId);

      expect(authorizationSnapshot.reservation).toMatchObject({
        id: reservationId,
        habitacion_id: Number(hotel.habitacion.id),
        fecha_entrada: "2035-07-10",
        fecha_salida: "2035-07-13",
        estado: "pendiente",
        total: "300.00",
      });

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", clientAuthorization)
        .send({
          reserva_habitacion_id: reservationId,
          monto: authorizationSnapshot.reservation!.total,
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-rh-fin-candidate-021-direct",
        });

      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.body.data.estado).toBe("procesando");
      expect(paymentResponse.body.data.monto).toBe("300.00");
      expect(paymentResponse.body.data.payment_intent_id).toBe(
        "pi_rh_mutation_021_001"
      );

      const paymentId = Number(paymentResponse.body.data.pago_id);
      const intent = stripeMock.intents.get("pi_rh_mutation_021_001");
      expect(intent).toBeDefined();
      expect(intent!.amount).toBe(30000);
      expect(intent!.currency).toBe("gtq");
      expect(intent!.metadata.pago_id).toBe(String(paymentId));
      expect(intent!.metadata.reserva_habitacion_id).toBe(
        String(reservationId)
      );

      const beforeMutation = await persistedSnapshot(reservationId);
      expect(beforeMutation.payments).toHaveLength(1);
      expect(beforeMutation.payments[0]).toMatchObject({
        id: paymentId,
        reserva_habitacion_id: reservationId,
        carrito_id: null,
        monto: "300.00",
        metodo: "tarjeta",
        estado: "procesando",
        moneda: "GTQ",
        id_transaccion_externo: intent!.id,
      });
      expect(beforeMutation.approved).toBe(0);
      expect(beforeMutation.processing).toBe(300);

      // Única mutación de la obligación: endpoint PATCH real, sin escritura DB.
      const patchResponse = await request(app)
        .patch(`/api/reservas-habitacion/${reservationId}`)
        .set("Authorization", managerAuthorization)
        .send({ fecha_salida: "2035-07-11" });
      const afterMutation = await persistedSnapshot(reservationId);
      const patchRejectedSafely =
        patchResponse.status === 409 &&
        afterMutation.reservation?.habitacion_id ===
          authorizationSnapshot.reservation?.habitacion_id &&
        afterMutation.reservation?.fecha_entrada ===
          authorizationSnapshot.reservation?.fecha_entrada &&
        afterMutation.reservation?.fecha_salida ===
          authorizationSnapshot.reservation?.fecha_salida &&
        afterMutation.reservation?.total ===
          authorizationSnapshot.reservation?.total;
      const obligationChanged =
        patchResponse.status === 200 &&
        afterMutation.reservation?.total !==
          authorizationSnapshot.reservation?.total;

      let webhookResponse: any = null;
      if (obligationChanged) {
        intent!.status = "succeeded";
        stripeMock.webhook.event = {
          id: "evt_rh_mutation_021_001",
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

        webhookResponse = await request(app)
          .post("/api/pagos/stripe/webhook")
          .set("Stripe-Signature", "t=1,v1=qa-local-signature")
          .set("Content-Type", "application/json")
          .send(JSON.stringify({ id: "evt_rh_mutation_021_001" }));
      }

      const final = await persistedSnapshot(reservationId);
      const finalPayment = final.payments[0] ?? null;
      const authorizedAmount = intent!.amount / 100;
      const currentObligation = Number(final.reservation?.total ?? 0);
      const authorizationMatchesCurrent =
        authorizedAmount === currentObligation;
      const violationA =
        obligationChanged &&
        !authorizationMatchesCurrent &&
        (finalPayment?.estado === "aprobado" ||
          final.reservation?.estado === "confirmada");
      const reconciliationFailure =
        obligationChanged &&
        !authorizationMatchesCurrent &&
        intent!.status === "succeeded" &&
        (webhookResponse?.status !== 200 ||
          finalPayment?.estado !== "aprobado");
      const bindingViolation = violationA || reconciliationFailure;
      const unexpected500 = [
        reservationResponse,
        paymentResponse,
        patchResponse,
        webhookResponse,
      ].some((response) => response?.status === 500);

      const evidence = {
        qaId: "QA-RH-FIN-CANDIDATE-021",
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        ids: {
          reservationId,
          paymentId,
          paymentIntentId: intent!.id,
        },
        authorizationSnapshot: authorizationSnapshot.reservation,
        beforeMutation: {
          reservation: beforeMutation.reservation,
          payments: beforeMutation.payments,
          approved: beforeMutation.approved.toFixed(2),
          processing: beforeMutation.processing.toFixed(2),
        },
        http: {
          createReservation: {
            status: reservationResponse.status,
            code: reservationResponse.body.code ?? null,
          },
          createPayment: {
            status: paymentResponse.status,
            code: paymentResponse.body.code ?? null,
            state: paymentResponse.body.data?.estado ?? null,
          },
          patch: {
            status: patchResponse.status,
            code: patchResponse.body.code ?? null,
            body: patchResponse.body,
          },
          webhook: webhookResponse
            ? {
                status: webhookResponse.status,
                code: webhookResponse.body.code ?? null,
                body: webhookResponse.body,
              }
            : "NOT RUN: PATCH blocked",
          unexpected500,
        },
        afterMutation: afterMutation.reservation,
        paymentIntent: {
          id: intent!.id,
          status: intent!.status,
          amountMinor: intent!.amount,
          authorizedAmount: authorizedAmount.toFixed(2),
          currency: intent!.currency,
          metadata: intent!.metadata,
        },
        finalDatabase: {
          reservation: final.reservation,
          payments: final.payments,
          paymentCount: final.payments.length,
          approved: final.approved.toFixed(2),
          processing: final.processing.toFixed(2),
          currentObligation: currentObligation.toFixed(2),
        },
        outcome: {
          patchRejectedSafely,
          obligationChanged,
          authorizationMatchesCurrent,
          violationA,
          reconciliationFailure,
          bindingViolation,
        },
        regressionObserved: {
          qa019:
            "tarjeta quedó procesando y aprobado Q0.00 antes del webhook; no se usó efectivo",
          qa020:
            "un solo Pago y un solo PaymentIntent; exposición inicial Q300.00 igual al total Q300.00",
          testsReexecuted: false,
          existingTestsModified: false,
        },
        expected: {
          safeOutcomes:
            "PATCH 409 conservando habitación/fechas/total, o ninguna aprobación/confirmación ni divergencia irreconciliable tras succeeded",
          violationA:
            "intent amount != obligación actual y webhook aprueba Pago/confirma ReservaHabitacion",
          violationB:
            "Stripe succeeded queda sin reconciliación local por haber permitido mutar la obligación",
        },
      };

      console.log(
        "[QA-RH-FIN-CANDIDATE-021]",
        JSON.stringify(evidence, null, 2)
      );

      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.intents).toHaveLength(1);
      expect(final.payments).toHaveLength(1);
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
      expect(stripeMock.constructEvent).toHaveBeenCalledTimes(
        obligationChanged ? 1 : 0
      );
      expect.soft(unexpected500, "El flujo no debe producir HTTP 500").toBe(
        false
      );
      expect.soft(
        patchRejectedSafely || obligationChanged,
        "El PATCH financiero debe rechazarse con 409 conservando el snapshot o aplicar realmente la nueva obligación"
      ).toBe(true);
      expect.soft(
        bindingViolation,
        "No debe aprobarse un intent desalineado ni quedar un succeeded externo irreconciliable por mutar la obligación"
      ).toBe(false);
    },
    30000
  );
});
