import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { CurrencySelector } from '@/features/preferencias/CurrencySelector';
import { tokenStorage } from '@/api/session';
import { MisReservasPage } from '@/pages/MisReservasPage';
import { DetalleReservaHabitacionPage } from '@/pages/DetalleReservaHabitacionPage';
import { crearReserva, instalarFetch, respuestaDetalle, respuestaLista, respuestaMe } from './test-utils';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); tokenStorage.set('qa-customer'); });
afterEach(() => { vi.restoreAllMocks(); tokenStorage.clear(); localStorage.clear(); });
it('conserva el importe persistido y la reserva al cambiar ES/EN, GTQ/USD y entrar al detalle', async () => {
  const reservation = crearReserva({ total: '1250.00' });
  const { calls } = instalarFetch(call => {
    if (call.url.endsWith('/auth/me')) return respuestaMe(3);
    if (call.url.endsWith('/reservas-habitacion')) return respuestaLista([reservation]);
    if (call.url.endsWith('/reservas-habitacion/12')) return respuestaDetalle(reservation);
    return undefined;
  });
  renderWithProviders(<LocaleProvider><LanguageSelector /><CurrencySelector /><Routes>
    <Route path="/mis-reservas" element={<MisReservasPage />} />
    <Route path="/mis-reservas/:id" element={<DetalleReservaHabitacionPage />} />
  </Routes></LocaleProvider>, { route: '/mis-reservas' });
  await screen.findByRole('link', { name: 'Ver detalle de la reserva 12' });
  const user = userEvent.setup();
  await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Display currency' }), 'USD');
  expect(screen.getByRole('heading', { name: 'My reservations' })).toBeInTheDocument();
  expect(screen.getByText('Confirmed')).toBeInTheDocument();
  expect(screen.getByText('US$160.26')).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'View reservation 12 details' }));
  await screen.findByRole('heading', { name: 'Reservation #12' });
  expect(screen.getByText('US$160.26')).toBeInTheDocument();
  expect(screen.getByText('Dec 5, 2026')).toBeInTheDocument();
  expect(screen.getByText('4 nights')).toBeInTheDocument();
  await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'es');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Moneda de visualización' }), 'GTQ');
  expect(screen.getByRole('heading', { name: 'Reserva #12' })).toBeInTheDocument();
  expect(screen.getByText('Q1,250.00')).toBeInTheDocument();
  expect(calls.every(c => c.method === 'GET')).toBe(true);
});
