/** Una fecha de calendario no es un instante; se presenta con UTC explícito. */
export function parseCalendarDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : undefined;
}
export const calendarDateKey = (date: Date): string => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
export function calendarNights(arrival: string, departure: string): number | null {
  const from = parseCalendarDate(arrival); const to = parseCalendarDate(departure);
  return from && to && to > from ? Math.round((to.getTime() - from.getTime()) / 86400000) : null;
}
export function formatCalendarDate(value: unknown, locale: 'es' | 'en'): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-GT' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}
