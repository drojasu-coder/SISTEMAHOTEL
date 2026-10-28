import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { tokenStorage } from '@/api/session';
import { ReportesPage } from './ReportesPage';
import { reportText } from './textos';
import type { OperationalReport } from './types';

const session = vi.hoisted(() => ({ user: { id: 1, rol: 'admin' } }));
vi.mock('@/features/auth/AuthContext', () => ({ useAuth: () => session }));
const NativeURL = URL;
const calls: URL[] = [];
const json = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'Content-Type': 'application/json' } });
const kinds = ['reservas-restaurante', 'actividades-bienestar', 'cotizaciones-eventos'] as const;
function response(url: URL): OperationalReport {
  const kind = url.pathname.split('/').at(-1) as OperationalReport['reporte'];
  return { reporte: kind, titulo: reportText('es')[kind], titulo_en: reportText('en')[kind], generado: '2026-10-27T21:00:00Z', moneda: 'GTQ', sede: 'Antigua QA',
    filtros: { desde: url.searchParams.get('desde')!, hasta: url.searchParams.get('hasta')!, sucursal_id: Number(url.searchParams.get('sucursal_id')) || null, estado: url.searchParams.get('estado') as 'cotizacion' | null },
    criterio: 'Fecha programada; estados actuales.', criterio_en: 'Scheduled date; current statuses.', nota: 'No acredita cobros ni asistencia.', nota_en: 'Not evidence of payment or attendance.',
    columnas: [{ clave: 'referencia', etiqueta: 'Referencia', etiqueta_en: 'Reference' }, { clave: 'tipo_servicio', etiqueta: 'Tipo de servicio', etiqueta_en: 'Service type' }, { clave: 'estado', etiqueta: 'Estado operativo', etiqueta_en: 'Operational status' }],
    metricas: [{ clave: 'registros', etiqueta: 'Operaciones', etiqueta_en: 'Operations', formato: 'entero' }], resumen: { registros: 21 },
    registros: [{ referencia: url.searchParams.get('pagina') === '2' ? 'B-42' : 'A-41', tipo_servicio: 'experiencia', estado: kind === 'cotizaciones-eventos' ? 'cotizacion' : 'confirmada' }],
    paginacion: { pagina: Number(url.searchParams.get('pagina')) || 1, por_pagina: 20, total_paginas: 2 } };
}
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><LocaleProvider><MemoryRouter><ReportesPage /></MemoryRouter></LocaleProvider></QueryClientProvider>);
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); calls.length = 0; session.user.rol = 'admin'; tokenStorage.set('reportes-unit-token');
  vi.stubGlobal('URL', class extends NativeURL { static createObjectURL = vi.fn(() => 'blob:report'); static revokeObjectURL = vi.fn(); });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname.endsWith('/sucursales')) return json([{ id: 5, nombre: 'Antigua QA', activa: true }, { id: 6, nombre: 'Capital QA', activa: true }]);
    if (url.pathname.includes('/reportes/')) {
      calls.push(url);
      const format = url.searchParams.get('formato');
      if (format) {
        const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        return { ok: true, headers: new Headers({ 'content-type': mime }), blob: async () => new Blob(['file'], { type: mime }) } as Response;
      }
      return json(response(url));
    }
    return json([]);
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); tokenStorage.clear(); });
async function select(kind: typeof kinds[number]) {
  mount(); await screen.findByRole('option', { name: 'Antigua QA' });
  fireEvent.change(screen.getByLabelText('Reporte', { exact: true }), { target: { value: kind } });
  fireEvent.change(screen.getByLabelText('Sede del reporte'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Fecha inicial'), { target: { value: '2027-01-10' } });
  fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2027-01-12' } });
}
describe('Reportes operativos: interacción del centro existente (HTTP simulado)', () => {
  it.each(kinds)('%s conserva el tipo y los filtros de la consulta al paginar y descargar', async kind => {
    await select(kind);
    expect(calls).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Estado de la reserva'), { target: { value: kind === 'cotizaciones-eventos' ? 'cotizacion' : 'confirmada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar reporte' }));
    await screen.findByRole('heading', { name: reportText('es')[kind] });
    expect(screen.getAllByText('Experiencia guiada').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Reporte', { exact: true }), { target: { value: kinds.find(value => value !== kind) } });
    fireEvent.change(screen.getByLabelText('Sede del reporte'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2027-02-01' } });
    expect(screen.getByText(/Tiene filtros sin aplicar/)).toBeInTheDocument();
    for (const label of ['Descargar PDF', 'Descargar Excel']) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      await waitFor(() => expect(screen.getByText('Archivo descargado.')).toBeInTheDocument());
    }
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(2);
    for (const call of calls.filter(value => value.searchParams.has('formato'))) {
      expect(call.pathname.endsWith(kind)).toBe(true);
      expect(call.searchParams.get('sucursal_id')).toBe('5'); expect(call.searchParams.get('hasta')).toBe('2027-01-12');
      expect(call.searchParams.get('estado')).toBe(kind === 'cotizaciones-eventos' ? 'cotizacion' : 'confirmada');
    }
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findAllByText('B-42'); expect(calls.at(-1)!.searchParams.get('pagina')).toBe('2');
    expect(calls.at(-1)!.pathname.endsWith(kind)).toBe(true);
  });

  it.each(kinds)('%s diferencia carga, error y vacío sin ofrecer resultados obsoletos', async kind => {
    await select(kind);
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }));
    fireEvent.click(screen.getByRole('button', { name: 'Consultar reporte' }));
    expect(await screen.findByText('Consultando operaciones…')).toBeInTheDocument();
    resolve(json(null, 500));
    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible consultar el reporte');
    expect(screen.queryByRole('button', { name: 'Descargar PDF' })).not.toBeInTheDocument();
    vi.mocked(fetch).mockImplementationOnce(async input => { const value = response(new URL(String(input), 'http://localhost')); return json({ ...value, registros: [], resumen: { registros: 0 }, paginacion: { pagina: 1, por_pagina: 20, total_paginas: 0 } }); });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay registros con los filtros seleccionados.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descargar Excel' })).toBeEnabled();
  });

  it('al cambiar el tipo elimina estados incompatibles y mantiene las fechas', async () => {
    await select('cotizaciones-eventos');
    fireEvent.change(screen.getByLabelText('Estado de la reserva'), { target: { value: 'cotizacion' } });
    fireEvent.change(screen.getByLabelText('Reporte', { exact: true }), { target: { value: 'reservas-restaurante' } });
    expect(screen.getByLabelText('Estado de la reserva')).toHaveValue('');
    expect(screen.queryByRole('option', { name: 'Cotización' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Fecha inicial')).toHaveValue('2027-01-10');
  });
});
