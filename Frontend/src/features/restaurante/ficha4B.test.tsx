import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { tokenStorage } from '@/api/session';
import { renderPublicWithProviders, jsonResponse, meResponse, errorResponse } from '@/test/renderWithProviders';
import { CatalogoRestauranteCliente } from './components/CatalogoRestauranteCliente';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { validateMesaReservation } from './reservationValidation';
import { saveServiceDraft } from '@/features/auth/serviceDraft';

const mesas = [
  { id: 11, zona: 'Terraza', capacidad: 4, sucursal_id: 1, estado: 'disponible' },
  { id: 12, zona: 'Terraza', capacidad: 2, sucursal_id: 1, estado: 'ocupada' },
  { id: 21, zona: 'Jardín', capacidad: 6, sucursal_id: 2, estado: 'mantenimiento' },
];
const sites = [1, 2].map((id) => ({ id, nombre: `Sede ${id}`, activa: true, imagen_url: 'https://example.test/habitacion.jpg' }));
const reserva = { id: 88, usuario_id: 3, mesa_id: 11, fecha: '2030-11-20', hora: '14:30:00', numero_comensales: 1, estado: 'confirmada' };
let post: () => Promise<Response>;
let own: () => Promise<Response>;
function mount(route = '/restaurante?recurso=11') {
  return renderPublicWithProviders(<LocaleProvider><CatalogoRestauranteCliente /></LocaleProvider>, { route });
}
async function form() {
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Confirmar reserva' })).toBeEnabled());
  fireEvent.change(within(dialog).getByLabelText(/^Fecha/), { target: { value: reserva.fecha } });
  fireEvent.change(within(dialog).getByLabelText(/^Horario/), { target: { value: '14:30' } });
  return dialog.querySelector('form')!;
}
const posts = () => vi.mocked(fetch).mock.calls.filter(([url, config]) => String(url).endsWith('/reservas-mesa') && config?.method === 'POST');
beforeEach(() => {
  vi.restoreAllMocks(); sessionStorage.clear(); localStorage.clear(); tokenStorage.set('qa-token');
  localStorage.setItem('hunahpu.public-site.v1', 'all');
  post = async () => jsonResponse({ data: reserva }, 201);
  own = async () => jsonResponse({ data: [reserva] });
  global.fetch = vi.fn(async (url, config) => {
    const path = String(url);
    if (path.endsWith('/auth/me')) return meResponse('cliente');
    if (path.endsWith('/sucursales')) return jsonResponse({ data: sites });
    if (path.endsWith('/mesas')) return jsonResponse({ data: mesas });
    if (path.endsWith('/reservas-mesa') && config?.method === 'POST') return post();
    if (path.endsWith('/reservas-mesa/mis-reservas')) return own();
    throw new Error(`Unexpected request: ${path}`);
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); tokenStorage.clear(); sessionStorage.clear(); localStorage.clear(); });

describe('Ficha 4B · reserva de una mesa real', () => {
  it('QA-REST-UI-001: ante pérdida de red bloquea otro envío y ofrece consultar reservas propias', async () => {
    post = async () => { throw new TypeError('Network failed'); };
    mount(); fireEvent.submit(await form());
    expect(await screen.findByText(/No pudimos confirmar el resultado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeDisabled();
    expect(screen.getByRole('link', { name: /Ir a Mis Reservas/ })).toHaveAttribute('href', '/mis-reservas/restaurante');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Comprobar Mis reservas' }));
    expect(await screen.findByText('#88')).toBeInTheDocument();
    expect(posts()).toHaveLength(1);
  });
  it('QA-REST-UI-002: dos submit en el mismo turno producen una sola creación', async () => {
    let finish!: (value: Response) => void;
    post = () => new Promise((resolve) => { finish = resolve; });
    mount(); const element = await form();
    act(() => { fireEvent.submit(element); fireEvent.submit(element); });
    await waitFor(() => expect(posts()).toHaveLength(1));
    await act(async () => { finish(jsonResponse({ data: reserva }, 201)); });
    expect(await screen.findByText('#88')).toBeInTheDocument();
  });
  it('recupera el intento incierto al recargar, sin POST ni consulta automática', async () => {
    post = async () => { throw new TypeError('Network failed'); };
    const view = mount(); fireEvent.submit(await form());
    await screen.findByText(/No pudimos confirmar el resultado/);
    view.unmount(); mount();
    expect(await screen.findByText(/No pudimos confirmar el resultado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeDisabled();
    expect(posts()).toHaveLength(1);
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/mis-reservas'))).toBe(false);
  });
  it('mantiene bloqueado el envío si falla la comprobación de reservas propias', async () => {
    post = async () => errorResponse(503, 'INTERNAL_ERROR', 'SQL privado');
    own = async () => { throw new TypeError('Network failed'); };
    mount(); fireEvent.submit(await form());
    await screen.findByText(/No pudimos confirmar el resultado/);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Comprobar Mis reservas' }));
    expect(await screen.findByText(/No fue posible consultar sus reservas/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeDisabled();
    expect(screen.queryByText(/SQL privado/)).not.toBeInTheDocument();
    expect(posts()).toHaveLength(1);
  });
  it('una consulta sin coincidencias requiere preparar y confirmar otro envío expresamente', async () => {
    post = async () => { throw new TypeError('Network failed'); };
    own = async () => jsonResponse({ data: [{ ...reserva, mesa_id: 12 }, { ...reserva, estado: 'cancelada' }, { ...reserva, hora: '15:00:00' }] });
    mount(); fireEvent.submit(await form());
    await screen.findByText(/No pudimos confirmar el resultado/);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Comprobar Mis reservas' }));
    await screen.findByText(/Esta consulta no encontró/);
    expect(posts()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeDisabled();
    await userEvent.setup().click(screen.getByRole('button', { name: /He revisado mis reservas/ }));
    expect(posts()).toHaveLength(1);
    post = async () => jsonResponse({ data: reserva }, 201);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Confirmar reserva' }));
    expect(await screen.findByText('#88')).toBeInTheDocument();
    expect(posts()).toHaveLength(2);
  });
  it('conflicto puntual conserva campos y permite cambiar la hora sin ofrecer disponibilidad inventada', async () => {
    post = async () => errorResponse(409, 'TABLE_UNAVAILABLE', 'Ya reservada');
    mount(); const element = await form(); fireEvent.submit(element);
    await screen.findByText(/La mesa ya se encuentra reservada para esa fecha y hora/);
    expect(screen.getByLabelText(/^Fecha/)).toHaveValue(reserva.fecha);
    expect(screen.getByLabelText(/^Horario/)).toHaveValue('14:30');
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeEnabled();
    expect(screen.getByText(/No tenemos otros horarios verificados/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Horario/), { target: { value: '14:31' } });
    post = async () => jsonResponse({ data: { ...reserva, hora: '14:31:00' } }, 201);
    fireEvent.submit(element);
    expect(await screen.findByText('#88')).toBeInTheDocument();
    expect(screen.getByText('14:31:00')).toBeInTheDocument();
    expect(posts()).toHaveLength(2);
  });
  it.each([
    ['TABLE_CAPACITY_EXCEEDED', 422, /excede la capacidad/],
    ['TABLE_IN_MAINTENANCE', 409, /se encuentra en mantenimiento/],
    ['TABLE_RESERVATION_DATE_IN_PAST', 422, /fecha de la reserva no puede estar en el pasado/],
    ['TABLE_RESERVATION_TIME_IN_PAST', 422, /hora de la reserva no puede estar en el pasado/],
  ] as const)('muestra el error controlado %s y no reintenta la creación', async (code, status, message) => {
    post = async () => errorResponse(status, code, 'Error del servidor');
    mount(); fireEvent.submit(await form());
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(posts()).toHaveLength(1);
  });
  it('envía únicamente el contrato de la mesa elegida y muestra referencia, sede, fecha, hora y comensales reales', async () => {
    mount(); fireEvent.submit(await form());
    const reference = await screen.findByText('#88');
    const dialog = within(reference.closest('[role="dialog"]')! as HTMLElement);
    expect(JSON.parse(posts()[0][1]!.body as string)).toEqual({ mesa_id: 11, fecha: reserva.fecha, hora: '14:30', numero_comensales: 1 });
    expect(dialog.getAllByText('Sede 1').length).toBeGreaterThan(0);
    expect(dialog.getByText('20 nov 2030')).toBeInTheDocument();
    expect(dialog.getByText('14:30:00')).toBeInTheDocument();
    expect(dialog.getByText('1 persona')).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Ver detalle de la reserva' })).toBeInTheDocument();
    expect(dialog.queryByText(/gratis|anticipo|15 minutos|menos de un minuto/i)).not.toBeInTheDocument();
    expect(sessionStorage.getItem('hunahpu.service-draft.v1.restaurante.11')).toBeNull();
  });
  it('el grupo no puede superar una sola mesa ni usar capacidades sumadas', async () => {
    saveServiceDraft('restaurante', 11, { fecha: reserva.fecha, hora: '14:30', comensales: 5 });
    mount(); const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Confirmar reserva' })).toBeEnabled());
    const diners = within(dialog).getByLabelText(/Número de comensales/);
    expect(within(diners).getAllByRole('option').map((option) => (option as HTMLOptionElement).value)).toEqual(['1', '2', '3', '4']);
    fireEvent.submit(dialog.querySelector('form')!);
    expect(await screen.findByText(/excede la capacidad/)).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });
  it('identifica mesa y sede con Todas las sedes; muestra zonas reales y omite imágenes ajenas, menú y notas', async () => {
    mount('/restaurante');
    await screen.findByText('Mesa #11');
    const articles = screen.getAllByRole('article');
    expect(within(articles[0]).getByText('Sede 1')).toBeInTheDocument();
    expect(within(articles[1]).getByText('Mesa #12')).toBeInTheDocument();
    expect(within(articles[1]).getByRole('button', { name: 'Ver y reservar' })).toBeEnabled();
    expect(within(articles[2]).getByRole('button', { name: 'En mantenimiento' })).toBeDisabled();
    expect(document.querySelector('img')).toBeNull();
    expect(screen.queryByRole('link', { name: /Ver menú/i })).not.toBeInTheDocument();
    await userEvent.setup().click(within(articles[1]).getByRole('button', { name: 'Ver y reservar' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('option', { name: /Sin preferencia/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(dialog).getByText(/Mesa #12 —/)).toBeInTheDocument();
  });
  it('solo usa la fotografía de restaurante devuelta para la sede de esa mesa', async () => {
    const fetchMock = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation((url, config) => String(url).endsWith('/sucursales') ? Promise.resolve(jsonResponse({ data: sites.map((site) => ({ ...site, restaurante_imagen_url: `https://example.test/restaurante-${site.id}.jpg` })) })) : fetchMock(url, config));
    mount('/restaurante'); await screen.findByText('Mesa #11');
    const articles = screen.getAllByRole('article');
    expect(within(articles[0]).getByRole('img')).toHaveAttribute('src', 'https://example.test/restaurante-1.jpg');
    expect(within(articles[2]).getByRole('img')).toHaveAttribute('src', 'https://example.test/restaurante-2.jpg');
  });
  it('distingue catálogo sin mesas de filtros sin resultados', async () => {
    const view = mount('/restaurante?q=NoExiste');
    expect(await screen.findByRole('heading', { name: 'Sin resultados con estos filtros' })).toBeInTheDocument();
    view.unmount();
    const fetchMock = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation((url, config) => String(url).endsWith('/mesas') ? Promise.resolve(jsonResponse({ data: [] })) : fetchMock(url, config));
    mount('/restaurante');
    expect(await screen.findByRole('heading', { name: 'No hay mesas registradas' })).toBeInTheDocument();
    expect(screen.queryByText(/La mesa ya se encuentra reservada/)).not.toBeInTheDocument();
  });
  it('no permite confirmar a un usuario administrativo ni ofrece asignación automática', async () => {
    const fetchMock = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation((url, config) => String(url).endsWith('/auth/me') ? Promise.resolve(meResponse('admin')) : fetchMock(url, config));
    mount(); const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Esta reserva requiere una cuenta de cliente.')).toBeInTheDocument();
    fireEvent.submit(dialog.querySelector('form')!);
    expect(posts()).toHaveLength(0);
  });
  it('rechaza respuesta de éxito incompleta como resultado incierto', async () => {
    post = async () => jsonResponse({ data: {} }, 201);
    mount(); fireEvent.submit(await form());
    expect(await screen.findByText(/No pudimos confirmar el resultado/)).toBeInTheDocument();
    expect(screen.queryByText('#88')).not.toBeInTheDocument();
    expect(posts()).toHaveLength(1);
  });
});

describe('Validación puntual de restaurante', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2030-11-20T20:30:30Z')); });
  it.each([
    [{ fecha: '2030-02-30' }, 'errorFechaInvalida'],
    [{ hora: '24:00' }, 'errorHoraInvalida'],
    [{ hora: '' }, 'errorHoraInvalida'],
    [{ numero_comensales: 0 }, 'errorComensalesInvalidos'],
    [{ numero_comensales: 1.5 }, 'errorComensalesInvalidos'],
    [{ numero_comensales: NaN }, 'errorComensalesInvalidos'],
    [{ numero_comensales: 5 }, 'errorCapacidad'],
    [{ fecha: '2030-11-19' }, 'errorFechaPasada'],
    [{ hora: '14:30' }, 'errorHoraPasada'],
    [{ hora: '14:30:29' }, 'errorHoraPasada'],
    [{ hora: '14:30:30' }, null],
    [{ hora: '14:31' }, null],
    [{ fecha: '2030-11-21', hora: '00:00', numero_comensales: 4 }, null],
  ] as const)('valida %j según el contrato, sin intervalos', (changes, error) => {
    expect(validateMesaReservation({ fecha: reserva.fecha, hora: '15:00', numero_comensales: 1, ...changes }, 4)).toBe(error);
  });
});
