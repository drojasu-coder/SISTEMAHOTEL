import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MesasPage } from '@/pages/MesasPage';
import { tokenStorage } from '@/api/session';
import {
  renderWithProviders,
  jsonResponse,
  errorResponse,
  meResponse,
} from '@/test/renderWithProviders';

/**
 * Pruebas del módulo de mesas con fetch simulado.
 * Las consultas se acotan a la tabla del listado para no confundirse con las
 * opciones de los filtros (que repiten los nombres de zona y sede).
 */

const mockMesas = [
  {
    id: 1,
    sucursal_id: 1,
    zona: 'Terraza',
    capacidad: 4,
    estado: 'disponible',
    Sucursal: { nombre: 'Hotel Hunapú Centro' },
  },
  {
    id: 2,
    sucursal_id: 2,
    zona: 'Salón Principal',
    capacidad: 8,
    estado: 'mantenimiento',
    Sucursal: { nombre: 'Hotel Hunapú Antigua' },
  },
  {
    id: 3,
    sucursal_id: 1,
    zona: 'Terraza',
    capacidad: 2,
    estado: 'disponible',
    Sucursal: { nombre: 'Hotel Hunapú Centro' },
  },
];

const mockSucursales = [
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
    activa: true,
  },
];

interface FetchCall {
  url: string;
  method: string;
  body: unknown;
}

/** Simula la API real: /auth/me, /mesas, /sucursales, POST /mesas y PATCH /mesas/:id. */
function mockApi(options: {
  mesas?: unknown[];
  mesasError?: { status: number; code: string; message: string };
  calls?: FetchCall[];
  createStatus?: number;
  patchStatus?: number;
}) {
  const calls = options.calls ?? [];
  let mesasAttempts = 0;

  global.fetch = vi.fn().mockImplementation((url: string, config?: RequestInit) => {
    const method = (config?.method ?? 'GET').toUpperCase();
    const body = config?.body ? JSON.parse(String(config.body)) : undefined;
    calls.push({ url: String(url), method, body });

    if (String(url).endsWith('/auth/me')) {
      return Promise.resolve(meResponse('admin'));
    }
    if (String(url).endsWith('/sucursales')) {
      return Promise.resolve(jsonResponse({ status: 'success', data: mockSucursales }));
    }
    if (String(url).endsWith('/mesas') && method === 'GET') {
      mesasAttempts += 1;
      if (options.mesasError && mesasAttempts === 1) {
        return Promise.resolve(
          errorResponse(
            options.mesasError.status,
            options.mesasError.code,
            options.mesasError.message,
          ),
        );
      }
      return Promise.resolve(
        jsonResponse({ status: 'success', data: options.mesas ?? mockMesas }),
      );
    }
    if (String(url).endsWith('/mesas') && method === 'POST') {
      if (options.createStatus && options.createStatus >= 400) {
        return Promise.resolve(
          errorResponse(
            options.createStatus,
            'INSUFFICIENT_PERMISSIONS',
            'No tiene permisos para realizar esta operación',
          ),
        );
      }
      return Promise.resolve(
        jsonResponse({ status: 'success', data: { id: 9, ...(body as object) } }, 201),
      );
    }
    if (/\/mesas\/\d+$/.test(String(url)) && method === 'PATCH') {
      if (options.patchStatus && options.patchStatus >= 400) {
        return Promise.resolve(
          errorResponse(options.patchStatus, 'TABLE_NOT_FOUND', 'La mesa solicitada no existe'),
        );
      }
      return Promise.resolve(
        jsonResponse({
          status: 'success',
          data: { ...(mockMesas[0] as object), ...(body as object) },
        }),
      );
    }
    return Promise.reject(new Error(`Unhandled: ${url}`));
  });

  return calls;
}

/** Listado de mesas de la tabla (el mismo dato se repite en las tarjetas móviles). */
function listado() {
  return within(screen.getByRole('table'));
}

describe('Módulo de gestión de mesas (MesasPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('muestra estado de carga y luego lista las mesas obtenidas de la API', async () => {
    tokenStorage.set('jwt-admin');
    mockApi({});

    renderWithProviders(<MesasPage />);

    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i }),
    ).toBeInTheDocument();

    expect(listado().getAllByText('Terraza')).toHaveLength(2);
    expect(listado().getByText('Salón Principal')).toBeInTheDocument();
    expect(listado().getAllByText('Hotel Hunapú Centro')).toHaveLength(2);
    expect(listado().getByText('Hotel Hunapú Antigua')).toBeInTheDocument();
    expect(listado().getByText(/4 comensales/)).toBeInTheDocument();
    expect(listado().getByText('mantenimiento')).toBeInTheDocument();
    expect(screen.getAllByText(/3 mesas mostradas/).length).toBeGreaterThan(0);
  });

  it('filtra por sede con el catálogo real de sedes', async () => {
    tokenStorage.set('jwt-admin');
    mockApi({});

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    await user.selectOptions(screen.getByLabelText('Filtrar por sede'), '2');

    // Solo queda la mesa de la sede seleccionada.
    expect(listado().getByText('Salón Principal')).toBeInTheDocument();
    expect(listado().queryByText('Terraza')).toBeNull();
    expect(listado().getByText('Hotel Hunapú Antigua')).toBeInTheDocument();
    expect(listado().queryByText('Hotel Hunapú Centro')).toBeNull();
    expect(screen.getAllByText(/1 mesas mostradas/).length).toBeGreaterThan(0);
  });

  it('filtra por zona usando las zonas presentes en los datos', async () => {
    tokenStorage.set('jwt-admin');
    mockApi({});

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    const zonaSelect = screen.getByLabelText('Filtrar por zona');
    expect(zonaSelect).toHaveTextContent('Terraza');
    expect(zonaSelect).toHaveTextContent('Salón Principal');

    await user.selectOptions(zonaSelect, 'Terraza');

    expect(listado().queryByText('Salón Principal')).toBeNull();
    expect(listado().getAllByText('Terraza')).toHaveLength(2);
    expect(screen.getAllByText(/2 mesas mostradas/).length).toBeGreaterThan(0);
  });

  it('muestra aviso sin resultados y permite limpiar los filtros', async () => {
    tokenStorage.set('jwt-admin');
    mockApi({});

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    await user.selectOptions(screen.getByLabelText('Filtrar por sede'), '2');
    await user.selectOptions(screen.getByLabelText('Filtrar por zona'), 'Terraza');

    expect(
      await screen.findByText(/No se encontraron mesas que coincidan con los filtros/i),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Limpiar filtros/i })[0]);

    await waitFor(() => {
      expect(listado().getByText('Salón Principal')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/3 mesas mostradas/).length).toBeGreaterThan(0);
  });

  it('muestra estado vacío cuando no hay mesas registradas', async () => {
    tokenStorage.set('jwt-admin');
    mockApi({ mesas: [] });

    renderWithProviders(<MesasPage />);

    expect(
      await screen.findByText(/No hay mesas registradas en este momento/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Filtrar por sede')).not.toBeInTheDocument();
  });

  it('muestra error y permite reintentar ante fallo de la API', async () => {
    tokenStorage.set('jwt-admin');
    mockApi({
      mesasError: { status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
    });

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    expect(await screen.findByText(/No fue posible cargar las mesas/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reintentar/i }));

    expect((await screen.findAllByText('Terraza')).length).toBeGreaterThan(0);
  });

  it('valida el formulario de registro antes de enviarlo', async () => {
    tokenStorage.set('jwt-admin');
    const calls = mockApi({});

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    await user.click(screen.getByRole('button', { name: /Registrar mesa/i }));
    expect(screen.getByRole('heading', { name: /Registrar nueva mesa/i })).toBeInTheDocument();

    const guardar = screen.getByRole('button', { name: /Guardar mesa/i });
    await waitFor(() => expect(guardar).toBeEnabled());

    // Sin sede, sin zona y con capacidad inválida
    await user.type(screen.getByLabelText('Capacidad'), '0');
    await user.click(guardar);

    expect(
      await screen.findByText(/Seleccione la sede donde se ubicará la mesa/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/La zona no puede estar vacía/i)).toBeInTheDocument();
    expect(
      screen.getByText(/La capacidad debe ser un número entero mayor a 0/i),
    ).toBeInTheDocument();

    // No se envió nada al servidor
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  });

  it('registra una mesa con los datos ingresados', async () => {
    tokenStorage.set('jwt-admin');
    const calls = mockApi({});

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    await user.click(screen.getByRole('button', { name: /Registrar mesa/i }));

    const guardar = screen.getByRole('button', { name: /Guardar mesa/i });
    await waitFor(() => expect(guardar).toBeEnabled());

    await user.selectOptions(screen.getByLabelText('Sede'), '1');
    await user.type(screen.getByLabelText('Zona'), 'Barra');
    await user.type(screen.getByLabelText('Capacidad'), '6');
    await user.type(screen.getByLabelText(/^Estado/), 'disponible');

    await user.click(guardar);

    await waitFor(() => {
      const posted = calls.find((call) => call.method === 'POST');
      expect(posted).toBeDefined();
      expect(posted?.body).toEqual({
        sucursal_id: 1,
        zona: 'Barra',
        capacidad: 6,
        estado: 'disponible',
      });
    });

    expect(await screen.findByText(/Mesa registrada correctamente/i)).toBeInTheDocument();
  });

  it('omite el estado en la creación cuando el campo queda vacío', async () => {
    tokenStorage.set('jwt-admin');
    const calls = mockApi({});

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    await user.click(screen.getByRole('button', { name: /Registrar mesa/i }));

    const guardar = screen.getByRole('button', { name: /Guardar mesa/i });
    await waitFor(() => expect(guardar).toBeEnabled());

    await user.selectOptions(screen.getByLabelText('Sede'), '2');
    await user.type(screen.getByLabelText('Zona'), 'Patio');
    await user.type(screen.getByLabelText('Capacidad'), '10');

    await user.click(guardar);

    let posted: FetchCall | undefined;
    await waitFor(() => {
      posted = calls.find((call) => call.method === 'POST');
      expect(posted?.body).toEqual({ sucursal_id: 2, zona: 'Patio', capacidad: 10 });
    });

    expect(posted?.body).not.toHaveProperty('estado');
  });

  it('edita una mesa sin enviar la sede y con los datos precargados', async () => {
    tokenStorage.set('jwt-admin');
    const calls = mockApi({});

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    await user.click(screen.getAllByRole('button', { name: /Editar mesa/ })[0]);

    expect(screen.getByRole('heading', { name: /Editar mesa/i })).toBeInTheDocument();

    const zona = screen.getByLabelText('Zona');
    expect(zona).toHaveValue('Terraza');
    expect(screen.getByLabelText('Capacidad')).toHaveValue(4);
    expect(screen.getByLabelText(/^Estado/)).toHaveValue('disponible');

    // La sede no se edita: se muestra como dato de la mesa.
    expect(screen.queryByLabelText('Sede')).not.toBeInTheDocument();
    expect(screen.getAllByText('Hotel Hunapú Centro').length).toBeGreaterThan(0);

    await user.clear(zona);
    await user.type(zona, 'Terraza Panorámica');
    await user.click(screen.getByRole('button', { name: /Guardar mesa/i }));

    let patched: FetchCall | undefined;
    await waitFor(() => {
      patched = calls.find((call) => call.method === 'PATCH');
      expect(patched).toBeDefined();
      expect(patched?.body).toEqual({
        zona: 'Terraza Panorámica',
        capacidad: 4,
        estado: 'disponible',
      });
    });

    expect(patched?.body).not.toHaveProperty('sucursal_id');
    expect(await screen.findByText(/Mesa actualizada correctamente/i)).toBeInTheDocument();
  });

  it('no permite vaciar un estado existente en la edición', async () => {
    tokenStorage.set('jwt-admin');
    const calls = mockApi({});

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    await user.click(screen.getAllByRole('button', { name: /Editar mesa/ })[0]);

    await user.clear(screen.getByLabelText(/^Estado/));
    await user.click(screen.getByRole('button', { name: /Guardar mesa/i }));

    expect(await screen.findByText(/Conserve el estado actual o ingrese otro valor/i)).toBeInTheDocument();
    expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(0);
  });

  it('muestra el error del servidor cuando la operación no está permitida', async () => {
    tokenStorage.set('jwt-admin');
    mockApi({ createStatus: 403 });

    const user = userEvent.setup();
    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    await user.click(screen.getByRole('button', { name: /Registrar mesa/i }));

    const guardar = screen.getByRole('button', { name: /Guardar mesa/i });
    await waitFor(() => expect(guardar).toBeEnabled());

    await user.selectOptions(screen.getByLabelText('Sede'), '1');
    await user.type(screen.getByLabelText('Zona'), 'Barra');
    await user.type(screen.getByLabelText('Capacidad'), '6');

    await user.click(guardar);

    expect(
      await screen.findByText(/No tiene permisos para realizar esta operación/i),
    ).toBeInTheDocument();
    // El modal permanece abierto y los datos se conservan.
    expect(screen.getByLabelText('Zona')).toHaveValue('Barra');
  });

  it('no muestra acciones de gestión para roles sin el permiso restaurante.gestionar', async () => {
    tokenStorage.set('jwt-recepcion');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('recepcionista'));
      if (url.endsWith('/sucursales')) {
        return Promise.resolve(jsonResponse({ status: 'success', data: mockSucursales }));
      }
      if (url.endsWith('/mesas')) {
        return Promise.resolve(jsonResponse({ status: 'success', data: mockMesas }));
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    expect(screen.queryByRole('button', { name: /Registrar mesa/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar mesa/i })).not.toBeInTheDocument();
    // El listado sigue disponible: la lectura es pública en el backend.
    expect(screen.getAllByText('Terraza').length).toBeGreaterThan(0);
  });

  it('permite gestionar mesas al gerente de restaurante', async () => {
    tokenStorage.set('jwt-gerente');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(meResponse('gerente_restaurante'));
      if (url.endsWith('/sucursales')) {
        return Promise.resolve(jsonResponse({ status: 'success', data: mockSucursales }));
      }
      if (url.endsWith('/mesas')) {
        return Promise.resolve(jsonResponse({ status: 'success', data: mockMesas }));
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    renderWithProviders(<MesasPage />);

    await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i });

    expect(screen.getByRole('button', { name: /Registrar mesa/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Editar mesa/i }).length).toBeGreaterThan(0);
  });
});
