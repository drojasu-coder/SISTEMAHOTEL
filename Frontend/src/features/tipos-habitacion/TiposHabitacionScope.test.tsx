import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { LANGUAGE_KEY } from '@/features/preferencias/storage';
import { AdminScopeProvider } from '@/features/admin-core/AdminScopeContext';
import { TipoHabitacionFormModal } from './components/TipoHabitacionFormModal';
import { TiposHabitacionPage } from '@/pages/TiposHabitacionPage';

const session = vi.hoisted(() => ({ user: { id: 1, rol: 'admin', nombre: 'QA' } }));
vi.mock('@/features/auth/AuthContext', () => ({ useAuth: () => session }));
const general = { id: 1, nombre: 'Categoría general QA', sucursal_id: null, capacidad_maxima: 2, tarifa_noche: 100, descripcion: null };
const owned = { ...general, id: 2, nombre: 'Categoría sede QA', sucursal_id: 5 };
let records = [general, owned];
const json = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { headers: { 'content-type': 'application/json' } });
function mount(page = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><LocaleProvider><MemoryRouter><AdminScopeProvider>
    {page ? <TiposHabitacionPage /> : <TipoHabitacionFormModal open tipo={null} onClose={() => {}} onSuccess={() => {}} />}
  </AdminScopeProvider></MemoryRouter></LocaleProvider></QueryClientProvider>);
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); session.user.rol = 'admin';
  records = [general, owned];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, config?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname.endsWith('/admin/dashboard')) return json({ global: session.user.rol === 'admin', sedes: [{ id: 5, nombre: 'Sede autorizada QA', activa: true }] });
    if (url.pathname.endsWith('/sucursales')) return json([{ id: 5, nombre: 'Sede autorizada QA', activa: true }, { id: 6, nombre: 'Otra sede QA', activa: true }]);
    if (config?.method === 'POST') {
      const created = { ...owned, id: 9, ...JSON.parse(String(config.body)) };
      records.push(created); return json(created);
    }
    return json(records);
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('Tipos: contrato real de sede y categorías generales', () => {
  it('envía sucursal_id seleccionado al guardar', async () => {
    mount();
    const site = await screen.findByRole('combobox', { name: 'Sede del tipo de habitación' });
    await screen.findByRole('option', { name: 'Sede autorizada QA' });
    fireEvent.change(site, { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Nombre del tipo de habitación'), { target: { value: 'Tipo QA' } });
    fireEvent.change(screen.getByLabelText(/Capacidad máxima/), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Tarifa por noche/), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar tipo de habitación' }));
    await waitFor(() => {
      const call = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'POST');
      expect(call).toBeDefined();
      expect(JSON.parse(String(call![1]!.body))).toMatchObject({ sucursal_id: 5, nombre: 'Tipo QA', tarifa_noche: 150 });
    });
  });
  it('el personal solo puede seleccionar sedes autorizadas, sin opción general ni sedes públicas ajenas', async () => {
    session.user.rol = 'recepcionista'; mount();
    await screen.findByRole('option', { name: 'Sede autorizada QA' });
    expect(screen.queryByRole('option', { name: /General/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Otra sede QA' })).not.toBeInTheDocument();
  });
  it('el personal puede leer categorías generales pero no se le ofrece editarlas', async () => {
    session.user.rol = 'gerente_habitaciones'; mount(true);
    await screen.findAllByText('Categoría general QA');
    expect(screen.queryByRole('button', { name: 'Editar Categoría general QA' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar Categoría sede QA' }).length).toBeGreaterThan(0);
  });
  it('la creación actualiza el listado visible y conserva el ámbito enviado', async () => {
    mount(true); await screen.findAllByText('Categoría sede QA');
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo tipo de habitación' }));
    await screen.findByRole('option', { name: 'Sede autorizada QA' });
    fireEvent.change(screen.getByLabelText('Sede del tipo de habitación'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Nombre del tipo de habitación'), { target: { value: 'Nuevo tipo sede QA' } });
    fireEvent.change(screen.getByLabelText(/Capacidad máxima/), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Tarifa por noche/), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar tipo de habitación' }));
    await screen.findAllByText('Nuevo tipo sede QA');
    expect(records.find(row => row.id === 9)?.sucursal_id).toBe(5);
  });
  it('presenta y valida el formulario en inglés', async () => {
    localStorage.setItem(LANGUAGE_KEY, 'en'); mount();
    await screen.findByRole('option', { name: 'General category (general administrator only)' });
    fireEvent.click(screen.getByRole('button', { name: 'Save room type' }));
    expect(await screen.findByText('Nightly rate is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Room type site')).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });
});
