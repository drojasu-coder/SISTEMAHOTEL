import crypto from "crypto";
import * as s3Service from "../storage/s3.service";
import * as creditsService from "../storage/credits";
import * as mediaUploadService from "../storage/mediaUpload.service";
import { AppError } from "../../utils/AppError";

const db = require("../../models");

const SECTION_KEY_MAP: Record<string, string> = {
  hero: "hero_imagen_key",
  presentacion: "presentacion_imagen_key",
  experiencias: "experiencias_imagen_key",
};

const PRESIGNED_EXPIRES_SECONDS = 3600;

async function resolveImageUrl(
  key: string | null | undefined,
): Promise<{ url: string | null; expiresAt: string | null }> {
  if (!key) return { url: null, expiresAt: null };
  try {
    return await s3Service.resolveMediaUrlWithExpiry(key, PRESIGNED_EXPIRES_SECONDS);
  } catch (err) {
    console.warn(`[InicioService] Error resolviendo URL para clave ${key}:`, err);
    return { url: null, expiresAt: null };
  }
}

export async function getInicioContent() {
  const { PaginaInicio } = db;
  let record = await PaginaInicio.findByPk(1);
  if (!record) {
    record = await PaginaInicio.create({ id: 1 });
  }

  const [heroMedia, presentacionMedia, experienciasMedia] = await Promise.all([
    resolveImageUrl(record.hero_imagen_key),
    resolveImageUrl(record.presentacion_imagen_key),
    resolveImageUrl(record.experiencias_imagen_key),
  ]);

  const expirations = [
    heroMedia.expiresAt,
    presentacionMedia.expiresAt,
    experienciasMedia.expiresAt,
  ].filter((e): e is string => typeof e === "string" && e.length > 0);

  const expiresAt = expirations.length > 0 ? expirations.sort()[0] : null;

  return {
    id: record.id,
    hero_titulo: record.hero_titulo,
    hero_subtitulo: record.hero_subtitulo,
    hero_imagen_key: record.hero_imagen_key,
    hero_imagen_url: heroMedia.url,
    hero_imagen_alt: record.hero_imagen_alt,
    hero_imagen_creditos: creditsService.getAssetCredits(record.hero_imagen_key),
    hero_cta_texto: record.hero_cta_texto,
    hero_cta_enlace: record.hero_cta_enlace,

    presentacion_titulo: record.presentacion_titulo,
    presentacion_texto: record.presentacion_texto,
    presentacion_imagen_key: record.presentacion_imagen_key,
    presentacion_imagen_url: presentacionMedia.url,
    presentacion_imagen_alt: record.presentacion_imagen_alt,
    presentacion_imagen_creditos: creditsService.getAssetCredits(record.presentacion_imagen_key),
    presentacion_visible: Boolean(record.presentacion_visible),

    sedes_titulo: record.sedes_titulo,
    sedes_subtitulo: record.sedes_subtitulo,
    sedes_visible: Boolean(record.sedes_visible),

    experiencias_titulo: record.experiencias_titulo,
    experiencias_subtitulo: record.experiencias_subtitulo,
    experiencias_imagen_key: record.experiencias_imagen_key,
    experiencias_imagen_url: experienciasMedia.url,
    experiencias_imagen_alt: record.experiencias_imagen_alt,
    experiencias_imagen_creditos: creditsService.getAssetCredits(record.experiencias_imagen_key),
    experiencias_visible: Boolean(record.experiencias_visible),

    contacto_titulo: record.contacto_titulo,
    contacto_texto: record.contacto_texto,
    contacto_telefono: record.contacto_telefono,
    contacto_email: record.contacto_email,
    contacto_direccion: record.contacto_direccion,
    contacto_visible: Boolean(record.contacto_visible),

    expiresAt,
    updatedAt: record.updatedAt,
  };
}

export async function updateInicioContent(data: any) {
  const { PaginaInicio } = db;
  let record = await PaginaInicio.findByPk(1);
  if (!record) {
    record = await PaginaInicio.create({ id: 1 });
  }

  const allowed = [
    "hero_titulo",
    "hero_subtitulo",
    "hero_imagen_alt",
    "hero_cta_texto",
    "hero_cta_enlace",
    "presentacion_titulo",
    "presentacion_texto",
    "presentacion_imagen_alt",
    "presentacion_visible",
    "sedes_titulo",
    "sedes_subtitulo",
    "sedes_visible",
    "experiencias_titulo",
    "experiencias_subtitulo",
    "experiencias_imagen_alt",
    "experiencias_visible",
    "contacto_titulo",
    "contacto_texto",
    "contacto_telefono",
    "contacto_email",
    "contacto_direccion",
    "contacto_visible",
  ];

  const updatePayload: Record<string, any> = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updatePayload[key] = data[key];
    }
  }

  await record.update(updatePayload);
  return getInicioContent();
}

export async function requestInicioImageUpload(
  section: string,
  userId: number,
  contentType: string,
  fileName?: string,
) {
  if (!SECTION_KEY_MAP[section]) {
    throw new AppError(
      400,
      "INVALID_SECTION",
      `Sección inválida: ${section}. Opciones permitidas: hero, presentacion, experiencias`,
    );
  }

  return mediaUploadService.presignEntityUpload({
    entityType: `inicio_${section}`,
    entityId: 1,
    contentType,
    fileName,
    userId,
  });
}

export async function confirmInicioImageUpload(
  section: string,
  userId: number,
  uploadToken: string,
  tempKey: string,
) {
  const column = SECTION_KEY_MAP[section];
  if (!column) {
    throw new AppError(
      400,
      "INVALID_SECTION",
      `Sección inválida: ${section}. Opciones permitidas: hero, presentacion, experiencias`,
    );
  }

  const { PaginaInicio } = db;
  const buildFinalKey = (_entity: any, ext: string) => {
    const timestamp = Date.now();
    const rand = crypto.randomBytes(6).toString("hex");
    return `branding/inicio/inicio-${section}-${timestamp}-${rand}.${ext}`;
  };

  await mediaUploadService.confirmEntityUpload({
    entityType: `inicio_${section}`,
    entityId: 1,
    userId,
    uploadToken,
    tempKey,
    Model: PaginaInicio,
    column,
    buildFinalKey,
    serializeEntity: async () => getInicioContent(),
  });

  return getInicioContent();
}

export async function removeInicioImage(section: string) {
  const column = SECTION_KEY_MAP[section];
  if (!column) {
    throw new AppError(
      400,
      "INVALID_SECTION",
      `Sección inválida: ${section}. Opciones permitidas: hero, presentacion, experiencias`,
    );
  }

  const { PaginaInicio } = db;
  await mediaUploadService.removeEntityImage({
    entityId: 1,
    Model: PaginaInicio,
    column,
    serializeEntity: async () => getInicioContent(),
  });

  return getInicioContent();
}
