import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";
import { ROLES, Role } from "../../constants/roles";

export interface RequesterContext {
  id: number;
  rol: Role;
}

const isAdministrativeRole = (role?: Role) =>
  role === ROLES.ADMIN ||
  role === ROLES.RECEPCIONISTA ||
  role === ROLES.GERENTE_HABITACIONES;

const db = require("../../models");
const { ReservaHabitacion, Usuario, Habitacion, TipoHabitacion } = db;

interface CreateReservaHabitacionData {
  usuario_id: number;
  habitacion_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  numero_huespedes: number;
}

interface UpdateReservaHabitacionData {
  usuario_id?: number;
  habitacion_id?: number;
  fecha_entrada?: string;
  fecha_salida?: string;
  numero_huespedes?: number;
  estado?: "pendiente" | "confirmada" | "cancelada" | "finalizada" | "expirada";
}

const reservationInclude = [
  {
    model: Usuario,
    attributes: [
      "id",
      "nombre",
      "email",
      "rol",
      "telefono",
      "activo",
      "createdAt",
      "updatedAt",
    ],
  },
  { model: Habitacion, include: [{ model: TipoHabitacion }] },
];

const validateDates = (fechaEntrada: string, fechaSalida: string) => {
  if (fechaSalida <= fechaEntrada) {
    throw new AppError(
      422,
      "FECHAS_INVALIDAS",
      "La fecha de salida debe ser posterior a la fecha de entrada"
    );
  }
};

const validateCapacidad = (numeroHuespedes: number, capacidadMaxima: number) => {
  if (numeroHuespedes > capacidadMaxima) {
    throw new AppError(
      422,
      "CAPACIDAD_EXCEDIDA",
      "El número de huéspedes excede la capacidad máxima de la habitación"
    );
  }
};

const getNights = (fechaEntrada: string, fechaSalida: string) =>
  Math.round(
    (Date.parse(`${fechaSalida}T00:00:00Z`) -
      Date.parse(`${fechaEntrada}T00:00:00Z`)) /
      (1000 * 60 * 60 * 24)
  );

const validateReferences = async (usuarioId: number, habitacionId: number) => {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) {
    throw new AppError(404, "USUARIO_NOT_FOUND", "El usuario no fue encontrado");
  }

  const habitacion = await Habitacion.findByPk(habitacionId, {
    include: [{ model: TipoHabitacion }],
  });
  if (!habitacion || !habitacion.TipoHabitacion) {
    throw new AppError(404, "HABITACION_NOT_FOUND", "La habitación no fue encontrada");
  }

  return habitacion;
};

const validateOverlap = async (
  habitacionId: number,
  fechaEntrada: string,
  fechaSalida: string,
  reservaId?: number
) => {
  const where: any = {
    habitacion_id: habitacionId,
    estado: { [Op.in]: ["pendiente", "confirmada"] },
    fecha_entrada: { [Op.lt]: fechaSalida },
    fecha_salida: { [Op.gt]: fechaEntrada },
  };
  if (reservaId !== undefined) {
    where.id = { [Op.ne]: reservaId };
  }

  const reservaExistente = await ReservaHabitacion.findOne({ where });
  if (reservaExistente) {
    throw new AppError(
      409,
      "HABITACION_NO_DISPONIBLE",
      "La habitación ya está reservada en esas fechas"
    );
  }
};

const calculateTotal = (fechaEntrada: string, fechaSalida: string, tarifaNoche: unknown) =>
  (getNights(fechaEntrada, fechaSalida) * Number(tarifaNoche)).toFixed(2);

export const getAllReservaHabitaciones = async (requester?: RequesterContext) => {
  const where: Record<string, unknown> = {};
  if (requester && !isAdministrativeRole(requester.rol)) {
    where.usuario_id = requester.id;
  }

  return ReservaHabitacion.findAll({
    where,
    include: reservationInclude,
    order: [["id", "ASC"]],
  });
};

export const getReservaHabitacionById = async (
  id: number,
  requester?: RequesterContext
) => {
  const reservaHabitacion = await ReservaHabitacion.findByPk(id, {
    include: reservationInclude,
  });
  if (!reservaHabitacion) {
    throw new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");
  }
  if (requester && !isAdministrativeRole(requester.rol)) {
    if (reservaHabitacion.usuario_id !== requester.id) {
      throw new AppError(
        403,
        "INSUFFICIENT_PERMISSIONS",
        "No tiene permisos para acceder a esta reserva de habitación"
      );
    }
  }
  return reservaHabitacion;
};

export const createReservaHabitacion = async (data: CreateReservaHabitacionData) => {
  validateDates(data.fecha_entrada, data.fecha_salida);
  const habitacion = await validateReferences(data.usuario_id, data.habitacion_id);
  validateCapacidad(data.numero_huespedes, habitacion.TipoHabitacion.capacidad_maxima);
  await validateOverlap(data.habitacion_id, data.fecha_entrada, data.fecha_salida);

  const total = calculateTotal(
    data.fecha_entrada,
    data.fecha_salida,
    habitacion.TipoHabitacion.tarifa_noche
  );
  return ReservaHabitacion.create({
    usuario_id: data.usuario_id,
    habitacion_id: data.habitacion_id,
    fecha_entrada: data.fecha_entrada,
    fecha_salida: data.fecha_salida,
    numero_huespedes: data.numero_huespedes,
    estado: "pendiente",
    total,
  });
};

export const updateReservaHabitacion = async (
  id: number,
  data: UpdateReservaHabitacionData
) => {
  const reservaHabitacion = await ReservaHabitacion.findByPk(id);
  if (!reservaHabitacion) {
    throw new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");
  }

  if (data.usuario_id !== undefined) {
    const usuario = await Usuario.findByPk(data.usuario_id);
    if (!usuario) {
      throw new AppError(404, "USUARIO_NOT_FOUND", "El usuario no fue encontrado");
    }
  }

  const fechaEntrada = data.fecha_entrada ?? reservaHabitacion.fecha_entrada;
  const fechaSalida = data.fecha_salida ?? reservaHabitacion.fecha_salida;
  const habitacionId = data.habitacion_id ?? reservaHabitacion.habitacion_id;
  let total: string | undefined;

  if (
    data.fecha_entrada !== undefined ||
    data.fecha_salida !== undefined ||
    data.habitacion_id !== undefined ||
    data.numero_huespedes !== undefined
  ) {
    validateDates(fechaEntrada, fechaSalida);
    const habitacion = await validateReferences(
      data.usuario_id ?? reservaHabitacion.usuario_id,
      habitacionId
    );
    const numeroHuespedes = data.numero_huespedes ?? reservaHabitacion.numero_huespedes;
    validateCapacidad(numeroHuespedes, habitacion.TipoHabitacion.capacidad_maxima);
    await validateOverlap(habitacionId, fechaEntrada, fechaSalida, id);
    total = calculateTotal(fechaEntrada, fechaSalida, habitacion.TipoHabitacion.tarifa_noche);
  }

  const updateData: Record<string, unknown> = {
    ...(data.usuario_id !== undefined ? { usuario_id: data.usuario_id } : {}),
    ...(data.habitacion_id !== undefined ? { habitacion_id: data.habitacion_id } : {}),
    ...(data.fecha_entrada !== undefined ? { fecha_entrada: data.fecha_entrada } : {}),
    ...(data.fecha_salida !== undefined ? { fecha_salida: data.fecha_salida } : {}),
    ...(data.numero_huespedes !== undefined ? { numero_huespedes: data.numero_huespedes } : {}),
    ...(data.estado !== undefined ? { estado: data.estado } : {}),
    ...(total !== undefined ? { total } : {}),
  };
  await reservaHabitacion.update(updateData);
  return reservaHabitacion;
};

export const deleteReservaHabitacion = async (id: number) => {
  const reservaHabitacion = await ReservaHabitacion.findByPk(id);
  if (!reservaHabitacion) {
    throw new AppError(404, "RESERVA_HABITACION_NOT_FOUND", "La reserva de habitación no fue encontrada");
  }

  await reservaHabitacion.update({ estado: "cancelada" });
  return reservaHabitacion;
};
