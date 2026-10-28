import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api, ApiError } from '@/api/client/http';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { AppRouter } from '@/app/router/AppRouter';
import { FacturacionPage } from '@/pages/FacturacionPage';
import { PagosAdminPage } from '@/pages/PagosAdminPage';
import { PersonalPage } from '@/pages/PersonalPage';
import { translateAdmin } from './i18n';

const session = vi.hoisted(() => ({ user: { id: 1, nombre: 'Admin', rol: 'admin' }, status: 'authenticated' }));
vi.mock('@/features/auth/AuthContext', () => ({ useAuth: () => ({ ...session, logout: vi.fn(), retry: vi.fn() }) }));
vi.mock('@/api/client/http', async importOriginal => ({ ...await importOriginal<typeof import('@/api/client/http')>(), api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
const invoice = { id: 8, usuario_id: 2, nit: 'CF', nombre_fiscal: 'Ana', subtotal: 100, iva: 12, total: 112, estado: 'pendiente', fecha_emision: null };
const users = [
  { id: 1, nombre: 'Admin', email: 'admin@example.test', rol: 'admin', activo: true },
  { id: 2, nombre: 'Ana', email: 'ana@example.test', rol: 'cliente', activo: true },
  { id: 3, nombre: 'Empleado disponible', email: 'staff@example.test', rol: 'empleado_operativo', activo: true },
  { id: 4, nombre: 'Cuenta inactiva', email: 'inactive@example.test', rol: 'empleado_operativo', activo: false },
];
const lists: Record<string, unknown[]> = {
  '/facturas': [invoice], '/factura-items': [{ id: 9, factura_id: 8, descripcion: 'Concepto real', cantidad: 1, precio_unitario: 100, subtotal: 100 }],
  '/usuarios': users, '/empleados': [], '/turnos': [], '/choferes': [], '/vehiculos': [],
  '/sucursales': [{ id: 5, nombre: 'Sede Centro', activa: true }, { id: 6, nombre: 'Sede inactiva', activa: false }],
  '/pagos': [
    { id: 10, monto: 100, moneda: 'GTQ', estado: 'aprobado', metodo: 'tarjeta', tipo_pago: 'total', carrito_id: 20, createdAt: '2026-10-27T12:00:00Z' },
    { id: 11, monto: 50, moneda: 'USD', estado: 'reembolsado_parcial', metodo: 'tarjeta', tipo_pago: 'total', carrito_id: 21, createdAt: '2026-10-27T12:00:00Z' },
  ],
};
function mount(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><LocaleProvider>{ui}</LocaleProvider></QueryClientProvider>);
}
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); localStorage.setItem('hotel:language', 'es');
  session.user.rol = 'admin';
  vi.mocked(api.get).mockImplementation(async endpoint => (endpoint === '/sucursales' ? { status: 'success', data: lists[endpoint] } : { success: true, data: lists[endpoint] ?? [] }) as never);
  vi.mocked(api.post).mockResolvedValue({ success: true, data: { id: 50 } });
  vi.mocked(api.patch).mockResolvedValue({ success: true, data: {} });
  vi.mocked(api.delete).mockResolvedValue(undefined);
});
afterEach(cleanup);
describe('Administrative integration — HTTP mocked, no persistent writes', () => {
  it('navigates actual protected routes and exposes Users inside Staff', async () => {
    window.history.replaceState({}, '', '/admin/facturacion');
    mount(<AppRouter />);
    expect(await screen.findByRole('heading', { name: 'Facturación' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('link', { name: 'Pagos y reembolsos' })[0]);
    expect(await screen.findByRole('heading', { name: 'Pagos y reembolsos' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('link', { name: 'Personal y usuarios' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Usuarios' }));
    expect(await screen.findByText('ana@example.test', { exact: false })).toBeInTheDocument();
  });
  it.each(['cliente', 'empleado_operativo', 'gerente_restaurante'])('denies billing route to %s without fetching invoices', async role => {
    session.user.rol = role; window.history.replaceState({}, '', '/admin/facturacion');
    mount(<AppRouter />);
    await screen.findByRole('heading', { name: /Acceso no autorizado|no hay módulos/i });
    expect(api.get).not.toHaveBeenCalledWith('/facturas');
  });
  it('reads invoice items and posts only fields supported by the current contract', async () => {
    mount(<FacturacionPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ver factura 8' }));
    expect(await screen.findByText('Concepto real')).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nueva factura' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: '2' } });
    fireEvent.change(within(dialog).getByLabelText('NIT'), { target: { value: 'CF' } });
    fireEvent.change(within(dialog).getByLabelText('Razón social o nombre fiscal'), { target: { value: 'Ana' } });
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Guardar factura' }).closest('form')!);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/facturas', { usuario_id: 2, nit: 'CF', nombre_fiscal: 'Ana', direccion_fiscal: null, subtotal: 0, precios_incluyen_impuestos: true }));
  });
  it('uses final prices and the accommodation category without calculating taxes in the browser', async () => {
    vi.mocked(api.get).mockImplementation(async endpoint => ({ success: true, data: endpoint === '/facturas' ? [{ ...invoice, precios_incluyen_impuestos: true, inguat: 10, total: 122 }] : lists[endpoint] ?? [] }) as never);
    mount(<FacturacionPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ver factura 8' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/No se añaden impuestos al total/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Agregar concepto' }));
    fireEvent.change(within(dialog).getByLabelText('Tipo de concepto'), { target: { value: 'hospedaje' } });
    fireEvent.change(within(dialog).getByLabelText('Descripción'), { target: { value: 'Estancia contratada' } });
    fireEvent.change(within(dialog).getByLabelText('Precio unitario final (GTQ)'), { target: { value: '122' } });
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Guardar concepto' }).closest('form')!);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/factura-items', { factura_id: 8, descripcion: 'Estancia contratada', cantidad: 1, precio_unitario: 122, tipo_concepto: 'hospedaje' }));
    expect(translateAdmin('en', 'Precio unitario final (GTQ)')).toBe('Final unit price (GTQ)');
  });
  it('filters staff candidates and sites using actual active status and role', async () => {
    mount(<PersonalPage />); await screen.findByText(/No hay registros disponibles/);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo empleado' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('option', { name: /Empleado disponible/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole('option', { name: /Cuenta inactiva|ana@example|Sede inactiva/ })).not.toBeInTheDocument();
  });
  it('requires confirmation and blocks duplicate state changes and own-account deactivation', async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(api.patch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    mount(<PersonalPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Usuarios' }));
    await screen.findByText(/ana@example/);
    const admin = screen.getByRole('heading', { name: 'Admin' }).closest('div')!.parentElement!.parentElement!;
    expect(within(admin).getByRole('button', { name: 'Desactivar' })).toBeDisabled();
    const ana = screen.getByRole('heading', { name: 'Ana' }).closest('div')!.parentElement!.parentElement!;
    fireEvent.click(within(ana).getByRole('button', { name: 'Desactivar' }));
    expect(api.patch).not.toHaveBeenCalled();
    const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar usuario' });
    fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenCalledWith('/usuarios/2/estado', { activo: false });
    finish({ success: true });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('uses the distinct role endpoint after explicit confirmation', async () => {
    mount(<PersonalPage />); fireEvent.click(screen.getByRole('button', { name: 'Usuarios' }));
    await screen.findByText(/ana@example/);
    const ana = screen.getByRole('heading', { name: 'Ana' }).closest('div')!.parentElement!.parentElement!;
    fireEvent.click(within(ana).getByRole('button', { name: 'Cambiar rol' }));
    fireEvent.change(within(screen.getByRole('dialog')).getByRole('combobox'), { target: { value: 'recepcionista' } });
    fireEvent.submit(within(screen.getByRole('dialog')).getByRole('button', { name: 'Continuar' }).closest('form')!);
    expect(api.patch).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cambiar rol' }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/usuarios/2/rol', { rol: 'recepcionista' }));
  });
  it('keeps payments read-only and retains the recorded currency', async () => {
    mount(<PagosAdminPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ver pago 11' }));
    expect(within(screen.getByRole('dialog')).getByText(/USD.*50.00/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reembolso|transferencia/i })).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
  it('distinguishes a connection failure from an empty list and retries only a GET', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError(0, 'database password private'));
    mount(<PagosAdminPage />);
    expect(await screen.findByRole('alert')).not.toHaveTextContent('database password private');
    expect(screen.queryByText('No hay registros disponibles.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: 'Ver pago 10' })).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
  it('switches module navigation and forms to English through the existing locale provider', async () => {
    window.history.replaceState({}, '', '/admin/personal'); mount(<AppRouter />);
    fireEvent.change(screen.getByRole('combobox', { name: /Idioma|Language/ }), { target: { value: 'en' } });
    expect(await screen.findByRole('heading', { name: 'Staff and users' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Users' }));
    fireEvent.click(await screen.findByRole('button', { name: 'New user' }));
    expect(screen.getByLabelText('Temporary password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(translateAdmin('en', 'Ver factura {0}', { 0: 8 })).toBe('View invoice 8');
  });
  it('validates vehicle capacity before sending a request', async () => {
    mount(<PersonalPage />); fireEvent.click(screen.getByRole('button', { name: 'Vehículos' }));
    await screen.findByText('No hay registros disponibles.');
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo vehículo' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Capacidad de pasajeros'), { target: { value: '0' } });
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Crear registro' }).closest('form')!);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('La capacidad debe ser un entero positivo.');
    expect(api.post).not.toHaveBeenCalled();
  });
  it('reports a shift conflict without success or automatic retries', async () => {
    vi.mocked(api.get).mockImplementation(async endpoint => ({ success: true, data: endpoint === '/empleados' ? [{ id: 30, usuario_id: 3, area: 'Operaciones', Usuario: users[2] }] : lists[endpoint] ?? [] }) as never);
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError(409, 'El empleado tiene otro turno en ese horario', { code: 'SHIFT_CONFLICT' }));
    mount(<PersonalPage />); fireEvent.click(screen.getByRole('button', { name: 'Turnos' }));
    await screen.findByText('No hay registros disponibles.');
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo turno' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: '30' } });
    fireEvent.change(within(dialog).getByLabelText('Fecha del turno'), { target: { value: '2026-11-01' } });
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Crear registro' }).closest('form')!);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('El empleado tiene otro turno');
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/turnos', { empleado_id: 30, fecha: '2026-11-01', hora_inicio: '08:00', hora_fin: '16:00' });
    expect(screen.queryByText(/registro guardado correctamente/)).not.toBeInTheDocument();
  });
  it('creates a user once and clears the temporary password after success', async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(api.post).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    mount(<PersonalPage />); fireEvent.click(screen.getByRole('button', { name: 'Usuarios' }));
    await screen.findByText(/ana@example/);
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }));
    const dialog = screen.getByRole('dialog');
    for (const [label, value] of [['Nombre completo', 'Nuevo Empleado'], ['Correo electrónico', 'new@example.test'], ['Contraseña provisional', 'TestOnly123']]) fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });
    const form = within(dialog).getByRole('button', { name: 'Crear registro' }).closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(api.post).toHaveBeenCalledWith('/usuarios', { nombre: 'Nuevo Empleado', email: 'new@example.test', telefono: null, rol: 'empleado_operativo', password: 'TestOnly123' });
    finish({ success: true, data: { id: 100 } });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }));
    expect(screen.getByLabelText('Contraseña provisional')).toHaveValue('');
  });

});
