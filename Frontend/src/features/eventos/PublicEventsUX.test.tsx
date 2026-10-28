import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderPublicWithProviders, meResponse, jsonResponse } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { tokenStorage } from '@/api/session';
import { ApiError } from '@/api/client/http';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { eventosApi } from './api/eventosApi';
import { SalonDetalleCard } from './components/SalonDetalleCard';
import { CatalogoSalonesList } from './components/CatalogoSalonesList';
import { ReservaEventoModal } from './components/ReservaEventoModal';
import type { ReservaEvento } from './types';

const salon = { id: 11, sucursal_id: 1, nombre: 'Salón QA', capacidad_maxima: 80, tarifa_base: 4500, descripcion: 'Descripción del catálogo.', imagen_url: 'https://example.test/salon.jpg' };
const quote: ReservaEvento = { id: 88, usuario_id: 3, salon_id: 11, tipo_evento: 'ejecutivo', fecha: '2030-11-20', hora_inicio: '10:00:00', hora_fin: '12:00:00', numero_invitados: 1, estado: 'cotizacion', total: 4500, anticipo: 0 };
const wrap = (ui: React.ReactElement, route = '/eventos') => renderPublicWithProviders(<LocaleProvider>{ui}</LocaleProvider>, { route });
async function fillForm() {
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Crear cotización' })).toBeEnabled());
  fireEvent.change(within(dialog).getByLabelText(/^Fecha/), { target: { value: quote.fecha } });
  fireEvent.change(within(dialog).getByLabelText(/^Hora de inicio/), { target: { value: '10:00' } });
  fireEvent.change(within(dialog).getByLabelText(/^Hora de fin/), { target: { value: '12:00' } });
  return dialog.querySelector('form')!;
}
beforeEach(() => {
  vi.restoreAllMocks(); tokenStorage.clear(); sessionStorage.clear(); localStorage.clear(); localStorage.setItem('hunahpu.public-site.v1', 'all');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue([{ id: 1, nombre: 'Sede QA', activa: true, ciudad: null, direccion: null, telefono: null }]);
  vi.spyOn(eventosApi, 'getSalones').mockResolvedValue([salon]);
  vi.spyOn(eventosApi, 'getSalonById').mockResolvedValue(salon);
  vi.spyOn(eventosApi, 'createReserva').mockResolvedValue(quote);
  global.fetch = vi.fn(async (url) => String(url).endsWith('/auth/me') ? meResponse('cliente') : jsonResponse({ data: [] }));
});
afterEach(() => { vi.restoreAllMocks(); tokenStorage.clear(); sessionStorage.clear(); localStorage.clear(); });

describe('UX pública de Eventos', () => {
  it('QA-EVT-UI-001: un identificador inválido muestra error y regreso al catálogo, sin carga perpetua', async () => {
    wrap(<SalonDetalleCard id={0} />, '/eventos/salones/0?q=QA');
    expect(await screen.findByText('Identificador de salón no válido')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a salones' })).toHaveAttribute('href', '/eventos?q=QA');
    expect(eventosApi.getSalonById).not.toHaveBeenCalled();
  });
  it('QA-EVT-UI-002: un fallo de red no se presenta como salón inexistente', async () => {
    vi.mocked(eventosApi.getSalonById).mockRejectedValue(new ApiError(0, 'NETWORK_ERROR'));
    wrap(<SalonDetalleCard id={11} />, '/eventos/salones/11');
    expect(await screen.findByText('No pudimos cargar el salón. Compruebe su conexión e intente consultar de nuevo.')).toBeInTheDocument();
    expect(screen.queryByText('El salón solicitado no existe o no se encuentra disponible.')).not.toBeInTheDocument();
    expect(screen.queryByText('NETWORK_ERROR')).not.toBeInTheDocument();
  });
  it('QA-EVT-UI-003: dos submit en un turno crean una sola cotización', async () => {
    tokenStorage.set('qa-token');
    let complete!: (value: ReservaEvento) => void;
    vi.mocked(eventosApi.createReserva).mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    wrap(<ReservaEventoModal salon={salon} isOpen onClose={vi.fn()} />);
    const form = await fillForm();
    await act(async () => { fireEvent.submit(form); fireEvent.submit(form); });
    await waitFor(() => expect(eventosApi.createReserva).toHaveBeenCalledTimes(1));
    await act(async () => { complete(quote); });
  });
  it('permite explorar sin sesión y buscar por la sede real sin crear solicitudes', async () => {
    wrap(<CatalogoSalonesList />);
    await screen.findByText('Salón QA');
    await userEvent.setup().type(screen.getByRole('searchbox'), 'Sede QA');
    expect(screen.getByRole('heading', { name: 'Salón QA' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver salón' })).toHaveAttribute('href', '/eventos/salones/11?q=Sede+QA&sede=all');
    expect(eventosApi.createReserva).not.toHaveBeenCalled();
    expect(screen.getByRole('img')).toHaveAttribute('src', salon.imagen_url);
  });
  it('conserva filtros al volver del detalle y no publica características o políticas sin fuente', async () => {
    vi.mocked(eventosApi.getSalonById).mockResolvedValue({ ...salon, descripcion: undefined });
    wrap(<SalonDetalleCard id={11} />, '/eventos/salones/11?q=QA&page=2');
    await screen.findByRole('heading', { name: 'Salón QA', level: 1 });
    expect(screen.getByRole('link', { name: 'Volver a salones' })).toHaveAttribute('href', '/eventos?q=QA&page=2');
    expect(screen.getByText('Este salón no tiene una descripción publicada.')).toBeInTheDocument();
    expect(screen.queryByText(/incluido|reembolso|cancelación|catering/i)).not.toBeInTheDocument();
  });
  it('distingue error de carga, catálogo vacío y filtros sin resultados', async () => {
    const view = wrap(<CatalogoSalonesList />, '/eventos?q=NoExiste');
    expect(await screen.findByRole('heading', { name: 'Sin resultados con estos filtros' })).toBeInTheDocument();
    view.unmount(); vi.mocked(eventosApi.getSalones).mockResolvedValue([]);
    const empty = wrap(<CatalogoSalonesList />);
    expect(await screen.findByRole('heading', { name: 'No hay salones en el catálogo.' })).toBeInTheDocument();
    empty.unmount(); vi.mocked(eventosApi.getSalones).mockRejectedValue(new ApiError(500, 'SQL privado'));
    wrap(<CatalogoSalonesList />);
    expect(await screen.findByRole('alert')).not.toHaveTextContent('SQL privado');
    expect(screen.queryByText('No hay salones en el catálogo.')).not.toBeInTheDocument();
  });
  it('permite reintentar una lectura fallida del detalle y diferencia un 404', async () => {
    vi.mocked(eventosApi.getSalonById).mockRejectedValueOnce(new ApiError(0, 'Network')).mockResolvedValueOnce(salon);
    const view = wrap(<SalonDetalleCard id={11} />);
    await screen.findByText(/No pudimos cargar el salón/);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByRole('heading', { name: 'Salón QA', level: 1 });
    view.unmount(); vi.mocked(eventosApi.getSalonById).mockRejectedValue(new ApiError(404, 'Not found'));
    wrap(<SalonDetalleCard id={999} />);
    expect(await screen.findByText('No se encontró este salón')).toBeInTheDocument();
  });
  it('muestra la cotización real sin redirigir, confirmar reserva ni enviar importes', async () => {
    tokenStorage.set('qa-token'); const close = vi.fn();
    wrap(<ReservaEventoModal salon={salon} isOpen onClose={close} />);
    fireEvent.submit(await fillForm());
    expect(await screen.findByRole('heading', { name: 'Cotización registrada' })).toBeInTheDocument();
    const panel = within(screen.getByRole('dialog'));
    expect(panel.getByRole('status')).toHaveTextContent('#88');
    expect(panel.getAllByText('Sede QA').length).toBeGreaterThan(0);
    expect(panel.getByText('10:00:00 – 12:00:00')).toBeInTheDocument();
    expect(panel.getByRole('link', { name: 'Ver mi solicitud' })).toHaveAttribute('href', '/mis-reservas/eventos/88');
    expect(close).not.toHaveBeenCalled();
    expect(eventosApi.createReserva).toHaveBeenCalledWith({ salon_id: 11, tipo_evento: 'ejecutivo', fecha: '2030-11-20', hora_inicio: '10:00', hora_fin: '12:00', numero_invitados: 1 });
  });
  it('expone la validación de capacidad junto al campo y conserva el formulario ante conflicto', async () => {
    tokenStorage.set('qa-token'); wrap(<ReservaEventoModal salon={salon} isOpen onClose={vi.fn()} />);
    const form = await fillForm();
    fireEvent.change(screen.getByLabelText(/^Número estimado de invitados/), { target: { value: '81' } });
    fireEvent.submit(form);
    expect(await screen.findByText('El número de invitados supera la capacidad máxima del salón.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Número estimado de invitados/)).toHaveAttribute('aria-invalid', 'true');
    expect(eventosApi.createReserva).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/^Número estimado de invitados/), { target: { value: '80' } });
    vi.mocked(eventosApi.createReserva).mockRejectedValue(new ApiError(409, 'conflict', { code: 'EVENT_ROOM_NOT_AVAILABLE' }));
    fireEvent.submit(form);
    expect(await screen.findByText(/El salón no está disponible en ese horario/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Hora de inicio/)).toHaveValue('10:00');
    expect(screen.getByLabelText(/^Número estimado de invitados/)).toHaveValue(80);
    expect(eventosApi.createReserva).toHaveBeenCalledTimes(1);
  });
  it('un envío incierto se conserva al reabrir y recupera la solicitud sin otro POST', async () => {
    tokenStorage.set('qa-token');
    vi.mocked(eventosApi.createReserva).mockRejectedValue(new ApiError(0, 'Network'));
    vi.spyOn(eventosApi, 'getReservas').mockResolvedValue([quote]);
    const view = wrap(<ReservaEventoModal salon={salon} isOpen onClose={vi.fn()} />);
    fireEvent.submit(await fillForm());
    await screen.findByText(/No pudimos confirmar el resultado del envío/);
    expect(screen.getByRole('button', { name: 'Crear cotización' })).toBeDisabled();
    view.unmount(); wrap(<ReservaEventoModal salon={salon} isOpen onClose={vi.fn()} />);
    await screen.findByText(/No pudimos confirmar el resultado del envío/);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Comprobar mis solicitudes' }));
    expect(await screen.findByRole('heading', { name: 'Cotización registrada' })).toBeInTheDocument();
    expect(eventosApi.createReserva).toHaveBeenCalledTimes(1);
  });
  it('traduce el detalle y conserva el foco al cerrar por teclado', async () => {
    wrap(<><LanguageSelector /><SalonDetalleCard id={11} /></>, '/eventos/salones/11?q=QA');
    await screen.findByRole('heading', { name: 'Salón QA', level: 1 });
    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    const trigger = screen.getByRole('button', { name: 'Request a quote' });
    await user.click(trigger);
    const panel = screen.getByRole('dialog');
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(within(panel).getByText(/Enter the event type, date, times/)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
