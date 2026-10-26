import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";
import { getTodayDate } from "./reservaHabitacion.service";

const db = require("../../models");

const { sequelize, TipoHabitacion, Habitacion, ReservaHabitacion } = db;

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

  return tipoHabitacion;
});

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
