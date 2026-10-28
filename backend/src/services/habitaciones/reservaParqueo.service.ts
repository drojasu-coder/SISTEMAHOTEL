import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import { SedeScope, assertSedeAccess, sedeWhere } from "../../utils/sedeScope";

const db = require("../../models");

const {
  sequelize,
  ReservaParqueo,
  Parqueo,
  ReservaHabitacion,
  Habitacion,
} = db;

/**
 * Alcance por sede (ver utils/sedeScope): el parqueo y, si existe, la reserva
 * de habitación vinculada deben pertenecer a sedes autorizadas, y además a la
 * misma sede: un parqueo de una sede no puede asociarse a una estancia de otra.
 */
const GLOBAL_SCOPE: SedeScope = { global: true };

const assertReservaHabitacionVinculable = async (
  reservaHabitacion: any,
  parqueo: any,
  scope: SedeScope,
  transaction?: any
) => {
  if (!reservaHabitacion) return;
  const habitacion = await Habitacion.findByPk(
    reservaHabitacion.habitacion_id,
    { attributes: ["id", "sucursal_id"], transaction }
  );
  assertSedeAccess(scope, habitacion?.sucursal_id);
  if (Number(habitacion?.sucursal_id) !== Number(parqueo.sucursal_id)) {
    throw new AppError(
      409,
      "PARQUEO_SEDE_MISMATCH",
      "El parqueo y la reserva de habitación vinculada deben pertenecer a la misma sede"
    );
  }
};

const findReservaParqueoEnAlcance = async (
  id: number,
  scope: SedeScope,
  options: Record<string, unknown> = {}
) => {
  const reservaParqueo = await ReservaParqueo.findByPk(id, options);
  if (!reservaParqueo) {
    throw new AppError(
      404,
      "RESERVA_PARQUEO_NOT_FOUND",
      "La reserva de parqueo no fue encontrada"
    );
  }
  if (!scope.global) {
    // Lectura sin bloqueo del parqueo actual: no altera el orden Reserva -> Parqueo destino.
    const parqueoActual = await Parqueo.findByPk(reservaParqueo.parqueo_id, {
      attributes: ["id", "sucursal_id"],
      transaction: options.transaction,
    });
    assertSedeAccess(scope, parqueoActual?.sucursal_id);
  }
  return reservaParqueo;
};

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
  const timeZone = env.APP_TIMEZONE;

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

/**
 * Variante transaccional de validateReferences.
 *
 * Bloquea la fila del parqueo con SELECT ... FOR UPDATE
 * para serializar reservas concurrentes sobre el mismo
 * espacio de estacionamiento.
 */
const validateLockedReferences =
  async (
    parqueoId: number,
    reservaHabitacionId:
      | number
      | null
      | undefined,
    transaction: any,
    scope: SedeScope = GLOBAL_SCOPE
  ) => {
    const parqueo =
      await Parqueo.findByPk(
        parqueoId,
        {
          transaction,
          lock:
            transaction
              .LOCK
              .UPDATE,
        }
      );

    if (!parqueo) {
      throw new AppError(
        404,
        "PARQUEO_NOT_FOUND",
        "El parqueo no fue encontrado"
      );
    }

    assertSedeAccess(scope, parqueo.sucursal_id);

    let reservaHabitacion =
      null;
    if (
      reservaHabitacionId !=
      null
    ) {
      reservaHabitacion =
        await ReservaHabitacion.findByPk(
          reservaHabitacionId,
          {
            transaction,
          }
        );
      if (
        !reservaHabitacion
      ) {
        throw notFoundReservaHabitacion();
      }
      await assertReservaHabitacionVinculable(
        reservaHabitacion,
        parqueo,
        scope,
        transaction
      );
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
    reservaId?: number,
    transaction?: any
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
        transaction,
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
  async (scope: SedeScope = GLOBAL_SCOPE) =>
    ReservaParqueo.findAll({
      ...(scope.global
        ? {}
        : {
            include: [
              {
                model: Parqueo,
                attributes: [],
                where: sedeWhere(scope),
                required: true,
              },
            ],
          }),
      order: [["id", "ASC"]],
    });

export const getReservaParqueoById =
  async (
    id: number,
    scope: SedeScope = GLOBAL_SCOPE
  ) =>
    findReservaParqueoEnAlcance(id, scope);

export const createReservaParqueo =
  async (
    data:
      CreateReservaParqueoData,
    scope: SedeScope = GLOBAL_SCOPE
  ) => {
    /**
     * Validaciones que no requieren acceso a BD.
     */
    validateDates(
      data.fecha_entrada,
      data.fecha_salida
    );

    validateNotPast(
      data.fecha_entrada
    );

    /**
     * Disponibilidad e INSERT ocurren dentro
     * de la misma transacción.
     *
     * El lock sobre Parqueo impide que varias
     * solicitudes concurrentes comprueben
     * disponibilidad antes de que exista la
     * primera reserva persistida.
     */
    return sequelize.transaction(
      async (
        transaction: any
      ) => {
        const {
          parqueo,
        } =
          await validateLockedReferences(
            data.parqueo_id,
            data.reserva_habitacion_id,
            transaction,
            scope
          );

        validateParqueoReservable(
          parqueo
        );

        /**
         * El check de traslape ocurre después
         * de adquirir el bloqueo de la fila.
         */
        await validateOverlap(
          data.parqueo_id,
          data.fecha_entrada,
          data.fecha_salida,
          undefined,
          transaction
        );

        /**
         * El INSERT pertenece a la misma
         * transacción que el check.
         */
        return ReservaParqueo.create(
          data,
          {
            transaction,
          }
        );
      }
    );
  };

export const updateReservaParqueo =
  async (
    id: number,
    data:
      UpdateReservaParqueoData,
    scope: SedeScope = GLOBAL_SCOPE
  ) => {
    /**
     * PATCH completo dentro de una transacción.
     *
     * Bloqueamos:
     * 1. La propia reserva, para impedir dos PATCH
     *    simultáneos sobre el mismo registro.
     * 2. El parqueo destino, para serializar todas
     *    las actualizaciones que intenten ocuparlo.
     *
     * De esta forma, validateOverlap() y UPDATE
     * forman una operación atómica.
     */
    return sequelize.transaction(
      async (
        transaction: any
      ) => {
        const reservaParqueo =
          await findReservaParqueoEnAlcance(
            id,
            scope,
            {
              transaction,
              lock:
                transaction
                  .LOCK
                  .UPDATE,
            }
          );

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

        /**
         * Bloqueamos el parqueo destino.
         *
         * Si 20 PATCH intentan mover reservas
         * diferentes al mismo parqueo, solamente
         * uno podrá comprobar disponibilidad y
         * actualizar inmediatamente.
         */
        const {
          parqueo,
        } =
          await validateLockedReferences(
            parqueoId,
            reservaHabitacionId,
            transaction,
            scope
          );

        validateParqueoReservable(
          parqueo
        );

        /**
         * La comprobación de traslape ocurre
         * después de adquirir el lock del
         * parqueo destino.
         *
         * Excluimos la propia reserva.
         */
        await validateOverlap(
          parqueoId,
          fechaEntrada,
          fechaSalida,
          id,
          transaction
        );

        /**
         * UPDATE dentro de la misma transacción.
         */
        await reservaParqueo.update(
          data,
          {
            transaction,
          }
        );

        return reservaParqueo;
      }
    );
  };

export const deleteReservaParqueo =
  async (
    id: number,
    scope: SedeScope = GLOBAL_SCOPE
  ) => {
    const reservaParqueo =
      await findReservaParqueoEnAlcance(
        id,
        scope
      );

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


