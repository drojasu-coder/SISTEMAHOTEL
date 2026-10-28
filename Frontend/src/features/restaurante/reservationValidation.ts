import { getTodayInGuatemala, isValidCalendarDate } from '@/features/crear-reserva/schemas/busquedaReservaSchema';

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
  return null;
}

export const normalizeMesaTime = (time: string) => time.length === 5 ? `${time}:00` : time;
