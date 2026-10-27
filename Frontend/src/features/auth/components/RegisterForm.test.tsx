import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { tokenStorage } from '@/api/session';
import { errorResponse, jsonResponse, loginResponse } from '@/test/renderWithProviders';

const created = jsonResponse(
  {
    success: true,
    statusCode: 201,
    data: { id: 9, nombre: 'Persona Prueba', email: 'persona@ejemplo.com', telefono: null, rol: 'cliente', activo: true },
  },
  201,
);

async function fillForm(overrides: Partial<Record<'nombre' | 'email' | 'telefono' | 'password', string>> = {}) {
  const user = userEvent.setup();
  const values = {
    nombre: 'Persona Prueba',
    email: 'persona@ejemplo.com',
    telefono: '',
    password: 'Clave1234',
    ...overrides,
  };
  await user.type(screen.getByLabelText(/^Nombre completo$/i), values.nombre);
  await user.type(screen.getByLabelText(/^Correo electrónico$/i), values.email);
  if (values.telefono) await user.type(screen.getByLabelText(/^Teléfono/i), values.telefono);
  await user.type(screen.getByLabelText(/^Contraseña$/i), values.password);
  await user.click(screen.getByRole('button', { name: /Crear cuenta/i }));
}

describe('Registro de clientes (fetch simulado)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    window.history.replaceState(null, '', '/registro');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('valida en el cliente las reglas de contraseña del backend', async () => {
    global.fetch = vi.fn();
    render(<App />);

    await fillForm({ password: 'corta' });

    expect(await screen.findByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('envía solo los campos permitidos (sin rol) y luego inicia sesión', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(created)
      .mockResolvedValueOnce(loginResponse('cliente'));
    render(<App />);

    await fillForm();

    await waitFor(() => expect(tokenStorage.get()).toBe('jwt-de-prueba'));
    const [registerUrl, registerConfig] = (global.fetch as any).mock.calls[0];
    expect(registerUrl).toMatch(/\/auth\/register$/);
    expect(JSON.parse(registerConfig.body)).toEqual({
      nombre: 'Persona Prueba',
      email: 'persona@ejemplo.com',
      password: 'Clave1234',
    });
    await waitFor(() => expect(window.location.pathname).toBe('/'));
  });

  it('muestra el conflicto cuando el correo ya está registrado', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        errorResponse(409, 'EMAIL_ALREADY_REGISTERED', 'El correo electrónico ya se encuentra registrado'),
      );
    render(<App />);

    await fillForm();

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya se encuentra registrado/i);
    expect(tokenStorage.get()).toBeNull();
  });

  it('si la cuenta se crea pero falla el inicio de sesión, lo indica sin duplicar el registro', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(created)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<App />);

    await fillForm();

    expect(await screen.findByText(/Su cuenta fue creada/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Inicie sesión/i })).toHaveAttribute('href', '/login');
    expect(tokenStorage.get()).toBeNull();
  });
});
