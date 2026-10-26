import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  validateAndProcessImage,
  MAX_IMAGE_SIZE_BYTES,
  MIN_DIMENSION,
  MAX_DIMENSION,
} from "../../src/services/media/imageValidation.service";
import { AppError } from "../../src/utils/AppError";

describe("Image Validation & Full Raster Decoding Service (sharp / libvips)", () => {
  async function createValidPng(width = 300, height = 300): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 50, g: 120, b: 200 },
      },
    })
      .png()
      .toBuffer();
  }

  async function createValidJpeg(width = 300, height = 300): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 200, g: 100, b: 50 },
      },
    })
      .jpeg()
      .toBuffer();
  }

  async function createValidWebp(width = 300, height = 300): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 100, g: 200, b: 100 },
      },
    })
      .webp()
      .toBuffer();
  }

  it("decodes and sanitizes full raster data of valid PNG", async () => {
    const png = await createValidPng(400, 300);
    const result = await validateAndProcessImage(png);
    expect(result.format).toBe("png");
    expect(result.mimeType).toBe("image/png");
    expect(result.extension).toBe("png");
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it("decodes and sanitizes full raster data of valid JPEG", async () => {
    const jpeg = await createValidJpeg(500, 400);
    const result = await validateAndProcessImage(jpeg);
    expect(result.format).toBe("jpeg");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.extension).toBe("jpg");
    expect(result.width).toBe(500);
    expect(result.height).toBe(400);
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it("decodes and sanitizes full raster data of valid WebP", async () => {
    const webp = await createValidWebp(600, 450);
    const result = await validateAndProcessImage(webp);
    expect(result.format).toBe("webp");
    expect(result.mimeType).toBe("image/webp");
    expect(result.extension).toBe("webp");
    expect(result.width).toBe(600);
    expect(result.height).toBe(450);
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it("RECHAZA archivo con cabecera válida pero con contenido ráster truncado o corrupto", async () => {
    const fullPng = await createValidPng(400, 400);
    // Verificamos que el buffer completo tiene más de 1000 bytes
    expect(fullPng.length).toBeGreaterThan(500);

    // Truncamos a 80 bytes: contiene los magic bytes de PNG y el bloque IHDR íntegro (400x400 px),
    // pero el bloque IDAT de datos comprimidos ha sido abruptamente cercenado.
    const truncatedWithValidHeader = fullPng.subarray(0, 80);

    // Un decodificador superficial solo de cabeceras lo aceptaría porque lee 400x400 px.
    // validateAndProcessImage decodifica el ráster completo y debe fallar.
    await expect(validateAndProcessImage(truncatedWithValidHeader)).rejects.toThrow(AppError);
    await expect(validateAndProcessImage(truncatedWithValidHeader)).rejects.toMatchObject({
      code: "INVALID_IMAGE_FILE",
    });
  });

  it("rechaza archivos con payloads arbitrarios que no son imágenes", async () => {
    const fakeHtml = Buffer.from("<html><body><h1>Not an image</h1></body></html>");
    await expect(validateAndProcessImage(fakeHtml)).rejects.toThrow(AppError);

    const fakePdf = Buffer.from("%PDF-1.4 simulated document body");
    await expect(validateAndProcessImage(fakePdf)).rejects.toThrow(AppError);
  });

  it("rechaza imágenes que exceden el límite máximo de 5 MiB", async () => {
    const hugeBuffer = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1024);
    await expect(validateAndProcessImage(hugeBuffer)).rejects.toThrow(AppError);
    await expect(validateAndProcessImage(hugeBuffer)).rejects.toMatchObject({
      code: "IMAGE_SIZE_EXCEEDED",
    });
  });

  it("rechaza dimensiones inferiores al mínimo requerido (200x200 px)", async () => {
    const smallPng = await createValidPng(150, 150);
    await expect(validateAndProcessImage(smallPng)).rejects.toThrow(AppError);
    await expect(validateAndProcessImage(smallPng)).rejects.toMatchObject({
      code: "INVALID_IMAGE_DIMENSIONS",
    });
  });

  it("rechaza buffers vacíos o no válidos", async () => {
    await expect(validateAndProcessImage(Buffer.alloc(0))).rejects.toThrow(AppError);
    await expect(validateAndProcessImage(null as unknown as Buffer)).rejects.toThrow(AppError);
  });
});
