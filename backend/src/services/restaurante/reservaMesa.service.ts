import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";

const db = require("../../models");

const {
  ReservaMesa,
  Mesa,
  Usuario,
} = db;

interface CreateReservaMesaData {
  usuario_id: number;
  mesa_id: number;
  fecha: string;
  hora: string;
  numero_comensales: number;
}

type EstadoReservaMesa =
  | "confirmada"
  | "cancelada";

const reservaMesaInclude = [
  {
    model: Mesa,
    attributes: [
      "id",
      "zona",
      "capacidad",
      "estado",
    ],
  },
  {
    model: Usuario,
    attributes: [
      "id",
      "nombre",
      "email",
    ],
  },
];

/**
 * Devuelve la fecha y hora actuales
 * en la zona horaria utilizada por el hotel.
 */
const getCurrentHotelDateTime = () => {
  const timeZone = env.APP_TIMEZONE;

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(new Date());

  const getPart = (
    type: string
  ) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value ?? "";

  return {
    fecha:
      `${getPart("year")}-${getPart("month")}-${getPart("day")}`,

    hora:
      `${getPart("hour")}:${getPart("minute")}:${getPart("second")}`,
  };
};

/**
 * Normaliza HH:MM a HH:MM:SS.
 */
const normalizeTime = (
  hora: string
) =>
  hora.length === 5
    ? `${hora}:00`
    : hora;

/**
 * Impide reservar:
 *
 * - un día anterior al actual;
 * - una hora que ya pasó cuando
 *   la reserva es para hoy.
 */
const validateReservationDateTime = (
  fecha: string,
  hora: string
) => {
  const current =
    getCurrentHotelDateTime();

  if (
    fecha <
    current.fecha
  ) {
    throw new AppError(
      422,
      "TABLE_RESERVATION_DATE_IN_PAST",
      "La fecha de la reserva no puede estar en el pasado"
    );
  }

  if (
    fecha ===
      current.fecha &&
    normalizeTime(hora) <
      current.hora
  ) {
    throw new AppError(
      422,
      "TABLE_RESERVATION_TIME_IN_PAST",
      "La hora de la reserva no puede estar en el pasado"
    );
  }
};

/**
 * Busca y devuelve la mesa.
 */
const getMesaOrFail = async (
  mesaId: number
) => {
  const mesa =
    await Mesa.findByPk(
      mesaId
    );

  if (!mesa) {
    throw new AppError(
      404,
      "TABLE_NOT_FOUND",
      "La mesa solicitada no existe"
    );
  }

  return mesa;
};

/**
 * No permitimos nuevas reservas
 * mientras la mesa esté en mantenimiento.
 *
 * No bloqueamos "ocupada" porque puede
 * representar el estado físico actual.
 */
const validateMesaReservable = (
  mesa: any
) => {
  if (
    mesa.estado ===
    "mantenimiento"
  ) {
    throw new AppError(
      409,
      "TABLE_IN_MAINTENANCE",
      "La mesa se encuentra en mantenimiento y no puede ser reservada"
    );
  }
};

const validateCapacity = (
  numeroComensales: number,
  capacidad: number
) => {
  if (
    numeroComensales >
    capacidad
  ) {
    throw new AppError(
      422,
      "TABLE_CAPACITY_EXCEEDED",
      `La mesa seleccionada solo tiene capacidad para ${capacidad} personas`
    );
  }
};

/**
 * Con el modelo actual cada reserva
 * representa una hora concreta.
 *
 * Por eso la colisión se define como:
 *
 * misma mesa
 * + misma fecha
 * + misma hora
 * + confirmada
 */
const validateAvailability =
  async (
    mesaId: number,
    fecha: string,
    hora: string,
    reservaId?: number
  ) => {
    const where: any = {
      mesa_id:
        mesaId,

      fecha,

      hora,

      estado:
        "confirmada",
    };

    /**
     * Al reactivar una reserva,
     * excluimos la propia.
     */
    if (
      reservaId !==
      undefined
    ) {
      where.id = {
        [Op.ne]:
          reservaId,
      };
    }

    const existente =
      await ReservaMesa.findOne({
        where,
      });

    if (existente) {
      throw new AppError(
        409,
        "TABLE_UNAVAILABLE",
        "La mesa ya se encuentra reservada para esa fecha y hora"
      );
    }
  };

export const getAll =
  async () => {
    return ReservaMesa.findAll(
      {
        include:
          reservaMesaInclude,

        order: [
          [
            "fecha",
            "DESC",
          ],
          [
            "hora",
            "DESC",
          ],
        ],
      }
    );
  };

export const getById =
  async (
    id: number
  ) => {
    const reserva =
      await ReservaMesa.findByPk(
        id,
        {
          include:
            reservaMesaInclude,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "TABLE_RESERVATION_NOT_FOUND",
        "La reserva de mesa solicitada no existe"
      );
    }

    return reserva;
  };

export const create =
  async (
    data:
      CreateReservaMesaData
  ) => {
    /**
     * Regla 1:
     * fecha/hora no pueden estar
     * en el pasado.
     */
    validateReservationDateTime(
      data.fecha,
      data.hora
    );

    /**
     * Regla 2:
     * la mesa debe existir.
     */
    const mesa =
      await getMesaOrFail(
        data.mesa_id
      );

    /**
     * Regla 3:
     * mantenimiento impide reservar.
     */
    validateMesaReservable(
      mesa
    );

    /**
     * Regla 4:
     * respetar la capacidad máxima.
     */
    validateCapacity(
      data.numero_comensales,
      mesa.capacidad
    );

    /**
     * Regla 5:
     * evitar dos reservas confirmadas
     * para la misma mesa/fecha/hora.
     */
    await validateAvailability(
      data.mesa_id,
      data.fecha,
      data.hora
    );

    const reserva =
      await ReservaMesa.create({
        usuario_id:
          data.usuario_id,

        mesa_id:
          data.mesa_id,

        fecha:
          data.fecha,

        hora:
          data.hora,

        numero_comensales:
          data.numero_comensales,

        estado:
          "confirmada",
      });

    return getById(
      reserva.id
    );
  };

export const updateStatus =
  async (
    id: number,
    estado:
      EstadoReservaMesa
  ) => {
    const reserva =
      await ReservaMesa.findByPk(
        id
      );

    if (!reserva) {
      throw new AppError(
        404,
        "TABLE_RESERVATION_NOT_FOUND",
        "La reserva de mesa solicitada no existe"
      );
    }

    if (
      reserva.estado ===
      estado
    ) {
      throw new AppError(
        409,
        "TABLE_RESERVATION_STATUS_UNCHANGED",
        `La reserva ya se encuentra en estado ${estado}`
      );
    }

    /**
     * Si una reserva cancelada vuelve
     * a confirmarse, debemos ejecutar
     * otra vez las reglas que afectan
     * disponibilidad.
     */
    if (
      estado ===
      "confirmada"
    ) {
      validateReservationDateTime(
        reserva.fecha,
        reserva.hora
      );

      const mesa =
        await getMesaOrFail(
          reserva.mesa_id
        );

      validateMesaReservable(
        mesa
      );

      validateCapacity(
        reserva.numero_comensales,
        mesa.capacidad
      );

      await validateAvailability(
        reserva.mesa_id,
        reserva.fecha,
        reserva.hora,
        id
      );
    }

    await reserva.update({
      estado,
    });

    return getById(id);
  };