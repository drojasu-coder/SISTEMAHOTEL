
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SedesPage } from '@/pages/SedesPage';
import { tokenStorage } from '@/api/session';
import {
  renderWithProviders,
  jsonResponse,
  errorResponse,
  meResponse,
} from '@/test/renderWithProviders';

const mockSedes = [
  {
    id: 1,
    nombre: 'Hotel Hunapú Centro',
    direccion: '6a Avenida 10-20 Zona 1',
    ciudad: 'Guatemala',
    telefono: '22223333',
    activa: true,
  },
  {
    id: 2,
    nombre: 'Hotel Hunapú Antigua',
    direccion: '5ta Avenida Norte',
    ciudad: 'Antigua Guatemala',
    telefono: '78320001',
    activa: false,
  },
];

describe('Módulo de gestión de sedes (SedesPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('muestra estado de carga y luego lista las sedes obtenidas de la API', async () => {
    tokenStorage.set('jwt-admin');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
      if (url.endsWith('/sucursales')) {
        return Promise.resolve(
          jsonResponse({ status: 'success', data: mockSedes }),
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    renderWithProviders(<SedesPage />);

    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { level: 1, name: /Sedes de HOTEL HUNAHPÚ/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Hotel Hunapú Centro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hotel Hunapú Antigua').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Guatemala').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Antigua Guatemala').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Inactiva').length).toBeGreaterThan(0);
  });

  it('filtra por nombre o ciudad en el cliente con el conjunto completo', async () => {
    tokenStorage.set('jwt-admin');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
      if (url.endsWith('/sucursales')) {
        return Promise.resolve(
          jsonResponse({ status: 'success', data: mockSedes }),
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<SedesPage />);

    await screen.findAllByText('Hotel Hunapú Centro');

    const searchInput = screen.getByLabelText(/Buscar sede/i);
    await user.type(searchInput, 'Antigua');

    expect(screen.getAllByText('Hotel Hunapú Antigua').length).toBeGreaterThan(0);
    expect(screen.queryByText('Hotel Hunapú Centro')).not.toBeInTheDocument();

    // Limpiar búsqueda
    const clearButton = screen.getByLabelText(/Limpiar búsqueda/i);
    await user.click(clearButton);

    expect(screen.getAllByText('Hotel Hunapú Centro').length).toBeGreaterThan(0);
  });

  it('muestra aviso cuando no hay resultados de búsqueda', async () => {
    tokenStorage.set('jwt-admin');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
      if (url.endsWith('/sucursales')) {
        return Promise.resolve(
          jsonResponse({ status: 'success', data: mockSedes }),
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<SedesPage />);

    await screen.findAllByText('Hotel Hunapú Centro');

    const searchInput = screen.getByLabelText(/Buscar sede/i);
    await user.type(searchInput, 'Inexistente');

    expect(
      screen.getByText(/No se encontraron sedes que coincidan con su búsqueda/i),
    ).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay sedes registradas', async () => {
    tokenStorage.set('jwt-admin');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
      if (url.endsWith('/sucursales')) {
        return Promise.resolve(jsonResponse({ status: 'success', data: [] }));
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    renderWithProviders(<SedesPage />);

    expect(
      await screen.findByText(/No hay sedes registradas en este momento/i),
    ).toBeInTheDocument();
  });

  it('muestra error y permite reintentar ante fallo de la API', async () => {
    tokenStorage.set('jwt-admin');
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
      if (url.endsWith('/sucursales')) {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Error interno'),
          );
        }
        return Promise.resolve(
          jsonResponse({ status: 'success', data: mockSedes }),
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<SedesPage />);

    expect(
      await screen.findByText(/No fue posible cargar las sedes/i),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
    await user.click(retryBtn);

    expect((await screen.findAllByText('Hotel Hunapú Centro')).length).toBeGreaterThan(0);
  });

  it('crea una nueva sede con validación y envía datos correctos', async () => {
    tokenStorage.set('jwt-admin');
    let createdPayload: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
      if (url.endsWith('/sucursales') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({ status: 'success', data: mockSedes }),
        );
      }
      if (url.endsWith('/sucursales') && config?.method === 'POST') {
        createdPayload = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse(
            {
              status: 'success',
              data: {
                id: 3,
                ...createdPayload,
                activa: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
            201,
          ),
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<SedesPage />);

    await screen.findAllByText('Hotel Hunapú Centro');

    // Abre modal de registro
    const newBtn = screen.getByRole('button', { name: /Registrar sede/i });
    await user.click(newBtn);

    expect(screen.getByRole('heading', { name: /Registrar nueva sede/i })).toBeInTheDocument();

    // Intentar enviar sin nombre
    const submitBtn = screen.getByRole('button', { name: /Guardar sede/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/El nombre no puede estar vacío/i)).toBeInTheDocument();

    // Llenar datos
    const nameInput = screen.getByLabelText(/Nombre de la sede/i);
    const cityInput = screen.getByLabelText(/Ciudad/i);
    const addressInput = screen.getByLabelText(/Dirección/i);
    const phoneInput = screen.getByLabelText(/Teléfono/i);

    await user.type(nameInput, 'Hotel Hunapú Panajachel');
    await user.type(cityInput, 'Sololá');
    await user.type(addressInput, 'Calle Santander');
    await user.type(phoneInput, '77621122');

    await user.click(submitBtn);

    await waitFor(() => {
      expect(createdPayload).toEqual({
        nombre: 'Hotel Hunapú Panajachel',
        ciudad: 'Sololá',
        direccion: 'Calle Santander',
        telefono: '77621122',
      });
    });

    expect(await screen.findByText(/Sede registrada correctamente/i)).toBeInTheDocument();
  });

  it('edita una sede existente con datos precargados', async () => {
    tokenStorage.set('jwt-admin');
    let updatedPayload: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
      if (url.endsWith('/sucursales') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({ status: 'success', data: mockSedes }),
        );
      }
      if (url.match(/\/sucursales\/1$/) && config?.method === 'PATCH') {
        updatedPayload = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: { ...mockSedes[0], ...updatedPayload },
          }),
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<SedesPage />);

    await screen.findAllByText('Hotel Hunapú Centro');

    // Clic en editar de la primera sede
    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    await user.click(editButtons[0]);

    expect(screen.getByRole('heading', { name: /Editar sede/i })).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Nombre de la sede/i);
    expect(nameInput).toHaveValue('Hotel Hunapú Centro');

    await user.clear(nameInput);
    await user.type(nameInput, 'Hotel Hunapú Centro Histórico');

    const submitBtn = screen.getByRole('button', { name: /Guardar sede/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(updatedPayload).toMatchObject({
        nombre: 'Hotel Hunapú Centro Histórico',
      });
    });

    expect(await screen.findByText(/Sede actualizada correctamente/i)).toBeInTheDocument();
  });

  it('desactiva una sede activa tras confirmación explícita', async () => {
    tokenStorage.set('jwt-admin');
    let patchedBody: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('admin'));
      if (url.endsWith('/sucursales') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({ status: 'success', data: mockSedes }),
        );
      }
      if (url.match(/\/sucursales\/1$/) && config?.method === 'PATCH') {
        patchedBody = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: { ...mockSedes[0], activa: false },
          }),
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<SedesPage />);

    await screen.findAllByText('Hotel Hunapú Centro');

    // Clic en Desactivar de la sede 1
    const deactivateButtons = screen.getAllByRole('button', { name: /Desactivar/i });
    await user.click(deactivateButtons[0]);

    // Modal de confirmación
    expect(screen.getByRole('heading', { name: /¿Desea desactivar esta sede\?/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Las reservas y habitaciones existentes no se eliminan/i),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Sí, desactivar/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(patchedBody).toEqual({ activa: false });
    });

    expect(
      await screen.findByText(/El estado de la sede fue actualizado correctamente/i),
    ).toBeInTheDocument();
  });

  it('no muestra botones de administración para roles no administradores', async () => {
    tokenStorage.set('jwt-recepcion');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('recepcionista'));
      if (url.endsWith('/sucursales')) {
        return Promise.resolve(
          jsonResponse({ status: 'success', data: mockSedes }),
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    renderWithProviders(<SedesPage />);

    await screen.findAllByText('Hotel Hunapú Centro');

    expect(screen.queryByRole('button', { name: /Registrar sede/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Desactivar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Activar/i })).not.toBeInTheDocument();
  });
});
