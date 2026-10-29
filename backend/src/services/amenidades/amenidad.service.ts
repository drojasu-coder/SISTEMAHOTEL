import crypto from "crypto";
import * as mediaUploadService from "../storage/mediaUpload.service";
import { AppError } from "../../utils/AppError";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";
import { ahoraEnGuatemala, contarFueraDeHorario, leerHorario, validarHorarioConfigurado } from "../../utils/franjasHorarias";

const db = require("../../models");
const { Op } = require("sequelize");

const { Amenidad, Sucursal, ReservaAmenidad } = db;

interface CreateAmenidadData {
  sucursal_id: number;
  nombre: string;
  aforo_maximo: number;
  imagen_key?: string | null;
  reservable?: boolean;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  duracion_minutos?: number | null;
}

interface UpdateAmenidadData {
  nombre?: string;
  aforo_maximo?: number;
  imagen_key?: string | null;
  reservable?: boolean;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  duracion_minutos?: number | null;
}

export async function serializeAmenidad(amenidad: any): Promise<any> {
  if (!amenidad) return null;
  const plain = typeof amenidad.get === "function" ? amenidad.get({ plain: true }) : { ...amenidad };
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
}

export const getAll = async (where: Record<string | symbol, unknown> = {}) => {
  const amenidades = await Amenidad.findAll({
    where,
    include: [{ model: Sucursal, attributes: ['id', 'nombre'] }],
    order: [["nombre", "ASC"]],
  });
  return Promise.all(amenidades.map(serializeAmenidad));
};

export const getById = async (id: number) => {
  const amenidad = await Amenidad.findByPk(id, {
    include: [{ model: Sucursal, attributes: ['id', 'nombre'] }],
  });
  if (!amenidad) {
    throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");
  }
  return serializeAmenidad(amenidad);
};

export const create = async (data: CreateAmenidadData) => {
  const sucursal = await Sucursal.findByPk(data.sucursal_id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal indicada no existe");
  }

  validarHorarioConfigurado(data, data.duracion_minutos ?? null);
  const amenidad = await Amenidad.create(data);
  return serializeAmenidad(amenidad);
};

export const update = async (id: number, data: UpdateAmenidadData) => {
  const amenidad = await Amenidad.findByPk(id);
  if (!amenidad) {
    throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");
  }
  // El horario se valida con los valores resultantes, aunque solo cambie uno de ellos o la duración.
  const resultante = { ...amenidad.get({ plain: true }), ...data };
  validarHorarioConfigurado(
    { hora_apertura: resultante.hora_apertura?.slice(0, 5) ?? null, hora_cierre: resultante.hora_cierre?.slice(0, 5) ?? null },
    resultante.duracion_minutos ?? null,
  );
  await amenidad.update(data);

  // Las reservas futuras se conservan; solo se informa cuántas quedan fuera del nuevo horario.
  const futuras = await ReservaAmenidad.findAll({
    where: { amenidad_id: id, fecha: { [Op.gte]: ahoraEnGuatemala().fecha }, estado: "confirmada" },
    attributes: ["franja_horaria"],
    raw: true,
  });
  return {
    ...(await serializeAmenidad(amenidad)),
    reservas_fuera_de_horario: contarFueraDeHorario(
      (futuras as any[]).map((r) => { const [inicio, fin] = String(r.franja_horaria).split("-"); return { inicio, fin }; }),
      leerHorario(resultante),
    ),
  };
};

export const remove = async (id: number) => {
  const amenidad = await Amenidad.findByPk(id);
  if (!amenidad) {
    throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");
  }

  const usos = await ReservaAmenidad.count({ where: { amenidad_id: id } });
  if (usos > 0) {
    throw new AppError(409, "AMENITY_IN_USE", "La amenidad no puede eliminarse porque tiene reservas asociadas");
  }

  await amenidad.destroy();
};

export const requestImageUpload = async (
  id: number,
  userId: number,
  contentType: string
) => {
  const amenidad = await Amenidad.findByPk(id);
  if (!amenidad) {
    throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");
  }
  return mediaUploadService.presignEntityUpload({
    entityType: "amenidad",
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
    entityType: "amenidad",
    entityId: id,
    userId,
    uploadToken,
    tempKey,
    Model: Amenidad,
    column: "imagen_key",
    buildFinalKey: (amenidad, ext) => {
      const slug = mediaUploadService.resolveStorageSlug(amenidad.sucursal_id);
      const rand = crypto.randomBytes(6).toString("hex");
      return `sedes/${slug}/amenidades/amenidad-${amenidad.id}-${Date.now()}-${rand}.${ext}`;
    },
    serializeEntity: (a) => getById(a.id),
  });
};

export const removeImage = async (id: number) => {
  return mediaUploadService.removeEntityImage({
    entityId: id,
    Model: Amenidad,
    column: "imagen_key",
    serializeEntity: (a) => getById(a.id),
  });
};
