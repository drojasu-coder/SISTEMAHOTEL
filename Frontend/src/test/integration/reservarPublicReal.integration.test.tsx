import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { parseCalendarDate, calendarDateKey } from '@/lib/dates';
import { expectStayDates, setStayDates, changeGuestCount } from '@/test/stayControls';
/**
 * Lecturas HTTP reales: RUN_PUBLIC_ROOM_INTEGRATION=1 npm test -- reservarPublicReal
 * No crea cuentas ni reservas. El observador rechaza cualquier método distinto de GET
 * antes de enviarlo; conserva intactas las respuestas del backend en ejecución.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { tokenStorage } from '@/api/session';
import { env } from '@/app/config/env';
import { CrearReservaPage } from '@/pages/CrearReservaPage';
import { createTestQueryClient, renderWithProviders } from '@/test/renderWithProviders';
import type { HabitacionDisponiblePublico, TipoHabitacion } from '@/features/habitaciones/types';
import { BuscadorDisponibilidad } from '@/features/inicio/components/BuscadorDisponibilidad';
import { RoomCatalog } from '@/features/habitaciones/public/RoomCatalog';
import { RoomDetail } from '@/features/habitaciones/public/RoomDetail';
import { PublicPreferencesProvider } from '@/features/preferencias/PublicPreferences';

const realFetch = globalThis.fetch;
const calls: Array<{ url: URL; status: number; data: unknown; authorization: string | null }> = [];

function LoginDestination() {
  const location = useLocation();
  return <output aria-label="retorno">{location.state?.from}</output>;
}

describe.skipIf(process.env.RUN_PUBLIC_ROOM_INTEGRATION !== '1')('QA-ROOM-UI-001 /reservar con backend real (solo GET)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    tokenStorage.clear();
    calls.length = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if ((init?.method ?? 'GET') !== 'GET') throw new Error('Prueba de solo lectura: mutación bloqueada');
      const response = await realFetch(input, init);
      calls.push({
        url: new URL(String(input)), status: response.status,
        data: await response.clone().json(),
        authorization: new Headers(init?.headers).get('Authorization'),
      });
      return response;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('procesa los tres tipos reales sin ejecutar la consulta privada ni mostrar su error', async () => {
    const queryClient = createTestQueryClient();
    renderWithProviders(<CrearReservaPage />, { queryClient });
    await screen.findByRole('option', { name: /Suite/ });
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    const response = calls.find((call) => call.url.pathname === '/api/public/tipos-habitacion')!;
    expect(response.url.href).toBe(`${env.apiBaseUrl}/public/tipos-habitacion`);
    expect(response.status).toBe(200);
    expect(response.authorization).toBeNull();
    const tipos = (response.data as { data: TipoHabitacion[] }).data;
    expect(tipos.map((tipo) => tipo.nombre)).toEqual(['Individual', 'Doble', 'Suite']);
    const selector = screen.getByLabelText('Tipo de habitación (opcional)');
    expect(within(selector).getAllByRole('option')).toHaveLength(tipos.length + 1);
    for (const tipo of tipos) {
      expect(within(selector).getByRole('option', { name: new RegExp(tipo.nombre) })).toHaveValue(String(tipo.id));
    }
    expect(calls.filter((call) => call.url.pathname === '/api/tipos-habitacion')).toEqual([]);
    expect(screen.queryByText(/No fue posible cargar el listado de tipos de habitación/)).not.toBeInTheDocument();
    expect(queryClient.getQueryState(['tipos-habitacion-public'])?.status).toBe('success');
  });

  it('busca en Antigua, selecciona una habitación real y pide login solo al continuar, conservando los criterios al volver', async () => {
    const user = userEvent.setup();
    const view = renderWithProviders(<Routes>
      <Route path="/reservar" element={<CrearReservaPage />} />
      <Route path="/login" element={<LoginDestination />} />
    </Routes>, { route: '/reservar' });
    const sede = await screen.findByRole('option', { name: /Antigua/ });
    const suite = await screen.findByRole('option', { name: /Suite/ });
    await user.selectOptions(screen.getByLabelText('Sede del hotel'), (sede as HTMLOptionElement).value);
    await user.selectOptions(screen.getByLabelText('Tipo de habitación (opcional)'), (suite as HTMLOptionElement).value);
    await setStayDates('2026-11-10', '2026-11-12');
    changeGuestCount('2');
    await user.click(screen.getByRole('button', { name: /buscar disponibilidad/i }));
    const select = await screen.findAllByRole('button', { name: /seleccionar habitación/i });
    const response = calls.find((call) => call.url.pathname === '/api/public/habitaciones/disponibles')!;
    expect(response.status).toBe(200);
    expect(response.authorization).toBeNull();
    expect(response.url.searchParams.get('tipo_habitacion_id')).toBe((suite as HTMLOptionElement).value);
    const rooms = (response.data as { data: HabitacionDisponiblePublico[] }).data;
    expect(rooms.length).toBeGreaterThan(0);
    expect(select).toHaveLength(rooms.length);
    await user.click(select[0]);
    expect(screen.queryByLabelText('retorno')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent(rooms[0].tipo!.nombre);
    await user.click(screen.getByRole('button', { name: /confirmar y reservar/i }));
    const from = (await screen.findByLabelText('retorno')).textContent!;
    expect(from).toContain('tipo_habitacion_id=3');
    const selectedId = JSON.parse(sessionStorage.getItem('hunahpu.crear-reserva-selection.v1')!).habitacion.id;
    expect(selectedId).toBe(rooms[0].id);
    view.unmount();
    renderWithProviders(<CrearReservaPage />, { route: from });
    await waitFor(() => expect(screen.getByLabelText('Tipo de habitación (opcional)')).toHaveValue('3'));
    await expectStayDates('2026-11-10', '2026-11-12');
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(2);
    await screen.findByRole('button', { name: /habitación seleccionada/i });
    expect(calls.filter((call) => call.url.pathname === '/api/tipos-habitacion')).toEqual([]);
  });

  it('Inicio envía sus criterios a /reservar y ejecuta la petición pública real', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicPreferencesProvider><Routes>
      <Route path="/" element={<BuscadorDisponibilidad />} />
      <Route path="/reservar" element={<CrearReservaPage />} />
    </Routes></PublicPreferencesProvider>);
    const antigua = await screen.findByRole('option', { name: /Antigua/ });
    await user.selectOptions(screen.getByLabelText('Sede'), (antigua as HTMLOptionElement).value);
    const arrival = getTodayInGuatemala();
    const tomorrow = parseCalendarDate(arrival)!; tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const departure = calendarDateKey(tomorrow);
    await user.click(screen.getByRole('button', { name: 'Consultar disponibilidad' }));
    await screen.findByRole('heading', { name: 'Reservar habitación' });
    await waitFor(() => expect(calls.some((call) => call.url.pathname === '/api/public/habitaciones/disponibles')).toBe(true));
    const response = calls.find((call) => call.url.pathname === '/api/public/habitaciones/disponibles')!;
    expect(response.status).toBe(200);
    expect(response.url.searchParams.get('fecha_entrada')).toBe(arrival);
    expect(response.url.searchParams.get('fecha_salida')).toBe(departure);
    expect(response.url.searchParams.get('numero_huespedes')).toBe('2');
    expect(response.authorization).toBeNull();
    await expectStayDates(arrival, departure);
  });

  it('el catálogo y detalle reales conservan el contexto y seleccionan la habitación solo después de comprobar disponibilidad', async () => {
    const user = userEvent.setup();
    localStorage.setItem('hunahpu.public-site.v1', '1');
    renderWithProviders(<PublicPreferencesProvider><Routes>
      <Route path="/habitaciones" element={<RoomCatalog />} />
      <Route path="/habitaciones/:id" element={<RoomDetail />} />
      <Route path="/reservar" element={<CrearReservaPage />} />
    </Routes></PublicPreferencesProvider>, { route: '/habitaciones?sede=1&fecha_entrada=2026-11-10&fecha_salida=2026-11-12&numero_huespedes=2' });
    const heading = await screen.findByRole('heading', { name: 'Habitación Doble' });
    expect(calls.some((call) => call.url.pathname.endsWith('/disponibles'))).toBe(false);
    expect(screen.queryByLabelText('Fecha de entrada (check-in)')).not.toBeInTheDocument();
    const detailLink = within(heading.closest('article')!).getByRole('link', { name: 'Ver habitación' });
    const id = Number(new URL(detailLink.getAttribute('href')!, 'http://localhost').pathname.split('/').pop());
    await user.click(detailLink);
    const reserve = (await screen.findAllByRole('link', { name: 'Reservar esta habitación' }))[0];
    expect(reserve.getAttribute('href')).toContain(`habitacion_id=${id}`);
    await user.click(reserve);
    await screen.findByRole('button', { name: 'Habitación seleccionada' });
    const response = calls.find((call) => call.url.pathname === '/api/public/habitaciones/disponibles')!;
    expect(response.status).toBe(200);
    expect((response.data as { data: HabitacionDisponiblePublico[] }).data.some((room) => room.id === id)).toBe(true);
    await expectStayDates('2026-11-10', '2026-11-12');
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(2);
    expect(response.authorization).toBeNull();
  });
  it('selecciona visualmente un rango y tres huéspedes desde Inicio y compara el resumen con la disponibilidad real', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PublicPreferencesProvider><Routes>
      <Route path="/" element={<BuscadorDisponibilidad />} />
      <Route path="/reservar" element={<CrearReservaPage />} />
    </Routes></PublicPreferencesProvider>);
    const antigua = await screen.findByRole('option', { name: /Antigua/ });
    await user.selectOptions(screen.getByLabelText('Sede'), (antigua as HTMLOptionElement).value);
    await user.click(screen.getByRole('button', { name: /^Fechas de estancia/ }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Ir al mes siguiente' }));
    await user.click(dialog.querySelector<HTMLButtonElement>('[data-day="2026-11-10"] button')!);
    await user.click(dialog.querySelector<HTMLButtonElement>('[data-day="2026-11-12"] button')!);
    expect(within(dialog).getByText(/2 noches/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Usar este rango' }));
    await user.click(screen.getByRole('button', { name: 'Aumentar huéspedes' }));
    await user.click(screen.getByRole('button', { name: 'Consultar disponibilidad' }));
    await waitFor(() => expect(calls.some((call) => call.url.pathname === '/api/public/habitaciones/disponibles')).toBe(true));
    const response = calls.find((call) => call.url.pathname === '/api/public/habitaciones/disponibles')!;
    expect(response.status).toBe(200);
    expect(response.url.searchParams.get('numero_huespedes')).toBe('3');
    const rooms = (response.data as { data: HabitacionDisponiblePublico[] }).data;
    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms.every((room) => room.noches === 2 && room.tipo!.capacidad_maxima >= 3)).toBe(true);
    const region = await screen.findByRole('region', { name: 'Habitaciones disponibles' });
    expect(region).toHaveTextContent('3 huéspedes'); expect(region).toHaveTextContent('2 noches');
    expect(region).not.toHaveFocus();
    expect((await screen.findAllByRole('button', { name: 'Seleccionar habitación' })).length).toBe(rooms.length);
    expect(response.authorization).toBeNull();
  });
});
