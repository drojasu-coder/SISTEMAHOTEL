import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import {
  RESTAURANT_BOOKING_HOURS,
  minutesOf,
  toTimeString,
  getAllBookingSlots,
  intervalsOverlap,
} from "../../constants/restaurant";
import { SedeScope, sedeWhere } from "../../utils/sedeScope";

const db = require("../../models");

const {
  sequelize,
  ReservaMesa,
  Mesa,
  Usuario,
  Sucursal,
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
      "sucursal_id",
    ],
    include: [
      {
        model: Sucursal,
        attributes: [
          "id",
          "nombre",
          "direccion",
          "telefono",
        ],
      },
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
 * Busca la mesa dentro de una transacción y
 * bloquea su fila con SELECT ... FOR UPDATE.
 *
 * Esto serializa las operaciones concurrentes
 * sobre una misma mesa.
 */
const getLockedMesaOrFail = async (
  mesaId: number,
  transaction: any
) => {
  const mesa =
    await Mesa.findByPk(
      mesaId,
      {
        transaction,
        lock:
          transaction
            .LOCK
            .UPDATE,
      }
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
 * La hora de inicio debe estar dentro del horario de reservas y alinearse
 * con las franjas configuradas (RESTAURANT_BOOKING_HOURS).
 *
 * Con una duración estándar de 90 minutos y cierre a las 22:00,
 * la última hora de inicio permitida es 20:30.
 */
const validateBookingHours = (
  hora: string
) => {
  const start = minutesOf(hora);
  const seconds = Number(normalizeTime(hora).slice(6, 8));
  if (
    start < minutesOf(RESTAURANT_BOOKING_HOURS.APERTURA) ||
    start > minutesOf(RESTAURANT_BOOKING_HOURS.ULTIMO_INICIO) ||
    start % RESTAURANT_BOOKING_HOURS.INTERVALO_MINUTOS !== 0 ||
    seconds !== 0
  ) {
    throw new AppError(
      422,
      "TABLE_RESERVATION_OUTSIDE_HOURS",
      `Las reservas de mesa se aceptan de ${RESTAURANT_BOOKING_HOURS.APERTURA} a ${RESTAURANT_BOOKING_HOURS.ULTIMO_INICIO} (cierre ${RESTAURANT_BOOKING_HOURS.CIERRE}, duración ${RESTAURANT_BOOKING_HOURS.DURACION_MINUTOS} min), en intervalos de ${RESTAURANT_BOOKING_HOURS.INTERVALO_MINUTOS} minutos`
    );
  }
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
 * Cada reserva retiene la mesa durante el intervalo de ocupación
 * [inicio, inicio + DURACION_MINUTOS).
 *
 * Dos reservas de la misma mesa colisionan si sus intervalos se superponen:
 *   inicio_nueva < fin_existente && fin_nueva > inicio_existente
 *
 * Considera únicamente las reservas con estado "confirmada".
 * Las reservas canceladas quedan libres y no generan conflicto.
 */
const validateAvailability =
  async (
    mesaId: number,
    fecha: string,
    hora: string,
    reservaId?: number,
    transaction?: any
  ) => {
    const inicioNueva = minutesOf(hora);
    const finNueva =
      inicioNueva + RESTAURANT_BOOKING_HOURS.DURACION_MINUTOS;

    const where: any = {
      mesa_id: mesaId,
      fecha,
      estado: "confirmada",
    };

    /**
     * Al reactivar o actualizar una reserva existente,
     * se excluye el propio registro.
     */
    if (reservaId !== undefined) {
      where.id = {
        [Op.ne]: reservaId,
      };
    }

    const existentes = await ReservaMesa.findAll({
      where,
      transaction,
    });

    const conflicto = existentes.find((existente: any) => {
      const inicioExistente = minutesOf(existente.hora);
      const finExistente =
        inicioExistente + RESTAURANT_BOOKING_HOURS.DURACION_MINUTOS;
      return intervalsOverlap(
        inicioNueva,
        finNueva,
        inicioExistente,
        finExistente
      );
    });

    if (conflicto) {
      throw new AppError(
        409,
        "TABLE_RESERVATION_TIME_CONFLICT",
        "La mesa ya se encuentra reservada para esa fecha y horario"
      );
    }
  };

/**
 * Listado administrativo. `sucursal_id` filtra por la sede de la mesa y debe
 * estar dentro del alcance del solicitante (ver utils/sedeScope).
 */
export const getAll =
  async (
    scope: SedeScope = { global: true },
    sucursalId?: number
  ) => {
    return ReservaMesa.findAll(
      {
        where: sedeWhere(scope, sucursalId, "$Mesa.sucursal_id$"),
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

export const getByUserId =
  async (
    userId: number
  ) => {
    return ReservaMesa.findAll(
      {
        where: {
          usuario_id: userId,
        },

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

export const getByIdForUser =
  async (
    id: number,
    userId: number
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

    if (
      reserva.usuario_id !==
      userId
    ) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "No tiene permisos para acceder a esta reserva de mesa"
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
     *
     * No requiere acceso a BD, así que
     * se valida antes de abrir la transacción.
     */
    validateReservationDateTime(
      data.fecha,
      data.hora
    );

    /**
     * Regla 2:
     * solo dentro del horario de reservas del restaurante.
     */
    validateBookingHours(
      data.hora
    );

    /**
     * La disponibilidad y el INSERT deben
     * ejecutarse como una sola operación
     * atómica.
     *
     * Bloqueamos la fila de la mesa para
     * serializar solicitudes concurrentes
     * sobre la misma mesa.
     */
    const reservaId =
      await sequelize.transaction(
        async (
          transaction: any
        ) => {
          /**
           * Regla 2:
           * la mesa debe existir.
           *
           * Además queda bloqueada con
           * SELECT ... FOR UPDATE.
           */
          const mesa =
            await getLockedMesaOrFail(
              data.mesa_id,
              transaction
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
           *
           * Este check ocurre después de
           * adquirir el lock y dentro de la
           * misma transacción que el INSERT.
           */
          await validateAvailability(
            data.mesa_id,
            data.fecha,
            data.hora,
            undefined,
            transaction
          );

          const reserva =
            await ReservaMesa.create(
              {
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
              },
              {
                transaction,
              }
            );

          return reserva.id;
        }
      );

    /**
     * La transacción ya hizo COMMIT.
     * Ahora podemos cargar la reserva con
     * sus relaciones mediante getById().
     */
    return getById(
      reservaId
    );
  };

export const updateStatus =
  async (
    id: number,
    estado:
      EstadoReservaMesa
  ) => {
    /**
     * El cambio de estado se ejecuta dentro
     * de una transacción para que la validación
     * y el UPDATE sean atómicos.
     *
     * Primero bloqueamos la propia reserva.
     * Si se reactiva a "confirmada", también
     * bloqueamos la mesa asociada.
     */
    const reservaId =
      await sequelize.transaction(
        async (
          transaction: any
        ) => {
          const reserva =
            await ReservaMesa.findByPk(
              id,
              {
                transaction,
                lock:
                  transaction
                    .LOCK
                    .UPDATE,
              }
            );

          if (!reserva) {
            throw new AppError(
              404,
              "TABLE_RESERVATION_NOT_FOUND",
              "La reserva de mesa solicitada no existe"
            );
          }

          /**
           * Al tener la fila de la reserva bloqueada,
           * una segunda petición concurrente sobre
           * la misma reserva verá el estado ya
           * actualizado cuando consiga continuar.
           */
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
           * a confirmarse, repetimos todas
           * las reglas de disponibilidad.
           */
          if (
            estado ===
            "confirmada"
          ) {
            validateReservationDateTime(
              reserva.fecha,
              reserva.hora
            );

            /**
             * El lock sobre la mesa serializa
             * reactivaciones concurrentes de
             * reservas distintas para el mismo
             * slot de mesa/fecha/hora.
             */
            const mesa =
              await getLockedMesaOrFail(
                reserva.mesa_id,
                transaction
              );

            validateMesaReservable(
              mesa
            );

            validateCapacity(
              reserva.numero_comensales,
              mesa.capacidad
            );

            /**
             * La disponibilidad se comprueba
             * después de adquirir el lock y
             * dentro de la misma transacción
             * que cambiará el estado.
             */
            await validateAvailability(
              reserva.mesa_id,
              reserva.fecha,
              reserva.hora,
              id,
              transaction
            );
          }

          await reserva.update(
            {
              estado,
            },
            {
              transaction,
            }
          );

          return reserva.id;
        }
      );

    /**
     * La transacción ya confirmó el cambio.
     * Cargamos las asociaciones fuera de ella.
     */
    return getById(
      reservaId
    );
  };

/**
 * Cancelación por el propietario de la reserva (cliente).
 *
 * Reglas:
 * - Solo el usuario dueño de la reserva puede cancelarla.
 * - Solo se cancelan reservas "confirmada"; una ya cancelada responde 409.
 * - Solo antes de la fecha y hora reservadas (zona horaria del hotel).
 *   No existe una política de anticipación mínima ni penalización: no se
 *   aplica ninguna.
 *
 * El SELECT ... FOR UPDATE serializa cancelaciones concurrentes y cambios
 * administrativos sobre la misma reserva: la segunda solicitud ya observa
 * "cancelada" y recibe 409 en lugar de un segundo 200.
 *
 * La disponibilidad de la mesa se calcula a partir de las reservas
 * "confirmada" (validateAvailability), por lo que el horario queda libre al
 * cambiar el estado. El estado físico de la mesa (Mesa.estado) no se toca.
 */
export const cancelForUser =
  async (
    id: number,
    userId: number
  ) => {
    const reservaId =
      await sequelize.transaction(
        async (
          transaction: any
        ) => {
          const reserva =
            await ReservaMesa.findByPk(
              id,
              {
                transaction,
                lock:
                  transaction
                    .LOCK
                    .UPDATE,
              }
            );

          if (!reserva) {
            throw new AppError(
              404,
              "TABLE_RESERVATION_NOT_FOUND",
              "La reserva de mesa solicitada no existe"
            );
          }

          if (
            reserva.usuario_id !==
            userId
          ) {
            throw new AppError(
              403,
              "FORBIDDEN",
              "No tiene permisos para cancelar esta reserva de mesa"
            );
          }

          if (
            reserva.estado ===
            "cancelada"
          ) {
            throw new AppError(
              409,
              "TABLE_RESERVATION_ALREADY_CANCELLED",
              "La reserva de mesa ya se encuentra cancelada"
            );
          }

          if (
            reserva.estado !==
            "confirmada"
          ) {
            throw new AppError(
              409,
              "TABLE_RESERVATION_NOT_CANCELLABLE",
              "La reserva de mesa no puede cancelarse en su estado actual"
            );
          }

          const current =
            getCurrentHotelDateTime();

          if (
            reserva.fecha <
              current.fecha ||
            (reserva.fecha ===
              current.fecha &&
              normalizeTime(
                reserva.hora
              ) <=
                current.hora)
          ) {
            throw new AppError(
              422,
              "TABLE_RESERVATION_ALREADY_STARTED",
              "Solo puede cancelar una reserva antes de su fecha y hora"
            );
          }

          await reserva.update(
            {
              estado:
                "cancelada",
            },
            {
              transaction,
            }
          );

          return reserva.id;
        }
      );

    return getByIdForUser(
      reservaId,
      userId
    );
  };

/**
 * Consulta la disponibilidad de todas las franjas horarias de una mesa
 * para una fecha específica (zona horaria del hotel).
 */
export const getDisponibilidadMesa = async (
  mesaId: number,
  fecha: string
) => {
  const mesa = await getMesaOrFail(mesaId);
  const current = getCurrentHotelDateTime();

  const reservas = await ReservaMesa.findAll({
    where: {
      mesa_id: mesaId,
      fecha,
      estado: "confirmada",
    },
    order: [["hora", "ASC"]],
  });

  const allSlots = getAllBookingSlots();

  const slots = allSlots.map((slot) => {
    const inicioSlot = minutesOf(slot);
    const finSlot =
      inicioSlot + RESTAURANT_BOOKING_HOURS.DURACION_MINUTOS;

    const conflicto = reservas.find((r: any) => {
      const rIni = minutesOf(r.hora);
      const rFin =
        rIni + RESTAURANT_BOOKING_HOURS.DURACION_MINUTOS;
      return intervalsOverlap(
        inicioSlot,
        finSlot,
        rIni,
        rFin
      );
    });

    const ocupada = Boolean(conflicto);

    const pasada =
      fecha < current.fecha ||
      (fecha === current.fecha &&
        normalizeTime(slot) <= current.hora);

    const disponible =
      !ocupada &&
      !pasada &&
      mesa.estado !== "mantenimiento";

    return {
      hora: slot,
      hora_fin: toTimeString(finSlot),
      disponible,
      ocupada,
      pasada,
    };
  });

  return {
    mesa_id: mesa.id,
    fecha,
    estado_mesa: mesa.estado,
    capacidad: mesa.capacidad,
    configuracion: {
      apertura: RESTAURANT_BOOKING_HOURS.APERTURA,
      cierre: RESTAURANT_BOOKING_HOURS.CIERRE,
      intervalo_minutos: RESTAURANT_BOOKING_HOURS.INTERVALO_MINUTOS,
      duracion_minutos: RESTAURANT_BOOKING_HOURS.DURACION_MINUTOS,
      ultima_hora_inicio: RESTAURANT_BOOKING_HOURS.ULTIMO_INICIO,
    },
    slots,
    horarios_disponibles: slots
      .filter((s) => s.disponible)
      .map((s) => s.hora),
    horarios_ocupados: slots
      .filter((s) => s.ocupada)
      .map((s) => s.hora),
  };
};

export const getBookingConfig = () => {
  return {
    apertura: RESTAURANT_BOOKING_HOURS.APERTURA,
    cierre: RESTAURANT_BOOKING_HOURS.CIERRE,
    intervalo_minutos: RESTAURANT_BOOKING_HOURS.INTERVALO_MINUTOS,
    duracion_minutos: RESTAURANT_BOOKING_HOURS.DURACION_MINUTOS,
    ultima_hora_inicio: RESTAURANT_BOOKING_HOURS.ULTIMO_INICIO,
    slots: getAllBookingSlots(),
  };
};

