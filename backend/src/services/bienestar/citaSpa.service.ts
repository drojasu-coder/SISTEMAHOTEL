import { AppError } from "../../utils/AppError";
import { cartReferenceProcessingExposure } from "../pago.service";
import { iniciosDelDia, leerHorario, minutosDe, validarInicioEnFranja, INTERVALO_FRANJAS_MINUTOS } from "../../utils/franjasHorarias";

const db = require("../../models");
const { Op } = require("sequelize");

const {
  CitaBienestar,
  Terapeuta,
  ServicioBienestar,
  Usuario,
  sequelize,
} = db;

export const citaInclude = [
  {
    model: Terapeuta,
    as: "Terapeuta",
    attributes: [
      "id",
      "nombre",
      "activo",
      "sucursal_id",
    ],
  },
  {
    model: ServicioBienestar,
    attributes: [
      "id",
      "nombre",
      "duracion_minutos",
      "precio",
      "sucursal_id",
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

export const getAll = async (where: Record<string | symbol, unknown> = {}) => {
  return CitaBienestar.findAll({
    where,
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
// FUNCIONES AUXILIARES PARA HORAS Y DISPONIBILIDAD
// ======================================================

/**
 * Convierte una hora HH:MM o HH:MM:SS a minutos desde medianoche.
 */
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Convierte minutos desde medianoche a formato HH:MM:SS.
 */
const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

const BUFFER_MINUTOS = 15;
const THERAPIST_BUFFER_MINUTES = 15;

const formatDateOnly = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayStr = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayStr}`;
};

/**
 * Valida disponibilidad y descanso de 15 minutos entre sesiones
 * de un terapeuta de forma bidireccional y persistente.
 */
export const validateTherapistAvailability = async ({
  terapeutaId,
  fecha,
  horaInicio,
  duracionMinutos,
  excludeCitaId,
  transaction,
}: {
  terapeutaId: number;
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
  excludeCitaId?: number;
  transaction?: any;
}) => {
  const [year, month, day] = fecha.split("-").map(Number);
  const [startH, startM] = horaInicio.split(":").map(Number);
  const startDate = new Date(year, month - 1, day, startH, startM, 0, 0);
  const startMs = startDate.getTime();
  const endMs = startMs + duracionMinutos * 60 * 1000;

  const bufferStartMs = startMs - BUFFER_MINUTOS * 60 * 1000;
  const bufferEndMs = endMs + BUFFER_MINUTOS * 60 * 1000;

  const bufferStartDate = new Date(bufferStartMs);
  const bufferEndDate = new Date(bufferEndMs);

  const relevantDates = Array.from(
    new Set([fecha, formatDateOnly(bufferStartDate), formatDateOnly(bufferEndDate)])
  );

  const existingCitas = await CitaBienestar.findAll({
    where: {
      terapeuta_id: terapeutaId,
      fecha: { [Op.in]: relevantDates },
      estado: "confirmada",
      ...(excludeCitaId ? { id: { [Op.ne]: excludeCitaId } } : {}),
    },
    transaction,
  });

  for (const cand of existingCitas) {
    const [cYear, cMonth, cDay] = cand.fecha.split("-").map(Number);
    const [cStartH, cStartM] = cand.hora_inicio.split(":").map(Number);
    const candStartDate = new Date(cYear, cMonth - 1, cDay, cStartH, cStartM, 0, 0);
    const candStartMs = candStartDate.getTime();

    const [cEndH, cEndM] = cand.hora_fin.split(":").map(Number);
    let candEndDate = new Date(cYear, cMonth - 1, cDay, cEndH, cEndM, 0, 0);
    let candEndMs = candEndDate.getTime();
    if (candEndMs <= candStartMs) {
      candEndMs += 24 * 60 * 60 * 1000;
    }

    if (candStartMs < bufferEndMs && candEndMs > bufferStartMs) {
      throw new AppError(
        409,
        "THERAPIST_BUSY_OR_BUFFER",
        "El terapeuta no está disponible en este horario. Se requiere un tiempo de descanso de 15 minutos entre citas."
      );
    }
  }

  const endDate = new Date(endMs);
  const horaFinCalculada = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}:00`;

  return { horaFinCalculada };
};

export const assertTherapistAvailability = async ({
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
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  const duracionMinutos = endMinutes - startMinutes;

  await validateTherapistAvailability({
    terapeutaId: therapistId,
    fecha: date,
    horaInicio: startTime,
    duracionMinutos,
    excludeCitaId: excludeAppointmentId,
    transaction,
  });
};

// ======================================================
// CREAR CITA
// ======================================================

export const create = async (data: any) => {
  const citaId = await db.sequelize.transaction(async (transaction: any) => {
    // ----------------------------------------------------
    // 1. Validar que el terapeuta exista
    // ----------------------------------------------------
    const terapeuta = await Terapeuta.findByPk(data.terapeuta_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

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
    const servicio = await ServicioBienestar.findByPk(
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

    if (servicio.activo === false) {
      throw new AppError(
        422,
        "WELLNESS_SERVICE_INACTIVE",
        "El servicio de bienestar no está disponible para nuevas citas"
      );
    }

    // Un servicio de sede solo puede atenderlo un terapeuta de esa misma sede.
    // Los servicios generales (sin sede) conservan el comportamiento anterior.
    if (
      servicio.sucursal_id != null &&
      terapeuta.sucursal_id !== servicio.sucursal_id
    ) {
      throw new AppError(
        422,
        "THERAPIST_BRANCH_MISMATCH",
        "El terapeuta seleccionado no atiende en la sede de este servicio"
      );
    }

    // ----------------------------------------------------
    // 4. Validar que el inicio sea una franja ofrecida: horario de atención
    //    configurado, cada 30 minutos, sin pasar del cierre ni estar en el pasado
    // ----------------------------------------------------
    validarInicioEnFranja(
      leerHorario(servicio),
      Number(servicio.duracion_minutos),
      data.fecha,
      data.hora_inicio,
    );

    // ----------------------------------------------------
    // 5. Validar traslape + buffer y calcular hora_fin
    // ----------------------------------------------------
    const { horaFinCalculada } = await validateTherapistAvailability({
      terapeutaId: data.terapeuta_id,
      fecha: data.fecha,
      horaInicio: data.hora_inicio,
      duracionMinutos: Number(servicio.duracion_minutos),
      transaction,
    });

    const cita = await CitaBienestar.create(
      {
        usuario_id: data.usuario_id,
        terapeuta_id: data.terapeuta_id,
        servicio_bienestar_id: data.servicio_bienestar_id,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: horaFinCalculada,
        estado: "confirmada",
      },
      {
        transaction,
      }
    );

    return cita.id;
  });

  return getById(citaId);
};

// ======================================================
// ACTUALIZAR ESTADO (ADMIN)
// ======================================================

export const updateStatus = async (
  id: number,
  data: any
) => {
  await db.sequelize.transaction(async (transaction: any) => {
    const cita = await CitaBienestar.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

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
      const processingExposure = await cartReferenceProcessingExposure(
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
      const terapeuta = await Terapeuta.findByPk(cita.terapeuta_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

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
        therapistId: cita.terapeuta_id,
        date: cita.fecha,
        startTime: cita.hora_inicio,
        endTime: cita.hora_fin,
        transaction,
        excludeAppointmentId: cita.id,
      });
    }

    await cita.update(data, {
      transaction,
    });
  });

  return getById(id);
};


/**
 * Franjas reservables de un servicio en una fecha, por terapeuta activo de su sede.
 * Inicios cada 30 minutos dentro del horario de atención del servicio; se descartan
 * los que chocan con citas confirmadas del terapeuta o su descanso de 15 minutos
 * (misma regla que validateTherapistAvailability). La cita se vuelve a validar al confirmar.
 * Sin horario configurado no se ofrece ninguna franja.
 */
export const getDisponibilidadServicio = async (servicioId: number, fecha: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new AppError(400, "INVALID_DATE", "La fecha no es válida");
  const servicio = await ServicioBienestar.findByPk(servicioId);
  if (!servicio || servicio.activo === false) throw new AppError(404, "WELLNESS_SERVICE_NOT_FOUND", "El servicio de bienestar no existe");
  const duracion = Number(servicio.duracion_minutos);
  const horario = leerHorario(servicio);
  const terapeutas = await Terapeuta.findAll({
    where: { activo: true, ...(servicio.sucursal_id != null ? { sucursal_id: servicio.sucursal_id } : {}) },
    attributes: ["id", "nombre"],
    order: [["nombre", "ASC"]],
  });
  const ids = terapeutas.map((item: any) => item.id);
  const citas = ids.length ? await CitaBienestar.findAll({
    where: { terapeuta_id: { [Op.in]: ids }, fecha, estado: "confirmada" },
    attributes: ["terapeuta_id", "hora_inicio", "hora_fin"],
  }) : [];
  const inicios = horario ? iniciosDelDia(horario, duracion, fecha) : [];
  return {
    fecha,
    duracion_minutos: duracion,
    descanso_minutos: BUFFER_MINUTOS,
    intervalo_minutos: INTERVALO_FRANJAS_MINUTOS,
    horario,
    terapeutas: terapeutas.map((terapeuta: any) => {
      const ocupadas = citas.filter((cita: any) => cita.terapeuta_id === terapeuta.id).map((cita: any) => {
        const inicio = minutosDe(cita.hora_inicio);
        let fin = minutosDe(cita.hora_fin);
        if (fin <= inicio) fin += 24 * 60;
        return { inicio, fin };
      });
      return {
        id: terapeuta.id,
        nombre: terapeuta.nombre,
        // Un inicio t choca si la cita empieza antes de t + duración + descanso y termina después de t - descanso.
        horarios: inicios.filter((hora) => {
          const t = minutosDe(hora);
          return !ocupadas.some((c: { inicio: number; fin: number }) => c.inicio < t + duracion + BUFFER_MINUTOS && c.fin > t - BUFFER_MINUTOS);
        }),
      };
    }),
  };
};
