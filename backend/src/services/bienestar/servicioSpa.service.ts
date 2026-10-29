import crypto from "crypto";
import { AppError } from "../../utils/AppError";
import * as mediaUploadService from "../storage/mediaUpload.service";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";
import { ahoraEnGuatemala, contarFueraDeHorario, leerHorario, validarHorarioConfigurado } from "../../utils/franjasHorarias";

const db = require("../../models");
const { Op } = require("sequelize");

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
  validarHorarioConfigurado(data, Number(data.duracion_minutos));
  const servicio = await ServicioBienestar.create({
    nombre: data.nombre,
    duracion_minutos:
      data.duracion_minutos,
    precio: data.precio,
    imagen_key: data.imagen_key ?? null,
    sucursal_id: data.sucursal_id ?? null,
    activo: data.activo ?? true,
    hora_apertura: data.hora_apertura ?? null,
    hora_cierre: data.hora_cierre ?? null,
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
  // El horario se valida con los valores resultantes, aunque solo cambie uno de ellos o la duración.
  const resultante = { ...servicio.get({ plain: true }), ...data };
  validarHorarioConfigurado(
    { hora_apertura: resultante.hora_apertura?.slice(0, 5) ?? null, hora_cierre: resultante.hora_cierre?.slice(0, 5) ?? null },
    Number(resultante.duracion_minutos),
  );
  await servicio.update(data);

  // Las citas futuras se conservan; solo se informa cuántas quedan fuera del nuevo horario.
  const futuras = await CitaBienestar.findAll({
    where: { servicio_bienestar_id: id, fecha: { [Op.gte]: ahoraEnGuatemala().fecha }, estado: "confirmada" },
    attributes: ["hora_inicio", "hora_fin"],
    raw: true,
  });
  return {
    ...(await getById(id)),
    reservas_fuera_de_horario: contarFueraDeHorario(
      (futuras as any[]).map((c) => ({ inicio: c.hora_inicio, fin: c.hora_fin })),
      leerHorario(resultante),
    ),
  };
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
