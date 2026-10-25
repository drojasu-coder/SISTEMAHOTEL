import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const stripeMock = vi.hoisted(() => {
  let sequence = 0;
  const intents = new Map<string, any>();
  const webhook = { event: null as any };
  const createPaymentIntent = vi.fn(
    async (
      amount: number | string,
      currency: string,
      metadata: Record<string, string>,
      idempotencyKey?: string
    ) => {
      sequence += 1;
      const id = `pi_combined_cart_${sequence}`;
      const intent = {
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
      throw new Error("No se configuró el webhook local para combinación");
    }
    return webhook.event;
  });

  return {
    intents,
    webhook,
    createPaymentIntent,
    constructEvent,
    retrievePaymentIntent: vi.fn(),
    cancelPaymentIntent: vi.fn(),
    createRefund: vi.fn(),
  };
});

/** Mock completo del SDK de Stripe para pruebas controladas en BD aislada. */
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
import { createRecursoActividad } from "../fixtures/actividades";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const {
  Carrito,
  CarritoItem,
  Pago,
  ReservaActividad,
  ReservaHabitacion,
  Sucursal,
  TipoHabitacion,
  Habitacion,
} = db;

describe("Combinación de habitaciones y actividades en carrito y flujo de pago", () => {
  it("permite combinar habitación y actividad con el mismo ID numérico, calcula el total y procesa el pago vía webhook", async () => {
    const cliente = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: "cliente-combinado@hunahpu.test",
    });

    // 1. Crear sede, tipo y habitación para la reserva de habitación
    const sucursal = await Sucursal.create({
      nombre: "Hotel Hunahpú Central",
      direccion: "Carretera Principal Km 45",
      ciudad: "Sololá",
      telefono: "77620000",
      activa: true,
    });

    const tipoHabitacion = await TipoHabitacion.create({
      nombre: "Deluxe Lago",
      capacidad_maxima: 2,
      tarifa_noche: 450.0,
      descripcion: "Vista al lago",
    });

    const habitacion = await Habitacion.create({
      sucursal_id: sucursal.id,
      tipo_habitacion_id: tipoHabitacion.id,
      numero: "101",
      estado: "disponible",
    });

    // Crear reserva de habitación (id será autoincremental)
    const reservaHabitacion = await ReservaHabitacion.create({
      usuario_id: cliente.usuario.id,
      habitacion_id: habitacion.id,
      fecha_entrada: "2027-11-01",
      fecha_salida: "2027-11-02",
      numero_huespedes: 2,
      total: "450.00",
      estado: "pendiente",
    });

    // 2. Crear recurso y reserva de actividad (su id también será autoincremental de su propia tabla)
    const recurso = await createRecursoActividad({
      nombre: "Kayak Lago",
      precio_hora: "100.00",
    });

    const reservaActividad = await ReservaActividad.create({
      usuario_id: cliente.usuario.id,
      recurso_id: recurso.id,
      fecha: "2027-11-01",
      hora_inicio: "15:00:00",
      hora_fin: "16:00:00",
      total: "100.00",
      estado: "confirmada",
    });

    const roomResId = Number(reservaHabitacion.id);
    const actResId = Number(reservaActividad.id);
    expect(roomResId).toBeGreaterThan(0);
    expect(actResId).toBeGreaterThan(0);

    // 3. Crear carrito activo para el cliente
    const cartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({});
    expect(cartRes.status).toBe(201);
    const cartId = Number(cartRes.body.data.id);

    // 4. Agregar ítem de habitación
    const addRoomRes = await request(app)
      .post(`/api/carritos/${cartId}/items`)
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({
        tipo_item: "habitacion",
        referencia_id: roomResId,
      });
    expect(addRoomRes.status).toBe(201);
    expect(addRoomRes.body.data.precio).toBe("450.00");
    expect(addRoomRes.body.data.tipo_item).toBe("habitacion");
    expect(addRoomRes.body.data.referencia_id).toBe(roomResId);

    // 5. Agregar ítem de actividad al mismo carrito
    const addActRes = await request(app)
      .post(`/api/carritos/${cartId}/items`)
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({
        tipo_item: "actividad",
        referencia_id: actResId,
      });
    expect(addActRes.status).toBe(201);
    expect(addActRes.body.data.precio).toBe("100.00");
    expect(addActRes.body.data.tipo_item).toBe("actividad");
    expect(addActRes.body.data.referencia_id).toBe(actResId);

    // 6. Consultar los ítems del carrito y verificar totales
    const getItemsRes = await request(app)
      .get(`/api/carritos/${cartId}/items`)
      .set("Authorization", `Bearer ${cliente.token}`);
    expect(getItemsRes.status).toBe(200);
    expect(getItemsRes.body.data.items).toHaveLength(2);
    expect(getItemsRes.body.data.total).toBe(550);

    // Verificar que ambos items coexisten en base de datos sin colisión
    const itemsDb = await CarritoItem.findAll({
      where: { carrito_id: cartId },
      order: [["id", "ASC"]],
    });
    expect(itemsDb).toHaveLength(2);
    expect(itemsDb[0].tipo_item).toBe("habitacion");
    expect(itemsDb[0].referencia_id).toBe(roomResId);
    expect(itemsDb[1].tipo_item).toBe("actividad");
    expect(itemsDb[1].referencia_id).toBe(actResId);

    // 7. Crear intento de pago por el total del carrito (Q550.00)
    const paymentRes = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({
        carrito_id: cartId,
        monto: "550.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: "idemp-qa-combined-001",
      });

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.estado).toBe("procesando");
    expect(paymentRes.body.data.monto).toBe("550.00");

    const paymentId = Number(paymentRes.body.data.pago_id);
    const paymentIntentId = paymentRes.body.data.payment_intent_id;
    const paymentIntent = stripeMock.intents.get(paymentIntentId);
    expect(paymentIntent).toBeDefined();

    // 8. Simular webhook de Stripe: payment_intent.succeeded
    paymentIntent.status = "succeeded";
    stripeMock.webhook.event = {
      id: "evt_combined_001",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: { ...paymentIntent.metadata },
        },
      },
    };

    const webhookRes = await request(app)
      .post("/api/pagos/stripe/webhook")
      .set("Stripe-Signature", "t=1,v1=qa-local-signature")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ id: "evt_combined_001" }));

    expect(webhookRes.status).toBe(200);

    // 9. Verificar persistencia y efectos locales:
    // Pago aprobado
    const pagoDb = await Pago.findByPk(paymentId);
    expect(pagoDb).not.toBeNull();
    expect(pagoDb.estado).toBe("aprobado");
    expect(pagoDb.monto).toBe("550.00");
    expect(pagoDb.fecha_pago).not.toBeNull();

    // Carrito pagado
    const cartDb = await Carrito.findByPk(cartId);
    expect(cartDb.estado).toBe("pagado");

    // Reserva de habitación pasa a confirmada
    const roomResDb = await ReservaHabitacion.findByPk(roomResId);
    expect(roomResDb.estado).toBe("confirmada");

    // Reserva de actividad permanece confirmada
    const actResDb = await ReservaActividad.findByPk(actResId);
    expect(actResDb.estado).toBe("confirmada");

    // 10. Reintento de webhook no duplica ni rompe estado (idempotencia del webhook)
    const replayWebhookRes = await request(app)
      .post("/api/pagos/stripe/webhook")
      .set("Stripe-Signature", "t=1,v1=qa-local-signature")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ id: "evt_combined_001" }));
    expect(replayWebhookRes.status).toBe(200);

    const pagoDbAfterReplay = await Pago.findByPk(paymentId);
    expect(pagoDbAfterReplay.estado).toBe("aprobado");
  });
});
