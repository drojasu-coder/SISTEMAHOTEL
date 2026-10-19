import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";

const db = require("../../models");

const {
  sequelize,
  ReservaActividad,
  RecursoActividad,
  Instructor,
  Usuario,
} = db;

type EstadoReservaActividad =
  | "confirmada"
  | "cancelada"
  | "completada";

interface CreateReservaActividadData {
  usuario_id: number;
  recurso_id: number;
  instructor_id?: number | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  con_equipo?: boolean;
}

interface UpdateReservaActividadData {
  estado?: EstadoReservaActividad;
  con_equipo?: boolean;
}

const reservaActividadInclude = [
  {
    model: RecursoActividad,
    attributes: [
      "id",
      "tipo",
      "nombre",
    ],
  },
  {
    model: Instructor,
    attributes: [
      "id",
      "nombre",
      "especialidad",
      "activo",
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

const normalizeTime = (
  hora: string
) =>
  hora.length === 5
    ? `${hora}:00`
    : hora;

const timeToSeconds = (
  time: string
) => {
  const [
    hours,
    minutes,
    seconds = 0,
  ] = time
    .split(":")
    .map(Number);

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
};

const getCurrentHotelDateTime =
  () => {
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
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        }
      ).formatToParts(
        new Date()
      );

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

const validateReservationDateTime =
  (
    fecha: string,
    horaInicio: string
  ) => {
    const current =
      getCurrentHotelDateTime();

    if (
      fecha <
      current.fecha
    ) {
      throw new AppError(
        422,
        "ACTIVITY_DATE_IN_PAST",
        "La fecha de la actividad no puede estar en el pasado"
      );
    }

    if (
      fecha ===
        current.fecha &&
      normalizeTime(
        horaInicio
      ) <
        current.hora
    ) {
      throw new AppError(
        422,
        "ACTIVITY_TIME_IN_PAST",
        "La hora de inicio de la actividad no puede estar en el pasado"
      );
    }
  };

const validateTimeRange = (
  horaInicio: string,
  horaFin: string
) => {
  const inicio =
    timeToSeconds(
      horaInicio
    );

  const fin =
    timeToSeconds(
      horaFin
    );

  if (
    inicio >= fin
  ) {
    throw new AppError(
      400,
      "INVALID_TIME_RANGE",
      "La hora de inicio debe ser anterior a la hora de fin"
    );
  }

  const duracion =
    fin - inicio;

  if (
    duracion < 30 * 60 ||
    duracion > 120 * 60
  ) {
    throw new AppError(
      422,
      "INVALID_ACTIVITY_DURATION",
      "La actividad debe durar entre 30 minutos y 2 horas"
    );
  }
};

const getResourceOrFail =
  async (
    recursoId: number
  ) => {
    const recurso =
      await RecursoActividad.findByPk(
        recursoId
      );

    if (!recurso) {
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        "El recurso solicitado no existe"
      );
    }

    return recurso;
  };

/**
 * Variante transaccional de getResourceOrFail.
 *
 * Bloquea la fila del recurso con SELECT ... FOR UPDATE
 * para serializar reservas concurrentes sobre el mismo recurso.
 */
const getLockedResourceOrFail =
  async (
    recursoId: number,
    transaction: any
  ) => {
    const recurso =
      await RecursoActividad.findByPk(
        recursoId,
        {
          transaction,
          lock:
            transaction
              .LOCK
              .UPDATE,
        }
      );

    if (!recurso) {
      throw new AppError(
        404,
        "RESOURCE_NOT_FOUND",
        "El recurso solicitado no existe"
      );
    }

    return recurso;
  };

const getInstructorOrFail =
  async (
    instructorId: number,
    transaction?: any
  ) => {
    const instructor =
      await Instructor.findByPk(
        instructorId,
        {
          transaction,
        }
      );

    if (!instructor) {
      throw new AppError(
        404,
        "INSTRUCTOR_NOT_FOUND",
        "El instructor solicitado no existe"
      );
    }

    if (
      !instructor.activo
    ) {
      throw new AppError(
        422,
        "INSTRUCTOR_INACTIVE",
        "El instructor seleccionado se encuentra inactivo"
      );
    }

    return instructor;
  };

/**
 * Variante transaccional con bloqueo pesimista.
 *
 * Se usa durante CREATE para serializar solicitudes
 * concurrentes que intentan asignar el mismo instructor.
 *
 * Importante: el orden de locks del módulo queda:
 * 1. RecursoActividad
 * 2. Instructor
 *
 * Mantener ese orden reduce el riesgo de deadlocks.
 */
const getLockedInstructorOrFail =
  async (
    instructorId: number,
    transaction: any
  ) => {
    const instructor =
      await Instructor.findByPk(
        instructorId,
        {
          transaction,
          lock:
            transaction
              .LOCK
              .UPDATE,
        }
      );

    if (!instructor) {
      throw new AppError(
        404,
        "INSTRUCTOR_NOT_FOUND",
        "El instructor solicitado no existe"
      );
    }

    if (
      !instructor.activo
    ) {
      throw new AppError(
        422,
        "INSTRUCTOR_INACTIVE",
        "El instructor seleccionado se encuentra inactivo"
      );
    }

    return instructor;
  };

const validateResourceOverlap =
  async (
    recursoId: number,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    reservaId?: number,
    transaction?: any
  ) => {
    const where: any = {
      recurso_id:
        recursoId,

      fecha,

      estado:
        "confirmada",

      [Op.and]: [
        {
          hora_inicio: {
            [Op.lt]:
              normalizeTime(
                horaFin
              ),
          },
        },
        {
          hora_fin: {
            [Op.gt]:
              normalizeTime(
                horaInicio
              ),
          },
        },
      ],
    };

    if (
      reservaId !==
      undefined
    ) {
      where.id = {
        [Op.ne]:
          reservaId,
      };
    }

    const traslape =
      await ReservaActividad.findOne({
        where,
        transaction,
      });

    if (traslape) {
      throw new AppError(
        409,
        "RESOURCE_OVERLAP",
        "El recurso ya está ocupado en ese horario. Por favor elija otro horario."
      );
    }
  };

const validateInstructorOverlap =
  async (
    instructorId: number,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    reservaId?: number,
    transaction?: any
  ) => {
    const where: any = {
      instructor_id:
        instructorId,

      fecha,

      estado:
        "confirmada",

      [Op.and]: [
        {
          hora_inicio: {
            [Op.lt]:
              normalizeTime(
                horaFin
              ),
          },
        },
        {
          hora_fin: {
            [Op.gt]:
              normalizeTime(
                horaInicio
              ),
          },
        },
      ],
    };

    if (
      reservaId !==
      undefined
    ) {
      where.id = {
        [Op.ne]:
          reservaId,
      };
    }

    const traslape =
      await ReservaActividad.findOne({
        where,
        transaction,
      });

    if (traslape) {
      throw new AppError(
        409,
        "INSTRUCTOR_OVERLAP",
        "El instructor ya tiene una clase en ese horario"
      );
    }
  };

export const getAll =
  async () => {
    return ReservaActividad.findAll(
      {
        include:
          reservaActividadInclude,

        order: [
          [
            "fecha",
            "DESC",
          ],
          [
            "hora_inicio",
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
      await ReservaActividad.findByPk(
        id,
        {
          include:
            reservaActividadInclude,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "RESERVATION_NOT_FOUND",
        "La reserva solicitada no existe"
      );
    }

    return reserva;
  };

export const create =
  async (
    data:
      CreateReservaActividadData
  ) => {
    const horaInicio =
      normalizeTime(
        data.hora_inicio
      );

    const horaFin =
      normalizeTime(
        data.hora_fin
      );

    /**
     * Validaciones puras antes de abrir la transacción.
     */
    validateReservationDateTime(
      data.fecha,
      horaInicio
    );

    validateTimeRange(
      horaInicio,
      horaFin
    );

    /**
     * La comprobación de disponibilidad del recurso
     * y el INSERT se ejecutan dentro de la misma
     * transacción.
     *
     * El recurso queda bloqueado con FOR UPDATE para
     * impedir que varias solicitudes concurrentes
     * validen el mismo recurso como libre.
     */
    const reservaId =
      await sequelize.transaction(
        async (
          transaction: any
        ) => {
          const recurso =
            await getLockedResourceOrFail(
              data.recurso_id,
              transaction
            );

          const duracionHoras =
            (timeToSeconds(
              horaFin
            ) -
              timeToSeconds(
                horaInicio
              )) /
            3600;

          const total =
            Math.round(
              (Number(
                recurso.precio_hora
              ) *
                duracionHoras +
                Number.EPSILON) *
                100
            ) / 100;

          await validateResourceOverlap(
            data.recurso_id,
            data.fecha,
            horaInicio,
            horaFin,
            undefined,
            transaction
          );

          /**
           * El instructor sigue siendo opcional.
           *
           * Si existe, su fila también se bloquea dentro
           * de la misma transacción. Así el check de
           * traslape y el INSERT quedan serializados tanto
           * por recurso como por instructor.
           */
          if (
            data.instructor_id !=
            null
          ) {
            /**
             * El recurso ya está bloqueado. Ahora bloqueamos
             * también el instructor siguiendo siempre el mismo
             * orden: recurso -> instructor.
             */
            await getLockedInstructorOrFail(
              data.instructor_id,
              transaction
            );

            await validateInstructorOverlap(
              data.instructor_id,
              data.fecha,
              horaInicio,
              horaFin,
              undefined,
              transaction
            );
          }

          const reserva =
            await ReservaActividad.create(
              {
                usuario_id:
                  data.usuario_id,

                recurso_id:
                  data.recurso_id,

                instructor_id:
                  data.instructor_id ??
                  null,

                fecha:
                  data.fecha,

                hora_inicio:
                  horaInicio,

                hora_fin:
                  horaFin,

                con_equipo:
                  data.con_equipo ??
                  false,

                total,

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
     * La transacción ya confirmó el INSERT.
     * Cargamos las relaciones fuera de ella.
     */
    return getById(
      reservaId
    );
  };

export const update =
  async (
    id: number,
    data:
      UpdateReservaActividadData
  ) => {
    /**
     * Toda actualización se ejecuta dentro de una
     * transacción para evitar condiciones de carrera.
     *
     * Orden de bloqueo cuando se reactiva:
     * 1. ReservaActividad
     * 2. RecursoActividad
     * 3. Instructor (si existe)
     *
     * El recurso y el instructor mantienen el mismo
     * orden utilizado durante CREATE.
     */
    const reservaId =
      await sequelize.transaction(
        async (
          transaction: any
        ) => {
          /**
           * Bloqueamos primero la propia reserva.
           *
           * Esto evita que dos PATCH simultáneos sobre
           * el mismo registro trabajen con un estado
           * desactualizado.
           */
          const reserva =
            await ReservaActividad.findByPk(
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
              "RESERVATION_NOT_FOUND",
              "La reserva solicitada no existe"
            );
          }

          const estadoActual =
            reserva.estado as
              EstadoReservaActividad;

          const estadoDestino =
            data.estado ??
            estadoActual;

          /**
           * Una reserva cancelada o completada
           * vuelve a bloquear recursos cuando
           * pasa nuevamente a confirmada.
           */
          const seEstaReactivando =
            estadoActual !==
              "confirmada" &&
            estadoDestino ===
              "confirmada";

          if (
            seEstaReactivando
          ) {
            const horaInicio =
              normalizeTime(
                reserva.hora_inicio
              );

            const horaFin =
              normalizeTime(
                reserva.hora_fin
              );

            validateReservationDateTime(
              reserva.fecha,
              horaInicio
            );

            validateTimeRange(
              horaInicio,
              horaFin
            );

            /**
             * Bloqueamos el recurso antes de comprobar
             * disponibilidad.
             *
             * Si 20 reservas canceladas intentan
             * reactivarse sobre el mismo recurso,
             * solamente una puede validar e ingresar
             * al UPDATE inmediatamente.
             */
            await getLockedResourceOrFail(
              reserva.recurso_id,
              transaction
            );

            await validateResourceOverlap(
              reserva.recurso_id,
              reserva.fecha,
              horaInicio,
              horaFin,
              id,
              transaction
            );

            /**
             * Si existe instructor, se bloquea después
             * del recurso para conservar el orden global
             * recurso -> instructor.
             */
            if (
              reserva.instructor_id !=
              null
            ) {
              await getLockedInstructorOrFail(
                reserva.instructor_id,
                transaction
              );

              await validateInstructorOverlap(
                reserva.instructor_id,
                reserva.fecha,
                horaInicio,
                horaFin,
                id,
                transaction
              );
            }
          }

          /**
           * El UPDATE pertenece a la misma transacción
           * que todas las validaciones anteriores.
           */
          await reserva.update(
            data,
            {
              transaction,
            }
          );

          return reserva.id;
        }
      );

    /**
     * La transacción ya hizo COMMIT.
     * Cargamos las asociaciones fuera de ella.
     */
    return getById(
      reservaId
    );
  };