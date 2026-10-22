import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";

describe("HTTP tipos-habitacion against isolated PostgreSQL (hotel_test_db)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let clientToken: string;
  let adminUserId: number;
  let clientUserId: number;
  let createdTipoId: number | null = null;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("TiposTest123!", 4);

    // Usuario administrador (rol admin -> permitido para gestionar habitaciones)
    const adminUser = await database.Usuario.create({
      nombre: "Admin QA Tipos",
      email: `admin-tipos-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);

    // Usuario cliente (rol cliente -> sin permisos de escritura 403)
    const clientUser = await database.Usuario.create({
      nombre: "Cliente QA Tipos",
      email: `cliente-tipos-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    clientUserId = clientUser.id;
    clientToken = generateAccessToken(clientUser);
  });

  afterAll(async () => {
    if (createdTipoId) {
      await database.TipoHabitacion.destroy({ where: { id: createdTipoId }, force: true });
    }
    if (adminUserId) {
      await database.Usuario.destroy({ where: { id: adminUserId }, force: true });
    }
    if (clientUserId) {
      await database.Usuario.destroy({ where: { id: clientUserId }, force: true });
    }
    await database.sequelize.close();
  });

  it("rechaza la creación de tipos si el usuario no tiene rol autorizado (403)", async () => {
    const res = await request(app)
      .post("/api/tipos-habitacion")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        nombre: "Suite No Autorizada",
        capacidad_maxima: 2,
        tarifa_noche: 500,
      });

    expect(res.status).toBe(403);
  });

  it("crea un tipo de habitación exitosamente con usuario administrador (201)", async () => {
    const res = await request(app)
      .post("/api/tipos-habitacion")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: `Suite Imperial QA ${Date.now()}`,
        capacidad_maxima: 4,
        tarifa_noche: 1500.0,
        descripcion: "Vista panorámica y jacuzzi privado",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      capacidad_maxima: 4,
      descripcion: "Vista panorámica y jacuzzi privado",
    });
    createdTipoId = res.body.data.id;
  });

  it("acepta explícitamente tarifa cero (0) en creación (201)", async () => {
    const res = await request(app)
      .post("/api/tipos-habitacion")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: `Cortesía QA ${Date.now()}`,
        capacidad_maxima: 2,
        tarifa_noche: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Limpieza inmediata del tipo de cortesía
    if (res.body.data?.id) {
      await database.TipoHabitacion.destroy({ where: { id: res.body.data.id }, force: true });
    }
  });

  it("lista los tipos de habitación autenticados (200)", async () => {
    const res = await request(app)
      .get("/api/tipos-habitacion")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const encontrada = res.body.data.find((t: { id: number }) => t.id === createdTipoId);
    expect(encontrada).toBeDefined();
  });

  it("rechaza la edición si el usuario no tiene rol autorizado (403)", async () => {
    expect(createdTipoId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/tipos-habitacion/${createdTipoId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        nombre: "Nuevo Nombre No Autorizado",
      });

    expect(res.status).toBe(403);
  });

  it("edita los datos del tipo de habitación mediante PATCH (200)", async () => {
    expect(createdTipoId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/tipos-habitacion/${createdTipoId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        tarifa_noche: 1750.5,
        descripcion: "Descripción actualizada",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.tarifa_noche)).toBe(1750.5);
    expect(res.body.data.descripcion).toBe("Descripción actualizada");
  });
});
