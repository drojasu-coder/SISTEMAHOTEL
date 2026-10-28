import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureSessionSync, tokenStorage } from '@/api/session';
import { AuthProvider, useAuth } from './AuthContext';
import { jsonResponse, meResponse } from '@/test/renderWithProviders';

/**
 * Sesión entre pestañas: la "otra pestaña" se simula con un BroadcastChannel real del
 * mismo nombre (en jsdom ambas comparten sessionStorage, por eso no se usan dos proveedores).
 */
const CHANNEL = 'hunapu.session';

function Estado() {
  const { status, user, logout } = useAuth();
  return <div>
    <output aria-label="estado">{status}</output>
    <output aria-label="usuario">{user?.rol ?? ''}</output>
    <button onClick={logout}>Salir</button>
  </div>;
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuthProvider><Estado /></AuthProvider></QueryClientProvider>);
}

let otraPestana: BroadcastChannel;
beforeEach(() => {
  sessionStorage.clear();
  configureSessionSync({ enabled: true, timeoutMs: 200 });
  otraPestana = new BroadcastChannel(CHANNEL);
  global.fetch = vi.fn(async () => meResponse('admin')) as typeof fetch;
});
afterEach(() => {
  otraPestana.close();
  configureSessionSync({ enabled: false });
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('Sesión compartida entre pestañas', () => {
  it('una pestaña nueva sin token recibe la sesión de otra abierta y la valida con /auth/me', async () => {
    otraPestana.onmessage = (event) => {
      if (event.data?.type === 'request') otraPestana.postMessage({ type: 'share', id: event.data.id, token: 'jwt-compartido' });
    };
    mount();
    expect(screen.getByLabelText('estado')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByLabelText('estado')).toHaveTextContent('authenticated'));
    expect(screen.getByLabelText('usuario')).toHaveTextContent('admin');
    expect(tokenStorage.get()).toBe('jwt-compartido');
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer jwt-compartido');
  });

  it('sin otras pestañas abiertas queda anónima tras la espera y no consulta al servidor', async () => {
    mount();
    await waitFor(() => expect(screen.getByLabelText('estado')).toHaveTextContent('anonymous'));
    expect(fetch).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toBeNull();
  });

  it('una sesión compartida que el servidor rechaza no deja entrar', async () => {
    otraPestana.onmessage = (event) => {
      if (event.data?.type === 'request') otraPestana.postMessage({ type: 'share', id: event.data.id, token: 'jwt-vencido' });
    };
    global.fetch = vi.fn(async () => jsonResponse({ success: false, code: 'TOKEN_EXPIRED', message: 'expirado' }, 401)) as typeof fetch;
    mount();
    await waitFor(() => expect(screen.getByLabelText('estado')).toHaveTextContent('anonymous'));
    expect(tokenStorage.get()).toBeNull();
  });

  it('cerrar sesión en otra pestaña la cierra aquí y descarta el token', async () => {
    tokenStorage.set('jwt-propio');
    mount();
    await waitFor(() => expect(screen.getByLabelText('estado')).toHaveTextContent('authenticated'));
    act(() => otraPestana.postMessage({ type: 'logout' }));
    await waitFor(() => expect(screen.getByLabelText('estado')).toHaveTextContent('anonymous'));
    expect(tokenStorage.get()).toBeNull();
  });

  it('cerrar sesión aquí se anuncia a las demás pestañas', async () => {
    tokenStorage.set('jwt-propio');
    const recibidos: unknown[] = [];
    otraPestana.onmessage = (event) => recibidos.push(event.data);
    mount();
    await waitFor(() => expect(screen.getByLabelText('estado')).toHaveTextContent('authenticated'));
    act(() => screen.getByRole('button', { name: 'Salir' }).click());
    await waitFor(() => expect(recibidos).toContainEqual({ type: 'logout' }));
    expect(tokenStorage.get()).toBeNull();
  });

  it('una pestaña con sesión responde a la petición de otra pestaña nueva', async () => {
    tokenStorage.set('jwt-propio');
    mount();
    await waitFor(() => expect(screen.getByLabelText('estado')).toHaveTextContent('authenticated'));
    const respuesta = new Promise((resolve) => { otraPestana.onmessage = (event) => { if (event.data?.type === 'share') resolve(event.data); }; });
    otraPestana.postMessage({ type: 'request', id: 'pestana-nueva' });
    await expect(respuesta).resolves.toEqual({ type: 'share', id: 'pestana-nueva', token: 'jwt-propio' });
  });
});
