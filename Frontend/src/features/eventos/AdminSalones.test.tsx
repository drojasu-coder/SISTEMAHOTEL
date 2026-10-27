import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { tokenStorage } from '@/api/session';
import { AdminSalonesPage } from '@/pages/AdminSalonesPage';
import {
  errorResponse,
  jsonResponse,
  meResponse,
  renderWithProviders,
} from '@/test/renderWithProviders';

interface FetchCall {
  url: string;
  method: string;
  body: unknown;
}

const sucursales = [
  { id: 42, nombre: 'Hotel Hunapú Centro Histórico', direccion: 'Zona 1', ciudad: 'Guatemala', telefono: '22223333', activa: true },
  { id: 77, nombre: 'Hotel Hunapú Antigua', direccion: '5a Avenida Norte', ciudad: 'Antigua Guatemala', telefono: '78320001', activa: true },
];

const salonCentro = {
  id: 501,
  sucursal_id: 42,
  nombre: 'Salón Jade',
  capacidad_maxima: 120,
  tarifa_base: '3750.50',
  descripcion: 'Salón de pruebas del Centro Histórico',
  // Forma serializada por la asociación Sequelize del HTTP real.
  Sucursal: { id: 42, nombre: 'Hotel Hunapú Centro Histórico', ciudad: 'Guatemala', activa: true },
};

const salonAntigua = {
  id: 502,
  sucursal_id: 77,
  nombre: 'Salón Obsidiana',
  capacidad_maxima: 80,
  tarifa_base: '2900.00',
  descripcion: 'Segundo salón que no debe eliminarse',
  Sucursal: { id: 77, nombre: 'Hotel Hunapú Antigua', ciudad: 'Antigua Guatemala', activa: true },
};

interface MockApiOptions {
  getSalones?: () => unknown[];
  sucursalesError?: Response;
  postSalon?: (body: unknown) => Response | Promise<Response>;
  patchSalon?: (id: number, body: unknown) => Response | Promise<Response>;
  deleteSalon?: (id: number) => Response | Promise<Response>;
}

function installApi(options: MockApiOptions = {}) {
  const calls: FetchCall[] = [];

  global.fetch = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });

    if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
    if (url.endsWith('/sucursales') && method === 'GET') {
      if (options.sucursalesError) return Promise.resolve(options.sucursalesError);
      return Promise.resolve(jsonResponse({ status: 'success', data: sucursales }));
    }
    if (url.endsWith('/salones') && method === 'GET') {
      return Promise.resolve(jsonResponse({
        success: true,
        statusCode: 200,
        data: options.getSalones?.() ?? [salonCentro],
      }));
    }
    if (url.endsWith('/salones') && method === 'POST') {
      return options.postSalon?.(body) ?? Promise.resolve(jsonResponse({
        success: true,
        statusCode: 201,
        data: { id: 900, ...(body as object) },
      }, 201));
    }

    const salonMatch = url.match(/\/salones\/(\d+)$/);
    if (salonMatch && method === 'PATCH') {
      const id = Number(salonMatch[1]);
      return options.patchSalon?.(id, body) ?? Promise.resolve(jsonResponse({
        success: true,
        statusCode: 200,
        data: { ...salonCentro, ...(body as object) },
      }));
    }
    if (salonMatch && method === 'DELETE') {
      const id = Number(salonMatch[1]);
      return options.deleteSalon?.(id) ?? Promise.resolve(jsonResponse(null, 204));
    }
    return Promise.reject(new Error(`Petición no simulada: ${method} ${url}`));
  });

  return calls;
}

function mutationCalls(calls: FetchCall[], method: 'POST' | 'PATCH' | 'DELETE') {
  return calls.filter((call) => call.method === method && /\/salones(?:\/\d+)?$/.test(call.url));
}

async function openCreateModal(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText(salonCentro.nombre);
  await user.click(screen.getByRole('button', { name: /nuevo salón/i }));
  return screen.getByRole('dialog');
}

describe('QA-ADMIN-EVENT-SAL-FUNC-006 — sede real al administrar salones', () => {
  beforeEach(() => tokenStorage.set('jwt-admin-salones'));
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('muestra el nombre real de la sede recibido en la propiedad HTTP Sucursal', async () => {
    installApi();
    renderWithProviders(<AdminSalonesPage />);

    expect(await screen.findByText('Salón Jade')).toBeInTheDocument();
    expect(screen.getByText('Hotel Hunapú Centro Histórico')).toBeInTheDocument();
  });

  it('consulta las sedes, exige elegir una por nombre y crea con el sucursal_id seleccionado', async () => {
    const calls = installApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    const dialog = await openCreateModal(user);
    const sedeSelect = await within(dialog).findByRole('combobox', { name: /sede|sucursal/i });

    expect(calls.some((call) => call.method === 'GET' && call.url.endsWith('/sucursales'))).toBe(true);
    expect(sedeSelect).toHaveValue('');
    expect(within(dialog).queryByRole('spinbutton', { name: /sede|sucursal/i })).not.toBeInTheDocument();
    expect(sedeSelect).toHaveTextContent('Hotel Hunapú Centro Histórico');
    expect(sedeSelect).toHaveTextContent('Hotel Hunapú Antigua');

    await user.selectOptions(sedeSelect, '77');
    await user.type(within(dialog).getByLabelText(/nombre del salón/i), 'Salón Volcán');
    const capacidad = within(dialog).getByLabelText(/capacidad máxima/i);
    await user.clear(capacidad);
    await user.type(capacidad, '180');
    const tarifa = within(dialog).getByLabelText(/tarifa base/i);
    await user.clear(tarifa);
    await user.type(tarifa, '4250.75');
    await user.type(within(dialog).getByLabelText(/descripción/i), 'Vista al volcán');
    await user.click(within(dialog).getByRole('button', { name: /crear salón/i }));

    await waitFor(() => expect(mutationCalls(calls, 'POST')).toHaveLength(1));
    expect(mutationCalls(calls, 'POST')[0].body).toEqual({
      sucursal_id: 77,
      nombre: 'Salón Volcán',
      capacidad_maxima: 180,
      tarifa_base: 4250.75,
      descripcion: 'Vista al volcán',
    });
  });

  it('precarga por nombre la sede persistida y PATCH envía el ID elegido al editar', async () => {
    const calls = installApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    await screen.findByText(salonCentro.nombre);
    await user.click(screen.getByRole('button', { name: /editar/i }));
    const dialog = screen.getByRole('dialog');
    const sedeSelect = await within(dialog).findByRole('combobox', { name: /sede|sucursal/i });
    expect(sedeSelect).toHaveValue('42');
    expect((within(sedeSelect).getByRole('option', { name: 'Hotel Hunapú Centro Histórico' }) as HTMLOptionElement).selected).toBe(true);

    await user.selectOptions(sedeSelect, '77');
    await user.click(within(dialog).getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(mutationCalls(calls, 'PATCH')).toHaveLength(1));
    expect(mutationCalls(calls, 'PATCH')[0]).toMatchObject({
      url: expect.stringMatching(/\/salones\/501$/),
      body: expect.objectContaining({ sucursal_id: 77 }),
    });
  });

  it('si falla GET /sucursales informa el problema, no asigna un ID y bloquea el envío', async () => {
    const calls = installApi({
      sucursalesError: errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Fallo interno de prueba'),
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    const dialog = await openCreateModal(user);
    await waitFor(() => {
      expect(calls.some((call) => call.method === 'GET' && call.url.endsWith('/sucursales'))).toBe(true);
    });
    expect(
      await within(dialog).findByText(/no fue posible cargar las sedes|servicio no está disponible/i),
    ).toBeInTheDocument();
    expect(within(dialog).queryByDisplayValue('1')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /crear salón/i })).toBeDisabled();
    expect(mutationCalls(calls, 'POST')).toHaveLength(0);
  });

  it('mantiene las validaciones de nombre, capacidad y tarifa sin ejecutar POST', async () => {
    const calls = installApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    const dialog = await openCreateModal(user);
    const sedeSelect = within(dialog).queryByRole('combobox', { name: /sede|sucursal/i });
    if (sedeSelect) await user.selectOptions(sedeSelect, '42');
    const capacidad = within(dialog).getByLabelText(/capacidad máxima/i);
    await user.clear(capacidad);
    await user.type(capacidad, '0');
    const tarifa = within(dialog).getByLabelText(/tarifa base/i);
    await user.clear(tarifa);
    await user.type(tarifa, '0');
    const form = within(dialog).getByRole('button', { name: /crear salón/i }).closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(await within(dialog).findByText(/nombre debe tener al menos 2 caracteres/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/capacidad debe ser mayor que cero/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/tarifa base debe ser mayor que cero/i)).toBeInTheDocument();
    expect(mutationCalls(calls, 'POST')).toHaveLength(0);
  });
});

describe('QA-ADMIN-EVENT-SAL-UX-007 — modal accesible del formulario', () => {
  beforeEach(() => tokenStorage.set('jwt-admin-salones'));
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('presenta un dialog con telón difuminado y foco dentro del modal', async () => {
    installApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    const dialog = await openCreateModal(user);
    const backdrop = dialog.parentElement?.querySelector('[aria-hidden="true"]');

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(backdrop).toHaveClass('backdrop-blur-sm');
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
  });

  it('cierra por Cancelar y por el botón X', async () => {
    installApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    let dialog = await openCreateModal(user);
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /nuevo salón/i }));
    dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /cerrar/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra con Escape y devuelve el foco al botón que abrió el modal', async () => {
    installApi();
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    await screen.findByText(salonCentro.nombre);
    const opener = screen.getByRole('button', { name: /nuevo salón/i });
    await user.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});

describe('QA-ADMIN-EVENT-SAL-UX-008 — confirmación segura al eliminar', () => {
  beforeEach(() => tokenStorage.set('jwt-admin-salones'));
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('reemplaza window.confirm por el diálogo con título, texto y acciones exactas', async () => {
    installApi({ getSalones: () => [salonCentro, salonAntigua] });
    const nativeConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    await screen.findByText(salonCentro.nombre);
    await user.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    expect(nativeConfirm).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog', { name: 'Eliminar salón' });
    expect(within(dialog).getByRole('heading', { name: 'Eliminar salón' })).toBeInTheDocument();
    expect(within(dialog).getByText(
      '¿Está seguro de que desea eliminar el salón Salón Jade? Esta acción no se puede deshacer.',
    )).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Eliminar salón' })).toBeInTheDocument();
  });

  it('Cancelar cierra el diálogo sin hacer DELETE', async () => {
    const calls = installApi();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    await screen.findByText(salonCentro.nombre);
    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    const dialog = screen.getByRole('dialog', { name: 'Eliminar salón' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog', { name: 'Eliminar salón' })).not.toBeInTheDocument();
    expect(mutationCalls(calls, 'DELETE')).toHaveLength(0);
    expect(screen.getByText(salonCentro.nombre)).toBeInTheDocument();
  });

  it('hace un solo DELETE tras confirmar, bloquea duplicados y refresca la lista al completar', async () => {
    let collection = [salonCentro, salonAntigua];
    let resolveDelete!: (response: Response) => void;
    const pendingDelete = new Promise<Response>((resolve) => {
      resolveDelete = resolve;
    });
    const calls = installApi({
      getSalones: () => collection,
      deleteSalon: () => pendingDelete,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    await screen.findByText(salonCentro.nombre);
    await user.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);
    const dialog = screen.getByRole('dialog', { name: 'Eliminar salón' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Eliminar salón' });
    expect(mutationCalls(calls, 'DELETE')).toHaveLength(0);

    await user.click(confirmButton);
    await waitFor(() => expect(mutationCalls(calls, 'DELETE')).toHaveLength(1));
    expect(confirmButton).toBeDisabled();
    await user.click(confirmButton);
    expect(mutationCalls(calls, 'DELETE')).toHaveLength(1);

    collection = [salonAntigua];
    resolveDelete(jsonResponse(null, 204));

    await waitFor(() => expect(screen.queryByText(salonCentro.nombre)).not.toBeInTheDocument());
    expect(screen.getByText(salonAntigua.nombre)).toBeInTheDocument();
    expect(mutationCalls(calls, 'DELETE')[0].url).toMatch(/\/salones\/501$/);
  });

  it('un 409 explica que el salón está en uso y conserva todos los elementos', async () => {
    const calls = installApi({
      getSalones: () => [salonCentro, salonAntigua],
      deleteSalon: () => errorResponse(
        409,
        'EVENT_ROOM_IN_USE',
        'El salón no puede eliminarse porque tiene reservas asociadas',
      ),
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    await screen.findByText(salonCentro.nombre);
    await user.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);
    const dialog = screen.getByRole('dialog', { name: 'Eliminar salón' });
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar salón' }));

    expect(await screen.findByText(
      'El salón no puede eliminarse porque tiene reservas asociadas',
    )).toBeInTheDocument();
    expect(screen.getByText(salonCentro.nombre)).toBeInTheDocument();
    expect(screen.getByText(salonAntigua.nombre)).toBeInTheDocument();
    expect(mutationCalls(calls, 'DELETE')).toHaveLength(1);
  });

  it('un 500 muestra un mensaje genérico y conserva la lista', async () => {
    const calls = installApi({
      deleteSalon: () => errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Detalle técnico no visible'),
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderWithProviders(<AdminSalonesPage />);

    await screen.findByText(salonCentro.nombre);
    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    const dialog = screen.getByRole('dialog', { name: 'Eliminar salón' });
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar salón' }));

    expect(await screen.findByText(
      'El servicio no está disponible en este momento. Inténtelo nuevamente en unos minutos.',
    )).toBeInTheDocument();
    expect(screen.queryByText('Detalle técnico no visible')).not.toBeInTheDocument();
    expect(screen.getByText(salonCentro.nombre)).toBeInTheDocument();
    expect(mutationCalls(calls, 'DELETE')).toHaveLength(1);
  });
});




