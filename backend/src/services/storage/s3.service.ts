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
  expiresAt: string;
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
 * Publica un objeto de almacenamiento validado en S3.
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
 * Resuelve la URL de lectura y su fecha de expiración ISO para un objeto de almacenamiento.
 * Soporta CloudFront (expiresAt = null) y URLs prefirmadas de S3.
 */
export async function resolveMediaUrlWithExpiry(
  key: string | null | undefined,
  expiresInSeconds = 3600,
  client: S3Client = getS3Client(),
): Promise<{ url: string | null; expiresAt: string | null }> {
  if (!key) return { url: null, expiresAt: null };
  const cloudfrontBase = process.env.CLOUDFRONT_BASE_URL || (env as any).CLOUDFRONT_BASE_URL;
  if (cloudfrontBase) {
    const cleanBase = cloudfrontBase.replace(/\/+$/, "");
    const cleanKey = key.replace(/^\/+/, "");
    return { url: `${cleanBase}/${cleanKey}`, expiresAt: null };
  }
  const url = await getPresignedReadUrl(key, expiresInSeconds, client);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  return { url, expiresAt };
}

/**
 * Resuelve la URL de lectura para un objeto de almacenamiento.
 * Soporta CloudFront futuro mediante variable de entorno CLOUDFRONT_BASE_URL.
 * Si CloudFront no está configurado, resuelve mediante URL prefirmada de S3.
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
 * Obtiene el mapa completo de URLs prefirmadas de lectura para la identidad visual del hotel.
 */
export async function getBrandingUrls(
  expiresInSeconds = 3600,
  client: S3Client = getS3Client(),
): Promise<BrandingUrls> {
  const [logoHorizontalColor, logoHorizontalBlanco, isotipoColor] =
    await Promise.all([
      getPresignedReadUrl(BRANDING_KEYS.logoHorizontalColor, expiresInSeconds, client),
      getPresignedReadUrl(BRANDING_KEYS.logoHorizontalBlanco, expiresInSeconds, client),
      getPresignedReadUrl(BRANDING_KEYS.isotipoColor, expiresInSeconds, client),
    ]);

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return {
    logoHorizontalColor,
    logoHorizontalBlanco,
    isotipoColor,
    expiresAt,
  };
}
