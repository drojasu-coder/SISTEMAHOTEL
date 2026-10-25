import { describe, expect, it, vi } from "vitest";

const stripeMock = vi.hoisted(() => {
  type Intent = {
    id: string;
    status: string;
    client_secret: string;
    amount: number;
    currency: string;
    metadata: Record<string, string>;
    idempotency_key?: string;
  };
  const intents = new Map<string, Intent>();
  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string,
    ) => {
      if (intents.size) throw new Error("QA-EVT-FIN-CANDIDATE-040 permite un solo PI local");
      const intent: Intent = {
        id: "pi_evt_mixed_cart_040_001",
        status: "requires_payment_method",
        client_secret: "pi_evt_mixed_cart_040_001_secret_local",
        amount: Math.round(Number(amount) * 100),
        currency: currency.toLowerCase(),
        metadata: { ...metadata },
        idempotency_key: idempotencyKey,
      };
      intents.set(intent.id, intent);
      return { ...intent };
    },
  );
  const forbidden = (name: string) => vi.fn(() => {
    throw new Error(`${name} no permitido en QA-EVT-FIN-CANDIDATE-040`);
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

/** FULL_LOCAL_MOCK: intents sólo en memoria; cero red y cero cargos reales. */
vi.mock("../../src/services/stripe.service", () => ({
  toStripeAmount: (amount: number | string, currency: string) => {
    if (currency !== "GTQ") throw new Error(`Moneda inesperada: ${currency}`);
    return Math.round(Number(amount) * 100);
  },
  stripeService: stripeMock,
}));

import { QueryTypes } from "sequelize";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import {
  eventFinancialExposure,
  reservationFinancialExposure,
} from "../../src/services/pago.service";
import { createSalonEvento } from "../fixtures/eventos";
import { createHotelFixture } from "../fixtures/hotel";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-EVT-FIN-CANDIDATE-040: un pago total cubre un carrito mixto de habitación y evento";

const hotelDatePlusDays = (days: number) => {
  const timeZone = process.env.APP_TIMEZONE || "America/Guatemala";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day") + days))
    .toISOString().slice(0, 10);
};

interface ItemRow {
  id: number;
  tipo_item: string;
  referencia_id: number;
  precio: string;
  cantidad: number;
}

interface PaymentRow {
  id: number;
  monto: string;
  estado: string;
  metodo: string;
  tipo_pago: string;
  id_transaccion_externo: string | null;
}

const snapshot = async (cartId: number) => {
  const carts = await sequelize.query<Record<string, string>>(
    `SELECT c.id::text, c.estado, COUNT(ci.id)::text AS item_count,
            COALESCE(SUM(ci.precio * ci.cantidad), 0)::numeric(10,2)::text AS total
       FROM carritos c LEFT JOIN carrito_items ci ON ci.carrito_id = c.id
      WHERE c.id = :cartId GROUP BY c.id, c.estado`,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  );
  const items = await sequelize.query<ItemRow>(
    `SELECT id, tipo_item, referencia_id,
            precio::numeric(10,2)::text AS precio, cantidad
       FROM carrito_items WHERE carrito_id = :cartId ORDER BY id`,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  );
  const payments = await sequelize.query<PaymentRow>(
    `SELECT id, monto::numeric(10,2)::text AS monto, estado, metodo,
            tipo_pago, id_transaccion_externo
       FROM pagos WHERE carrito_id = :cartId ORDER BY id`,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  );
  const approved = payments
    .filter((p) => ["aprobado", "reembolsado_parcial", "reembolsado"].includes(p.estado))
    .reduce((sum, p) => sum + Number(p.monto), 0);
  const processing = payments
    .filter((p) => p.estado === "procesando")
    .reduce((sum, p) => sum + Number(p.monto), 0);
  return { cart: carts[0] ?? null, items, payments, approved, processing };
};

describe("Pago de carrito mixto habitación + evento", () => {
  it(TEST_NAME, async () => {
    const database = await sequelize.query<{ database: string }>(
      "SELECT current_database() AS database",
      { type: QueryTypes.SELECT },
    );
    expect(database[0]?.database).toBe("hotel_test_db");

    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const authorization = `Bearer ${cliente.token}`;
    const hotel = await createHotelFixture({ capacidad: 2, tarifa: 100 });
    const salon = await createSalonEvento({ tarifa_base: 5000 });

    const roomResponse = await request(app)
      .post("/api/reservas-habitacion")
      .set("Authorization", authorization)
      .send({
        habitacion_id: hotel.habitacion.id,
        fecha_entrada: hotelDatePlusDays(10),
        fecha_salida: hotelDatePlusDays(11),
        numero_huespedes: 1,
      });
    expect(roomResponse.status, JSON.stringify(roomResponse.body)).toBe(201);
    expect(roomResponse.body.data.total).toBe("100.00");
    const roomId = Number(roomResponse.body.data.id);

    const eventResponse = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", authorization)
      .send({
        salon_id: Number(salon.id),
        tipo_evento: "boda",
        fecha: "2035-10-10",
        hora_inicio: "10:00",
        hora_fin: "14:00",
        numero_invitados: 50,
      });
    expect(eventResponse.status, JSON.stringify(eventResponse.body)).toBe(201);
    expect(eventResponse.body.data.estado).toBe("cotizacion");
    expect(Number(eventResponse.body.data.total)).toBe(5000);
    const eventId = Number(eventResponse.body.data.id);

    const cartResponse = await request(app)
      .post("/api/carritos")
      .set("Authorization", authorization)
      .send({});
    expect(cartResponse.status, JSON.stringify(cartResponse.body)).toBe(201);
    const cartId = Number(cartResponse.body.data.id);

    const roomItemResponse = await request(app)
      .post(`/api/carritos/${cartId}/items`)
      .set("Authorization", authorization)
      .send({ tipo_item: "habitacion", referencia_id: roomId });
    expect(roomItemResponse.status, JSON.stringify(roomItemResponse.body)).toBe(201);
    expect(roomItemResponse.body.data.precio).toBe("100.00");

    const eventItemResponse = await request(app)
      .post(`/api/carritos/${cartId}/items`)
      .set("Authorization", authorization)
      .send({ tipo_item: "evento", referencia_id: eventId });
    expect(eventItemResponse.status, JSON.stringify(eventItemResponse.body)).toBe(201);
    expect(Number(eventItemResponse.body.data.precio)).toBe(5000);

    const itemsHttp = await request(app)
      .get(`/api/carritos/${cartId}/items`)
      .set("Authorization", authorization);
    expect(itemsHttp.status, JSON.stringify(itemsHttp.body)).toBe(200);
    expect(itemsHttp.body.data.items).toHaveLength(2);
    expect(Number(itemsHttp.body.data.total)).toBe(5100);

    const summary = await request(app)
      .get(`/api/pagos/resumen?carrito_id=${cartId}`)
      .set("Authorization", authorization);
    expect(summary.status, JSON.stringify(summary.body)).toBe(200);
    expect(Number(summary.body.data.total)).toBe(5100);
    expect(Number(summary.body.data.saldo)).toBe(5100);

    const before = await snapshot(cartId);
    const roomBalance = await reservationFinancialExposure(roomId, undefined);
    const eventBalance = await eventFinancialExposure(eventId, undefined);
    expect(before.cart).toMatchObject({ item_count: "2", total: "5100.00" });
    expect(before.items.map((i) => [i.tipo_item, i.precio])).toEqual([
      ["habitacion", "100.00"],
      ["evento", "5000.00"],
    ]);
    expect(before.approved).toBe(0);
    expect(before.processing).toBe(0);

    // Único intento de pago. No se ejecuta webhook ni variante de transferencia.
    const paymentResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", authorization)
      .send({
        carrito_id: cartId,
        monto: "5100.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: "qa-evt-fin-candidate-040-mixed-total",
      });

    const final = await snapshot(cartId);
    const intent = [...stripeMock.intents.values()][0] ?? null;
    const blocked = paymentResponse.status === 409 &&
      paymentResponse.body.code === "PAYMENT_EXCEEDS_BALANCE";
    const acceptedSafely = paymentResponse.status === 201 &&
      final.payments.length === 1 &&
      final.payments[0].estado === "procesando" &&
      final.payments[0].monto === "5100.00" &&
      intent?.amount === 510000;
    const overexposed = final.approved + final.processing > 5100 ||
      stripeMock.intents.size > 1 || final.payments.length > 1;

    const evidence = {
      qaId: "QA-EVT-FIN-CANDIDATE-040",
      result: blocked ? "CONFIRMED" : acceptedSafely && !overexposed ? "NOT_REPRODUCED" : "BLOCKED",
      test: { file: "backend/tests/pagos/pagoMixedRoomEventCart.test.ts", name: TEST_NAME },
      database: database[0]?.database,
      stripe: {
        mode: "FULL_LOCAL_MOCK",
        realNetworkCalls: 0,
        createCalls: stripeMock.createPaymentIntent.mock.calls.length,
        intentCount: stripeMock.intents.size,
        intent,
        webhookCalls: stripeMock.constructEvent.mock.calls.length,
      },
      ids: {
        clienteId: Number(cliente.usuario.id),
        roomId,
        eventId,
        cartId,
        itemIds: before.items.map((i) => Number(i.id)),
        paymentId: final.payments[0]?.id ?? null,
      },
      totals: {
        origin: "5100.00",
        room: "100.00",
        event: "5000.00",
        itemCount: before.items.length,
        httpSaldo: Number(summary.body.data.saldo).toFixed(2),
        approvedBefore: before.approved.toFixed(2),
        processingBefore: before.processing.toFixed(2),
      },
      observableBalances: {
        originHttp: "5100.00",
        room: (100 - roomBalance.total).toFixed(2),
        event: (5000 - eventBalance.total).toFixed(2),
        globalInternal: "NOT OBSERVABLE: helper interno privado; no se instrumentó producción",
      },
      attempt: {
        count: 1,
        endpoint: "POST /api/pagos",
        amount: "5100.00",
        type: "total",
        method: "tarjeta",
        http: paymentResponse.status,
        code: paymentResponse.body.code ?? null,
        body: paymentResponse.body,
      },
      persistence: {
        cart: final.cart,
        items: final.items,
        payments: final.payments,
        paymentCount: final.payments.length,
        approved: final.approved.toFixed(2),
        processing: final.processing.toFixed(2),
      },
      blocking: { blocked, overexposed, acceptedSafely },
      regressionsObserved: { candidate035: "NONE", candidate039: "NONE", rh030: "NONE" },
      suspectedExecutionPath:
        "createPago -> validateOpenOrigin (Q5100) -> roomExposureBalance (remaining Q100) + eventExposureBalance (remaining Q5000) -> Math.min(origin, room, event) = Q100 -> PAYMENT_EXCEEDS_BALANCE",
    };
    console.log("[QA-EVT-FIN-CANDIDATE-040]", JSON.stringify(evidence, null, 2));

    expect.soft(paymentResponse.status, "El carrito mixto Q5100 debe aceptar su pago total").toBe(201);
    expect.soft(acceptedSafely, "Debe persistir un Pago y crear un PI, ambos por Q5100").toBe(true);
    expect.soft(overexposed, "No debe existir sobreexposición").toBe(false);
    expect(stripeMock.constructEvent).not.toHaveBeenCalled();
    expect(stripeMock.retrievePaymentIntent).not.toHaveBeenCalled();
    expect(stripeMock.updatePaymentIntentMetadata).not.toHaveBeenCalled();
    expect(stripeMock.cancelPaymentIntent).not.toHaveBeenCalled();
    expect(stripeMock.createRefund).not.toHaveBeenCalled();
  }, 30000);
});
