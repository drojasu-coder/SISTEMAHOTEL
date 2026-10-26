import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";

describe("HTTP habitaciones against isolated PostgreSQL (hotel_test_db)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let clientToken: string;
  let adminUserId: number;
  let clientUserId: number;
  let testSucursalId: number;
  let testTipoId: number;
  let createdHabitacionId: number | null = null;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("HabitacionesTest123!", 4);

    // Usuario administrador (con permiso habitaciones.gestionar)
    const adminUser = await database.Usuario.create({
      nombre: "Admin QA Habitaciones",
      email: `admin-hab-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);

    // Usuario cliente (sin permiso habitaciones.gestionar)
    const clientUser = await database.Usuario.create({
      nombre: "Cliente QA Habitaciones",
      email: `cliente-hab-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    clientUserId = clientUser.id;
    clientToken = generateAccessToken(clientUser);

    // Sede y Tipo de habitación en hotel_test_db
    const sucursal = await database.Sucursal.create({
      nombre: `Sede QA Habitaciones ${Date.now()}`,
      ciudad: "Antigua Guatemala",
      activa: true,
    });
    testSucursalId = sucursal.id;

    const tipo = await database.TipoHabitacion.create({
      nombre: `Suite Presidencial QA ${Date.now()}`,
      capacidad_maxima: 4,
      tarifa_noche: 1250.0,
      activa: true,
    });
    testTipoId = tipo.id;
  });

  afterAll(async () => {
    if (createdHabitacionId) {
      await database.Habitacion.destroy({ where: { id: createdHabitacionId }, force: true });
    }
    if (testTipoId) {
      await database.TipoHabitacion.destroy({ where: { id: testTipoId }, force: true });
    }
    if (testSucursalId) {
      await database.Sucursal.destroy({ where: { id: testSucursalId }, force: true });
    }
    if (adminUserId) {
      await database.Usuario.destroy({ where: { id: adminUserId }, force: true });
    }
    if (clientUserId) {
      await database.Usuario.destroy({ where: { id: clientUserId }, force: true });
    }
    await database.sequelize.close();
  });

  it("rechaza la creación de habitaciones si el usuario no tiene rol autorizado (403)", async () => {
    const res = await request(app)
      .post("/api/habitaciones")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        sucursal_id: testSucursalId,
        tipo_habitacion_id: testTipoId,
        numero: "101QA",
        estado: "disponible",
      });

    expect(res.status).toBe(403);
  });

  it("crea una habitación exitosamente con usuario administrador (201)", async () => {
    const res = await request(app)
      .post("/api/habitaciones")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: testSucursalId,
        tipo_habitacion_id: testTipoId,
        numero: "101QA",
        estado: "disponible",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      sucursal_id: testSucursalId,
      tipo_habitacion_id: testTipoId,
      numero: "101QA",
      estado: "disponible",
    });
    createdHabitacionId = res.body.data.id;
  });

  it("rechaza la creación con número duplicado en la misma sede (409 Conflict)", async () => {
    const res = await request(app)
      .post("/api/habitaciones")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: testSucursalId,
        tipo_habitacion_id: testTipoId,
        numero: "101QA",
        estado: "disponible",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("edita los datos de la habitación existente mediante PATCH (200)", async () => {
    expect(createdHabitacionId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/habitaciones/${createdHabitacionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        numero: "101-B",
        estado: "mantenimiento",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.numero).toBe("101-B");
    expect(res.body.data.estado).toBe("mantenimiento");
  });

  it("lista las habitaciones autenticadas incluyendo relaciones (200)", async () => {
    const res = await request(app)
      .get("/api/habitaciones")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const encontrada = res.body.data.find(
      (h: { id: number }) => h.id === createdHabitacionId
    );
    expect(encontrada).toBeDefined();
    expect(encontrada.numero).toBe("101-B");
  });

  it("retorna la imagen y créditos de la sede cuando la habitación tiene imagen_key propia", async () => {
    const antiguaKey = "sedes/hotel-hunahpu-antigua/habitaciones/individual-1792979381507-3a2dc3c5b8fc.webp";
    const habConFoto = await database.Habitacion.create({
      sucursal_id: testSucursalId,
      tipo_habitacion_id: testTipoId,
      numero: "201-FOTO",
      estado: "disponible",
      imagen_key: antiguaKey,
    });

    const res = await request(app)
      .get(`/api/habitaciones/${habConFoto.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.imagen_key).toBe(antiguaKey);
    expect(res.body.data.imagen_url).toBeDefined();
    expect(res.body.data.imagen_creditos).toMatchObject({
      autor: "jjmusgrove",
      licencia: "CC BY 2.0",
      texto: "jjmusgrove (CC BY 2.0)",
    });

    await database.Habitacion.destroy({ where: { id: habConFoto.id }, force: true });
  });

  it("aplica el respaldo de imagen del tipo cuando la habitación no tiene foto propia", async () => {
    const atitlanSuiteKey = "sedes/hotel-hunahpu-atitlan/habitaciones/suite-1792979380176-40a2118460a9.webp";
    const tipoConFoto = await database.TipoHabitacion.create({
      nombre: `Tipo Con Respaldo ${Date.now()}`,
      capacidad_maxima: 2,
      tarifa_noche: 800.0,
      activa: true,
      imagen_key: atitlanSuiteKey,
    });

    const habSinFoto = await database.Habitacion.create({
      sucursal_id: testSucursalId,
      tipo_habitacion_id: tipoConFoto.id,
      numero: "301-R",
      estado: "disponible",
      imagen_key: null,
    });

    const res = await request(app)
      .get(`/api/habitaciones/${habSinFoto.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.imagen_key).toBeNull();
    // La imagen y los créditos efectivos se respaldan desde el TipoHabitacion
    expect(res.body.data.imagen_url).toBeDefined();
    expect(res.body.data.imagen_creditos).toMatchObject({
      autor: "Basile Morin",
      licencia: "CC BY-SA 4.0",
    });
    expect(res.body.data.TipoHabitacion.imagen_key).toBe(atitlanSuiteKey);
    expect(res.body.data.TipoHabitacion.imagen_creditos).toMatchObject({
      autor: "Basile Morin",
      licencia: "CC BY-SA 4.0",
    });

    await database.Habitacion.destroy({ where: { id: habSinFoto.id }, force: true });
    await database.TipoHabitacion.destroy({ where: { id: tipoConFoto.id }, force: true });
  });
});
