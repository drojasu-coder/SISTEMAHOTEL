import { Op } from "sequelize";
import { validateDates, validateNotPast, getNights, calculateTotal } from "./reservaHabitacion.service";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";

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
    env.APP_TIMEZONE;

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
  imagen_key?: string | null;
}

interface UpdateHabitacionData {
  sucursal_id?: number;
  tipo_habitacion_id?: number;
  numero?: string;
  estado?: "disponible" | "ocupada" | "mantenimiento" | "limpieza";
  imagen_key?: string | null;
}

export async function serializeHabitacion(h: any): Promise<any> {
  if (!h) return null;
  const plain = typeof h.get === "function" ? h.get({ plain: true }) : { ...h };
  const effectiveKey = plain.imagen_key || plain.TipoHabitacion?.imagen_key || null;
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(effectiveKey);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(effectiveKey);

  if (plain.TipoHabitacion) {
    const tipoMedia = await s3Service.resolveMediaUrlWithExpiry(plain.TipoHabitacion.imagen_key);
    plain.TipoHabitacion.imagen_url = tipoMedia.url;
    plain.TipoHabitacion.imagen_expires_at = tipoMedia.expiresAt;
    plain.TipoHabitacion.imagen_creditos = getAssetCredits(plain.TipoHabitacion.imagen_key);
  }
  return plain;
}

export const getAllHabitaciones = async () => {
  const habitaciones = await Habitacion.findAll({
    include: [
      {
        model: TipoHabitacion,
        required: false,
      },
      {
        model: Sucursal,
        attributes: ["id", "nombre", "activa"],
        required: false,
      },
    ],
    order: [["id", "ASC"]],
  });
  return Promise.all(habitaciones.map(serializeHabitacion));
};

export const getHabitacionById = async (
  id: number
) => {
  const habitacion = await Habitacion.findByPk(id, {
    include: [
      {
        model: TipoHabitacion,
        required: false,
      },
      {
        model: Sucursal,
        attributes: ["id", "nombre", "activa"],
        required: false,
      },
    ],
  });

  if (!habitacion) {
    throw new AppError(
      404,
      "HABITACION_NOT_FOUND",
      "La habitación no fue encontrada"
    );
  }

  return serializeHabitacion(habitacion);
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

  const habitacion = await Habitacion.create({
    sucursal_id: data.sucursal_id,
    tipo_habitacion_id: data.tipo_habitacion_id,
    numero: data.numero,
    estado: data.estado,
    imagen_key: data.imagen_key,
  });

  return serializeHabitacion(habitacion);
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

  if (
    data.tipo_habitacion_id !== undefined &&
    data.tipo_habitacion_id !== habitacion.tipo_habitacion_id
  ) {
    const nuevoTipoHabitacion = await TipoHabitacion.findByPk(
      data.tipo_habitacion_id,
      {
        transaction,
        lock: transaction.LOCK.SHARE,
      }
    );

    if (!nuevoTipoHabitacion) {
      throw new AppError(
        404,
        "TIPO_HABITACION_NOT_FOUND",
        "El tipo de habitación no fue encontrado"
      );
    }

    const today = getTodayDate();
    const reservaConflicto = await ReservaHabitacion.findOne({
      where: {
        habitacion_id: id,
        estado: {
          [Op.in]: ["pendiente", "confirmada"],
        },
        fecha_salida: {
          [Op.gt]: today,
        },
        numero_huespedes: {
          [Op.gt]: nuevoTipoHabitacion.capacidad_maxima,
        },
      },
      order: [["numero_huespedes", "DESC"], ["fecha_entrada", "ASC"]],
      transaction,
    });

    if (reservaConflicto) {
      throw new AppError(
        409,
        "ROOM_TYPE_CHANGE_CAPACITY_CONFLICT",
        `No es posible cambiar la habitación ${habitacion.numero} al tipo "${nuevoTipoHabitacion.nombre}" (capacidad máxima: ${nuevoTipoHabitacion.capacidad_maxima} ${nuevoTipoHabitacion.capacidad_maxima === 1 ? "huésped" : "huéspedes"}) porque tiene reservas activas con ${reservaConflicto.numero_huespedes} huéspedes que superan dicho límite.`
      );
    }
  } else if (data.tipo_habitacion_id !== undefined) {
    const tipoHabitacion = await TipoHabitacion.findByPk(
      data.tipo_habitacion_id,
      {
        transaction,
        lock: transaction.LOCK.SHARE,
      }
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

  return serializeHabitacion(habitacion);
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

  return Promise.all(
    habitaciones.map(async (h: any) => {
      const tarifaNoche = Number(h.TipoHabitacion.tarifa_noche).toFixed(2);
      const totalEstimado = calculateTotal(
        query.fecha_entrada,
        query.fecha_salida,
        h.TipoHabitacion.tarifa_noche
      );

      const effectiveKey = h.imagen_key || h.TipoHabitacion?.imagen_key || null;
      const mediaResult = await s3Service.resolveMediaUrlWithExpiry(effectiveKey);
      const tipoMediaResult = await s3Service.resolveMediaUrlWithExpiry(h.TipoHabitacion?.imagen_key);

      return {
        id: h.id,
        numero: h.numero,
        estado: h.estado,
        sucursal_id: h.sucursal_id,
        tipo_habitacion_id: h.tipo_habitacion_id,
        imagen_key: h.imagen_key ?? null,
        imagen_url: mediaResult.url,
        imagen_expires_at: mediaResult.expiresAt,
        imagen_creditos: getAssetCredits(effectiveKey),
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
          imagen_key: h.TipoHabitacion.imagen_key ?? null,
          imagen_url: tipoMediaResult.url,
          imagen_expires_at: tipoMediaResult.expiresAt,
          imagen_creditos: getAssetCredits(h.TipoHabitacion.imagen_key),
        },
      };
    })
  );
};
