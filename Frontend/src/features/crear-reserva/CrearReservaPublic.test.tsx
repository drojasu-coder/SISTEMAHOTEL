import { expectStayDates } from '@/test/stayControls';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { CrearReservaPage } from '@/pages/CrearReservaPage';
import { LoginPage } from '@/pages/LoginPage';
import { tokenStorage } from '@/api/session';
import { createTestQueryClient, errorResponse, jsonResponse, loginResponse, meResponse, renderPublicWithProviders, renderWithProviders } from '@/test/renderWithProviders';

const criterios = 'sucursal_id=1&fecha_entrada=2030-01-01&fecha_salida=2030-01-03&numero_huespedes=2&tipo_habitacion_id=2';
const tipo = { id: 2, nombre: 'Doble', capacidad_maxima: 2, tarifa_noche: '1000.00' };
const room = { id: 10, tipo, sucursal: { id: 1, nombre: 'Antigua' }, noches: 2, tarifa_noche: '1000.00', total_estimado: '2000.00' };

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); tokenStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); tokenStorage.clear(); });

function observeFetch() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname === '/api/auth/me') return meResponse('cliente');
    if (url.pathname === '/api/auth/login') return loginResponse('cliente');
    if (url.pathname === '/api/sucursales') return jsonResponse({ data: [{ id: 1, nombre: 'Antigua', activa: true }] });
    if (url.pathname.endsWith('/tipos-habitacion')) return jsonResponse({ data: [tipo] });
    if (url.pathname === '/api/public/habitaciones/disponibles') return jsonResponse({ data: [room] });
    if (url.pathname === '/api/habitaciones/disponibles') return jsonResponse({ data: [{ ...room, TipoHabitacion: tipo, Sucursal: room.sucursal }] });
    throw new Error(`Petición inesperada: ${init?.method} ${url.pathname}`);
  });
}

describe('QA-ROOM-UI-001: consultas y retorno de /reservar (HTTP simulado)', () => {
  it('ignora el error de una consulta privada inactiva y consulta solo los tipos públicos', async () => {
    const fetch = observeFetch();
    const queryClient = createTestQueryClient();
    await expect(queryClient.fetchQuery({ queryKey: ['tipos-habitacion'], queryFn: () => Promise.reject(new Error('401 previo')) })).rejects.toThrow('401 previo');
    renderWithProviders(<CrearReservaPage />, { queryClient });
    await screen.findByRole('option', { name: /Doble/ });
    expect(screen.queryByText(/No fue posible cargar el listado/)).not.toBeInTheDocument();
    expect(fetch.mock.calls.some(([url]) => new URL(String(url)).pathname === '/api/tipos-habitacion')).toBe(false);
  });

  it('muestra y reintenta el error público real de la consulta activa', async () => {
    const fetch = observeFetch();
    const normal = fetch.getMockImplementation()!;
    let failed = true;
    fetch.mockImplementation(async (input, init) => String(input).endsWith('/public/tipos-habitacion') && failed
      ? errorResponse(503, 'UNAVAILABLE', 'Sin catálogo') : normal(input, init));
    renderWithProviders(<CrearReservaPage />);
    expect(await screen.findByText(/No fue posible cargar el listado/)).toBeInTheDocument();
    failed = false;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('option', { name: /Doble/ });
    expect(screen.queryByText(/No fue posible cargar el listado/)).not.toBeInTheDocument();
    expect(fetch.mock.calls.every(([url]) => new URL(String(url)).pathname !== '/api/tipos-habitacion')).toBe(true);
  });

  it('conserva sede, tipo, fechas, huéspedes y habitación al completar login; reconsulta el contrato privado sin crear reserva', async () => {
    const fetch = observeFetch();
    localStorage.setItem('hunahpu.public-site.v1', '1');
    const user = userEvent.setup();
    renderPublicWithProviders(<Routes>
      <Route path="/reservar" element={<CrearReservaPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>, { route: `/reservar?${criterios}` });
    await user.click(await screen.findByRole('button', { name: /seleccionar habitación/i }));
    await user.click(screen.getByRole('button', { name: /confirmar y reservar/i }));
    fireEvent.change(await screen.findByLabelText(/^Correo electrónico$/), { target: { value: 'qa@example.test' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/), { target: { value: 'Password123' } });
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
    await screen.findByRole('button', { name: /habitación seleccionada/i });
    expect(screen.getByRole('button', { name: /^Sede del hotel: .*Antigua/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de habitación (opcional)')).toHaveValue('2');
    await expectStayDates('2030-01-01', '2030-01-03');
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(2);
    await waitFor(() => expect(fetch.mock.calls.some(([url]) => new URL(String(url)).pathname === '/api/habitaciones/disponibles')).toBe(true));
    const types = fetch.mock.calls.filter(([url]) => String(url).endsWith('/tipos-habitacion'));
    expect(types.map(([url]) => new URL(String(url)).pathname)).toEqual(['/api/public/tipos-habitacion', '/api/tipos-habitacion']);
    expect(fetch.mock.calls.filter(([, init]) => init?.method === 'POST').map(([url]) => new URL(String(url)).pathname)).toEqual(['/api/auth/login']);
  });
});
