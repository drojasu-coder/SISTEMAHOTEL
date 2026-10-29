import { useLocale } from './LocaleContext';

/**
 * Textos del selector de franjas horarias (bienestar, amenidades y
 * experiencias). Separados de los diccionarios globales para no interferir
 * con otras ediciones en curso.
 */
const es = {
  horario: 'Horario',
  horaInicio: 'Hora de inicio',
  horaFin: 'Hora de fin',
  elegirHora: 'Elija una hora',
  cargando: 'Buscando horarios disponibles…',
  error: 'No fue posible consultar los horarios disponibles.',
  reintentar: 'Reintentar',
  sinHorarioTitulo: 'Reservas en línea no disponibles',
  sinHorario: 'Este servicio todavía no tiene horario de atención configurado. Puede consultarlo directamente con la sede.',
  elegirTerapeuta: 'Elija un terapeuta para ver sus horarios disponibles.',
  sinFranjas: 'No quedan horarios disponibles en esta fecha. Pruebe con otro día.',
  horarioAtencion: (apertura: string, cierre: string) => `Horario de atención: ${apertura} a ${cierre}.`,
  terminaA: (hora: string) => `Termina a las ${hora}.`,
  seleccionado: (inicio: string, fin: string) => `Seleccionado: ${inicio} – ${fin}`,
  descanso: 'Los horarios ya consideran el descanso de 15 minutos del terapeuta entre citas.',
  duracionFija: (minutos: number) => `Cada reserva dura ${minutos} minutos. Solo se muestran horarios con plazas libres.`,
  usoExclusivo: 'Uso exclusivo: una reserva a la vez',
  usoCompartido: (n: number) => `Espacio compartido: hasta ${n} personas a la vez`,
  revalidacion: 'La disponibilidad se confirma de nuevo al reservar.',
  confirmacion: {
    servicio: 'Servicio', sede: 'Sede', terapeuta: 'Terapeuta', fecha: 'Fecha', horario: 'Horario', duracion: 'Duración', tarifa: 'Tarifa',
    reserva: 'Reserva', pago: 'Pago', confirmada: 'Confirmada', pagoPendiente: 'Pendiente',
    verCitas: 'Ver mis citas',
  },
  errores: {
    SCHEDULE_NOT_CONFIGURED: 'Este servicio todavía no tiene horario de atención configurado.',
    TIME_SLOT_IN_PAST: 'Ese horario ya pasó. Elija otro.',
    OUTSIDE_OPERATING_HOURS: 'Ese horario está fuera del horario de atención.',
    INVALID_TIME_SLOT: 'Elija uno de los horarios disponibles.',
    THERAPIST_BUSY_OR_BUFFER: 'Ese horario acaba de ocuparse. Elija otro de la lista actualizada.',
    INVALID_AMENITY_DURATION: 'La duración de la reserva no coincide con la de esta amenidad.',
  } as Record<string, string>,
};

type Textos = { [K in keyof typeof es]: (typeof es)[K] extends (...args: infer A) => string ? (...args: A) => string : (typeof es)[K] extends string ? string : { [P in keyof (typeof es)[K]]: string } };

const en: Textos = {
  horario: 'Time',
  horaInicio: 'Start time',
  horaFin: 'End time',
  elegirHora: 'Choose a time',
  cargando: 'Looking for available times…',
  error: 'We could not load the available times.',
  reintentar: 'Try again',
  sinHorarioTitulo: 'Online booking unavailable',
  sinHorario: 'This service does not have opening hours configured yet. You can ask the location directly.',
  elegirTerapeuta: 'Choose a therapist to see their available times.',
  sinFranjas: 'There are no available times left on this date. Try another day.',
  horarioAtencion: (apertura: string, cierre: string) => `Opening hours: ${apertura} to ${cierre}.`,
  terminaA: (hora: string) => `Ends at ${hora}.`,
  seleccionado: (inicio: string, fin: string) => `Selected: ${inicio} – ${fin}`,
  descanso: 'Times already include the therapist’s 15-minute break between appointments.',
  duracionFija: (minutos: number) => `Each booking lasts ${minutos} minutes. Only times with free spots are shown.`,
  usoExclusivo: 'Exclusive use: one booking at a time',
  usoCompartido: (n: number) => `Shared space: up to ${n} people at a time`,
  revalidacion: 'Availability is confirmed again when you book.',
  confirmacion: {
    servicio: 'Service', sede: 'Location', terapeuta: 'Therapist', fecha: 'Date', horario: 'Time', duracion: 'Duration', tarifa: 'Rate',
    reserva: 'Booking', pago: 'Payment', confirmada: 'Confirmed', pagoPendiente: 'Pending',
    verCitas: 'View my appointments',
  },
  errores: {
    SCHEDULE_NOT_CONFIGURED: 'This service does not have opening hours configured yet.',
    TIME_SLOT_IN_PAST: 'That time has already passed. Choose another one.',
    OUTSIDE_OPERATING_HOURS: 'That time is outside opening hours.',
    INVALID_TIME_SLOT: 'Choose one of the available times.',
    THERAPIST_BUSY_OR_BUFFER: 'That time was just taken. Choose another from the updated list.',
    INVALID_AMENITY_DURATION: 'The booking length does not match this amenity.',
  },
};

export function useTextosFranjas() {
  const { locale } = useLocale();
  return { t: locale === 'en' ? en : (es as Textos), locale };
}

/** HH:MM en el formato del idioma (24 h en español, 12 h en inglés). */
export function formatearHoraFranja(hora: string, locale: 'es' | 'en'): string {
  const [h, m] = hora.split(':').map(Number);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { hour: 'numeric', minute: '2-digit', hour12: locale === 'en', timeZone: 'UTC' })
    .format(new Date(Date.UTC(1970, 0, 1, h, m)));
}

/** Suma minutos a una hora HH:MM del mismo día. */
export function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
