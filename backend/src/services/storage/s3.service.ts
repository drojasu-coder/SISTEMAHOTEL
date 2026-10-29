import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

export const ALLOWED_STORAGE_PREFIXES = ["branding/", "sedes/"] as const;

export const CLOUDFRONT_PUBLIC_PREFIXES = [
  "branding/logos/",
  "branding/inicio/",
  "sedes/hotel-hunahpu-antigua/",
  "sedes/hotel-hunahpu-atitlan/",
  "sedes/hotel-hunahpu-xela/",
  "sedes/hotel-hunahpu-capital/",
  "sedes/general/",
] as const;

export const BRANDING_KEYS = {
  logoHorizontalColor: "branding/logos/hotel-hunahpu-logo-horizontal-color.svg",
  logoHorizontalBlanco: "branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg",
  isotipoColor: "branding/logos/hotel-hunahpu-isotipo-color.svg",
} as const;

export type BrandingVariant = keyof typeof BRANDING_KEYS;

export interface BrandingUrls {
  logoHorizontalColor: string;
  logoHorizontalBlanco: string;
  isotipoColor: string;
  expiresAt: string | null;
}

/**
 * Valida que una clave pertenezca estrictamente a los prefijos autorizados en IAM.
 * Evita ataques de path traversal y uso no autorizado del servicio.
 */
export function isAllowedKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  const normalized = key.trim();
  if (
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    normalized.startsWith("\\")
  ) {
    return false;
  }
  return ALLOWED_STORAGE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Determina si una clave S3 es apta para lectura pública mediante CloudFront.
 * Cumple estrictamente con la política de lectura de la distribución CloudFront para evitar
 * exponer carpetas temporales (sedes/temp, branding/temp) o archivos privados.
 */
export function isCloudFrontEligibleKey(key: string): boolean {
  if (!isAllowedKey(key)) return false;
  const normalized = key.trim();
  return CLOUDFRONT_PUBLIC_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Construye la URL pública de CloudFront a partir de la URL base y la clave S3,
 * codificando cada segmento de la ruta.
 */
export function buildCloudFrontUrl(baseUrl: string, key: string): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, "");
  const cleanKey = key.trim().replace(/^\/+/, "");
  const encodedPath = cleanKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${cleanBase}/${encodedPath}`;
}

// Configuración opcional del perfil local para la cadena de credenciales del SDK
if (env.AWS_PROFILE && !process.env.AWS_PROFILE) {
  process.env.AWS_PROFILE = env.AWS_PROFILE;
}

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: env.AWS_REGION,
    });
  }
  return s3ClientInstance;
}

export function setS3Client(client: S3Client | null): void {
  s3ClientInstance = client;
}

/**
 * Genera una URL prefirmada GET de lectura temporal para un objeto con clave autorizada.
 */
export async function getPresignedReadUrl(
  key: string,
  expiresInSeconds = 3600,
  client: S3Client = getS3Client(),
): Promise<string> {
  if (!isAllowedKey(key)) {
    throw new AppError(
      400,
      "INVALID_STORAGE_KEY",
      `La clave solicitada no está permitida. Solo se autorizan prefijos: ${ALLOWED_STORAGE_PREFIXES.join(", ")}`,
    );
  }

  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Genera una URL prefirmada PUT de carga temporal para un objeto con clave autorizada.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900,
  client: S3Client = getS3Client(),
): Promise<string> {
  if (!isAllowedKey(key)) {
    throw new AppError(
      400,
      "INVALID_STORAGE_KEY",
      `La clave solicitada no está permitida. Solo se autorizan prefijos: ${ALLOWED_STORAGE_PREFIXES.join(", ")}`,
    );
  }

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Descarga los bytes de un objeto desde S3.
 */
export async function getStorageObject(
  key: string,
  client: S3Client = getS3Client(),
): Promise<Buffer> {
  if (!isAllowedKey(key)) {
    throw new AppError(
      400,
      "INVALID_STORAGE_KEY",
      `La clave solicitada no está permitida. Solo se autorizan prefijos: ${ALLOWED_STORAGE_PREFIXES.join(", ")}`,
    );
  }

  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });

  const response = await client.send(command);
  if (!response.Body) {
    throw new AppError(500, "STORAGE_ERROR", "Respuesta vacía desde el almacenamiento");
  }

  const byteArray = await (response.Body as any).transformToByteArray();
  return Buffer.from(byteArray);
}

/**
 * Publica un objeto de almacenamiento validado en S3 con cabecera Cache-Control inmutable.
 */
export async function putStorageObject(
  key: string,
  body: Buffer,
  contentType: string,
  client: S3Client = getS3Client(),
): Promise<void> {
  if (!isAllowedKey(key)) {
    throw new AppError(
      400,
      "INVALID_STORAGE_KEY",
      `La clave solicitada no está permitida. Solo se autorizan prefijos: ${ALLOWED_STORAGE_PREFIXES.join(", ")}`,
    );
  }

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await client.send(command);
}

/**
 * Elimina un objeto de S3 perteneciente a los prefijos autorizados.
 */
export async function deleteStorageObject(
  key: string,
  client: S3Client = getS3Client(),
): Promise<void> {
  if (!isAllowedKey(key)) {
    throw new AppError(
      400,
      "INVALID_STORAGE_KEY",
      `La clave solicitada no está permitida. Solo se autorizan prefijos: ${ALLOWED_STORAGE_PREFIXES.join(", ")}`,
    );
  }

  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });

  await client.send(command);
}

/**
 * Medios definitivos de una sede creada desde la administración (sedes/<slug>/...),
 * fuera de las carpetas fijas que publica la distribución de CloudFront. Nunca
 * incluye las carpetas temporales de subida.
 */
const TEMP_STORAGE_PREFIXES = ["sedes/temp/", "branding/temp/"] as const;

export function isPrivateSedeMediaKey(key: string): boolean {
  if (!isAllowedKey(key)) return false;
  const normalized = key.trim();
  return normalized.startsWith("sedes/") && !TEMP_STORAGE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Resuelve la URL de lectura y su fecha de expiración ISO para un objeto de almacenamiento público.
 * - Claves temporales (branding/temp, sedes/temp) o no autorizadas nunca se entregan (devuelve null).
 * - Claves de CLOUDFRONT_PUBLIC_PREFIXES con CloudFront configurado: URL de CloudFront (expiresAt = null).
 * - Si CloudFront no está configurado, o la clave pertenece a una sede nueva cuya carpeta no
 *   publica la distribución: URL prefirmada de S3 con fecha de expiración (el bucket sigue privado).
 */
export async function resolveMediaUrlWithExpiry(
  key: string | null | undefined,
  expiresInSeconds = 3600,
  client: S3Client = getS3Client(),
): Promise<{ url: string | null; expiresAt: string | null }> {
  if (!key) return { url: null, expiresAt: null };
  const cloudFrontEligible = isCloudFrontEligibleKey(key);
  if (!cloudFrontEligible && !isPrivateSedeMediaKey(key)) {
    return { url: null, expiresAt: null };
  }

  const cloudfrontBase = env.CLOUDFRONT_BASE_URL || process.env.CLOUDFRONT_BASE_URL;
  if (cloudfrontBase && cloudFrontEligible) {
    return {
      url: buildCloudFrontUrl(cloudfrontBase, key),
      expiresAt: null,
    };
  }

  const url = await getPresignedReadUrl(key, expiresInSeconds, client);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  return { url, expiresAt };
}

/**
 * Resuelve la URL de lectura para un objeto de almacenamiento.
 * Usa CloudFront si está configurado y la clave es pública; en caso contrario,
 * resuelve mediante URL prefirmada de S3.
 */
export async function resolveMediaUrl(
  key: string | null | undefined,
  expiresInSeconds = 3600,
  client: S3Client = getS3Client(),
): Promise<string | null> {
  const result = await resolveMediaUrlWithExpiry(key, expiresInSeconds, client);
  return result.url;
}

/**
 * Obtiene el mapa completo de URLs de lectura para la identidad visual del hotel.
 * Utiliza CloudFront (expiresAt = null) si está configurado, o URLs prefirmadas de S3.
 */
export async function getBrandingUrls(
  expiresInSeconds = 3600,
  client: S3Client = getS3Client(),
): Promise<BrandingUrls> {
  let activeKeys = {
    logoHorizontalColor: BRANDING_KEYS.logoHorizontalColor as string,
    logoHorizontalBlanco: BRANDING_KEYS.logoHorizontalBlanco as string,
    isotipoColor: BRANDING_KEYS.isotipoColor as string,
  };

  try {
    const db = require("../../models");
    if (db.PaginaInicio) {
      const record = await db.PaginaInicio.findByPk(1);
      if (record) {
        if (record.logo_horizontal_color_key) activeKeys.logoHorizontalColor = record.logo_horizontal_color_key;
        if (record.logo_horizontal_blanco_key) activeKeys.logoHorizontalBlanco = record.logo_horizontal_blanco_key;
        if (record.isotipo_color_key) activeKeys.isotipoColor = record.isotipo_color_key;
      }
    }
  } catch {
    // Si la BD no está disponible o las columnas no existen, se usan los BRANDING_KEYS por defecto
  }

  const [logoHorizontalColor, logoHorizontalBlanco, isotipoColor] =
    await Promise.all([
      resolveMediaUrlWithExpiry(activeKeys.logoHorizontalColor, expiresInSeconds, client),
      resolveMediaUrlWithExpiry(activeKeys.logoHorizontalBlanco, expiresInSeconds, client),
      resolveMediaUrlWithExpiry(activeKeys.isotipoColor, expiresInSeconds, client),
    ]);

  return {
    logoHorizontalColor: logoHorizontalColor.url || "",
    logoHorizontalBlanco: logoHorizontalBlanco.url || "",
    isotipoColor: isotipoColor.url || "",
    expiresAt: logoHorizontalColor.expiresAt,
  };
}
