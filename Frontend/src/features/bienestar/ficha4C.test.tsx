import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStorage } from '@/api/session';
import { renderWithProviders, meResponse, jsonResponse } from '@/test/renderWithProviders';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { CatalogoBienestarList } from './components/CatalogoBienestarList';
import { bienestarApi } from './api/bienestarApi';
import type { CitaBienestar } from './types';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { crearCarrito, crearItem } from '@/features/carrito/pantalla-test-utils';
import { ApiError } from '@/api/client/http';
import { LanguageSelector } from '@/i18n/LocaleContext';
import { saveServiceDraft } from '@/features/auth/serviceDraft';
import { createReservaCitaSchema } from './schemas/bienestar.schemas';
import { safeReturnPath } from '@/features/auth/secureReturn';

const servicio = { id: 11, nombre: 'Tratamiento QA', duracion_minutos: 45, precio: '380.50', imagen_url: 'https://example.test/bienestar.jpg' };
const terapeuta = { id: 5, nombre: 'Terapeuta QA', activo: true };
const cita: CitaBienestar = { id: 88, usuario_id: 3, servicio_bienestar_id: 11, terapeuta_id: 5, fecha: '2030-11-20', hora_inicio: '14:30:00', hora_fin: '15:15:00', estado: 'confirmada', ServicioBienestar: { ...servicio, precio: 399.75 }, Terapeuta: terapeuta };
function mount(route = '/bienestar?recurso=11') {
  return renderWithProviders(<LocaleProvider><CatalogoBienestarList /></LocaleProvider>, { route });
}
async function form() {
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Confirmar reserva de cita' })).toBeEnabled());
  await userEvent.setup().selectOptions(within(dialog).getByLabelText(/^Seleccionar terapeuta/), '5');
  fireEvent.change(within(dialog).getByLabelText(/^Fecha/), { target: { value: '2030-11-20' } });
  fireEvent.change(within(dialog).getByLabelText(/^Hora de inicio/), { target: { value: '14:30' } });
  return dialog.querySelector('form')!;
}
beforeEach(() => {
  vi.restoreAllMocks(); sessionStorage.clear(); localStorage.clear(); tokenStorage.set('qa-token');
  vi.spyOn(bienestarApi, 'getServicios').mockResolvedValue([servicio, { id: 12, nombre: 'Otro tratamiento QA', duracion_minutos: 90, precio: 600 }]);
  vi.spyOn(bienestarApi, 'getTerapeutas').mockResolvedValue([terapeuta, { id: 6, nombre: 'Inactivo QA', activo: false }]);
  vi.spyOn(bienestarApi, 'createCita').mockResolvedValue(cita);
  vi.spyOn(bienestarApi, 'getMiCitaById').mockResolvedValue(cita);
  vi.spyOn(bienestarApi, 'getMisCitas').mockResolvedValue([cita]);
  vi.spyOn(carritoApi, 'getOrCreateActiveCart').mockResolvedValue(crearCarrito());
  vi.spyOn(carritoApi, 'addItem').mockResolvedValue(crearItem({ tipo_item: 'bienestar', referencia_id: 88 }));
  global.fetch = vi.fn(async (url) => String(url).endsWith('/auth/me') ? meResponse('cliente') : jsonResponse({ data: [] }));
});
afterEach(() => { vi.restoreAllMocks(); tokenStorage.clear(); sessionStorage.clear(); localStorage.clear(); });

describe('Ficha 4C · Bienestar', () => {
  it('QA-WELL-UI-001: dos submit antes del render siguiente crean una sola cita', async () => {
    let complete!: (value: CitaBienestar) => void;
    vi.mocked(bienestarApi.createCita).mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    mount(); const element = await form();
    await act(async () => { fireEvent.submit(element); fireEvent.submit(element); });
    await waitFor(() => expect(bienestarApi.createCita).toHaveBeenCalledTimes(1));
    await act(async () => { complete(cita); });
    expect(await screen.findByText('Cita #88')).toBeInTheDocument();
  });
  it('QA-WELL-UI-002: la confirmación usa la tarifa devuelta con la cita, aunque cambie el catálogo', async () => {
    mount(); fireEvent.submit(await form());
    await screen.findByText('Cita #88');
    const panel = within(screen.getByRole('dialog'));
    expect(panel.getByText(/Q\s*399\.75/)).toBeInTheDocument();
    expect(panel.queryByText(/Q\s*380\.50/)).not.toBeInTheDocument();
  });
  it('QA-WELL-CART-001: dos clics en el mismo turno añaden la cita al carrito una sola vez', async () => {
    vi.spyOn(carritoApi, 'getOrCreateActiveCart').mockImplementation(() => new Promise(() => {}));
    renderWithProviders(<LocaleProvider><BotonAnadirAlCarrito tipo_item="bienestar" reservaId={88} reservaEstado="confirmada" publicInterface /></LocaleProvider>);
    const button = await screen.findByRole('button', { name: /Añadir al carrito/ });
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    await waitFor(() => expect(carritoApi.getOrCreateActiveCart).toHaveBeenCalledTimes(1));
  });
  it('conserva la referencia tras fallar la adición y reintenta solo el mismo ítem', async () => {
    vi.mocked(carritoApi.addItem).mockRejectedValueOnce(new ApiError(500, 'SQL privado')).mockResolvedValueOnce(crearItem({ tipo_item: 'bienestar', referencia_id: 88 }));
    mount(); fireEvent.submit(await form());
    await screen.findByText('Cita #88');
    expect(carritoApi.addItem).not.toHaveBeenCalled();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Añadir al carrito' }));
    expect(await screen.findByText(/No fue posible añadir la reserva/)).toBeInTheDocument();
    expect(screen.getByText('Cita #88')).toBeInTheDocument();
    expect(screen.queryByText('SQL privado')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Añadir al carrito' }));
    expect(await screen.findByText('Se añadió la reserva al carrito activo.')).toBeInTheDocument();
    expect(bienestarApi.createCita).toHaveBeenCalledTimes(1);
    expect(vi.mocked(carritoApi.addItem).mock.calls).toEqual([[10, { tipo_item: 'bienestar', referencia_id: 88 }], [10, { tipo_item: 'bienestar', referencia_id: 88 }]]);
    expect(screen.getByRole('link', { name: 'Ver carrito' })).toHaveAttribute('href', '/carrito');
  });
  it('recupera la cita por lectura autorizada después de cerrar o recargar sin recrearla', async () => {
    const view = mount(); fireEvent.submit(await form()); await screen.findByText('Cita #88');
    view.unmount(); mount();
    await screen.findByRole('button', { name: 'Añadir al carrito' });
    expect(screen.getByText('Cita #88')).toBeInTheDocument();
    expect(bienestarApi.getMiCitaById).toHaveBeenCalledWith(88);
    expect(bienestarApi.createCita).toHaveBeenCalledTimes(1);
    expect(carritoApi.addItem).not.toHaveBeenCalled();
  });
  it('una adición incierta permite revisar el carrito y conserva la misma cita ante duplicado del servidor', async () => {
    vi.mocked(carritoApi.addItem).mockRejectedValueOnce(new ApiError(0, 'Network error')).mockRejectedValueOnce(new ApiError(409, 'Already exists', { code: 'CART_ITEM_ALREADY_EXISTS' }));
    mount(); fireEvent.submit(await form()); await screen.findByText('Cita #88');
    const user = userEvent.setup(); await user.click(screen.getByRole('button', { name: 'Añadir al carrito' }));
    expect(await screen.findByText(/No pudimos confirmar la adición/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Ver carrito' }).every((link) => link.getAttribute('href') === '/carrito')).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Añadir al carrito' }));
    expect(await screen.findByText(/Esta reserva ya está en su carrito/)).toBeInTheDocument();
    expect(bienestarApi.createCita).toHaveBeenCalledTimes(1);
    expect(carritoApi.addItem).toHaveBeenCalledTimes(2);
    expect(vi.mocked(carritoApi.addItem).mock.calls.every(([, item]) => item.referencia_id === 88 && item.tipo_item === 'bienestar')).toBe(true);
  });
  it('no usa la referencia guardada como prueba de éxito si falla su recuperación', async () => {
    sessionStorage.setItem('hunahpu.wellness-booking.v1.3.11', JSON.stringify({ phase: 'created', id: 88 }));
    vi.mocked(bienestarApi.getMiCitaById).mockRejectedValue(new ApiError(403, 'FORBIDDEN', { code: 'FORBIDDEN' }));
    mount();
    expect(await screen.findByText(/No pudimos recuperar la cita/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Añadir al carrito' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar reserva de cita' })).not.toBeInTheDocument();
    expect(bienestarApi.createCita).not.toHaveBeenCalled();
  });
  it('la cita confirmada muestra estado operativo y no afirma pago ni envía precio/duración', async () => {
    mount(); fireEvent.submit(await form()); await screen.findByText('Cita #88');
    expect(bienestarApi.createCita).toHaveBeenCalledWith({ servicio_bienestar_id: 11, terapeuta_id: 5, fecha: '2030-11-20', hora_inicio: '14:30' });
    expect(screen.getByText(/no acredita un pago/)).toBeInTheDocument();
    expect(screen.getByText('14:30:00 - 15:15:00')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('45 minutos de sesión')).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.some(([url]) => /\/pagos/.test(String(url)))).toBe(false);
  });
  it('requiere un terapeuta real y omite los inactivos y Sin preferencia', async () => {
    mount(); const dialog = await screen.findByRole('dialog');
    await within(dialog).findByRole('option', { name: 'Terapeuta QA' });
    expect(within(dialog).queryByRole('option', { name: 'Inactivo QA' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('option', { name: /Sin preferencia/ })).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/^Hora de inicio/), { target: { value: '14:30' } });
    fireEvent.submit(dialog.querySelector('form')!);
    expect(await within(dialog).findByText('Debe seleccionar un terapeuta')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Seleccionar terapeuta/)).toHaveAttribute('aria-invalid', 'true');
    expect(bienestarApi.createCita).not.toHaveBeenCalled();
  });
  it('rechaza un terapeuta restaurado que ya no está activo sin crear cita', async () => {
    saveServiceDraft('bienestar', 11, { fecha: '2030-11-20', hora_inicio: '14:30', terapeuta_id: 6 });
    mount(); const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Confirmar reserva de cita' })).toBeEnabled());
    fireEvent.submit(dialog.querySelector('form')!);
    expect(await screen.findByText(/se encuentra inactivo actualmente/)).toBeInTheDocument();
    expect(bienestarApi.createCita).not.toHaveBeenCalled();
  });
  it.each([
    ['THERAPIST_BUSY_OR_BUFFER', 409, /descanso de 15 minutos/],
    ['THERAPIST_INACTIVE', 422, /se encuentra inactivo actualmente/],
    ['WELLNESS_SERVICE_NOT_FOUND', 404, /servicio de bienestar solicitado no existe/],
  ] as const)('conserva los datos y muestra %s sin construir otra agenda', async (code, status, message) => {
    vi.mocked(bienestarApi.createCita).mockRejectedValue(new ApiError(status, 'Error controlado', { code }));
    mount(); fireEvent.submit(await form());
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByLabelText(/^Hora de inicio/)).toHaveValue('14:30');
    expect(screen.getByLabelText(/^Seleccionar terapeuta/)).toHaveValue('5');
    expect(screen.getByRole('button', { name: 'Confirmar reserva de cita' })).toBeEnabled();
    expect(bienestarApi.createCita).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
  it('resultado incierto bloquea crear otra cita y recupera la referencia desde Mis citas', async () => {
    vi.mocked(bienestarApi.createCita).mockRejectedValue(new ApiError(0, 'Network error', { code: 'NETWORK_ERROR' }));
    mount(); fireEvent.submit(await form());
    expect(await screen.findByText(/No pudimos confirmar el resultado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar reserva de cita' })).toBeDisabled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Comprobar Mis citas' }));
    expect(await screen.findByText('Cita #88')).toBeInTheDocument();
    expect(bienestarApi.createCita).toHaveBeenCalledTimes(1);
    expect(carritoApi.addItem).not.toHaveBeenCalled();
  });
  it('no ofrece citas si no existen terapeutas activos y permite reintentar su consulta', async () => {
    vi.mocked(bienestarApi.getTerapeutas).mockRejectedValueOnce(new ApiError(500, 'private')).mockResolvedValueOnce([]);
    mount(); await screen.findByText('No se pudieron cargar las opciones. Intente consultarlas de nuevo.');
    expect(screen.getByRole('button', { name: 'Confirmar reserva de cita' })).toBeDisabled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay terapeutas activos en el catálogo para solicitar esta cita.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar reserva de cita' })).toBeDisabled();
    expect(bienestarApi.createCita).not.toHaveBeenCalled();
  });
  it('muestra fotos propias y duraciones reales, filtra sin crear tipos ni beneficios', async () => {
    mount('/bienestar'); await screen.findByText('Tratamiento QA');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bienestar');
    const card = screen.getByText('Tratamiento QA').closest('article')!;
    expect(within(card).getByRole('img')).toHaveAttribute('src', servicio.imagen_url);
    expect(within(card).getByText('45 minutos de sesión')).toBeInTheDocument();
    const duration = screen.getByRole('combobox', { name: 'Duración' });
    expect(within(duration).getAllByRole('option').map((item) => item.textContent)).toEqual(['Todas las duraciones', '45 minutos de sesión', '90 minutos de sesión']);
    await userEvent.setup().selectOptions(duration, '45');
    expect(screen.queryByText('Otro tratamiento QA')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Tipo' })).not.toBeInTheDocument();
    expect(screen.queryByText(/médico|contraindicaci|hidroterapia|certificados/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sedes y contacto' })).toHaveAttribute('href', '/sedes');
  });
  it('catálogo vacío informa de registros ausentes sin prometer próxima apertura', async () => {
    vi.mocked(bienestarApi.getServicios).mockResolvedValue([]);
    mount('/bienestar');
    expect(await screen.findByRole('heading', { name: 'No hay servicios registrados' })).toBeInTheDocument();
    expect(screen.queryByText(/próxima apertura|próximamente|dos horas|reembolso/i)).not.toBeInTheDocument();
  });
  it('traduce formulario, errores y recuperación de carrito; mantiene etiquetas accesibles', async () => {
    vi.mocked(carritoApi.addItem).mockRejectedValue(new ApiError(500, 'private'));
    renderWithProviders(<LocaleProvider><LanguageSelector /><CatalogoBienestarList /></LocaleProvider>, { route: '/bienestar?recurso=11' });
    const element = await form();
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByLabelText('Select therapist')).toHaveValue('5');
    expect(within(dialog).getByLabelText('Start time (24-hour format, e.g. 10:00)')).toHaveValue('14:30');
    fireEvent.submit(element);
    await screen.findByText('Appointment #88');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByText(/The reservation could not be added/)).toBeInTheDocument();
    expect(screen.getByText(/does not prove payment/)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Locations and contact' })).toHaveAttribute('href', '/sedes');
  });
  it('conserva el filtro de duración en el retorno seguro del login', () => {
    expect(safeReturnPath('/bienestar?duracion=45&q=QA&recurso=11&token=secret')).toBe('/bienestar?duracion=45&q=QA&recurso=11');
    expect(safeReturnPath('/bienestar?duracion=-1')).toBe('/bienestar');
  });
});

describe('Contrato de fecha y hora de Bienestar', () => {
  it.each(['24:00', '12:60', '09:00:60', '9:00'])('rechaza la hora inválida %s', (hora_inicio) => {
    expect(createReservaCitaSchema().safeParse({ servicio_bienestar_id: 11, terapeuta_id: 5, fecha: '2030-11-20', hora_inicio }).success).toBe(false);
  });
  it('valida calendario y acepta una hora válida sin calcular fin, descanso ni franjas', () => {
    const input = { servicio_bienestar_id: 11, terapeuta_id: 5, fecha: '2030-11-20', hora_inicio: '23:59' };
    expect(createReservaCitaSchema().safeParse(input).success).toBe(true);
    expect(createReservaCitaSchema().safeParse({ ...input, fecha: '2030-02-30' }).success).toBe(false);
  });
});
