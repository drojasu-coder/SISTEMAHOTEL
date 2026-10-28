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
          "QA-RH-FIN-CANDIDATE-028 solo permite un PaymentIntent local"
        );
      }

      const intent: IntentState = {
        id: "pi_rh_approved_mutation_028_001",
        status: "requires_payment_method",
        client_secret: "pi_rh_approved_mutation_028_001_secret_qa_local",
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
        "No se configuró el webhook local de QA-RH-FIN-CANDIDATE-028"
      );
    }
    return webhook.event;
  });
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-RH-FIN-CANDIDATE-028`
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
 * FULL LOCAL MOCK: sustituye stripe.service antes de importar app. El único
 * PaymentIntent y el webhook firmado viven en memoria; el SDK de Stripe no se
 * carga y no existe tráfico de red ni posibilidad de generar cargos reales.
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
import { assignEmpleadoSede, createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-RH-FIN-CANDIDATE-028: rechaza reducir el total debajo del pago aprobado";

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
  reserva_habitacion_id: number | null;
  carrito_id: number | null;
  monto: string;
  metodo: string;
  estado: string;
  moneda: string;
  pasarela: string | null;
  id_transaccion_externo: string | null;
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
        p.pasarela,
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
  const refundCounts = (await sequelize.query(
    `
      SELECT COUNT(*)::integer AS count
      FROM reembolsos r
      INNER JOIN pagos p ON p.id = r.pago_id
      WHERE p.reserva_habitacion_id = :reservationId;
    `,
    {
      replacements: { reservationId },
      type: QueryTypes.SELECT,
    }
  )) as Array<{ count: number }>;

  return {
    reservation: reservations[0] ?? null,
    payments,
    refundCount: Number(refundCounts[0]?.count ?? 0),
  };
};

const isFinancialRejectionCode = (code: unknown) => {
  if (typeof code !== "string") return false;
  return (
    code === "PAYMENT_EXCEEDS_NEW_TOTAL" ||
    /^(?:RESERVATION_)?(?:PAYMENT|FINANCIAL_EXPOSURE)_EXCEEDS_(?:NEW_)?TOTAL$/.test(
      code
    )
  );
};

describe("Mutación de ReservaHabitacion con pago aprobado", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const gerente = await createAuthenticatedUser({
        rol: ROLES.GERENTE_HABITACIONES,
      });
      const hotel = await createHotelFixture({ capacidad: 2, tarifa: 100 });
      // El gerente opera en la sede del hotel de la prueba.
      await assignEmpleadoSede(gerente.usuario.id, hotel.sucursal.id);
      const clientAuthorization = `Bearer ${cliente.token}`;
      const managerAuthorization = `Bearer ${gerente.token}`;
      const fechaEntrada = getHotelDatePlusDays(10);
      const fechaSalidaInicial = getHotelDatePlusDays(13);
      const fechaSalidaReducida = getHotelDatePlusDays(11);

      const reservationResponse = await request(app)
        .post("/api/reservas-habitacion")
        .set("Authorization", clientAuthorization)
        .send({
          habitacion_id: hotel.habitacion.id,
          fecha_entrada: fechaEntrada,
          fecha_salida: fechaSalidaInicial,
          numero_huespedes: 1,
        });

      expect(
        reservationResponse.status,
        `Precondición inválida al crear reserva: ${JSON.stringify(
          reservationResponse.body
        )}`
      ).toBe(201);
      expect(reservationResponse.body.data.total).toBe("300.00");
      expect(reservationResponse.body.data.estado).toBe("pendiente");
      const reservationId = Number(reservationResponse.body.data.id);

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", clientAuthorization)
        .send({
          reserva_habitacion_id: reservationId,
          monto: "300.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-rh-fin-candidate-028-direct",
        });

      expect(
        paymentResponse.status,
        `Precondición inválida al crear Pago directo: ${JSON.stringify(
          paymentResponse.body
        )}`
      ).toBe(201);
      expect(paymentResponse.body.data.estado).toBe("procesando");
      expect(paymentResponse.body.data.monto).toBe("300.00");
      const paymentId = Number(paymentResponse.body.data.pago_id);
      const intentId = String(paymentResponse.body.data.payment_intent_id);
      const intent = stripeMock.intents.get(intentId);
      expect(intent).toBeDefined();
      expect(intent!.amount).toBe(30000);
      expect(intent!.currency).toBe("gtq");
      expect(intent!.metadata).toMatchObject({
        pago_id: String(paymentId),
        reserva_habitacion_id: String(reservationId),
        tipo_pago: "total",
      });

      intent!.status = "succeeded";
      stripeMock.webhook.event = {
        id: "evt_rh_approved_mutation_028_001",
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
        .send(JSON.stringify({ id: "evt_rh_approved_mutation_028_001" }));

      expect(
        webhookResponse.status,
        `Precondición inválida al aprobar Pago: ${JSON.stringify(
          webhookResponse.body
        )}`
      ).toBe(200);

      const before = await persistedSnapshot(reservationId);
      const beforeExposure = await reservationFinancialExposure(
        reservationId,
        undefined
      );

      // Precondiciones obligatorias: si cualquiera falla, el escenario queda
      // bloqueado y el PATCH financiero no constituye evidencia válida.
      expect(before.reservation).toEqual({
        id: reservationId,
        habitacion_id: Number(hotel.habitacion.id),
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalidaInicial,
        estado: "confirmada",
        total: "300.00",
      });
      expect(before.payments).toHaveLength(1);
      expect(before.payments[0]).toMatchObject({
        id: paymentId,
        reserva_habitacion_id: reservationId,
        carrito_id: null,
        monto: "300.00",
        metodo: "tarjeta",
        estado: "aprobado",
        moneda: "GTQ",
        pasarela: "stripe",
        id_transaccion_externo: intentId,
        approved_refunds: "0.00",
      });
      expect(beforeExposure).toEqual({
        approved: 300,
        processing: 0,
        total: 300,
      });
      expect(before.refundCount).toBe(0);
      expect(stripeMock.intents.size).toBe(1);

      // Única mutación de la obligación: PATCH real; no se toca Pago ni DB.
      const patchResponse = await request(app)
        .patch(`/api/reservas-habitacion/${reservationId}`)
        .set("Authorization", managerAuthorization)
        .send({ fecha_salida: fechaSalidaReducida });

      const after = await persistedSnapshot(reservationId);
      const afterExposure = await reservationFinancialExposure(
        reservationId,
        undefined
      );
      const afterPayment = after.payments[0] ?? null;
      const currentObligation = Number(after.reservation?.total ?? 0);
      const approvedExceedsCurrentObligation =
        afterExposure.approved > currentObligation;
      const snapshotIntact =
        JSON.stringify(after.reservation) === JSON.stringify(before.reservation) &&
        JSON.stringify(after.payments) === JSON.stringify(before.payments) &&
        after.refundCount === before.refundCount &&
        JSON.stringify(afterExposure) === JSON.stringify(beforeExposure);
      const financialCode = isFinancialRejectionCode(
        patchResponse.body?.code
      );
      const safelyRejected =
        patchResponse.status === 409 && financialCode && snapshotIntact;
      const violation =
        patchResponse.status === 200 &&
        after.reservation?.fecha_salida === fechaSalidaReducida &&
        after.reservation?.total === "100.00" &&
        afterPayment?.estado === "aprobado" &&
        afterExposure.approved === 300 &&
        afterExposure.processing === 0 &&
        after.refundCount === 0 &&
        approvedExceedsCurrentObligation;
      const unexpected500 = [
        reservationResponse,
        paymentResponse,
        webhookResponse,
        patchResponse,
      ].some((response) => response.status === 500);

      const evidence = {
        qaId: "QA-RH-FIN-CANDIDATE-028",
        database: "hotel_test_db",
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        ids: { reservationId, paymentId, paymentIntentId: intentId },
        http: {
          reservationCreate: {
            status: reservationResponse.status,
            code: reservationResponse.body.code ?? null,
          },
          paymentCreate: {
            status: paymentResponse.status,
            code: paymentResponse.body.code ?? null,
          },
          webhook: {
            status: webhookResponse.status,
            code: webhookResponse.body.code ?? null,
          },
          patch: {
            type: "fecha_salida: 3 noches -> 1 noche",
            status: patchResponse.status,
            code: patchResponse.body.code ?? null,
            body: patchResponse.body,
          },
          unexpected500,
        },
        before: {
          reservation: before.reservation,
          payments: before.payments,
          localPaymentCount: before.payments.length,
          exposure: beforeExposure,
          refundCount: before.refundCount,
          paymentIntentCount: stripeMock.intents.size,
        },
        after: {
          reservation: after.reservation,
          payments: after.payments,
          localPaymentCount: after.payments.length,
          exposure: afterExposure,
          currentObligation: currentObligation.toFixed(2),
          approvedExceedsCurrentObligation,
          refundCount: after.refundCount,
          paymentIntentCount: stripeMock.intents.size,
        },
        outcome: {
          financialCode,
          snapshotIntact,
          safelyRejected,
          violation,
        },
        regressions: {
          qa021: {
            regressionObserved: false,
            distinction:
              "Webhook succeeded antes del PATCH; exposición al mutar: approved=300, processing=0",
          },
          qa027: {
            regressionObserved: false,
            exercised: false,
            reason: "Escenario directo sin carrito; QA-027 no se reabre",
          },
        },
      };

      console.log(
        "[QA-RH-FIN-CANDIDATE-028]",
        JSON.stringify(evidence, null, 2)
      );

      expect.soft(unexpected500, "El flujo no debe producir HTTP 500").toBe(
        false
      );
      expect.soft(
        patchResponse.status,
        "El PATCH debe rechazar la reducción bajo el aprobado neto"
      ).toBe(409);
      expect.soft(
        financialCode,
        "El rechazo debe usar PAYMENT_EXCEEDS_NEW_TOTAL o un código financiero semánticamente equivalente"
      ).toBe(true);
      expect.soft(
        after.reservation,
        "Habitación, fechas, estado y total deben conservar el snapshot original"
      ).toEqual(before.reservation);
      expect.soft(after.payments, "El Pago aprobado debe quedar intacto").toEqual(
        before.payments
      );
      expect.soft(afterExposure).toEqual(beforeExposure);
      expect.soft(after.refundCount, "No debe crearse ningún reembolso").toBe(0);
      expect.soft(after.payments).toHaveLength(1);
      expect.soft(stripeMock.intents.size).toBe(1);
      expect.soft(
        safelyRejected,
        "El rechazo financiero debe ser atómico y conservar PostgreSQL intacto"
      ).toBe(true);
      expect.soft(
        violation,
        "No puede persistir Q300.00 aprobado sobre una obligación reducida a Q100.00"
      ).toBe(false);

      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.constructEvent).toHaveBeenCalledTimes(1);
      expect(stripeMock.updatePaymentIntentMetadata).not.toHaveBeenCalled();
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
    },
    30000
  );
});
