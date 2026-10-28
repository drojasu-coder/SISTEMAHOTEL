import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/api/client/http';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { PersonalPage } from '@/pages/PersonalPage';
import { AdminScopeProvider } from './AdminScopeContext';

const session = vi.hoisted(() => ({ user: { id: 8, nombre: 'Operador QA', rol: 'admin', email: 'qa@hotel.test', telefono: null }, status: 'authenticated' }));
vi.mock('@/features/auth/AuthContext', () => ({ useAuth: () => ({ ...session, logout: vi.fn(), retry: vi.fn() }) }));
const a = { id: 10, nombre: 'Sede autorizada', activa: true };
const b = { id: 20, nombre: 'Sede adicional', activa: true };
const employee = { id: 30, usuario_id: 8, sucursal_id: a.id, area: 'Operaciones', fecha_contratacion: null, sedesAdicionales: [], Usuario: session.user, Sucursal: a };
const paths: string[] = [];
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); paths.length = 0; session.user.rol = 'admin';
  vi.spyOn(api, 'get').mockImplementation(async path => {
    paths.push(path);
    const data = path === '/admin/alcance' ? { global: session.user.rol === 'admin', sedes: session.user.rol === 'admin' ? [a, b] : [a] } :
      path === '/empleados' ? [employee] : path === '/sucursales' ? [a, b] : path === '/usuarios' ? [session.user] : [];
    return { success: true, data } as never;
  });
  vi.spyOn(api, 'patch').mockResolvedValue({ success: true, data: employee });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function mount(personal = false) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><LocaleProvider><MemoryRouter initialEntries={['/admin']}>
    {personal ? <AdminScopeProvider><PersonalPage /></AdminScopeProvider> : <Routes><Route element={<RequireAuth panel />}><Route path="/admin" element={<AdminLayout />}><Route index element={<p>Área autorizada</p>} /></Route></Route></Routes>}
  </MemoryRouter></LocaleProvider></QueryClientProvider>);
}
describe('Cuatro roles definitivos: navegación y asignación (HTTP simulado)', () => {
  it.each(['admin', 'gerente_habitaciones', 'recepcionista', 'empleado_operativo'])('%s ve solo sus módulos y las sedes autorizadas', async role => {
    session.user.rol = role; mount(); await screen.findByText('Área autorizada');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Filtrar por sede' })).toBeEnabled());
    const links = new Set(screen.getAllByRole('link').map(node => node.getAttribute('href')));
    expect(links.has('/admin/habitaciones')).toBe(true);
    expect(links.has('/admin/reservas')).toBe(role !== 'empleado_operativo');
    expect(links.has('/admin/restaurante')).toBe(['admin', 'gerente_habitaciones'].includes(role));
    expect(links.has('/admin/personal')).toBe(['admin', 'gerente_habitaciones'].includes(role));
    for (const route of ['/admin/facturacion', '/admin/pagos', '/admin/reportes', '/admin/sedes']) expect(links.has(route), route).toBe(role === 'admin');
    const sites = screen.getByRole('combobox', { name: 'Filtrar por sede' });
    if (role === 'admin') expect(within(sites).getByRole('option', { name: 'Todas las sedes' })).toBeInTheDocument();
    else expect(within(sites).queryByRole('option', { name: 'Todas las sedes' })).not.toBeInTheDocument();
    if (role !== 'admin') { expect(sites).toHaveValue('10'); expect(within(sites).queryByRole('option', { name: b.nombre })).not.toBeInTheDocument(); }
  });
  it('administrador guarda sede principal y adicionales desde el formulario existente', async () => {
    mount(true); await screen.findByRole('heading', { name: session.user.nombre });
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const form = within(screen.getByRole('dialog'));
    fireEvent.click(form.getByRole('checkbox', { name: b.nombre }));
    fireEvent.click(form.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/empleados/30', expect.objectContaining({ sucursal_id: 10, sedes_adicionales: [20] })));
  });
  it('gerencia gestiona personal sin consultar usuarios ni ofrecer cambios de permisos o sedes', async () => {
    session.user.rol = 'gerente_habitaciones'; mount(true); await screen.findByRole('heading', { name: session.user.nombre });
    expect(screen.queryByRole('button', { name: 'Usuarios' })).not.toBeInTheDocument();
    expect(paths).not.toContain('/usuarios'); expect(paths).not.toContain('/choferes'); expect(paths).not.toContain('/vehiculos');
    expect(screen.queryByRole('button', { name: 'Nuevo empleado' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const form = within(screen.getByRole('dialog')); expect(form.getByLabelText('Sede del empleado')).toBeDisabled();
    expect(form.queryByRole('checkbox', { name: b.nombre })).not.toBeInTheDocument();
    fireEvent.change(form.getByLabelText('Área de trabajo'), { target: { value: 'Área actualizada' } });
    fireEvent.click(form.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/empleados/30', { area: 'Área actualizada', fecha_contratacion: null }));
  });
});
