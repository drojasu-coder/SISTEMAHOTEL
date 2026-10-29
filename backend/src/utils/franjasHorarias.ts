import { z } from "zod";
import { AppError } from "./AppError";

/**
 * Franjas reservables a partir del horario de operación configurado en cada
 * servicio o recurso (hora_apertura / hora_cierre), en hora de Guatemala.
 *
 * Política (confirmada por el propietario):
 * - Los inicios se ofrecen cada 30 minutos desde la hora de apertura.
 * - Una reserva debe terminar a más tardar a la hora de cierre.
 * - Sin horario configurado no se ofrecen franjas ni se aceptan reservas.
 *
 * Cada módulo aplica después sus propias reglas (terapeuta, aforo, cupo).
 */
export const INTERVALO_FRANJAS_MINUTOS = 30;

const HORA = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

/** Campo de horario editable desde el panel: HH:MM o null para quitarlo. */
export const horaOperacionSchema = z
  .string()
  .regex(HORA, "La hora debe tener formato HH:MM")
  .transform((valor) => valor.slice(0, 5))
  .nullable()
  .optional();

export const minutosDe = (hora: string): number => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export const horaDe = (minutos: number): string =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

/** Fecha (AAAA-MM-DD) y minuto actual en America/Guatemala. */
export const ahoraEnGuatemala = (instante = new Date()): { fecha: string; minutos: number } => {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Guatemala",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instante).map((p) => [p.type, p.value]),
  );
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, minutos: Number(partes.hour) * 60 + Number(partes.minute) };
};

export interface HorarioOperacion {
  apertura: string;
  cierre: string;
}

/** Horario completo y coherente, o null si no está configurado. */
export const leerHorario = (registro: { hora_apertura?: string | null; hora_cierre?: string | null }): HorarioOperacion | null => {
  const apertura = registro.hora_apertura?.slice(0, 5);
  const cierre = registro.hora_cierre?.slice(0, 5);
  if (!apertura || !cierre || !HORA.test(apertura) || !HORA.test(cierre)) return null;
  return minutosDe(apertura) < minutosDe(cierre) ? { apertura, cierre } : null;
};

/**
 * Comprueba en el panel que el horario sea coherente con la duración: ambos
 * valores o ninguno, apertura antes del cierre y espacio para una sesión.
 */
export const validarHorarioConfigurado = (
  datos: { hora_apertura?: string | null; hora_cierre?: string | null },
  duracionMinutos: number | null,
) => {
  const apertura = datos.hora_apertura ?? null;
  const cierre = datos.hora_cierre ?? null;
  if (apertura === null && cierre === null) return;
  if (apertura === null || cierre === null) {
    throw new AppError(400, "OPERATING_HOURS_INCOMPLETE", "Indique la hora de apertura y la hora de cierre, o deje ambas vacías");
  }
  if (minutosDe(apertura) >= minutosDe(cierre)) {
    throw new AppError(400, "OPERATING_HOURS_INVALID", "La hora de apertura debe ser anterior a la hora de cierre");
  }
  if (duracionMinutos !== null && minutosDe(apertura) + duracionMinutos > minutosDe(cierre)) {
    throw new AppError(400, "OPERATING_HOURS_TOO_SHORT", "El horario de operación es más corto que la duración del servicio");
  }
};

/**
 * Inicios válidos de un día: cada 30 minutos desde la apertura, terminando a
 * más tardar al cierre y nunca en el pasado (hora de Guatemala).
 */
export const iniciosDelDia = (
  horario: HorarioOperacion,
  duracionMinutos: number,
  fecha: string,
  ahora = ahoraEnGuatemala(),
): string[] => {
  if (fecha < ahora.fecha) return [];
  const inicios: string[] = [];
  const ultimo = minutosDe(horario.cierre) - duracionMinutos;
  for (let t = minutosDe(horario.apertura); t <= ultimo; t += INTERVALO_FRANJAS_MINUTOS) {
    if (fecha === ahora.fecha && t <= ahora.minutos) continue;
    inicios.push(horaDe(t));
  }
  return inicios;
};

/**
 * Validación al confirmar: el inicio debe ser una de las franjas ofrecidas.
 * Los códigos permiten al cliente explicar el motivo exacto.
 */
export const validarInicioEnFranja = (
  horario: HorarioOperacion | null,
  duracionMinutos: number,
  fecha: string,
  horaInicio: string,
  ahora = ahoraEnGuatemala(),
) => {
  if (!horario) {
    throw new AppError(422, "SCHEDULE_NOT_CONFIGURED", "Este servicio todavía no tiene horario de atención configurado");
  }
  const inicio = minutosDe(horaInicio);
  if (fecha < ahora.fecha || (fecha === ahora.fecha && inicio <= ahora.minutos)) {
    throw new AppError(422, "TIME_SLOT_IN_PAST", "El horario seleccionado ya pasó");
  }
  const apertura = minutosDe(horario.apertura);
  if (inicio < apertura || inicio + duracionMinutos > minutosDe(horario.cierre)) {
    throw new AppError(422, "OUTSIDE_OPERATING_HOURS", `El horario de atención es de ${horario.apertura} a ${horario.cierre}`);
  }
  if ((inicio - apertura) % INTERVALO_FRANJAS_MINUTOS !== 0) {
    throw new AppError(422, "INVALID_TIME_SLOT", "Seleccione uno de los horarios disponibles");
  }
};

/**
 * Reservas futuras que quedan fuera de un horario recién guardado. No se modifican
 * ni se cancelan: el panel solo informa cuántas son para que el equipo las gestione.
 */
export const contarFueraDeHorario = (
  reservas: Array<{ inicio: string; fin: string }>,
  horario: HorarioOperacion | null,
): number => {
  if (!horario) return 0;
  const apertura = minutosDe(horario.apertura);
  const cierre = minutosDe(horario.cierre);
  return reservas.filter((r) => minutosDe(r.inicio) < apertura || minutosDe(r.fin) > cierre).length;
};
