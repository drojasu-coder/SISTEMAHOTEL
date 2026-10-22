import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";

describe("HTTP amenidades against isolated PostgreSQL (hotel_test_db)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let clientToken: string;
  let adminUserId: number;
  let clientUserId: number;
  let testSucursalId: number;
  let createdAmenidadId: number | null = null;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("AmenidadesTest123!", 4);

    // Usuario administrador (rol admin -> permitido para servicios.administrar)
    const adminUser = await database.Usuario.create({
      nombre: "Admin QA Amenidades",
      email: `admin-amenidades-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);

    // Usuario cliente (rol cliente -> sin permisos de escritura 403)
    const clientUser = await database.Usuario.create({
      nombre: "Cliente QA Amenidades",
      email: `cliente-amenidades-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    clientUserId = clientUser.id;
    clientToken = generateAccessToken(clientUser);

    // Sede en hotel_test_db
    const sucursal = await database.Sucursal.create({
      nombre: `Sede QA Amenidades ${Date.now()}`,
      ciudad: "Antigua Guatemala",
      activa: true,
    });
    testSucursalId = sucursal.id;
  });

  afterAll(async () => {
    if (createdAmenidadId) {
      await database.Amenidad.destroy({ where: { id: createdAmenidadId }, force: true });
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

  it("rechaza la creación de amenidades sin autenticación (401)", async () => {
    const res = await request(app)
      .post("/api/amenidades")
      .send({
        sucursal_id: testSucursalId,
        nombre: "Piscina Sin Auth",
        aforo_maximo: 20,
      });

    expect(res.status).toBe(401);
  });

  it("rechaza la creación de amenidades si el usuario no tiene rol admin (403)", async () => {
    const res = await request(app)
      .post("/api/amenidades")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        sucursal_id: testSucursalId,
        nombre: "Piscina No Autorizada",
        aforo_maximo: 20,
      });

    expect(res.status).toBe(403);
  });

  it("crea una amenidad exitosamente con usuario administrador (201)", async () => {
    const res = await request(app)
      .post("/api/amenidades")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: testSucursalId,
        nombre: `Piscina Climatizada QA ${Date.now()}`,
        aforo_maximo: 25,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      sucursal_id: testSucursalId,
      aforo_maximo: 25,
    });
    createdAmenidadId = res.body.data.id;
  });

  it("obtiene el listado de amenidades públicamente (200) con formato { status: 'success', data }", async () => {
    const res = await request(app).get("/api/amenidades");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);

    const found = res.body.data.find((a: any) => a.id === createdAmenidadId);
    expect(found).toBeDefined();
    expect(found.sucursal_id).toBe(testSucursalId);
  });

  it("obtiene una amenidad por ID públicamente (200)", async () => {
    const res = await request(app).get(`/api/amenidades/${createdAmenidadId}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.id).toBe(createdAmenidadId);
    expect(res.body.data.aforo_maximo).toBe(25);
  });

  it("actualiza una amenidad exitosamente con usuario administrador (200)", async () => {
    const res = await request(app)
      .patch(`/api/amenidades/${createdAmenidadId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        aforo_maximo: 35,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.aforo_maximo).toBe(35);
  });

  it("rechaza la actualización de amenidades con usuario cliente sin permisos (403)", async () => {
    const res = await request(app)
      .patch(`/api/amenidades/${createdAmenidadId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        aforo_maximo: 50,
      });

    expect(res.status).toBe(403);
  });

  it("rechaza la actualización si se intenta enviar sucursal_id (400) por validador strict", async () => {
    const res = await request(app)
      .patch(`/api/amenidades/${createdAmenidadId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: testSucursalId,
        aforo_maximo: 40,
      });

    expect(res.status).toBe(400);
  });
});
