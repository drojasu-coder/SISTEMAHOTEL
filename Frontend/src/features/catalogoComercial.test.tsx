import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPublicWithProviders, jsonResponse, meResponse, errorResponse } from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { CatalogoRestaurantePage } from '@/pages/CatalogoRestaurantePage';
import { CatalogoActividadesPage } from '@/pages/CatalogoActividadesPage';
import { CatalogoAmenidadesPage } from '@/pages/CatalogoAmenidadesPage';

const SITE_KEY = 'hunahpu.public-site.v1';
const LANGUAGE_KEY = 'hunahpu.language.v1';
const sedes = [
  { id: 1, nombre: 'Hotel Hunahpú Antigua', ciudad: 'Antigua Guatemala', activa: true },
  { id: 4, nombre: 'Hotel Hunahpú Capital', ciudad: 'Ciudad de Guatemala', activa: true },
];
const restaurantes = [
  { id: 1, sucursal_id: 1, nombre: 'Patio de la Ceiba', descripcion: 'Restaurante principal de la sede Antigua.', Sucursal: { id: 1, nombre: 'Hotel Hunahpú Antigua' }, mesas: { total: 24, plazas: 88 } },
  { id: 4, sucursal_id: 4, nombre: 'Cobre & Jade', descripcion: null, Sucursal: { id: 4, nombre: 'Hotel Hunahpú Capital' }, mesas: { total: 33, plazas: 128 } },
];
const menu = [
  { id: 1, restaurante_id: 1, categoria: 'desayuno', nombre: 'Desayuno tradicional', descripcion: 'Huevos al gusto.', precio: '95.00', disponible: true, orden: 1 },
  { id: 2, restaurante_id: 1, categoria: 'plato_fuerte', nombre: 'Pepián', descripcion: 'Pepián de pollo.', precio: '135.00', disponible: true, orden: 7 },
  { id: 3, restaurante_id: 1, categoria: 'bebida', nombre: 'Café', descripcion: 'Café filtrado.', precio: '22.00', disponible: false, orden: 13 },
];
const recursos = [
  { id: 30, sucursal_id: 1, tipo: 'excursion', nombre: 'Excursión al Volcán Pacaya', modalidad: 'experiencia', duracion_minutos: 360, cupo_maximo: 8, precio_persona: '725.00', precio_hora: '120.83', precio_equipo: '0.00', precio_instructor_hora: '0.00', Sucursal: { id: 1, nombre: 'Hotel Hunahpú Antigua' } },
  { id: 2, sucursal_id: 1, tipo: 'tenis', nombre: 'Cancha de Tenis Antigua', modalidad: 'por_hora', duracion_minutos: null, cupo_maximo: null, precio_persona: null, precio_hora: '120.00', precio_equipo: '40.00', precio_instructor_hora: '80.00', Sucursal: { id: 1, nombre: 'Hotel Hunahpú Antigua' } },
];
const amenidades = [
  { id: 20, sucursal_id: 1, nombre: 'Gimnasio', aforo_maximo: 12, reservable: true, Sucursal: { id: 1, nombre: 'Hotel Hunahpú Antigua' } },
  { id: 12, sucursal_id: 1, nombre: 'Claustro y Jardín Colonial', aforo_maximo: 25, reservable: false, Sucursal: { id: 1, nombre: 'Hotel Hunahpú Antigua' } },
];

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response> | undefined;
let posts: { url: string; body: any }[] = [];

function mockApi(extra?: Handler) {
  posts = [];
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const custom = extra?.(url, init);
    if (custom) return custom;
    if (init?.method === 'POST') posts.push({ url, body: JSON.parse(String(init.body)) });
    if (url.endsWith('/auth/me')) return tokenStorage.get() ? meResponse('cliente') : errorResponse(401, 'UNAUTHORIZED', 'No autenticado');
    if (url.endsWith('/sucursales')) return jsonResponse({ status: 'success', data: sedes });
    if (url.endsWith('/restaurantes')) return jsonResponse({ status: 'success', data: restaurantes });
    if (url.includes('/restaurantes/1/menu')) return jsonResponse({ status: 'success', data: menu });
    if (url.endsWith('/mesas')) return jsonResponse({ status: 'success', data: [] });
    if (url.endsWith('/recursos-actividad')) return jsonResponse({ status: 'success', data: recursos });
    if (url.includes('/recursos-actividad/30/salidas')) return jsonResponse({ status: 'success', data: { recurso_id: 30, fecha: '2030-01-10', modalidad: 'experiencia', cupo_maximo: 8, salidas: [{ hora_inicio: '07:00:00', hora_fin: '13:00:00', participantes: 6, disponibles: 2 }] } });
    if (url.endsWith('/instructores')) return jsonResponse({ status: 'success', data: [] });
    if (url.endsWith('/amenidades')) return jsonResponse({ status: 'success', data: amenidades });
    return errorResponse(404, 'NOT_FOUND', `Sin simulación para ${url}`);
  }) as typeof fetch;
}

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); tokenStorage.clear(); vi.restoreAllMocks(); localStorage.setItem(SITE_KEY, '1'); });
afterEach(() => { tokenStorage.clear(); localStorage.clear(); });

describe('Restaurante · restaurante de la sede y su carta', () => {
  it('muestra el restaurante de la sede activa, sus categorías y marca lo no disponible', async () => {
    mockApi();
    renderPublicWithProviders(<CatalogoRestaurantePage />);
    expect(await screen.findByRole('heading', { name: 'Patio de la Ceiba' })).toBeInTheDocument();
    expect(screen.getByText('24 mesas · 88 plazas')).toBeInTheDocument();
    // La carta no ocupa la página: se abre en un diálogo accesible.
    expect(screen.queryByText('Pepián')).not.toBeInTheDocument();
    const abrir = screen.getByRole('button', { name: 'Ver carta' });
    await userEvent.click(abrir);
    const dialog = await screen.findByRole('dialog', { name: 'Carta · Patio de la Ceiba' });
    expect(await within(dialog).findByText('Pepián')).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.queryByText('Cobre & Jade')).not.toBeInTheDocument();
    const categorias = screen.getByRole('group', { name: 'Categorías de la carta' });
    await userEvent.click(within(categorias).getByRole('button', { name: /Bebidas/ }));
    expect(within(categorias).getByRole('button', { name: /Bebidas/ })).toHaveAttribute('aria-pressed', 'true');
    expect(within(dialog).queryByText('Pepián')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Café')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('un enlace directo a #carta abre la carta en el diálogo', async () => {
    mockApi();
    renderPublicWithProviders(<CatalogoRestaurantePage />, { route: '/restaurante#carta' });
    expect(await screen.findByRole('dialog', { name: 'Carta · Patio de la Ceiba' })).toBeInTheDocument();
  });

  it('sin sede elegida lista los restaurantes y al elegir uno conserva la sede', async () => {
    localStorage.setItem(SITE_KEY, 'all');
    mockApi();
    renderPublicWithProviders(<CatalogoRestaurantePage />);
    expect(await screen.findByText('Cobre & Jade')).toBeInTheDocument();
    const fila = screen.getByText('Patio de la Ceiba').closest('li')!;
    await userEvent.click(within(fila).getByRole('button', { name: 'Ver carta' }));
    expect(await screen.findByRole('heading', { name: 'Patio de la Ceiba' })).toBeInTheDocument();
    expect(localStorage.getItem(SITE_KEY)).toBe('1');
  });

  it('un error al cargar el restaurante ofrece reintentar y no inventa contenido', async () => {
    mockApi((url) => (url.endsWith('/restaurantes') ? errorResponse(500, 'INTERNAL', 'fallo') : undefined));
    renderPublicWithProviders(<CatalogoRestaurantePage />);
    expect(await screen.findByText('No se pudo cargar la información del restaurante.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByText('Pepián')).not.toBeInTheDocument();
  });

  it('traduce la carta al inglés sin traducir los nombres de los platos', async () => {
    localStorage.setItem(LANGUAGE_KEY, 'en');
    mockApi();
    renderPublicWithProviders(<LocaleProvider><CatalogoRestaurantePage /></LocaleProvider>);
    await userEvent.click(await screen.findByRole('button', { name: 'View menu' }));
    expect(await screen.findByRole('group', { name: 'Menu categories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Main courses/ })).toBeInTheDocument();
    expect(screen.getByText('Not available')).toBeInTheDocument();
    expect(screen.getByText('Pepián')).toHaveAttribute('lang', 'es');
  });
});

describe('Actividades · experiencias y recursos por hora', () => {
  it('la experiencia muestra duración real y precio por persona; el recurso por hora conserva su tarifa', async () => {
    mockApi();
    renderPublicWithProviders(<CatalogoActividadesPage />);
    expect(await screen.findByText('Excursión al Volcán Pacaya')).toBeInTheDocument();
    expect(screen.getByText('Duración: 6 h')).toBeInTheDocument();
    expect(screen.getByText('Cupo por salida: 8 personas')).toBeInTheDocument();
    expect(screen.getByText('por persona')).toBeInTheDocument();
    expect(screen.queryByText(/120\.83/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Alquiler por hora/).length).toBeGreaterThan(0);
  });

  it('reserva una experiencia con participantes, sin hora_fin y respetando los lugares de la salida', async () => {
    tokenStorage.set('qa-token');
    mockApi((url, init) => {
      if (url.endsWith('/reservas-actividad') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body));
        posts.push({ url, body });
        return jsonResponse({ status: 'success', data: { id: 9, recurso_id: 30, fecha: body.fecha, hora_inicio: '07:00:00', hora_fin: '13:00:00', numero_participantes: body.numero_participantes, total: (725 * body.numero_participantes).toFixed(2), estado: 'confirmada' } }, 201);
      }
      return undefined;
    });
    renderPublicWithProviders(<CatalogoActividadesPage />, { route: '/actividades?recurso=30' });
    const dialog = await screen.findByRole('dialog');
    await userEvent.clear(within(dialog).getByLabelText(/^Fecha/));
    await userEvent.type(within(dialog).getByLabelText(/^Fecha/), '2030-01-10');
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Unirse a la salida de las 07:00' }));
    expect(within(dialog).getByText(/Termina a las 13:00/)).toBeInTheDocument();
    const mas = within(dialog).getByRole('button', { name: 'Añadir un participante' });
    await userEvent.click(mas);
    expect(within(dialog).getByText('Quedan 2 lugares en esta salida.')).toBeInTheDocument();
    expect(mas).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('button', { name: /Confirmar/ }));
    await waitFor(() => expect(posts.find((post) => post.url.endsWith('/reservas-actividad'))).toBeDefined());
    const body = posts.find((post) => post.url.endsWith('/reservas-actividad'))!.body;
    expect(body).toEqual({ recurso_id: 30, fecha: '2030-01-10', hora_inicio: '07:00', numero_participantes: 2 });
    expect(await within(dialog).findByText('Participantes')).toBeInTheDocument();
  });

  it('si el servidor rechaza por cupo no aparenta una reserva confirmada', async () => {
    tokenStorage.set('qa-token');
    mockApi((url, init) => (url.endsWith('/reservas-actividad') && init?.method === 'POST'
      ? errorResponse(409, 'ACTIVITY_CAPACITY_EXCEEDED', 'La salida tiene cupo para 8 participantes y quedan 0 lugares disponibles')
      : undefined));
    renderPublicWithProviders(<CatalogoActividadesPage />, { route: '/actividades?recurso=30' });
    const dialog = await screen.findByRole('dialog');
    await userEvent.clear(within(dialog).getByLabelText(/^Fecha/));
    await userEvent.type(within(dialog).getByLabelText(/^Fecha/), '2030-01-11');
    await userEvent.type(within(dialog).getByLabelText(/^Hora de inicio/), '08:00');
    await userEvent.click(within(dialog).getByRole('button', { name: /Confirmar/ }));
    expect(await within(dialog).findByText(/No quedan suficientes lugares/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Agregar al carrito|Añadir al carrito/i)).not.toBeInTheDocument();
  });
});

describe('Amenidades · reservables y compartidas', () => {
  it('las compartidas se muestran sin botón de reserva y el filtro de acceso funciona', async () => {
    mockApi();
    renderPublicWithProviders(<CatalogoAmenidadesPage />);
    expect(await screen.findByText('Claustro y Jardín Colonial')).toBeInTheDocument();
    expect(screen.getByText('Espacio compartido: no requiere reserva.')).toBeInTheDocument();
    const reservar = screen.getAllByRole('button', { name: 'Ver y reservar' });
    expect(reservar).toHaveLength(1);
    expect(reservar[0].closest('article')?.textContent).toContain('Gimnasio');
    const compartida = screen.getByRole('heading', { name: 'Claustro y Jardín Colonial' }).closest('article')!;
    expect(within(compartida).queryByRole('button')).not.toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('group', { name: 'Acceso' })).getByRole('button', { name: 'Con reserva' }));
    expect(await screen.findByRole('heading', { name: 'Gimnasio' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Claustro y Jardín Colonial' })).not.toBeInTheDocument();
  });

  it('un enlace directo a una amenidad compartida no abre un formulario de reserva', async () => {
    tokenStorage.set('qa-token');
    mockApi();
    renderPublicWithProviders(<CatalogoAmenidadesPage />, { route: '/amenidades?recurso=12' });
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Esta amenidad no requiere reserva')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /Confirmar/ })).not.toBeInTheDocument();
  });
});
