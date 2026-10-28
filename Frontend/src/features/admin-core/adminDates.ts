/**
 * Fechas legibles para el panel administrativo según el idioma.
 *
 * - Fecha de calendario (AAAA-MM-DD, p. ej. llegada o salida): se presenta tal
 *   cual, sin conversión horaria, para no desplazar el día.
 * - Instante (ISO con hora, p. ej. createdAt): se presenta en la zona horaria
 *   del hotel e indica la zona, para no depender del navegador.
 * - Hora del día (HH:MM[:SS], p. ej. reserva de mesa): hora local del hotel,
 *   sin conversión.
 * Un valor no reconocido se devuelve sin alterar.
 */
export const HOTEL_TIME_ZONE = 'America/Guatemala';

type Locale = 'es' | 'en' | string;
const tag = (locale: Locale) => (locale === 'en' ? 'en-US' : 'es-GT');

const CALENDAR = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function formatAdminCalendarDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return '';
  const match = CALENDAR.exec(value.trim());
  if (!match) return value;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return value;
  return new Intl.DateTimeFormat(tag(locale), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function formatAdminTimestamp(value: string | null | undefined, locale: Locale): string {
  if (!value) return '';
  if (CALENDAR.test(value.trim())) return formatAdminCalendarDate(value, locale);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(tag(locale), {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: locale === 'en',
    timeZone: HOTEL_TIME_ZONE, timeZoneName: 'short',
  }).format(date);
  // Español: 24 h con la zona del hotel (p. ej. «27 oct 2026, 17:14 GMT-6»).
}

export function formatAdminTimeOfDay(value: string | null | undefined, locale: Locale): string {
  if (!value) return '';
  const match = TIME.exec(value.trim());
  if (!match) return value;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  if (hours > 23 || minutes > 59) return value;
  // Español: 24 h (19:30); inglés: 12 h (7:30 PM).
  return new Intl.DateTimeFormat(tag(locale), { hour: 'numeric', minute: '2-digit', hour12: locale === 'en', timeZone: 'UTC' })
    .format(new Date(Date.UTC(1970, 0, 1, hours, minutes)));
}
