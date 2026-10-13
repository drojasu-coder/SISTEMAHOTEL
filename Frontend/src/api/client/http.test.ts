import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient, ApiError, api } from './http';

describe('HTTP Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
});
