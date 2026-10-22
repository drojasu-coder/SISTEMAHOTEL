import { Op } from "sequelize";
import { validateDates, validateNotPast, getNights, calculateTotal } from "./reservaHabitacion.service";
import { AppError } from "../../utils/AppError";

const db = require("../../models");

const {
  Habitacion,
  Sucursal,
  TipoHabitacion,
  ReservaHabitacion,
} = db;

interface CreateHabitacionData {
  sucursal_id: number;
  tipo_habitacion_id: number;
  numero: string;
  estado?: "disponible" | "ocupada" | "mantenimiento" | "limpieza";
}

interface UpdateHabitacionData {
  sucursal_id?: number;
  tipo_habitacion_id?: number;
  numero?: string;
  estado?: "disponible" | "ocupada" | "mantenimiento" | "limpieza";
}

export const getAllHabitaciones = async () => {
  return await Habitacion.findAll({
    order: [["id", "ASC"]],
  });
};

export const getHabitacionById = async (
  id: number
) => {
  const habitacion = await Habitacion.findByPk(id);

  if (!habitacion) {
    throw new AppError(
      404,
      "HABITACION_NOT_FOUND",
      "La habitación no fue encontrada"
    );
  }

  return habitacion;
};

export const createHabitacion = async (
  data: CreateHabitacionData
) => {
  const sucursal = await Sucursal.findByPk(
    data.sucursal_id
  );

  if (!sucursal) {
    throw new AppError(
      404,
      "SUCURSAL_NOT_FOUND",
      "La sucursal no fue encontrada"
    );
  }

  const tipoHabitacion = await TipoHabitacion.findByPk(
    data.tipo_habitacion_id
  );

  if (!tipoHabitacion) {
    throw new AppError(
      404,
      "TIPO_HABITACION_NOT_FOUND",
      "El tipo de habitación no fue encontrado"
    );
  }

  const habitacionExistente = await Habitacion.findOne({
    where: {
      sucursal_id: data.sucursal_id,
      numero: data.numero,
    },
  });

  if (habitacionExistente) {
    throw new AppError(
      409,
      "HABITACION_NUMBER_ALREADY_EXISTS",
      "Ya existe una habitación con ese número en la sucursal"
    );
  }

  return await Habitacion.create({
    sucursal_id: data.sucursal_id,
    tipo_habitacion_id: data.tipo_habitacion_id,
    numero: data.numero,
    estado: data.estado,
  });
};

export const updateHabitacion = async (
  id: number,
  data: UpdateHabitacionData
) => {
  const habitacion = await Habitacion.findByPk(id);

  if (!habitacion) {
    throw new AppError(
      404,
      "HABITACION_NOT_FOUND",
      "La habitación no fue encontrada"
    );
  }

  if (data.sucursal_id !== undefined) {
    const sucursal = await Sucursal.findByPk(
      data.sucursal_id
    );

    if (!sucursal) {
      throw new AppError(
        404,
        "SUCURSAL_NOT_FOUND",
        "La sucursal no fue encontrada"
      );
    }
  }

  if (data.tipo_habitacion_id !== undefined) {
    const tipoHabitacion = await TipoHabitacion.findByPk(
      data.tipo_habitacion_id
    );

    if (!tipoHabitacion) {
      throw new AppError(
        404,
        "TIPO_HABITACION_NOT_FOUND",
        "El tipo de habitación no fue encontrado"
      );
    }
  }

  if (
    data.numero !== undefined ||
    data.sucursal_id !== undefined
  ) {
    const sucursalId =
      data.sucursal_id ?? habitacion.sucursal_id;

    const numero =
      data.numero ?? habitacion.numero;

    const habitacionExistente = await Habitacion.findOne({
      where: {
        sucursal_id: sucursalId,
        numero,
      },
    });

    if (
      habitacionExistente &&
      habitacionExistente.id !== id
    ) {
      throw new AppError(
        409,
        "HABITACION_NUMBER_ALREADY_EXISTS",
        "Ya existe una habitación con ese número en la sucursal"
      );
    }
  }

  await habitacion.update(data);

  return habitacion;
};

export const deleteHabitacion = async (
  id: number
) => {
  const habitacion = await Habitacion.findByPk(id);

  if (!habitacion) {
    throw new AppError(
      404,
      "HABITACION_NOT_FOUND",
      "La habitación no fue encontrada"
    );
  }

  const reservaHabitacion = await ReservaHabitacion.findOne({
    where: {
      habitacion_id: id,
    },
  });

  if (reservaHabitacion) {
    throw new AppError(
      409,
      "HABITACION_CON_RESERVAS",
      "No se puede eliminar la habitación porque tiene reservas asociadas"
    );
  }

  await habitacion.destroy();

  return habitacion;
};
export interface DisponibilidadHabitacionQueryData {
  sucursal_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  numero_huespedes: number;
  tipo_habitacion_id?: number;
}

export const getHabitacionesDisponibles = async (
  query: DisponibilidadHabitacionQueryData
) => {
  const sucursal = await Sucursal.findByPk(query.sucursal_id);

  if (!sucursal) {
    throw new AppError(
      404,
      "SUCURSAL_NOT_FOUND",
      "La sucursal no fue encontrada"
    );
  }

  validateDates(query.fecha_entrada, query.fecha_salida);
  validateNotPast(query.fecha_entrada);

  const noches = getNights(query.fecha_entrada, query.fecha_salida);

  const reservasSolapadas = await ReservaHabitacion.findAll({
    attributes: ["habitacion_id"],
    where: {
      estado: {
        [Op.in]: ["pendiente", "confirmada"],
      },
      fecha_entrada: {
        [Op.lt]: query.fecha_salida,
      },
      fecha_salida: {
        [Op.gt]: query.fecha_entrada,
      },
    },
    raw: true,
  });

  const habitacionIdsOcupadas = Array.from(
    new Set(reservasSolapadas.map((r: any) => r.habitacion_id))
  );

  const whereHabitacion: any = {
    sucursal_id: query.sucursal_id,
    estado: {
      [Op.ne]: "mantenimiento",
    },
  };

  if (habitacionIdsOcupadas.length > 0) {
    whereHabitacion.id = {
      [Op.notIn]: habitacionIdsOcupadas,
    };
  }

  if (query.tipo_habitacion_id !== undefined) {
    whereHabitacion.tipo_habitacion_id = query.tipo_habitacion_id;
  }

  const habitaciones = await Habitacion.findAll({
    where: whereHabitacion,
    include: [
      {
        model: TipoHabitacion,
        where: {
          capacidad_maxima: {
            [Op.gte]: query.numero_huespedes,
          },
        },
        required: true,
      },
      {
        model: Sucursal,
        attributes: ["id", "nombre", "activa"],
        required: false,
      },
    ],
    order: [["numero", "ASC"], ["id", "ASC"]],
  });

  return habitaciones.map((h: any) => {
    const tarifaNoche = Number(h.TipoHabitacion.tarifa_noche).toFixed(2);
    const totalEstimado = calculateTotal(
      query.fecha_entrada,
      query.fecha_salida,
      h.TipoHabitacion.tarifa_noche
    );

    return {
      id: h.id,
      numero: h.numero,
      estado: h.estado,
      sucursal_id: h.sucursal_id,
      tipo_habitacion_id: h.tipo_habitacion_id,
      noches,
      tarifa_noche: tarifaNoche,
      total_estimado: totalEstimado,
      Sucursal: h.Sucursal
        ? {
            id: h.Sucursal.id,
            nombre: h.Sucursal.nombre,
            activa: h.Sucursal.activa,
          }
        : undefined,
      TipoHabitacion: {
        id: h.TipoHabitacion.id,
        nombre: h.TipoHabitacion.nombre,
        capacidad_maxima: h.TipoHabitacion.capacidad_maxima,
        tarifa_noche: tarifaNoche,
        descripcion: h.TipoHabitacion.descripcion ?? null,
      },
    };
  });
};
