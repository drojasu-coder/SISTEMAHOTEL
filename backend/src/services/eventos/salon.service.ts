import crypto from "crypto";
import { AppError } from "../../utils/AppError";
import * as mediaUploadService from "../storage/mediaUpload.service";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";

const db = require("../../models");

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
}

interface UpdateSalonData {
  sucursal_id?: number;
  nombre?: string;
  capacidad_maxima?: number;
  tarifa_base?: number;
  descripcion?: string | null;
  imagen_key?: string | null;
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

  const salon = await Salon.create({
    sucursal_id: data.sucursal_id,
    nombre: data.nombre,
    capacidad_maxima:
      data.capacidad_maxima,
    tarifa_base: data.tarifa_base,
    descripcion:
      data.descripcion ?? null,
    imagen_key: data.imagen_key ?? null,
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

  await salon.update(data);

  return getById(id);
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
