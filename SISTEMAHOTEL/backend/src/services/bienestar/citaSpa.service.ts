import { AppError } from "../../utils/AppError";

const db = require("../../models");
const { Op } = require("sequelize");

const {
  CitaBienestar,
  Terapeuta,
  ServicioBienestar,
  Usuario,
} = db;

// ======================================================
// OBTENER TODAS LAS CITAS
// ======================================================

export const getAll = async () => {
  return CitaBienestar.findAll({
    include: [
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
    ],

    order: [
      ["fecha", "DESC"],
      ["hora_inicio", "DESC"],
    ],
  });
};

// ======================================================
// OBTENER CITA POR ID
// ======================================================

export const getById = async (
  id: number
) => {
  const cita =
    await CitaBienestar.findByPk(
      id
    );

  if (!cita) {
    throw new AppError(
      404,
      "APPOINTMENT_NOT_FOUND",
      "La cita de bienestar no existe"
    );
  }

  return cita;
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

// ======================================================
// CREAR CITA
// ======================================================

export const create = async (
  data: any
) => {
  // ----------------------------------------------------
  // 1. Validar que el terapeuta exista
  // ----------------------------------------------------

  const terapeuta =
    await Terapeuta.findByPk(
      data.terapeuta_id
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
      data.servicio_bienestar_id
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

  /*
   * Regla de negocio:
   * el terapeuta necesita 15 minutos
   * de descanso entre citas.
   */
  const BUFFER_MINUTOS = 15;

  // Ampliamos el inicio hacia atrás
  // para proteger el descanso posterior
  // de una cita anterior.
  const inicioConBufferMinutos =
    Math.max(
      inicioMinutos -
        BUFFER_MINUTOS,
      0
    );

  // Ampliamos el final hacia adelante
  // para proteger el descanso posterior
  // de la nueva cita.
  const finConBufferMinutos =
    finServicioMinutos +
    BUFFER_MINUTOS;

  const inicioConBuffer =
    minutesToTime(
      inicioConBufferMinutos
    );

  const horaFinCalculada =
    minutesToTime(
      finServicioMinutos
    );

  const horaFinConBuffer =
    minutesToTime(
      finConBufferMinutos
    );

  // ----------------------------------------------------
  // 5. Validar traslape + buffer
  // ----------------------------------------------------

  const traslape =
    await CitaBienestar.findOne({
      where: {
        terapeuta_id:
          data.terapeuta_id,

        fecha:
          data.fecha,

        estado:
          "confirmada",

        /*
         * Hay conflicto cuando:
         *
         * inicio existente <
         * final nueva cita + buffer
         *
         * Y
         *
         * final existente >
         * inicio nueva cita - buffer
         */
        [Op.and]: [
          {
            hora_inicio: {
              [Op.lt]:
                horaFinConBuffer,
            },
          },
          {
            hora_fin: {
              [Op.gt]:
                inicioConBuffer,
            },
          },
        ],
      },
    });

  if (traslape) {
    throw new AppError(
      409,
      "THERAPIST_BUSY_OR_BUFFER",
      "El terapeuta no está disponible en este horario. Se requiere un tiempo de descanso de 15 minutos entre citas."
    );
  }

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
    });

  return cita;
};

// ======================================================
// ACTUALIZAR ESTADO
// ======================================================

export const updateStatus = async (
  id: number,
  data: any
) => {
  const cita =
    await getById(id);

  await cita.update(
    data
  );

  return cita;
};