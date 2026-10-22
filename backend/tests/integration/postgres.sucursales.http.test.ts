import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";

describe("HTTP sucursales against isolated PostgreSQL (hotel_test_db)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let adminUserId: number;
  let createdBranchId: number | null = null;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    // Crear usuario administrador temporal en hotel_test_db
    const passwordHash = await bcrypt.hash("AdminPass123!", 4);
    const adminUser = await database.Usuario.create({
      nombre: "Admin QA HTTP",
      email: `admin-qa-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);
  });

  afterAll(async () => {
    if (createdBranchId) {
      await database.Sucursal.destroy({ where: { id: createdBranchId }, force: true });
    }
    if (adminUserId) {
      await database.Usuario.destroy({ where: { id: adminUserId }, force: true });
    }
    await database.sequelize.close();
  });

  it("crea una nueva sucursal mediante HTTP POST /api/sucursales", async () => {
    const res = await request(app)
      .post("/api/sucursales")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: `Sede QA HTTP ${Date.now()}`,
        direccion: "4a Calle Oriente #10",
        ciudad: "Antigua Guatemala",
        telefono: "78321000",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      direccion: "4a Calle Oriente #10",
      ciudad: "Antigua Guatemala",
      telefono: "78321000",
      activa: true,
    });

    createdBranchId = res.body.data.id;
  });

  it("edita los datos de la sucursal mediante HTTP PATCH /api/sucursales/:id", async () => {
    expect(createdBranchId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/sucursales/${createdBranchId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: "Sede QA HTTP Editada",
        telefono: "78329999",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data.nombre).toBe("Sede QA HTTP Editada");
    expect(res.body.data.telefono).toBe("78329999");
  });

  it("cambia el estado a inactiva mediante HTTP PATCH /api/sucursales/:id", async () => {
    expect(createdBranchId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/sucursales/${createdBranchId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        activa: false,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data.activa).toBe(false);
  });

  it("reactiva la sucursal mediante HTTP PATCH /api/sucursales/:id", async () => {
    expect(createdBranchId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/sucursales/${createdBranchId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        activa: true,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body.data.activa).toBe(true);
  });

  it("obtiene el listado general con la sede creada mediante HTTP GET /api/sucursales", async () => {
    const res = await request(app).get("/api/sucursales");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((s: { id: number }) => s.id === createdBranchId);
    expect(found).toBeDefined();
    expect(found.nombre).toBe("Sede QA HTTP Editada");
  });
});
