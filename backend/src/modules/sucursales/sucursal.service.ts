import * as crypto from "crypto";
import jwt from "jsonwebtoken";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import * as s3Service from "../../services/storage/s3.service";
import {
  validateAndProcessImage,
  ProcessedImage,
} from "../../services/media/imageValidation.service";
import {
  KNOWN_ASSET_CREDITS,
  getAssetCredits,
} from "../../services/storage/credits";

const db = require("../../models");
const { Sucursal, Habitacion, ConfirmacionSubida } = db;

export interface CreateSucursalData {
  nombre: string;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
}

export interface UpdateSucursalData {
  nombre?: string;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  activa?: boolean;
}

export interface PresignImageResult {
  uploadUrl: string;
  uploadToken: string;
  tempKey: string;
  expiresInSeconds: number;
}

export interface UploadTokenPayload {
  sedeId: number;
  userId: number;
  tempKey: string;
  exp?: number;
}

/**
 * Genera un identificador textual persistente (slug) para el almacenamiento de la sede.
 * Ejemplo: "Hotel Hunahpú Atitlán" -> "hotel-hunahpu-atitlan"
 */
export function getSedeStorageSlug(sede: { id: number; nombre?: string }): string {
  if (sede?.nombre) {
    let normalized = sede.nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (normalized.includes("hunapu")) {
      normalized = normalized.replace("hunapu", "hunahpu");
    }
    if (normalized) {
      return normalized;
    }
  }
  return `sede-${sede?.id || "unknown"}`;
}

export { KNOWN_ASSET_CREDITS };

/**
 * Cache en memoria de respuestas para optimización local en el proceso (TTL 15 min).
 */
const confirmedTokensCache = new Map<string, { result: any; timestamp: number }>();

/**
 * Deduplicación de promesas en vuelo para el mismo uploadToken en el proceso activo.
 */
const inFlightConfirmations = new Map<string, Promise<any>>();

function purgeExpiredTokens(): void {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [token, data] of confirmedTokensCache.entries()) {
    if (data.timestamp < cutoff) {
      confirmedTokensCache.delete(token);
    }
  }
}

/**
 * Limpia la caché interna de tokens confirmados (útil para simular reinicios en pruebas).
 */
export function clearConfirmedTokensCache(): void {
  confirmedTokensCache.clear();
  inFlightConfirmations.clear();
}

/**
 * Enriquece la sucursal agregando la URL de lectura resuelta, su fecha de expiración ISO
 * y los créditos fotográficos dinámicos vinculados a la portada y al restaurante.
 */
export async function serializeSucursal(sucursal: any): Promise<any> {
  if (!sucursal) return null;
  const plain = typeof sucursal.get === "function" ? sucursal.get({ plain: true }) : { ...sucursal };

  // Portada de sede
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);

  // Restaurante de sede
  if (plain.restaurante_imagen_key) {
    const restMedia = await s3Service.resolveMediaUrlWithExpiry(plain.restaurante_imagen_key);
    plain.restaurante_imagen_url = restMedia.url;
    plain.restaurante_imagen_expires_at = restMedia.expiresAt;
    plain.restaurante_imagen_creditos = getAssetCredits(plain.restaurante_imagen_key);
  } else {
    plain.restaurante_imagen_url = null;
    plain.restaurante_imagen_expires_at = null;
    plain.restaurante_imagen_creditos = null;
  }

  return plain;
}

export const getAll = async () => {
  const sucursales = await Sucursal.findAll({ order: [["nombre", "ASC"]] });
  return Promise.all(sucursales.map(serializeSucursal));
};

export const getById = async (id: number) => {
  const sucursal = await Sucursal.findByPk(id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal solicitada no existe");
  }
  return serializeSucursal(sucursal);
};

export const create = async (data: CreateSucursalData) => {
  const sucursal = await Sucursal.create({
    nombre: data.nombre,
    direccion: data.direccion,
    ciudad: data.ciudad,
    telefono: data.telefono,
  });
  return serializeSucursal(sucursal);
};

export const update = async (id: number, data: UpdateSucursalData) => {
  const sucursal = await Sucursal.findByPk(id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal solicitada no existe");
  }
  await sucursal.update(data);
  return serializeSucursal(sucursal);
};

export const remove = async (id: number) => {
  const sucursal = await Sucursal.findByPk(id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal solicitada no existe");
  }
  const usos = await Habitacion.count({ where: { sucursal_id: id } });

  if (usos > 0) {
    throw new AppError(
      409,
      "BRANCH_IN_USE",
      "La sucursal no puede eliminarse porque tiene habitaciones asociadas",
    );
  }

  const previousKey = sucursal.imagen_key;
  await sucursal.destroy();

  // Limpieza del archivo si no está referenciado por otra sede
  if (previousKey && previousKey.startsWith("sedes/")) {
    const refs = await Sucursal.count({ where: { imagen_key: previousKey } });
    if (refs === 0) {
      await s3Service.deleteStorageObject(previousKey).catch(() => {});
    }
  }
};

/**
 * Solicita una URL prefirmada de subida temporal vinculada a la sede y al usuario administrador.
 */
export const requestImageUpload = async (
  sedeId: number,
  userId: number,
  contentType: string,
): Promise<PresignImageResult> => {
  const sucursal = await Sucursal.findByPk(sedeId);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal solicitada no existe");
  }

  const allowedTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const ext = allowedTypes[contentType];
  if (!ext) {
    throw new AppError(
      400,
      "INVALID_CONTENT_TYPE",
      "Solo se permiten archivos de tipo image/jpeg, image/png o image/webp",
    );
  }

  const storageSlug = getSedeStorageSlug(sucursal);
  const randomPart = crypto.randomBytes(8).toString("hex");
  const tempKey = `sedes/temp/${storageSlug}_${userId}_${Date.now()}_${randomPart}.${ext}`;
  const expiresInSeconds = 900; // 15 minutos

  // Token firmado para asociar la clave temporal a este usuario y sede de forma inmutable
  const uploadToken = jwt.sign(
    {
      sedeId,
      userId,
      tempKey,
    },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const uploadUrl = await s3Service.getPresignedUploadUrl(tempKey, contentType, expiresInSeconds);

  return {
    uploadUrl,
    uploadToken,
    tempKey,
    expiresInSeconds,
  };
};

/**
 * Confirma la subida con garantía persistente:
 * 1. Verifica en base de datos si el uploadToken ya fue confirmado previamente (incluso tras reinicio
 *    del backend o entre múltiples réplicas/instancias coordinadas).
 * 2. Si ya fue confirmado, retorna el estado actual de la sede SIN sobreescribir si ya fue reemplazada.
 * 3. Si es la primera vez, descarga desde S3, valida bytes y datos ráster completos con sharp,
 *    publica bajo una clave final única organizada por sedes/<slug>/portada/portada-<id>.<ext>
 *    y registra atómicamente la confirmación en la base de datos.
 */
export const confirmImageUpload = async (
  sedeId: number,
  userId: number,
  uploadToken: string,
  tempKey: string,
): Promise<any> => {
  purgeExpiredTokens();

  if (ConfirmacionSubida && typeof ConfirmacionSubida.sync === "function") {
    await ConfirmacionSubida.sync().catch(() => {});
  }

  const tokenHash = crypto.createHash("sha256").update(uploadToken).digest("hex");

  // 1. Verificación persistente: si este token ya fue registrado en BD, devolver sede actual
  if (ConfirmacionSubida) {
    const existing = await ConfirmacionSubida.findOne({ where: { token_hash: tokenHash } });
    if (existing) {
      const currentSede = await Sucursal.findByPk(sedeId);
      if (!currentSede) {
        throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal solicitada no existe");
      }
      return serializeSucursal(currentSede);
    }
  }

  // 2. Caché local en memoria del proceso
  const cached = confirmedTokensCache.get(uploadToken);
  if (cached) {
    return cached.result;
  }

  // 3. Deduplicar peticiones en vuelo con el mismo uploadToken en este proceso
  if (inFlightConfirmations.has(uploadToken)) {
    return await inFlightConfirmations.get(uploadToken)!;
  }

  const execution = (async () => {
    // 4. Validar ticket de autorización firmado
    let decoded: UploadTokenPayload;
    try {
      decoded = jwt.verify(uploadToken, env.JWT_SECRET) as UploadTokenPayload;
    } catch (_err) {
      throw new AppError(400, "INVALID_UPLOAD_TOKEN", "El ticket de subida es inválido o ha expirado");
    }

    if (
      Number(decoded.sedeId) !== Number(sedeId) ||
      Number(decoded.userId) !== Number(userId) ||
      decoded.tempKey !== tempKey
    ) {
      throw new AppError(
        403,
        "UPLOAD_NOT_AUTHORIZED",
        "El ticket de subida no coincide con la sede, usuario o clave temporal proporcionada",
      );
    }

    // 5. Comprobar existencia inicial de la sede
    const sucursalPreCheck = await Sucursal.findByPk(sedeId);
    if (!sucursalPreCheck) {
      throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal solicitada no existe");
    }

    // 6. Descargar bytes recibidos desde la clave temporal
    let rawBuffer: Buffer;
    try {
      rawBuffer = await s3Service.getStorageObject(tempKey);
    } catch (_err: any) {
      // Si el archivo temporal ya no existe, verificar una vez más en base de datos si otro proceso lo completó
      if (ConfirmacionSubida) {
        const raceExisting = await ConfirmacionSubida.findOne({ where: { token_hash: tokenHash } });
        if (raceExisting) {
          const currentSede = await Sucursal.findByPk(sedeId);
          return serializeSucursal(currentSede);
        }
      }
      throw new AppError(
        400,
        "UPLOADED_FILE_NOT_FOUND",
        "No se encontró el archivo temporal en el almacenamiento. Asegúrese de completar la subida directa a S3 antes de confirmar.",
      );
    }

    // 7. Validar decodificación completa del contenido, formato, dimensiones y píxeles con sharp
    let processed: ProcessedImage;
    try {
      processed = await validateAndProcessImage(rawBuffer);
    } catch (validationError) {
      await s3Service.deleteStorageObject(tempKey).catch(() => {});
      throw validationError;
    }

    // 8. Publicar buffer higienizado bajo clave final única dentro de sedes/<slug>/portada/
    const storageSlug = getSedeStorageSlug(sucursalPreCheck);
    const uniqueId = crypto.randomBytes(6).toString("hex");
    const finalKey = `sedes/${storageSlug}/portada/portada-${Date.now()}-${uniqueId}.${processed.extension}`;

    await s3Service.putStorageObject(finalKey, processed.buffer, processed.mimeType);

    // 9. Transacción atómica coordinada con bloqueo pesimista y persistencia de confirmación
    const t = await db.sequelize.transaction();
    let previousKey: string | null = null;
    let updatedSucursal: any;
    try {
      const lockedSucursal = await Sucursal.findByPk(sedeId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!lockedSucursal) {
        await t.rollback();
        throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal solicitada no existe");
      }

      // Comprobación atómica contra carreras entre instancias
      if (ConfirmacionSubida) {
        const txExisting = await ConfirmacionSubida.findOne({
          where: { token_hash: tokenHash },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (txExisting) {
          await t.rollback();
          return serializeSucursal(lockedSucursal);
        }
      }

      previousKey = lockedSucursal.imagen_key;
      await lockedSucursal.update({ imagen_key: finalKey }, { transaction: t });

      if (ConfirmacionSubida) {
        await ConfirmacionSubida.create(
          {
            token_hash: tokenHash,
            sede_id: sedeId,
            temp_key: tempKey,
            final_key: finalKey,
          },
          { transaction: t },
        );
      }

      await t.commit();
      updatedSucursal = lockedSucursal;
    } catch (dbErr) {
      if (!t.finished) {
        await t.rollback().catch(() => {});
      }
      await s3Service.deleteStorageObject(finalKey).catch(() => {});
      throw dbErr;
    }

    // 10. Limpieza resiliente del archivo temporal
    try {
      await s3Service.deleteStorageObject(tempKey);
    } catch (cleanupErr) {
      console.warn(`[SucursalService] Advertencia: fallo al eliminar tempKey ${tempKey}:`, cleanupErr);
    }

    // 11. Limpieza de imagen anterior: verificar que ya no esté referenciada ni sea la activa actual
    if (previousKey && previousKey !== finalKey && previousKey.startsWith("sedes/")) {
      try {
        const currentActive = await Sucursal.findByPk(sedeId);
        const isStillActiveInCurrent = currentActive?.imagen_key === previousKey;
        const refs = await Sucursal.count({ where: { imagen_key: previousKey } });

        if (refs === 0 && !isStillActiveInCurrent) {
          await s3Service.deleteStorageObject(previousKey);
        }
      } catch (cleanupErr) {
        console.warn(`[SucursalService] Advertencia: fallo en limpieza de imagen previa ${previousKey}:`, cleanupErr);
      }
    }

    const serialized = await serializeSucursal(updatedSucursal);
    confirmedTokensCache.set(uploadToken, { result: serialized, timestamp: Date.now() });
    return serialized;
  })();

  inFlightConfirmations.set(uploadToken, execution);
  try {
    return await execution;
  } finally {
    inFlightConfirmations.delete(uploadToken);
  }
};

/**
 * Quita la imagen principal de la sede y limpia el archivo no referenciado de S3.
 * Protegido con transacción y bloqueo de fila.
 */
export const removeImage = async (sedeId: number): Promise<any> => {
  const t = await db.sequelize.transaction();
  let previousKey: string | null = null;
  let updatedSucursal: any;
  try {
    const lockedSucursal = await Sucursal.findByPk(sedeId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!lockedSucursal) {
      await t.rollback();
      throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal solicitada no existe");
    }

    previousKey = lockedSucursal.imagen_key;
    await lockedSucursal.update({ imagen_key: null }, { transaction: t });
    await t.commit();
    updatedSucursal = lockedSucursal;
  } catch (err) {
    if (!t.finished) {
      await t.rollback().catch(() => {});
    }
    throw err;
  }

  if (previousKey && previousKey.startsWith("sedes/")) {
    try {
      const currentActive = await Sucursal.findByPk(sedeId);
      const isStillActiveInCurrent = currentActive?.imagen_key === previousKey;
      const refs = await Sucursal.count({ where: { imagen_key: previousKey } });

      if (refs === 0 && !isStillActiveInCurrent) {
        await s3Service.deleteStorageObject(previousKey);
      }
    } catch (cleanupErr) {
      console.warn(`[SucursalService] Advertencia: fallo al eliminar imagen retirada ${previousKey}:`, cleanupErr);
    }
  }

  return serializeSucursal(updatedSucursal);
};
