import { AppError } from "../../utils/AppError";
import { cartReferenceProcessingExposure } from "../pago.service";

const db = require("../../models");
const { Op } = require("sequelize");

const {
  CitaBienestar,
  Terapeuta,
  ServicioBienestar,
  Usuario,
} = db;

const citaSpaInclude = [
  {
    model: Terapeuta,
    attributes: [
      "nombre",
      "activo",
    ],
  },
  {
    model: ServicioBienestar,
    attributes: [
      "nombre",
      "duracion_minutos",
      "precio",
    ],
  },
  {
    model: Usuario,
    attributes: [
      "nombre",
      "email",
    ],
  },
];

const normalizeCitaSpa = (cita: any) => {
  const citaData = cita.toJSON();

  citaData.Terapeuta = citaData.Terapeutum ?? null;
  delete citaData.Terapeutum;

  return citaData;
};

// ======================================================
// OBTENER TODAS LAS CITAS
// ======================================================

export const getAll = async () => {
  const citas = await CitaBienestar.findAll({
    include: citaSpaInclude,

    order: [
      ["fecha", "DESC"],
      ["hora_inicio", "DESC"],
    ],
  });

  return citas.map(normalizeCitaSpa);
};

// ======================================================
// OBTENER CITA POR ID
// ======================================================

export const getById = async (
  id: number
) => {
  const cita =
    await CitaBienestar.findByPk(
      id,
      {
        include: citaSpaInclude,
      }
    );

  if (!cita) {
    throw new AppError(
      404,
      "APPOINTMENT_NOT_FOUND",
      "La cita de bienestar no existe"
    );
  }

  return normalizeCitaSpa(cita);
};

export const getMine = async (
  usuarioId: number
) => {
  const citas =
    await CitaBienestar.findAll({
      where: {
        usuario_id: usuarioId,
      },
      include: citaSpaInclude,
      order: [
        ["fecha", "DESC"],
        ["hora_inicio", "DESC"],
      ],
    });

  return citas.map(normalizeCitaSpa);
};

export const getMineById = async (
  usuarioId: number,
  id: number
) => {
  const cita =
    await CitaBienestar.findOne({
      where: {
        id,
        usuario_id: usuarioId,
      },
      include: citaSpaInclude,
    });

  if (!cita) {
    throw new AppError(
      404,
      "APPOINTMENT_NOT_FOUND",
      "La cita de bienestar no existe"
    );
  }

  return normalizeCitaSpa(cita);
};

// ======================================================
// FUNCIONES AUXILIARES PARA HORAS
// ======================================================

/**
 * Convierte una hora HH:MM o HH:MM:SS
 * a minutos desde medianoche.
 */
const timeToMinutes = (
  timeStr: string
) => {
  const [
    hours,
    minutes,
  ] = timeStr
    .split(":")
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
};

/**
 * Convierte minutos desde medianoche
 * a formato HH:MM:SS.
 */
const minutesToTime = (
  totalMinutes: number
) => {
  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}:00`;
};

const THERAPIST_BUFFER_MINUTES = 15;

const assertTherapistAvailability = async ({
  therapistId,
  date,
  startTime,
  endTime,
  transaction,
  excludeAppointmentId,
}: {
  therapistId: number;
  date: string;
  startTime: string;
  endTime: string;
  transaction: any;
  excludeAppointmentId?: number;
}) => {
  const startMinutes =
    timeToMinutes(startTime);
  const endMinutes =
    timeToMinutes(endTime);
  const bufferedStart =
    minutesToTime(
      Math.max(
        startMinutes -
          THERAPIST_BUFFER_MINUTES,
        0
      )
    );
  const bufferedEnd =
    minutesToTime(
      endMinutes +
        THERAPIST_BUFFER_MINUTES
    );

  const overlap =
    await CitaBienestar.findOne({
      where: {
        terapeuta_id:
          therapistId,
        fecha:
          date,
        estado:
          "confirmada",
        ...(excludeAppointmentId !==
        undefined
          ? {
              id: {
                [Op.ne]:
                  excludeAppointmentId,
              },
            }
          : {}),
        [Op.and]: [
          {
            hora_inicio: {
              [Op.lt]:
                bufferedEnd,
            },
          },
          {
            hora_fin: {
              [Op.gt]:
                bufferedStart,
            },
          },
        ],
      },
      transaction,
    });

  if (overlap) {
    throw new AppError(
      409,
      "THERAPIST_BUSY_OR_BUFFER",
      "El terapeuta no está disponible en este horario. Se requiere un tiempo de descanso de 15 minutos entre citas."
    );
  }
};

// ======================================================
// CREAR CITA
// ======================================================

export const create = async (
  data: any
) => {
  return db.sequelize.transaction(
    async (
      transaction: any
    ) => {
  // ----------------------------------------------------
  // 1. Validar que el terapeuta exista
  // ----------------------------------------------------

  const terapeuta =
    await Terapeuta.findByPk(
      data.terapeuta_id,
      {
        transaction,
        lock:
          transaction.LOCK.UPDATE,
      }
    );

  if (!terapeuta) {
    throw new AppError(
      404,
      "THERAPIST_NOT_FOUND",
      "El terapeuta no existe"
    );
  }

  // ----------------------------------------------------
  // 2. Validar que el terapeuta esté activo
  // ----------------------------------------------------

  if (!terapeuta.activo) {
    throw new AppError(
      422,
      "THERAPIST_INACTIVE",
      "El terapeuta seleccionado se encuentra inactivo"
    );
  }

  // ----------------------------------------------------
  // 3. Validar que el servicio de bienestar exista
  // ----------------------------------------------------

  const servicio =
    await ServicioBienestar.findByPk(
      data.servicio_bienestar_id,
      {
        transaction,
      }
    );

  if (!servicio) {
    throw new AppError(
      404,
      "WELLNESS_SERVICE_NOT_FOUND",
      "El servicio de bienestar no existe"
    );
  }

  // ----------------------------------------------------
  // 4. Calcular duración de la cita
  // ----------------------------------------------------

  const inicioMinutos =
    timeToMinutes(
      data.hora_inicio
    );

  const finServicioMinutos =
    inicioMinutos +
    Number(
      servicio.duracion_minutos
    );

  const horaFinCalculada =
    minutesToTime(
      finServicioMinutos
    );

  // ----------------------------------------------------
  // 5. Validar traslape + buffer
  // ----------------------------------------------------

  await assertTherapistAvailability({
    therapistId:
      data.terapeuta_id,
    date:
      data.fecha,
    startTime:
      data.hora_inicio,
    endTime:
      horaFinCalculada,
    transaction,
  });

  // ----------------------------------------------------
  // 6. Crear la cita
  // ----------------------------------------------------

  const cita =
    await CitaBienestar.create({
      usuario_id:
        data.usuario_id,

      terapeuta_id:
        data.terapeuta_id,

      servicio_bienestar_id:
        data.servicio_bienestar_id,

      fecha:
        data.fecha,

      hora_inicio:
        data.hora_inicio,

      hora_fin:
        horaFinCalculada,

      estado:
        "confirmada",
    }, {
      transaction,
    });

  return cita;
    }
  );
};

// ======================================================
// ACTUALIZAR ESTADO
// ======================================================

export const updateStatus = async (
  id: number,
  data: any
) => {
  return db.sequelize.transaction(
    async (
      transaction: any
    ) => {
      const cita =
        await CitaBienestar.findByPk(
          id,
          {
            transaction,
            lock:
              transaction.LOCK.UPDATE,
          }
        );

      if (!cita) {
        throw new AppError(
          404,
          "APPOINTMENT_NOT_FOUND",
          "La cita de bienestar no existe"
        );
      }

      if (
        data.estado === "cancelada" &&
        cita.estado !== "cancelada"
      ) {
        const processingExposure =
          await cartReferenceProcessingExposure(
            "bienestar",
            cita.id,
            transaction
          );

        if (processingExposure > 0) {
          throw new AppError(
            409,
            "RESERVATION_HAS_PROCESSING_PAYMENT",
            "La cita tiene un pago en procesamiento y no puede cancelarse"
          );
        }
      }

      if (
        data.estado === "confirmada" &&
        cita.estado !== "confirmada"
      ) {
        const terapeuta =
          await Terapeuta.findByPk(
            cita.terapeuta_id,
            {
              transaction,
              lock:
                transaction.LOCK.UPDATE,
            }
          );

        if (!terapeuta) {
          throw new AppError(
            404,
            "THERAPIST_NOT_FOUND",
            "El terapeuta no existe"
          );
        }

        if (!terapeuta.activo) {
          throw new AppError(
            422,
            "THERAPIST_INACTIVE",
            "El terapeuta seleccionado se encuentra inactivo"
          );
        }

        await assertTherapistAvailability({
          therapistId:
            cita.terapeuta_id,
          date:
            cita.fecha,
          startTime:
            cita.hora_inicio,
          endTime:
            cita.hora_fin,
          transaction,
          excludeAppointmentId:
            cita.id,
        });
      }

      await cita.update(
        data,
        {
          transaction,
        }
      );

      return cita;
    }
  );
};
