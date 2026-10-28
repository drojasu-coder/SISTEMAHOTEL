import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation, useNavigate } from 'react-router-dom';
import App from '@/App';
import { tokenStorage } from '@/api/session';
import { ApiError } from '@/api/client/http';
import { jsonResponse, loginResponse, meResponse, renderWithProviders } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { PublicPreferencesProvider } from './PublicPreferences';
import { SITE_KEY, LANGUAGE_KEY } from './storage';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { restauranteApi } from '@/features/restaurante/api/restauranteApi';
import { actividadesApi } from '@/features/actividades/api/actividadesApi';
import { bienestarApi } from '@/features/bienestar/api/bienestarApi';
import { amenidadesApi } from '@/features/amenidades/api/amenidadesApi';
import { eventosApi } from '@/features/eventos/api/eventosApi';
import { CatalogoActividadesCliente } from '@/features/actividades/components/CatalogoActividadesCliente';
import { CatalogoAmenidadesCliente } from '@/features/amenidades/components/CatalogoAmenidadesCliente';
import { CatalogoBienestarList } from '@/features/bienestar/components/CatalogoBienestarList';
import { safeReturnPath } from '@/features/auth/secureReturn';
import { readServiceDraft, saveServiceDraft, type ServiceKind } from '@/features/auth/serviceDraft';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';

const sites = [1, 2].map((id) => ({ id, nombre: `Sede ${id}`, activa: true, ciudad: null, direccion: null, telefono: null }));
const resource = { id: 11, nombre: 'Cancha QA', sucursal_id: 2, tipo: 'tenis', precio_hora: 85, precio_equipo: 25, precio_instructor_hora: 30 };
const amenity = { id: 11, nombre: 'Piscina QA', sucursal_id: 2, aforo_maximo: 20, createdAt: '', updatedAt: '' };
const venue = { id: 11, nombre: 'Salón QA', sucursal_id: 2, capacidad_maxima: 25, tarifa_base: 650, descripcion: 'Descripción del servidor.' };
function Navigation() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output aria-label="URL">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Atrás QA</button><button onClick={() => navigate(1)}>Adelante QA</button></>;
}
function mount(ui: React.ReactNode, route: string) {
  return renderWithProviders(<LocaleProvider><PublicPreferencesProvider><LanguageSelector /><Navigation />{ui}</PublicPreferencesProvider></LocaleProvider>, { route });
}
function change(label: RegExp, value: string) { fireEvent.change(within(screen.getByRole('dialog')).getByLabelText(label), { target: { value } }); }
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); tokenStorage.clear(); localStorage.setItem(SITE_KEY, 'all');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue(sites);
  vi.spyOn(restauranteApi, 'getMesas').mockResolvedValue([{ id: 11, zona: 'Terraza QA', sucursal_id: 2, capacidad: 4, estado: 'disponible' }]);
  vi.spyOn(actividadesApi, 'getRecursos').mockResolvedValue([resource]);
  vi.spyOn(actividadesApi, 'getInstructores').mockResolvedValue([{ id: 5, nombre: 'Instructor QA', activo: true }]);
  vi.spyOn(bienestarApi, 'getServicios').mockResolvedValue([{ id: 11, nombre: 'Masaje QA', duracion_minutos: 45, precio: 300 }]);
  vi.spyOn(bienestarApi, 'getTerapeutas').mockResolvedValue([{ id: 5, nombre: 'Terapeuta QA', activo: true }]);
  vi.spyOn(amenidadesApi, 'getAll').mockResolvedValue([amenity]);
  vi.spyOn(eventosApi, 'getSalones').mockResolvedValue([venue]);
  vi.spyOn(eventosApi, 'getSalonById').mockResolvedValue(venue);
  global.fetch = vi.fn().mockImplementation((url: string) => Promise.resolve(url.endsWith('/auth/login') ? loginResponse('cliente') : url.endsWith('/auth/me') ? meResponse('cliente') : jsonResponse({ data: [] })));
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); tokenStorage.clear(); sessionStorage.clear(); localStorage.clear(); window.history.replaceState(null, '', '/'); });

describe('Ficha 4A · selección y reserva pública', () => {
  it.each<ServiceKind>(['restaurante', 'bienestar', 'amenidades', 'actividades', 'eventos'])('%s conserva fechas, horas y opciones tras login sin crear reservas', async (kind) => {
    window.history.replaceState(null, '', `/${kind}?q=QA&recurso=11`);
    render(<App />);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/La disponibilidad se comprueba al enviar/)).toBeInTheDocument();
    change(/^Fecha/, '2030-11-20');
    if (kind === 'restaurante') {
      change(/^Horario de la reserva/, '14:30');
      await userEvent.setup().selectOptions(within(dialog).getByLabelText(/Número de comensales/), '3');
    } else {
      change(/^Hora de inicio/, '14:30');
      if (kind !== 'bienestar') change(/^Hora de fin/, '15:30');
      if (kind === 'amenidades') change(/^Mobiliario/, 'Sombrilla');
      if (kind === 'actividades') {
        await userEvent.setup().selectOptions(within(dialog).getByLabelText(/^Instructor/), '5');
        // El equipamiento con tarifa (Q25) no tiene unidad de cobro definida: no se ofrece.
        expect(within(dialog).queryByRole('checkbox', { name: /equipamiento/i })).not.toBeInTheDocument();
      }
      if (kind === 'bienestar') await userEvent.setup().selectOptions(within(dialog).getByLabelText(/^Seleccionar terapeuta/), '5');
      if (kind === 'eventos') { change(/^Número estimado de invitados/, '12'); await userEvent.setup().selectOptions(within(dialog).getByLabelText(/^Tipo de evento/), 'boda'); }
    }
    expect(vi.mocked(fetch).mock.calls.filter(([, config]) => config?.method === 'POST')).toHaveLength(0);
    await userEvent.setup().click(within(dialog).getByRole('link', { name: /Iniciar sesión/i }));
    await screen.findByRole('heading', { name: /Iniciar sesión/i });
    fireEvent.change(screen.getByLabelText(/^Correo electrónico$/), { target: { value: 'qa@example.test' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/), { target: { value: 'Password123' } });
    await userEvent.setup().click(screen.getByRole('button', { name: /Iniciar sesión/i }));
    const restored = await screen.findByRole('dialog');
    expect(window.location.pathname).toBe(`/${kind}`);
    expect(window.location.search).toContain('q=QA'); expect(window.location.search).toContain('recurso=11');
    expect(within(restored).getByLabelText(/^Fecha/)).toHaveValue('2030-11-20');
    expect(within(restored).getByLabelText(kind === 'restaurante' ? /^Horario de la reserva/ : /^Hora de inicio/)).toHaveValue('14:30');
    if (['amenidades', 'actividades', 'eventos'].includes(kind)) expect(within(restored).getByLabelText(/^Hora de fin/)).toHaveValue('15:30');
    if (kind === 'restaurante') expect(within(restored).getByLabelText(/Número de comensales/)).toHaveValue('3');
    if (kind === 'amenidades') expect(within(restored).getByLabelText(/^Mobiliario/)).toHaveValue('Sombrilla');
    if (kind === 'actividades') { expect(within(restored).getByLabelText(/^Instructor/)).toHaveValue('5'); expect(within(restored).getByText('Total estimado').parentElement).toHaveTextContent(/Q\s?115\.00/); }
    if (kind === 'bienestar') await waitFor(() => expect(within(restored).getByLabelText(/^Seleccionar terapeuta/)).toHaveValue('5'));
    if (kind === 'eventos') { expect(within(restored).getByLabelText(/^Tipo de evento/)).toHaveValue('boda'); expect(within(restored).getByLabelText(/^Número estimado de invitados/)).toHaveValue(12); }
    const posts = vi.mocked(fetch).mock.calls.filter(([, config]) => config?.method === 'POST');
    expect(posts.map(([url]) => url)).toEqual([expect.stringContaining('/auth/login')]);
  });
  it('conserva catálogo, borrador, atrás/adelante, recarga y foco de cierre', async () => {
    const view = mount(<CatalogoActividadesCliente />, '/actividades?q=Cancha&tipo=tenis');
    const user = userEvent.setup(); const trigger = await screen.findByRole('button', { name: 'Ver y reservar' });
    await user.click(trigger); change(/^Hora de inicio/, '15:00'); change(/^Hora de fin/, '16:00');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(trigger).toHaveFocus();
    expect(screen.getByRole('searchbox')).toHaveValue('Cancha');
    await user.click(screen.getByRole('button', { name: 'Adelante QA' }));
    expect(await screen.findByLabelText(/^Hora de inicio/)).toHaveValue('15:00');
    const url = screen.getByLabelText('URL').textContent!;
    view.unmount(); mount(<CatalogoActividadesCliente />, url);
    expect(await screen.findByLabelText(/^Hora de inicio/)).toHaveValue('15:00');
    expect(screen.getByRole('searchbox')).toHaveValue('Cancha');
    // El total estimado usa la regla real del backend (precio_hora × horas): 1 h × Q85.
    // Equipo e instructor no forman parte del total que cobra el servidor.
    const total = screen.getByText(/Total estimado/).parentElement!;
    expect(total).toHaveTextContent(/Q\s?85\.00/);
    expect(total).not.toHaveTextContent(/140\.00/);
  });
  it('abre el selector global desde la sede vacía sin encabezado y separa búsqueda vacía', async () => {
    localStorage.setItem(SITE_KEY, '1'); mount(<CatalogoAmenidadesCliente />, '/amenidades?q=Noexiste');
    expect(await screen.findByRole('heading', { name: 'Esta sede no tiene opciones en el catálogo.' })).toBeInTheDocument();
    const user = userEvent.setup(); await user.click(screen.getAllByRole('button', { name: 'Cambiar sede' }).at(-1)!);
    const picker = screen.getByRole('dialog');
    await user.click(within(picker).getByRole('button', { name: /Sede 2/ }));
    expect(await screen.findByRole('heading', { name: 'Sin resultados con estos filtros' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Restablecer filtros' })[0]);
    expect(await screen.findByRole('heading', { name: 'Piscina QA' })).toBeInTheDocument();
  });
  it('muestra error de carga sin sustituirlo por vacío y permite reintentar', async () => {
    vi.mocked(amenidadesApi.getAll).mockRejectedValue(new ApiError(500, 'SQL privado'));
    mount(<CatalogoAmenidadesCliente />, '/amenidades');
    const error = await screen.findByRole('alert'); expect(error).not.toHaveTextContent('SQL privado');
    expect(screen.queryByText('Esta sede no tiene opciones en el catálogo.')).not.toBeInTheDocument();
    vi.mocked(amenidadesApi.getAll).mockResolvedValue([]);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'No hay amenidades registradas' })).toBeInTheDocument();
  });
  it('Bienestar explica el catálogo general y no atribuye el servicio a la sede global', async () => {
    localStorage.setItem(SITE_KEY, '1'); localStorage.setItem(LANGUAGE_KEY, 'en');
    mount(<CatalogoBienestarList />, '/bienestar?recurso=11');
    const panel = await screen.findByRole('dialog');
    expect(within(panel).getByText('General wellness catalog · not filtered by location.')).toBeInTheDocument();
    expect(within(panel).queryByText('Sede 1')).not.toBeInTheDocument();
    expect(within(panel).getByText(/Availability is checked when you submit/)).toBeInTheDocument();
    expect(within(panel).getByLabelText(/Start time/)).toHaveValue('');
  });
  it('el detalle de salón conserva ruta y filtros al volver, omite políticas inventadas', async () => {
    window.history.replaceState(null, '', '/eventos/salones/11?q=Sal%C3%B3n&page=2'); render(<App />);
    await screen.findByRole('heading', { name: 'Salón QA', level: 1 });
    expect(screen.queryByRole('heading', { name: /Condiciones/ })).not.toBeInTheDocument();
    const back = screen.getByRole('link', { name: /Volver a salones/ });
    expect(back.getAttribute('href')).toBe('/eventos?q=Sal%C3%B3n&page=2');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Solicitar cotización' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/eventos/salones/11');
    expect(window.location.search).toContain('recurso=11');
  });
  it('rechaza borradores con identidad/precios y retornos externos; permite filtros del servicio', () => {
    sessionStorage.setItem('hunahpu.service-draft.v1.actividades.11', JSON.stringify({ total: 0, usuario_id: 5, fecha: '2030-11-20' }));
    expect(readServiceDraft('actividades', 11)).toEqual({});
    saveServiceDraft('actividades', 11, { fecha: '2030-11-20', conEquipo: true, total: 0, usuario_id: 5 });
    expect(readServiceDraft('actividades', 11)).toEqual({ fecha: '2030-11-20', conEquipo: true });
    expect(readServiceDraft('actividades', 12)).toEqual({});
    expect(safeReturnPath('//evil.test/actividades?recurso=11')).toBeNull();
    expect(safeReturnPath('/actividades?recurso=11&page=2&tipo=tenis&token=secret&total=0')).toBe('/actividades?recurso=11&page=2&tipo=tenis');
    expect(safeReturnPath('/actividades?recurso=-1')).toBe('/actividades');
  });
  it('usa la fecha de Guatemala cuando UTC ya es el día siguiente', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2030-01-02T02:00:00Z'));
    expect(getTodayInGuatemala()).toBe('2030-01-01');
  });
});
