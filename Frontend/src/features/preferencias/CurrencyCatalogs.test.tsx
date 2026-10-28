import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { PublicPreferencesProvider } from './PublicPreferences';
import { PublicTopBar } from '@/components/shared/PublicTopBar';
import { RoomCatalog } from '@/features/habitaciones/public/RoomCatalog';
import { CatalogoActividadesCliente } from '@/features/actividades/components/CatalogoActividadesCliente';
import { CatalogoBienestarList } from '@/features/bienestar/components/CatalogoBienestarList';
import { CatalogoSalonesList } from '@/features/eventos/components/CatalogoSalonesList';
import { jsonResponse } from '@/test/renderWithProviders';
import { AgregarServicioEventoModal } from '@/features/eventos/components/AgregarServicioEventoModal';
import { CurrencySelector } from './CurrencySelector';
import { tokenStorage } from '@/api/session';

vi.mock('@/features/auth/AuthContext', () => ({ useAuth: () => ({ user: null, status: 'anonymous' }) }));
const room = { id: 7, tipo: { id: 1, nombre: 'Suite', descripcion: null, capacidad_maxima: 4, tarifa_noche: '1250.00', imagen_url: null, imagen_creditos: null }, sucursal: { id: 1, nombre: 'Sede Centro' }, imagen_url: null, imagen_creditos: null };
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); tokenStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method && init.method !== 'GET') throw new Error('No mutation allowed in catalog test');
    const path = new URL(String(input), 'http://test').pathname;
    const data = path.endsWith('/sucursales') ? [{ id: 1, nombre: 'Sede Centro', ciudad: 'Guatemala', activa: true }]
      : path.endsWith('/public/habitaciones') ? [room]
      : path.endsWith('/tipos-habitacion') ? [room.tipo]
      : path.endsWith('/recursos-actividad') ? [{ id: 11, nombre: 'Kayak', sucursal_id: 1, tipo: 'kayak', precio_hora: 500, precio_equipo: 0, precio_instructor_hora: 0 }]
      : path.endsWith('/servicios-spa') ? [{ id: 12, nombre: 'Masaje', duracion_minutos: 60, precio: 780 }]
      : path.endsWith('/servicios-evento') ? [{ id: 14, nombre: 'Catering', precio: 780 }]
      : path.endsWith('/salones') ? [{ id: 13, nombre: 'Salón', sucursal_id: 1, tarifa_base: 2800, capacidad_maxima: 50 }] : [];
    return jsonResponse({ status: 'success', data });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear(); });
describe('Catálogos reales con respuestas HTTP simuladas', () => {
  it('las cuatro familias comerciales alternan con el mismo selector sin refetch ni conversiones acumuladas', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><LocaleProvider><PublicPreferencesProvider><PublicTopBar />
      <section aria-label="Habitaciones"><RoomCatalog /></section>
      <section aria-label="Actividades"><CatalogoActividadesCliente /></section>
      <section aria-label="Bienestar"><CatalogoBienestarList /></section>
      <section aria-label="Eventos"><CatalogoSalonesList /></section>
    </PublicPreferencesProvider></LocaleProvider></MemoryRouter></QueryClientProvider>);
    const values = [['Habitaciones', 'Q1,250.00', 'US$160.26'], ['Actividades', 'Q500.00', 'US$64.10'], ['Bienestar', 'Q780.00', 'US$100.00'], ['Eventos', 'Q2,800.00', 'US$358.97']];
    for (const [label, gtq] of values) expect(await within(screen.getByRole('region', { name: label })).findByText(gtq)).toBeInTheDocument();
    const count = vi.mocked(fetch).mock.calls.length;
    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Moneda de visualización' }), 'USD');
    for (const [label, gtq, usd] of values) {
      const scope = within(screen.getByRole('region', { name: label }));
      expect(scope.getByText(usd)).toBeInTheDocument(); expect(scope.queryByText(gtq)).not.toBeInTheDocument();
    }
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByRole('combobox', { name: 'Display currency' })).toHaveValue('USD');
    for (const [label, , usd] of values) expect(within(screen.getByRole('region', { name: label })).getByText(usd)).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Display currency' }), 'GTQ');
    for (const [label, gtq] of values) expect(within(screen.getByRole('region', { name: label })).getByText(gtq)).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.length).toBe(count);
    expect(room.tipo.tarifa_noche).toBe('1250.00');
  });
  it('convierte las opciones de servicios de evento sin cambiar su identificador', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><LocaleProvider><CurrencySelector /><AgregarServicioEventoModal reservaId={22} isOpen onClose={() => {}} /></LocaleProvider></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByRole('option', { name: 'Catering — Q780.00' })).toHaveValue('14');
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Moneda de visualización' }), 'USD');
    expect(screen.getByRole('option', { name: 'Catering — US$100.00' })).toHaveValue('14');
  });

});
