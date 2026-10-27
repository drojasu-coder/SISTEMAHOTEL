import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { generateAccessToken } from "../../src/utils/jwt";

describe("HTTP Página de Inicio against isolated PostgreSQL (hotel_test_db)", () => {
  let database: TestDatabase;
  let app: (typeof import("../../src/app"))["default"];
  let adminToken: string;
  let clientToken: string;
  let adminUserId: number;
  let clientUserId: number;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    ({ default: app } = await import("../../src/app"));

    const passwordHash = await bcrypt.hash("Pass1234!", 4);

    const adminUser = await database.Usuario.create({
      nombre: "Admin Inicio QA",
      email: `admin-inicio-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "admin",
      activo: true,
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken(adminUser);

    const clientUser = await database.Usuario.create({
      nombre: "Cliente Inicio QA",
      email: `client-inicio-${Date.now()}@hoteltest.test`,
      password_hash: passwordHash,
      rol: "cliente",
      activo: true,
    });
    clientUserId = clientUser.id;
    clientToken = generateAccessToken(clientUser);
  });

  afterAll(async () => {
    if (adminUserId) {
      await database.Usuario.destroy({ where: { id: adminUserId }, force: true });
    }
    if (clientUserId) {
      await database.Usuario.destroy({ where: { id: clientUserId }, force: true });
    }
    await database.sequelize.close();
  });

  it("GET /api/inicio es público y entrega contenido editorial con URLs prefirmadas de S3 y créditos", async () => {
    const res = await request(app).get("/api/inicio");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      id: 1,
      hero_titulo: expect.any(String),
      hero_subtitulo: expect.any(String),
      hero_cta_texto: expect.any(String),
      hero_cta_enlace: expect.any(String),
      presentacion_titulo: expect.any(String),
      presentacion_texto: expect.any(String),
      presentacion_visible: true,
      sedes_titulo: expect.any(String),
      sedes_visible: true,
      experiencias_titulo: expect.any(String),
      experiencias_visible: true,
      contacto_titulo: expect.any(String),
      contacto_visible: true,
    });

    // URLs prefirmadas válidas
    expect(res.body.data.hero_imagen_url).toContain("https://");
    expect(res.body.data.presentacion_imagen_url).toContain("https://");
    expect(res.body.data.experiencias_imagen_url).toContain("https://");

    // Créditos fotográficos oficiales verificados
    expect(res.body.data.hero_imagen_creditos).toMatchObject({
      autor: "Mark Harpur",
      licencia: "Unsplash",
    });
    expect(res.body.data.presentacion_imagen_creditos).toMatchObject({
      autor: "mana5280",
      licencia: "Unsplash",
    });
    expect(res.body.data.experiencias_imagen_creditos).toMatchObject({
      autor: "Roberto Nickson",
      licencia: "Unsplash",
    });

    // Expiración para renovación proactiva en frontend
    expect(res.body.data.expiresAt).toBeDefined();
  });

  it("PUT /api/inicio exige rol administrador", async () => {
    // 1. Sin autenticación -> 401
    const unauthRes = await request(app)
      .put("/api/inicio")
      .send({ hero_titulo: "Intento No Autorizado" });
    expect(unauthRes.status).toBe(401);

    // 2. Con rol cliente -> 403
    const forbiddenRes = await request(app)
      .put("/api/inicio")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ hero_titulo: "Intento Cliente" });
    expect(forbiddenRes.status).toBe(403);
  });

  it("PUT /api/inicio permite al administrador actualizar textos y visibilidad editorial", async () => {
    const updatePayload = {
      hero_titulo: "HOTEL HUNAHPÚ · DESTINOS DE ENSUEÑO",
      hero_subtitulo: "Experiencias de lujo y serenidad en toda Guatemala.",
      presentacion_visible: false,
      contacto_telefono: "+502 2333-4444",
    };

    const res = await request(app)
      .put("/api/inicio")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.hero_titulo).toBe("HOTEL HUNAHPÚ · DESTINOS DE ENSUEÑO");
    expect(res.body.data.hero_subtitulo).toBe("Experiencias de lujo y serenidad en toda Guatemala.");
    expect(res.body.data.presentacion_visible).toBe(false);
    expect(res.body.data.contacto_telefono).toBe("+502 2333-4444");

    // Restaurar valores por defecto para mantener consistencia
    await request(app)
      .put("/api/inicio")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        hero_titulo: "HOTEL HUNAHPÚ",
        hero_subtitulo:
          "Hospedaje de distinción, gastronomía y bienestar en los destinos más emblemáticos de Guatemala.",
        presentacion_visible: true,
        contacto_telefono: "+502 2222-3333",
      });
  });

  it("DELETE /api/inicio/imagen/:section rechaza secciones no autorizadas", async () => {
    const res = await request(app)
      .delete("/api/inicio/imagen/seccion_inexistente")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_SECTION");
  });
});
