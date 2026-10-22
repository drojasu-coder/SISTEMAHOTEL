import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient, ApiError, api } from './http';
import { abortPrivateRequests, setUnauthorizedHandler, tokenStorage } from '@/api/session';

describe('HTTP Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
    setUnauthorizedHandler(null);
  });

  it('performs GET request with query params and returns JSON', async () => {
    const mockData = { success: true, data: [{ id: 1, nombre: 'Suite Colonial' }] };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (header: string) => (header === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockData,
    } as unknown as Response);

    const result = await api.get('/habitaciones', {
      params: { sucursal_id: 1, activa: true },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/habitaciones?sucursal_id=1&activa=true');
    expect(result).toEqual(mockData);
  });

  it('attaches authorization bearer token when provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ auth: true }),
    } as unknown as Response);

    await httpClient('/auth/me', { token: 'mock-jwt-token-123' });

    const calledConfig = (global.fetch as any).mock.calls[0][1];
    expect(calledConfig.headers.Authorization).toBe('Bearer mock-jwt-token-123');
  });

  it('throws ApiError with status and message when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Habitación no encontrada' }),
    } as unknown as Response);

    await expect(api.get('/habitaciones/999')).rejects.toThrow(ApiError);
    await expect(api.get('/habitaciones/999')).rejects.toMatchObject({
      status: 404,
      message: 'Habitación no encontrada',
    });
  });
  it('usa el token de la sesión activa y permite peticiones anónimas con token: null', async () => {
    tokenStorage.set('jwt-sesion');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    } as unknown as Response);

    await api.get('/auth/me');
    await api.post('/auth/login', { email: 'a@b.co', password: 'x' }, { token: null });

    const calls = (global.fetch as any).mock.calls;
    expect(calls[0][1].headers.Authorization).toBe('Bearer jwt-sesion');
    expect(calls[1][1].headers.Authorization).toBeUndefined();
  });

  it('expone code y details del backend en ApiError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: () => 'application/json' },
      json: async () => ({
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos',
        details: [{ field: 'email', message: 'El correo electrónico no es válido' }],
      }),
    } as unknown as Response);

    await expect(api.post('/auth/register', {})).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [{ field: 'email', message: 'El correo electrónico no es válido' }],
    });
  });

  const failing = (status: number, code: string, message = 'texto cualquiera') =>
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: String(status),
      headers: { get: () => 'application/json' },
      json: async () => ({ code, message }),
    } as unknown as Response);

  it.each([
    [401, 'TOKEN_EXPIRED', 'expired'],
    [401, 'INVALID_TOKEN', 'expired'],
    [401, 'USER_NOT_FOUND', 'expired'],
    [403, 'USER_INACTIVE', 'inactive'],
    [403, 'INVALID_USER_ROLE', 'invalid-role'],
  ])('%i %s invalida la sesión (motivo %s)', async (status, code, reason) => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    tokenStorage.set('jwt-sesion');
    global.fetch = failing(status, code);

    await expect(api.get('/auth/me')).rejects.toThrow(ApiError);
    expect(handler).toHaveBeenCalledWith(reason);
  });

  it('un 403 ordinario no invalida la sesión, aunque el texto lo sugiera', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    tokenStorage.set('jwt-sesion');
    global.fetch = failing(
      403,
      'INSUFFICIENT_PERMISSIONS',
      'La cuenta de usuario se encuentra deshabilitada',
    );

    await expect(api.get('/usuarios')).rejects.toMatchObject({ status: 403 });
    expect(handler).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toBe('jwt-sesion');
  });

  it('un 401 de credenciales incorrectas en el login no invalida ninguna sesión', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    tokenStorage.set('jwt-sesion');
    global.fetch = failing(401, 'INVALID_CREDENTIALS');

    await expect(api.post('/auth/login', {}, { token: null })).rejects.toThrow(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('no notifica sesión inválida si la petición viajó sin credenciales', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    global.fetch = failing(401, 'AUTH_TOKEN_REQUIRED');

    await expect(api.get('/auth/me')).rejects.toThrow(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('las solicitudes con token se cancelan al abortar las solicitudes privadas', async () => {
    tokenStorage.set('jwt-sesion');
    let signal: AbortSignal | undefined;
    global.fetch = vi.fn().mockImplementation((_url: string, config: RequestInit) => {
      signal = config.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
        );
      });
    });

    const pending = api.get('/pagos');
    abortPrivateRequests();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(signal?.aborted).toBe(true);
  });

  it('las solicitudes anónimas no se cancelan con las privadas', async () => {
    let signal: AbortSignal | undefined | null = undefined;
    global.fetch = vi.fn().mockImplementation((_url: string, config: RequestInit) => {
      signal = config.signal;
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({}),
      } as unknown as Response);
    });

    await api.post('/auth/login', {}, { token: null });
    expect(signal).toBeUndefined();
  });

  it('convierte un fallo de red en ApiError con status 0', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.get('/health')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });
});
