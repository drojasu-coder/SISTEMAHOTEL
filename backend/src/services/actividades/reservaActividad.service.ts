import { Op } from "sequelize";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";

const db = require("../../models");

const {
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

const getInstructorOrFail =
  async (
    instructorId: number
  ) => {
    const instructor =
      await Instructor.findByPk(
        instructorId
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
    reservaId?: number
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
    reservaId?: number
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

    validateReservationDateTime(
      data.fecha,
      horaInicio
    );

    validateTimeRange(
      horaInicio,
      horaFin
    );

    await getResourceOrFail(
      data.recurso_id
    );

    await validateResourceOverlap(
      data.recurso_id,
      data.fecha,
      horaInicio,
      horaFin
    );

    if (
      data.instructor_id !=
      null
    ) {
      await getInstructorOrFail(
        data.instructor_id
      );

      await validateInstructorOverlap(
        data.instructor_id,
        data.fecha,
        horaInicio,
        horaFin
      );
    }

    const reserva =
      await ReservaActividad.create({
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

        estado:
          "confirmada",
      });

    return getById(
      reserva.id
    );
  };

export const update =
  async (
    id: number,
    data:
      UpdateReservaActividadData
  ) => {
    const reserva =
      await ReservaActividad.findByPk(
        id
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
     * Una reserva que no bloqueaba recursos
     * vuelve a bloquearlos al pasar a confirmada.
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

      await getResourceOrFail(
        reserva.recurso_id
      );

      await validateResourceOverlap(
        reserva.recurso_id,
        reserva.fecha,
        horaInicio,
        horaFin,
        id
      );

      if (
        reserva.instructor_id !=
        null
      ) {
        await getInstructorOrFail(
          reserva.instructor_id
        );

        await validateInstructorOverlap(
          reserva.instructor_id,
          reserva.fecha,
          horaInicio,
          horaFin,
          id
        );
      }
    }

    await reserva.update(
      data
    );

    return getById(id);
  };