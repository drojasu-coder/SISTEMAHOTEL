import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

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
      const id = `pi_eventos_cart_${sequence}`;
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
      throw new Error("No se configuró el webhook local para eventos");
    }
    return webhook.event;
  });

  return {
    intents,
    webhook,
    createPaymentIntent,
    constructEvent,
    retrievePaymentIntent: vi.fn(async (id: string) => {
      const it = intents.get(id);
      if (!it) {
        return {
          id,
          status: "requires_payment_method",
          client_secret: `${id}_secret_qa_local`,
          amount: 500000,
          currency: "gtq",
        };
      }
      return { ...it };
    }),
    cancelPaymentIntent: vi.fn(async (id: string) => {
      const it = intents.get(id);
      if (it) {
        it.status = "canceled";
        return { ...it };
      }
      return { id, status: "canceled" };
    }),
    createRefund: vi.fn(),
  };
});

/** Mock controlado de Stripe para verificar el flujo real con PaymentIntent y webhook en BD aislada. */
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
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";
import { ROLES } from "../../src/constants/roles";

describe("HTTP Eventos in isolated PostgreSQL (port 55433)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let client1Token: string;
  let client2Token: string;
  let adminUserId: number;
  let client1UserId: number;
  let client2UserId: number;

  let sucursalId: number;
  let salon1Id: number;
  let salon2Id: number;
  let servicioEvento1Id: number;
  let servicioEvento2Id: number;
  let createdReservaId: number;
  let cartId: number;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("EventosQA123!", 4);

    // 1. Usuarios de prueba
    const adminUser = await database.Usuario.create({
      nombre: "Admin QA Eventos",
      email: `admin-eventos-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: ROLES.ADMIN,
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken({
      id: adminUser.id,
      rol: ROLES.ADMIN,
      tipo_usuario: "empleado",
    });

    const client1 = await database.Usuario.create({
      nombre: "Cliente 1 Eventos",
      email: `cliente1-eventos-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: ROLES.CLIENTE,
      activo: true,
    });
    client1UserId = client1.id;
    client1Token = generateAccessToken({
      id: client1.id,
      rol: ROLES.CLIENTE,
      tipo_usuario: "cliente",
    });

    const client2 = await database.Usuario.create({
      nombre: "Cliente 2 Eventos",
      email: `cliente2-eventos-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: ROLES.CLIENTE,
      activo: true,
    });
    client2UserId = client2.id;
    client2Token = generateAccessToken({
      id: client2.id,
      rol: ROLES.CLIENTE,
      tipo_usuario: "cliente",
    });

    // 2. Sucursal de prueba
    let sucursal = await database.Sucursal.findOne();
    if (!sucursal) {
      sucursal = await database.Sucursal.create({
        nombre: "Sede Antigua Eventos QA",
        direccion: "Calle del Arco #10, Antigua Guatemala",
        telefono: "78320000",
        activo: true,
      });
    }
    sucursalId = sucursal.id;

    // 3. Salones de prueba
    const salon1 = await database.Salon.create({
      sucursal_id: sucursalId,
      nombre: `Salón Real QA ${Date.now()}`,
      capacidad_maxima: 150,
      tarifa_base: 2000.0,
      descripcion: "Salón principal para banquetes y convenciones",
    });
    salon1Id = salon1.id;

    const salon2 = await database.Salon.create({
      sucursal_id: sucursalId,
      nombre: `Salón Atrio QA ${Date.now()}`,
      capacidad_maxima: 80,
      tarifa_base: 1200.0,
      descripcion: "Salón con vista a jardines interiores",
    });
    salon2Id = salon2.id;

    // 4. Servicios de eventos de prueba
    const serv1 = await database.ServicioEvento.create({
      nombre: `Banquete Gourmet QA ${Date.now()}`,
      precio: 150.0,
    });
    servicioEvento1Id = serv1.id;

    const serv2 = await database.ServicioEvento.create({
      nombre: `Iluminación y Sonido QA ${Date.now()}`,
      precio: 500.0,
    });
    servicioEvento2Id = serv2.id;
  });

  afterAll(async () => {
    const userIds = [client1UserId, client2UserId, adminUserId].filter(Boolean);
    const userCarts = await database.Carrito.findAll({ where: { usuario_id: userIds } });
    const cartIds = userCarts.map((c: any) => c.id);
    if (cartIds.length > 0) {
      await database.CarritoItem.destroy({ where: { carrito_id: cartIds }, force: true });
      await database.Pago.destroy({ where: { carrito_id: cartIds }, force: true });
      await database.Carrito.destroy({ where: { id: cartIds }, force: true });
    }

    const salonIds = [salon1Id, salon2Id].filter(Boolean);
    const reservas = await database.ReservaEvento.findAll({ where: { salon_id: salonIds } });
    const reservaIds = reservas.map((r: any) => r.id);
    if (reservaIds.length > 0) {
      await database.ReservaEventoServicio.destroy({ where: { reserva_evento_id: reservaIds }, force: true });
      await database.ReservaEvento.destroy({ where: { id: reservaIds }, force: true });
    }

    if (servicioEvento1Id) {
      await database.ServicioEvento.destroy({ where: { id: servicioEvento1Id }, force: true });
    }
    if (servicioEvento2Id) {
      await database.ServicioEvento.destroy({ where: { id: servicioEvento2Id }, force: true });
    }
    if (salon1Id) {
      await database.Salon.destroy({ where: { id: salon1Id }, force: true });
    }
    if (salon2Id) {
      await database.Salon.destroy({ where: { id: salon2Id }, force: true });
    }

    if (adminUserId) {
      await database.Usuario.destroy({ where: { id: adminUserId }, force: true });
    }
    if (client1UserId) {
      await database.Usuario.destroy({ where: { id: client1UserId }, force: true });
    }
    if (client2UserId) {
      await database.Usuario.destroy({ where: { id: client2UserId }, force: true });
    }

    await database.sequelize.close();
  });

  // =========================================================================
  // CATÁLOGO DE SALONES Y SERVICIOS DE EVENTOS
  // =========================================================================

  it("GET /api/salones es público y lista los salones disponibles", async () => {
    const res = await request(app).get("/api/salones");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const encontrado = res.body.data.find((s: any) => s.id === salon1Id);
    expect(encontrado).toBeDefined();
    expect(encontrado.capacidad_maxima).toBe(150);
    expect(Number(encontrado.tarifa_base)).toBe(2000);
  });

  it("GET /api/salones/:id devuelve el detalle del salón", async () => {
    const res = await request(app).get(`/api/salones/${salon1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(salon1Id);
    expect(res.body.data.Sucursal).toBeDefined();
  });

  it("POST /api/salones rechaza a clientes con 403 y permite a administradores con 201", async () => {
    const forbiddenRes = await request(app)
      .post("/api/salones")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        sucursal_id: sucursalId,
        nombre: "Salón No Autorizado",
        capacidad_maxima: 50,
        tarifa_base: 1000,
      });
    expect(forbiddenRes.status).toBe(403);

    const adminRes = await request(app)
      .post("/api/salones")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: sucursalId,
        nombre: `Salón Imperial QA ${Date.now()}`,
        capacidad_maxima: 200,
        tarifa_base: 3500,
        descripcion: "Salón de gran lujo",
      });
    expect(adminRes.status).toBe(201);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.data.capacidad_maxima).toBe(200);

    await database.Salon.destroy({ where: { id: adminRes.body.data.id }, force: true });
  });

  it("PATCH /api/salones/:id permite a admin actualizar el salón", async () => {
    const res = await request(app)
      .patch(`/api/salones/${salon2Id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        capacidad_maxima: 90,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.capacidad_maxima).toBe(90);
  });

  it("GET /api/servicios-evento es público y lista los servicios adicionales", async () => {
    const res = await request(app).get("/api/servicios-evento");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const encontrado = res.body.data.find((s: any) => s.id === servicioEvento1Id);
    expect(encontrado).toBeDefined();
    expect(Number(encontrado.precio)).toBe(150);
  });

  it("POST /api/servicios-evento rechaza a clientes con 403 y permite a admin con 201", async () => {
    const forbiddenRes = await request(app)
      .post("/api/servicios-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        nombre: "Mobiliario Lounge No Autorizado",
        precio: 300,
      });
    expect(forbiddenRes.status).toBe(403);

    const adminRes = await request(app)
      .post("/api/servicios-evento")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: `Decoración Floral QA ${Date.now()}`,
        precio: 450,
      });
    expect(adminRes.status).toBe(201);
    expect(adminRes.body.success).toBe(true);

    await database.ServicioEvento.destroy({ where: { id: adminRes.body.data.id }, force: true });
  });

  // =========================================================================
  // CREACIÓN Y VALIDACIÓN DE COTIZACIONES / RESERVAS DE EVENTOS
  // =========================================================================

  it("POST /api/reservas-evento valida capacidad máxima y rechaza con 422", async () => {
    const res = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        salon_id: salon1Id,
        tipo_evento: "boda",
        fecha: "2026-12-15",
        hora_inicio: "10:00",
        hora_fin: "14:00",
        numero_invitados: 300, // Salon 1 max capacity is 150
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("EVENT_CAPACITY_EXCEEDED");
  });

  it("POST /api/reservas-evento valida rango de horas y rechaza cuando fin <= inicio (422)", async () => {
    const res = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        salon_id: salon1Id,
        tipo_evento: "ejecutivo",
        fecha: "2026-12-15",
        hora_inicio: "14:00",
        hora_fin: "10:00",
        numero_invitados: 50,
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("INVALID_EVENT_TIME_RANGE");
  });

  it("POST /api/reservas-evento rechaza fechas pasadas con 422", async () => {
    const res = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        salon_id: salon1Id,
        tipo_evento: "ejecutivo",
        fecha: "2020-01-01",
        hora_inicio: "10:00",
        hora_fin: "14:00",
        numero_invitados: 50,
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("EVENT_DATE_IN_PAST");
  });

  it("POST /api/reservas-evento crea cotización formal y calcula automáticamente total y anticipo", async () => {
    const res = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        salon_id: salon1Id,
        tipo_evento: "boda",
        fecha: "2026-12-20",
        hora_inicio: "10:00",
        hora_fin: "16:00",
        numero_invitados: 100,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estado).toBe("cotizacion");
    expect(Number(res.body.data.total)).toBe(2000); // Tarifa base de salón 1
    expect(Number(res.body.data.anticipo)).toBeGreaterThan(0);

    createdReservaId = res.body.data.id;
  });

  // =========================================================================
  // ASOCIACIÓN DE SERVICIOS ADICIONALES A LA COTIZACIÓN
  // =========================================================================

  it("POST /api/reservas-evento/:id/servicios añade servicios adicionales y recalcula total y anticipo", async () => {
    // Añadir 2 unidades del servicio 1 (precio unitario 150 -> 300)
    const res = await request(app)
      .post(`/api/reservas-evento/${createdReservaId}/servicios`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_evento_id: servicioEvento1Id,
        cantidad: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.item.cantidad).toBe(2);
    expect(Number(res.body.data.item.subtotal)).toBe(300);
    // Base 2000 + 300 = 2300
    expect(Number(res.body.data.reserva.total)).toBe(2300);

    // Añadir 1 unidad del servicio 2 (precio unitario 500)
    const res2 = await request(app)
      .post(`/api/reservas-evento/${createdReservaId}/servicios`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_evento_id: servicioEvento2Id,
        cantidad: 1,
      });

    expect(res2.status).toBe(201);
    // Base 2000 + 300 + 500 = 2800
    expect(Number(res2.body.data.reserva.total)).toBe(2800);
  });

  it("GET /api/reservas-evento/:id/servicios lista los servicios vinculados", async () => {
    const res = await request(app)
      .get(`/api/reservas-evento/${createdReservaId}/servicios`)
      .set("Authorization", `Bearer ${client1Token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it("DELETE /api/reservas-evento/:reservaId/servicios/:id quita un servicio y recalcula el total", async () => {
    // Obtener los servicios
    const listRes = await request(app)
      .get(`/api/reservas-evento/${createdReservaId}/servicios`)
      .set("Authorization", `Bearer ${client1Token}`);

    const itemAEliminar = listRes.body.data.find(
      (s: any) => s.servicio_evento_id === servicioEvento1Id
    );
    expect(itemAEliminar).toBeDefined();

    const delRes = await request(app)
      .delete(`/api/reservas-evento/${createdReservaId}/servicios/${itemAEliminar.id}`)
      .set("Authorization", `Bearer ${client1Token}`);

    expect(delRes.status).toBe(204);

    // Comprobar reserva actualizada: 2800 - 300 = 2500
    const checkRes = await request(app)
      .get(`/api/reservas-evento/${createdReservaId}`)
      .set("Authorization", `Bearer ${client1Token}`);

    expect(Number(checkRes.body.data.total)).toBe(2500);
  });

  // =========================================================================
  // AISLAMIENTO ENTRE CLIENTES Y DETALLE
  // =========================================================================

  it("GET /api/reservas-evento devuelve únicamente las reservas del usuario autenticado", async () => {
    const res1 = await request(app)
      .get("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`);

    expect(res1.status).toBe(200);
    const ids1 = res1.body.data.map((r: any) => r.id);
    expect(ids1).toContain(createdReservaId);

    const res2 = await request(app)
      .get("/api/reservas-evento")
      .set("Authorization", `Bearer ${client2Token}`);

    expect(res2.status).toBe(200);
    const ids2 = res2.body.data.map((r: any) => r.id);
    expect(ids2).not.toContain(createdReservaId);
  });

  it("GET /api/reservas-evento/:id protege la propiedad (403 para cliente ajeno)", async () => {
    const ownRes = await request(app)
      .get(`/api/reservas-evento/${createdReservaId}`)
      .set("Authorization", `Bearer ${client1Token}`);
    expect(ownRes.status).toBe(200);
    expect(ownRes.body.data.id).toBe(createdReservaId);

    const forbiddenRes = await request(app)
      .get(`/api/reservas-evento/${createdReservaId}`)
      .set("Authorization", `Bearer ${client2Token}`);
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.code).toBe("INSUFFICIENT_PERMISSIONS");

    const adminRes = await request(app)
      .get(`/api/reservas-evento/${createdReservaId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
  });

  // =========================================================================
  // TRANSICIONES DE ESTADO ADMINISTRATIVAS Y DISPONIBILIDAD CONCURRENTE
  // =========================================================================

  it("PATCH /api/reservas-evento/:id/estado rechaza a cliente (403) y permite a admin confirmar la reserva", async () => {
    const forbiddenRes = await request(app)
      .patch(`/api/reservas-evento/${createdReservaId}/estado`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({ estado: "confirmada" });
    expect(forbiddenRes.status).toBe(403);

    const adminRes = await request(app)
      .patch(`/api/reservas-evento/${createdReservaId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "confirmada" });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.estado).toBe("confirmada");
  });

  it("Rechaza reserva concurrente/traslapada sobre el mismo salón y fecha (409)", async () => {
    // Intentar crear otra cotización para el mismo salón y fecha en horario traslapado (12:00 a 18:00)
    // El salón ya está ocupado de 10:00 a 16:00
    const conflictRes = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        salon_id: salon1Id,
        tipo_evento: "ejecutivo",
        fecha: "2026-12-20",
        hora_inicio: "12:00",
        hora_fin: "18:00",
        numero_invitados: 50,
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.code).toBe("EVENT_ROOM_NOT_AVAILABLE");

    // En cambio, reservar en un horario no traslapado (17:00 a 22:00) sí es admitido
    const nonOverlapRes = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        salon_id: salon1Id,
        tipo_evento: "ejecutivo",
        fecha: "2026-12-20",
        hora_inicio: "17:00",
        hora_fin: "22:00",
        numero_invitados: 50,
      });

    expect(nonOverlapRes.status).toBe(201);
    await database.ReservaEvento.destroy({ where: { id: nonOverlapRes.body.data.id }, force: true });
  });

  // =========================================================================
  // INTEGRACIÓN CON CARRITO Y PAGO REAL CON STRIPE (PAYMENTINTENT + WEBHOOK)
  // =========================================================================

  it("Integra la reserva de evento en el carrito y procesa el cobro completo mediante Stripe PaymentIntent y webhook", async () => {
    // 1. Crear carrito para cliente 1
    const cartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({});
    expect(cartRes.status).toBe(201);
    cartId = cartRes.body.data.id;

    // 2. Cliente 2 no puede agregar la reserva de Cliente 1 (403)
    const otherCartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({});
    const otherCartId = otherCartRes.body.data.id;

    const crossUserRes = await request(app)
      .post(`/api/carritos/${otherCartId}/items`)
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        tipo_item: "evento",
        referencia_id: createdReservaId,
      });
    expect(crossUserRes.status).toBe(403);
    await database.Carrito.destroy({ where: { id: otherCartId }, force: true });

    // 3. Cliente 1 agrega su reserva de evento a su carrito
    const addItemRes = await request(app)
      .post(`/api/carritos/${cartId}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "evento",
        referencia_id: createdReservaId,
      });

    expect(addItemRes.status).toBe(201);
    expect(addItemRes.body.data.tipo_item).toBe("evento");
    expect(Number(addItemRes.body.data.precio)).toBe(2500);

    // 4. Consultar carrito y verificar que el total refleja el monto calculado por el servidor
    const getCartRes = await request(app)
      .get(`/api/carritos/${cartId}/items`)
      .set("Authorization", `Bearer ${client1Token}`);

    expect(getCartRes.status).toBe(200);
    const item = getCartRes.body.data.items.find(
      (i: any) => i.tipo_item === "evento" && Number(i.referencia_id) === createdReservaId
    );
    expect(item).toBeDefined();
    expect(Number(item.precio)).toBe(2500);

    // 5. Crear intento de pago con Stripe mediante la API real del checkout (POST /api/pagos)
    const paymentRes = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        carrito_id: cartId,
        monto: "2500.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `idemp-eventos-stripe-${Date.now()}`,
      });

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.estado).toBe("procesando");
    expect(paymentRes.body.data.monto).toBe("2500.00");
    expect(paymentRes.body.data.payment_intent_id).toBeDefined();
    expect(paymentRes.body.data.client_secret).toBeDefined();

    const paymentId = Number(paymentRes.body.data.pago_id);
    const paymentIntentId = paymentRes.body.data.payment_intent_id;
    const paymentIntent = stripeMock.intents.get(paymentIntentId);
    expect(paymentIntent).toBeDefined();

    // 6. Simular webhook de Stripe: payment_intent.succeeded
    paymentIntent.status = "succeeded";
    stripeMock.webhook.event = {
      id: `evt_eventos_${Date.now()}`,
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
      .send(JSON.stringify({ id: stripeMock.webhook.event.id }));

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.received).toBe(true);

    // 7. Verificar persistencia del pago aprobado y carrito pagado en BD aislada
    const pagoDb = await database.Pago.findByPk(paymentId);
    expect(pagoDb).not.toBeNull();
    expect(pagoDb.estado).toBe("aprobado");
    expect(Number(pagoDb.monto)).toBe(2500);

    const cartDb = await database.Carrito.findByPk(cartId);
    expect(cartDb.estado).toBe("pagado");

    // 8. Idempotencia del webhook: resend del mismo evento no duplica pagos ni falla
    const duplicateWebhookRes = await request(app)
      .post("/api/pagos/stripe/webhook")
      .set("Stripe-Signature", "t=1,v1=qa-local-signature")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ id: stripeMock.webhook.event.id }));

    expect(duplicateWebhookRes.status).toBe(200);
    expect(duplicateWebhookRes.body.received).toBe(true);

    // 9. Bloqueo de reutilización: la referencia pagada ya no puede agregarse a un nuevo carrito (409)
    const newCartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({});
    const newCartId = newCartRes.body.data.id;

    const reAddRes = await request(app)
      .post(`/api/carritos/${newCartId}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "evento",
        referencia_id: createdReservaId,
      });

    expect(reAddRes.status).toBe(409);
    expect(reAddRes.body.code).toBe("CART_REFERENCE_NOT_AVAILABLE");

    await database.Carrito.destroy({ where: { id: newCartId }, force: true });
  });

  it("Bloquea agregar a otro carrito una reserva de evento que ya tiene un pago en estado procesando (409)", async () => {
    // 1. Crear nueva reserva de evento para client1
    const reservaRes = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        salon_id: salon2Id,
        tipo_evento: "cumpleanos",
        fecha: "2026-12-25",
        hora_inicio: "10:00",
        hora_fin: "14:00",
        numero_invitados: 40,
      });
    expect(reservaRes.status).toBe(201);
    const reservaId = reservaRes.body.data.id;

    // 2. Crear primer carrito y añadir la reserva
    const c1Res = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({});
    expect(c1Res.status).toBe(201);
    const cart1Id = c1Res.body.data.id;

    const add1Res = await request(app)
      .post(`/api/carritos/${cart1Id}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "evento",
        referencia_id: reservaId,
      });
    expect(add1Res.status).toBe(201);

    // 3. Iniciar pago con tarjeta (estado: procesando)
    const payRes = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        carrito_id: cart1Id,
        monto: String(reservaRes.body.data.total),
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `idemp-eventos-proc-${Date.now()}`,
      });
    expect(payRes.status).toBe(201);
    expect(payRes.body.data.estado).toBe("procesando");
    const pagoId = Number(payRes.body.data.pago_id);

    // 4. Crear segundo carrito e intentar añadir la misma reserva (debe fallar con 409)
    const newCart = await database.Carrito.create({
      usuario_id: client1UserId,
      estado: "activo",
      expira_en: new Date(Date.now() + 3600000),
    });
    const cart2Id = newCart.id;

    const add2Res = await request(app)
      .post(`/api/carritos/${cart2Id}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "evento",
        referencia_id: reservaId,
      });

    expect(add2Res.status).toBe(409);
    expect(add2Res.body.code).toBe("CART_REFERENCE_NOT_AVAILABLE");

    // Limpieza aislada
    await database.Pago.destroy({ where: { id: pagoId }, force: true });
    await database.CarritoItem.destroy({ where: { carrito_id: cart1Id }, force: true });
    await database.Carrito.destroy({ where: { id: cart1Id }, force: true });
    await database.Carrito.destroy({ where: { id: cart2Id }, force: true });
    await database.ReservaEvento.destroy({ where: { id: reservaId }, force: true });
  });

  it("Impide modificar servicios o cancelar una cotización cuando existe un intento de pago confirmable (409)", async () => {
    // 1. Crear cotización con salón 2
    const resRes = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        salon_id: salon2Id,
        tipo_evento: "ejecutivo",
        fecha: "2026-11-20",
        hora_inicio: "08:00",
        hora_fin: "12:00",
        numero_invitados: 25,
      });
    expect(resRes.status).toBe(201);
    const rId = resRes.body.data.id;

    // 2. Agregar servicio inicial
    const srvAdd = await request(app)
      .post(`/api/reservas-evento/${rId}/servicios`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_evento_id: servicioEvento1Id,
        cantidad: 1,
      });
    expect(srvAdd.status).toBe(201);
    const itemServicioId = srvAdd.body.data.item.id;

    // 3. Agregar al carrito y generar pago en proceso
    const cartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({});
    expect(cartRes.status).toBe(201);
    const cId = cartRes.body.data.id;

    await request(app)
      .post(`/api/carritos/${cId}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "evento",
        referencia_id: rId,
      });

    const payRes = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        carrito_id: cId,
        monto: String(srvAdd.body.data.reserva.total),
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `idemp-eventos-modblock-${Date.now()}`,
      });
    expect(payRes.status).toBe(201);
    expect(payRes.body.data.estado).toBe("procesando");
    const pagoId = Number(payRes.body.data.pago_id);

    // 4. Intentar agregar otro servicio -> Debe bloquear con 409
    const addSrvBlocked = await request(app)
      .post(`/api/reservas-evento/${rId}/servicios`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_evento_id: servicioEvento2Id,
        cantidad: 2,
      });
    expect(addSrvBlocked.status).toBe(409);
    expect(addSrvBlocked.body.code).toBe("EVENT_RESERVATION_HAS_ACTIVE_PAYMENT");

    // 5. Intentar modificar cantidad del servicio existente -> Debe bloquear con 409
    const updateSrvBlocked = await request(app)
      .patch(`/api/reservas-evento/${rId}/servicios/${itemServicioId}`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({ cantidad: 5 });
    expect(updateSrvBlocked.status).toBe(409);
    expect(updateSrvBlocked.body.code).toBe("EVENT_RESERVATION_HAS_ACTIVE_PAYMENT");

    // 6. Intentar retirar el servicio -> Debe bloquear con 409
    const deleteSrvBlocked = await request(app)
      .delete(`/api/reservas-evento/${rId}/servicios/${itemServicioId}`)
      .set("Authorization", `Bearer ${client1Token}`);
    expect(deleteSrvBlocked.status).toBe(409);
    expect(deleteSrvBlocked.body.code).toBe("EVENT_RESERVATION_HAS_ACTIVE_PAYMENT");

    // 7. Intentar modificar la cotización (horario/invitados) -> Debe bloquear con 409
    const updateResBlocked = await request(app)
      .patch(`/api/reservas-evento/${rId}`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({ numero_invitados: 30 });
    expect(updateResBlocked.status).toBe(409);
    expect(updateResBlocked.body.code).toBe("EVENT_RESERVATION_HAS_ACTIVE_PAYMENT");

    // 8. Intentar cancelar por cliente -> Debe bloquear con 409
    const cancelResBlocked = await request(app)
      .patch(`/api/reservas-evento/${rId}/cancelar`)
      .set("Authorization", `Bearer ${client1Token}`);
    expect(cancelResBlocked.status).toBe(409);
    expect(cancelResBlocked.body.code).toBe("EVENT_RESERVATION_HAS_ACTIVE_PAYMENT");

    // 9. Intentar cancelar por admin -> Debe bloquear con 409
    const adminCancelBlocked = await request(app)
      .patch(`/api/reservas-evento/${rId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "cancelada" });
    expect(adminCancelBlocked.status).toBe(409);
    expect(adminCancelBlocked.body.code).toBe("EVENT_RESERVATION_HAS_ACTIVE_PAYMENT");

    // Limpieza
    await database.Pago.destroy({ where: { id: pagoId }, force: true });
    await database.CarritoItem.destroy({ where: { carrito_id: cId }, force: true });
    await database.Carrito.destroy({ where: { id: cId }, force: true });
    await database.ReservaEventoServicio.destroy({ where: { reserva_evento_id: rId }, force: true });
    await database.ReservaEvento.destroy({ where: { id: rId }, force: true });
  });

  it("Protege cotizaciones con intentos rechazados localmente pero aún recuperables en Stripe (409)", async () => {
    // 1. Crear cotización y agregar servicio
    const resRes = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        salon_id: salon2Id,
        tipo_evento: "convivio",
        fecha: "2026-11-22",
        hora_inicio: "09:00",
        hora_fin: "13:00",
        numero_invitados: 20,
      });
    expect(resRes.status).toBe(201);
    const rId = resRes.body.data.id;

    const srvAdd = await request(app)
      .post(`/api/reservas-evento/${rId}/servicios`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_evento_id: servicioEvento1Id,
        cantidad: 1,
      });
    expect(srvAdd.status).toBe(201);
    const itemServicioId = srvAdd.body.data.item.id;

    // 2. Carrito y pago
    const cartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({});
    const cId = cartRes.body.data.id;

    await request(app)
      .post(`/api/carritos/${cId}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "evento",
        referencia_id: rId,
      });

    const payRes = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        carrito_id: cId,
        monto: String(srvAdd.body.data.reserva.total),
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `idemp-eventos-declined-${Date.now()}`,
      });
    expect(payRes.status).toBe(201);
    const pagoId = Number(payRes.body.data.pago_id);

    // 3. Simular fallo de tarjeta (rechazado localmente pero requires_payment_method en Stripe)
    await database.Pago.update(
      { estado: "rechazado", codigo_error_externo: "card_declined" },
      { where: { id: pagoId } }
    );

    // 4. Intento de eliminar servicio debe fallar con 409
    const deleteBlocked = await request(app)
      .delete(`/api/reservas-evento/${rId}/servicios/${itemServicioId}`)
      .set("Authorization", `Bearer ${client1Token}`);
    expect(deleteBlocked.status).toBe(409);
    expect(deleteBlocked.body.code).toBe("EVENT_RESERVATION_HAS_ACTIVE_PAYMENT");

    // 5. Intento de cancelar cotización debe fallar con 409
    const cancelBlocked = await request(app)
      .patch(`/api/reservas-evento/${rId}/cancelar`)
      .set("Authorization", `Bearer ${client1Token}`);
    expect(cancelBlocked.status).toBe(409);
    expect(cancelBlocked.body.code).toBe("EVENT_RESERVATION_HAS_ACTIVE_PAYMENT");

    // 6. Ahora expirar el carrito viejo: la reconciliación debe cancelar el intento en Stripe
    await database.Carrito.update(
      { estado: "expirado" },
      { where: { id: cId } }
    );

    // Ahora la eliminación debe permitirse limpiamente
    const deleteAllowed = await request(app)
      .delete(`/api/reservas-evento/${rId}/servicios/${itemServicioId}`)
      .set("Authorization", `Bearer ${client1Token}`);
    expect(deleteAllowed.status).toBe(204);

    // Limpieza
    await database.Pago.destroy({ where: { id: pagoId }, force: true });
    await database.CarritoItem.destroy({ where: { carrito_id: cId }, force: true });
    await database.Carrito.destroy({ where: { id: cId }, force: true });
    await database.ReservaEvento.destroy({ where: { id: rId }, force: true });
  });

  it("Serializa la carrera entre mutación y preparación del pago, y confirma válidamente con webhook", async () => {
    // 1. Crear cotización base
    const resRes = await request(app)
      .post("/api/reservas-evento")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        salon_id: salon2Id,
        tipo_evento: "boda",
        fecha: "2026-11-28",
        hora_inicio: "15:00",
        hora_fin: "22:00",
        numero_invitados: 50,
      });
    expect(resRes.status).toBe(201);
    const rId = resRes.body.data.id;
    const initialTotal = Number(resRes.body.data.total);

    // 2. Carrito
    const cartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({});
    const cId = cartRes.body.data.id;

    await request(app)
      .post(`/api/carritos/${cId}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "evento",
        referencia_id: rId,
      });

    // 3. Ejecutar concurrentemente: Añadir servicio vs Preparar Pago (createPago)
    const [modResult, payResult] = await Promise.all([
      request(app)
        .post(`/api/reservas-evento/${rId}/servicios`)
        .set("Authorization", `Bearer ${client1Token}`)
        .send({
          servicio_evento_id: servicioEvento1Id,
          cantidad: 2,
        }),
      request(app)
        .post("/api/pagos")
        .set("Authorization", `Bearer ${client1Token}`)
        .send({
          carrito_id: cId,
          monto: String(initialTotal),
          metodo: "tarjeta",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: `idemp-eventos-race-${Date.now()}`,
        }),
    ]);

    // La serialización por lock garantiza que uno se completó antes que el otro:
    // Si la mutación fue primero: el pago de la tarifa anterior es rechazado con 409 PAYMENT_EXCEEDS_BALANCE (o monto difiere).
    // Si el pago fue primero: la mutación fue rechazada con 409 EVENT_RESERVATION_HAS_ACTIVE_PAYMENT.
    const oneBlockedWith409 =
      (modResult.status === 409 && payResult.status === 201) ||
      (modResult.status === 201 && payResult.status === 409);

    expect(oneBlockedWith409).toBe(true);

    // 4. Confirmación posterior del intento válido mediante webhook
    if (payResult.status === 201) {
      const pagoId = Number(payResult.body.data.pago_id);
      const intentId = payResult.body.data.client_secret.split("_secret_")[0];

      stripeMock.webhook.event = {
        id: `evt_eventos_race_${Date.now()}`,
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: intentId,
            amount: Math.round(initialTotal * 100),
            currency: "gtq",
            metadata: {
              pago_id: String(pagoId),
            },
          },
        },
      };

      const hookRes = await request(app)
        .post("/api/pagos/stripe/webhook")
        .set("stripe-signature", "sig_qa_valid")
        .send(stripeMock.webhook.event);

      expect(hookRes.status).toBe(200);

      // Verificación en BD
      const pagoEnDb = await database.Pago.findByPk(pagoId);
      expect(pagoEnDb.estado).toBe("aprobado");
      expect(Number(pagoEnDb.monto)).toBe(initialTotal);

      const cartEnDb = await database.Carrito.findByPk(cId);
      expect(cartEnDb.estado).toBe("pagado");

      await database.Pago.destroy({ where: { id: pagoId }, force: true });
    }

    // Limpieza
    await database.CarritoItem.destroy({ where: { carrito_id: cId }, force: true });
    await database.Carrito.destroy({ where: { id: cId }, force: true });
    await database.ReservaEventoServicio.destroy({ where: { reserva_evento_id: rId }, force: true });
    await database.ReservaEvento.destroy({ where: { id: rId }, force: true });
  });
});
