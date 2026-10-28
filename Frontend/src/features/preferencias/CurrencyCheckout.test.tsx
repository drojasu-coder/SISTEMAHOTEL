import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PagoResultadoCard } from '@/features/pagos/components/PagoResultadoCard';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { renderWithProviders, errorResponse } from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { CurrencySelector } from './CurrencySelector';
import { CURRENCY_KEY } from './storage';
import { crearCarrito, crearItem, instalarFetch, respuestaCarrito, respuestaItems, respuestaMe } from '@/features/carrito/pantalla-test-utils';
import { crearPago, crearIntentoActivo, respuestaCrearPago, respuestaIntento, respuestaResumen } from '@/features/pagos/checkout-test-utils';

const stripe = vi.hoisted(() => ({ confirmPayment: vi.fn() }));
vi.mock('@stripe/react-stripe-js', () => ({ Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, PaymentElement: () => <div data-testid="payment-element" />, useStripe: () => stripe, useElements: () => ({}) }));
vi.mock('@/features/pagos/utils/stripe', () => ({ getStripe: () => Promise.resolve({ id: 'mock' }) }));
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); tokenStorage.clear(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); tokenStorage.clear(); localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals(); });
describe('Separación entre visualización y procesamiento (HTTP y Stripe simulados)', () => {
  it('muestra USD sin cambiar el monto GTQ, la petición ni la confirmación de Stripe', async () => {
    localStorage.setItem(CURRENCY_KEY, 'USD'); tokenStorage.set('test-client'); let active = false;
    const { calls } = instalarFetch(call => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith('/carritos/actual')) return respuestaCarrito(crearCarrito());
      if (call.url.endsWith('/carritos/10/items')) return respuestaItems({ items: [crearItem({ precio: '1250.00' })], total: 1250 });
      if (call.url.includes('/pagos/resumen?')) return respuestaResumen({ total: 1250, saldo: 1250 });
      if (call.url.includes('/pagos/intento-activo?')) return respuestaIntento(active ? crearIntentoActivo({ monto: 1250 }) : null);
      if (call.url.endsWith('/pagos') && call.method === 'POST') { active = true; return respuestaCrearPago({ monto: 1250 }); }
      return errorResponse(404, 'NOT_FOUND', 'No encontrado');
    });
    renderWithProviders(<LocaleProvider><CurrencySelector /><CheckoutPage /></LocaleProvider>);
    const prepare = await screen.findByRole('button', { name: 'Continuar al pago' });
    expect(screen.getAllByText('US$160.26').length).toBeGreaterThan(0);
    expect(screen.getByText(/El cobro se procesa en GTQ/)).toBeInTheDocument();
    expect(calls.filter(call => call.method === 'POST')).toHaveLength(0);
    await userEvent.setup().click(prepare);
    await screen.findByTestId('payment-element');
    const posts = calls.filter(call => call.method === 'POST' && call.url.endsWith('/pagos'));
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0].body!)).toMatchObject({ carrito_id: 10, monto: 1250, moneda: 'GTQ', metodo: 'tarjeta' });
    expect(screen.getByRole('button', { name: /Q1,250\.00.*GTQ/ })).toBeInTheDocument();
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Moneda de visualización' }), 'GTQ');
    await waitFor(() => expect(screen.getAllByText('Q1,250.00').length).toBeGreaterThan(0));
    expect(calls.filter(call => call.method === 'POST')).toHaveLength(1);
    expect(stripe.confirmPayment).not.toHaveBeenCalled();
  });
  it('muestra un pago aprobado en su moneda original aunque la preferencia sea USD', () => {
    localStorage.setItem(CURRENCY_KEY, 'USD');
    renderWithProviders(<LocaleProvider><CurrencySelector /><PagoResultadoCard pago={crearPago({ monto: 1250, estado: 'aprobado', moneda: 'GTQ' })} /></LocaleProvider>);
    expect(screen.getByRole('combobox')).toHaveValue('USD');
    expect(screen.getByText('Q1,250.00')).toBeInTheDocument();
    expect(screen.queryByText('US$160.26')).not.toBeInTheDocument();
  });
});
