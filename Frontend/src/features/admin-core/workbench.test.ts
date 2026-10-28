import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/api/client/http';
import { readList, money, date } from './workbench';

vi.mock('@/api/client/http', () => ({ api: { get: vi.fn() } }));

describe('Contratos de consultas administrativas', () => {
  beforeEach(() => vi.clearAllMocks());
  it('extrae registros del contrato JSON sin inventar registros', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ success: true, data: [{ id: 1 }] });
    expect(await readList<{ id: number }>('/empleados')).toEqual([{ id: 1 }]);
    expect(api.get).toHaveBeenCalledWith('/empleados');
  });
  it('rechaza respuestas que no contienen una lista válida', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ success: false, data: null });
    await expect(readList('/facturas')).rejects.toThrow(/lista válida/);
  });
  it('acepta el contrato real de sucursales con status success sin bandera success', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ status: 'success', data: [{ id: 5, nombre: 'Sede Centro' }] });
    expect(await readList('/sucursales')).toEqual([{ id: 5, nombre: 'Sede Centro' }]);
  });
  it('rechaza una lista si la envoltura indica fallo', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ success: false, data: [] });
    await expect(readList('/facturas')).rejects.toThrow(/lista válida/);
  });
  it('formatea importes y fecha sin alterar sus valores persistidos', () => {
    expect(money('250.50')).toMatch(/250/);
    expect(date('2026-10-26T18:00:00Z')).toBe('2026-10-26');
  });
});
