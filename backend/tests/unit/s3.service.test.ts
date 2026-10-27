import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import {
  isAllowedKey,
  isCloudFrontEligibleKey,
  buildCloudFrontUrl,
  getPresignedReadUrl,
  getPresignedUploadUrl,
  deleteStorageObject,
  getBrandingUrls,
  resolveMediaUrlWithExpiry,
  BRANDING_KEYS,
  ALLOWED_STORAGE_PREFIXES,
  CLOUDFRONT_PUBLIC_PREFIXES,
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
});

describe("CloudFront Prefix Eligibility & URL Construction", () => {
  it("authorizes only public production prefixes for CloudFront", () => {
    expect(isCloudFrontEligibleKey("branding/logos/hotel-hunahpu-logo-horizontal-color.svg")).toBe(true);
    expect(isCloudFrontEligibleKey("branding/inicio/hero-portada.webp")).toBe(true);
    expect(isCloudFrontEligibleKey("sedes/hotel-hunahpu-atitlan/portada/portada-1.webp")).toBe(true);
    expect(isCloudFrontEligibleKey("sedes/hotel-hunahpu-antigua/portada/portada-1.webp")).toBe(true);
    expect(isCloudFrontEligibleKey("sedes/hotel-hunahpu-xela/portada/portada-1.webp")).toBe(true);
    expect(isCloudFrontEligibleKey("sedes/hotel-hunahpu-capital/portada/portada-1.webp")).toBe(true);
    expect(isCloudFrontEligibleKey("sedes/general/tipos-habitacion/tipo-1.webp")).toBe(true);

    // Temp folders and non-matching prefixes must be ineligible for CloudFront
    expect(isCloudFrontEligibleKey("branding/temp/upload-token-123.svg")).toBe(false);
    expect(isCloudFrontEligibleKey("sedes/temp/upload-token-456.jpg")).toBe(false);
    expect(isCloudFrontEligibleKey("sedes/privado/documento.pdf")).toBe(false);
    expect(isCloudFrontEligibleKey("facturas/invoice-1.pdf")).toBe(false);
  });

  it("builds properly encoded CloudFront URLs from base URL and S3 keys", () => {
    const baseUrl = "https://dy6alx8uozfo3.cloudfront.net";
    const key = "sedes/hotel-hunahpu-atitlan/portada/portada 1+test.webp";
    const built = buildCloudFrontUrl(baseUrl, key);

    expect(built).toBe("https://dy6alx8uozfo3.cloudfront.net/sedes/hotel-hunahpu-atitlan/portada/portada%201%2Btest.webp");
  });

  it("resolves CloudFront URLs with null expiresAt for eligible public assets", async () => {
    const key = "sedes/hotel-hunahpu-atitlan/portada/portada-1792961997929-90ce1baa6953.webp";
    const result = await resolveMediaUrlWithExpiry(key);

    expect(result.url).toBe("https://dy6alx8uozfo3.cloudfront.net/sedes/hotel-hunahpu-atitlan/portada/portada-1792961997929-90ce1baa6953.webp");
    expect(result.expiresAt).toBeNull();
  });

  it("protects temporary and non-public keys by returning null URL and null expiresAt", async () => {
    const tempKey = "sedes/temp/test-upload-token.jpg";
    const result = await resolveMediaUrlWithExpiry(tempKey, 3600);

    expect(result.url).toBeNull();
    expect(result.expiresAt).toBeNull();

    const brandingTemp = await resolveMediaUrlWithExpiry("branding/temp/upload-token.svg", 3600);
    expect(brandingTemp.url).toBeNull();
    expect(brandingTemp.expiresAt).toBeNull();

    const invalid = await resolveMediaUrlWithExpiry("facturas/invoice-1.pdf", 3600);
    expect(invalid.url).toBeNull();
    expect(invalid.expiresAt).toBeNull();
  });

  it("resolves branding URLs using CloudFront with null expiresAt", async () => {
    const branding = await getBrandingUrls(3600);

    expect(branding).toBeDefined();
    expect(branding.logoHorizontalColor).toContain("dy6alx8uozfo3.cloudfront.net/branding/logos/");
    expect(branding.logoHorizontalBlanco).toContain("dy6alx8uozfo3.cloudfront.net/branding/logos/");
    expect(branding.isotipoColor).toContain("dy6alx8uozfo3.cloudfront.net/branding/logos/");
    expect(branding.expiresAt).toBeNull();
  });

  it("responds 200 OK from public endpoint GET /api/media/branding with CloudFront URLs", async () => {
    const res = await request(app).get("/api/media/branding");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.logoHorizontalColor).toContain("dy6alx8uozfo3.cloudfront.net/branding/logos/");
    expect(res.body.data.expiresAt).toBeNull();
  });
});
