import crypto from "crypto";
import { AppError } from "../../utils/AppError";
import * as mediaUploadService from "../storage/mediaUpload.service";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";

const db = require("../../models");

const {
  ServicioBienestar,
  CitaBienestar,
  Sucursal,
} = db;

const sucursalInclude = { model: Sucursal, attributes: ["id", "nombre"] };

/** Una sucursal indicada explícitamente debe existir. NULL = servicio general. */
export const assertSucursalExists = async (sucursalId: number | null | undefined) => {
  if (sucursalId == null) return;
  const sucursal = await Sucursal.findByPk(sucursalId);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal indicada no existe");
  }
};

export async function serializeServicioBienestar(servicio: any): Promise<any> {
  if (!servicio) return null;
  const plain = typeof servicio.get === "function" ? servicio.get({ plain: true }) : { ...servicio };
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
}

export const getAll = async (
  filters: { sucursalId?: number; incluirInactivos?: boolean } = {}, scopeWhere: Record<string | symbol, unknown> = {}
) => {
  const where: Record<string | symbol, unknown> = { ...scopeWhere };
  if (!filters.incluirInactivos) where.activo = true;
  if (filters.sucursalId !== undefined) where.sucursal_id = filters.sucursalId;
  const servicios = await ServicioBienestar.findAll({
    where,
    include: [sucursalInclude],
    order: [["nombre", "ASC"]],
  });
  return Promise.all(servicios.map(serializeServicioBienestar));
};

export const getById = async (
  id: number
) => {
  const servicio =
    await ServicioBienestar.findByPk(id, { include: [sucursalInclude] });

  if (!servicio) {
    throw new AppError(
      404,
      "WELLNESS_SERVICE_NOT_FOUND",
      "El servicio de bienestar solicitado no existe"
    );
  }

  return serializeServicioBienestar(servicio);
};

export const create = async (
  data: any
) => {
  await assertSucursalExists(data.sucursal_id);
  const servicio = await ServicioBienestar.create({
    nombre: data.nombre,
    duracion_minutos:
      data.duracion_minutos,
    precio: data.precio,
    imagen_key: data.imagen_key ?? null,
    sucursal_id: data.sucursal_id ?? null,
    activo: data.activo ?? true,
  });
  return serializeServicioBienestar(servicio);
};

export const update = async (
  id: number,
  data: any
) => {
  const servicio = await ServicioBienestar.findByPk(id);
  if (!servicio) {
    throw new AppError(
      404,
      "WELLNESS_SERVICE_NOT_FOUND",
      "El servicio de bienestar solicitado no existe"
    );
  }

  await assertSucursalExists(data.sucursal_id);
  await servicio.update(data);

  return getById(id);
};

export const remove = async (
  id: number
) => {
  const servicio = await ServicioBienestar.findByPk(id);
  if (!servicio) {
    throw new AppError(
      404,
      "WELLNESS_SERVICE_NOT_FOUND",
      "El servicio de bienestar solicitado no existe"
    );
  }

  const usos =
    await CitaBienestar.count({
      where: {
        servicio_bienestar_id: id,
      },
    });

  if (usos > 0) {
    throw new AppError(
      409,
      "WELLNESS_SERVICE_IN_USE",
      "El servicio está asociado a citas existentes y no puede eliminarse"
    );
  }

  const previousKey = servicio.imagen_key;
  await servicio.destroy();
  if (previousKey) {
    await mediaUploadService.cleanStorageObjectIfUnreferenced(previousKey);
  }
};

export const requestImageUpload = async (
  id: number,
  userId: number,
  contentType: string
) => {
  const servicio = await ServicioBienestar.findByPk(id);
  if (!servicio) {
    throw new AppError(404, "WELLNESS_SERVICE_NOT_FOUND", "El servicio de bienestar solicitado no existe");
  }
  return mediaUploadService.presignEntityUpload({
    entityType: "servicio-bienestar",
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
    entityType: "servicio-bienestar",
    entityId: id,
    userId,
    uploadToken,
    tempKey,
    Model: ServicioBienestar,
    column: "imagen_key",
    buildFinalKey: (servicio, ext) => {
      const rand = crypto.randomBytes(6).toString("hex");
      return `sedes/general/bienestar/servicio-${servicio.id}-${Date.now()}-${rand}.${ext}`;
    },
    serializeEntity: serializeServicioBienestar,
  });
};

export const removeImage = async (id: number) => {
  return mediaUploadService.removeEntityImage({
    entityId: id,
    Model: ServicioBienestar,
    column: "imagen_key",
    serializeEntity: serializeServicioBienestar,
  });
};
