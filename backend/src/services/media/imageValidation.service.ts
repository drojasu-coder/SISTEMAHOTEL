import sharp, { Metadata } from "sharp";
import { AppError } from "../../utils/AppError";

export interface ProcessedImage {
  buffer: Buffer;
  format: "jpeg" | "png" | "webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
  width: number;
  height: number;
  sizeBytes: number;
}

export type ImageMetadata = ProcessedImage;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB
export const MIN_DIMENSION = 200; // px
export const MAX_DIMENSION = 8000; // px
export const MAX_INPUT_PIXELS = 40_000_000; // 40 megapixeles (protección contra decompression bombs)

/**
 * Decodifica completamente los datos ráster de la imagen con sharp/libvips.
 * Inspecciona bytes reales, dimensiones, límites de memoria y píxeles.
 * Re-emite un buffer higienizado garantizando que la salida corresponde exactamente
 * con el formato y Content-Type detectados, descartando metadatos o fragmentos corruptos.
 */
export async function validateAndProcessImage(buffer: Buffer): Promise<ProcessedImage> {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new AppError(400, "INVALID_IMAGE_FILE", "El archivo de imagen no es válido o está vacío");
  }

  const sizeBytes = buffer.length;

  if (sizeBytes === 0) {
    throw new AppError(400, "INVALID_IMAGE_FILE", "El archivo de imagen está vacío");
  }

  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError(
      400,
      "IMAGE_SIZE_EXCEEDED",
      `El tamaño de la imagen (${(sizeBytes / (1024 * 1024)).toFixed(2)} MiB) excede el límite máximo permitido de 5 MiB`,
    );
  }

  let meta: Metadata;
  try {
    const pipeline = sharp(buffer, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    });
    meta = await pipeline.metadata();
  } catch (_err) {
    throw new AppError(
      400,
      "INVALID_IMAGE_FILE",
      "Formato de archivo no soportado o archivo corrupto. Solo se admiten imágenes válidas JPEG, PNG o WebP.",
    );
  }

  const format = meta.format;
  if (format !== "jpeg" && format !== "png" && format !== "webp") {
    throw new AppError(
      400,
      "INVALID_IMAGE_FILE",
      `Formato de imagen "${format || "desconocido"}" no soportado. Solo se admiten JPEG, PNG o WebP.`,
    );
  }

  const width = meta.width;
  const height = meta.height;

  if (!width || !height || width <= 0 || height <= 0) {
    throw new AppError(
      400,
      "INVALID_IMAGE_DIMENSIONS",
      "No se pudieron determinar dimensiones válidas para la imagen",
    );
  }

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new AppError(
      400,
      "INVALID_IMAGE_DIMENSIONS",
      `Las dimensiones de la imagen (${width}x${height} px) son inferiores al mínimo permitido de ${MIN_DIMENSION}x${MIN_DIMENSION} px`,
    );
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new AppError(
      400,
      "INVALID_IMAGE_DIMENSIONS",
      `Las dimensiones de la imagen (${width}x${height} px) exceden el límite máximo de ${MAX_DIMENSION}x${MAX_DIMENSION} px`,
    );
  }

  const totalPixels = width * height;
  if (totalPixels > MAX_INPUT_PIXELS) {
    throw new AppError(
      400,
      "IMAGE_PIXEL_LIMIT_EXCEEDED",
      `El número total de píxeles (${totalPixels}) excede el límite seguro de ${MAX_INPUT_PIXELS} píxeles`,
    );
  }

  // Decodificación y rasterización completa para asegurar integridad total del contenido
  let sanitizedBuffer: Buffer;
  try {
    const processor = sharp(buffer, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    });

    if (format === "jpeg") {
      sanitizedBuffer = await processor.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    } else if (format === "png") {
      sanitizedBuffer = await processor.png({ compressionLevel: 8 }).toBuffer();
    } else {
      sanitizedBuffer = await processor.webp({ quality: 85, effort: 4 }).toBuffer();
    }
  } catch (_err) {
    throw new AppError(
      400,
      "INVALID_IMAGE_FILE",
      "El archivo contiene una cabecera que parece válida pero sus datos de imagen están truncados o corruptos.",
    );
  }

  const mimeMap: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  const extMap: Record<string, "jpg" | "png" | "webp"> = {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
  };

  return {
    buffer: sanitizedBuffer,
    format,
    mimeType: mimeMap[format],
    extension: extMap[format],
    width,
    height,
    sizeBytes: sanitizedBuffer.length,
  };
}

/**
 * Alias retrocompatible que ejecuta la validación y decodificación completa.
 */
export const validateImageBuffer = validateAndProcessImage;
