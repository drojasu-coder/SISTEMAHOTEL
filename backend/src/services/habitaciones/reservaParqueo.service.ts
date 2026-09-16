import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";

const db = require("../../models");
const { ReservaParqueo, Parqueo, ReservaHabitacion } = db;

interface CreateReservaParqueoData {
  reserva_habitacion_id?: number;
  parqueo_id: number;
  fecha_entrada: string;
  fecha_salida?: string | null;
}

interface UpdateReservaParqueoData {
  reserva_habitacion_id?: number;
  parqueo_id?: number;
  fecha_entrada?: string;
  fecha_salida?: string | null;
}

const notFoundReserva = () =>
  new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");

const validateReferences = async (parqueoId: number, reservaHabitacionId?: number) => {
  if (!(await Parqueo.findByPk(parqueoId))) {
    throw new AppError(404, "PARQUEO_NOT_FOUND", "El parqueo no fue encontrado");
  }
  if (reservaHabitacionId !== undefined && !(await ReservaHabitacion.findByPk(reservaHabitacionId))) {
    throw notFoundReserva();
  }
};

const validateDates = (fechaEntrada: string, fechaSalida?: string | null) => {
  if (fechaSalida != null && new Date(fechaSalida) <= new Date(fechaEntrada)) {
    throw new AppError(
      422,
      "FECHAS_INVALIDAS",
      "La fecha de salida debe ser posterior a la fecha de entrada"
    );
  }
};

const validateOverlap = async (
  parqueoId: number,
  fechaEntrada: string,
  fechaSalida?: string | null,
  reservaId?: number
) => {
  const where: any = {
    parqueo_id: parqueoId,
    fecha_entrada: { [Op.lt]: fechaSalida ?? new Date("9999-12-31T23:59:59.999Z") },
    [Op.or]: [
      { fecha_salida: null },
      { fecha_salida: { [Op.gt]: fechaEntrada } },
    ],
  };
  if (reservaId !== undefined) {
    where.id = { [Op.ne]: reservaId };
  }

  if (await ReservaParqueo.findOne({ where })) {
    throw new AppError(
      409,
      "PARQUEO_NO_DISPONIBLE",
      "El parqueo ya está ocupado en ese rango de fechas"
    );
  }
};

export const getAllReservaParqueos = async () =>
  ReservaParqueo.findAll({ order: [["id", "ASC"]] });

export const getReservaParqueoById = async (id: number) => {
  const reservaParqueo = await ReservaParqueo.findByPk(id);
  if (!reservaParqueo) {
    throw new AppError(404, "RESERVA_PARQUEO_NOT_FOUND", "La reserva de parqueo no fue encontrada");
  }
  return reservaParqueo;
};

export const createReservaParqueo = async (data: CreateReservaParqueoData) => {
  validateDates(data.fecha_entrada, data.fecha_salida);
  await validateReferences(data.parqueo_id, data.reserva_habitacion_id);
  await validateOverlap(data.parqueo_id, data.fecha_entrada, data.fecha_salida);
  return ReservaParqueo.create(data);
};

export const updateReservaParqueo = async (id: number, data: UpdateReservaParqueoData) => {
  const reservaParqueo = await ReservaParqueo.findByPk(id);
  if (!reservaParqueo) {
    throw new AppError(404, "RESERVA_PARQUEO_NOT_FOUND", "La reserva de parqueo no fue encontrada");
  }

  const parqueoId = data.parqueo_id ?? reservaParqueo.parqueo_id;
  const fechaEntrada = data.fecha_entrada ?? reservaParqueo.fecha_entrada;
  const fechaSalida =
    data.fecha_salida !== undefined ? data.fecha_salida : reservaParqueo.fecha_salida;
  const reservaHabitacionId =
    data.reserva_habitacion_id !== undefined
      ? data.reserva_habitacion_id
      : reservaParqueo.reserva_habitacion_id;

  if (
    data.parqueo_id !== undefined ||
    data.reserva_habitacion_id !== undefined ||
    data.fecha_entrada !== undefined ||
    data.fecha_salida !== undefined
  ) {
    validateDates(fechaEntrada, fechaSalida);
    await validateReferences(parqueoId, reservaHabitacionId);
    await validateOverlap(parqueoId, fechaEntrada, fechaSalida, id);
  }

  await reservaParqueo.update(data);
  return reservaParqueo;
};

export const deleteReservaParqueo = async (id: number) => {
  const reservaParqueo = await ReservaParqueo.findByPk(id);
  if (!reservaParqueo) {
    throw new AppError(404, "RESERVA_PARQUEO_NOT_FOUND", "La reserva de parqueo no fue encontrada");
  }
  await reservaParqueo.destroy();
  return reservaParqueo;
};
