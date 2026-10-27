import { parseCalendarDate } from '@/lib/dates';
const escapeText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
/** Fecha de habitación = día de calendario; DTEND es la salida exclusiva, sin inventar hora de check-in. */
export function roomCalendar({ id, arrival, departure, title, state }: { id: number; arrival: string; departure: string; title: string; state: string }): string | null {
  if (!Number.isSafeInteger(id) || id < 1 || !parseCalendarDate(arrival) || !parseCalendarDate(departure) || departure <= arrival || !['pendiente', 'confirmada', 'finalizada'].includes(state)) return null;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HOTEL HUNAHPU//Reservation//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:room-${id}@hotel-hunahpu`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`, `DTSTART;VALUE=DATE:${arrival.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${departure.replaceAll('-', '')}`, `SUMMARY:${escapeText(title)}`, `STATUS:${state === 'pendiente' ? 'TENTATIVE' : 'CONFIRMED'}`, 'END:VEVENT', 'END:VCALENDAR'];
  // RFC 5545: plegado por octetos UTF-8 sin cortar un carácter Unicode.
  return lines.map((line) => { let result = ''; let length = 0; for (const char of line) { const bytes = new TextEncoder().encode(char).length; if (length + bytes > 73) { result += '\r\n '; length = 1; } result += char; length += bytes; } return result; }).join('\r\n') + '\r\n';
}
