import { AppError } from "../../utils/AppError";

const db = require("../../models");

const {
  ServicioBienestar,
  CitaBienestar,
} = db;

export const getAll = async () => {
  return ServicioBienestar.findAll({
    order: [["nombre", "ASC"]],
  });
};

export const getById = async (
  id: number
) => {
  const servicio =
    await ServicioBienestar.findByPk(id);

  if (!servicio) {
    throw new AppError(
      404,
      "WELLNESS_SERVICE_NOT_FOUND",
      "El servicio de bienestar solicitado no existe"
    );
  }

  return servicio;
};

export const create = async (
  data: any
) => {
  return ServicioBienestar.create({
    nombre: data.nombre,
    duracion_minutos:
      data.duracion_minutos,
    precio: data.precio,
  });
};

export const update = async (
  id: number,
  data: any
) => {
  const servicio =
    await getById(id);

  await servicio.update(data);

  return servicio;
};

export const remove = async (
  id: number
) => {
  const servicio =
    await getById(id);

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

  await servicio.destroy();
};