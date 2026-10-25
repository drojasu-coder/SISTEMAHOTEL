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
      const id = `pi_bienestar_cart_${sequence}`;
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
      throw new Error("No se configuró el webhook local para bienestar");
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

describe("HTTP Bienestar & Spa in isolated PostgreSQL (port 55433)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let client1Token: string;
  let client2Token: string;
  let adminUserId: number;
  let client1UserId: number;
  let client2UserId: number;

  let activeTerapeutaId: number;
  let activeTerapeuta2Id: number;
  let inactiveTerapeutaId: number;
  let servicioSpaId: number;
  let servicioSpa45Id: number;
  let createdCitaId: number;
  let cartId: number;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("BienestarQA123!", 4);

    // 1. Usuarios de prueba
    const adminUser = await database.Usuario.create({
      nombre: "Admin QA Bienestar",
      email: `admin-spa-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: ROLES.ADMIN,
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);

    const client1User = await database.Usuario.create({
      nombre: "Cliente 1 QA Bienestar",
      email: `cliente1-spa-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: ROLES.CLIENTE,
      activo: true,
    });
    client1UserId = client1User.id;
    client1Token = generateAccessToken(client1User);

    const client2User = await database.Usuario.create({
      nombre: "Cliente 2 QA Bienestar",
      email: `cliente2-spa-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: ROLES.CLIENTE,
      activo: true,
    });
    client2UserId = client2User.id;
    client2Token = generateAccessToken(client2User);

    // 2. Terapeutas
    const terapeutaActivo = await database.Terapeuta.create({
      nombre: `Terapeuta Activo 1 ${Date.now()}`,
      activo: true,
    });
    activeTerapeutaId = terapeutaActivo.id;

    const terapeutaActivo2 = await database.Terapeuta.create({
      nombre: `Terapeuta Activo 2 ${Date.now()}`,
      activo: true,
    });
    activeTerapeuta2Id = terapeutaActivo2.id;

    const terapeutaInactivo = await database.Terapeuta.create({
      nombre: `Terapeuta Inactivo ${Date.now()}`,
      activo: false,
    });
    inactiveTerapeutaId = terapeutaInactivo.id;

    // 3. Servicios de Bienestar
    // Servicio de 60 mins (Q350.00)
    const servicio = await database.ServicioBienestar.create({
      nombre: `Masaje Terapéutico QA ${Date.now()}`,
      duracion_minutos: 60,
      precio: 350.0,
    });
    servicioSpaId = servicio.id;

    // Servicio de 45 mins (Q250.00) para pruebas de casos límite
    const servicio45 = await database.ServicioBienestar.create({
      nombre: `Tratamiento Facial 45m QA ${Date.now()}`,
      duracion_minutos: 45,
      precio: 250.0,
    });
    servicioSpa45Id = servicio45.id;
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
    const therapistIds = [activeTerapeutaId, activeTerapeuta2Id, inactiveTerapeutaId].filter(Boolean);
    await database.CitaBienestar.destroy({ where: { terapeuta_id: therapistIds }, force: true });
    if (servicioSpaId) {
      await database.ServicioBienestar.destroy({ where: { id: servicioSpaId }, force: true });
    }
    if (servicioSpa45Id) {
      await database.ServicioBienestar.destroy({ where: { id: servicioSpa45Id }, force: true });
    }
    if (activeTerapeutaId) {
      await database.Terapeuta.destroy({ where: { id: activeTerapeutaId }, force: true });
    }
    if (activeTerapeuta2Id) {
      await database.Terapeuta.destroy({ where: { id: activeTerapeuta2Id }, force: true });
    }
    if (inactiveTerapeutaId) {
      await database.Terapeuta.destroy({ where: { id: inactiveTerapeutaId }, force: true });
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
  // CATÁLOGO DE SERVICIOS
  // =========================================================================

  it("GET /api/servicios-spa es público y devuelve la lista de servicios", async () => {
    const res = await request(app).get("/api/servicios-spa");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    const encontrado = res.body.data.find((s: any) => s.id === servicioSpaId);
    expect(encontrado).toBeDefined();
    expect(Number(encontrado.duracion_minutos)).toBe(60);
    expect(Number(encontrado.precio)).toBe(350);
  });

  it("POST /api/servicios-spa rechaza a clientes con 403 y permite a administradores con 201", async () => {
    const forbiddenRes = await request(app)
      .post("/api/servicios-spa")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        nombre: "Servicio no autorizado",
        duracion_minutos: 45,
        precio: 200,
      });
    expect(forbiddenRes.status).toBe(403);

    const adminRes = await request(app)
      .post("/api/servicios-spa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: `Tratamiento Facial QA ${Date.now()}`,
        duracion_minutos: 45,
        precio: 280,
      });
    expect(adminRes.status).toBe(201);
    expect(adminRes.body.status).toBe("success");
    expect(adminRes.body.data.nombre).toContain("Tratamiento Facial QA");

    await database.ServicioBienestar.destroy({ where: { id: adminRes.body.data.id }, force: true });
  });

  // =========================================================================
  // TERAPEUTAS
  // =========================================================================

  it("GET /api/terapeutas es público y lista los terapeutas", async () => {
    const res = await request(app).get("/api/terapeutas");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    const activo = res.body.data.find((t: any) => t.id === activeTerapeutaId);
    expect(activo).toBeDefined();
    expect(activo.activo).toBe(true);
  });

  it("POST /api/terapeutas rechaza clientes con 403 y permite admin con 201", async () => {
    const clientRes = await request(app)
      .post("/api/terapeutas")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({ nombre: "Nuevo Terapeuta", activo: true });
    expect(clientRes.status).toBe(403);

    const adminRes = await request(app)
      .post("/api/terapeutas")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ nombre: `Terapeuta Creado QA ${Date.now()}`, activo: true });
    expect(adminRes.status).toBe(201);
    expect(adminRes.body.status).toBe("success");

    await database.Terapeuta.destroy({ where: { id: adminRes.body.data.id }, force: true });
  });

  // =========================================================================
  // RESERVA DE CITAS (CREACIÓN Y DISPONIBILIDAD)
  // =========================================================================

  it("POST /api/citas-spa rechaza a usuarios con rol admin (solo clientes reservan)", async () => {
    const res = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeutaId,
        fecha: "2026-11-20",
        hora_inicio: "09:00",
      });
    expect(res.status).toBe(403);
  });

  it("POST /api/citas-spa rechaza terapeutas inactivos con 422 THERAPIST_INACTIVE", async () => {
    const res = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: inactiveTerapeutaId,
        fecha: "2026-11-20",
        hora_inicio: "09:00",
      });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("THERAPIST_INACTIVE");
  });

  it("POST /api/citas-spa crea una cita para el cliente y calcula hora_fin según duracion_minutos", async () => {
    const res = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeutaId,
        fecha: "2026-11-20",
        hora_inicio: "10:00",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.usuario_id).toBe(client1UserId);
    expect(res.body.data.hora_inicio).toBe("10:00:00");
    // Servicio de 60 mins -> hora_fin debe ser 11:00:00
    expect(res.body.data.hora_fin).toBe("11:00:00");
    expect(res.body.data.estado).toBe("confirmada");

    createdCitaId = res.body.data.id;
  });

  // =========================================================================
  // CASOS LÍMITE DEL DESCANSO DE 15 MINUTOS ENTRE CITAS (6 CASOS)
  // =========================================================================

  it("Verifica rigurosamente los 6 casos límite de descanso de 15 minutos respecto a una cita de 11:00 a 12:00", async () => {
    const testFecha = "2026-11-25";

    // Cita base: 11:00 a 12:00 (servicio de 60 mins)
    const baseCitaRes = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "11:00",
      });
    expect(baseCitaRes.status).toBe(201);
    const baseCitaId = baseCitaRes.body.data.id;

    // Caso 1: Nueva cita que termina a las 11:00 (duración 45 min, inicio 10:15) -> rechazada 409
    const caso1 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpa45Id,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "10:15",
      });
    expect(caso1.status).toBe(409);
    expect(caso1.body.code).toBe("THERAPIST_BUSY_OR_BUFFER");

    // Caso 2: Nueva cita que termina a las 10:46 (duración 45 min, inicio 10:01) -> rechazada 409
    const caso2 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpa45Id,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "10:01",
      });
    expect(caso2.status).toBe(409);
    expect(caso2.body.code).toBe("THERAPIST_BUSY_OR_BUFFER");

    // Caso 3: Nueva cita que termina exactamente a las 10:45 (duración 45 min, inicio 10:00) -> admitida 201
    const caso3 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpa45Id,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "10:00",
      });
    expect(caso3.status).toBe(201);
    const caso3Id = caso3.body.data.id;

    // Caso 4: Nueva cita que empieza a las 12:00 (duración 45 min, inicio 12:00) -> rechazada 409
    const caso4 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpa45Id,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "12:00",
      });
    expect(caso4.status).toBe(409);
    expect(caso4.body.code).toBe("THERAPIST_BUSY_OR_BUFFER");

    // Caso 5: Nueva cita que empieza a las 12:14 (duración 45 min, inicio 12:14) -> rechazada 409
    const caso5 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpa45Id,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "12:14",
      });
    expect(caso5.status).toBe(409);
    expect(caso5.body.code).toBe("THERAPIST_BUSY_OR_BUFFER");

    // Caso 6: Nueva cita que empieza exactamente a las 12:15 (duración 45 min, inicio 12:15) -> admitida 201
    const caso6 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpa45Id,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "12:15",
      });
    expect(caso6.status).toBe(201);
    const caso6Id = caso6.body.data.id;

    // Limpieza de citas creadas en este bloque de prueba
    await database.CitaBienestar.destroy({
      where: { id: [baseCitaId, caso3Id, caso6Id] },
      force: true,
    });
  });

  it("Comprueba que terapeutas distintos no se bloqueen entre sí en el mismo horario", async () => {
    const testFecha = "2026-11-26";
    // Terapeuta 1 reserva a las 11:00
    const citaT1 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "11:00",
      });
    expect(citaT1.status).toBe(201);

    // Terapeuta 2 puede reservar al mismo horario (11:00) sin bloqueo
    const citaT2 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeuta2Id,
        fecha: testFecha,
        hora_inicio: "11:00",
      });
    expect(citaT2.status).toBe(201);

    await database.CitaBienestar.destroy({
      where: { id: [citaT1.body.data.id, citaT2.body.data.id] },
      force: true,
    });
  });

  it("Comprueba que citas canceladas no bloquean nuevas reservas y reactivación valida conflictos", async () => {
    const testFecha = "2026-11-27";
    // 1. Crear cita para las 15:00
    const citaA = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "15:00",
      });
    expect(citaA.status).toBe(201);
    const citaAId = citaA.body.data.id;

    // 2. Cancelar cita A
    const cancelRes = await request(app)
      .patch(`/api/citas-spa/${citaAId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "cancelada" });
    expect(cancelRes.status).toBe(200);

    // 3. Crear cita B para el mismo terapeuta en el mismo horario (15:00) -> permitido porque A está cancelada
    const citaB = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeutaId,
        fecha: testFecha,
        hora_inicio: "15:00",
      });
    expect(citaB.status).toBe(201);
    const citaBId = citaB.body.data.id;

    // 4. Intentar reactivar cita A mientras B está confirmada -> debe fallar con 409
    const reactivarConflicto = await request(app)
      .patch(`/api/citas-spa/${citaAId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "confirmada" });
    expect(reactivarConflicto.status).toBe(409);
    expect(reactivarConflicto.body.code).toBe("THERAPIST_BUSY_OR_BUFFER");

    // 5. Cancelar B y reactivar A -> debe permitirse excluyéndose a sí misma
    await request(app)
      .patch(`/api/citas-spa/${citaBId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "cancelada" });

    const reactivarExitoso = await request(app)
      .patch(`/api/citas-spa/${citaAId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "confirmada" });
    expect(reactivarExitoso.status).toBe(200);
    expect(reactivarExitoso.body.data.estado).toBe("confirmada");

    await database.CitaBienestar.destroy({
      where: { id: [citaAId, citaBId] },
      force: true,
    });
  });

  it("Comprueba protección de descanso entre citas en cruce de fechas (medianoche)", async () => {
    const fechaDia1 = "2026-11-28";
    const fechaDia2 = "2026-11-29";

    // Cita que termina a las 23:55 del día 1 (duración 45 min, inicia 23:10)
    // El buffer reglamentario de 15 minutos se extiende hasta las 00:10 del día 2
    const citaFinDia = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        servicio_bienestar_id: servicioSpa45Id,
        terapeuta_id: activeTerapeutaId,
        fecha: fechaDia1,
        hora_inicio: "23:10",
      });
    expect(citaFinDia.status).toBe(201);
    const citaFinDiaId = citaFinDia.body.data.id;

    // Intentar reservar al día 2 a las 00:05 (dentro del buffer que vence a las 00:10) -> debe ser rechazada con 409
    const intentoDia2 = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpa45Id,
        terapeuta_id: activeTerapeutaId,
        fecha: fechaDia2,
        hora_inicio: "00:05",
      });
    expect(intentoDia2.status).toBe(409);
    expect(intentoDia2.body.code).toBe("THERAPIST_BUSY_OR_BUFFER");

    await database.CitaBienestar.destroy({
      where: { id: citaFinDiaId },
      force: true,
    });
  });

  // =========================================================================
  // MIS RESERVAS (AISLAMIENTO Y PROPIEDAD)
  // =========================================================================

  it("GET /api/citas-spa/mis-reservas devuelve únicamente las citas del cliente autenticado", async () => {
    const res1 = await request(app)
      .get("/api/citas-spa/mis-reservas")
      .set("Authorization", `Bearer ${client1Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.status).toBe("success");
    const ids = res1.body.data.map((c: any) => c.id);
    expect(ids).toContain(createdCitaId);

    const res2 = await request(app)
      .get("/api/citas-spa/mis-reservas")
      .set("Authorization", `Bearer ${client2Token}`);

    expect(res2.status).toBe(200);
    const ids2 = res2.body.data.map((c: any) => c.id);
    expect(ids2).not.toContain(createdCitaId);
  });

  it("GET /api/citas-spa/mis-reservas/:id protege la propiedad (403 si pertenece a otro cliente)", async () => {
    const ownRes = await request(app)
      .get(`/api/citas-spa/mis-reservas/${createdCitaId}`)
      .set("Authorization", `Bearer ${client1Token}`);

    expect(ownRes.status).toBe(200);
    expect(ownRes.body.data.id).toBe(createdCitaId);

    const forbiddenRes = await request(app)
      .get(`/api/citas-spa/mis-reservas/${createdCitaId}`)
      .set("Authorization", `Bearer ${client2Token}`);

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.code).toBe("FORBIDDEN");
  });

  // =========================================================================
  // GESTIÓN ADMINISTRATIVA DE CITAS
  // =========================================================================

  it("GET /api/citas-spa permite a admin listar todas las citas y rechaza a cliente con 403", async () => {
    const clientRes = await request(app)
      .get("/api/citas-spa")
      .set("Authorization", `Bearer ${client1Token}`);
    expect(clientRes.status).toBe(403);

    const adminRes = await request(app)
      .get("/api/citas-spa")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(Array.isArray(adminRes.body.data)).toBe(true);
    const encontrada = adminRes.body.data.find((c: any) => c.id === createdCitaId);
    expect(encontrada).toBeDefined();
    expect(encontrada.Usuario).toBeDefined();
    expect(encontrada.Terapeuta).toBeDefined();
    expect(encontrada.ServicioBienestar).toBeDefined();
  });

  it("PATCH /api/citas-spa/:id/estado permite al administrador actualizar el estado operativo", async () => {
    const res = await request(app)
      .patch(`/api/citas-spa/${createdCitaId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "completada" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.estado).toBe("completada");

    // Restaurar a confirmada para la integración de carrito y pago
    const restoreRes = await request(app)
      .patch(`/api/citas-spa/${createdCitaId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "confirmada" });
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.estado).toBe("confirmada");
  });

  // =========================================================================
  // INTEGRACIÓN CON CARRITO Y FLUJO DE COBRO REAL (STRIPE ELEMENTS + WEBHOOK)
  // =========================================================================

  it("Integra la cita de bienestar en carrito y procesa el cobro completo mediante Stripe PaymentIntent y webhook payment_intent.succeeded", async () => {
    // 1. Crear carrito para cliente 1
    const cartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({});

    expect(cartRes.status).toBe(201);
    cartId = cartRes.body.data.id;

    // 2. Cliente 2 no puede agregar la cita de Cliente 1 (403)
    const otherCartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({});
    const otherCartId = otherCartRes.body.data.id;

    const crossUserRes = await request(app)
      .post(`/api/carritos/${otherCartId}/items`)
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        tipo_item: "bienestar",
        referencia_id: createdCitaId,
      });

    expect(crossUserRes.status).toBe(403);
    await database.Carrito.destroy({ where: { id: otherCartId }, force: true });

    // 3. Cliente 1 agrega su cita a su carrito
    const addItemRes = await request(app)
      .post(`/api/carritos/${cartId}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "bienestar",
        referencia_id: createdCitaId,
      });

    expect(addItemRes.status).toBe(201);
    expect(addItemRes.body.data.tipo_item).toBe("bienestar");
    expect(Number(addItemRes.body.data.precio)).toBe(350);

    // 4. Consultar carrito y verificar que el total refleja la tarifa de bienestar
    const getCartRes = await request(app)
      .get(`/api/carritos/${cartId}/items`)
      .set("Authorization", `Bearer ${client1Token}`);

    expect(getCartRes.status).toBe(200);
    const item = getCartRes.body.data.items.find(
      (i: any) => i.tipo_item === "bienestar" && Number(i.referencia_id) === createdCitaId
    );
    expect(item).toBeDefined();
    expect(Number(item.precio)).toBe(350);

    // 5. Crear intento de pago con Stripe mediante la API real del checkout (POST /api/pagos)
    const paymentRes = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        carrito_id: cartId,
        monto: "350.00",
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: `idemp-bienestar-stripe-${Date.now()}`,
      });

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.estado).toBe("procesando");
    expect(paymentRes.body.data.monto).toBe("350.00");
    expect(paymentRes.body.data.payment_intent_id).toBeDefined();
    expect(paymentRes.body.data.client_secret).toBeDefined();

    const paymentId = Number(paymentRes.body.data.pago_id);
    const paymentIntentId = paymentRes.body.data.payment_intent_id;
    const paymentIntent = stripeMock.intents.get(paymentIntentId);
    expect(paymentIntent).toBeDefined();

    // 6. Simular webhook de Stripe: payment_intent.succeeded
    paymentIntent.status = "succeeded";
    stripeMock.webhook.event = {
      id: `evt_bienestar_${Date.now()}`,
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

    // 7. Verificar persistencia y efectos locales:
    // Pago aprobado
    const pagoDb = await database.Pago.findByPk(paymentId);
    expect(pagoDb).not.toBeNull();
    expect(pagoDb.estado).toBe("aprobado");
    expect(Number(pagoDb.monto)).toBe(350);
    expect(pagoDb.fecha_pago).not.toBeNull();

    // Carrito queda pagado
    const cartDb = await database.Carrito.findByPk(cartId);
    expect(cartDb.estado).toBe("pagado");

    // Estado operativo de la cita se conserva en confirmada
    const citaDb = await database.CitaBienestar.findByPk(createdCitaId);
    expect(citaDb.estado).toBe("confirmada");

    // 8. Replay del webhook (idempotencia): enviar el mismo evento no debe duplicar pagos ni causar error
    const replayWebhookRes = await request(app)
      .post("/api/pagos/stripe/webhook")
      .set("Stripe-Signature", "t=1,v1=qa-local-signature")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ id: stripeMock.webhook.event.id }));

    expect(replayWebhookRes.status).toBe(200);
    const totalPagos = await database.Pago.count({ where: { carrito_id: cartId } });
    expect(totalPagos).toBe(1);

    // 9. Intentar volver a agregar la cita pagada a un nuevo carrito debe fallar con 409
    const newCart = await database.Carrito.create({
      usuario_id: client1UserId,
      estado: "activo",
      expira_en: new Date(Date.now() + 3600000),
    });

    const duplicateRes = await request(app)
      .post(`/api/carritos/${newCart.id}/items`)
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        tipo_item: "bienestar",
        referencia_id: createdCitaId,
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.code).toBe("CART_REFERENCE_NOT_AVAILABLE");

    await database.Carrito.destroy({ where: { id: newCart.id }, force: true });
  });
});
