import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { Mesa, Sucursal, ReservaMesa } = db;

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

export const getAll = async () => {
  const mesas = await Mesa.findAll({
    include: [{ model: Sucursal, attributes: ['nombre'] }],
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

export const create = async (data: CreateMesaData) => {
  // Validar que la sucursal exista
  const sucursal = await Sucursal.findByPk(data.sucursal_id);
  if (!sucursal) {
    throw new AppError(
      404,
      "BRANCH_NOT_FOUND",
      "La sucursal indicada para esta mesa no existe"
    );
  }

  const mesa = await Mesa.create({
    sucursal_id: data.sucursal_id,
    zona: data.zona,
    capacidad: data.capacidad,
    estado: data.estado || 'disponible',
  });

  return mesa;
};

export const update = async (id: number, data: UpdateMesaData) => {
  const mesa = await getById(id);
  await mesa.update(data);
  return mesa;
};

export const remove = async (id: number) => {
  const mesa = await getById(id);

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