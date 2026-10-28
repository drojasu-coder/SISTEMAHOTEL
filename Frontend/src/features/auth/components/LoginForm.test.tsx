import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { tokenStorage } from '@/api/session';
import { errorResponse, loginResponse } from '@/test/renderWithProviders';
import { installAdminReadMocks } from '@/test/adminReads';

/** Pruebas de integración de interfaz con la aplicación completa y `fetch` simulado. */

function openLogin(state?: unknown, role = 'admin') {
  installAdminReadMocks(role);
  // React Router guarda el estado de navegación bajo `usr` en window.history.state.
  window.history.replaceState(state ? { usr: state, key: 'prueba', idx: 0 } : null, '', '/login');
  render(<App />);
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/^Correo electrónico$/i), email);
  await user.type(screen.getByLabelText(/^Contraseña$/i), password);
  await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
}

describe('Inicio de sesión (fetch simulado)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    localStorage.clear(); sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('muestra errores de validación con el formulario vacío', async () => {
    const user = userEvent.setup();
    openLogin();

    await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/El correo electrónico es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Correo electrónico$/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('muestra error de formato de correo', async () => {
    const user = userEvent.setup();
    openLogin();

    await user.type(screen.getByLabelText(/^Correo electrónico$/i), 'correo-invalido');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    expect(await screen.findByText(/Ingrese un correo electrónico válido/i)).toBeInTheDocument();
  });

  it('no impone un largo mínimo de contraseña que el backend no exige al iniciar sesión', async () => {
    global.fetch = vi.fn().mockResolvedValue(loginResponse('cliente'));
    openLogin();

    await fillAndSubmit('persona@ejemplo.com', 'abc');

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/login"), expect.anything()));
  });

  it('llama a /auth/login sin token y guarda la sesión', async () => {
    global.fetch = vi.fn().mockResolvedValue(loginResponse('cliente'));
    openLogin();

    await fillAndSubmit('persona@ejemplo.com', 'Clave1234');

    await waitFor(() => expect(tokenStorage.get()).toBe('jwt-de-prueba'));
    const [url, config] = (global.fetch as any).mock.calls.find(([url]: [string]) => url.endsWith('/auth/login'));
    expect(url).toMatch(/\/auth\/login$/);
    expect(config.method).toBe('POST');
    expect(config.headers.Authorization).toBeUndefined();
    expect(JSON.parse(config.body)).toEqual({ email: 'persona@ejemplo.com', password: 'Clave1234' });
  });

  describe('destino según el rol devuelto por el backend', () => {
    it.each([
      ['admin', /Bienvenido, Persona Prueba/i],
      ['recepcionista', /Bienvenido, Persona Prueba/i],
      ['gerente_habitaciones', /Bienvenido, Persona Prueba/i],
      ['gerente_restaurante', /Bienvenido, Persona Prueba/i],
    ])('%s entra al panel', async (rol, heading) => {
      global.fetch = vi.fn().mockResolvedValue(loginResponse(rol));
      openLogin(undefined, rol);
      await fillAndSubmit('persona@ejemplo.com', 'Clave1234');
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
      expect(window.location.pathname).toBe('/admin');
    });

    it('cliente va al sitio público, no al panel', async () => {
      global.fetch = vi.fn().mockResolvedValue(loginResponse('cliente'));
      openLogin();
      await fillAndSubmit('persona@ejemplo.com', 'Clave1234');
      await waitFor(() => expect(window.location.pathname).toBe('/'));
      expect(screen.getByRole('heading', { level: 1, name: /HOTEL HUNAHP[UÚ]/i })).toBeInTheDocument();
    });

    it('empleado_operativo va a una cuenta mínima sin módulos ni datos ficticios', async () => {
      global.fetch = vi.fn().mockResolvedValue(loginResponse('empleado_operativo'));
      openLogin();
      await fillAndSubmit('persona@ejemplo.com', 'Clave1234');
      expect(await screen.findByRole('heading', { level: 1, name: /Mi cuenta/i })).toBeInTheDocument();
      expect(window.location.pathname).toBe('/cuenta');
      expect(screen.getByText(/Todavía no hay módulos habilitados/i)).toBeInTheDocument();
    });

    it('un cliente cuyo correo contiene "admin" no obtiene acceso al panel', async () => {
      global.fetch = vi.fn().mockResolvedValue(loginResponse('cliente'));
      openLogin();
      await fillAndSubmit('admin.fan@ejemplo.com', 'Clave1234');
      await waitFor(() => expect(window.location.pathname).toBe('/'));
    });

    it('rechaza un rol desconocido: no guarda la sesión ni da acceso', async () => {
      global.fetch = vi.fn().mockResolvedValue(loginResponse('superadmin'));
      openLogin();
      await fillAndSubmit('persona@ejemplo.com', 'Clave1234');

      expect(await screen.findByRole('alert')).toHaveTextContent(/rol válido/i);
      expect(tokenStorage.get()).toBeNull();
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('vuelve a la ruta que se intentaba visitar si el rol la permite', async () => {
    global.fetch = vi.fn().mockResolvedValue(loginResponse('admin'));
    openLogin({ from: '/admin/configuracion' });
    await fillAndSubmit('persona@ejemplo.com', 'Clave1234');
    await waitFor(() => expect(window.location.pathname).toBe('/admin/configuracion'));
  });

  it('muestra el mensaje del backend ante credenciales inválidas y no guarda sesión', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        errorResponse(401, 'INVALID_CREDENTIALS', 'Correo electrónico o contraseña incorrectos'),
      );
    openLogin();

    await fillAndSubmit('persona@ejemplo.com', 'incorrecta');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo o la contraseña no son correctos.',
    );
    expect(tokenStorage.get()).toBeNull();
  });

  it('muestra un mensaje claro cuando no hay conexión con el servidor', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    openLogin();

    await fillAndSubmit('persona@ejemplo.com', 'Clave1234');

    expect(await screen.findByRole('alert')).toHaveTextContent(/No fue posible conectar/i);
  });

  it('no ofrece recuperación de contraseña mientras el backend no la soporte', () => {
    openLogin();
    expect(screen.queryByText(/Olvidó su contraseña/i)).not.toBeInTheDocument();
  });

  it('la contraseña se puede mostrar u ocultar con un botón accesible', async () => {
    const user = userEvent.setup();
    openLogin();

    const password = screen.getByLabelText(/^Contraseña$/i);
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /Ver contraseña/i }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Ocultar contraseña/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
