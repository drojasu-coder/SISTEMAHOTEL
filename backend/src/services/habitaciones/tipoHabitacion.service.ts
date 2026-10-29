import crypto from "crypto";
import * as mediaUploadService from "../storage/mediaUpload.service";
import { Op, fn, col } from "sequelize";
import { AppError } from "../../utils/AppError";
import { getTodayDate } from "./reservaHabitacion.service";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";
import { SedeScope, assertGlobalScope, assertHasSede, assertSedeAccess } from "../../utils/sedeScope";

const db = require("../../models");

const { sequelize, TipoHabitacion, Habitacion, ReservaHabitacion, Sucursal } = db;

interface CreateTipoHabitacionData {
  sucursal_id?: number | null;
  nombre: string;
  capacidad_maxima: number;
  tarifa_noche: number;
  descripcion?: string | null;
  imagen_key?: string | null;
}

interface UpdateTipoHabitacionData {
  sucursal_id?: number | null;
  nombre?: string;
  capacidad_maxima?: number;
  tarifa_noche?: number;
  descripcion?: string | null;
  imagen_key?: string | null;
}

export async function serializeTipoHabitacion(tipo: any): Promise<any> {
  if (!tipo) return null;
  const plain = typeof tipo.get === "function" ? tipo.get({ plain: true }) : { ...tipo };
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
}

/**
 * Alcance por sede (ver utils/sedeScope). Un tipo con sede pertenece a esa sede;
 * un tipo sin sede es una categoría general compartida: el personal puede
 * consultarla, pero solo la administración general puede modificarla.
 * Sin alcance (cliente) se conserva la consulta de solo lectura existente.
 */
const assertTipoLegible = (tipo: any, scope?: SedeScope) => {
  if (!scope || scope.global) return;
  assertHasSede(scope);
  if (tipo.sucursal_id != null) assertSedeAccess(scope, tipo.sucursal_id);
};

const assertSedeEditable = (sucursalId: number | null | undefined, scope: SedeScope) => {
  if (sucursalId == null) assertGlobalScope(scope);
  else assertSedeAccess(scope, sucursalId);
};

const validateSucursal = async (sucursalId: number | null | undefined, transaction?: any) => {
  if (sucursalId == null) return;
  if (!(await Sucursal.findByPk(sucursalId, { transaction }))) {
    throw new AppError(404, "SUCURSAL_NOT_FOUND", "La sucursal no fue encontrada");
  }
};

const findTipoEditable = async (id: number, scope: SedeScope) => {
  const tipo = await TipoHabitacion.findByPk(id);
  if (!tipo) {
    throw new AppError(404, "TIPO_HABITACION_NOT_FOUND", "El tipo de habitación no fue encontrado");
  }
  assertSedeEditable(tipo.sucursal_id, scope);
  return tipo;
};

const GLOBAL_SCOPE: SedeScope = { global: true };

export const getAllTipoHabitaciones = async (scope?: SedeScope, sucursalId?: number) => {
  let where: Record<string | symbol, unknown> = {};
  if (sucursalId !== undefined) {
    if (scope) assertSedeAccess(scope, sucursalId);
    where = { sucursal_id: sucursalId };
  } else if (scope && !scope.global) {
    assertHasSede(scope);
    where = { [Op.or]: [{ sucursal_id: { [Op.in]: scope.sucursalIds } }, { sucursal_id: null }] };
  }
  const tipos = await TipoHabitacion.findAll({
    where,
    order: [["id", "ASC"]],
  });
  return Promise.all(tipos.map(serializeTipoHabitacion));
};

/**
 * Categorías comerciales públicas: solo tipos asignados a una sede y con
 * inventario. Los tipos generales anteriores (sin sede o sin habitaciones)
 * se conservan para el historial, pero no se ofrecen al cliente.
 */
export const getPublicCatalog = async (sucursalId?: number) => {
  const tipos = await TipoHabitacion.findAll({
    where: {
      sucursal_id: sucursalId !== undefined ? sucursalId : { [Op.ne]: null },
    },
    // Solo sedes activas: una sede desactivada no se ofrece en el catálogo público.
    include: [{ model: Sucursal, attributes: ["id", "nombre"], where: { activa: true }, required: true }],
    order: [["sucursal_id", "ASC"], ["tarifa_noche", "ASC"], ["capacidad_maxima", "ASC"], ["id", "ASC"]],
  });
  const conteos = await Habitacion.findAll({
    attributes: [
      "tipo_habitacion_id",
      [fn("COUNT", col("id")), "total"],
      [fn("MIN", col("id")), "referencia_id"],
    ],
    where: { tipo_habitacion_id: tipos.map((t: any) => t.id), estado: { [Op.ne]: "mantenimiento" } },
    group: ["tipo_habitacion_id"],
    raw: true,
  });
  const porTipo = new Map(conteos.map((c: any) => [Number(c.tipo_habitacion_id), c]));
  const conInventario = tipos.filter((t: any) => porTipo.has(t.id));
  return Promise.all(conInventario.map(async (t: any) => {
    const plain = await serializeTipoHabitacion(t);
    plain.habitacion_referencia_id = Number((porTipo.get(t.id) as any).referencia_id);
    return plain;
  }));
};

export const getTipoHabitacionById = async (id: number, scope?: SedeScope) => {
  const tipoHabitacion = await TipoHabitacion.findByPk(id);

  if (!tipoHabitacion) {
    throw new AppError(
      404,
      "TIPO_HABITACION_NOT_FOUND",
      "El tipo de habitación no fue encontrado"
    );
  }

  assertTipoLegible(tipoHabitacion, scope);

  return serializeTipoHabitacion(tipoHabitacion);
};

export const createTipoHabitacion = async (
  data: CreateTipoHabitacionData,
  scope: SedeScope = GLOBAL_SCOPE
) => {
  assertSedeEditable(data.sucursal_id, scope);
  await validateSucursal(data.sucursal_id);

  const tipo = await TipoHabitacion.create({
    sucursal_id: data.sucursal_id ?? null,
    nombre: data.nombre,
    capacidad_maxima: data.capacidad_maxima,
    tarifa_noche: data.tarifa_noche,
    descripcion: data.descripcion,
    imagen_key: data.imagen_key,
  });
  return serializeTipoHabitacion(tipo);
};

export const updateTipoHabitacion = async (
  id: number,
  data: UpdateTipoHabitacionData,
  scope: SedeScope = GLOBAL_SCOPE
) => sequelize.transaction(async (transaction: any) => {
  const tipoHabitacion = await TipoHabitacion.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!tipoHabitacion) {
    throw new AppError(
      404,
      "TIPO_HABITACION_NOT_FOUND",
      "El tipo de habitación no fue encontrado"
    );
  }

  // Sede actual y sede de destino deben ser editables por el solicitante.
  assertSedeEditable(tipoHabitacion.sucursal_id, scope);
  if (data.sucursal_id !== undefined && data.sucursal_id !== tipoHabitacion.sucursal_id) {
    assertSedeEditable(data.sucursal_id, scope);
    await validateSucursal(data.sucursal_id, transaction);
    // Un tipo con sede solo puede usarse por habitaciones de esa sede.
    if (data.sucursal_id != null) {
      const ajena = await Habitacion.findOne({
        where: { tipo_habitacion_id: id, sucursal_id: { [Op.ne]: data.sucursal_id } },
        attributes: ["id"],
        transaction,
      });
      if (ajena) {
        throw new AppError(
          409,
          "TIPO_HABITACION_SEDE_CONFLICT",
          "No se puede cambiar la sede del tipo porque lo usan habitaciones de otra sede"
        );
      }
    }
  }

  if (
    data.capacidad_maxima !== undefined &&
    data.capacidad_maxima < tipoHabitacion.capacidad_maxima
  ) {
    const habitaciones = await Habitacion.findAll({
      where: {
        tipo_habitacion_id: id,
      },
      attributes: ["id", "numero"],
      transaction,
    });

    if (habitaciones.length > 0) {
      const habitacionIds = habitaciones.map((h: any) => h.id);
      const today = getTodayDate();

      const reservaConflicto = await ReservaHabitacion.findOne({
        where: {
          habitacion_id: {
            [Op.in]: habitacionIds,
          },
          estado: {
            [Op.in]: ["pendiente", "confirmada"],
          },
          fecha_salida: {
            [Op.gt]: today,
          },
          numero_huespedes: {
            [Op.gt]: data.capacidad_maxima,
          },
        },
        order: [["numero_huespedes", "DESC"], ["fecha_entrada", "ASC"]],
        transaction,
      });

      if (reservaConflicto) {
        const habitacionAfectada = habitaciones.find(
          (h: any) => h.id === reservaConflicto.habitacion_id
        );
        const numeroHab = habitacionAfectada?.numero ?? reservaConflicto.habitacion_id;
        throw new AppError(
          409,
          "CAPACITY_REDUCTION_CONFLICT",
          `No es posible reducir la capacidad a ${data.capacidad_maxima} ${data.capacidad_maxima === 1 ? "huésped" : "huéspedes"} porque existen reservas activas (como en la habitación ${numeroHab}) con ${reservaConflicto.numero_huespedes} huéspedes que superan dicho límite.`
        );
      }
    }
  }

  await tipoHabitacion.update(data, { transaction });

  return serializeTipoHabitacion(tipoHabitacion);
});

export const deleteTipoHabitacion = async (id: number, scope: SedeScope = GLOBAL_SCOPE) => {
  const tipoHabitacion = await findTipoEditable(id, scope);

  const habitacion = await Habitacion.findOne({
    where: {
      tipo_habitacion_id: id,
    },
  });

  if (habitacion) {
    throw new AppError(
      409,
      "TIPO_HABITACION_EN_USO",
      "No se puede eliminar el tipo de habitación porque está en uso por una o más habitaciones"
    );
  }

  await tipoHabitacion.destroy();

  return tipoHabitacion;
};

export const requestImageUpload = async (
  id: number,
  userId: number,
  contentType: string,
  scope: SedeScope = GLOBAL_SCOPE
) => {
  await findTipoEditable(id, scope);
  return mediaUploadService.presignEntityUpload({
    entityType: "tipo-habitacion",
    entityId: id,
    contentType,
    userId,
  });
};

export const confirmImageUpload = async (
  id: number,
  userId: number,
  uploadToken: string,
  tempKey: string,
  scope: SedeScope = GLOBAL_SCOPE
) => {
  await findTipoEditable(id, scope);
  return mediaUploadService.confirmEntityUpload({
    entityType: "tipo-habitacion",
    entityId: id,
    userId,
    uploadToken,
    tempKey,
    Model: TipoHabitacion,
    column: "imagen_key",
    buildFinalKey: (tipo, ext) => {
      const rand = crypto.randomBytes(6).toString("hex");
      return `sedes/general/tipos-habitacion/tipo-${tipo.id}-${Date.now()}-${rand}.${ext}`;
    },
    serializeEntity: serializeTipoHabitacion,
  });
};

export const removeImage = async (id: number, scope: SedeScope = GLOBAL_SCOPE) => {
  await findTipoEditable(id, scope);
  return mediaUploadService.removeEntityImage({
    entityId: id,
    Model: TipoHabitacion,
    column: "imagen_key",
    serializeEntity: serializeTipoHabitacion,
  });
};
