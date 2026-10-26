import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import app from "../../src/app";
import { env } from "../../src/config/env";
import { ROLES } from "../../src/constants/roles";
import { generateAccessToken } from "../../src/utils/jwt";
import * as s3Service from "../../src/services/storage/s3.service";
import { clearConfirmedTokensCache } from "../../src/modules/sucursales/sucursal.service";
import { S3Client } from "@aws-sdk/client-s3";

const db = require("../../src/models");
const { Sucursal, Usuario, ConfirmacionSubida } = db;

describe("Sucursal Imagen Principal Integration Tests", () => {
  let adminToken: string;
  let clientToken: string;
  let adminUser: any;
  let clientUser: any;
  let testSede: any;

  async function createRealPng(width = 300, height = 300): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 70, g: 130, b: 180 },
      },
    })
      .png()
      .toBuffer();
  }

  const mockStorage = new Map<string, { body: Buffer; contentType: string }>();
  let shouldFailDelete = false;

  const testS3Client = new S3Client({ region: env.AWS_REGION });
  const originalSend = testS3Client.send.bind(testS3Client);

  beforeAll(async () => {
    testS3Client.send = (async (command: any) => {
      const name = command.constructor.name;
      if (name === "PutObjectCommand") {
        mockStorage.set(command.input.Key, {
          body: Buffer.isBuffer(command.input.Body)
            ? command.input.Body
            : Buffer.from(command.input.Body || ""),
          contentType: command.input.ContentType,
        });
        return {};
      }
      if (name === "GetObjectCommand") {
        const item = mockStorage.get(command.input.Key);
        if (!item) {
          const err: any = new Error("NoSuchKey");
          err.name = "NoSuchKey";
          throw err;
        }
        return {
          Body: {
            transformToByteArray: async () => item.body,
          },
        };
      }
      if (name === "DeleteObjectCommand") {
        if (shouldFailDelete) {
          const err: any = new Error("S3 simulated delete network failure");
          err.name = "ServiceUnavailable";
          throw err;
        }
        mockStorage.delete(command.input.Key);
        return {};
      }
      return originalSend(command);
    }) as any;

    s3Service.setS3Client(testS3Client);

    if (ConfirmacionSubida && typeof ConfirmacionSubida.sync === "function") {
      await ConfirmacionSubida.sync();
    }

    adminUser = await Usuario.findOne({ where: { rol: ROLES.ADMIN, activo: true } });
    if (!adminUser) {
      adminUser = await Usuario.create({
        nombre: "Admin Imagenes Test",
        email: `admin_img_${Date.now()}@hunahpu.test`,
        password_hash: "hash_test",
        rol: ROLES.ADMIN,
        activo: true,
      });
    }

    clientUser = await Usuario.findOne({ where: { rol: ROLES.CLIENTE, activo: true } });
    if (!clientUser) {
      clientUser = await Usuario.create({
        nombre: "Cliente Test",
        email: `cliente_img_${Date.now()}@hunahpu.test`,
        password_hash: "hash_test",
        rol: ROLES.CLIENTE,
        activo: true,
      });
    }

    adminToken = generateAccessToken({ id: adminUser.id });
    clientToken = generateAccessToken({ id: clientUser.id });

    testSede = await Sucursal.create({
      nombre: `Sede Test Imagen ${Date.now()}`,
      ciudad: "Sololá",
      direccion: "Panajachel",
      activa: true,
      imagen_key: null,
    });
  });

  afterAll(async () => {
    s3Service.setS3Client(null);
    clearConfirmedTokensCache();
    if (testSede) {
      await testSede.destroy().catch(() => {});
    }
  });

  it("1. Rejects unauthenticated or non-admin requests", async () => {
    const resNoAuth = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .send({ contentType: "image/webp" });
    expect(resNoAuth.status).toBe(401);

    const resForbidden = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ contentType: "image/webp" });
    expect(resForbidden.status).toBe(403);
  });

  it("2. Requests presigned upload URL and binds it securely to sede and user", async () => {
    const res = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/webp" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.uploadUrl).toBeDefined();
    expect(res.body.data.tempKey).toMatch(new RegExp(`^sedes/temp/${testSede.id}_${adminUser.id}_`));
    expect(res.body.data.uploadToken).toBeDefined();
    expect(res.body.data.expiresInSeconds).toBe(900);
  });

  it("3. Rejects confirmation if token is tampered, forged or mismatched", async () => {
    const forgedToken = jwt.sign(
      { sedeId: 999999, userId: adminUser.id, tempKey: "sedes/temp/other.webp" },
      env.JWT_SECRET,
    );

    const res = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        uploadToken: forgedToken,
        tempKey: "sedes/temp/other.webp",
      });

    expect(res.status).toBe(403);
  });

  it("4. Validates uploaded image with full raster decoding, publishes unique final key and updates sede", async () => {
    const presignRes = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/png" });

    const { uploadToken, tempKey } = presignRes.body.data;

    const validPng = await createRealPng(600, 400);
    mockStorage.set(tempKey, { body: validPng, contentType: "image/png" });

    const confirmRes = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ uploadToken, tempKey });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe("success");
    expect(confirmRes.body.data.imagen_key).toMatch(new RegExp(`^sedes/${testSede.id}/portada_.*\\.png$`));
    expect(confirmRes.body.data.imagen_url).toBeDefined();
    expect(confirmRes.body.data.imagen_expires_at).toBeDefined();

    expect(mockStorage.has(tempKey)).toBe(false);
    const finalKey = confirmRes.body.data.imagen_key;
    expect(mockStorage.has(finalKey)).toBe(true);
  });

  it("5. Rejects file with valid header but truncated/corrupt payload, preserving existing image intact", async () => {
    const sedeBefore = await Sucursal.findByPk(testSede.id);
    const existingKey = sedeBefore.imagen_key;
    expect(existingKey).toBeDefined();

    const presignRes = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/png" });

    const { uploadToken, tempKey } = presignRes.body.data;

    // Generar PNG con cabecera válida pero truncado abruptamente en los bloques IDAT
    const fullPng = await createRealPng(400, 400);
    const corruptPayloadWithValidHeader = fullPng.subarray(0, 80);

    mockStorage.set(tempKey, {
      body: corruptPayloadWithValidHeader,
      contentType: "image/png",
    });

    const confirmRes = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ uploadToken, tempKey });

    expect(confirmRes.status).toBe(400);
    expect(confirmRes.body.code).toBe("INVALID_IMAGE_FILE");

    // Verificar que la base de datos y S3 conservan intacta la imagen anterior
    const sedeAfter = await Sucursal.findByPk(testSede.id);
    expect(sedeAfter.imagen_key).toBe(existingKey);
    expect(mockStorage.has(existingKey)).toBe(true);
    // Y el archivo temporal corrupto fue descartado
    expect(mockStorage.has(tempKey)).toBe(false);
  });

  it("6. Persistent Idempotence: handles repeated calls across restarts and prevents old retry from overwriting replacement", async () => {
    // Subida inicial: Imagen A
    const presignA = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/png" });

    const tokenA = presignA.body.data.uploadToken;
    const tempKeyA = presignA.body.data.tempKey;
    const pngA = await createRealPng(500, 500);
    mockStorage.set(tempKeyA, { body: pngA, contentType: "image/png" });

    // Confirmar Imagen A
    const resA1 = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ uploadToken: tokenA, tempKey: tempKeyA });

    expect(resA1.status).toBe(200);
    const keyImageA = resA1.body.data.imagen_key;
    expect(keyImageA).toBeDefined();

    // 1. Simular reinicio completo del backend vaciando la memoria
    clearConfirmedTokensCache();

    // Reintento con Token A tras el reinicio: debe responder 200 usando la garantía persistente de la BD
    const resA2 = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ uploadToken: tokenA, tempKey: tempKeyA });

    expect(resA2.status).toBe(200);
    expect(resA2.body.data.imagen_key).toBe(keyImageA);

    // 2. Reemplazo posterior: Imagen B
    const presignB = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/png" });

    const tokenB = presignB.body.data.uploadToken;
    const tempKeyB = presignB.body.data.tempKey;
    const pngB = await createRealPng(600, 600);
    mockStorage.set(tempKeyB, { body: pngB, contentType: "image/png" });

    const resB = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ uploadToken: tokenB, tempKey: tempKeyB });

    expect(resB.status).toBe(200);
    const keyImageB = resB.body.data.imagen_key;
    expect(keyImageB).not.toBe(keyImageA);

    // 3. Simular reinicio del backend nuevamente
    clearConfirmedTokensCache();

    // 4. Llega un reintento antiguo tardío con el Token A:
    // NO debe restaurar la Imagen A; debe retornar la sede con la Imagen B (vigente)
    const resOldRetry = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ uploadToken: tokenA, tempKey: tempKeyA });

    expect(resOldRetry.status).toBe(200);
    expect(resOldRetry.body.data.imagen_key).toBe(keyImageB);

    const sedeInDb = await Sucursal.findByPk(testSede.id);
    expect(sedeInDb.imagen_key).toBe(keyImageB);
  });

  it("7. Concurrent replacements never delete the finally referenced active image", async () => {
    const presign1 = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/png" });

    const presign2 = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/png" });

    const buf1 = await createRealPng(350, 350);
    const buf2 = await createRealPng(380, 380);

    mockStorage.set(presign1.body.data.tempKey, { body: buf1, contentType: "image/png" });
    mockStorage.set(presign2.body.data.tempKey, { body: buf2, contentType: "image/png" });

    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          uploadToken: presign1.body.data.uploadToken,
          tempKey: presign1.body.data.tempKey,
        }),
      request(app)
        .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          uploadToken: presign2.body.data.uploadToken,
          tempKey: presign2.body.data.tempKey,
        }),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const sedeAfter = await Sucursal.findByPk(testSede.id);
    const finalActiveKey = sedeAfter.imagen_key;
    expect([res1.body.data.imagen_key, res2.body.data.imagen_key]).toContain(finalActiveKey);

    // La clave activa persistida en la BD bajo ninguna circunstancia debe haber sido eliminada de S3
    expect(mockStorage.has(finalActiveKey)).toBe(true);
  });

  it("8. Resilient cleanup: failure to delete S3 objects does not fail the save operation", async () => {
    const presignRes = await request(app)
      .post(`/api/sucursales/${testSede.id}/imagen-presign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/png" });

    const { uploadToken, tempKey } = presignRes.body.data;
    const buf = await createRealPng(450, 450);
    mockStorage.set(tempKey, { body: buf, contentType: "image/png" });

    // Simulamos fallo en DeleteObjectCommand durante la limpieza
    shouldFailDelete = true;
    try {
      const confirmRes = await request(app)
        .post(`/api/sucursales/${testSede.id}/imagen-confirmar`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ uploadToken, tempKey });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.status).toBe("success");
      expect(confirmRes.body.data.imagen_key).toBeDefined();
    } finally {
      shouldFailDelete = false;
    }
  });

  it("9. Dynamic credits attribution: only binds to official known asset key", async () => {
    // Caso A: Sede con imagen de Atitlán oficial
    const atitlanSede = await Sucursal.create({
      nombre: "Sede Atitlán Creditos Test",
      ciudad: "Sololá",
      direccion: "Panajachel",
      activa: true,
      imagen_key: "sedes/2/portada_1792961997929_90ce1baa6953.webp",
    });

    try {
      const resAtitlan = await request(app).get(`/api/sucursales/${atitlanSede.id}`);
      expect(resAtitlan.status).toBe(200);
      expect(resAtitlan.body.data.imagen_creditos).toBe("Chad Davis (CC BY 2.0)");
      expect(resAtitlan.body.data.imagen_expires_at).toBeDefined();

      // Caso B: Imagen reemplazada con una nueva clave
      const presignRes = await request(app)
        .post(`/api/sucursales/${atitlanSede.id}/imagen-presign`)
        .set("Authorization", `Bearer ${adminToken}`)
      .send({ contentType: "image/png" });

      const { uploadToken, tempKey } = presignRes.body.data;
      const newPng = await createRealPng(300, 300);
      mockStorage.set(tempKey, { body: newPng, contentType: "image/png" });

      const confirmRes = await request(app)
        .post(`/api/sucursales/${atitlanSede.id}/imagen-confirmar`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ uploadToken, tempKey });

      expect(confirmRes.status).toBe(200);
      // Tras el reemplazo, el crédito dinámico ya no es Chad Davis
      expect(confirmRes.body.data.imagen_creditos).toBeNull();
    } finally {
      await atitlanSede.destroy().catch(() => {});
    }
  });

  it("10. Removes main image and cleans unreferenced file", async () => {
    const sedeBefore = await Sucursal.findByPk(testSede.id);
    const activeKey = sedeBefore.imagen_key;
    expect(activeKey).toBeDefined();

    const deleteRes = await request(app)
      .delete(`/api/sucursales/${testSede.id}/imagen`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.imagen_key).toBeNull();
    expect(deleteRes.body.data.imagen_url).toBeNull();
    expect(deleteRes.body.data.imagen_expires_at).toBeNull();

    expect(mockStorage.has(activeKey)).toBe(false);

    const sedeAfter = await Sucursal.findByPk(testSede.id);
    expect(sedeAfter.imagen_key).toBeNull();
  });
});
