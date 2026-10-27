import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { renderWithProviders, meResponse } from '@/test/renderWithProviders';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { PublicPreferencesProvider } from '@/features/preferencias/PublicPreferences';
import { PublicTopBar } from '@/components/shared/PublicTopBar';
import { RoomCatalog } from './RoomCatalog';
import { RoomDetail } from './RoomDetail';
import { RoomSearchPanel } from './RoomSearchPanel';
import { habitacionesApi } from '../api/habitacionesApi';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { tokenStorage } from '@/api/session';
import { ApiError } from '@/api/client/http';
import { crearCarrito } from '@/features/carrito/pantalla-test-utils';
import type { Habitacion } from '../types';
import type { HabitacionDisponible, ReservaHabitacion } from '@/features/reservas/types';
const sites = [{ id: 1, nombre: 'Hotel Hunapú Antigua', ciudad: 'Antigua Guatemala', direccion: null, telefono: null, activa: true }, { id: 2, nombre: 'Hotel Hunahpú Atitlán', ciudad: 'Panajachel', direccion: null, telefono: null, activa: true }];
const room: Habitacion = { id: 7, numero: '107', estado: 'ocupada', sucursal_id: 1, tipo_habitacion_id: 1, TipoHabitacion: { id: 1, nombre: 'Suite', capacidad_maxima: 4, tarifa_noche: '780.00', descripcion: 'Descripción original aprobada' }, imagen_url: 'https://example.test/habitacion?sig=autorizada' };
const quote: HabitacionDisponible = { id: 7, numero: '107', estado: 'ocupada', sucursal_id: 1, tipo_habitacion_id: 1, noches: 2, tarifa_noche: '780.00', total_estimado: '1560.00', TipoHabitacion: { id: 1, nombre: 'Suite', capacidad_maxima: 4, tarifa_noche: '780.00' } };
const reservation = { id: 400, usuario_id: 3, habitacion_id: 7, fecha_entrada: '2030-01-01', fecha_salida: '2030-01-03', numero_huespedes: 2, estado: 'pendiente', total: '1560.00' } as ReservaHabitacion;
const criteria = 'fecha_entrada=2030-01-01&fecha_salida=2030-01-03&numero_huespedes=2&buscar=1';
function LoginProbe() { const location = useLocation(); return <output aria-label="Retorno">{(location.state as { from?: string })?.from}</output>; }
function LocationProbe() { const location = useLocation(); const navigate = useNavigate(); return <><output aria-label="URL">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Atrás URL</button></>; }
function mount(route = '/habitaciones', ui?: React.ReactNode) {
  return renderWithProviders(<LocaleProvider><PublicPreferencesProvider><PublicTopBar /><LocationProbe />{ui ?? <Routes><Route path="/habitaciones" element={<RoomCatalog />} /><Route path="/habitaciones/:id" element={<RoomDetail />} /><Route path="/login" element={<LoginProbe />} /></Routes>}</PublicPreferencesProvider></LocaleProvider>, { route });
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { resolve, promise }; }
beforeEach(() => {
  tokenStorage.clear(); localStorage.clear(); sessionStorage.clear(); localStorage.setItem('hunahpu.public-site.v1', '1');
  global.fetch = vi.fn().mockResolvedValue(meResponse('cliente'));
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue(sites);
  vi.spyOn(habitacionesApi, 'getAll').mockResolvedValue([room]);
  vi.spyOn(habitacionesApi, 'getById').mockResolvedValue(room);
  vi.spyOn(reservasApi, 'getDisponibilidad').mockResolvedValue([quote]);
  vi.spyOn(reservasApi, 'create').mockResolvedValue(reservation);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); tokenStorage.clear(); localStorage.clear(); sessionStorage.clear(); document.body.style.overflow = ''; });

describe('Catálogo y continuidad de habitaciones', () => {
  it('la edición de precio usa replace y su chip elimina solo ese filtro, conservando sede y parámetros ajenos', async () => {
    tokenStorage.set('jwt'); mount('/habitaciones?origen=externo');
    await screen.findByRole('heading', { name: /Habitación 107/ });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Precio mínimo por noche (GTQ)'), '700');
    await user.click(screen.getByRole('button', { name: 'Atrás URL' }));
    expect(screen.getByLabelText('Precio mínimo por noche (GTQ)')).toHaveValue(700);
    expect(screen.getByLabelText('URL')).toHaveTextContent('min=700');
    await user.click(screen.getByRole('button', { name: 'Quitar filtro: Precio mínimo por noche (GTQ): 700' }));
    expect(screen.getByLabelText('URL')).not.toHaveTextContent('min=');
    expect(screen.getByLabelText('URL')).toHaveTextContent('origen=externo');
    expect(localStorage.getItem('hunahpu.public-site.v1')).toBe('1');
  });
  it('sin sesión conserva criterios y selección al login sin consultar datos protegidos ni hacer POST', async () => {
    const createCart = vi.spyOn(carritoApi, 'create');
    mount(`/habitaciones/7?sede=1&${criteria}`);
    await userEvent.setup().click(screen.getByRole('link', { name: 'Ingresar y continuar' }));
    expect(screen.getByLabelText('Retorno')).toHaveTextContent(`/habitaciones/7?sede=1&${criteria}`);
    expect(habitacionesApi.getById).not.toHaveBeenCalled();
    expect(habitacionesApi.getAll).not.toHaveBeenCalled();
    expect(reservasApi.getDisponibilidad).not.toHaveBeenCalled();
    expect(reservasApi.create).not.toHaveBeenCalled(); expect(createCart).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem('hunahpu.room-search.v1')!).path).toContain('/habitaciones/7');
  });
  it('sin fechas muestra unidades y tarifa contractual, sin afirmar disponibilidad física o calcular estancia', async () => {
    tokenStorage.set('jwt'); mount('/habitaciones');
    expect(await screen.findByRole('heading', { name: /Habitación 107 · Suite/ })).toBeInTheDocument();
    expect(screen.getByText(/Q\s*780\.00.*US\$\s*100\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Tarifas por noche del catálogo/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver habitación' })).toHaveAttribute('href', '/habitaciones/7?sede=1');
    expect(reservasApi.getDisponibilidad).not.toHaveBeenCalled();
    expect(screen.queryByText('Ocupada')).not.toBeInTheDocument();
  });
  it('el enlace con sede distinta requiere aplicación explícita y las respuestas de búsquedas anteriores no se mezclan', async () => {
    tokenStorage.set('jwt'); const delayed = deferred<HabitacionDisponible[]>();
    vi.mocked(reservasApi.getDisponibilidad).mockReturnValueOnce(delayed.promise).mockResolvedValueOnce([{ ...quote, id: 8, numero: '208', sucursal_id: 2 }]);
    mount(`/habitaciones?sede=2&${criteria}`);
    await screen.findByText('Sede del enlace compartido');
    expect(reservasApi.getDisponibilidad).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Aplicar sede del enlace' }));
    await waitFor(() => expect(reservasApi.getDisponibilidad).toHaveBeenCalledTimes(1));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sede: Atitlán' }));
    await userEvent.setup().click(screen.getByRole('button', { name: /Hotel Hunahpú Antigua Antigua Guatemala/ }));
    await act(async () => delayed.resolve([{ ...quote, id: 9, numero: 'Antigua', sucursal_id: 2 }]));
    expect(screen.queryByRole('heading', { name: /Habitación Antigua/ })).not.toBeInTheDocument();
  });
  it('con fechas conserva tarifa/noches/total del servidor y filtra precio por noche sin recalcularlo', async () => {
    tokenStorage.set('jwt'); mount(`/habitaciones?sede=1&${criteria}&min=700&max=900&orden=precio_asc&ajeno=conservar`);
    await screen.findByRole('heading', { name: /Habitación 107/ });
    expect(screen.getByText(/Q\s*1,560\.00.*US\$\s*200\.00/)).toBeInTheDocument();
    expect(reservasApi.getDisponibilidad).toHaveBeenCalledWith({ sucursal_id: 1, fecha_entrada: '2030-01-01', fecha_salida: '2030-01-03', numero_huespedes: 2 });
    expect(screen.getByLabelText('URL')).toHaveTextContent('ajeno=conservar');
    expect(screen.getByRole('link', { name: 'Ver habitación' }).getAttribute('href')).toContain('min=700');
  });
  it('una fecha pasada se explica sin corregirla o lanzar búsquedas silenciosamente', async () => {
    tokenStorage.set('jwt'); mount('/habitaciones?fecha_entrada=2000-01-01&fecha_salida=2000-01-03&numero_huespedes=2');
    expect(screen.getByText('La fecha de entrada no puede ser anterior a hoy en Guatemala')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de entrada (check-in)')).toHaveValue('2000-01-01');
    expect(reservasApi.getDisponibilidad).not.toHaveBeenCalled();
    expect(reservasApi.create).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Usar fechas propuestas' })).toBeInTheDocument();
  });
  it('al editar la estancia invalida la búsqueda y no reserva con respuesta desfasada', async () => {
    tokenStorage.set('jwt'); mount(`/habitaciones/7?sede=1&${criteria}`);
    await screen.findByRole('heading', { name: /Habitación 107/ });
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Reservar esta habitación' })[0]).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Fecha de entrada (check-in)'), { target: { value: '2030-01-05' } });
    expect(screen.getByLabelText('Fecha de salida (check-out)')).toHaveValue('2030-01-03');
    screen.getAllByRole('button', { name: 'Reservar esta habitación' }).forEach((button) => expect(button).toBeDisabled());
    expect(reservasApi.create).not.toHaveBeenCalled();
  });
});

describe('Detalle, creación y adición separada', () => {
  it('acceso directo y vuelta desde login solo revalidan GET, y el detalle conserva la sede real', async () => {
    tokenStorage.set('jwt'); localStorage.setItem('hunahpu.public-site.v1', '2'); mount(`/habitaciones/7?sede=1&${criteria}`);
    await screen.findByRole('heading', { name: /Habitación 107/ });
    expect(await screen.findByText(/Este recurso pertenece a/)).toHaveTextContent('Hotel Hunahpú Antigua');
    expect(localStorage.getItem('hunahpu.public-site.v1')).toBe('2');
    expect(reservasApi.create).not.toHaveBeenCalled();
  });
  it('distingue 404 del error y no consulta IDs inválidos', async () => {
    tokenStorage.set('jwt'); vi.mocked(habitacionesApi.getById).mockRejectedValue(new ApiError(404, 'not found'));
    const view = mount('/habitaciones/99');
    expect(await screen.findByText('Habitación no encontrada')).toBeInTheDocument(); view.unmount();
    vi.mocked(habitacionesApi.getById).mockClear(); mount('/habitaciones/invalida');
    expect(screen.getByRole('heading', { name: 'Habitación no encontrada' })).toBeInTheDocument();
    expect(habitacionesApi.getById).not.toHaveBeenCalled();
  });
  it('el 409 mantiene el conflicto y evita reenviar hasta consultar disponibilidad', async () => {
    tokenStorage.set('jwt'); vi.mocked(reservasApi.create).mockRejectedValue(new ApiError(409, 'Conflicto'));
    mount(`/habitaciones/7?sede=1&${criteria}`);
    const reserve = (await screen.findAllByRole('button', { name: 'Reservar esta habitación' }))[0];
    await waitFor(() => expect(reserve).toBeEnabled()); const user = userEvent.setup(); await user.click(reserve);
    await user.click(screen.getByRole('button', { name: 'Confirmar y reservar' }));
    expect(await screen.findByText('Habitación no disponible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar y reservar' })).toBeDisabled();
    expect(reservasApi.create).toHaveBeenCalledTimes(1);
  });
  it('si crear funciona y añadir falla conserva ID y reintenta solo adición; no hay POST al montar', async () => {
    tokenStorage.set('jwt');
    vi.spyOn(carritoApi, 'getOrCreateActiveCart').mockResolvedValue(crearCarrito());
    const add = vi.spyOn(carritoApi, 'addItem').mockRejectedValue(new ApiError(500, 'falló adición'));
    mount(`/habitaciones/7?sede=1&${criteria}`);
    const reserve = (await screen.findAllByRole('button', { name: 'Reservar esta habitación' }))[0];
    await waitFor(() => expect(reserve).toBeEnabled()); expect(reservasApi.create).not.toHaveBeenCalled();
    const user = userEvent.setup(); await user.click(reserve); await user.click(screen.getByRole('button', { name: 'Confirmar y reservar' }));
    await screen.findByText('#400');
    expect(reservasApi.create).toHaveBeenCalledWith({ habitacion_id: 7, fecha_entrada: '2030-01-01', fecha_salida: '2030-01-03', numero_huespedes: 2 });
    expect(add).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Añadir al carrito' }));
    await waitFor(() => expect(add).toHaveBeenCalledTimes(1)); await waitFor(() => expect(screen.getByRole('button', { name: 'Añadir al carrito' })).toBeEnabled());
    expect(screen.getByText('#400')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Añadir al carrito' }));
    await waitFor(() => expect(add).toHaveBeenCalledTimes(2));
    expect(reservasApi.create).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenLastCalledWith(crearCarrito().id, { tipo_item: 'habitacion', referencia_id: 400 });
  });
  it('una creación incierta no se repite automáticamente ni por el botón de confirmación', async () => {
    tokenStorage.set('jwt'); vi.mocked(reservasApi.create).mockRejectedValue(new ApiError(0, 'network'));
    mount(`/habitaciones/7?sede=1&${criteria}`);
    const reserve = (await screen.findAllByRole('button', { name: 'Reservar esta habitación' }))[0];
    await waitFor(() => expect(reserve).toBeEnabled()); const user = userEvent.setup(); await user.click(reserve); await user.click(screen.getByRole('button', { name: 'Confirmar y reservar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar y reservar' })).toBeDisabled());
    expect(reservasApi.create).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('link', { name: /Mis reservas/i }).length).toBeGreaterThan(0);
  });
  it('amplía la única foto real con Escape y sin miniaturas ficticias', async () => {
    tokenStorage.set('jwt'); mount('/habitaciones/7');
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Ampliar imagen de la habitación' }));
    const dialog = screen.getByRole('dialog', { name: 'Imagen de la habitación' });
    expect(within(dialog).getByRole('img', { name: 'Suite 107' })).toHaveAttribute('src', room.imagen_url);
    await userEvent.setup().keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Ampliar imagen de la habitación' })).toHaveFocus();
  });
});

describe('Calendario accesible', () => {
  it('usa dos meses en escritorio, conserva ISO, cambia idioma y navega con teclado', async () => {
    const media = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(media));
    function Form() { const [value, update] = React.useState({ fecha_entrada: '2030-01-01', fecha_salida: '2030-01-03', numero_huespedes: '2', tipo_habitacion_id: '' }); return <><RoomSearchPanel criteria={value} onChange={(changes) => update((old) => ({ ...old, ...changes }))} onSearch={() => {}} /></>; }
    const view = mount('/habitaciones', <Form />); const user = userEvent.setup(); await user.click(screen.getByRole('button', { name: 'Elegir rango de fechas' }));
    expect(screen.getByRole('dialog').querySelectorAll('.rdp-month')).toHaveLength(2);
    const day = within(screen.getByRole('dialog')).getAllByRole('button').find((button) => button.classList.contains('rdp-day_button'))!;
    day.focus(); await user.keyboard('{ArrowRight}'); expect(document.activeElement).not.toBe(day);
    await user.keyboard('{Escape}');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByLabelText('Arrival date (check-in)')).toHaveValue('2030-01-01');
    await user.click(screen.getByRole('button', { name: 'Choose stay dates' }));
    expect(screen.getByRole('dialog').querySelector('.rdp-root')).toHaveAttribute('lang', 'en');
    view.unmount(); vi.unstubAllGlobals();
  });
});
