import { describe, expect, it } from 'vitest';
import { formatAdminCalendarDate, formatAdminTimeOfDay, formatAdminTimestamp } from './adminDates';

describe('Fechas legibles del panel administrativo', () => {
  it('fecha de calendario: no desplaza el día por zona horaria y respeta el idioma', () => {
    expect(formatAdminCalendarDate('2027-04-10', 'es')).toMatch(/10.*abr.*2027/i);
    expect(formatAdminCalendarDate('2027-04-10', 'en')).toBe('Apr 10, 2027');
    expect(formatAdminCalendarDate('2027-01-01', 'en')).toBe('Jan 1, 2027');
    expect(formatAdminCalendarDate('2027-02-30', 'es')).toBe('2027-02-30');
  });

  it('instante ISO: se muestra en la hora del hotel (Guatemala) con su zona, no en la del navegador', () => {
    // 2026-10-27T23:14Z = 27 oct, 17:14 en Guatemala (UTC-6)
    expect(formatAdminTimestamp('2026-10-27T23:14:32.388Z', 'en')).toMatch(/Oct 27, 2026.*5:14\s?PM.*(CST|GMT-6)/);
    expect(formatAdminTimestamp('2026-10-27T23:14:32.388Z', 'es')).toMatch(/27.*oct.*2026.*17:14.*(CST|GMT-6)/i);
    // 03:00Z cae el día anterior en Guatemala
    expect(formatAdminTimestamp('2026-10-28T03:00:00.000Z', 'en')).toMatch(/Oct 27, 2026.*9:00\s?PM/);
    expect(formatAdminTimestamp('no-es-fecha', 'es')).toBe('no-es-fecha');
  });

  it('hora del día de una reserva de mesa: sin conversión horaria', () => {
    expect(formatAdminTimeOfDay('19:30:00', 'en')).toMatch(/7:30\s?PM/);
    expect(formatAdminTimeOfDay('19:30:00', 'es')).toMatch(/19:30/);
    expect(formatAdminTimeOfDay('25:00', 'es')).toBe('25:00');
  });
});
