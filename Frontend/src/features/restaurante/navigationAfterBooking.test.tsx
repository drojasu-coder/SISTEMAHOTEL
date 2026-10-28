import { afterEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthContext';
import { PublicPreferencesProvider } from '@/features/preferencias/PublicPreferences';
import { jsonResponse, meResponse } from '@/test/renderWithProviders';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { tokenStorage } from '@/api/session';
import { CatalogoRestauranteCliente } from './components/CatalogoRestauranteCliente';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); tokenStorage.clear(); });
it.each([
  ['Ver detalle de la reserva', 'Detalle de mesa #88'],
  ['Ir a Mis Reservas de Restaurante', 'Listado de mesas propias'],
])('tras abrir desde el catálogo, %s conserva el destino aunque el panel se cierre', async (action, target) => {
  localStorage.clear(); sessionStorage.clear(); tokenStorage.set('qa-client');
  global.fetch = vi.fn(async (input, init) => {
    const url = String(input);
    if (url.endsWith('/auth/me')) return meResponse('cliente');
    if (url.endsWith('/sucursales')) return jsonResponse({ data: [{ id: 1, nombre: 'Sede QA', activa: true }] });
    if (url.endsWith('/mesas')) return jsonResponse({ data: [{ id: 11, zona: 'Patio QA', capacidad: 4, sucursal_id: 1, estado: 'disponible' }] });
    if (url.endsWith('/restaurantes')) return jsonResponse({ data: [] });
    if (url.endsWith('/reservas-mesa') && init?.method === 'POST') return jsonResponse({ data: { id: 88, usuario_id: 3, mesa_id: 11, fecha: '2030-11-20', hora: '14:30', numero_comensales: 2, estado: 'confirmada' } }, 201);
    throw new Error(`Unexpected request: ${url}`);
  });
  window.history.replaceState({}, '', '/restaurante');
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><AuthProvider><BrowserRouter><LocaleProvider><PublicPreferencesProvider><Routes>
    <Route path="/restaurante" element={<CatalogoRestauranteCliente />} />
    <Route path="/mis-reservas/restaurante/88" element={<h1>Detalle de mesa #88</h1>} />
    <Route path="/mis-reservas/restaurante" element={<h1>Listado de mesas propias</h1>} />
  </Routes></PublicPreferencesProvider></LocaleProvider></BrowserRouter></AuthProvider></QueryClientProvider>);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Ver y reservar' }));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Confirmar reserva' })).toBeEnabled());
  fireEvent.change(within(dialog).getByLabelText('Fecha de la reserva'), { target: { value: '2030-11-20' } });
  fireEvent.change(within(dialog).getByLabelText('Horario de la reserva'), { target: { value: '14:30' } });
  fireEvent.submit(dialog.querySelector('form')!);
  await user.click(await screen.findByRole('button', { name: action }));
  // history.go entrega popstate de forma asíncrona en BrowserRouter.
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
  await waitFor(() => expect(screen.getByRole('heading', { name: target })).toBeInTheDocument());
  expect(vi.mocked(fetch).mock.calls.filter(([url, init]) => String(url).endsWith('/reservas-mesa') && init?.method === 'POST')).toHaveLength(1);
});
