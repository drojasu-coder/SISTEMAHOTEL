import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import {
  isAllowedKey,
  getPresignedReadUrl,
  getPresignedUploadUrl,
  deleteStorageObject,
  getBrandingUrls,
  BRANDING_KEYS,
  ALLOWED_STORAGE_PREFIXES,
} from "../../src/services/storage/s3.service";
import { AppError } from "../../src/utils/AppError";

describe("S3 Storage Service & Allowed Prefixes", () => {
  it("allows only keys starting with authorized prefixes (branding/ and sedes/)", () => {
    expect(isAllowedKey("branding/logos/hotel-hunahpu-logo-horizontal-color.svg")).toBe(true);
    expect(isAllowedKey("branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg")).toBe(true);
    expect(isAllowedKey("sedes/sede-antigua.jpg")).toBe(true);

    // Forbidden prefixes or domains outside IAM scope
    expect(isAllowedKey("habitaciones/room-101.jpg")).toBe(false);
    expect(isAllowedKey("usuarios/avatar.png")).toBe(false);
    expect(isAllowedKey("facturas/invoice-1.pdf")).toBe(false);
    expect(isAllowedKey("")).toBe(false);
    expect(isAllowedKey(null as unknown as string)).toBe(false);
    expect(isAllowedKey(undefined as unknown as string)).toBe(false);
  });

  it("blocks path traversal and malicious absolute keys", () => {
    expect(isAllowedKey("branding/../etc/passwd")).toBe(false);
    expect(isAllowedKey("/branding/logos/logo.jpg")).toBe(false);
    expect(isAllowedKey("\\branding\\logos\\logo.jpg")).toBe(false);
    expect(isAllowedKey("sedes/../../secret")).toBe(false);
  });

  it("rejects unauthorized keys with AppError in storage operations", async () => {
    await expect(getPresignedReadUrl("unauthorized/file.jpg")).rejects.toThrow(AppError);
    await expect(getPresignedReadUrl("unauthorized/file.jpg")).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_STORAGE_KEY",
    });

    await expect(
      getPresignedUploadUrl("unauthorized/file.jpg", "image/jpeg"),
    ).rejects.toThrow(AppError);

    await expect(deleteStorageObject("unauthorized/file.jpg")).rejects.toThrow(
      AppError,
    );
  });

  it("resolves presigned branding URLs using explicit key map", async () => {
    const branding = await getBrandingUrls(3600);

    expect(branding).toBeDefined();
    expect(branding.logoHorizontalColor).toContain("hotel-hunahpu-logo-horizontal-color.svg");
    expect(branding.logoHorizontalBlanco).toContain("hotel-hunahpu-logo-horizontal-blanco.svg");
    expect(branding.isotipoColor).toContain("hotel-hunahpu-isotipo-color.svg");

    // URLs must be presigned with AWS query params (X-Amz-Signature or similar)
    expect(branding.logoHorizontalColor).toContain("X-Amz-Algorithm");
    expect(branding.logoHorizontalBlanco).toContain("X-Amz-Algorithm");
    expect(branding.isotipoColor).toContain("X-Amz-Algorithm");

    // Expiration timestamp must be a valid future ISO string
    expect(new Date(branding.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("responds 200 OK from public endpoint GET /api/media/branding without authentication", async () => {
    const res = await request(app).get("/api/media/branding");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.logoHorizontalColor).toContain("hotel-hunahpu-logo-horizontal-color.svg");
    expect(res.body.data.logoHorizontalBlanco).toContain("hotel-hunahpu-logo-horizontal-blanco.svg");
    expect(res.body.data.isotipoColor).toContain("hotel-hunahpu-isotipo-color.svg");
    expect(res.body.data.expiresAt).toBeDefined();
  });
});
