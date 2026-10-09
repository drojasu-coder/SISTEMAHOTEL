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

const {
  ReservaHabitacion,
  Usuario,
  Habitacion,
  TipoHabitacion,
} = db;

type EstadoReservaHabitacion =
  | "pendiente"
  | "confirmada"
  | "cancelada"
  | "finalizada"
  | "expirada";

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
  estado?: EstadoReservaHabitacion;
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
  {
    model: Habitacion,
    include: [
      {
        model: TipoHabitacion,
      },
    ],
  },
];

/**
 * Estados que bloquean la disponibilidad de una habitación.
 *
 * Una reserva cancelada, finalizada o expirada ya no debe impedir
 * que la habitación pueda ser utilizada por otra reserva.
 */
const estadosQueBloqueanDisponibilidad =
  new Set<EstadoReservaHabitacion>([
    "pendiente",
    "confirmada",
  ]);

const bloqueaDisponibilidad = (
  estado: EstadoReservaHabitacion
) =>
  estadosQueBloqueanDisponibilidad.has(
    estado
  );

/**
 * Obtiene la fecha actual del negocio.
 *
 * Se utiliza America/Guatemala como valor por defecto,
 * pero puede configurarse mediante APP_TIMEZONE.
 */
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

/**
 * La fecha de salida debe ser posterior
 * a la fecha de entrada.
 */
const validateDates = (
  fechaEntrada: string,
  fechaSalida: string
) => {
  if (
    fechaSalida <=
    fechaEntrada
  ) {
    throw new AppError(
      422,
      "FECHAS_INVALIDAS",
      "La fecha de salida debe ser posterior a la fecha de entrada"
    );
  }
};

/**
 * Impide crear o reactivar una reserva cuya
 * fecha de entrada ya pasó.
 */
const validateNotPast = (
  fechaEntrada: string
) => {
  const today =
    getTodayDate();

  if (
    fechaEntrada < today
  ) {
    throw new AppError(
      422,
      "ROOM_RESERVATION_DATE_IN_PAST",
      "La fecha de entrada no puede estar en el pasado"
    );
  }
};

/**
 * Valida la capacidad máxima definida por
 * el tipo de habitación.
 */
const validateCapacidad = (
  numeroHuespedes: number,
  capacidadMaxima: number
) => {
  if (
    numeroHuespedes >
    capacidadMaxima
  ) {
    throw new AppError(
      422,
      "CAPACIDAD_EXCEDIDA",
      "El número de huéspedes excede la capacidad máxima de la habitación"
    );
  }
};

/**
 * Una habitación en mantenimiento no puede
 * recibir nuevas reservas activas.
 *
 * No bloqueamos automáticamente "ocupada" porque
 * una habitación ocupada hoy puede reservarse
 * para una fecha futura.
 */
const validateHabitacionReservable = (
  habitacion: any
) => {
  if (
    habitacion.estado ===
    "mantenimiento"
  ) {
    throw new AppError(
      409,
      "HABITACION_EN_MANTENIMIENTO",
      "La habitación se encuentra en mantenimiento y no puede ser reservada"
    );
  }
};

/**
 * Calcula la cantidad de noches.
 */
const getNights = (
  fechaEntrada: string,
  fechaSalida: string
) =>
  Math.round(
    (
      Date.parse(
        `${fechaSalida}T00:00:00Z`
      ) -
      Date.parse(
        `${fechaEntrada}T00:00:00Z`
      )
    ) /
      (
        1000 *
        60 *
        60 *
        24
      )
  );

/**
 * Comprueba que usuario y habitación existan.
 * También carga TipoHabitacion porque necesitamos
 * tarifa y capacidad.
 */
const validateReferences =
  async (
    usuarioId: number,
    habitacionId: number
  ) => {
    const usuario =
      await Usuario.findByPk(
        usuarioId
      );

    if (!usuario) {
      throw new AppError(
        404,
        "USUARIO_NOT_FOUND",
        "El usuario no fue encontrado"
      );
    }

    const habitacion =
      await Habitacion.findByPk(
        habitacionId,
        {
          include: [
            {
              model:
                TipoHabitacion,
            },
          ],
        }
      );

    if (
      !habitacion ||
      !habitacion.TipoHabitacion
    ) {
      throw new AppError(
        404,
        "HABITACION_NOT_FOUND",
        "La habitación no fue encontrada"
      );
    }

    return habitacion;
  };

/**
 * Detecta cualquier traslape con reservas
 * pendientes o confirmadas.
 */
const validateOverlap = async (
  habitacionId: number,
  fechaEntrada: string,
  fechaSalida: string,
  reservaId?: number
) => {
  const where: any = {
    habitacion_id:
      habitacionId,

    estado: {
      [Op.in]: [
        "pendiente",
        "confirmada",
      ],
    },

    fecha_entrada: {
      [Op.lt]:
        fechaSalida,
    },

    fecha_salida: {
      [Op.gt]:
        fechaEntrada,
    },
  };

  /**
   * Durante un PATCH excluimos la propia reserva
   * para que no choque consigo misma.
   */
  if (
    reservaId !==
    undefined
  ) {
    where.id = {
      [Op.ne]: reservaId,
    };
  }

  const reservaExistente =
    await ReservaHabitacion.findOne({
      where,
    });

  if (reservaExistente) {
    throw new AppError(
      409,
      "HABITACION_NO_DISPONIBLE",
      "La habitación ya está reservada en esas fechas"
    );
  }
};

/**
 * Calcula el total de la reserva.
 */
const calculateTotal = (
  fechaEntrada: string,
  fechaSalida: string,
  tarifaNoche: unknown
) =>
  (
    getNights(
      fechaEntrada,
      fechaSalida
    ) *
    Number(tarifaNoche)
  ).toFixed(2);

/**
 * LISTADO
 *
 * Administradores/recepción/gerencia:
 * pueden consultar todas.
 *
 * Cliente:
 * únicamente las propias.
 */
export const getAllReservaHabitaciones =
  async (
    requester?: RequesterContext
  ) => {
    const where:
      Record<
        string,
        unknown
      > = {};

    if (
      requester &&
      !isAdministrativeRole(
        requester.rol
      )
    ) {
      where.usuario_id =
        requester.id;
    }

    return ReservaHabitacion.findAll(
      {
        where,
        include:
          reservationInclude,
        order: [["id", "ASC"]],
      }
    );
  };

/**
 * CONSULTA INDIVIDUAL
 */
export const getReservaHabitacionById =
  async (
    id: number,
    requester?: RequesterContext
  ) => {
    const reservaHabitacion =
      await ReservaHabitacion.findByPk(
        id,
        {
          include:
            reservationInclude,
        }
      );

    if (!reservaHabitacion) {
      throw new AppError(
        404,
        "RESERVA_HABITACION_NOT_FOUND",
        "La reserva de habitación no fue encontrada"
      );
    }

    if (
      requester &&
      !isAdministrativeRole(
        requester.rol
      )
    ) {
      if (
        reservaHabitacion.usuario_id !==
        requester.id
      ) {
        throw new AppError(
          403,
          "INSUFFICIENT_PERMISSIONS",
          "No tiene permisos para acceder a esta reserva de habitación"
        );
      }
    }

    return reservaHabitacion;
  };

/**
 * CREAR RESERVA
 */
export const createReservaHabitacion =
  async (
    data:
      CreateReservaHabitacionData
  ) => {
    /**
     * Regla 1:
     * salida > entrada.
     */
    validateDates(
      data.fecha_entrada,
      data.fecha_salida
    );

    /**
     * Regla 2:
     * no se permiten nuevas reservas
     * en fechas pasadas.
     */
    validateNotPast(
      data.fecha_entrada
    );

    /**
     * Regla 3:
     * usuario y habitación deben existir.
     */
    const habitacion =
      await validateReferences(
        data.usuario_id,
        data.habitacion_id
      );

    /**
     * Regla 4:
     * una habitación en mantenimiento
     * no puede reservarse.
     */
    validateHabitacionReservable(
      habitacion
    );

    /**
     * Regla 5:
     * no superar capacidad.
     */
    validateCapacidad(
      data.numero_huespedes,
      habitacion
        .TipoHabitacion
        .capacidad_maxima
    );

    /**
     * Regla 6:
     * no debe existir traslape.
     */
    await validateOverlap(
      data.habitacion_id,
      data.fecha_entrada,
      data.fecha_salida
    );

    const total =
      calculateTotal(
        data.fecha_entrada,
        data.fecha_salida,
        habitacion
          .TipoHabitacion
          .tarifa_noche
      );

    return ReservaHabitacion.create(
      {
        usuario_id:
          data.usuario_id,

        habitacion_id:
          data.habitacion_id,

        fecha_entrada:
          data.fecha_entrada,

        fecha_salida:
          data.fecha_salida,

        numero_huespedes:
          data.numero_huespedes,

        estado:
          "pendiente",

        total,
      }
    );
  };

/**
 * ACTUALIZAR RESERVA
 */
export const updateReservaHabitacion =
  async (
    id: number,
    data:
      UpdateReservaHabitacionData
  ) => {
    const reservaHabitacion =
      await ReservaHabitacion.findByPk(
        id
      );

    if (!reservaHabitacion) {
      throw new AppError(
        404,
        "RESERVA_HABITACION_NOT_FOUND",
        "La reserva de habitación no fue encontrada"
      );
    }

    /**
     * Calculamos cómo quedaría finalmente
     * la reserva después del PATCH.
     */
    const usuarioId =
      data.usuario_id ??
      reservaHabitacion.usuario_id;

    const habitacionId =
      data.habitacion_id ??
      reservaHabitacion.habitacion_id;

    const fechaEntrada =
      data.fecha_entrada ??
      reservaHabitacion.fecha_entrada;

    const fechaSalida =
      data.fecha_salida ??
      reservaHabitacion.fecha_salida;

    const numeroHuespedes =
      data.numero_huespedes ??
      reservaHabitacion.numero_huespedes;

    const estadoActual =
      reservaHabitacion.estado as
        EstadoReservaHabitacion;

    const estadoDestino =
      data.estado ??
      estadoActual;

    /**
     * Comprobamos si cambió algún dato operativo
     * de la reserva.
     */
    const datosReservaCambiaron =
      data.usuario_id !== undefined ||
      data.habitacion_id !==
        undefined ||
      data.fecha_entrada !==
        undefined ||
      data.fecha_salida !==
        undefined ||
      data.numero_huespedes !==
        undefined;

    /**
     * Detectamos si una reserva que antes NO
     * bloqueaba disponibilidad vuelve a convertirse
     * en pendiente o confirmada.
     *
     * Ejemplo:
     * cancelada -> confirmada
     */
    const seEstaReactivando =
      !bloqueaDisponibilidad(
        estadoActual
      ) &&
      bloqueaDisponibilidad(
        estadoDestino
      );

    /**
     * Las reglas de negocio deben volver a
     * ejecutarse cuando:
     *
     * - cambian fechas/habitación/huéspedes/usuario;
     * - o una reserva inactiva se reactiva.
     */
    if (
      datosReservaCambiaron ||
      seEstaReactivando
    ) {
      validateDates(
        fechaEntrada,
        fechaSalida
      );

      const habitacion =
        await validateReferences(
          usuarioId,
          habitacionId
        );

      validateCapacidad(
        numeroHuespedes,
        habitacion
          .TipoHabitacion
          .capacidad_maxima
      );

      /**
       * Solamente las reservas pendientes o
       * confirmadas bloquean disponibilidad.
       */
      if (
        bloqueaDisponibilidad(
          estadoDestino
        )
      ) {
        validateNotPast(
          fechaEntrada
        );

        validateHabitacionReservable(
          habitacion
        );

        await validateOverlap(
          habitacionId,
          fechaEntrada,
          fechaSalida,
          id
        );
      }
    }

    let total:
      | string
      | undefined;

    /**
     * Solo recalculamos total si cambia algo
     * que afecta directamente al precio.
     */
    if (
      data.fecha_entrada !==
        undefined ||
      data.fecha_salida !==
        undefined ||
      data.habitacion_id !==
        undefined
    ) {
      const habitacion =
        await Habitacion.findByPk(
          habitacionId,
          {
            include: [
              {
                model:
                  TipoHabitacion,
              },
            ],
          }
        );

      if (
        !habitacion ||
        !habitacion.TipoHabitacion
      ) {
        throw new AppError(
          404,
          "HABITACION_NOT_FOUND",
          "La habitación no fue encontrada"
        );
      }

      total =
        calculateTotal(
          fechaEntrada,
          fechaSalida,
          habitacion
            .TipoHabitacion
            .tarifa_noche
        );
    }

    const updateData:
      Record<
        string,
        unknown
      > = {
      ...(data.usuario_id !==
      undefined
        ? {
            usuario_id:
              data.usuario_id,
          }
        : {}),

      ...(data.habitacion_id !==
      undefined
        ? {
            habitacion_id:
              data.habitacion_id,
          }
        : {}),

      ...(data.fecha_entrada !==
      undefined
        ? {
            fecha_entrada:
              data.fecha_entrada,
          }
        : {}),

      ...(data.fecha_salida !==
      undefined
        ? {
            fecha_salida:
              data.fecha_salida,
          }
        : {}),

      ...(data.numero_huespedes !==
      undefined
        ? {
            numero_huespedes:
              data.numero_huespedes,
          }
        : {}),

      ...(data.estado !==
      undefined
        ? {
            estado:
              data.estado,
          }
        : {}),

      ...(total !== undefined
        ? {
            total,
          }
        : {}),
    };

    await reservaHabitacion.update(
      updateData
    );

    return reservaHabitacion;
  };

/**
 * CANCELACIÓN LÓGICA
 *
 * No eliminamos físicamente la reserva porque
 * necesitamos conservar el historial.
 */
export const deleteReservaHabitacion =
  async (id: number) => {
    const reservaHabitacion =
      await ReservaHabitacion.findByPk(
        id
      );

    if (!reservaHabitacion) {
      throw new AppError(
        404,
        "RESERVA_HABITACION_NOT_FOUND",
        "La reserva de habitación no fue encontrada"
      );
    }

    await reservaHabitacion.update(
      {
        estado: "cancelada",
      }
    );

    return reservaHabitacion;
  };
