import { getTodayInGuatemala, isValidCalendarDate } from '@/features/crear-reserva/schemas/busquedaReservaSchema';

/**
 * Horario de reservas de mesa (hora de Guatemala). Debe coincidir con
 * backend/src/constants/restaurant.ts, que es quien lo aplica.
 */
export const RESTAURANT_BOOKING_HOURS = {
  apertura: '07:00',
  cierre: '22:00',
  intervaloMinutos: 30,
  duracionMinutos: 90,
  ultimoInicio: '20:30',
} as const;

const toMinutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const guatemalaNow = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Guatemala', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date());

/** Todas las franjas de inicio del horario (HH:MM), de apertura hasta la última hora de inicio. */
export const allMesaSlots = () => {
  const slots: string[] = [];
  const start = toMinutes(RESTAURANT_BOOKING_HOURS.apertura);
  const end = toMinutes(RESTAURANT_BOOKING_HOURS.ultimoInicio);
  for (let m = start; m <= end; m += RESTAURANT_BOOKING_HOURS.intervaloMinutos) slots.push(toTime(m));
  return slots;
};

/** Franjas seleccionables para una fecha: hoy excluye las horas ya pasadas en Guatemala. */
export const mesaSlotsFor = (fecha: string) => {
  const slots = allMesaSlots();
  if (fecha !== getTodayInGuatemala()) return slots;
  const now = guatemalaNow();
  return slots.filter((slot) => `${slot}:00` > now);
};

export const isWithinBookingHours = (hora: string) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(hora)) return false;
  return allMesaSlots().includes(hora.slice(0, 5));
};

export interface MesaReservationFields { fecha: string; hora: string; numero_comensales: number }
export const validMesaReservationFields = (value: MesaReservationFields) =>
  isValidCalendarDate(value.fecha) && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value.hora) &&
  Number.isSafeInteger(value.numero_comensales) && value.numero_comensales > 0;

/** Misma fecha/hora puntual que el servidor; no calcula intervalos ni disponibilidad. */
export function validateMesaReservation(value: MesaReservationFields, capacity: number) {
  if (!isValidCalendarDate(value.fecha)) return 'errorFechaInvalida';
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value.hora)) return 'errorHoraInvalida';
  if (!Number.isSafeInteger(value.numero_comensales) || value.numero_comensales < 1) return 'errorComensalesInvalidos';
  if (value.numero_comensales > capacity) return 'errorCapacidad';
  const today = getTodayInGuatemala();
  if (value.fecha < today) return 'errorFechaPasada';
  const now = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Guatemala', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date());
  if (value.fecha === today && normalizeMesaTime(value.hora) < now) return 'errorHoraPasada';
  if (!isWithinBookingHours(value.hora)) return 'errorFueraHorario';
  return null;
}

export const normalizeMesaTime = (time: string) => time.length === 5 ? `${time}:00` : time;
