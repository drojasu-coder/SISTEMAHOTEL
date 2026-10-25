import { AppError } from "../../utils/AppError";

const db = require("../../models");
const { Op } = require("sequelize");

const {
  CitaBienestar,
  Terapeuta,
  ServicioBienestar,
  Usuario,
} = db;

export const citaInclude = [
  {
    model: Terapeuta,
    as: "Terapeuta",
    attributes: [
      "id",
      "nombre",
      "activo",
    ],
  },
  {
    model: ServicioBienestar,
    attributes: [
      "id",
      "nombre",
      "duracion_minutos",
      "precio",
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

// ======================================================
// OBTENER TODAS LAS CITAS (ADMIN)
// ======================================================

export const getAll = async () => {
  return CitaBienestar.findAll({
    include: citaInclude,
    order: [
      ["fecha", "DESC"],
      ["hora_inicio", "DESC"],
    ],
  });
};

// ======================================================
// OBTENER CITAS DEL CLIENTE AUTENTICADO
// ======================================================

export const getByUserId = async (userId: number) => {
  return CitaBienestar.findAll({
    where: {
      usuario_id: userId,
    },
    include: citaInclude,
    order: [
      ["fecha", "DESC"],
      ["hora_inicio", "DESC"],
    ],
  });
};

// ======================================================
// OBTENER CITA POR ID (ADMIN)
// ======================================================

export const getById = async (id: number) => {
  const cita = await CitaBienestar.findByPk(id, {
    include: citaInclude,
  });

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
// OBTENER CITA POR ID PARA CLIENTE (CON VERIFICACIÓN DE PROPIEDAD)
// ======================================================

export const getByIdForUser = async (id: number, userId: number) => {
  const cita = await CitaBienestar.findByPk(id, {
    include: citaInclude,
  });

  if (!cita) {
    throw new AppError(
      404,
      "APPOINTMENT_NOT_FOUND",
      "La cita de bienestar no existe"
    );
  }

  if (Number(cita.usuario_id) !== Number(userId)) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "No tiene permisos para acceder a esta cita de bienestar"
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
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Convierte minutos desde medianoche
 * a formato HH:MM:SS.
 */
const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

// ======================================================
// CREAR CITA
// ======================================================

export const create = async (data: any) => {
  // ----------------------------------------------------
  // 1. Validar que el terapeuta exista
  // ----------------------------------------------------
  const terapeuta = await Terapeuta.findByPk(data.terapeuta_id);
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
  const servicio = await ServicioBienestar.findByPk(data.servicio_bienestar_id);
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
  const inicioMinutos = timeToMinutes(data.hora_inicio);
  const finServicioMinutos =
    inicioMinutos + Number(servicio.duracion_minutos);

  /*
   * Regla de negocio:
   * el terapeuta necesita 15 minutos
   * de descanso entre citas.
   */
  const BUFFER_MINUTOS = 15;

  const inicioConBufferMinutos = Math.max(
    inicioMinutos - BUFFER_MINUTOS,
    0
  );
  const finConBufferMinutos = finServicioMinutos + BUFFER_MINUTOS;

  const inicioConBuffer = minutesToTime(inicioConBufferMinutos);
  const horaFinCalculada = minutesToTime(finServicioMinutos);
  const horaFinConBuffer = minutesToTime(finConBufferMinutos);

  // ----------------------------------------------------
  // 5. Validar traslape + buffer
  // ----------------------------------------------------
  const traslape = await CitaBienestar.findOne({
    where: {
      terapeuta_id: data.terapeuta_id,
      fecha: data.fecha,
      estado: "confirmada",
      [Op.and]: [
        {
          hora_inicio: {
            [Op.lt]: horaFinConBuffer,
          },
        },
        {
          hora_fin: {
            [Op.gt]: inicioConBuffer,
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
  const cita = await CitaBienestar.create({
    usuario_id: data.usuario_id,
    terapeuta_id: data.terapeuta_id,
    servicio_bienestar_id: data.servicio_bienestar_id,
    fecha: data.fecha,
    hora_inicio: data.hora_inicio,
    hora_fin: horaFinCalculada,
    estado: "confirmada",
  });

  return getById(cita.id);
};

// ======================================================
// ACTUALIZAR ESTADO (ADMIN)
// ======================================================

export const updateStatus = async (
  id: number,
  data: any
) => {
  const cita = await getById(id);

  if (data.estado === "confirmada" && cita.estado !== "confirmada") {
    const terapeuta = await Terapeuta.findByPk(cita.terapeuta_id);
    if (!terapeuta || !terapeuta.activo) {
      throw new AppError(
        422,
        "THERAPIST_INACTIVE",
        "El terapeuta asignado está inactivo"
      );
    }

    const inicioMinutos = timeToMinutes(cita.hora_inicio);
    const finMinutos = timeToMinutes(cita.hora_fin);
    const BUFFER_MINUTOS = 15;
    const inicioConBuffer = minutesToTime(Math.max(inicioMinutos - BUFFER_MINUTOS, 0));
    const horaFinConBuffer = minutesToTime(finMinutos + BUFFER_MINUTOS);

    const traslape = await CitaBienestar.findOne({
      where: {
        id: { [Op.ne]: id },
        terapeuta_id: cita.terapeuta_id,
        fecha: cita.fecha,
        estado: "confirmada",
        [Op.and]: [
          { hora_inicio: { [Op.lt]: horaFinConBuffer } },
          { hora_fin: { [Op.gt]: inicioConBuffer } },
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
  }

  await cita.update(data);
  return getById(id);
};
