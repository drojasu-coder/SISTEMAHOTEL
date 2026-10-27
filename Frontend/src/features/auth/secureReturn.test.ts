import { describe, expect, it } from 'vitest';
import { getPostLoginRoute } from './routing';
import type { AuthUser } from './types';

const client: AuthUser = { id: 1, nombre: 'Prueba', email: 'test@example.test', telefono: null, rol: 'cliente' };
describe('Retorno de autenticación', () => {
  it.each(['//evil.test', '/\\evil.test', '/%2fevil.test', '/%252fevil.test', '/%6cogin', '/login#otra', '/registro/', '/habitaciones/../login', '/ruta-inexistente', 'javascript:alert(1)', 'https://evil.test', '/habitaciones\n'])('rechaza %s', (path) => {
    expect(getPostLoginRoute(client, path)).toBe('/');
  });
  it('limita el retorno del personal a su ámbito y mantiene un destino seguro', () => {
    expect(getPostLoginRoute({ ...client, rol: 'recepcionista' }, '/checkout')).toBe('/admin');
    expect(getPostLoginRoute({ ...client, rol: 'empleado_operativo' }, '/mis-reservas/5')).toBe('/cuenta');
  });
  it('descarta secretos y parámetros que no pertenecen al retorno', () => {
    expect(getPostLoginRoute(client, '/habitaciones/7?sede=1&password=abc&client_secret=secret&fecha_entrada=2030-01-01')).toBe('/habitaciones/7?sede=1&fecha_entrada=2030-01-01');
  });
});
