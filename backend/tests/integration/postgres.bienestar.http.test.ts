import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
  let inactiveTerapeutaId: number;
  let servicioSpaId: number;
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
      nombre: `Terapeuta Activo ${Date.now()}`,
      activo: true,
    });
    activeTerapeutaId = terapeutaActivo.id;

    const terapeutaInactivo = await database.Terapeuta.create({
      nombre: `Terapeuta Inactivo ${Date.now()}`,
      activo: false,
    });
    inactiveTerapeutaId = terapeutaInactivo.id;

    // 3. Servicio de Bienestar (60 mins, Q350.00)
    const servicio = await database.ServicioBienestar.create({
      nombre: `Masaje Terapéutico QA ${Date.now()}`,
      duracion_minutos: 60,
      precio: 350.0,
    });
    servicioSpaId = servicio.id;
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
    if (createdCitaId) {
      await database.CitaBienestar.destroy({ where: { id: createdCitaId }, force: true });
    }
    if (servicioSpaId) {
      await database.ServicioBienestar.destroy({ where: { id: servicioSpaId }, force: true });
    }
    if (activeTerapeutaId) {
      await database.Terapeuta.destroy({ where: { id: activeTerapeutaId }, force: true });
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
    // Cliente -> 403
    const forbiddenRes = await request(app)
      .post("/api/servicios-spa")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({
        nombre: "Servicio no autorizado",
        duracion_minutos: 45,
        precio: 200,
      });
    expect(forbiddenRes.status).toBe(403);

    // Admin -> 201
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

    // Limpieza
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

    // Limpieza
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

  it("POST /api/citas-spa rechaza traslape o cita dentro del buffer de 15 minutos con 409 THERAPIST_BUSY_OR_BUFFER", async () => {
    // La cita creada es 10:00 - 11:00.
    // El buffer reglamentario requiere 15 minutos de descanso: el terapeuta está ocupado hasta las 11:15.
    // Intentar a las 11:05 (dentro del buffer) debe fallar con 409
    const bufferRes = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeutaId,
        fecha: "2026-11-20",
        hora_inicio: "11:05",
      });

    expect(bufferRes.status).toBe(409);
    expect(bufferRes.body.code).toBe("THERAPIST_BUSY_OR_BUFFER");

    // Intentar a las 10:30 (en pleno traslape) debe fallar con 409
    const overlapRes = await request(app)
      .post("/api/citas-spa")
      .set("Authorization", `Bearer ${client2Token}`)
      .send({
        servicio_bienestar_id: servicioSpaId,
        terapeuta_id: activeTerapeutaId,
        fecha: "2026-11-20",
        hora_inicio: "10:30",
      });

    expect(overlapRes.status).toBe(409);
    expect(overlapRes.body.code).toBe("THERAPIST_BUSY_OR_BUFFER");
  });

  // =========================================================================
  // MIS RESERVAS (AISLAMIENTO Y PROPIEDAD)
  // =========================================================================

  it("GET /api/citas-spa/mis-reservas devuelve únicamente las citas del cliente autenticado", async () => {
    // Cliente 1 tiene su cita
    const res1 = await request(app)
      .get("/api/citas-spa/mis-reservas")
      .set("Authorization", `Bearer ${client1Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.status).toBe("success");
    const ids = res1.body.data.map((c: any) => c.id);
    expect(ids).toContain(createdCitaId);

    // Cliente 2 no tiene citas creadas
    const res2 = await request(app)
      .get("/api/citas-spa/mis-reservas")
      .set("Authorization", `Bearer ${client2Token}`);

    expect(res2.status).toBe(200);
    const ids2 = res2.body.data.map((c: any) => c.id);
    expect(ids2).not.toContain(createdCitaId);
  });

  it("GET /api/citas-spa/mis-reservas/:id protege la propiedad (403 si pertenece a otro cliente)", async () => {
    // Cliente 1 consulta su propia cita -> 200
    const ownRes = await request(app)
      .get(`/api/citas-spa/mis-reservas/${createdCitaId}`)
      .set("Authorization", `Bearer ${client1Token}`);

    expect(ownRes.status).toBe(200);
    expect(ownRes.body.data.id).toBe(createdCitaId);

    // Cliente 2 intenta consultar la cita de Cliente 1 -> 403 FORBIDDEN
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

    // Restaurar a confirmada para las siguientes pruebas
    const restoreRes = await request(app)
      .patch(`/api/citas-spa/${createdCitaId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado: "confirmada" });
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.estado).toBe("confirmada");
  });

  // =========================================================================
  // INTEGRACIÓN CON CARRITO Y FLUJO DE COBRO
  // =========================================================================

  it("Integra la cita de bienestar en el carrito del cliente", async () => {
    // 1. Crear carrito para cliente 1
    const cartRes = await request(app)
      .post("/api/carritos")
      .set("Authorization", `Bearer ${client1Token}`)
      .send({});

    expect(cartRes.status).toBe(201);
    cartId = cartRes.body.data.id;

    // 2. Cliente 2 no puede agregar la cita de Cliente 1
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

    // Debe denegar por no ser dueño de la cita
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

    // 5. Registrar pago para el carrito (efectivo por admin)
    const payRes = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        carrito_id: cartId,
        monto: 350,
        metodo: "efectivo",
        tipo_pago: "total",
        moneda: "GTQ",
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.data.estado).toBe("aprobado");

    // 6. Carrito queda pagado
    const paidCart = await database.Carrito.findByPk(cartId);
    expect(paidCart.estado).toBe("pagado");

    // 7. Intentar volver a agregar la cita pagada a un nuevo carrito debe fallar con 409
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
