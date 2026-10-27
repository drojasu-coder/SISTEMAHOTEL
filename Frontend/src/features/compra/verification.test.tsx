import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { pagosApi } from '@/features/pagos/api/pagosApi';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { usePagoResultado } from '@/features/pagos/hooks/usePagoResultado';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { crearCarrito, crearItem, respuestaMe } from '@/features/carrito/pantalla-test-utils';
import { crearIntentoActivo } from '@/features/pagos/checkout-test-utils';
import { ApiError } from '@/api/client/http';
import type { Pago } from '@/features/pagos/types';
const payment: Pago = { id: 88, carrito_id: 10, reserva_habitacion_id: null, monto: 600, moneda: 'GTQ', estado: 'procesando', metodo: 'tarjeta', pasarela: 'stripe', tipo_pago: 'total', idempotency_key: 'test-key', id_transaccion_externo: 'pi_test', fecha_pago: null, codigo_error_externo: null, mensaje_error: null, createdAt: '', updatedAt: '' };
function Probe() { const query = usePagoResultado(88); return <><output data-testid="poll">{query.pollingPaused ? 'paused' : 'active'}</output><button onClick={() => { void query.refetch(); }}>Check</button></>; }
async function flush() { await act(async () => { await vi.advanceTimersByTimeAsync(25); }); }
beforeEach(() => {
  sessionStorage.clear(); tokenStorage.set('test-token'); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-26T18:00:00Z'));
  global.fetch = vi.fn().mockResolvedValue(respuestaMe(3));
  vi.spyOn(pagosApi, 'getById').mockResolvedValue(payment);
  vi.spyOn(pagosApi, 'create'); vi.spyOn(carritoApi, 'create');
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); sessionStorage.clear(); });
it('limita el sondeo a un minuto y exige una consulta manual para reanudarlo, sin POST', async () => {
  renderWithProviders(<Probe />); await flush();
  expect(pagosApi.getById).toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(65000); });
  expect(screen.getByTestId('poll')).toHaveTextContent('paused');
  const calls = vi.mocked(pagosApi.getById).mock.calls.length;
  expect(calls).toBeLessThanOrEqual(26);
  await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
  expect(pagosApi.getById).toHaveBeenCalledTimes(calls);
  fireEvent.click(screen.getByRole('button', { name: 'Check' })); await flush();
  expect(pagosApi.getById).toHaveBeenCalledTimes(calls + 1); expect(screen.getByTestId('poll')).toHaveTextContent('active');
  expect(pagosApi.create).not.toHaveBeenCalled();
});
it('el vencimiento verifica el pago en proceso y conserva su resultado sin ofrecer una compra nueva', async () => {
  const events: string[] = [];
  const expiry = new Date(Date.now() + 2000).toISOString();
  vi.spyOn(carritoApi, 'getCurrent').mockResolvedValueOnce(crearCarrito({ expira_en: expiry })).mockImplementation(async () => { events.push('cart'); throw new ApiError(404, 'Expired', { code: 'ACTIVE_CART_NOT_FOUND' }); });
  vi.spyOn(carritoApi, 'getItems').mockResolvedValue({ items: [crearItem()], total: 600 });
  vi.spyOn(pagosApi, 'getResumen').mockResolvedValue({ total: 600, saldo: 600, aprobado: 0, anticipo_requerido: 0 });
  vi.spyOn(pagosApi, 'getIntentoActivo').mockResolvedValue(crearIntentoActivo({ estado_intento: 'procesando', puede_confirmar: false, client_secret: null }));
  vi.mocked(pagosApi.getById).mockImplementation(async () => { events.push('payment'); return payment; });
  vi.spyOn(reservasApi, 'getById').mockRejectedValue(new Error('unavailable details'));
  renderWithProviders(<CheckoutPage />);
  for (let step = 0; step < 10 && vi.mocked(pagosApi.getById).mock.calls.length === 0; step++) await flush();
  expect(pagosApi.getById).toHaveBeenCalled();
  events.length = 0;
  await act(async () => { await vi.advanceTimersByTimeAsync(2500); }); await flush();
  expect(events.indexOf('payment')).toBeGreaterThanOrEqual(0); expect(events.indexOf('cart')).toBeGreaterThan(events.indexOf('payment'));
  expect(screen.getByText(/vencimiento del carrito no demuestra que el pago haya fallado/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver resultado del pago' })).toHaveAttribute('href', '/pagos/88/resultado');
  expect(screen.queryByRole('button', { name: 'Continuar al pago' })).not.toBeInTheDocument();
  expect(pagosApi.create).not.toHaveBeenCalled(); expect(carritoApi.create).not.toHaveBeenCalled();
});
