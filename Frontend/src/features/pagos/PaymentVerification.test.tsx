import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ApiError } from '@/api/client/http';
import { tokenStorage } from '@/api/session';
import { renderWithProviders } from '@/test/renderWithProviders';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { crearCarrito, crearItem, respuestaMe } from '@/features/carrito/pantalla-test-utils';
import { crearIntentoActivo, crearPago } from './checkout-test-utils';
import { pagosApi } from './api/pagosApi';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PagoResultadoPage } from '@/pages/PagoResultadoPage';
import { PublicCartLink } from '@/components/shared/PublicCartLink';

let paid = false;
const payment = () => crearPago({ estado: paid ? 'aprobado' : 'procesando' });
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); tokenStorage.set('verification-test'); paid = false;
  global.fetch = vi.fn().mockResolvedValue(respuestaMe(3));
  vi.spyOn(carritoApi, 'getCurrent').mockImplementation(async () => {
    if (paid) throw new ApiError(404, 'Sin carrito activo', { code: 'ACTIVE_CART_NOT_FOUND' });
    return crearCarrito();
  });
  vi.spyOn(carritoApi, 'getItems').mockResolvedValue({ items: [crearItem()], total: 600 });
  vi.spyOn(carritoApi, 'create'); vi.spyOn(pagosApi, 'create');
  vi.spyOn(pagosApi, 'getResumen').mockImplementation(async () => ({ total: 600, saldo: paid ? 0 : 600, aprobado: paid ? 600 : 0, anticipo_requerido: 0 }));
  vi.spyOn(pagosApi, 'getIntentoActivo').mockImplementation(async () => paid ? null : crearIntentoActivo({ estado_intento: 'completado_en_pasarela', estado_pasarela: 'succeeded', puede_confirmar: false, client_secret: null }));
  vi.spyOn(pagosApi, 'getById').mockImplementation(async () => payment());
  vi.spyOn(pagosApi, 'verify').mockImplementation(async () => { paid = true; return payment(); });
});
afterEach(() => { vi.restoreAllMocks(); tokenStorage.clear(); localStorage.clear(); sessionStorage.clear(); });
function mount(path: string) {
  return renderWithProviders(<Routes><Route path="/checkout" element={<CheckoutPage />} /><Route path="/pagos/:id/resultado" element={<PagoResultadoPage />} /></Routes>, { route: path });
}

it('la verificación explícita termina en el resultado aunque el carrito pagado deje de ser activo', async () => {
  mount('/checkout');
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Comprobar estado' }));
  expect(await screen.findByRole('heading', { name: 'Pago aprobado' })).toBeInTheDocument();
  expect(screen.queryByText('No tiene un carrito activo')).not.toBeInTheDocument();
  expect(pagosApi.verify).toHaveBeenCalledTimes(1); expect(pagosApi.verify).toHaveBeenCalledWith(88);
  expect(pagosApi.getById).toHaveBeenCalledWith(88);
  expect(pagosApi.create).not.toHaveBeenCalled(); expect(carritoApi.create).not.toHaveBeenCalled();
});

it('el resultado consulta sin escribir al montar y verifica solo al pulsar Reintentar', async () => {
  mount('/pagos/88/resultado');
  await screen.findByRole('heading', { name: 'Procesando transacción' });
  expect(pagosApi.verify).not.toHaveBeenCalled();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar consulta' }));
  expect(await screen.findByRole('heading', { name: 'Pago aprobado' })).toBeInTheDocument();
  expect(pagosApi.verify).toHaveBeenCalledTimes(1); expect(pagosApi.verify).toHaveBeenCalledWith(88); expect(pagosApi.create).not.toHaveBeenCalled();
});

it('un fallo de verificación conserva el estado pendiente sin afirmar aprobación', async () => {
  vi.mocked(pagosApi.verify).mockRejectedValue(new ApiError(502, 'No fue posible consultar el estado del pago en Stripe', { code: 'STRIPE_RETRIEVAL_FAILED' }));
  mount('/pagos/88/resultado');
  await screen.findByRole('heading', { name: 'Procesando transacción' });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar consulta' }));
  await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
  expect(screen.queryByRole('heading', { name: 'Pago aprobado' })).not.toBeInTheDocument();
  expect(pagosApi.create).not.toHaveBeenCalled();
});

it('el contrato real ACTIVE_CART_NOT_FOUND muestra carrito vacío sin error en la navegación', async () => {
  paid = true;
  renderWithProviders(<PublicCartLink />);
  expect(await screen.findByRole('link', { name: 'Carrito: 0 artículos' })).toBeInTheDocument();
  expect(screen.queryByText('!')).not.toBeInTheDocument(); expect(carritoApi.create).not.toHaveBeenCalled();
});
