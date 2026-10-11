import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";

const db = require("../../models");

const {
  ReservaParqueo,
  Parqueo,
  ReservaHabitacion,
} = db;

type DateValue = string | Date;

interface CreateReservaParqueoData {
  reserva_habitacion_id?: number | null;
  parqueo_id: number;
  fecha_entrada: string;
  fecha_salida?: string | null;
}

interface UpdateReservaParqueoData {
  reserva_habitacion_id?: number | null;
  parqueo_id?: number;
  fecha_entrada?: string;
  fecha_salida?: string | null;
}

const notFoundReservaHabitacion = () =>
  new AppError(
    404,
    "RESERVA_HABITACION_NOT_FOUND",
    "La reserva de habitación no fue encontrada"
  );

const getTodayDate = () => {
  const timeZone =
    process.env.APP_TIMEZONE ||
    "America/Guatemala";

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(new Date());

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value;

  return `${year}-${month}-${day}`;
};

const isDateOnly = (
  value: unknown
) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );

const toDate = (
  value: DateValue
) =>
  value instanceof Date
    ? value
    : new Date(value);

const validateNotPast = (
  fechaEntrada: DateValue
) => {
  /**
   * Si recibimos únicamente YYYY-MM-DD,
   * permitimos el día actual completo.
   */
  if (
    isDateOnly(
      fechaEntrada
    )
  ) {
    if (
      (fechaEntrada as string) <
      getTodayDate()
    ) {
      throw new AppError(
        422,
        "PARKING_RESERVATION_DATE_IN_PAST",
        "La fecha de entrada del parqueo no puede estar en el pasado"
      );
    }

    return;
  }

  /**
   * Si recibimos fecha + hora,
   * comparamos el instante real.
   */
  const entrada =
    toDate(
      fechaEntrada
    );

  if (
    entrada.getTime() <
    Date.now()
  ) {
    throw new AppError(
      422,
      "PARKING_RESERVATION_DATE_IN_PAST",
      "La fecha y hora de entrada del parqueo no puede estar en el pasado"
    );
  }
};

const validateDates = (
  fechaEntrada: DateValue,
  fechaSalida?:
    | DateValue
    | null
) => {
  if (
    fechaSalida != null &&
    toDate(
      fechaSalida
    ) <=
      toDate(
        fechaEntrada
      )
  ) {
    throw new AppError(
      422,
      "FECHAS_INVALIDAS",
      "La fecha de salida debe ser posterior a la fecha de entrada"
    );
  }
};

const validateReferences =
  async (
    parqueoId: number,
    reservaHabitacionId?:
      | number
      | null
  ) => {
    const parqueo =
      await Parqueo.findByPk(
        parqueoId
      );

    if (!parqueo) {
      throw new AppError(
        404,
        "PARQUEO_NOT_FOUND",
        "El parqueo no fue encontrado"
      );
    }

    let reservaHabitacion =
      null;

    /**
     * La relación con reserva de habitación
     * es realmente opcional.
     *
     * Tanto undefined como null significan
     * "sin reserva de habitación asociada".
     */
    if (
      reservaHabitacionId !=
      null
    ) {
      reservaHabitacion =
        await ReservaHabitacion.findByPk(
          reservaHabitacionId
        );

      if (
        !reservaHabitacion
      ) {
        throw notFoundReservaHabitacion();
      }
    }

    return {
      parqueo,
      reservaHabitacion,
    };
  };

const validateParqueoReservable =
  (
    parqueo: any
  ) => {
    /**
     * No bloqueamos "ocupado" automáticamente,
     * porque puede reflejar el estado físico
     * actual y la reserva podría ser futura.
     *
     * Mantenimiento sí impide nuevas reservas.
     */
    if (
      parqueo.estado ===
      "mantenimiento"
    ) {
      throw new AppError(
        409,
        "PARQUEO_EN_MANTENIMIENTO",
        "El parqueo se encuentra en mantenimiento y no puede ser reservado"
      );
    }
  };

const validateOverlap =
  async (
    parqueoId: number,
    fechaEntrada:
      DateValue,
    fechaSalida?:
      | DateValue
      | null,
    reservaId?: number
  ) => {
    const where: any = {
      parqueo_id:
        parqueoId,

      fecha_entrada: {
        [Op.lt]:
          fechaSalida ??
          new Date(
            "9999-12-31T23:59:59.999Z"
          ),
      },

      [Op.or]: [
        {
          fecha_salida:
            null,
        },
        {
          fecha_salida: {
            [Op.gt]:
              fechaEntrada,
          },
        },
      ],
    };

    /**
     * Durante PATCH excluimos
     * la propia reserva.
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

    const reservaExistente =
      await ReservaParqueo.findOne({
        where,
      });

    if (
      reservaExistente
    ) {
      throw new AppError(
        409,
        "PARQUEO_NO_DISPONIBLE",
        "El parqueo ya está ocupado en ese rango de fechas"
      );
    }
  };

export const getAllReservaParqueos =
  async () =>
    ReservaParqueo.findAll({
      order: [["id", "ASC"]],
    });

export const getReservaParqueoById =
  async (
    id: number
  ) => {
    const reservaParqueo =
      await ReservaParqueo.findByPk(
        id
      );

    if (!reservaParqueo) {
      throw new AppError(
        404,
        "RESERVA_PARQUEO_NOT_FOUND",
        "La reserva de parqueo no fue encontrada"
      );
    }

    return reservaParqueo;
  };

export const createReservaParqueo =
  async (
    data:
      CreateReservaParqueoData
  ) => {
    validateDates(
      data.fecha_entrada,
      data.fecha_salida
    );

    validateNotPast(
      data.fecha_entrada
    );

    const {
      parqueo,
    } =
      await validateReferences(
        data.parqueo_id,
        data.reserva_habitacion_id
      );

    validateParqueoReservable(
      parqueo
    );

    await validateOverlap(
      data.parqueo_id,
      data.fecha_entrada,
      data.fecha_salida
    );

    return ReservaParqueo.create(
      data
    );
  };

export const updateReservaParqueo =
  async (
    id: number,
    data:
      UpdateReservaParqueoData
  ) => {
    const reservaParqueo =
      await ReservaParqueo.findByPk(
        id
      );

    if (!reservaParqueo) {
      throw new AppError(
        404,
        "RESERVA_PARQUEO_NOT_FOUND",
        "La reserva de parqueo no fue encontrada"
      );
    }

    const parqueoId =
      data.parqueo_id ??
      reservaParqueo.parqueo_id;

    const fechaEntrada =
      data.fecha_entrada ??
      reservaParqueo.fecha_entrada;

    /**
     * Aquí NO utilizamos ?? porque
     * null es un valor válido para
     * fecha_salida.
     */
    const fechaSalida =
      data.fecha_salida !==
      undefined
        ? data.fecha_salida
        : reservaParqueo.fecha_salida;

    /**
     * Lo mismo para reserva_habitacion_id:
     *
     * undefined = no cambiar
     * null      = desvincular
     * number    = asociar
     */
    const reservaHabitacionId =
      data.reserva_habitacion_id !==
      undefined
        ? data.reserva_habitacion_id
        : reservaParqueo.reserva_habitacion_id;

    validateDates(
      fechaEntrada,
      fechaSalida
    );

    validateNotPast(
      fechaEntrada
    );

    const {
      parqueo,
    } =
      await validateReferences(
        parqueoId,
        reservaHabitacionId
      );

    validateParqueoReservable(
      parqueo
    );

    await validateOverlap(
      parqueoId,
      fechaEntrada,
      fechaSalida,
      id
    );

    await reservaParqueo.update(
      data
    );

    return reservaParqueo;
  };

export const deleteReservaParqueo =
  async (
    id: number
  ) => {
    const reservaParqueo =
      await ReservaParqueo.findByPk(
        id
      );

    if (!reservaParqueo) {
      throw new AppError(
        404,
        "RESERVA_PARQUEO_NOT_FOUND",
        "La reserva de parqueo no fue encontrada"
      );
    }

    /**
     * Actualmente el modelo no posee estado,
     * por lo que DELETE continúa siendo físico.
     *
     * La conservación de historial se revisará
     * posteriormente como decisión de diseño.
     */
    await reservaParqueo.destroy();

    return reservaParqueo;
  };
