import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";

const db = require("../../models");

const {
  sequelize,
  ReservaActividad,
  RecursoActividad,
  Instructor,
  Usuario,
  Sucursal,
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
  hora_fin?: string;
  con_equipo?: boolean;
  numero_participantes?: number;
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
      "sucursal_id",
      "precio_hora",
      "precio_equipo",
      "precio_instructor_hora",
      "modalidad",
      "duracion_minutos",
      "cupo_maximo",
      "precio_persona",
    ],
    include: [
      {
        model: Sucursal,
        attributes: [
          "id",
          "nombre",
          "direccion",
        ],
      },
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
      env.APP_TIMEZONE;

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

const validateReservationHasFinished =
  (
    fecha: string,
    horaFin: string
  ) => {
    const current =
      getCurrentHotelDateTime();

    if (
      fecha >
        current.fecha ||
      (fecha ===
        current.fecha &&
        normalizeTime(
          horaFin
        ) >
          current.hora)
    ) {
      throw new AppError(
        409,
        "RESERVATION_NOT_FINISHED",
        "La actividad todavía no ha finalizado"
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

const secondsToTime = (
  totalSeconds: number
) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
};

const isExperiencia = (
  recurso: any
) =>
  recurso?.modalidad ===
  "experiencia";

/**
 * Una experiencia tiene duración fija: la hora de fin
 * se calcula en el servidor y debe caer el mismo día.
 */
const getExperienceEndTime = (
  recurso: any,
  horaInicio: string,
  horaFinSolicitada?: string
) => {
  const duracionMinutos =
    Number(recurso.duracion_minutos);

  const fin =
    timeToSeconds(horaInicio) +
    duracionMinutos * 60;

  if (fin >= 24 * 3600) {
    throw new AppError(
      422,
      "INVALID_ACTIVITY_DURATION",
      `La experiencia dura ${duracionMinutos} minutos y debe terminar el mismo día`
    );
  }

  const horaFin =
    secondsToTime(fin);

  if (
    horaFinSolicitada !== undefined &&
    normalizeTime(horaFinSolicitada) !== horaFin
  ) {
    throw new AppError(
      422,
      "INVALID_ACTIVITY_DURATION",
      `La experiencia dura ${duracionMinutos} minutos; con inicio a las ${horaInicio.slice(0, 5)} termina a las ${horaFin.slice(0, 5)}`
    );
  }

  return horaFin;
};

/**
 * Las reservas de una experiencia comparten la misma salida
 * (misma hora de inicio) y su cupo. Dos salidas distintas
 * del mismo recurso no pueden superponerse.
 */
const validateExperienceCapacity =
  async (
    recurso: any,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    participantes: number,
    reservaId: number | undefined,
    transaction: any
  ) => {
    const where: any = {
      recurso_id: recurso.id,
      fecha,
      estado: "confirmada",
      hora_inicio: { [Op.lt]: horaFin },
      hora_fin: { [Op.gt]: horaInicio },
    };

    if (reservaId !== undefined) {
      where.id = { [Op.ne]: reservaId };
    }

    const reservas =
      await ReservaActividad.findAll({
        where,
        attributes: ["hora_inicio", "numero_participantes"],
        transaction,
      });

    if (
      reservas.some(
        (r: any) =>
          normalizeTime(r.hora_inicio) !== horaInicio
      )
    ) {
      throw new AppError(
        409,
        "RESOURCE_OVERLAP",
        "Ya existe otra salida de esta experiencia que se superpone con ese horario. Por favor elija otro horario."
      );
    }

    const ocupados =
      reservas.reduce(
        (sum: number, r: any) =>
          sum + Number(r.numero_participantes),
        0
      );

    const cupo =
      Number(recurso.cupo_maximo);

    if (ocupados + participantes > cupo) {
      throw new AppError(
        409,
        "ACTIVITY_CAPACITY_EXCEEDED",
        `La salida tiene cupo para ${cupo} participantes y quedan ${Math.max(0, cupo - ocupados)} lugares disponibles`
      );
    }
  };

/**
 * El equipamiento tiene una tarifa sin unidad de cobro definida (por reserva,
 * por hora o por persona). Mientras esa regla no exista, no se acepta como
 * suplemento: así el total nunca difiere de lo comunicado al cliente.
 * Si su tarifa es 0 se puede solicitar sin cargo.
 */
const assertEquipmentAllowed = (
  recurso: any,
  conEquipo: boolean | undefined
) => {
  if (conEquipo && Number(recurso.precio_equipo) > 0) {
    throw new AppError(
      422,
      "EQUIPMENT_NOT_BOOKABLE",
      "El equipamiento de este recurso no se puede añadir en línea porque su forma de cobro no está definida"
    );
  }
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
  async (where: Record<string | symbol, unknown> = {}) => {
    return ReservaActividad.findAll(
      {
    where,
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

export const getByUserId =
  async (
    userId: number
  ) => {
    return ReservaActividad.findAll(
      {
        where: {
          usuario_id: userId,
        },

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

export const getByIdForUser =
  async (
    id: number,
    userId: number
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

    if (
      reserva.usuario_id !==
      userId
    ) {
      throw new AppError(
        403,
        "INSUFFICIENT_PERMISSIONS",
        "No tiene permisos para ver esta reserva de actividad"
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

    /**
     * Validaciones puras antes de abrir la transacción.
     */
    validateReservationDateTime(
      data.fecha,
      horaInicio
    );

    /**
     * La modalidad del recurso determina cómo se valida
     * la duración. Si el recurso no existe se conserva el
     * orden de validación anterior y el 404 llega dentro
     * de la transacción.
     */
    const recursoPrevio =
      await RecursoActividad.findByPk(
        data.recurso_id
      );

    const participantes =
      data.numero_participantes ?? 1;

    let horaFin: string;

    if (isExperiencia(recursoPrevio)) {
      horaFin = getExperienceEndTime(
        recursoPrevio,
        horaInicio,
        data.hora_fin
      );

      // El guía forma parte de la salida, no de cada reserva individual.
      if (data.instructor_id != null) {
        throw new AppError(
          422,
          "INSTRUCTOR_NOT_APPLICABLE",
          "Las experiencias guiadas no admiten elegir instructor por reserva"
        );
      }
    } else {
      if (data.hora_fin === undefined) {
        throw new AppError(
          400,
          "ACTIVITY_END_TIME_REQUIRED",
          "Debe indicar la hora de fin de la actividad"
        );
      }

      horaFin = normalizeTime(
        data.hora_fin
      );

      validateTimeRange(
        horaInicio,
        horaFin
      );
    }

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

          assertEquipmentAllowed(recurso, data.con_equipo);

          if (
            isExperiencia(recurso) !==
            isExperiencia(recursoPrevio)
          ) {
            throw new AppError(
              409,
              "ACTIVITY_RESOURCE_CHANGED",
              "La configuración de la actividad cambió. Vuelva a intentarlo."
            );
          }

          if (isExperiencia(recurso)) {
            await validateExperienceCapacity(
              recurso,
              data.fecha,
              horaInicio,
              horaFin,
              participantes,
              undefined,
              transaction
            );

            const totalExperiencia =
              Math.round(
                (Number(recurso.precio_persona) *
                  participantes +
                  Number.EPSILON) *
                  100
              ) / 100;

            const reservaExperiencia =
              await ReservaActividad.create(
                {
                  usuario_id: data.usuario_id,
                  recurso_id: data.recurso_id,
                  instructor_id: null,
                  fecha: data.fecha,
                  hora_inicio: horaInicio,
                  hora_fin: horaFin,
                  con_equipo: data.con_equipo ?? false,
                  numero_participantes: participantes,
                  total: totalExperiencia,
                  estado: "confirmada",
                },
                {
                  transaction,
                }
              );

            return reservaExperiencia.id;
          }

          const duracionHoras =
            (timeToSeconds(
              horaFin
            ) -
              timeToSeconds(
                horaInicio
              )) /
            3600;

          // Total = (tarifa del recurso + tarifa por hora del instructor, si se eligió) × horas.
          // El equipamiento no suma: solo se acepta si su tarifa es 0 (ver assertEquipmentAllowed).
          const tarifaHora =
            Number(recurso.precio_hora) +
            (data.instructor_id != null
              ? Number(recurso.precio_instructor_hora)
              : 0);

          const total =
            Math.round(
              (tarifaHora *
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

                numero_participantes:
                  participantes,

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

          if (
            estadoActual ===
              "confirmada" &&
            estadoDestino ===
              "completada"
          ) {
            validateReservationHasFinished(
              reserva.fecha,
              reserva.hora_fin
            );
          }

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

            /**
             * Bloqueamos el recurso antes de comprobar
             * disponibilidad.
             *
             * Si 20 reservas canceladas intentan
             * reactivarse sobre el mismo recurso,
             * solamente una puede validar e ingresar
             * al UPDATE inmediatamente.
             */
            const recursoReserva =
              await getLockedResourceOrFail(
                reserva.recurso_id,
                transaction
              );

            if (isExperiencia(recursoReserva)) {
              await validateExperienceCapacity(
                recursoReserva,
                reserva.fecha,
                horaInicio,
                horaFin,
                Number(reserva.numero_participantes),
                id,
                transaction
              );
            } else {
              validateTimeRange(
                horaInicio,
                horaFin
              );

              await validateResourceOverlap(
                reserva.recurso_id,
                reserva.fecha,
                horaInicio,
                horaFin,
                id,
                transaction
              );
            }

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

          // Activar el equipo después no puede cambiar lo cobrado sin recalcular el total.
          if (data.con_equipo === true && !reserva.con_equipo) {
            const recursoEquipo = await RecursoActividad.findByPk(reserva.recurso_id, { transaction });
            if (recursoEquipo) assertEquipmentAllowed(recursoEquipo, true);
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
