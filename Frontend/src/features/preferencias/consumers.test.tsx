import { formatReferenceMoney } from '@/lib/money';
import { pagosApi } from '@/features/pagos/api/pagosApi';
import App from '@/App';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jsonResponse, meResponse, renderWithProviders } from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { PublicPreferencesProvider } from './PublicPreferences';
import { SiteSelector } from './SiteSelector';
import { SITE_KEY } from './storage';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { eventosApi } from '@/features/eventos/api/eventosApi';
import { amenidadesApi, reservasAmenidadApi } from '@/features/amenidades/api/amenidadesApi';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { tiposHabitacionApi } from '@/features/tipos-habitacion/api/tiposHabitacionApi';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { CatalogoEventosPage } from '@/pages/CatalogoEventosPage';
import { CatalogoAmenidadesPage } from '@/pages/CatalogoAmenidadesPage';
import { CrearReservaPage } from '@/pages/CrearReservaPage';
import { CarritoPage } from '@/pages/CarritoPage';
import { MisReservasPage } from '@/pages/MisReservasPage';
import { Navbar } from '@/components/shared/Navbar';
import { crearCarrito, crearItem } from '@/features/carrito/pantalla-test-utils';
import { crearReserva } from '@/features/mis-reservas/test-utils';
import type { Salon } from '@/features/eventos/types';
import type { HabitacionDisponible } from '@/features/crear-reserva/types';

const sites = [1, 2].map((id) => ({ id, nombre: `Sede ${id}`, activa: true, ciudad: null, telefono: null, direccion: null }));
const salon = (id: number): Salon => ({ id, sucursal_id: id, nombre: `Salón ${id}`, tarifa_base: 100, capacidad_maxima: 20, sucursal: { id, nombre: `Sede ${id}` } });
function scope(ui: React.ReactElement) {
  return renderWithProviders(<PublicPreferencesProvider><SiteSelector />{ui}</PublicPreferencesProvider>);
}
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((a) => { resolve = a; });
  return { promise, resolve };
}
beforeEach(() => {
  localStorage.clear(); tokenStorage.clear();
  localStorage.setItem(SITE_KEY, '1');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue(sites);
  vi.spyOn(tiposHabitacionApi, 'getAll').mockResolvedValue([]);
  global.fetch = vi.fn().mockImplementation((url: string) => Promise.resolve(String(url).endsWith('/auth/me') ? meResponse('cliente') : jsonResponse({ status: 'success', data: [] })));
});
afterEach(() => { vi.restoreAllMocks(); tokenStorage.clear(); localStorage.clear(); window.history.replaceState(null, '', '/'); });

describe('Consumidores reales de sede pública', () => {
  it('Eventos incluye sede en la consulta y una respuesta tardía no reemplaza la nueva selección', async () => {
    const old = deferred<Salon[]>();
    vi.spyOn(eventosApi, 'getSalones').mockImplementation((params) => params?.sucursal_id === 1 ? old.promise : Promise.resolve([salon(2)]));
    scope(<CatalogoEventosPage />);
    await screen.findByRole('option', { name: 'Sede 2' });
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '2');
    await screen.findByRole('heading', { name: 'Salón 2' });
    await act(async () => old.resolve([salon(1)]));
    expect(screen.queryByRole('heading', { name: 'Salón 1' })).not.toBeInTheDocument();
    expect(eventosApi.getSalones).toHaveBeenCalledWith({ sucursal_id: 2 });
  });
  it('el borrador real de amenidades conserva fecha y bloquea confirmar al cambiar de sede', async () => {
    tokenStorage.set('jwt');
    vi.spyOn(amenidadesApi, 'getAll').mockResolvedValue([{ id: 99, nombre: 'Piscina QA', sucursal_id: 1, aforo_maximo: 10, createdAt: '2026-10-26', updatedAt: '2026-10-26' }]);
    const create = vi.spyOn(reservasAmenidadApi, 'create');
    scope(<CatalogoAmenidadesPage />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /Reservar acceso/i }));
    const dialog = screen.getByRole('dialog');
    const date = within(dialog).getByLabelText(/^Fecha/i);
    await userEvent.setup().clear(date);
    await userEvent.setup().type(date, '2030-11-20');
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '2');
    expect(date).toHaveValue('2030-11-20');
    expect(within(dialog).getByRole('button', { name: /Confirmar reserva/i })).toBeDisabled();
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/La sede cambió/);
    expect(create).not.toHaveBeenCalled();
  });
  it('habitaciones conserva fechas y huéspedes e invalida la respuesta de la sede anterior', async () => {
    tokenStorage.set('jwt');
    const old = deferred<HabitacionDisponible[]>();
    vi.spyOn(reservasApi, 'getDisponibilidad').mockReturnValue(old.promise);
    scope(<CrearReservaPage />);
    const date = await screen.findByLabelText('Fecha de entrada (check-in)');
    const user = userEvent.setup();
    await user.type(date, '2030-11-20');
    await user.type(screen.getByLabelText('Fecha de salida (check-out)'), '2030-11-22');
    await user.type(screen.getByLabelText('Número de huéspedes'), '2');
    await user.click(screen.getByRole('button', { name: 'Buscar disponibilidad' }));
    await waitFor(() => expect(reservasApi.getDisponibilidad).toHaveBeenCalledWith(expect.objectContaining({ sucursal_id: 1 })));
    await user.selectOptions(screen.getByLabelText('Sede', { exact: true }), '2');
    expect(date).toHaveValue('2030-11-20');
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(2);
    await act(async () => old.resolve([{ id: 101, sucursal_id: 1, tipo_habitacion_id: 1, numero: 'Anterior', estado: 'disponible', tarifa_noche: '100', total_estimado: '200', noches: 2 }]));
    expect(screen.queryByRole('button', { name: 'Seleccionar habitación' })).not.toBeInTheDocument();
  });
  it('carrito mantiene todos los artículos y total del servidor sin emitir mutaciones al cambiar sede', async () => {
    tokenStorage.set('jwt');
    vi.spyOn(pagosApi, 'getIntentoActivo').mockResolvedValue(null);
    vi.spyOn(carritoApi, 'getCurrent').mockResolvedValue(crearCarrito({ expira_en: '2030-12-01T00:00:00Z' }));
    vi.spyOn(carritoApi, 'getItems').mockResolvedValue({ items: [crearItem({ descripcion: 'Compra sede Antigua' }), crearItem({ id: 502, descripcion: 'Compra sede Atitlán' })], total: 999.99 });
    scope(<CarritoPage />);
    await screen.findByText('Compra sede Antigua');
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '2');
    expect(screen.getByText('Compra sede Antigua')).toBeInTheDocument();
    expect(screen.getByText('Compra sede Atitlán')).toBeInTheDocument();
    expect(screen.getAllByText(formatReferenceMoney(999.99, 'es')!).length).toBeGreaterThan(0);
    expect(vi.mocked(global.fetch).mock.calls.every(([, config]) => !config?.method || config.method === 'GET')).toBe(true);
  });
  it('Mis reservas mantiene las reservas de otras sedes y no añade filtro de sede a la consulta privada', async () => {
    tokenStorage.set('jwt');
    vi.spyOn(reservasApi, 'getAllMine').mockResolvedValue([crearReserva(), crearReserva({ id: 19 })]);
    scope(<MisReservasPage />);
    await screen.findByText('Reserva #12');
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '2');
    expect(screen.getByText('Reserva #12')).toBeInTheDocument();
    expect(screen.getByText('Reserva #19')).toBeInTheDocument();
    expect(reservasApi.getAllMine).toHaveBeenCalledWith();
    expect(reservasApi.getAllMine).toHaveBeenCalledTimes(1);
  });
  it.each(['cliente', 'admin', 'empleado_operativo'])('menú de cuenta respeta funciones reales del rol %s', async (role) => {
    tokenStorage.set('jwt');
    global.fetch = vi.fn().mockResolvedValue(meResponse(role));
    scope(<Navbar />);
    await userEvent.setup().click(await screen.findByText('Persona Prueba'));
    expect(screen.getByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '/cuenta');
    expect(Boolean(screen.queryByRole('link', { name: /^Carrito/ }))).toBe(role === 'cliente');
    expect(Boolean(screen.queryByRole('link', { name: 'Mis reservas' }))).toBe(role === 'cliente');
    expect(Boolean(screen.queryByRole('link', { name: 'Ir al panel' }))).toBe(role === 'admin');
  });
});


describe('Rutas públicas reales y compatibilidad', () => {
  it.each(['/reservar', '/crear-reserva'])('%s conserva criterios de Inicio y consulta la sede explícita', async (route) => {
    tokenStorage.set('jwt');
    const availability = vi.spyOn(reservasApi, 'getDisponibilidad').mockResolvedValue([]);
    window.history.replaceState(null, '', route + '?sucursal_id=2&fecha_entrada=2030-11-20&fecha_salida=2030-11-22&numero_huespedes=3');
    render(<App />);
    expect(await screen.findByLabelText('Fecha de entrada (check-in)')).toHaveValue('2030-11-20');
    await waitFor(() => expect(screen.getByLabelText('Sede del hotel')).toHaveValue('2'));
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(3);
    await waitFor(() => expect(availability).toHaveBeenCalledWith({ sucursal_id: 2, fecha_entrada: '2030-11-20', fecha_salida: '2030-11-22', numero_huespedes: 3 }));
    expect(await screen.findByText('No hay habitaciones disponibles')).toBeInTheDocument();
    expect(window.location.pathname).toBe(route);
    expect(window.location.search).toContain('sucursal_id=2');
  });
  it('un módulo administrativo sin permiso conserva el layout del panel y no añade encabezado público', async () => {
    tokenStorage.set('jwt');
    global.fetch = vi.fn().mockResolvedValue(meResponse('gerente_restaurante'));
    window.history.replaceState(null, '', '/admin/pagos');
    render(<App />);
    await screen.findByRole('heading', { name: 'Acceso no autorizado' });
    expect(screen.getByRole('navigation', { name: 'Panel administrativo' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/pagos');
  });
});
