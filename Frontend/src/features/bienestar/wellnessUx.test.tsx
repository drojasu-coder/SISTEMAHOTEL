import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStorage } from '@/api/session';
import { renderWithProviders, meResponse, jsonResponse } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { CatalogoBienestarList } from './components/CatalogoBienestarList';
import { bienestarApi } from './api/bienestarApi';
import { createReservaCitaSchema, isPastWellnessStart } from './schemas/bienestar.schemas';

const servicio = { id: 11, nombre: 'Tratamiento QA', duracion_minutos: 45, precio: '380.50', imagen_url: 'https://example.test/bienestar.jpg' };
const terapeuta = { id: 5, nombre: 'Terapeuta QA', activo: true };

function mount(route = '/bienestar?recurso=11', withLanguage = false) {
  return renderWithProviders(<LocaleProvider>{withLanguage && <LanguageSelector />}<CatalogoBienestarList /></LocaleProvider>, { route });
}

beforeEach(() => {
  vi.restoreAllMocks(); sessionStorage.clear(); localStorage.clear(); tokenStorage.set('qa-token');
  vi.spyOn(bienestarApi, 'getServicios').mockResolvedValue([servicio]);
  vi.spyOn(bienestarApi, 'getTerapeutas').mockResolvedValue([terapeuta]);
  vi.spyOn(bienestarApi, 'createCita').mockRejectedValue(new Error('no debe llamarse'));
  global.fetch = vi.fn(async (url) => String(url).endsWith('/auth/me') ? meResponse('cliente') : jsonResponse({ data: [] }));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); tokenStorage.clear(); sessionStorage.clear(); localStorage.clear(); });

describe('Bienestar · fecha y hora pasadas (el servidor no las rechaza)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-06-15T18:00:00Z')); // 12:00 en Guatemala (UTC-6)
  });
  it('compara con la fecha y hora actuales de Guatemala', () => {
    expect(isPastWellnessStart('2030-06-14', '23:00')).toBe(true);
    expect(isPastWellnessStart('2030-06-15', '11:59')).toBe(true);
    expect(isPastWellnessStart('2030-06-15', '12:00:00')).toBe(false);
    expect(isPastWellnessStart('2030-06-16', '08:00')).toBe(false);
  });
  it('el esquema marca la hora de inicio con el mensaje recibido', () => {
    const result = createReservaCitaSchema(undefined, 'pasado').safeParse({ servicio_bienestar_id: 11, terapeuta_id: 5, fecha: '2030-06-15', hora_inicio: '09:00' });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([expect.objectContaining({ path: ['hora_inicio'], message: 'pasado' })]);
  });
});

describe('Bienestar · formulario de cita', () => {
  async function dialogReady() {
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Confirmar reserva de cita' })).toBeEnabled());
    return dialog;
  }

  it('no envía una cita en el pasado y explica el motivo junto a la hora', async () => {
    mount();
    const dialog = await dialogReady();
    await userEvent.setup().selectOptions(within(dialog).getByLabelText(/^Seleccionar terapeuta/), '5');
    fireEvent.change(within(dialog).getByLabelText(/^Fecha/), { target: { value: '2020-01-10' } });
    fireEvent.change(within(dialog).getByLabelText(/^Hora de inicio/), { target: { value: '10:00' } });
    fireEvent.submit(dialog.querySelector('form')!);
    expect(await within(dialog).findByText('La fecha y hora de la cita no pueden ser anteriores al momento actual en Guatemala.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Hora de inicio/)).toHaveValue('10:00');
    expect(bienestarApi.createCita).not.toHaveBeenCalled();
  });

  it('el resumen identifica el servicio y no muestra «undefined» si falta la duración', async () => {
    vi.mocked(bienestarApi.getServicios).mockResolvedValue([{ ...servicio, duracion_minutos: undefined }]);
    mount();
    const dialog = await dialogReady();
    expect(within(dialog).getByText('Servicio seleccionado')).toBeInTheDocument();
    expect(within(dialog).getByText('Duración no informada')).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/undefined/);
  });

  it('traduce el error de fecha pasada al cambiar a inglés sin borrar los campos', async () => {
    mount('/bienestar?recurso=11', true);
    const dialog = await dialogReady();
    await userEvent.setup().selectOptions(within(dialog).getByLabelText(/^Seleccionar terapeuta/), '5');
    fireEvent.change(within(dialog).getByLabelText(/^Fecha/), { target: { value: '2020-01-10' } });
    fireEvent.change(within(dialog).getByLabelText(/^Hora de inicio/), { target: { value: '10:00' } });
    fireEvent.submit(dialog.querySelector('form')!);
    await within(dialog).findByText(/anteriores al momento actual/);
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(await within(dialog).findByText('The appointment date and time cannot be earlier than the current time in Guatemala.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Start time/)).toHaveValue('10:00');
  });
});

describe('Bienestar · sin terapeutas activos', () => {
  beforeEach(() => { vi.mocked(bienestarApi.getTerapeutas).mockResolvedValue([{ id: 6, nombre: 'Inactivo QA', activo: false }]); });

  it('el catálogo lo anuncia una vez y sigue mostrando los servicios reales', async () => {
    mount('/bienestar');
    expect(await screen.findByText('Las citas en línea no están disponibles en este momento')).toBeInTheDocument();
    expect(screen.getByText('Tratamiento QA')).toBeInTheDocument();
    expect(screen.queryByText(/próximamente|próxima apertura/i)).not.toBeInTheDocument();
  });

  it('el formulario no invita a rellenar campos que no se pueden enviar', async () => {
    mount();
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('No hay terapeutas activos en el catálogo para solicitar esta cita.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Seleccionar terapeuta/)).toBeDisabled();
    expect(within(dialog).getByLabelText(/^Fecha/)).toBeDisabled();
    expect(within(dialog).getByLabelText(/^Hora de inicio/)).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Confirmar reserva de cita' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  it('un error al consultar terapeutas no se presenta como falta de terapeutas', async () => {
    vi.mocked(bienestarApi.getTerapeutas).mockRejectedValue(new Error('offline'));
    mount('/bienestar');
    await screen.findByText('Tratamiento QA');
    expect(screen.queryByText('Las citas en línea no están disponibles en este momento')).not.toBeInTheDocument();
  });
});

describe('Bienestar · terapeutas por sede', () => {
  it('el formulario solo ofrece terapeutas de la sede del servicio', async () => {
    vi.mocked(bienestarApi.getServicios).mockResolvedValue([{ ...servicio, sucursal_id: 1 }]);
    vi.mocked(bienestarApi.getTerapeutas).mockResolvedValue([
      { id: 5, nombre: 'Terapeuta Antigua QA', activo: true, sucursal_id: 1 },
      { id: 6, nombre: 'Terapeuta Capital QA', activo: true, sucursal_id: 4 },
    ]);
    mount();
    const dialog = await screen.findByRole('dialog');
    const select = await within(dialog).findByLabelText(/^Seleccionar terapeuta/);
    await waitFor(() => expect(within(select).getByRole('option', { name: 'Terapeuta Antigua QA' })).toBeInTheDocument());
    expect(within(select).queryByRole('option', { name: 'Terapeuta Capital QA' })).not.toBeInTheDocument();
  });

  it('sin terapeutas en la sede del servicio no invita a reservar', async () => {
    vi.mocked(bienestarApi.getServicios).mockResolvedValue([{ ...servicio, sucursal_id: 2 }]);
    vi.mocked(bienestarApi.getTerapeutas).mockResolvedValue([{ id: 6, nombre: 'Terapeuta Capital QA', activo: true, sucursal_id: 4 }]);
    mount();
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('No hay terapeutas activos en el catálogo para solicitar esta cita.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Confirmar reserva de cita' })).toBeDisabled();
  });
});
