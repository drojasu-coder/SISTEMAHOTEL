import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { tokenStorage } from '@/api/session';
import { errorResponse, jsonResponse, loginResponse } from '@/test/renderWithProviders';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { habitacionesApi } from '@/features/habitaciones/api/habitacionesApi';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { saveRoomDraft } from './reservationDraft';
const path = '/habitaciones?sede=1&fecha_entrada=2030-01-01&fecha_salida=2030-01-03&numero_huespedes=3&buscar=1';
function open(pathname: string, state?: unknown) { window.history.replaceState(state ? { usr: state } : null, '', pathname); return render(<App />); }
function credentials() {
  fireEvent.change(screen.getByLabelText(/^Correo electrónico$/), { target: { value: 'qa@example.test' } });
  fireEvent.change(screen.getByLabelText(/^Contraseña$/), { target: { value: '  Password123  ' } });
}
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); localStorage.setItem('hunahpu.public-site.v1', '1');
  vi.spyOn(sedesApi, 'getAll').mockResolvedValue([{ id: 1, nombre: 'Antigua', ciudad: 'Antigua Guatemala', direccion: null, telefono: null, activa: true }]);
  vi.spyOn(habitacionesApi, 'getAll').mockResolvedValue([]);
  vi.spyOn(reservasApi, 'getDisponibilidad').mockResolvedValue([]);
  global.fetch = vi.fn().mockImplementation((url: string) => Promise.resolve(url.endsWith('/auth/login') ? loginResponse('cliente') : jsonResponse({ data: [] })));
});
afterEach(() => { vi.restoreAllMocks(); tokenStorage.clear(); sessionStorage.clear(); localStorage.clear(); window.history.replaceState(null, '', '/'); });
describe('Acceso público y continuidad (HTTP simulado)', () => {
  it('va desde 3A a login y registro, conserva selección y vuelve consultando sin POST de negocio', async () => {
    const user = userEvent.setup(); open(path);
    await user.click(await screen.findByRole('link', { name: 'Ingresar y continuar' }));
    expect(screen.getByText('Inicie sesión para confirmar su reserva. Su selección se conserva.')).toBeInTheDocument();
    expect(screen.queryByTestId('public-top-bar')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Registrarse como cliente' }));
    expect(screen.getByText(/Su selección se conserva/)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Iniciar sesión/i }));
    credentials(); await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe(path));
    await waitFor(() => expect(reservasApi.getDisponibilidad).toHaveBeenCalledWith({ sucursal_id: 1, fecha_entrada: '2030-01-01', fecha_salida: '2030-01-03', numero_huespedes: 3 }));
    const posts = vi.mocked(fetch).mock.calls.filter(([, config]) => config?.method === 'POST');
    expect(posts.map(([url]) => url)).toEqual([expect.stringContaining('/auth/login')]);
    expect(JSON.parse(posts[0][1]!.body as string).password).toBe('  Password123  ');
  });
  it('el registro crea la cuenta, hace un login separado y vuelve a la selección sin mutaciones de negocio', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => Promise.resolve(
      url.endsWith('/auth/register') ? jsonResponse({ data: { id: 7, nombre: 'Prueba', email: 'qa@example.test', telefono: null, rol: 'cliente', activo: true } }, 201)
      : url.endsWith('/auth/login') ? loginResponse('cliente') : jsonResponse({ data: [] }),
    ));
    open('/registro', { from: path });
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Prueba Unicode 李' } });
    credentials();
    await userEvent.setup().click(screen.getByRole('button', { name: /Crear cuenta/i }));
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe(path));
    await waitFor(() => expect(reservasApi.getDisponibilidad).toHaveBeenCalled());
    const posts = vi.mocked(fetch).mock.calls.filter(([, config]) => config?.method === 'POST');
    expect(posts.map(([url]) => url)).toEqual([expect.stringContaining('/auth/register'), expect.stringContaining('/auth/login')]);
  });
  it('si el login posterior al registro falla, el enlace de ingreso conserva la selección', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/auth/login')) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve(jsonResponse({ data: { id: 7, nombre: 'Prueba', email: 'qa@example.test', telefono: null, rol: 'cliente', activo: true } }, 201));
    });
    open('/registro', { from: path });
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Prueba' } });
    credentials();
    await userEvent.setup().click(screen.getByRole('button', { name: /Crear cuenta/i }));
    await userEvent.setup().click(await screen.findByRole('link', { name: 'Inicie sesión' }));
    expect(window.location.pathname).toBe('/login');
    expect(window.history.state.usr).toEqual({ from: path });
    expect(screen.getByText(/Su selección se conserva/)).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });
  it('una sesión expirada conserva los criterios y presenta el motivo traducible al entrar', async () => {
    tokenStorage.set('expired-test');
    global.fetch = vi.fn().mockImplementation((url: string) => Promise.resolve(url.endsWith('/auth/me') ? errorResponse(401, 'TOKEN_EXPIRED', 'x') : jsonResponse({ data: [] })));
    open(path);
    await userEvent.setup().click(await screen.findByRole('link', { name: 'Ingresar y continuar' }));
    expect(screen.getByText(/Su sesión finalizó/)).toBeInTheDocument();
    expect(screen.getByText(/Su selección se conserva/)).toBeInTheDocument();
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByText(/Your session has expired/)).toBeInTheDocument();
    expect(screen.getByText(/Your selection is saved/)).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
    expect(vi.mocked(fetch).mock.calls.every(([, config]) => config?.method !== 'POST')).toBe(true);
  });
  it('restaura tras recarga y no revive borradores para destinos explícitos rechazados', async () => {
    saveRoomDraft(path); const mounted = open('/login');
    expect(screen.getByText(/Su selección se conserva/)).toBeInTheDocument(); mounted.unmount();
    open('/login', { from: '//evil.test' });
    expect(screen.queryByText(/Su selección se conserva/)).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('link', { name: /Registrarse/ }));
    expect(screen.queryByText(/Su selección se conserva/)).not.toBeInTheDocument();
  });
  it('conserva una contraseña pegada, no duplica peticiones y bloquea el envío pendiente', async () => {
    let resolve!: (response: Response) => void;
    global.fetch = vi.fn().mockImplementation(() => new Promise<Response>((done) => { resolve = done; }));
    open('/login'); const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText(/^Correo electrónico$/), { target: { value: 'qa@example.test' } });
    const password = screen.getByLabelText(/^Contraseña$/);
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    await user.click(password); await user.paste('  Password123  ');
    const submit = screen.getByRole('button', { name: 'Iniciar Sesión' });
    fireEvent.submit(submit.closest('form')!); fireEvent.submit(submit.closest('form')!);
    await waitFor(() => expect(submit).toBeDisabled());
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).password).toBe('  Password123  ');
    await act(async () => resolve(errorResponse(429, 'RATE_LIMIT_EXCEEDED', 'limit')));
    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos');
  });
  it('traduce inmediatamente credenciales y validaciones al cambiar idioma', async () => {
    global.fetch = vi.fn().mockResolvedValue(errorResponse(401, 'INVALID_CREDENTIALS', 'x'));
    open('/login'); credentials();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Iniciar Sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El correo o la contraseña no son correctos.');
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByRole('alert')).toHaveTextContent('The email address or password is incorrect.');
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: '' } });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Email address is required')).toBeInTheDocument();
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'es');
    expect(await screen.findByText('El correo electrónico es obligatorio')).toBeInTheDocument();
  });
});
