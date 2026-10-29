import { useLocale } from './LocaleContext';

/**
 * Textos del panel para configurar horarios de reserva (spa, amenidades,
 * actividades y salones). Separados de los diccionarios globales para no
 * interferir con otras ediciones en curso.
 */
const es = {
  sinHorario: 'Sin horario',
  faltaDuracion: 'Falta duración',
  horarioAtencion: 'Horario de atención',
  horarioReserva: 'Horario de reserva',
  horarioUso: 'Horario de uso',
  apertura: 'Apertura',
  cierre: 'Cierre',
  duracionReserva: 'Duración por reserva (min)',
  ayudaServicio: 'Las citas se ofrecen cada 30 minutos desde la apertura y deben terminar antes del cierre. Sin horario, el servicio no acepta reservas en línea.',
  ayudaAmenidad: 'Las reservas se ofrecen cada 30 minutos desde la apertura, con la duración indicada, y deben terminar antes del cierre. Sin estos datos la amenidad no acepta reservas en línea.',
  ayudaRecurso: 'Se ofrecen inicios cada 30 minutos desde la apertura; cada reserva o salida debe terminar antes del cierre. Sin horario, el recurso no acepta reservas en línea.',
  ayudaSalon: 'Los clientes eligen inicio y finalización cada 30 minutos dentro de este horario. Sin horario, el salón no acepta solicitudes en línea.',
  modalidad: 'Modalidad de reserva',
  porHora: 'Por hora (uso exclusivo)',
  experiencia: 'Experiencia con salidas',
  ayudaPorHora: 'El cliente reserva el recurso en exclusiva entre 30 minutos y 2 horas, con la tarifa por hora.',
  duracionMin: 'Duración (min)',
  cupoSalida: 'Cupo por salida',
  precioPersona: 'Precio por persona (Q)',
  errorExperiencia: 'Una experiencia necesita duración (30 a 720 minutos), cupo por salida (1 a 500) y precio por persona.',
  errorHorarioIncompleto: 'Indique la hora de apertura y la de cierre, o deje ambas vacías.',
  errorCierre: 'La hora de cierre debe ser posterior a la de apertura.',
  fueraDeHorario: (n: number) => `Horario guardado. ${n} reserva(s) futura(s) quedan fuera del nuevo horario; se conservan sin cambios para que el equipo las gestione.`,
};

type Textos = { [K in keyof typeof es]: (typeof es)[K] extends (...args: infer A) => string ? (...args: A) => string : string };

const en: Textos = {
  sinHorario: 'No schedule',
  faltaDuracion: 'Missing duration',
  horarioAtencion: 'Opening hours',
  horarioReserva: 'Booking hours',
  horarioUso: 'Hours of use',
  apertura: 'Opening',
  cierre: 'Closing',
  duracionReserva: 'Duration per booking (min)',
  ayudaServicio: 'Appointments are offered every 30 minutes from opening and must end by closing. Without hours, the service does not accept online bookings.',
  ayudaAmenidad: 'Bookings are offered every 30 minutes from opening, with the set duration, and must end by closing. Without these values the amenity does not accept online bookings.',
  ayudaRecurso: 'Start times are offered every 30 minutes from opening; each booking or departure must end by closing. Without hours, the resource does not accept online bookings.',
  ayudaSalon: 'Guests choose start and end every 30 minutes within these hours. Without hours, the venue does not accept online requests.',
  modalidad: 'Booking mode',
  porHora: 'Hourly (exclusive use)',
  experiencia: 'Experience with departures',
  ayudaPorHora: 'Guests book the resource exclusively for 30 minutes to 2 hours at the hourly rate.',
  duracionMin: 'Duration (min)',
  cupoSalida: 'Spots per departure',
  precioPersona: 'Price per person (Q)',
  errorExperiencia: 'An experience needs a duration (30 to 720 minutes), spots per departure (1 to 500) and a price per person.',
  errorHorarioIncompleto: 'Enter both opening and closing times, or leave both empty.',
  errorCierre: 'Closing time must be after opening time.',
  fueraDeHorario: (n: number) => `Hours saved. ${n} future booking(s) fall outside the new hours; they are kept unchanged for the team to manage.`,
};

export function useTextosHorarioAdmin() {
  const { locale } = useLocale();
  return locale === 'en' ? en : (es as Textos);
}
