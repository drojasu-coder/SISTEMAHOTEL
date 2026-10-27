import crypto from "crypto";
import { AppError } from "../../utils/AppError";
import * as mediaUploadService from "../storage/mediaUpload.service";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";

const db = require("../../models");

const { RecursoActividad, Sucursal, ReservaActividad } = db;

interface CreateRecursoData {
  sucursal_id: number;
  tipo: string;
  nombre: string;
  precio_hora?: number;
  precio_equipo?: number;
  precio_instructor_hora?: number;
  imagen_key?: string | null;
}

interface UpdateRecursoData {
  tipo?: string;
  nombre?: string;
  precio_hora?: number;
  precio_equipo?: number;
  precio_instructor_hora?: number;
  imagen_key?: string | null;
}

export async function serializeRecursoActividad(recurso: any): Promise<any> {
  if (!recurso) return null;
  const plain = typeof recurso.get === "function" ? recurso.get({ plain: true }) : { ...recurso };
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
}

export const getAll = async () => {
  const recursos = await RecursoActividad.findAll({
    include: [{ model: Sucursal, attributes: ["id", "nombre"] }],
    order: [["tipo", "ASC"], ["nombre", "ASC"]],
  });
  return Promise.all(recursos.map(serializeRecursoActividad));
};

export const getById = async (id: number) => {
  const recurso = await RecursoActividad.findByPk(id, {
    include: [{ model: Sucursal, attributes: ["id", "nombre"] }],
  });
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  return serializeRecursoActividad(recurso);
};

export const create = async (data: CreateRecursoData) => {
  const sucursal = await Sucursal.findByPk(data.sucursal_id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal indicada no existe");
  }

  const created = await RecursoActividad.create({
    sucursal_id: data.sucursal_id,
    tipo: data.tipo,
    nombre: data.nombre,
    ...(data.precio_hora !== undefined && { precio_hora: data.precio_hora }),
    ...(data.precio_equipo !== undefined && { precio_equipo: data.precio_equipo }),
    ...(data.precio_instructor_hora !== undefined && {
      precio_instructor_hora: data.precio_instructor_hora,
    }),
    imagen_key: data.imagen_key ?? null,
  });

  return getById(created.id);
};

export const update = async (id: number, data: UpdateRecursoData) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  await recurso.update({
    ...(data.tipo !== undefined && { tipo: data.tipo }),
    ...(data.nombre !== undefined && { nombre: data.nombre }),
    ...(data.precio_hora !== undefined && { precio_hora: data.precio_hora }),
    ...(data.precio_equipo !== undefined && { precio_equipo: data.precio_equipo }),
    ...(data.precio_instructor_hora !== undefined && {
      precio_instructor_hora: data.precio_instructor_hora,
    }),
  });
  return await getById(id);
};

export const remove = async (id: number) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }

  const usos = await ReservaActividad.count({ where: { recurso_id: id } });
  if (usos > 0) {
    throw new AppError(409, "RESOURCE_IN_USE", "El recurso no puede eliminarse porque tiene reservas asociadas");
  }

  const previousKey = recurso.imagen_key;
  await recurso.destroy();
  if (previousKey) {
    await mediaUploadService.cleanStorageObjectIfUnreferenced(previousKey);
  }
};

export const requestImageUpload = async (
  id: number,
  userId: number,
  contentType: string
) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  return mediaUploadService.presignEntityUpload({
    entityType: "recurso-actividad",
    entityId: id,
    contentType,
    userId,
  });
};

export const confirmImageUpload = async (
  id: number,
  userId: number,
  uploadToken: string,
  tempKey: string
) => {
  return mediaUploadService.confirmEntityUpload({
    entityType: "recurso-actividad",
    entityId: id,
    userId,
    uploadToken,
    tempKey,
    Model: RecursoActividad,
    column: "imagen_key",
    buildFinalKey: (recurso, ext) => {
      const storageSlug = mediaUploadService.resolveStorageSlug(recurso.sucursal_id);
      const rand = crypto.randomBytes(6).toString("hex");
      return `sedes/${storageSlug}/actividades/actividad-${recurso.id}-${Date.now()}-${rand}.${ext}`;
    },
    serializeEntity: serializeRecursoActividad,
  });
};

export const removeImage = async (id: number) => {
  return mediaUploadService.removeEntityImage({
    entityId: id,
    Model: RecursoActividad,
    column: "imagen_key",
    serializeEntity: serializeRecursoActividad,
  });
};
