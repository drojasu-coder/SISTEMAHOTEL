import { expectStayDates, setStayDates, openStayEditor } from '@/test/stayControls';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { renderWithProviders, jsonResponse } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { PublicPreferencesProvider } from '@/features/preferencias/PublicPreferences';
import { BuscadorDisponibilidad } from './components/BuscadorDisponibilidad';
import { RoomCatalog } from '@/features/habitaciones/public/RoomCatalog';
import { RoomDetail } from '@/features/habitaciones/public/RoomDetail';
import { CrearReservaPage } from '@/pages/CrearReservaPage';
import { habitacionesApi } from '@/features/habitaciones/api/habitacionesApi';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { tokenStorage } from '@/api/session';
import { LegacyReservaRedirect } from '@/app/router/AppRouter';

const tipo = { id: 2, nombre: 'Doble', descripcion: 'Descripción del hotel', capacidad_maxima: 2, tarifa_noche: '1000.00', imagen_url: null, imagen_creditos: null };
const room = { id: 7, tipo, sucursal: { id: 1, nombre: 'Antigua' }, imagen_url: null, imagen_creditos: null };
const criteria = 'fecha_entrada=2026-10-27&fecha_salida=2026-10-28&numero_huespedes=2';
function Location() { const location = useLocation(); return <output aria-label="URL">{location.pathname}{location.search}</output>; }
function mount(route = '/') {
  return renderWithProviders(<LocaleProvider><PublicPreferencesProvider><LanguageSelector /><Location /><Link to="/habitaciones">Explorar habitaciones</Link><Link to="/">Inicio de búsqueda</Link><Routes>
    <Route path="/" element={<BuscadorDisponibilidad />} />
    <Route path="/habitaciones" element={<RoomCatalog />} />
    <Route path="/habitaciones/:id" element={<RoomDetail />} />
    <Route path="/reservar" element={<CrearReservaPage />} />
    <Route path="/crear-reserva" element={<LegacyReservaRedirect />} />
  </Routes></PublicPreferencesProvider></LocaleProvider>, { route });
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-27T18:00:00Z'));
  localStorage.clear(); sessionStorage.clear(); tokenStorage.clear(); localStorage.setItem('hunahpu.public-site.v1', '1');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue([{ id: 1, nombre: 'Antigua', activa: true, ciudad: null, direccion: null, telefono: null }]);
  vi.spyOn(habitacionesApi, 'getPublic').mockResolvedValue([room]);
  vi.spyOn(habitacionesApi, 'getPublicById').mockResolvedValue(room);
  vi.spyOn(habitacionesApi, 'getPublicDisponibles').mockResolvedValue([{ ...room, noches: 1, tarifa_noche: '1000.00', total_estimado: '1000.00' }]);
  vi.spyOn(reservasApi, 'create').mockRejectedValue(new Error('No se debe crear una reserva'));
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: [tipo] }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); tokenStorage.clear(); });

describe('QA-ROOM-NAV-001: un único recorrido público de reserva', () => {
  it('Inicio con hoy y mañana navega a /reservar y consulta disponibilidad pública con los mismos criterios', async () => {
    mount();
    await screen.findByRole('button', { name: /^Sede: Antigua/ });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Consultar disponibilidad' }));
    await waitFor(() => expect(screen.getByLabelText('URL')).toHaveTextContent(`/reservar?sucursal_id=1&${criteria}`));
    await waitFor(() => expect(habitacionesApi.getPublicDisponibles).toHaveBeenCalledWith({ sucursal_id: 1, fecha_entrada: '2026-10-27', fecha_salida: '2026-10-28', numero_huespedes: 2 }));
  });
  it('impide aplicar fechas pasadas y traduce la alternativa accesible sin perder el rango válido', async () => {
    mount(); await screen.findByRole('button', { name: /^Sede: Antigua/ });
    const user = userEvent.setup();
    const dialog = await openStayEditor();
    fireEvent.change(screen.getByLabelText('Fecha de entrada (check-in)'), { target: { value: '2026-10-26' } });
    expect(within(dialog).getByRole('button', { name: 'Usar este rango' })).toBeDisabled();
    await user.keyboard('{Escape}');
    await user.selectOptions(screen.getByLabelText('Idioma'), 'en');
    await expectStayDates('2026-10-27', '2026-10-28');
    expect(screen.getByLabelText('URL').textContent).toBe('/');
    expect(habitacionesApi.getPublicDisponibles).not.toHaveBeenCalled();
  });
  it('solicita una sede concreta junto al selector cuando se elige Todas las sedes', async () => {
    // La sede del buscador es la global del encabezado: con "Todas las sedes" se pide elegir una.
    localStorage.setItem('hunahpu.public-site.v1', 'all');
    mount(); const user = userEvent.setup();
    const site = await screen.findByRole('button', { name: /^Sede: Elegir sede/ });
    await user.click(screen.getByRole('button', { name: 'Consultar disponibilidad' }));
    expect(await screen.findByText('Debe seleccionar una sede')).toBeInTheDocument();
    expect(site).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('URL').textContent).toBe('/');
  });
  it('el catálogo no exige estancia, no consulta disponibilidad y ofrece detalle y reserva preservando contexto', async () => {
    mount(`/habitaciones?sede=1&${criteria}&min=100&orden=numero`);
    await screen.findByRole('heading', { name: 'Habitación Doble' });
    expect(screen.queryByLabelText('Fecha de entrada (check-in)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Precio mínimo por noche (GTQ)')).not.toBeInTheDocument();
    expect(screen.queryByText('Número de habitación')).not.toBeInTheDocument();
    expect(habitacionesApi.getPublicDisponibles).not.toHaveBeenCalled();
    const detail = screen.getByRole('link', { name: 'Ver habitación' });
    expect(detail.getAttribute('href')).toContain('/habitaciones/7?');
    const reserve = screen.getByRole('link', { name: 'Reservar esta habitación' });
    expect(reserve.getAttribute('href')).toContain('habitacion_id=7');
    await userEvent.setup().click(detail);
    await screen.findByText('Descripción del hotel');
    await userEvent.setup().click(screen.getAllByRole('link', { name: 'Reservar esta habitación' })[0]);
    await screen.findByRole('button', { name: 'Habitación seleccionada' });
    expect(screen.getByRole('button', { name: /^Sede del hotel: Antigua/ })).toBeInTheDocument();
    await expectStayDates('2026-10-27', '2026-10-28');
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(2);
    expect(reservasApi.create).not.toHaveBeenCalled();
  });
  it('el detalle sin fechas permite continuar a /reservar antes de solicitar autenticación', async () => {
    mount('/habitaciones/7');
    const link = (await screen.findAllByRole('link', { name: 'Reservar esta habitación' }))[0];
    expect(link).toHaveAttribute('href', '/reservar?sucursal_id=1&habitacion_id=7&tipo_habitacion_id=2');
    expect(screen.queryByLabelText('Fecha de entrada (check-in)')).not.toBeInTheDocument();
    expect(habitacionesApi.getPublicDisponibles).not.toHaveBeenCalled();
    await userEvent.setup().click(link);
    await screen.findByRole('button', { name: /^Fechas de estancia/ });
    expect(screen.getByLabelText('URL')).toHaveTextContent('/reservar?');
    expect(reservasApi.create).not.toHaveBeenCalled();
  });
  it('la ruta de compatibilidad conserva criterios y selección sin crear una reserva', async () => {
    mount(`/crear-reserva?sucursal_id=1&habitacion_id=7&${criteria}`);
    await screen.findByRole('button', { name: 'Habitación seleccionada' });
    expect(screen.getByLabelText('URL')).toHaveTextContent(`/reservar?sucursal_id=1&habitacion_id=7&${criteria}`);
    expect(screen.getByLabelText('Tipo de habitación (opcional)')).toHaveValue('');
    expect(reservasApi.create).not.toHaveBeenCalled();
  });
  it('un ID solicitado fuera de la disponibilidad no se acepta como selección', async () => {
    mount(`/reservar?sucursal_id=1&habitacion_id=999&${criteria}`);
    expect(await screen.findByText('Esta habitación no aparece disponible para los criterios actuales.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Habitación seleccionada' })).not.toBeInTheDocument();
    expect(sessionStorage.getItem('hunahpu.crear-reserva-selection.v1')).toBeNull();
    expect(reservasApi.create).not.toHaveBeenCalled();
  });
  it('aplica la sede explícita del enlace aunque la preferencia previa sea otra, sin invalidar su búsqueda inicial', async () => {
    localStorage.setItem('hunahpu.public-site.v1', '2');
    vi.mocked(sedesApi.getAll).mockResolvedValue([
      { id: 1, nombre: 'Antigua', activa: true, ciudad: null, direccion: null, telefono: null },
      { id: 2, nombre: 'Atitlán', activa: true, ciudad: null, direccion: null, telefono: null },
    ]);
    mount(`/crear-reserva?sucursal_id=1&habitacion_id=7&${criteria}`);
    expect(await screen.findByRole('button', { name: 'Habitación seleccionada' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^Sede del hotel: Antigua/ })).toBeInTheDocument();
    expect(screen.queryByText(/Ha modificado los criterios/)).not.toBeInTheDocument();
  });
  it('conserva rango y huéspedes entre Inicio, catálogo, detalle y /reservar; publica criterios y no busca durante la edición', async () => {
    vi.mocked(habitacionesApi.getPublicDisponibles).mockResolvedValue([{ ...room, noches: 2, tarifa_noche: '1000.00', total_estimado: '2000.00' }]);
    mount(); const user = userEvent.setup();
    await screen.findByRole('button', { name: /^Sede: Antigua/ });
    await setStayDates('2026-11-10', '2026-11-12');
    await user.click(screen.getByRole('button', { name: 'Disminuir huéspedes' }));
    await user.click(screen.getByRole('link', { name: 'Explorar habitaciones' }));
    await user.click(await screen.findByRole('link', { name: 'Ver habitación' }));
    await user.click((await screen.findAllByRole('link', { name: 'Reservar esta habitación' }))[0]);
    await screen.findByRole('button', { name: 'Habitación seleccionada' });
    await expectStayDates('2026-11-10', '2026-11-12');
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(1);
    const region = screen.getByRole('region', { name: 'Habitaciones disponibles' });
    expect(region).toHaveTextContent('1 huésped'); expect(region).toHaveTextContent('2 noches');
    expect(region).not.toHaveFocus();
    expect(habitacionesApi.getPublicDisponibles).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Aumentar huéspedes' }));
    expect(habitacionesApi.getPublicDisponibles).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Buscar disponibilidad' }));
    await waitFor(() => expect(habitacionesApi.getPublicDisponibles).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText('URL')).toHaveTextContent('numero_huespedes=2');
    region.scrollIntoView = vi.fn();
    await user.click(screen.getByRole('button', { name: 'Ver opciones disponibles' }));
    expect(region).toHaveFocus();
    expect(region.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(reservasApi.create).not.toHaveBeenCalled();
  });
  it('aplica filtros de tipo y capacidad con datos reales del catálogo sin nuevas peticiones y permite limpiarlos', async () => {
    vi.mocked(habitacionesApi.getPublic).mockResolvedValue([room, { ...room, id: 8, tipo: { ...tipo, id: 3, nombre: 'Suite', capacidad_maxima: 4, tarifa_noche: '1500.00' } }]);
    mount(`/habitaciones?sede=1&${criteria}`); const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Habitación Suite' });
    await user.click(screen.getByText('Más filtros y orden'));
    await user.selectOptions(screen.getByLabelText('Capacidad para huéspedes'), '4');
    expect(screen.queryByRole('heading', { name: 'Habitación Doble' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Habitación Suite' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar filtro: Para 4 huéspedes o más' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suite' }));
    expect(screen.getByRole('button', { name: 'Suite' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Restablecer filtros' }));
    expect(screen.getByRole('heading', { name: 'Habitación Doble' })).toBeInTheDocument();
    expect(screen.getByLabelText('URL')).toHaveTextContent('fecha_entrada=2026-10-27');
    expect(habitacionesApi.getPublic).toHaveBeenCalledTimes(1);
    expect(habitacionesApi.getPublicDisponibles).not.toHaveBeenCalled();
  });
});
