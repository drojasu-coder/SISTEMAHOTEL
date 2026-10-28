import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderPublicWithProviders, jsonResponse, meResponse } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { tokenStorage } from '@/api/session';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { bienestarApi } from '@/features/bienestar/api/bienestarApi';
import { CatalogoBienestarList } from '@/features/bienestar/components/CatalogoBienestarList';
import { eventosApi } from '@/features/eventos/api/eventosApi';
import { CatalogoSalonesList } from '@/features/eventos/components/CatalogoSalonesList';
import { SalonDetalleCard } from '@/features/eventos/components/SalonDetalleCard';
import { ReservaConfirmadaCard } from '@/features/crear-reserva/components/ReservaConfirmadaCard';

const sites = [
  { id: 1, nombre: 'Sede Antigua', activa: true, ciudad: null, direccion: null, telefono: null },
  { id: 4, nombre: 'Sede Capital', activa: true, ciudad: null, direccion: null, telefono: null },
];
const service = { id: 11, nombre: 'Tratamiento Antigua', sucursal_id: 1, duracion_minutos: 60, precio: '400.00' };
const venues = [
  { id: 11, sucursal_id: 1, nombre: 'Salón Claro', capacidad_maxima: 80, tarifa_base: 4500, descripcion: 'Espacio con luz natural.' },
  { id: 12, sucursal_id: 4, nombre: 'Salón Jardín', capacidad_maxima: 40, tarifa_base: 2500, descripcion: 'Espacio al aire libre.' },
];
const reservation = {
  id: 88, usuario_id: 3, habitacion_id: 19, fecha_entrada: '2030-11-20', fecha_salida: '2030-11-23', numero_huespedes: 2,
  total: '3750.00', estado: 'pendiente' as const,
  createdAt: '2030-11-01T12:00:00.000Z', updatedAt: '2030-11-01T12:00:00.000Z',
  Habitacion: { id: 19, numero: 'ANT-019', sucursal_id: 1, tipo_habitacion_id: 7, estado: 'disponible' as const,
    Sucursal: { id: 1, nombre: 'Sede Antigua' },
    TipoHabitacion: { id: 7, nombre: 'ANT-DELUXE-KING', nombre_comercial: 'Deluxe King', tarifa_noche: '1250.00', capacidad_maxima: 2 } },
};
const mount = (ui: React.ReactElement, route: string) => renderPublicWithProviders(<LocaleProvider>{ui}</LocaleProvider>, { route });
beforeEach(() => {
  vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); tokenStorage.clear();
  localStorage.setItem('hunahpu.public-site.v1', 'all');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue(sites);
  vi.spyOn(bienestarApi, 'getServicios').mockResolvedValue([service, { ...service, id: 12, nombre: 'Tratamiento Capital', sucursal_id: 4 }]);
  vi.spyOn(bienestarApi, 'getTerapeutas').mockResolvedValue([
    { id: 5, nombre: 'Profesional Antigua', activo: true, sucursal_id: 1 },
    { id: 6, nombre: 'Profesional Capital', activo: true, sucursal_id: 4 },
    { id: 7, nombre: 'Profesional inactivo', activo: false, sucursal_id: 1 },
  ]);
  vi.spyOn(bienestarApi, 'createCita').mockRejectedValue(new Error('No enviar en esta prueba'));
  vi.spyOn(eventosApi, 'getSalones').mockResolvedValue(venues);
  vi.spyOn(eventosApi, 'getSalonById').mockResolvedValue(venues[0]);
  vi.spyOn(eventosApi, 'createReserva').mockRejectedValue(new Error('No enviar en esta prueba'));
  global.fetch = vi.fn(async url => String(url).endsWith('/auth/me') ? meResponse('cliente') : jsonResponse({ data: [] }));
});
afterEach(() => { vi.restoreAllMocks(); tokenStorage.clear(); sessionStorage.clear(); localStorage.clear(); });

describe('Cierre comercial · Bienestar', () => {
  it('identifica la sede real del tratamiento en el formulario anónimo y restringe sus terapeutas', async () => {
    mount(<CatalogoBienestarList />, '/bienestar?recurso=11');
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Sede Antigua')).toBeInTheDocument();
    expect(within(dialog).queryByText(/Catálogo general/)).not.toBeInTheDocument();
    const therapist = within(dialog).getByLabelText(/^Seleccionar terapeuta/);
    await within(therapist).findByRole('option', { name: 'Profesional Antigua' });
    expect(within(therapist).queryByRole('option', { name: /Capital|inactivo|Sin preferencia/ })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Confirmar reserva de cita' })).toBeDisabled();
    expect(bienestarApi.createCita).not.toHaveBeenCalled();
  });
  it('respeta la sede explícita del enlace mediante confirmación y conserva los filtros', async () => {
    localStorage.setItem('hunahpu.public-site.v1', '1');
    mount(<CatalogoBienestarList />, '/bienestar?sede=4&duracion=60');
    const apply = await screen.findByRole('button', { name: /Aplicar sede del enlace/ });
    await userEvent.setup().click(apply);
    await screen.findByRole('heading', { name: 'Tratamiento Capital' });
    expect(screen.queryByRole('heading', { name: 'Tratamiento Antigua' })).not.toBeInTheDocument();
    expect(localStorage.getItem('hunahpu.public-site.v1')).toBe('4');
  });
  it('anuncia falta de terapeutas para la sede seleccionada aunque otra sede sí tenga profesionales', async () => {
    localStorage.setItem('hunahpu.public-site.v1', '1');
    vi.mocked(bienestarApi.getTerapeutas).mockResolvedValue([{ id: 6, nombre: 'Profesional Capital', activo: true, sucursal_id: 4 }]);
    mount(<CatalogoBienestarList />, '/bienestar');
    expect(await screen.findByText('Las citas en línea no están disponibles en este momento')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tratamiento Antigua' })).toBeInTheDocument();
  });
});

describe('Cierre comercial · Eventos', () => {
  it('encuentra nombres sin exigir tildes al escribir la búsqueda', async () => {
    mount(<CatalogoSalonesList />, '/eventos?q=salon');
    expect(await screen.findByRole('heading', { name: 'Salón Claro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Salón Jardín' })).toBeInTheDocument();
  });
  it('filtra por aforo real y conserva el filtro al visitar y regresar del detalle', async () => {
    mount(<Routes><Route path="/eventos" element={<CatalogoSalonesList />} /><Route path="/eventos/salones/:id" element={<SalonDetalleCard id={11} />} /></Routes>, '/eventos');
    const user = userEvent.setup();
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Capacidad mínima' }), '80');
    expect(screen.getByRole('heading', { name: 'Salón Claro' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Salón Jardín' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Ver salón' }));
    const back = await screen.findByRole('link', { name: 'Volver a salones' });
    expect(back.getAttribute('href')).toContain('capacidad=80');
    await user.click(back);
    expect(await screen.findByRole('combobox', { name: 'Capacidad mínima' })).toHaveValue('80');
  });
  it('el acceso anónimo describe una solicitud de cotización y no una confirmación de reserva', async () => {
    mount(<CatalogoSalonesList />, '/eventos?recurso=11');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Inicie sesión para enviar su solicitud de cotización. Sus datos se conservan.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Crear cotización' })).toBeDisabled();
    expect(eventosApi.createReserva).not.toHaveBeenCalled();
  });
});

describe('Cierre comercial · confirmación de habitación', () => {
  it('muestra sede y nombre comercial con referencia, estado y estancia sin el número físico', async () => {
    mount(<ReservaConfirmadaCard reserva={reservation} onReset={vi.fn()} />, '/reservar');
    expect(within(screen.getByText('#88').closest('.surface') as HTMLElement).getByText('Sede Antigua')).toBeInTheDocument();
    expect(screen.getByText('Deluxe King')).toBeInTheDocument();
    expect(screen.getByText('#88')).toBeInTheDocument();
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('ANT-019');
    expect(document.body).not.toHaveTextContent('ANT-DELUXE-KING');
    expect(screen.getByRole('link', { name: 'Ver detalle de esta reserva' })).toHaveAttribute('href', '/mis-reservas/88');
  });
  it('conserva el nombre del tipo existente cuando no hay nombre comercial y no inventa sede', () => {
    const data = { ...reservation, Habitacion: { ...reservation.Habitacion, Sucursal: undefined, TipoHabitacion: { ...reservation.Habitacion.TipoHabitacion, nombre_comercial: null, nombre: 'Suite publicada' } } };
    mount(<ReservaConfirmadaCard reserva={data} onReset={vi.fn()} />, '/reservar');
    expect(screen.getByText('Suite publicada')).toBeInTheDocument();
    expect(within(screen.getByText('#88').closest('.surface') as HTMLElement).queryByText('Sede Antigua')).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/undefined|null|ANT-019/);
  });
  it('traduce la confirmación conservando los nombres publicados y sus acciones', async () => {
    mount(<><LanguageSelector /><ReservaConfirmadaCard reserva={reservation} onReset={vi.fn()} /></>, '/reservar');
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByText('Deluxe King')).toBeInTheDocument();
    expect(within(screen.getByText('#88').closest('.surface') as HTMLElement).getByText('Sede Antigua')).toBeInTheDocument();
    expect(screen.getByText('2 guests')).toBeInTheDocument();
  });
});
