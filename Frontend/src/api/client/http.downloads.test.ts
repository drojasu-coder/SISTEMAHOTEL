import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './http';
import { setUnauthorizedHandler, tokenStorage } from '@/api/session';

afterEach(() => { vi.unstubAllGlobals(); tokenStorage.clear(); setUnauthorizedHandler(null); });
describe('HTTP: descargas binarias con el manejo de sesión existente', () => {
  it('conserva bytes y envía credenciales sin pasar responseType a fetch', async () => {
    tokenStorage.set('jwt-qa');
    const file = new Blob(['%PDF-qa'], { type: 'application/pdf' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'content-type': 'application/pdf' }), blob: async () => file });
    vi.stubGlobal('fetch', fetchMock);
    expect(await api.get('/reportes/reservas-habitaciones', { responseType: 'blob' })).toBe(file);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-qa');
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('responseType');
  });
  it.each([[401, 'TOKEN_EXPIRED'], [403, 'INSUFFICIENT_PERMISSIONS']])('interpreta error JSON %s incluso al solicitar un archivo', async (status, code) => {
    tokenStorage.set('jwt-qa'); const handler = vi.fn(); setUnauthorizedHandler(handler);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ code, message: 'Error QA' }) }));
    await expect(api.get('/reportes/reservas-habitaciones', { responseType: 'blob' })).rejects.toMatchObject({ status, code });
    expect(handler.mock.calls.length).toBe(status === 401 ? 1 : 0);
  });
});
