import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";

describe("HTTP mesas against isolated PostgreSQL (hotel_test_db)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let gerenteRestauranteToken: string;
  let clientToken: string;
  let adminUserId: number;
  let gerenteRestauranteUserId: number;
  let clientUserId: number;
  let testSucursalId: number;
  let createdMesaId: number | null = null;
  let mesaSinEstadoId: number | null = null;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("MesasTest123!", 4);

    // Usuario administrador (rol admin -> permitido)
    const adminUser = await database.Usuario.create({
      nombre: "Admin QA Mesas",
      email: `admin-mesas-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);

    // Usuario gerente de restaurante (rol gerente_restaurante -> permitido)
    const gerenteUser = await database.Usuario.create({
      nombre: "Gerente Restaurante QA Mesas",
      email: `gerente-mesas-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "gerente_restaurante",
      activo: true,
    });
    gerenteRestauranteUserId = gerenteUser.id;
    gerenteRestauranteToken = generateAccessToken(gerenteUser);

    // Usuario cliente (rol cliente -> sin permisos de escritura)
    const clientUser = await database.Usuario.create({
      nombre: "Cliente QA Mesas",
      email: `cliente-mesas-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    clientUserId = clientUser.id;
    clientToken = generateAccessToken(clientUser);

    // Sede en hotel_test_db
    const sucursal = await database.Sucursal.create({
      nombre: `Sede QA Mesas ${Date.now()}`,
      ciudad: "Guatemala",
      activa: true,
    });
    testSucursalId = sucursal.id;
  });

  afterAll(async () => {
    if (createdMesaId) {
      await database.Mesa.destroy({ where: { id: createdMesaId }, force: true });
    }
    if (mesaSinEstadoId) {
      await database.Mesa.destroy({ where: { id: mesaSinEstadoId }, force: true });
    }
    if (testSucursalId) {
      await database.Sucursal.destroy({ where: { id: testSucursalId }, force: true });
    }
    if (adminUserId) {
      await database.Usuario.destroy({ where: { id: adminUserId }, force: true });
    }
    if (gerenteRestauranteUserId) {
      await database.Usuario.destroy({ where: { id: gerenteRestauranteUserId }, force: true });
    }
    if (clientUserId) {
      await database.Usuario.destroy({ where: { id: clientUserId }, force: true });
    }
    await database.sequelize.close();
  });

  it("rechaza la creación de mesas si el usuario no tiene rol autorizado (403)", async () => {
    const res = await request(app)
      .post("/api/mesas")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        sucursal_id: testSucursalId,
        zona: "Terraza QA",
        capacidad: 4,
        estado: "disponible",
      });

    expect(res.status).toBe(403);
  });

  it("crea una mesa exitosamente con rol administrador (201)", async () => {
    const res = await request(app)
      .post("/api/mesas")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: testSucursalId,
        zona: "Terraza Central",
        capacidad: 4,
        estado: "disponible",
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      sucursal_id: testSucursalId,
      zona: "Terraza Central",
      capacidad: 4,
      estado: "disponible",
    });
    createdMesaId = res.body.data.id;
  });

  it("rechaza creación con estado: null devolviendo 400 VALIDATION_ERROR (BE-008)", async () => {
    const res = await request(app)
      .post("/api/mesas")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: testSucursalId,
        zona: "Terraza Norte",
        capacidad: 2,
        estado: null,
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "estado" }),
      ])
    );
  });

  it("crea una mesa omitiendo el campo estado y aplica valor por defecto disponible (201)", async () => {
    const res = await request(app)
      .post("/api/mesas")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sucursal_id: testSucursalId,
        zona: "Barra Central",
        capacidad: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      sucursal_id: testSucursalId,
      zona: "Barra Central",
      capacidad: 2,
      estado: "disponible",
    });
    mesaSinEstadoId = res.body.data.id;
  });

  it("lista las mesas incluyendo la mesa creada y relación con sede (200)", async () => {
    const res = await request(app).get("/api/mesas");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);

    const encontrada = res.body.data.find((m: { id: number }) => m.id === createdMesaId);
    expect(encontrada).toBeDefined();
    expect(encontrada.zona).toBe("Terraza Central");
    expect(encontrada.capacidad).toBe(4);
    expect(encontrada.Sucursal).toBeDefined();
    expect(encontrada.Sucursal.nombre).toContain("Sede QA Mesas");
  });

  it("obtiene el detalle de una mesa por ID (200)", async () => {
    expect(createdMesaId).not.toBeNull();

    const res = await request(app).get(`/api/mesas/${createdMesaId}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      id: createdMesaId,
      sucursal_id: testSucursalId,
      zona: "Terraza Central",
      capacidad: 4,
      estado: "disponible",
    });
  });

  it("devuelve 404 si la mesa solicitada no existe", async () => {
    const res = await request(app).get("/api/mesas/999999");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 404,
      code: "TABLE_NOT_FOUND",
    });
  });

  it("devuelve 400 si el parámetro ID no es válido", async () => {
    const res = await request(app).get("/api/mesas/no-es-numero");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("rechaza la edición de mesas si el usuario no tiene rol autorizado (403)", async () => {
    expect(createdMesaId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/mesas/${createdMesaId}`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({
        zona: "Zona No Autorizada",
        capacidad: 6,
      });

    expect(res.status).toBe(403);
  });

  it("rechaza edición con estado: null devolviendo 400 VALIDATION_ERROR (BE-008)", async () => {
    expect(createdMesaId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/mesas/${createdMesaId}`)
      .set("Authorization", `Bearer ${gerenteRestauranteToken}`)
      .send({
        estado: null,
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "estado" }),
      ])
    );
  });

  it("rechaza edición que incluye sucursal_id devolviendo 400 VALIDATION_ERROR (.strict)", async () => {
    expect(createdMesaId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/mesas/${createdMesaId}`)
      .set("Authorization", `Bearer ${gerenteRestauranteToken}`)
      .send({
        sucursal_id: testSucursalId,
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("rechaza edición con objeto vacío devolviendo 400 VALIDATION_ERROR", async () => {
    expect(createdMesaId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/mesas/${createdMesaId}`)
      .set("Authorization", `Bearer ${gerenteRestauranteToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("edita la mesa exitosamente con rol gerente_restaurante (200)", async () => {
    expect(createdMesaId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/mesas/${createdMesaId}`)
      .set("Authorization", `Bearer ${gerenteRestauranteToken}`)
      .send({
        zona: "Terraza Vista Lago",
        capacidad: 6,
        estado: "ocupada",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.zona).toBe("Terraza Vista Lago");
    expect(res.body.data.capacidad).toBe(6);
    expect(res.body.data.estado).toBe("ocupada");
  });

  it("edita la mesa omitiendo el campo estado y conserva el valor anterior (200)", async () => {
    expect(createdMesaId).not.toBeNull();

    const res = await request(app)
      .patch(`/api/mesas/${createdMesaId}`)
      .set("Authorization", `Bearer ${gerenteRestauranteToken}`)
      .send({
        capacidad: 8,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.capacidad).toBe(8);
    expect(res.body.data.zona).toBe("Terraza Vista Lago");
    expect(res.body.data.estado).toBe("ocupada");
  });
});
