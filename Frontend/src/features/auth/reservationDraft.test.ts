import { afterEach, describe, expect, it } from 'vitest';
import { restoreRoomDraft, saveRoomDraft, validatedRoomDraft } from './reservationDraft';
const path = '/habitaciones/7?sede=1&fecha_entrada=2030-01-01&fecha_salida=2030-01-03&numero_huespedes=2&min=700&orden=precio_asc';
afterEach(() => sessionStorage.clear());
describe('Borrador mínimo restaurado', () => {
  it('conserva recurso, sede, fechas, huéspedes y filtros, descartando secretos', () => {
    saveRoomDraft(`${path}&client_secret=secret&password=secret&usuario_id=4`);
    expect(restoreRoomDraft()).toBe(path);
    expect(sessionStorage.getItem('hunahpu.room-search.v1')).not.toMatch(/secret|usuario/);
  });
  it.each(['not json', 'null', '[]', '{"version":2,"path":"/habitaciones"}', JSON.stringify({ version: 1, path, password: 'secret' }), JSON.stringify({ version: 1, path: '//evil.test' })])('no confía en almacenamiento manipulado: %s', (raw) => {
    sessionStorage.setItem('hunahpu.room-search.v1', raw);
    expect(restoreRoomDraft()).toBeNull();
  });
  it.each(['fecha_entrada=2030-02-31&fecha_salida=2030-03-04', 'fecha_entrada=2030-01-02&fecha_salida=2030-01-01', 'fecha_entrada=2030-01-01&fecha_salida=2030-01-03&numero_huespedes=2.5', 'fecha_entrada=2030-01-01&fecha_salida=2030-01-03&sede=-1'])('rechaza criterios inválidos: %s', (query) => {
    expect(validatedRoomDraft(`/habitaciones?${query}`)).toBeNull();
  });
  it('conserva fechas pasadas para su corrección explícita, sin tratarlas como disponibilidad', () => {
    expect(validatedRoomDraft('/habitaciones?fecha_entrada=2020-01-01&fecha_salida=2020-01-03')).not.toBeNull();
  });
});
