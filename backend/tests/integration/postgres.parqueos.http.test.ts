import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";

describe("HTTP parqueos against isolated PostgreSQL (hotel_test_db)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let gerenteHabitacionesToken: string;
  let clientToken: string;
  let adminUserId: number;
  let gerenteHabitacionesUserId: number;
  let clientUserId: number;
  let testSucursalId: number;
  let createdParqueoId: number | null = null;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("ParqueosTest123!", 4);

    // Usuario administrador (rol admin -> permitido para habitaciones.gestionar)
    const adminUser = await database.Usuario.create({
      nombre: "Admin QA Parqueos",
      email: `admin-parqueos-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);

    // Usuario gerente de habitaciones (rol gerente_habitaciones -> permitido)
    const gerenteUser = await database.Usuario.create({
      nombre: "Gerente Habitaciones QA Parqueos",
      email: `gerente-parqueos-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "gerente_habitaciones",
      activo: true,
    });
    gerenteHabitacionesUserId = gerenteUser.id;
    gerenteHabitacionesToken = generateAccessToken(gerenteUser);

    // Usuario cliente (rol cliente -> sin permisos de escritura 403)
    const clientUser = await database.Usuario.create({
      nombre: "Cliente QA Parqueos",
      email: `cliente-parqueos-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    clientUserId = clientUser.id;
    clientToken = generateAccessToken(clientUser);

    // Sede en hotel_test_db
    const sucursal = await database.Sucursal.create({
      nombre: `Sede QA Parqueos ${Date.now()}`,
      ciudad: "Antigua Guatemala",
      activa: true,
    });
    testSucursalId = sucursal.id;

    // El gerente opera en esta sede (ficha de empleado con sede principal).
    await database.Empleado.create({
      usuario_id: gerenteHabitacionesUserId,
      sucursal_id: testSucursalId,
      area: "QA",
    });
  });

  afterAll(async () => {
    if (createdParqueoId) {
      await database.Parqueo.destroy({ where: { id: createdParqueoId }, force: true });
    }
    if (gerenteHabitacionesUserId) {
      await database.Empleado.destroy({ where: { usuario_id: gerenteHabitacionesUserId }, force: true });
    }
    if (testSucursalId) {
      await database.Sucursal.destroy({ where: { id: testSucursalId }, force: true });
    }
    if (adminUserId) {
      await database.Usuario.destroy({ where: { id: adminUserId }, force: true });
    }
    if (gerenteHabitacionesUserId) {
      await database.Usuario.destroy({ where: { id: gerenteHabitacionesUserId }, force: true });
    }
    if (clientUserId) {
      await database.Usuario.destroy({ where: { id: clientUserId }, force: true });
    }
    await database.sequelize.close();
  });

  it("rechaza la lectura de parqueos sin autenticación (401)", async () => {
    const res = await request(app).get("/api/parqueos");
    expect(res.status).toBe(401);
  });

  it("rechaza la lectura del inventario de parqueos con rol cliente (403)", async () => {
    // El inventario de parqueos es información operativa; ningún flujo de cliente lo consume.
    const res = await request(app)
      .get("/api/parqueos")
      .set("Authorization", `Bearer ${clientToken}`);

    expect(res.status).toBe(403);
  });

  it("rechaza la creación de parqueos con rol cliente sin permisos (403)", async () => {
    const res = await request(app)
      .post("/api/parqueos")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        sucursal_id: testSucursalId,
        numero: "P-01",
        estado: "disponible",
      });

    expect(res.status).toBe(403);
  });

  it("crea un espacio de parqueo exitosamente con rol gerente_habitaciones (201)", async () => {
    const res = await request(app)
      .post("/api/parqueos")
      .set("Authorization", `Bearer ${gerenteHabitacionesToken}`)
      .send({
        sucursal_id: testSucursalId,
        numero: "P-01",
        estado: "disponible",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      sucursal_id: testSucursalId,
      numero: "P-01",
      estado: "disponible",
    });
    createdParqueoId = res.body.data.id;
  });

  it("rechaza la creación por número duplicado en la misma sede (409)", async () => {
    const res = await request(app)
      .post("/api/parqueos")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: testSucursalId,
        numero: "P-01",
        estado: "disponible",
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("PARQUEO_NUMBER_ALREADY_EXISTS");
  });

  it("actualiza un espacio de parqueo exitosamente con rol admin, admitiendo sucursal_id y estado (200)", async () => {
    const res = await request(app)
      .patch(`/api/parqueos/${createdParqueoId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        numero: "P-02",
        estado: "mantenimiento",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: createdParqueoId,
      numero: "P-02",
      estado: "mantenimiento",
    });
  });

  it("rechaza la actualización de parqueos con rol cliente sin permisos (403)", async () => {
    const res = await request(app)
      .patch(`/api/parqueos/${createdParqueoId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        estado: "ocupado",
      });

    expect(res.status).toBe(403);
  });
});
