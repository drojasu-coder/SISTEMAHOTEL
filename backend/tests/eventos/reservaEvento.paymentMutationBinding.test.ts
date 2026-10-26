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
    idempotency_key?: string;
  };

  const intents = new Map<string, IntentState>();
  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => {
      if (intents.size !== 0) {
        throw new Error(
          "QA-EVT-FIN-CANDIDATE-037 solo permite un PaymentIntent local"
        );
      }

      const intent: IntentState = {
        id: "pi_evt_mutation_037_001",
        status: "requires_payment_method",
        client_secret: "pi_evt_mutation_037_001_secret_qa_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };

      intents.set(intent.id, intent);
      return { ...intent };
    }
  );
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-EVT-FIN-CANDIDATE-037 variante A`
      );
    });

  return {
    intents,
    createPaymentIntent,
    updatePaymentIntentMetadata: forbidden("updatePaymentIntentMetadata"),
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
    createRefund: forbidden("createRefund"),
    constructEvent: forbidden("constructEvent"),
  };
});

/**
 * FULL LOCAL MOCK: el único PaymentIntent vive en memoria. No se carga Stripe,
 * no hay webhook y no existe tráfico de red ni posibilidad de cargos reales.
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

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { eventFinancialExposure } from "../../src/services/pago.service";
import { createSalonEvento } from "../fixtures/eventos";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-EVT-FIN-CANDIDATE-037 A: rechaza reducir la obligación con un pago procesando";

interface ReservationRow {
  id: number;
  salon_id: number;
  estado: string;
  total: string;
  anticipo: string;
}

interface SalonRow {
  id: number;
  capacidad_maxima: number;
  tarifa_base: string;
}

interface CartItemRow {
  id: number;
  carrito_id: number;
  tipo_item: string;
  referencia_id: number;
  precio: string;
  cantidad: number;
}

interface PaymentRow {
  id: number;
  carrito_id: number;
  monto: string;
  metodo: string;
  tipo_pago: string;
  estado: string;
  moneda: string;
  pasarela: string | null;
  id_transaccion_externo: string | null;
  approved_refunds: string;
}

const persistedSnapshot = async (
  reservationId: number,
  salonIds: number[]
) => {
  const reservations = (await sequelize.query(
    `
      SELECT
        id,
        salon_id,
        estado,
        total::numeric(10, 2)::text AS total,
        anticipo::numeric(10, 2)::text AS anticipo
      FROM reservas_evento
      WHERE id = :reservationId;
    `,
    {
      replacements: { reservationId },
      type: QueryTypes.SELECT,
    }
  )) as ReservationRow[];
  const salons = (await sequelize.query(
    `
      SELECT
        id,
        capacidad_maxima,
        tarifa_base::numeric(10, 2)::text AS tarifa_base
      FROM salones
      WHERE id IN (:salonIds)
      ORDER BY id ASC;
    `,
    {
      replacements: { salonIds },
      type: QueryTypes.SELECT,
    }
  )) as SalonRow[];
  const cartItems = (await sequelize.query(
    `
      SELECT
        id,
        carrito_id,
        tipo_item,
        referencia_id,
        precio::numeric(10, 2)::text AS precio,
        cantidad
      FROM carrito_items
      WHERE tipo_item = 'evento'
        AND referencia_id = :reservationId
      ORDER BY id ASC;
    `,
    {
      replacements: { reservationId },
      type: QueryTypes.SELECT,
    }
  )) as CartItemRow[];
  const payments = (await sequelize.query(
    `
      SELECT DISTINCT
        p.id,
        p.carrito_id,
        p.monto::numeric(10, 2)::text AS monto,
        p.metodo,
        p.tipo_pago,
        p.estado,
        p.moneda,
        p.pasarela,
        p.id_transaccion_externo,
        COALESCE((
          SELECT SUM(r.monto)
          FROM reembolsos r
          WHERE r.pago_id = p.id
            AND r.estado = 'aprobado'
        ), 0)::numeric(10, 2)::text AS approved_refunds
      FROM pagos p
      INNER JOIN carrito_items ci ON ci.carrito_id = p.carrito_id
      WHERE ci.tipo_item = 'evento'
        AND ci.referencia_id = :reservationId
      ORDER BY p.id ASC;
    `,
    {
      replacements: { reservationId },
      type: QueryTypes.SELECT,
    }
  )) as PaymentRow[];

  const approved = payments.reduce(
    (sum, payment) =>
      ["aprobado", "reembolsado_parcial", "reembolsado"].includes(
        payment.estado
      )
        ? sum + Math.max(0, Number(payment.monto) - Number(payment.approved_refunds))
        : sum,
    0
  );
  const processing = payments
    .filter((payment) => payment.estado === "procesando")
    .reduce((sum, payment) => sum + Number(payment.monto), 0);

  return {
    reservation: reservations[0] ?? null,
    salons,
    cartItems,
    payments,
    approved,
    processing,
  };
};

describe("Binding financiero al mutar ReservaEvento", () => {
  it(
    TEST_NAME,
    async () => {
      const databaseRows = (await sequelize.query(
        "SELECT current_database() AS database;",
        { type: QueryTypes.SELECT }
      )) as Array<{ database: string }>;
      expect(databaseRows[0]?.database).toBe("hotel_test_db");

      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const authorization = `Bearer ${cliente.token}`;
      const salonA = await createSalonEvento({
        capacidad_maxima: 100,
        tarifa_base: 5000,
      });
      const salonB = await createSalonEvento({
        capacidad_maxima: 100,
        tarifa_base: 3000,
      });

      const reservationResponse = await request(app)
        .post("/api/reservas-evento")
        .set("Authorization", authorization)
        .send({
          salon_id: salonA.id,
          tipo_evento: "boda",
          fecha: "2035-09-10",
          hora_inicio: "10:00",
          hora_fin: "14:00",
          numero_invitados: 50,
        });

      expect(
        reservationResponse.status,
        `Precondición inválida al crear evento: ${JSON.stringify(
          reservationResponse.body
        )}`
      ).toBe(201);
      expect(Number(reservationResponse.body.data.total)).toBe(5000);
      expect(reservationResponse.body.data.estado).toBe("cotizacion");
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
        .send({ tipo_item: "evento", referencia_id: reservationId });
      expect(addResponse.status).toBe(201);
      expect(Number(addResponse.body.data.precio)).toBe(5000);

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", authorization)
        .send({
          carrito_id: cartId,
          monto: "5000.00",
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-evt-fin-candidate-037-a",
        });

      expect(
        paymentResponse.status,
        `Precondición inválida al crear Pago: ${JSON.stringify(
          paymentResponse.body
        )}`
      ).toBe(201);
      expect(paymentResponse.body.data.estado).toBe("procesando");
      expect(paymentResponse.body.data.monto).toBe("5000.00");
      const paymentId = Number(paymentResponse.body.data.pago_id);
      const intentId = String(paymentResponse.body.data.payment_intent_id);
      const intent = stripeMock.intents.get(intentId);
      expect(intent).toBeDefined();
      expect(intent).toMatchObject({
        id: "pi_evt_mutation_037_001",
        status: "requires_payment_method",
        amount: 500000,
        currency: "gtq",
      });
      expect(intent!.metadata).toMatchObject({
        pago_id: String(paymentId),
        carrito_id: String(cartId),
        tipo_pago: "total",
      });

      const before = await persistedSnapshot(reservationId, [
        Number(salonA.id),
        Number(salonB.id),
      ]);
      const beforeExposure = await eventFinancialExposure(
        reservationId,
        undefined
      );

      expect(before.reservation).toMatchObject({
        id: reservationId,
        salon_id: Number(salonA.id),
        estado: "cotizacion",
        total: "5000.00",
      });
      expect(before.salons).toEqual([
        expect.objectContaining({
          id: Number(salonA.id),
          capacidad_maxima: 100,
          tarifa_base: "5000.00",
        }),
        expect.objectContaining({
          id: Number(salonB.id),
          capacidad_maxima: 100,
          tarifa_base: "3000.00",
        }),
      ]);
      expect(before.cartItems).toHaveLength(1);
      expect(before.cartItems[0]).toMatchObject({
        carrito_id: cartId,
        tipo_item: "evento",
        referencia_id: reservationId,
        precio: "5000.00",
        cantidad: 1,
      });
      expect(before.payments).toHaveLength(1);
      expect(before.payments[0]).toMatchObject({
        id: paymentId,
        carrito_id: cartId,
        monto: "5000.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        estado: "procesando",
        moneda: "GTQ",
        pasarela: "stripe",
        id_transaccion_externo: intentId,
        approved_refunds: "0.00",
      });
      expect(before.approved).toBe(0);
      expect(before.processing).toBe(5000);
      expect(beforeExposure).toEqual({
        approved: 0,
        processing: 5000,
        total: 5000,
      });
      expect(intent!.amount / 100).toBe(Number(before.reservation!.total));

      // Única mutación económica: PATCH HTTP real. No se toca DB, salón ni pago.
      const patchResponse = await request(app)
        .patch(`/api/reservas-evento/${reservationId}`)
        .set("Authorization", authorization)
        .send({ salon_id: Number(salonB.id) });

      const after = await persistedSnapshot(reservationId, [
        Number(salonA.id),
        Number(salonB.id),
      ]);
      const afterExposure = await eventFinancialExposure(
        reservationId,
        undefined
      );
      const currentObligation = Number(after.reservation?.total ?? 0);
      const authorizedAmount = intent!.amount / 100;
      const authorizationMatchesCurrent = authorizedAmount === currentObligation;
      const snapshotIntact =
        JSON.stringify(after.reservation) === JSON.stringify(before.reservation) &&
        JSON.stringify(after.cartItems) === JSON.stringify(before.cartItems) &&
        JSON.stringify(after.payments) === JSON.stringify(before.payments) &&
        JSON.stringify(afterExposure) === JSON.stringify(beforeExposure);
      const safelyRejected = patchResponse.status === 409 && snapshotIntact;
      const violation =
        patchResponse.status === 200 &&
        after.reservation?.salon_id === Number(salonB.id) &&
        after.reservation?.total === "3000.00" &&
        after.payments.length === 1 &&
        after.payments[0].estado === "procesando" &&
        after.payments[0].monto === "5000.00" &&
        afterExposure.approved === 0 &&
        afterExposure.processing === 5000 &&
        !authorizationMatchesCurrent;
      const unexpected500 = [
        reservationResponse,
        cartResponse,
        addResponse,
        paymentResponse,
        patchResponse,
      ].some((response) => response.status === 500);

      const evidence = {
        qaId: "QA-EVT-FIN-CANDIDATE-037",
        variant: "A",
        database: databaseRows[0]?.database,
        stripeMode: "FULL_LOCAL_MOCK",
        realStripeCalls: 0,
        ids: {
          reservationId,
          salonAId: Number(salonA.id),
          salonBId: Number(salonB.id),
          cartId,
          cartItemId: Number(before.cartItems[0].id),
          paymentId,
          paymentIntentId: intentId,
        },
        http: {
          reservationCreate: reservationResponse.status,
          cartCreate: cartResponse.status,
          cartAdd: addResponse.status,
          paymentCreate: paymentResponse.status,
          patch: {
            bodySent: { salon_id: Number(salonB.id) },
            status: patchResponse.status,
            code: patchResponse.body.code ?? null,
            body: patchResponse.body,
          },
          unexpected500,
        },
        before: {
          reservation: before.reservation,
          salons: before.salons,
          cartItems: before.cartItems,
          payments: before.payments,
          directPostgresExposure: {
            approved: before.approved.toFixed(2),
            processing: before.processing.toFixed(2),
          },
          eventFinancialExposure: beforeExposure,
          authorizationMatchesCurrent: true,
        },
        after: {
          reservation: after.reservation,
          salons: after.salons,
          cartItems: after.cartItems,
          payments: after.payments,
          directPostgresExposure: {
            approved: after.approved.toFixed(2),
            processing: after.processing.toFixed(2),
          },
          eventFinancialExposure: afterExposure,
          obligation: currentObligation.toFixed(2),
          authorizationMatchesCurrent,
        },
        paymentIntent: {
          id: intent!.id,
          status: intent!.status,
          amountMinor: intent!.amount,
          amount: authorizedAmount.toFixed(2),
          currency: intent!.currency,
          metadata: intent!.metadata,
        },
        stripeCalls: {
          create: stripeMock.createPaymentIntent.mock.calls.length,
          updateMetadata:
            stripeMock.updatePaymentIntentMetadata.mock.calls.length,
          retrieve: stripeMock.retrievePaymentIntent.mock.calls.length,
          cancel: stripeMock.cancelPaymentIntent.mock.calls.length,
          refund: stripeMock.createRefund.mock.calls.length,
          webhook: stripeMock.constructEvent.mock.calls.length,
        },
        lockReview: {
          reservaEventoForUpdate: true,
          effectiveSalonForUpdate: true,
          eventFinancialExposureInvokedByPatch: false,
          paymentOrCartLocksInPatch: false,
          observedPath:
            "reservaEvento.service.update: ReservaEvento FOR UPDATE -> Salon FOR UPDATE -> cálculo -> update; no llama eventFinancialExposure",
        },
        outcome: {
          snapshotIntact,
          safelyRejected,
          authorizationMatchesCurrent,
          violation,
        },
        variantB: "NOT TESTED: variante A confirmó o rechazó por sí sola",
        regressionsObserved: {
          qa035:
            "un solo carrito, Pago y PaymentIntent; exposición inicial agregada Q5000.00, sin segundo compromiso",
          qa036:
            "sin servicios ni mutación de invitados; total inicial derivado del salón A Q5000.00",
          existingTestsReexecuted: false,
          existingTestsModified: false,
        },
        expected: {
          patch: "HTTP 409 sin mutación",
          finalReservation: "salón A; total Q5000.00",
          maximumActiveExposure: "Q5000.00",
          authorizationMatchesCurrent: true,
        },
      };

      console.log(
        "[QA-EVT-FIN-CANDIDATE-037]",
        JSON.stringify(evidence, null, 2)
      );

      expect(stripeMock.createPaymentIntent).toHaveBeenCalledTimes(1);
      expect(stripeMock.intents).toHaveLength(1);
      expect(stripeMock.updatePaymentIntentMetadata).not.toHaveBeenCalled();
      expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
      expect(stripeMock.createRefund).not.toHaveBeenCalled();
      expect(stripeMock.constructEvent).not.toHaveBeenCalled();
      expect.soft(unexpected500, "El flujo no debe producir HTTP 500").toBe(false);
      expect.soft(
        patchResponse.status,
        "Una obligación con Q5000 procesando debe rechazar el cambio Q5000 -> Q3000"
      ).toBe(409);
      expect.soft(
        snapshotIntact,
        "El rechazo debe conservar ReservaEvento, CarritoItem, Pago y exposición"
      ).toBe(true);
      expect.soft(
        authorizationMatchesCurrent,
        "PaymentIntent.amount debe seguir coincidiendo con la obligación vigente"
      ).toBe(true);
      expect.soft(
        afterExposure.total <= currentObligation,
        "La exposición financiera activa no debe superar la obligación"
      ).toBe(true);
      expect.soft(violation, "No debe persistir la firma exacta de la variante A").toBe(
        false
      );
    },
    30000
  );
});
