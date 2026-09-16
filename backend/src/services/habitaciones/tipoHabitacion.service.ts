import { AppError } from "../../utils/AppError";

const db = require("../../models");

const { TipoHabitacion, Habitacion } = db;

interface CreateTipoHabitacionData {
  nombre: string;
  capacidad_maxima: number;
  tarifa_noche: number;
  descripcion?: string | null;
}

interface UpdateTipoHabitacionData {
  nombre?: string;
  capacidad_maxima?: number;
  tarifa_noche?: number;
  descripcion?: string | null;
}

export const getAllTipoHabitaciones = async () => {
  return await TipoHabitacion.findAll({
    order: [["id", "ASC"]],
  });
};

export const getTipoHabitacionById = async (id: number) => {
  const tipoHabitacion = await TipoHabitacion.findByPk(id);

  if (!tipoHabitacion) {
    throw new AppError(
      404,
      "TIPO_HABITACION_NOT_FOUND",
      "El tipo de habitación no fue encontrado"
    );
  }

  return tipoHabitacion;
};

export const createTipoHabitacion = async (
  data: CreateTipoHabitacionData
) => {
  return await TipoHabitacion.create({
    nombre: data.nombre,
    capacidad_maxima: data.capacidad_maxima,
    tarifa_noche: data.tarifa_noche,
    descripcion: data.descripcion,
  });
};

export const updateTipoHabitacion = async (
  id: number,
  data: UpdateTipoHabitacionData
) => {
  const tipoHabitacion = await getTipoHabitacionById(id);

  await tipoHabitacion.update(data);

  return tipoHabitacion;
};

export const deleteTipoHabitacion = async (id: number) => {
  const tipoHabitacion = await getTipoHabitacionById(id);

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
