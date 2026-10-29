import crypto from "crypto";
import { AppError } from "../../utils/AppError";
import * as mediaUploadService from "../storage/mediaUpload.service";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";
import { ahoraEnGuatemala, contarFueraDeHorario, leerHorario, validarHorarioConfigurado, INTERVALO_FRANJAS_MINUTOS } from "../../utils/franjasHorarias";

const db = require("../../models");
const { Op } = require("sequelize");

const {
  Salon,
  Sucursal,
  ReservaEvento,
} = db;

interface CreateSalonData {
  sucursal_id: number;
  nombre: string;
  capacidad_maxima: number;
  tarifa_base: number;
  descripcion?: string | null;
  imagen_key?: string | null;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
}

interface UpdateSalonData {
  sucursal_id?: number;
  nombre?: string;
  capacidad_maxima?: number;
  tarifa_base?: number;
  descripcion?: string | null;
  imagen_key?: string | null;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
}

export async function serializeSalon(salon: any): Promise<any> {
  if (!salon) return null;
  const plain = typeof salon.get === "function" ? salon.get({ plain: true }) : { ...salon };
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
}

const validateSucursal = async (
  sucursalId: number
) => {
  const sucursal = await Sucursal.findByPk(
    sucursalId
  );

  if (!sucursal) {
    throw new AppError(
      404,
      "BRANCH_NOT_FOUND",
      "La sucursal indicada no existe"
    );
  }

  if (!sucursal.activa) {
    throw new AppError(
      422,
      "BRANCH_INACTIVE",
      "No se puede asignar el salón a una sucursal inactiva"
    );
  }

  return sucursal;
};

export const getAll = async (where: Record<string | symbol, unknown> = {}) => {
  const salones = await Salon.findAll({
    where,
    include: [
      {
        model: Sucursal,
        attributes: [
          "id",
          "nombre",
          "ciudad",
          "activa",
        ],
      },
    ],
    order: [["nombre", "ASC"]],
  });
  return Promise.all(salones.map(serializeSalon));
};

export const getById = async (
  id: number
) => {
  const salon = await Salon.findByPk(id, {
    include: [
      {
        model: Sucursal,
        attributes: [
          "id",
          "nombre",
          "ciudad",
          "activa",
        ],
      },
    ],
  });

  if (!salon) {
    throw new AppError(
      404,
      "EVENT_ROOM_NOT_FOUND",
      "El salón solicitado no existe"
    );
  }

  return serializeSalon(salon);
};

export const create = async (
  data: CreateSalonData
) => {
  await validateSucursal(
    data.sucursal_id
  );
  // Una solicitud mínima ocupa 30 minutos: el horario debe dar cabida al menos a una.
  validarHorarioConfigurado(data, INTERVALO_FRANJAS_MINUTOS);

  const salon = await Salon.create({
    sucursal_id: data.sucursal_id,
    nombre: data.nombre,
    capacidad_maxima:
      data.capacidad_maxima,
    tarifa_base: data.tarifa_base,
    descripcion:
      data.descripcion ?? null,
    imagen_key: data.imagen_key ?? null,
    hora_apertura: data.hora_apertura ?? null,
    hora_cierre: data.hora_cierre ?? null,
  });

  return getById(salon.id);
};

export const update = async (
  id: number,
  data: UpdateSalonData
) => {
  const salon = await Salon.findByPk(id);

  if (!salon) {
    throw new AppError(
      404,
      "EVENT_ROOM_NOT_FOUND",
      "El salón solicitado no existe"
    );
  }

  if (
    data.sucursal_id !== undefined
  ) {
    await validateSucursal(
      data.sucursal_id
    );
  }

  const resultante = { ...salon.get({ plain: true }), ...data };
  const horario = { hora_apertura: resultante.hora_apertura?.slice(0, 5) ?? null, hora_cierre: resultante.hora_cierre?.slice(0, 5) ?? null };
  validarHorarioConfigurado(horario, INTERVALO_FRANJAS_MINUTOS);

  await salon.update(data);

  // Las solicitudes y eventos futuros se conservan; solo se informa cuántos quedan fuera del horario.
  const futuras = await ReservaEvento.findAll({
    where: { salon_id: id, fecha: { [Op.gte]: ahoraEnGuatemala().fecha }, estado: { [Op.in]: ["cotizacion", "confirmada"] } },
    attributes: ["hora_inicio", "hora_fin"],
    raw: true,
  });
  return {
    ...(await getById(id)),
    reservas_fuera_de_horario: contarFueraDeHorario(
      (futuras as any[]).map((r) => ({ inicio: r.hora_inicio, fin: r.hora_fin })),
      leerHorario(horario),
    ),
  };
};

export const remove = async (
  id: number
) => {
  const salon = await Salon.findByPk(id);

  if (!salon) {
    throw new AppError(
      404,
      "EVENT_ROOM_NOT_FOUND",
      "El salón solicitado no existe"
    );
  }

  const reservas = await ReservaEvento.count({
    where: {
      salon_id: id,
    },
  });

  if (reservas > 0) {
    throw new AppError(
      409,
      "EVENT_ROOM_IN_USE",
      "El salón no puede eliminarse porque tiene reservas asociadas"
    );
  }

  const previousKey = salon.imagen_key;
  await salon.destroy();
  if (previousKey) {
    await mediaUploadService.cleanStorageObjectIfUnreferenced(previousKey);
  }
};

export const requestImageUpload = async (
  id: number,
  userId: number,
  contentType: string
) => {
  const salon = await Salon.findByPk(id);
  if (!salon) {
    throw new AppError(404, "EVENT_ROOM_NOT_FOUND", "El salón solicitado no existe");
  }
  return mediaUploadService.presignEntityUpload({
    entityType: "salon",
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
    entityType: "salon",
    entityId: id,
    userId,
    uploadToken,
    tempKey,
    Model: Salon,
    column: "imagen_key",
    buildFinalKey: (salon, ext) => {
      const storageSlug = mediaUploadService.resolveStorageSlug(salon.sucursal_id);
      const rand = crypto.randomBytes(6).toString("hex");
      return `sedes/${storageSlug}/eventos/salon-${salon.id}-${Date.now()}-${rand}.${ext}`;
    },
    serializeEntity: serializeSalon,
  });
};

export const removeImage = async (id: number) => {
  return mediaUploadService.removeEntityImage({
    entityId: id,
    Model: Salon,
    column: "imagen_key",
    serializeEntity: serializeSalon,
  });
};
