import { afterEach, describe, expect, it, vi } from 'vitest';
import { roomCriteriaErrors, fetchRoomAvailability, roomLoginState, type RoomCriteria } from './roomSearch';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { calendarDateKey, calendarNights, parseCalendarDate } from '@/lib/dates';
const criteria: RoomCriteria = { fecha_entrada: '2030-01-01', fecha_salida: '2030-01-03', numero_huespedes: '2', tipo_habitacion_id: '' };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { resolve, promise }; }
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); sessionStorage.clear(); });
describe('Contrato de búsqueda de habitaciones', () => {
  it('usa hoy en Guatemala y no impone 30 noches; conserva el rango inválido para corregirlo explícitamente', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-27T02:00:00Z'));
    expect(getTodayInGuatemala()).toBe('2026-10-26');
    const invalid = { ...criteria, fecha_entrada: '2026-02-31', fecha_salida: '2026-02-30' };
    expect(roomCriteriaErrors(invalid)).toMatchObject({ fecha_entrada: 'validArrival', fecha_salida: 'validDeparture' });
    expect(invalid.fecha_entrada).toBe('2026-02-31');
    expect(roomCriteriaErrors({ ...criteria, fecha_salida: '2030-03-05' })).toEqual({});
    expect(roomCriteriaErrors({ ...criteria, fecha_salida: criteria.fecha_entrada })).toMatchObject({ fecha_salida: 'departureAfter' });
    expect(roomCriteriaErrors({ ...criteria, numero_huespedes: '2.5' })).toMatchObject({ numero_huespedes: 'validGuests' });
    expect(calendarNights('2030-01-01', '2030-01-03')).toBe(2);
    expect(calendarDateKey(parseCalendarDate('2030-01-01')!)).toBe('2030-01-01');
  });
  it('limita a dos consultas simultáneas, conserva unidades y separa errores parciales', async () => {
    const first = deferred<Awaited<ReturnType<typeof reservasApi.getDisponibilidad>>>();
    const second = deferred<Awaited<ReturnType<typeof reservasApi.getDisponibilidad>>>();
    const call = vi.spyOn(reservasApi, 'getDisponibilidad').mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockRejectedValueOnce(new Error('sin conexión')).mockResolvedValueOnce([]);
    const pending = fetchRoomAvailability(criteria, [1, 2, 3, 4]);
    expect(call).toHaveBeenCalledTimes(2);
    first.resolve([{ id: 1, numero: '101', sucursal_id: 1, tipo_habitacion_id: 1, estado: 'ocupada', noches: 2, tarifa_noche: '780.00', total_estimado: '1560.00' }]);
    await Promise.resolve(); expect(call).toHaveBeenCalledTimes(2);
    second.resolve([]); const result = await pending;
    expect(result.rooms.map((room) => room.id)).toEqual([1]);
    expect(result.rooms[0].total_estimado).toBe('1560.00');
    expect(result.failures).toEqual([3]);
    expect(call).toHaveBeenCalledTimes(4);
    expect(call).toHaveBeenCalledWith({ sucursal_id: 1, fecha_entrada: criteria.fecha_entrada, fecha_salida: criteria.fecha_salida, numero_huespedes: 2 });
  });
  it('no inicia lotes de una búsqueda cancelada ni agrupa respuestas incompatibles por sede', async () => {
    let cancelled = false; const first = deferred<Awaited<ReturnType<typeof reservasApi.getDisponibilidad>>>();
    const call = vi.spyOn(reservasApi, 'getDisponibilidad').mockReturnValueOnce(first.promise).mockResolvedValueOnce([]);
    const pending = fetchRoomAvailability(criteria, [1, 2, 3, 4], () => cancelled);
    const caught = pending.catch((error) => error);
    cancelled = true; first.resolve([]);
    expect((await caught).name).toBe('AbortError'); expect(call).toHaveBeenCalledTimes(2);
  });
  it('el borrador contiene solo un retorno interno de habitaciones y no acepta destinos externos', () => {
    expect(roomLoginState('//example.test')).toEqual({ from: '/habitaciones' });
    const path = '/habitaciones/7?fecha_entrada=2030-01-01&fecha_salida=2030-01-03&numero_huespedes=2';
    expect(roomLoginState(path)).toEqual({ from: path });
    const draft = JSON.parse(sessionStorage.getItem('hunahpu.room-search.v1')!);
    expect(Object.keys(draft)).toEqual(['version', 'path']);
    expect(draft.path).toBe(path);
  });
});
