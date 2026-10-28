import crypto from "crypto";
import { AppError } from "../../utils/AppError";
import * as mediaUploadService from "../storage/mediaUpload.service";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";
import { assertExperienciaCompleta } from "../../validators/actividades/recursoActividad.validator";

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
  modalidad?: "por_hora" | "experiencia";
  duracion_minutos?: number | null;
  cupo_maximo?: number | null;
  precio_persona?: number | null;
}

interface UpdateRecursoData {
  tipo?: string;
  nombre?: string;
  precio_hora?: number;
  precio_equipo?: number;
  precio_instructor_hora?: number;
  imagen_key?: string | null;
  modalidad?: "por_hora" | "experiencia";
  duracion_minutos?: number | null;
  cupo_maximo?: number | null;
  precio_persona?: number | null;
}

const MODALIDAD_KEYS = ["modalidad", "duracion_minutos", "cupo_maximo", "precio_persona"] as const;

const pickModalidad = (data: Partial<CreateRecursoData>) =>
  Object.fromEntries(MODALIDAD_KEYS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));

export async function serializeRecursoActividad(recurso: any): Promise<any> {
  if (!recurso) return null;
  const plain = typeof recurso.get === "function" ? recurso.get({ plain: true }) : { ...recurso };
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
}

export const getAll = async (where: Record<string | symbol, unknown> = {}) => {
  const recursos = await RecursoActividad.findAll({
    where,
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
    ...pickModalidad(data),
  });

  return getById(created.id);
};

export const update = async (id: number, data: UpdateRecursoData) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  const modalidad = pickModalidad(data);
  if (Object.keys(modalidad).length > 0) {
    const resultante = { ...recurso.get({ plain: true }), ...modalidad };
    if (!assertExperienciaCompleta(resultante)) {
      throw new AppError(
        422,
        "INVALID_ACTIVITY_MODE",
        "Una experiencia requiere duracion_minutos, cupo_maximo y precio_persona"
      );
    }
    // Cambiar la modalidad alteraría cómo se validan las reservas ya confirmadas.
    if (resultante.modalidad !== recurso.modalidad) {
      const confirmadas = await ReservaActividad.count({ where: { recurso_id: id, estado: "confirmada" } });
      if (confirmadas > 0) {
        throw new AppError(
          409,
          "ACTIVITY_MODE_IN_USE",
          "No se puede cambiar la modalidad de un recurso con reservas confirmadas"
        );
      }
    }
  }
  await recurso.update({
    ...modalidad,
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

/**
 * Ocupación pública de un recurso en una fecha: salidas confirmadas agrupadas
 * por hora de inicio. Solo expone conteos, nunca datos de los clientes.
 * En experiencias, "disponibles" es el cupo restante de cada salida.
 */
export const getSalidas = async (id: number, fecha: string) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  const reservas = await ReservaActividad.findAll({
    where: { recurso_id: id, fecha, estado: "confirmada" },
    attributes: ["hora_inicio", "hora_fin", "numero_participantes"],
    order: [["hora_inicio", "ASC"]],
    raw: true,
  });
  const experiencia = recurso.modalidad === "experiencia";
  const porInicio = new Map<string, { hora_inicio: string; hora_fin: string; participantes: number }>();
  for (const r of reservas as any[]) {
    const actual = porInicio.get(r.hora_inicio);
    if (actual) {
      actual.participantes += Number(r.numero_participantes);
      if (r.hora_fin > actual.hora_fin) actual.hora_fin = r.hora_fin;
    } else {
      porInicio.set(r.hora_inicio, { hora_inicio: r.hora_inicio, hora_fin: r.hora_fin, participantes: Number(r.numero_participantes) });
    }
  }
  return {
    recurso_id: recurso.id,
    fecha,
    modalidad: recurso.modalidad,
    cupo_maximo: experiencia ? recurso.cupo_maximo : null,
    salidas: [...porInicio.values()].map((salida) => ({
      ...salida,
      disponibles: experiencia ? Math.max(0, Number(recurso.cupo_maximo) - salida.participantes) : 0,
    })),
  };
};
