import { AppError }
  from "../../utils/AppError";

const db = require("../../models");

const { Chofer } = db;

interface CreateChoferData {
  nombre: string;
  licencia?: string | null;
}

interface UpdateChoferData {
  nombre?: string;
  licencia?: string | null;
}

export const getAll = async () => {
  return Chofer.findAll({
    order: [["nombre", "ASC"]],
  });
};

export const getById = async (
  id: number
) => {
  const chofer =
    await Chofer.findByPk(id);

  if (!chofer) {
    throw new AppError(
      404,
      "DRIVER_NOT_FOUND",
      "El chofer solicitado no existe"
    );
  }

  return chofer;
};

export const create = async (
  data: CreateChoferData
) => {
  return Chofer.create({
    nombre: data.nombre,
    licencia:
      data.licencia ?? null,
    activo: true,
  });
};

export const update = async (
  id: number,
  data: UpdateChoferData
) => {
  const chofer =
    await Chofer.findByPk(id);

  if (!chofer) {
    throw new AppError(
      404,
      "DRIVER_NOT_FOUND",
      "El chofer solicitado no existe"
    );
  }

  await chofer.update(data);

  return chofer;
};

export const updateStatus = async (
  id: number,
  activo: boolean
) => {
  const chofer =
    await Chofer.findByPk(id);

  if (!chofer) {
    throw new AppError(
      404,
      "DRIVER_NOT_FOUND",
      "El chofer solicitado no existe"
    );
  }

  await chofer.update({
    activo,
  });

  return chofer;
};

