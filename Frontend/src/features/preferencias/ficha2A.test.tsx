import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, meResponse } from '@/test/renderWithProviders';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { PublicPreferencesProvider } from './PublicPreferences';
import { PublicTopBar } from '@/components/shared/PublicTopBar';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { PublicCartLink } from '@/components/shared/PublicCartLink';
import { CatalogSiteNotice } from './SiteContextNotice';
import { BuscadorDisponibilidad } from '@/features/inicio/components/BuscadorDisponibilidad';
import { CriteriosBusquedaForm } from '@/features/crear-reserva/components/CriteriosBusquedaForm';
import { CatalogoRestaurantePage } from '@/pages/CatalogoRestaurantePage';
import { CatalogoAmenidadesPage } from '@/pages/CatalogoAmenidadesPage';
import { CatalogoActividadesPage } from '@/pages/CatalogoActividadesPage';
import { CatalogoBienestarPage } from '@/pages/CatalogoBienestarPage';
import { CatalogoEventosPage } from '@/pages/CatalogoEventosPage';
import { PublicHabitacionesPage } from '@/pages/PublicHabitacionesPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { TranslatedError, usePublicTexts } from '@/i18n/public';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { inicioApi } from '@/features/inicio/api/inicioApi';
import { restauranteApi } from '@/features/restaurante/api/restauranteApi';
import { amenidadesApi } from '@/features/amenidades/api/amenidadesApi';
import { actividadesApi } from '@/features/actividades/api/actividadesApi';
import { bienestarApi } from '@/features/bienestar/api/bienestarApi';
import { eventosApi } from '@/features/eventos/api/eventosApi';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { authApi } from '@/features/auth/api/authApi';
import { useAuth } from '@/features/auth/AuthContext';
import { tokenStorage } from '@/api/session';
import { ApiError } from '@/api/client/http';
import { crearCarrito, crearItem } from '@/features/carrito/pantalla-test-utils';
import type { InicioData } from '@/features/inicio/types';
import type { CarritoItemsData } from '@/features/carrito/types';
import { SITE_KEY, LANGUAGE_KEY } from './storage';
import { publicPhone } from '@/lib/contact';
import { formatCalendarDate } from '@/lib/dates';

const sites = [
  { id: 1, nombre: 'Hotel Hunapú Antigua', ciudad: 'Antigua Guatemala', direccion: null, telefono: '22223333', activa: true },
  { id: 2, nombre: 'Hotel Hunahpú Atitlán', ciudad: 'Panajachel', direccion: null, telefono: '+34 911 222 333', activa: true },
];
function renderPublic(children: React.ReactNode, withHeader = false) {
  const accessPage = React.isValidElement(children) && (children.type === LoginPage || children.type === RegisterPage);
  return renderWithProviders(<LocaleProvider><PublicPreferencesProvider>{!accessPage && <PublicTopBar />}{withHeader && <Navbar />}{children}</PublicPreferencesProvider></LocaleProvider>);
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { resolve, promise }; }
const changeLanguage = async (language: 'es' | 'en') => userEvent.setup().selectOptions(screen.getByRole('combobox', { name: /^(Idioma|Language)$/ }), language);
beforeEach(() => {
  tokenStorage.clear(); localStorage.clear(); localStorage.setItem(SITE_KEY, 'all');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue(sites);
  vi.spyOn(inicioApi, 'getContent').mockResolvedValue({ contacto_visible: true, contacto_email: 'contacto@example.test', contacto_direccion: 'Guatemala, Centroamérica' } as InicioData);
  vi.spyOn(restauranteApi, 'getMesas').mockResolvedValue([]);
  vi.spyOn(amenidadesApi, 'getAll').mockResolvedValue([]);
  vi.spyOn(actividadesApi, 'getRecursos').mockResolvedValue([]);
  vi.spyOn(actividadesApi, 'getInstructores').mockResolvedValue([]);
  vi.spyOn(bienestarApi, 'getServicios').mockResolvedValue([]);
  vi.spyOn(eventosApi, 'getSalones').mockResolvedValue([]);
  global.fetch = vi.fn().mockResolvedValue(meResponse('cliente'));
});
afterEach(() => { vi.restoreAllMocks(); tokenStorage.clear(); localStorage.clear(); document.body.style.overflow = ''; });

describe('Barra superior y selector único', () => {
  it('usa ES/EN sin etiquetas visibles ni banderas y muestra nombres cortos y opciones oficiales con ciudad', async () => {
    renderPublic(<CatalogSiteNotice />, true);
    const language = screen.getByRole('combobox', { name: 'Idioma' });
    expect(within(language).getAllByRole('option').map((o) => o.textContent)).toEqual(['ES', 'EN']);
    expect(language.parentElement?.querySelector('span')).toHaveClass('sr-only');
    expect(screen.getByTestId('public-top-bar')).not.toHaveClass('sticky');
    expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0');
    const trigger = screen.getByRole('button', { name: 'Sede: Todas las sedes' });
    await userEvent.setup().click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Elegir sede' });
    await within(dialog).findByRole('button', { name: /Hotel Hunahpú Atitlán Lago de Atitlán, Panajachel/ });
    expect(within(dialog).getByRole('button', { name: /Hotel Hunahpú Antigua Antigua Guatemala/ })).toBeInTheDocument();
    await userEvent.setup().click(within(dialog).getByRole('button', { name: /Hotel Hunahpú Atitlán/ }));
    expect(screen.getByRole('button', { name: 'Sede: Atitlán' })).toBeInTheDocument();
    expect(localStorage.getItem(SITE_KEY)).toBe('2');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cambiar sede' }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    await userEvent.setup().keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Cambiar sede' })).toHaveFocus();
  });
  it('el menú móvil mantiene foco y Escape sin duplicar selectores', async () => {
    renderPublic(null, true);
    const button = screen.getByRole('button', { name: 'Abrir menú de navegación' });
    await userEvent.setup().click(button);
    const menu = screen.getByRole('dialog');
    expect(within(menu).queryByRole('combobox')).not.toBeInTheDocument();
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
    await userEvent.setup().keyboard('{Escape}');
    expect(button).toHaveFocus();
  });
  it('buscador y barra comparten sede sin perder fechas ni huéspedes', async () => {
    renderPublic(<BuscadorDisponibilidad />);
    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Hotel Hunahpú Atitlán' });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sede' }), '2');
    expect(screen.getByRole('button', { name: 'Sede: Atitlán' })).toBeInTheDocument();
    const arrival = screen.getByLabelText('Llegada');
    const originalDate = (arrival as HTMLInputElement).value;
    await user.selectOptions(screen.getByRole('combobox', { name: 'Huéspedes' }), '4');
    await user.click(screen.getByRole('button', { name: 'Sede: Atitlán' }));
    await user.click(screen.getByRole('button', { name: /Hotel Hunahpú Antigua Antigua Guatemala/ }));
    expect(arrival).toHaveValue(originalDate);
    expect(screen.getByRole('combobox', { name: 'Huéspedes' })).toHaveValue('4');
    expect(screen.getByRole('combobox', { name: 'Sede' })).toHaveValue('1');
  });
});

describe('Contador de artículos del carrito', () => {
  it('no consulta datos privados sin sesión ni durante restauración', async () => {
    const current = vi.spyOn(carritoApi, 'getCurrent'); const items = vi.spyOn(carritoApi, 'getItems');
    const rendered = renderPublic(<PublicCartLink />);
    expect(current).not.toHaveBeenCalled(); expect(items).not.toHaveBeenCalled(); rendered.unmount();
    tokenStorage.set('jwt'); const me = deferred<Response>(); global.fetch = vi.fn().mockReturnValue(me.promise);
    renderPublic(<PublicCartLink />);
    expect(current).not.toHaveBeenCalled(); expect(items).not.toHaveBeenCalled();
    await act(async () => me.resolve(meResponse('admin')));
    expect(current).not.toHaveBeenCalled(); expect(items).not.toHaveBeenCalled();
  });
  it('cuenta referencias, no suma cantidades, y no crea un carrito', async () => {
    tokenStorage.set('jwt');
    vi.spyOn(carritoApi, 'getCurrent').mockResolvedValue(crearCarrito());
    vi.spyOn(carritoApi, 'getItems').mockResolvedValue({ items: [crearItem({ cantidad: 7 }), crearItem({ id: 502, cantidad: 3 })], total: 123 });
    const create = vi.spyOn(carritoApi, 'create'); renderPublic(<PublicCartLink />);
    const link = await screen.findByRole('link', { name: 'Carrito: 2 artículos' });
    expect(link).toHaveTextContent('2'); expect(create).not.toHaveBeenCalled();
    await changeLanguage('en'); expect(screen.getByRole('link', { name: 'Cart: 2 items' })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Location: All locations' }));
    await userEvent.setup().click(screen.getByRole('button', { name: /Hotel Hunahpú Antigua Antigua Guatemala/ }));
    expect(screen.getByRole('link', { name: 'Cart: 2 items' })).toBeInTheDocument();
    expect(carritoApi.getItems).toHaveBeenCalledTimes(1);
  });
  it('distingue carga, error, respuesta inválida y ausencia real de carrito', async () => {
    tokenStorage.set('jwt'); const pending = deferred<ReturnType<typeof crearCarrito>>();
    vi.spyOn(carritoApi, 'getCurrent').mockReturnValueOnce(pending.promise);
    vi.spyOn(carritoApi, 'getItems').mockRejectedValue(new ApiError(400, 'failure'));
    const rendered = renderPublic(<PublicCartLink />);
    expect(await screen.findByRole('link', { name: 'Carrito: consultando artículos' })).toHaveAttribute('aria-busy', 'true');
    await act(async () => pending.resolve(crearCarrito()));
    expect(await screen.findByRole('link', { name: 'Carrito: no se pudo consultar el contenido' })).toBeInTheDocument();
    rendered.unmount();
    vi.mocked(carritoApi.getCurrent).mockResolvedValue(crearCarrito());
    vi.mocked(carritoApi.getItems).mockResolvedValue({ total: 0 } as CarritoItemsData);
    const malformed = renderPublic(<PublicCartLink />);
    expect(await screen.findByRole('link', { name: 'Carrito: no se pudo consultar el contenido' })).toBeInTheDocument();
    malformed.unmount();
    vi.mocked(carritoApi.getCurrent).mockRejectedValue(new ApiError(404, 'No existe', { code: 'CART_NOT_FOUND' }));
    renderPublic(<PublicCartLink />);
    expect(await screen.findByRole('link', { name: 'Carrito: 0 artículos' })).not.toHaveTextContent('0');
  });
  it('una respuesta tardía del usuario anterior no cambia el contador del nuevo usuario', async () => {
    tokenStorage.set('jwt3');
    const oldItems = deferred<CarritoItemsData>();
    vi.spyOn(carritoApi, 'getCurrent').mockImplementation(() => Promise.resolve(crearCarrito({ id: tokenStorage.get() === 'jwt4' ? 20 : 10 })));
    vi.spyOn(carritoApi, 'getItems').mockImplementation((id) => id === 10 ? oldItems.promise : Promise.resolve({ items: [crearItem({ id: 900 })], total: 10 }));
    vi.spyOn(authApi, 'login').mockResolvedValue({ accessToken: 'jwt4', usuario: { id: 4, nombre: 'Otro cliente', email: 'otro@example.test', telefono: null, rol: 'cliente' } });
    function SwitchAccount() { const { logout, login } = useAuth(); return <button onClick={async () => { logout(); await login({ email: 'otro@example.test', password: 'Clave1234' }); }}>Cambiar persona</button>; }
    renderPublic(<><PublicCartLink /><SwitchAccount /></>);
    await waitFor(() => expect(carritoApi.getItems).toHaveBeenCalledWith(10));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cambiar persona' }));
    await screen.findByRole('link', { name: 'Carrito: 1 artículo' });
    await act(async () => oldItems.resolve({ items: [crearItem(), crearItem({ id: 2 }), crearItem({ id: 3 })], total: 30 }));
    expect(screen.getByRole('link', { name: 'Carrito: 1 artículo' })).toBeInTheDocument();
  });
});

describe('Inventario de interfaces públicas en inglés', () => {
  it.each([
    [CatalogoRestaurantePage, 'Restaurant'], [CatalogoAmenidadesPage, 'Amenities and facilities'],
    [CatalogoActividadesPage, 'Sports and recreational activities'], [CatalogoBienestarPage, 'Wellness services'],
    [CatalogoEventosPage, 'Event venues'], [PublicHabitacionesPage, 'Rooms'], [LoginPage, 'Sign in'], [RegisterPage, 'Create account'],
  ])('%s traduce su encabezado sin recargar', async (Page, title) => {
    renderPublic(<Page />);
    if (Page === LoginPage || Page === RegisterPage) {
      expect(screen.queryByTestId('public-top-bar')).not.toBeInTheDocument();
      expect(screen.getAllByRole('combobox', { name: 'Idioma' })).toHaveLength(1);
    }
    await changeLanguage('en');
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
  it('revalida mensajes visibles al cambiar idioma conservando los campos', async () => {
    const submit = vi.fn();
    renderPublic(<CriteriosBusquedaForm sedes={sites} tiposHabitacion={[]} isSearching={false} onSubmitSearch={submit} onCriteriaChange={() => {}} />);
    const user = userEvent.setup(); await user.type(screen.getByLabelText('Fecha de entrada (check-in)'), '2030-11-20');
    await user.click(screen.getByRole('button', { name: 'Buscar disponibilidad' }));
    await screen.findByText('Debe seleccionar una sede'); await changeLanguage('en');
    expect(await screen.findByText('Select a location', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByLabelText('Arrival date (check-in)')).toHaveValue('2030-11-20');
    expect(submit).not.toHaveBeenCalled();
  });
  it('un error local ya visible cambia de idioma; errores desconocidos del servidor conservan español marcado', async () => {
    renderPublic(<><TranslatedError error={{ section: 'restaurante', key: 'errorCapacidad' }} /><TranslatedError error={{ server: 'Mensaje original del servidor' }} /></>);
    await changeLanguage('en');
    expect(screen.getByText('Your party exceeds the capacity of the selected table.')).toBeInTheDocument();
    expect(screen.getByText('Mensaje original del servidor')).toHaveAttribute('lang', 'es');
  });
  it('plurales de cantidades son coherentes', async () => {
    localStorage.setItem(LANGUAGE_KEY, 'en');
    function Plurals() { const t = usePublicTexts('crearReserva'); return <output>{t.nochesCalculadas(1)} · {t.nochesCalculadas(2)} · {t.resultadosEncontrados(1)} · {t.resultadosEncontrados(2)}</output>; }
    renderPublic(<Plurals />);
    expect(screen.getByRole('status')).toHaveTextContent('1 night · 2 nights · 1 available room found · 2 available rooms found');
  });
  it('el footer agrupa teléfonos reales y omite la ubicación corporativa no validada', async () => {
    renderPublic(<Footer />); const footer = screen.getByRole('contentinfo');
    expect(await within(footer).findByRole('link', { name: '+502 2222-3333' })).toHaveAttribute('href', 'tel:+50222223333');
    expect(within(footer).getByRole('link', { name: '+34 911 222 333' })).toHaveAttribute('href', 'tel:+34911222333');
    expect(within(footer).queryByText('Guatemala, Centroamérica')).not.toBeInTheDocument();
    expect(footer).toHaveTextContent(`© ${new Date().getFullYear()} Hotel Hunahpú`);
    expect(within(footer).getByRole('link', { name: 'contacto@example.test' })).toHaveAttribute('href', 'mailto:contacto@example.test');
  });
});

describe('Formatos compartidos', () => {
  it('no desplaza una fecha de calendario al día anterior', () => {
    expect(formatCalendarDate('2030-01-01', 'en')).toBe('Jan 1, 2030');
    expect(formatCalendarDate('2030-01-01', 'es')).toContain('1 ene 2030');
    expect(formatCalendarDate('2030-02-31', 'en')).toBeNull();
  });
  it('formatea teléfonos guatemaltecos y conserva los internacionales', () => {
    expect(publicPhone('77620015')).toEqual({ display: '+502 7762-0015', href: 'tel:+50277620015' });
    expect(publicPhone('+1 (415) 555-0100')).toEqual({ display: '+1 (415) 555-0100', href: 'tel:+14155550100' });
  });
});
