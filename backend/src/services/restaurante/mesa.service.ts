import { AppError } from "../../utils/AppError";
import { SedeScope, assertSedeAccess } from "../../utils/sedeScope";
const db = require("../../models");

const { Mesa, Sucursal, ReservaMesa, Restaurante } = db;

interface CreateMesaData {
  sucursal_id: number;
  zona: string;
  capacidad: number;
  estado?: string;
}

interface UpdateMesaData {
  zona?: string;
  capacidad?: number;
  estado?: string;
}

export const getAll = async (where: Record<string | symbol, unknown> = {}) => {
  const mesas = await Mesa.findAll({
    where,
    include: [
      { model: Sucursal, attributes: ['nombre'] },
      { model: Restaurante, attributes: ['id', 'nombre'] },
    ],
    order: [["zona", "ASC"]],
  });
  return mesas;
};

export const getById = async (id: number) => {
  const mesa = await Mesa.findByPk(id);

  if (!mesa) {
    throw new AppError(
      404,
      "TABLE_NOT_FOUND",
      "La mesa solicitada no existe"
    );
  }

  return mesa;
};

// Las mutaciones reciben el alcance por sede del solicitante (ver utils/sedeScope).
const GLOBAL_SCOPE: SedeScope = { global: true };

export const create = async (data: CreateMesaData, scope: SedeScope = GLOBAL_SCOPE) => {
  assertSedeAccess(scope, data.sucursal_id);

  // Validar que la sucursal exista
  const sucursal = await Sucursal.findByPk(data.sucursal_id);
  if (!sucursal) {
    throw new AppError(
      404,
      "BRANCH_NOT_FOUND",
      "La sucursal indicada para esta mesa no existe"
    );
  }

  // Cada mesa nueva pertenece al restaurante principal de su sede, si existe.
  const restaurante = await Restaurante.findOne({ where: { sucursal_id: data.sucursal_id } });

  const mesa = await Mesa.create({
    sucursal_id: data.sucursal_id,
    zona: data.zona,
    capacidad: data.capacidad,
    estado: data.estado || 'disponible',
    restaurante_id: restaurante?.id ?? null,
  });

  return mesa;
};

export const update = async (id: number, data: UpdateMesaData, scope: SedeScope = GLOBAL_SCOPE) => {
  const mesa = await getById(id);
  assertSedeAccess(scope, mesa.sucursal_id);
  await mesa.update(data);
  return mesa;
};

export const remove = async (id: number, scope: SedeScope = GLOBAL_SCOPE) => {
  const mesa = await getById(id);
  assertSedeAccess(scope, mesa.sucursal_id);

  // Evitamos destruir información histórica
  const usos = await ReservaMesa.count({
    where: { mesa_id: id },
  });

  if (usos > 0) {
    throw new AppError(
      409,
      "TABLE_IN_USE",
      "La mesa no puede eliminarse porque está asociada a una o más reservas"
    );
  }

  await mesa.destroy();
};