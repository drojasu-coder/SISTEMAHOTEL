import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import * as s3Service from "./s3.service";
import { validateAndProcessImage, ProcessedImage } from "../media/imageValidation.service";
import { KNOWN_ASSET_CREDITS } from "./credits";

const db = require("../../models");

export const SEDE_ID_TO_SLUG: Record<number, string> = {
  1: "hotel-hunahpu-antigua",
  2: "hotel-hunahpu-atitlan",
  3: "hotel-hunahpu-xela",
  4: "hotel-hunahpu-capital",
};

export function resolveStorageSlug(sucursalId?: number | null): string {
  if (sucursalId && SEDE_ID_TO_SLUG[sucursalId]) {
    return SEDE_ID_TO_SLUG[sucursalId];
  }
  return "general";
}

export interface PresignImageOptions {
  entityType: string;
  entityId: number | string;
  contentType: string;
  fileName?: string | null;
  userId: number;
}

export interface PresignImageResult {
  uploadUrl: string;
  uploadToken: string;
  tempKey: string;
  expiresInSeconds: number;
}

export interface UploadTokenPayload {
  entityType: string;
  entityId: number | string;
  userId: number;
  tempKey: string;
  exp?: number;
}

/**
 * Valida un archivo SVG asegurando que sea XML/SVG válido y descartando
 * scripts incrustados, manejadores de eventos o elementos potencialmente maliciosos.
 */
export function validateAndProcessSvg(buffer: Buffer): {
  buffer: Buffer;
  format: "svg";
  mimeType: "image/svg+xml";
  extension: "svg";
  sizeBytes: number;
} {
  if (!buffer || buffer.length === 0) {
    throw new AppError(400, "INVALID_SVG_FILE", "El archivo SVG está vacío");
  }

  if (buffer.length > 2 * 1024 * 1024) {
    throw new AppError(
      400,
      "SVG_SIZE_EXCEEDED",
      "El archivo SVG supera el límite máximo permitido de 2 MiB",
    );
  }

  const text = buffer.toString("utf-8");
  if (!text.includes("<svg") || !text.includes("</svg>")) {
    throw new AppError(
      400,
      "INVALID_SVG_FILE",
      "El archivo no contiene un documento SVG válido",
    );
  }

  const forbiddenPatterns = [
    /<script\b[^>]*>/i,
    /<\/script>/i,
    /javascript:/i,
    /\bon\w+\s*=/i, // onload, onerror, onclick, etc.
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      throw new AppError(
        400,
        "MALICIOUS_SVG_DETECTED",
        "El archivo SVG contiene scripts o directivas ejecutables no permitidas",
      );
    }
  }

  return {
    buffer,
    format: "svg",
    mimeType: "image/svg+xml",
    extension: "svg",
    sizeBytes: buffer.length,
  };
}

/**
 * Cuenta cuántas referencias existen en la base de datos para una clave de S3 dada,
 * protegiendo los objetos compartidos de eliminaciones accidentales.
 */
export async function countKeyReferences(key: string | null | undefined): Promise<number> {
  if (!key) return 0;
  const {
    Sucursal,
    Habitacion,
    TipoHabitacion,
    Amenidad,
    Salon,
    RecursoActividad,
    ServicioBienestar,
  } = db;

  const [
    sucursalPortadas,
    sucursalRestaurantes,
    habitaciones,
    tipos,
    amenidades,
    salones,
    actividades,
    bienestar,
  ] = await Promise.all([
    Sucursal ? Sucursal.count({ where: { imagen_key: key } }).catch(() => 0) : 0,
    Sucursal ? Sucursal.count({ where: { restaurante_imagen_key: key } }).catch(() => 0) : 0,
    Habitacion ? Habitacion.count({ where: { imagen_key: key } }).catch(() => 0) : 0,
    TipoHabitacion ? TipoHabitacion.count({ where: { imagen_key: key } }).catch(() => 0) : 0,
    Amenidad ? Amenidad.count({ where: { imagen_key: key } }).catch(() => 0) : 0,
    Salon ? Salon.count({ where: { imagen_key: key } }).catch(() => 0) : 0,
    RecursoActividad ? RecursoActividad.count({ where: { imagen_key: key } }).catch(() => 0) : 0,
    ServicioBienestar ? ServicioBienestar.count({ where: { imagen_key: key } }).catch(() => 0) : 0,
  ]);

  return (
    Number(sucursalPortadas || 0) +
    Number(sucursalRestaurantes || 0) +
    Number(habitaciones || 0) +
    Number(tipos || 0) +
    Number(amenidades || 0) +
    Number(salones || 0) +
    Number(actividades || 0) +
    Number(bienestar || 0)
  );
}

/**
 * Elimina un objeto de S3 únicamente si no tiene ninguna referencia en la base de datos
 * y no forma parte de los activos fotográficos oficiales conocidos.
 */
export async function cleanStorageObjectIfUnreferenced(
  key: string | null | undefined,
): Promise<void> {
  if (!key || typeof key !== "string" || !key.startsWith("sedes/")) return;
  if (KNOWN_ASSET_CREDITS[key]) return; // Protege los activos del hotel predeterminados

  try {
    const refs = await countKeyReferences(key);
    if (refs === 0) {
      await s3Service.deleteStorageObject(key);
    }
  } catch (err) {
    console.warn(`[MediaUploadService] Advertencia al limpiar objeto huérfano ${key}:`, err);
  }
}

/**
 * Genera una URL prefirmada PUT para subida temporal directa a S3.
 */
export async function presignEntityUpload(
  opts: PresignImageOptions,
): Promise<PresignImageResult> {
  const allowedExtensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  };

  const ext = allowedExtensions[opts.contentType];
  if (!ext) {
    throw new AppError(
      400,
      "INVALID_CONTENT_TYPE",
      "Solo se admiten archivos image/jpeg, image/png, image/webp" +
        (opts.entityType === "branding" ? " o image/svg+xml" : ""),
    );
  }

  if (ext === "svg" && opts.entityType !== "branding") {
    throw new AppError(
      400,
      "SVG_NOT_ALLOWED",
      "Los archivos SVG solo están autorizados para la identidad corporativa (branding)",
    );
  }

  const randomPart = crypto.randomBytes(8).toString("hex");
  const tempKey = `sedes/temp/${opts.entityType}-${opts.entityId}_${opts.userId}_${Date.now()}_${randomPart}.${ext}`;
  const expiresInSeconds = 900; // 15 min

  const uploadToken = jwt.sign(
    {
      entityType: opts.entityType,
      entityId: opts.entityId,
      userId: opts.userId,
      tempKey,
    },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const uploadUrl = await s3Service.getPresignedUploadUrl(
    tempKey,
    opts.contentType,
    expiresInSeconds,
  );

  return {
    uploadUrl,
    uploadToken,
    tempKey,
    expiresInSeconds,
  };
}

export interface ConfirmEntityUploadOptions {
  entityType: string;
  entityId: number;
  userId: number;
  uploadToken: string;
  tempKey: string;
  Model: any;
  column?: string;
  buildFinalKey: (entity: any, ext: string) => string;
  serializeEntity: (entity: any) => Promise<any>;
  sedeId?: number | null;
}

/**
 * Confirma, valida el archivo con sharp o validador SVG, lo traslada a su ruta definitiva
 * y actualiza la entidad atómicamente con bloqueo de fila.
 */
export async function confirmEntityUpload(
  opts: ConfirmEntityUploadOptions,
): Promise<any> {
  const { ConfirmacionSubida, sequelize } = db;
  const column = opts.column || "imagen_key";

  // 1. Validar token criptográfico
  let decoded: UploadTokenPayload;
  try {
    decoded = jwt.verify(opts.uploadToken, env.JWT_SECRET) as UploadTokenPayload;
  } catch (_jwtErr) {
    throw new AppError(403, "INVALID_UPLOAD_TOKEN", "El ticket de subida es inválido o ha expirado");
  }

  if (
    decoded.entityType !== opts.entityType ||
    String(decoded.entityId) !== String(opts.entityId) ||
    decoded.tempKey !== opts.tempKey
  ) {
    throw new AppError(
      403,
      "UPLOAD_TOKEN_MISMATCH",
      "El ticket de subida no corresponde a la entidad o archivo temporal especificado",
    );
  }

  // 2. Garantía de idempotencia
  const tokenHash = crypto.createHash("sha256").update(opts.uploadToken).digest("hex");
  if (ConfirmacionSubida) {
    const existing = await ConfirmacionSubida.findOne({ where: { token_hash: tokenHash } });
    if (existing) {
      const current = await opts.Model.findByPk(opts.entityId);
      return opts.serializeEntity(current);
    }
  }

  // 3. Descargar archivo temporal de S3
  let rawBuffer: Buffer;
  try {
    rawBuffer = await s3Service.getStorageObject(opts.tempKey);
  } catch (_s3GetErr) {
    throw new AppError(
      400,
      "UPLOADED_FILE_NOT_FOUND",
      "No se encontró el archivo temporal en el almacenamiento. Asegúrese de completar la subida antes de confirmar.",
    );
  }

  // 4. Validar y procesar según el tipo
  let processedBuffer: Buffer;
  let finalExtension: string;
  let finalMimeType: string;

  if (opts.tempKey.endsWith(".svg")) {
    const validatedSvg = validateAndProcessSvg(rawBuffer);
    processedBuffer = validatedSvg.buffer;
    finalExtension = "svg";
    finalMimeType = "image/svg+xml";
  } else {
    try {
      const processed = await validateAndProcessImage(rawBuffer);
      processedBuffer = processed.buffer;
      finalExtension = processed.extension;
      finalMimeType = processed.mimeType;
    } catch (valErr) {
      await s3Service.deleteStorageObject(opts.tempKey).catch(() => {});
      throw valErr;
    }
  }

  // 5. Entidad actual para determinar ruta final
  const entity = await opts.Model.findByPk(opts.entityId);
  if (!entity) {
    await s3Service.deleteStorageObject(opts.tempKey).catch(() => {});
    throw new AppError(404, "ENTITY_NOT_FOUND", "La entidad no fue encontrada");
  }

  const finalKey = opts.buildFinalKey(entity, finalExtension);
  await s3Service.putStorageObject(finalKey, processedBuffer, finalMimeType);

  // 6. Transacción en base de datos con bloqueo pesimista
  const t = await sequelize.transaction();
  let previousKey: string | null = null;
  let updatedEntity: any;

  try {
    const lockedEntity = await opts.Model.findByPk(opts.entityId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!lockedEntity) {
      await t.rollback();
      throw new AppError(404, "ENTITY_NOT_FOUND", "La entidad no fue encontrada");
    }

    // Comprobación concurrente de token
    if (ConfirmacionSubida) {
      const race = await ConfirmacionSubida.findOne({
        where: { token_hash: tokenHash },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (race) {
        await t.rollback();
        return opts.serializeEntity(lockedEntity);
      }
    }

    previousKey = lockedEntity[column] || null;
    await lockedEntity.update({ [column]: finalKey }, { transaction: t });

    if (ConfirmacionSubida) {
      const resolvedSedeId =
        opts.sedeId !== undefined
          ? opts.sedeId
          : lockedEntity.sucursal_id || (opts.entityType === "sucursal" ? lockedEntity.id : null);

      await ConfirmacionSubida.create(
        {
          token_hash: tokenHash,
          sede_id: resolvedSedeId,
          temp_key: opts.tempKey,
          final_key: finalKey,
        },
        { transaction: t },
      );
    }

    await t.commit();
    updatedEntity = lockedEntity;
  } catch (err) {
    if (!t.finished) {
      await t.rollback().catch(() => {});
    }
    await s3Service.deleteStorageObject(finalKey).catch(() => {});
    throw err;
  }

  // 7. Limpieza de archivos temporales y antiguos
  await s3Service.deleteStorageObject(opts.tempKey).catch(() => {});

  if (previousKey && previousKey !== finalKey) {
    await cleanStorageObjectIfUnreferenced(previousKey);
  }

  return opts.serializeEntity(updatedEntity);
}

export interface RemoveEntityImageOptions {
  entityId: number;
  Model: any;
  column?: string;
  serializeEntity: (entity: any) => Promise<any>;
}

/**
 * Desvincula la imagen de la entidad y limpia el objeto en S3 si no está referenciado.
 */
export async function removeEntityImage(
  opts: RemoveEntityImageOptions,
): Promise<any> {
  const { sequelize } = db;
  const column = opts.column || "imagen_key";

  const t = await sequelize.transaction();
  let previousKey: string | null = null;
  let updatedEntity: any;

  try {
    const lockedEntity = await opts.Model.findByPk(opts.entityId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!lockedEntity) {
      await t.rollback();
      throw new AppError(404, "ENTITY_NOT_FOUND", "La entidad no fue encontrada");
    }

    previousKey = lockedEntity[column] || null;
    await lockedEntity.update({ [column]: null }, { transaction: t });
    await t.commit();
    updatedEntity = lockedEntity;
  } catch (err) {
    if (!t.finished) {
      await t.rollback().catch(() => {});
    }
    throw err;
  }

  if (previousKey) {
    await cleanStorageObjectIfUnreferenced(previousKey);
  }

  return opts.serializeEntity(updatedEntity);
}

export const BRANDING_VARIANT_MAP: Record<string, string> = {
  logoHorizontalColor: "logo-horizontal-color",
  "logo-horizontal-color": "logo-horizontal-color",
  logoHorizontalBlanco: "logo-horizontal-blanco",
  "logo-horizontal-blanco": "logo-horizontal-blanco",
  isotipoColor: "isotipo-color",
  "isotipo-color": "isotipo-color",
};

export const BRANDING_COLUMN_MAP: Record<string, string> = {
  "logo-horizontal-color": "logo_horizontal_color_key",
  "logo-horizontal-blanco": "logo_horizontal_blanco_key",
  "isotipo-color": "isotipo_color_key",
};

export async function requestBrandingUpload(variant: string, userId: number, contentType: string) {
  const canonical = BRANDING_VARIANT_MAP[variant];
  if (!canonical) {
    throw new AppError(400, "INVALID_BRANDING_VARIANT", "Variante de marca inválida");
  }
  return presignEntityUpload({
    entityType: "branding",
    entityId: canonical,
    contentType,
    userId,
  });
}

export async function confirmBrandingUpload(
  variant: string,
  userId: number,
  uploadToken: string,
  tempKey: string,
) {
  const canonical = BRANDING_VARIANT_MAP[variant];
  if (!canonical) {
    throw new AppError(400, "INVALID_BRANDING_VARIANT", "Variante de marca inválida");
  }

  const column = BRANDING_COLUMN_MAP[canonical];
  if (!column) {
    throw new AppError(400, "INVALID_BRANDING_VARIANT", "Variante de marca inválida");
  }

  if (!tempKey.startsWith("branding/temp/") && !tempKey.startsWith("sedes/temp/")) {
    throw new AppError(
      400,
      "INVALID_TEMP_KEY",
      "La clave temporal de marca debe pertenecer a branding/temp/",
    );
  }

  let decoded: UploadTokenPayload;
  try {
    decoded = jwt.verify(uploadToken, env.JWT_SECRET) as UploadTokenPayload;
  } catch {
    throw new AppError(403, "INVALID_UPLOAD_TOKEN", "El ticket de subida es inválido o ha expirado");
  }

  if (decoded.entityType !== "branding" || String(decoded.entityId) !== canonical || decoded.tempKey !== tempKey) {
    throw new AppError(403, "UPLOAD_TOKEN_MISMATCH", "El ticket de subida no corresponde a la variante solicitada");
  }

  let rawBuffer: Buffer;
  try {
    rawBuffer = await s3Service.getStorageObject(tempKey);
  } catch {
    throw new AppError(400, "UPLOADED_FILE_NOT_FOUND", "No se encontró el archivo temporal en el almacenamiento");
  }

  let processedBuffer: Buffer;
  let finalMime: string;
  let ext: string;

  if (tempKey.endsWith(".svg")) {
    const val = validateAndProcessSvg(rawBuffer);
    processedBuffer = val.buffer;
    finalMime = "image/svg+xml";
    ext = "svg";
  } else {
    try {
      const val = await validateAndProcessImage(rawBuffer);
      processedBuffer = val.buffer;
      finalMime = val.mimeType;
      ext = val.extension;
    } catch (valErr) {
      await s3Service.deleteStorageObject(tempKey).catch(() => {});
      throw valErr;
    }
  }

  // Genera clave versionada para permitir invalidación natural en CloudFront
  const timestamp = Date.now();
  const rand = crypto.randomBytes(6).toString("hex");
  const finalKey = `branding/logos/hotel-hunahpu-${canonical}-${timestamp}-${rand}.${ext}`;

  await s3Service.putStorageObject(finalKey, processedBuffer, finalMime);

  // Actualiza la referencia persistente en la tabla pagina_inicio
  const { PaginaInicio } = db;
  let previousKey: string | null = null;
  if (PaginaInicio) {
    let record = await PaginaInicio.findByPk(1);
    if (!record) {
      record = await PaginaInicio.create({ id: 1 });
    }
    previousKey = record[column] || null;
    await record.update({ [column]: finalKey });
  }

  // Elimina la clave previa si era una clave versionada anterior (protege los SVGs iniciales predeterminados)
  const defaultKeys = Object.values(s3Service.BRANDING_KEYS) as string[];
  if (previousKey && !defaultKeys.includes(previousKey)) {
    await s3Service.deleteStorageObject(previousKey).catch(() => {});
  }

  await s3Service.deleteStorageObject(tempKey).catch(() => {});

  return s3Service.getBrandingUrls();
}
