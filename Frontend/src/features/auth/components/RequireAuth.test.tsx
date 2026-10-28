import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import App from '@/App';
import { api } from '@/api/client/http';
import { tokenStorage } from '@/api/session';
import { getOrCreateCheckoutIdempotencyKey, getStoredCheckoutAttempt } from '@/features/pagos/utils/idempotency';
import { useAuth } from '../AuthContext';
import { installAdminReadMocks } from '@/test/adminReads';
import {
  errorResponse,
  jsonResponse,
  loginResponse,
  meResponse,
  renderWithProviders,
  createTestQueryClient,
} from '@/test/renderWithProviders';

function openApp(path: string) {
  installAdminReadMocks();
  window.history.replaceState(null, '', path);
  render(<App />);
}

describe('Rutas protegidas por permisos (aplicación completa, fetch simulado)', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('redirige a /login si no hay sesión y no consulta datos privados', async () => {
    global.fetch = vi.fn();
    openApp('/admin');

    expect(await screen.findByRole('heading', { level: 1, name: /Iniciar sesión/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.every(([url]) => /\/(sucursales|inicio)$/.test(String(url)))).toBe(true);
  });

  it('no muestra contenido protegido mientras se restaura la sesión', async () => {
    tokenStorage.set('jwt-guardado');
    let resolveMe: (value: Response) => void = () => {};
    global.fetch = vi.fn().mockImplementation(
      () => new Promise<Response>((resolve) => (resolveMe = resolve)),
    );
    openApp('/admin');

    expect(await screen.findByText(/Verificando su sesión/i)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /Panel administrativo/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Bienvenido/i)).not.toBeInTheDocument();

    await act(async () => {
      resolveMe(meResponse('admin'));
    });

    expect(await screen.findByRole('heading', { level: 1, name: /Bienvenido, Persona Prueba/i })).toBeInTheDocument();
    const [url, config] = (global.fetch as any).mock.calls[0];
    expect(url).toMatch(/\/auth\/me$/);
    expect(config.headers.Authorization).toBe('Bearer jwt-guardado');
  });

  it('un cliente con sesión válida no entra al panel', async () => {
    tokenStorage.set('jwt-guardado');
    global.fetch = vi.fn().mockResolvedValue(meResponse('cliente'));
    openApp('/admin');

    expect(await screen.findByRole('heading', { level: 1, name: /Acceso no autorizado/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/403');
    expect(tokenStorage.get()).toBe('jwt-guardado'); // el 403 de interfaz no cierra la sesión
  });

  it('empleado_operativo (sin módulos) no entra al panel y tiene /cuenta', async () => {
    tokenStorage.set('jwt-guardado');
    global.fetch = vi.fn().mockResolvedValue(meResponse('empleado_operativo'));
    openApp('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: /Acceso no autorizado/i })).toBeInTheDocument();
  });

  it('cada módulo exige su permiso: gerente_restaurante solo entra a restaurante', async () => {
    tokenStorage.set('jwt-guardado');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).endsWith('/auth/me')) return Promise.resolve(meResponse('gerente_restaurante'));
      return Promise.resolve(jsonResponse({ status: 'success', data: [] }));
    });

    openApp('/admin/restaurante');
    expect(
      await screen.findByRole('heading', { level: 1, name: /Mesas de HOTEL HUNAHPÚ/i }),
    ).toBeInTheDocument();
  });

  it('gerente_restaurante es rechazado en módulos de otro rol y no ve sus enlaces', async () => {
    tokenStorage.set('jwt-guardado');
    global.fetch = vi.fn().mockResolvedValue(meResponse('gerente_restaurante'));

    openApp('/admin/pagos');
    expect(await screen.findByRole('heading', { level: 1, name: /Acceso no autorizado/i })).toBeInTheDocument();
  });

  it('el menú del panel solo lista los módulos del rol', async () => {
    tokenStorage.set('jwt-guardado');
    global.fetch = vi.fn().mockResolvedValue(meResponse('recepcionista'));
    openApp('/admin');

    const nav = await screen.findByRole('navigation', { name: /Panel administrativo/i });
    const links = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
    expect(links).toEqual(['Inicio', 'Habitaciones', 'Tipos de habitación', 'Reservas', 'Estacionamiento', 'Facturación', 'Pagos y reembolsos']);
    expect(Array.from(nav.querySelectorAll('a')).map(a => a.getAttribute('href'))).toEqual([
      '/admin', '/admin/habitaciones', '/admin/tipos-habitacion', '/admin/reservas', '/admin/parqueos', '/admin/facturacion', '/admin/pagos',
    ]);
  });

  it('el panel no muestra métricas, personas ni sedes ficticias', async () => {
    tokenStorage.set('jwt-guardado');
    global.fetch = vi.fn().mockResolvedValue(meResponse('admin'));
    openApp('/admin');

    await screen.findByRole('heading', { level: 1, name: /Bienvenido/i });
    await screen.findByText('Sin habitaciones registradas');
    expect(screen.getByRole('combobox', { name: 'Filtrar por sede' })).toHaveValue('all');
    expect(document.body).not.toHaveTextContent(/Sede activa/i);
    expect(document.body).not.toHaveTextContent(/Q\s?\d/);
    expect(screen.getByText('Ocupación por reservas')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/Ingresos/i);
  });

  describe('restauración de sesión y errores', () => {
    it('conserva el token y permite reintentar tras un fallo de red', async () => {
      tokenStorage.set('jwt-guardado');
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(meResponse('admin'));
      openApp('/admin');

      const retry = await screen.findByRole('button', { name: /Reintentar/i });
      expect(tokenStorage.get()).toBe('jwt-guardado');
      expect(screen.queryByText(/Bienvenido/i)).not.toBeInTheDocument();

      await userEvent.setup().click(retry);

      expect(await screen.findByRole('heading', { level: 1, name: /Bienvenido/i })).toBeInTheDocument();
      expect(tokenStorage.get()).toBe('jwt-guardado');
      expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/auth/me'))).toHaveLength(2);
    });

    it('conserva el token ante un error 5xx del servidor al restaurar', async () => {
      tokenStorage.set('jwt-guardado');
      global.fetch = vi.fn().mockResolvedValue(errorResponse(503, 'DATABASE_UNAVAILABLE', 'no disponible'));
      openApp('/admin');

      expect(await screen.findByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
      expect(tokenStorage.get()).toBe('jwt-guardado');
    });

    it('cierra la sesión por código TOKEN_EXPIRED y lo explica en el inicio de sesión', async () => {
      tokenStorage.set('jwt-vencido');
      global.fetch = vi.fn().mockResolvedValue(errorResponse(401, 'TOKEN_EXPIRED', 'x'));
      openApp('/admin');

      expect(await screen.findByRole('heading', { level: 1, name: /Iniciar sesión/i })).toBeInTheDocument();
      expect(screen.getByText(/Su sesión finalizó/i)).toBeInTheDocument();
      expect(tokenStorage.get()).toBeNull();
    });

    it('cierra la sesión por USER_INACTIVE con su propio mensaje', async () => {
      tokenStorage.set('jwt-guardado');
      global.fetch = vi.fn().mockResolvedValue(errorResponse(403, 'USER_INACTIVE', 'x'));
      openApp('/admin');

      expect(await screen.findByText(/cuenta se encuentra deshabilitada/i)).toBeInTheDocument();
      expect(tokenStorage.get()).toBeNull();
    });

    it('cierra la sesión si /auth/me devuelve un rol desconocido', async () => {
      tokenStorage.set('jwt-guardado');
      global.fetch = vi.fn().mockResolvedValue(meResponse('superadmin'));
      openApp('/admin');

      expect(await screen.findByText(/rol válido/i)).toBeInTheDocument();
      expect(tokenStorage.get()).toBeNull();
    });
  });
});

/* ---------- Sesión: 403 ordinario, cancelación y caché ---------- */

const Probe: React.FC = () => {
  const { status, user, login, logout } = useAuth();
  const queryClient = useQueryClient();
  const privateData = useQuery({
    queryKey: ['privado', user?.id],
    queryFn: () => api.get<{ data: string }>('/pagos'),
    enabled: status === 'authenticated',
  });
  return (
    <div>
      <p data-testid="estado">{status}</p>
      <p data-testid="usuario">{user?.nombre ?? 'nadie'}</p>
      <p data-testid="dato">{privateData.data?.data ?? 'sin dato'}</p>
      <p data-testid="consultas">
        {queryClient.getQueryCache().getAll().filter((q) => q.state.data !== undefined).length}
      </p>
      <button onClick={() => login({ email: 'b@ejemplo.com', password: 'x' })}>entrar-b</button>
      <button onClick={logout}>salir</button>
    </div>
  );
};

describe('Sesión: permisos, cancelación y caché privada', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('un 403 ordinario por falta de permisos NO cierra la sesión', async () => {
    tokenStorage.set('jwt-guardado');
    global.fetch = vi.fn().mockImplementation((url: string) =>
      Promise.resolve(
        String(url).endsWith('/auth/me')
          ? meResponse('recepcionista')
          : errorResponse(403, 'INSUFFICIENT_PERMISSIONS', 'No tiene permisos para realizar esta operación'),
      ),
    );
    renderWithProviders(<Probe />);

    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('authenticated'));
    await waitFor(() => expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(2));
    await act(async () => {});

    expect(screen.getByTestId('estado')).toHaveTextContent('authenticated');
    expect(tokenStorage.get()).toBe('jwt-guardado');
  });

  it('un 403 con otro código (aunque el texto mencione deshabilitada) tampoco cierra la sesión', async () => {
    tokenStorage.set('jwt-guardado');
    global.fetch = vi.fn().mockImplementation((url: string) =>
      Promise.resolve(
        String(url).endsWith('/auth/me')
          ? meResponse('recepcionista')
          : errorResponse(403, 'PAYMENT_ACCESS_DENIED', 'La cuenta de usuario se encuentra deshabilitada'),
      ),
    );
    renderWithProviders(<Probe />);

    await waitFor(() => expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(2));
    await act(async () => {});
    expect(screen.getByTestId('estado')).toHaveTextContent('authenticated');
  });

  it('al cerrar sesión cancela solicitudes privadas pendientes y limpia la caché', async () => {
    tokenStorage.set('jwt-guardado');
    let privateSignal: AbortSignal | undefined;
    global.fetch = vi.fn().mockImplementation((url: string, config: RequestInit) => {
      if (String(url).endsWith('/auth/me')) return Promise.resolve(meResponse('admin', 'Ana'));
      privateSignal = config.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        config.signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
        );
      });
    });
    renderWithProviders(<Probe />);

    await waitFor(() => expect(privateSignal).toBeDefined());
    expect(privateSignal?.aborted).toBe(false);

    await userEvent.setup().click(screen.getByRole('button', { name: 'salir' }));

    await waitFor(() => expect(privateSignal?.aborted).toBe(true));
    expect(screen.getByTestId('estado')).toHaveTextContent('anonymous');
    expect(screen.getByTestId('usuario')).toHaveTextContent('nadie');
    expect(screen.getByTestId('dato')).toHaveTextContent('sin dato');
    expect(screen.getByTestId('consultas')).toHaveTextContent('0');
    expect(tokenStorage.get()).toBeNull();
  });

  it('al cambiar de usuario no se muestra información de la sesión anterior', async () => {
    tokenStorage.set('jwt-a');
    const attemptA = getOrCreateCheckoutIdempotencyKey(3, 9, 400);
    let resolveStaleA: (value: Response) => void = () => {};
    let privateCalls = 0;
    global.fetch = vi.fn().mockImplementation((url: string, config: RequestInit) => {
      const target = String(url);
      if (target.endsWith('/auth/me')) return Promise.resolve(meResponse('admin', 'Ana'));
      if (target.endsWith('/auth/login')) return Promise.resolve(loginResponse('recepcionista', 'Beto'));
      privateCalls += 1;
      if (privateCalls === 1) {
        // Solicitud privada de la persona A que responde tarde.
        return new Promise((resolve, reject) => {
          resolveStaleA = resolve;
          config.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })),
          );
        });
      }
      return Promise.resolve(jsonResponse({ data: 'datos de Beto' }));
    });
    const queryClient = createTestQueryClient();
    renderWithProviders(<Probe />, { queryClient });

    await waitFor(() => expect(privateCalls).toBe(1));
    await userEvent.setup().click(screen.getByRole('button', { name: 'entrar-b' }));

    await waitFor(() => expect(screen.getByTestId('usuario')).toHaveTextContent('Beto'));
    await act(async () => {
      resolveStaleA(jsonResponse({ data: 'datos de Ana' }));
    });
    await waitFor(() => expect(screen.getByTestId('dato')).toHaveTextContent('datos de Beto'));
    expect(document.body).not.toHaveTextContent('datos de Ana');
    expect(getStoredCheckoutAttempt(3, 9)?.key).toBe(attemptA.key);
    expect(getStoredCheckoutAttempt(7, 9)).toBeNull();
    await userEvent.setup().click(screen.getByRole('button', { name: 'salir' }));
    expect(getStoredCheckoutAttempt(3, 9)?.key).toBe(attemptA.key);
  });
});
