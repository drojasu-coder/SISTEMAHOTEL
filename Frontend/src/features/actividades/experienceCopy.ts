import { useLocale } from '@/i18n/LocaleContext';

/** Textos de experiencias guiadas y recursos por hora: [español, inglés]. */
const experienceCopy = {
  modeFilter: ['Modalidad', 'Format'],
  allModes: ['Todas las modalidades', 'All formats'],
  experiencia: ['Experiencias guiadas', 'Guided experiences'],
  por_hora: ['Alquiler por hora', 'Hourly rental'],
  guidedExperience: ['Experiencia guiada', 'Guided experience'],
  hourlyRental: ['Alquiler por hora', 'Hourly rental'],
  duration: ['Duración', 'Duration'],
  capacityPerDeparture: ['Cupo por salida', 'Spots per departure'],
  people: ['{n} personas', '{n} people'],
  perPerson: ['por persona', 'per person'],
  pricePerPerson: ['Precio por persona', 'Price per person'],
  participants: ['Participantes', 'Participants'],
  decrease: ['Quitar un participante', 'Remove one participant'],
  increase: ['Añadir un participante', 'Add one participant'],
  endsAt: ['Termina a las {time}', 'Ends at {time}'],
  chooseStart: ['Elija la hora de inicio para ver la hora de finalización.', 'Choose a start time to see the end time.'],
  estimatedTotal: ['Total estimado', 'Estimated total'],
  estimatedTotalNote: ['{n} × {price}. El total definitivo lo confirma el hotel al registrar la reserva.', '{n} × {price}. The final total is confirmed by the hotel when the booking is recorded.'],
  departuresTitle: ['Salidas programadas ese día', 'Departures scheduled that day'],
  departuresNone: ['Aún no hay salidas programadas ese día: puede proponer la hora de inicio.', 'No departures are scheduled that day yet: you can propose the start time.'],
  departuresLoading: ['Consultando salidas…', 'Checking departures…'],
  departuresError: ['No se pudo consultar la ocupación de ese día.', 'The occupancy for that day could not be checked.'],
  spotsLeft: ['{n} lugares', '{n} spots left'],
  full: ['Completa', 'Full'],
  joinDeparture: ['Unirse a la salida de las {time}', 'Join the {time} departure'],
  maxForDeparture: ['Quedan {n} lugares en esta salida.', '{n} spots are left on this departure.'],
  errorRequiredStart: ['Indique la hora de inicio.', 'Enter the start time.'],
  errorSameDay: ['La experiencia debe terminar el mismo día. Elija una hora de inicio más temprana.', 'The experience must end the same day. Choose an earlier start time.'],
  errorCapacity: ['No quedan suficientes lugares en esa salida. Reduzca los participantes o elija otro horario.', 'There are not enough spots left on that departure. Reduce the participants or choose another time.'],
  errorOverlap: ['Ya hay otra salida programada que se superpone con ese horario. Únase a ella o elija otro horario.', 'Another departure overlaps that time. Join it or choose another time.'],
  participantsSummary: ['Participantes', 'Participants'],
  perHour: ['por hora', 'per hour'],
  hourlyIncludes: ['Uso exclusivo del espacio entre 30 min y 2 h.', 'Exclusive use of the space for 30 min to 2 h.'],
  guidedIncludes: ['Salida guiada con hora de fin fija.', 'Guided departure with a fixed end time.'],
  hourlyTotalNote: ['{hours} h × {price} por hora. El total definitivo lo confirma el hotel al registrar la reserva.', '{hours} h × {price} per hour. The final total is confirmed by the hotel when the booking is recorded.'],
  chooseTimes: ['Indique la hora de inicio y de fin para calcular el total.', 'Enter the start and end times to calculate the total.'],
  resourceRate: ['Tarifa del espacio', 'Space rate'],
  instructorCharge: ['Opcional: si elige instructor se suman {price} por hora.', 'Optional: choosing an instructor adds {price} per hour.'],
  instructorNoCharge: ['Opcional y sin cargo adicional.', 'Optional, at no extra charge.'],
  noInstructors: ['No hay instructores disponibles en este momento; puede reservar el espacio sin instructor.', 'No instructors are available right now; you can book the space without one.'],
  equipmentNoCharge: ['Solicitar equipamiento (sin cargo)', 'Request equipment (no charge)'],
  equipmentNotBookable: ['El equipamiento de este espacio no se puede añadir en la reserva en línea.', 'Equipment for this space cannot be added to an online booking.'],
  hourlyBreakdown: ['{hours} h × ({base} espacio + {instructor} instructor) por hora.', '{hours} h × ({base} space + {instructor} instructor) per hour.'],
} as const satisfies Record<string, readonly [string, string]>;

export type ExperienceCopyKey = keyof typeof experienceCopy;

export function useExperienceCopy() {
  const { locale } = useLocale();
  return (key: ExperienceCopyKey, params: Record<string, string | number> = {}) => {
    let text: string = experienceCopy[key][locale === 'en' ? 1 : 0];
    for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value));
    return text;
  };
}

/** "6 h", "1 h 30 min", "45 min": igual en ambos idiomas. */
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

/** Hora de fin de una experiencia (HH:MM) o null si pasaría de medianoche. */
export function experienceEnd(start: string, minutes: number): string | null {
  const [h, m] = start.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const end = h * 60 + m + minutes;
  if (end >= 24 * 60) return null;
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
}
