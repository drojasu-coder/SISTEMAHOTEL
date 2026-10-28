import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { tokenStorage } from '@/api/session';
import { fetchBranding } from '@/features/media/api/mediaApi';
import { AppRouter } from '@/app/router/AppRouter';
import { ReportesPage } from './ReportesPage';
import type { RoomReport } from './types';

const session = vi.hoisted(() => ({ user: { id: 1, nombre: 'Admin QA', rol: 'admin' }, status: 'authenticated' }));
vi.mock('@/features/auth/AuthContext', () => ({ useAuth: () => ({ ...session, logout: vi.fn(), retry: vi.fn() }) }));
const NativeURL = URL;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const calls: URL[] = [];
const report = (url: URL): RoomReport => ({
  reporte: 'reservas-habitaciones', generado: '2026-10-27T21:00:00.000Z', moneda: 'GTQ', sede: 'Sede Centro QA',
  filtros: { desde: url.searchParams.get('desde')!, hasta: url.searchParams.get('hasta')!,
    sucursal_id: Number(url.searchParams.get('sucursal_id')) || null, estado: url.searchParams.get('estado') as 'confirmada' | null },
  criterio: '', nota_importes: '', resumen: { reservas: 21, huespedes: 42, noches_periodo: 30, importe_reservado: 1200.5, canceladas: 0, importe_cancelado: 0 },
  registros: [{ id: url.searchParams.get('pagina') === '2' ? 42 : 41, sucursal_id: 5, sede: 'Sede Centro QA', habitacion: '101',
    tipo_habitacion: 'Doble', fecha_entrada: '2027-01-08', fecha_salida: '2027-01-12', estado: 'confirmada', huespedes: 2, noches_periodo: 2, importe_reservado: 1200.5 }],
  paginacion: { pagina: Number(url.searchParams.get('pagina')) || 1, por_pagina: 20, total_paginas: 2 },
});
function mount(router = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><LocaleProvider>{router ? <AppRouter /> : <MemoryRouter><ReportesPage /></MemoryRouter>}</LocaleProvider></QueryClientProvider>);
}
const setDates = () => {
  fireEvent.change(screen.getByLabelText('Fecha inicial'), { target: { value: '2027-01-10' } });
  fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2027-01-12' } });
};
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); calls.length = 0;
  session.user.rol = 'admin'; session.status = 'authenticated'; tokenStorage.set('jwt-reportes-qa');
  vi.mocked(fetchBranding).mockResolvedValue({ logoHorizontalColor: '', logoHorizontalBlanco: '', isotipoColor: '', expiresAt: null });
  vi.stubGlobal('URL', class extends NativeURL {
    static createObjectURL = vi.fn(() => 'blob:reportes-qa');
    static revokeObjectURL = vi.fn();
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname.endsWith('/media/branding')) return json({ data: { logoHorizontalColor: '', logoHorizontalBlanco: '', isotipoColor: '', expiresAt: null } });
    if (url.pathname.endsWith('/sucursales')) return json({ data: [{ id: 5, nombre: 'Sede Centro QA', activa: true }, { id: 6, nombre: 'Sede Norte QA', activa: true }] });
    if (url.pathname.endsWith('/reportes/reservas-habitaciones')) {
      calls.push(url);
      const formato = url.searchParams.get('formato');
      if (formato) {
        const mime = formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        return { ok: true, headers: new Headers({ 'content-type': mime }), blob: async () => new Blob(['file-qa'], { type: mime }) } as Response;
      }
      return json({ success: true, data: report(url) });
    }
    return json({ data: [] });
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); tokenStorage.clear(); });

describe('Centro de reportes (HTTP simulado; API PostgreSQL verificada en backend)', () => {
  it('espera una consulta explícita y ofrece calendarios, sede y estado', async () => {
    mount();
    await screen.findByRole('option', { name: 'Sede Centro QA' });
    expect(screen.getByLabelText('Fecha inicial')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('Fecha final')).toHaveAttribute('type', 'date');
    expect(calls).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Descargar PDF' })).not.toBeInTheDocument();
    setDates();
    fireEvent.change(screen.getByLabelText('Sede del reporte'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Estado de la reserva'), { target: { value: 'confirmada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar reporte' }));
    await screen.findByRole('button', { name: 'Descargar PDF' });
    expect(calls[0].searchParams.get('sucursal_id')).toBe('5');
    expect(calls[0].searchParams.get('estado')).toBe('confirmada');
    expect(screen.getAllByText('Q1,200.50').length).toBeGreaterThan(0);
    expect(screen.getByText(/No representan pagos cobrados/)).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(call => (call[1] as RequestInit)?.headers && ((call[1] as RequestInit).headers as Record<string, string>).Authorization === 'Bearer jwt-reportes-qa')).toBe(true);
  });

  it('descarga ambos formatos con los filtros aplicados aunque se edite el formulario y pagina en servidor', async () => {
    mount(); await screen.findByRole('option', { name: 'Sede Centro QA' }); setDates();
    fireEvent.change(screen.getByLabelText('Sede del reporte'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar reporte' }));
    await screen.findByRole('button', { name: 'Descargar PDF' });
    fireEvent.change(screen.getByLabelText('Sede del reporte'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2027-02-20' } });
    expect(screen.getByText(/Tiene filtros sin aplicar/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Descargar PDF' }));
    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel' }));
    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(2));
    for (const url of calls.filter(url => url.searchParams.has('formato'))) {
      expect(url.searchParams.get('sucursal_id')).toBe('5');
      expect(url.searchParams.get('hasta')).toBe('2027-01-12');
      expect(url.searchParams.has('pagina')).toBe(false);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findAllByText('#42');
    expect(calls.at(-1)!.searchParams.get('pagina')).toBe('2');
    expect(calls.at(-1)!.searchParams.get('sucursal_id')).toBe('5');
  });

  it('rechaza rango inválido sin consultar y presenta vacío real con totales cero', async () => {
    mount(); await screen.findByRole('option', { name: 'Sede Centro QA' }); setDates();
    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2027-01-01' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Consultar reporte' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Revise las fechas');
    expect(calls).toHaveLength(0);
    const original = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(async (...args) => {
      const url = new URL(String(args[0]), 'http://localhost');
      if (!url.pathname.includes('/reportes/')) return original(...args);
      const value = report(url);
      return json({ data: { ...value, registros: [], resumen: { reservas: 0, huespedes: 0, noches_periodo: 0, importe_reservado: 0, canceladas: 0, importe_cancelado: 0 }, paginacion: { pagina: 1, por_pagina: 20, total_paginas: 0 } } });
    });
    setDates(); fireEvent.click(screen.getByRole('button', { name: 'Consultar reporte' }));
    expect(await screen.findByText('No hay reservas con los filtros seleccionados.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descargar Excel' })).toBeEnabled();
  });

  it('muestra carga y permite reintentar un error sin ofrecer descargas obsoletas', async () => {
    mount(); await screen.findByRole('option', { name: 'Sede Centro QA' }); setDates();
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }));
    fireEvent.click(screen.getByRole('button', { name: 'Consultar reporte' }));
    expect(await screen.findByText('Consultando reservas…')).toBeInTheDocument();
    resolve(json({ message: 'Error QA' }, 500));
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible consultar el reporte');
    expect(screen.queryByRole('button', { name: 'Descargar PDF' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: 'Descargar PDF' })).toBeEnabled();
  });

  it('no guarda HTML como PDF y presenta el error de descarga', async () => {
    mount(); await screen.findByRole('option', { name: 'Sede Centro QA' }); setDates();
    fireEvent.click(screen.getByRole('button', { name: 'Consultar reporte' }));
    await screen.findByRole('button', { name: 'Descargar PDF' });
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'text/html' }), blob: async () => new Blob(['<html/>'], { type: 'text/html' }) } as Response);
    fireEvent.click(screen.getByRole('button', { name: 'Descargar PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible descargar el archivo');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('registra la ruta y el enlace del panel para admin', async () => {
    window.history.replaceState({}, '', '/admin/reportes'); mount(true);
    expect(await screen.findByRole('heading', { name: 'Centro de reportes' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Reportes' })[0]).toHaveAttribute('href', '/admin/reportes');
  });
  it('redirige al inicio de sesión sin consultar el reporte para una sesión anónima', async () => {
    session.status = 'anonymous'; window.history.replaceState({}, '', '/admin/reportes'); mount(true);
    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(calls).toHaveLength(0);
  });
  it.each(['cliente', 'recepcionista', 'gerente_habitaciones', 'gerente_restaurante'])('deniega la ruta a %s sin consultar reservas', async rol => {
    session.user.rol = rol; window.history.replaceState({}, '', '/admin/reportes'); mount(true);
    await screen.findByRole('heading', { name: /Acceso no autorizado/ });
    expect(calls).toHaveLength(0);
    expect(screen.queryByRole('link', { name: 'Reportes' })).not.toBeInTheDocument();
  });
});
