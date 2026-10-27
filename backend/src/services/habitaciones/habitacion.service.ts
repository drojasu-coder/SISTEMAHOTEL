import { Op } from "sequelize";

import { AppError } from "../../utils/AppError";

const db = require("../../models");

const {
  sequelize,
  Habitacion,
  Sucursal,
  TipoHabitacion,
  ReservaHabitacion,
} = db;

const getTodayDate = () => {
  const timeZone =
    process.env.APP_TIMEZONE ||
    "America/Guatemala";

  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const getPart = (type: string) =>
    parts.find(
      (part) => part.type === type
    )?.value;

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

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

interface DisponibilidadHabitacionQuery {
  sucursal_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  numero_huespedes: number;
  tipo_habitacion_id?: number;
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

export const getHabitacionesDisponibles = async (
  query: DisponibilidadHabitacionQuery
) => {
  if (
    query.fecha_salida <=
    query.fecha_entrada
  ) {
    throw new AppError(
      422,
      "FECHAS_INVALIDAS",
      "La fecha de salida debe ser posterior a la fecha de entrada"
    );
  }

  if (
    query.fecha_entrada <
    getTodayDate()
  ) {
    throw new AppError(
      422,
      "ROOM_RESERVATION_DATE_IN_PAST",
      "La fecha de entrada no puede estar en el pasado"
    );
  }

  const sucursal =
    await Sucursal.findByPk(
      query.sucursal_id
    );

  if (!sucursal) {
    throw new AppError(
      404,
      "SUCURSAL_NOT_FOUND",
      "La sucursal no fue encontrada"
    );
  }

  const noches = Math.round(
    (
      Date.parse(
        `${query.fecha_salida}T00:00:00Z`
      ) -
      Date.parse(
        `${query.fecha_entrada}T00:00:00Z`
      )
    ) /
      (1000 * 60 * 60 * 24)
  );

  const habitaciones =
    await Habitacion.findAll({
      where: {
        sucursal_id:
          query.sucursal_id,
        estado: {
          [Op.ne]:
            "mantenimiento",
        },
        ...(query.tipo_habitacion_id !==
        undefined
          ? {
              tipo_habitacion_id:
                query.tipo_habitacion_id,
            }
          : {}),
      },
      include: [
        {
          model: TipoHabitacion,
          required: true,
          where: {
            capacidad_maxima: {
              [Op.gte]:
                query.numero_huespedes,
            },
          },
        },
        {
          model: Sucursal,
          attributes: [
            "id",
            "nombre",
            "direccion",
            "ciudad",
            "activa",
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

  if (habitaciones.length === 0) {
    return [];
  }

  const reservasBloqueantes =
    await ReservaHabitacion.findAll({
      attributes: [
        "habitacion_id",
      ],
      where: {
        habitacion_id: {
          [Op.in]:
            habitaciones.map(
              (habitacion: any) =>
                habitacion.id
            ),
        },
        estado: {
          [Op.in]: [
            "pendiente",
            "confirmada",
          ],
        },
        fecha_entrada: {
          [Op.lt]:
            query.fecha_salida,
        },
        fecha_salida: {
          [Op.gt]:
            query.fecha_entrada,
        },
      },
    });

  const habitacionesBloqueadas =
    new Set(
      reservasBloqueantes.map(
        (reserva: any) =>
          reserva.habitacion_id
      )
    );

  return habitaciones
    .filter(
      (habitacion: any) =>
        !habitacionesBloqueadas.has(
          habitacion.id
        )
    )
    .map((habitacion: any) => {
      const data =
        habitacion.toJSON();
      const tarifaNoche =
        Number(
          data.TipoHabitacion
            .tarifa_noche
        );

      return {
        ...data,
        noches,
        tarifa_noche:
          tarifaNoche.toFixed(2),
        total_estimado:
          (
            Math.round(
              tarifaNoche *
                noches *
                100
            ) / 100
          ).toFixed(2),
      };
    });
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
) => sequelize.transaction(async (transaction: any) => {
  /**
   * Esta ruta bloquea Habitación objetivo -> consulta reservas sin bloquearlas.
   * Crear reserva usa Habitación -> disponibilidad -> INSERT; el PATCH de
   * reserva conserva Reserva origen -> Habitación destino -> disponibilidad.
   * No tomar luego locks de Reserva evita invertir el orden de QA-023.
   */
  const habitacion = await Habitacion.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!habitacion) {
    throw new AppError(
      404,
      "HABITACION_NOT_FOUND",
      "La habitación no fue encontrada"
    );
  }

  if (data.sucursal_id !== undefined) {
    const sucursal = await Sucursal.findByPk(
      data.sucursal_id,
      { transaction }
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
      data.tipo_habitacion_id,
      { transaction }
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
      transaction,
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

  if (
    data.estado === "mantenimiento" &&
    habitacion.estado !== "mantenimiento"
  ) {
    const reservaFuturaActiva =
      await ReservaHabitacion.findOne({
        where: {
          habitacion_id: id,
          estado: {
            [Op.in]: [
              "pendiente",
              "confirmada",
            ],
          },
          fecha_salida: {
            [Op.gt]: getTodayDate(),
          },
        },
        transaction,
      });

    if (reservaFuturaActiva) {
      throw new AppError(
        409,
        "ROOM_HAS_FUTURE_RESERVATIONS",
        "La habitación tiene reservas futuras activas y no puede entrar en mantenimiento"
      );
    }
  }

  await habitacion.update(data, { transaction });

  return habitacion;
});

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
