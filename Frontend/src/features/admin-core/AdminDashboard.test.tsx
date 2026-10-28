import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { AdminPage } from '@/pages/AdminPage';
import { AdminScopeProvider } from './AdminScopeContext';
const session = vi.hoisted(() => ({ user: { id: 1, nombre: 'Persona QA', rol: 'admin' } }));
vi.mock('@/features/auth/AuthContext', () => ({ useAuth: () => session }));
const summary = { total_habitaciones: 4, habitaciones_disponibles: 1, habitaciones_ocupadas: 1,
  habitaciones_mantenimiento: 1, habitaciones_limpieza: 1, habitaciones_otro_estado: 0,
  porcentaje_ocupacion: 75, reservas_activas: 3, llegadas_hoy: 2, salidas_hoy: 1, reservas_pendientes: 0 };
const data = { fecha_consulta: '2026-10-27', consultado_en: '2026-10-27T18:00:00.000Z', sucursal_filtro: null,
  resumen: summary, llegadas: [], salidas: [], reservas_recientes: [], pendientes_atencion: [] };
const json = (value: unknown, status = 200) => new Response(JSON.stringify({ data: value }), { status, headers: { 'content-type': 'application/json' } });
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <LocaleProvider><MemoryRouter><AdminScopeProvider><AdminPage /></AdminScopeProvider></MemoryRouter></LocaleProvider>
  </QueryClientProvider>);
}
beforeEach(() => {
  session.user.rol = 'admin'; localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async input => {
    const url = new URL(String(input), 'http://localhost');
    return url.pathname.endsWith('/admin/alcance')
      ? json({ global: true, sedes: [{ id: 5, nombre: 'Sede QA', activa: true }] }) : json(data);
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('Inicio operativo', () => {
  it('muestra ocupación por reservas separada del estado físico, sin facturación ni accesos comerciales duplicados', async () => {
    mount();
    await screen.findByText('75%');
    expect(screen.getByText('Ocupación por reservas')).toBeInTheDocument();
    expect(screen.getByText('Estado operativo de habitaciones')).toBeInTheDocument();
    expect(screen.getByText(/No acredita un check-in/)).toBeInTheDocument();
    expect(screen.queryByText(/Facturación mensual/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver facturación|Ver pagos|Salones ocupados/ })).not.toBeInTheDocument();
  });
  it('oculta los indicadores anteriores si falla una actualización, sin convertir el error en cero', async () => {
    mount(); await screen.findByText('75%');
    vi.mocked(fetch).mockResolvedValueOnce(json({ message: 'QA failure' }, 500));
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(screen.queryByText('75%')).not.toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Los indicadores no están disponibles');
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });
  it('no muestra cifras si la respuesta tiene un contrato inválido', async () => {
    const original = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation((input, init) => String(input).includes('/admin/alcance') ? original(input, init) : Promise.resolve(json({ resumen: { porcentaje_ocupacion: 0 } })));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Los indicadores no están disponibles');
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });
  it('no solicita reservas para un rol sin permiso de gestión de habitaciones', async () => {
    session.user.rol = 'gerente_restaurante'; mount();
    expect(await screen.findByText(/Utilice los módulos habilitados/)).toBeInTheDocument();
    // Solo obtiene sus sedes autorizadas; nunca consulta el resumen del dashboard.
    expect(vi.mocked(fetch).mock.calls.every(([url]) => String(url).includes('/admin/alcance'))).toBe(true);
  });
});
