import { PublicPreferencesProvider } from '@/features/preferencias/PublicPreferences';
import { SiteSelector } from '@/features/preferencias/SiteSelector';
import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';

interface Options {
  route?: string | { pathname: string; state?: unknown };
  queryClient?: QueryClient;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** Envuelve la UI con router en memoria, TanStack Query y la sesión real (AuthProvider). */
export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', queryClient = createTestQueryClient() }: Options = {},
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

/** Respuesta fetch simulada (solo para pruebas con mocks). */
export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: () => 'application/json' },
    json: async () => body,
  } as unknown as Response;
}

export const meResponse = (rol: string, nombre = 'Persona Prueba') =>
  jsonResponse({
    success: true,
    statusCode: 200,
    data: { id: 3, nombre, email: 'persona@ejemplo.com', telefono: null, rol, activo: true },
  });

export const loginResponse = (rol: string, nombre = 'Persona Prueba') =>
  jsonResponse({
    success: true,
    statusCode: 200,
    data: {
      accessToken: 'jwt-de-prueba',
      usuario: { id: 7, nombre, email: 'persona@ejemplo.com', telefono: null, rol },
    },
  });

export const errorResponse = (status: number, code: string, message: string) =>
  jsonResponse({ success: false, statusCode: status, code, message }, status);

/** Contexto público real para pruebas de consumidores; no afecta los módulos administrativos. */
export function renderPublicWithProviders(ui: React.ReactElement, options?: Options) {
  return renderWithProviders(<PublicPreferencesProvider><SiteSelector />{ui}</PublicPreferencesProvider>, options);
}
