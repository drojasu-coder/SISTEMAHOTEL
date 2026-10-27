import { authApi } from '@/features/auth/api/authApi';
import { useAuth } from '@/features/auth/AuthContext';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LocaleProvider, LanguageSelector } from '@/i18n/LocaleContext';
import { tokenStorage } from '@/api/session';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { pagosApi } from '@/features/pagos/api/pagosApi';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { eventosApi } from '@/features/eventos/api/eventosApi';
import { PagoResultadoPage } from '@/pages/PagoResultadoPage';
import { CarritoPage } from '@/pages/CarritoPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { crearCarrito, crearItem, respuestaMe } from '@/features/carrito/pantalla-test-utils';
import { crearIntentoActivo } from '@/features/pagos/checkout-test-utils';
import type { Pago } from '@/features/pagos/types';
import { roomCalendar } from './calendar';
const payment: Pago = { id: 88, carrito_id: 10, reserva_habitacion_id: null, monto: 900, metodo: 'tarjeta', estado: 'aprobado', id_transaccion_externo: 'pi_test', moneda: 'GTQ', tipo_pago: 'total', pasarela: 'stripe', idempotency_key: 'test-key', fecha_pago: '2026-10-26T12:00:00Z', codigo_error_externo: null, mensaje_error: null, createdAt: '2026-10-26T12:00:00Z', updatedAt: '2026-10-26T12:00:00Z' };
const room = { id: 12, usuario_id: 3, habitacion_id: 7, fecha_entrada: '2030-01-01', fecha_salida: '2030-01-03', numero_huespedes: 2, estado: 'pendiente' as const, total: '9999.00', createdAt: '', updatedAt: '', Habitacion: { id: 7, numero: '107', sucursal_id: 1, tipo_habitacion_id: 1, estado: 'ocupada' as const, Sucursal: { id: 1, nombre: 'Sede verificable' } } };
function mount(path = '/carrito') { return renderWithProviders(<LocaleProvider><LanguageSelector /><Routes><Route path="/carrito" element={<CarritoPage />} /><Route path="/checkout" element={<CheckoutPage />} /><Route path="/pagos/:id/resultado" element={<PagoResultadoPage />} /></Routes></LocaleProvider>, { route: path }); }
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); tokenStorage.set('qa-token');
  global.fetch = vi.fn().mockResolvedValue(respuestaMe(3));
  vi.spyOn(carritoApi, 'getCurrent').mockResolvedValue(crearCarrito());
  vi.spyOn(carritoApi, 'getItems').mockResolvedValue({ items: [crearItem({ precio: '600.00' }), crearItem({ id: 502, tipo_item: 'evento', referencia_id: 6, descripcion: 'Evento reservado', precio: '300.00' })], total: 900 });
  vi.spyOn(carritoApi, 'create').mockResolvedValue(crearCarrito());
  vi.spyOn(carritoApi, 'removeItem').mockResolvedValue(undefined);
  vi.spyOn(pagosApi, 'getResumen').mockResolvedValue({ total: 900, saldo: 900, aprobado: 0, anticipo_requerido: 0 });
  vi.spyOn(pagosApi, 'getIntentoActivo').mockResolvedValue(null);
  vi.spyOn(pagosApi, 'getById').mockResolvedValue(payment);
  vi.spyOn(pagosApi, 'create').mockResolvedValue({ pago_id: 88, estado: 'procesando', monto: 900, moneda: 'GTQ' });
  vi.spyOn(reservasApi, 'getById').mockResolvedValue(room);
  vi.spyOn(reservasApi, 'getDisponibilidad').mockResolvedValue([]);
  vi.spyOn(reservasApi, 'create').mockResolvedValue(room);
  vi.spyOn(eventosApi, 'getReservaById').mockResolvedValue({ id: 6, usuario_id: 3, salon_id: 2, tipo_evento: 'boda', fecha: '2030-01-04', hora_inicio: '14:00', hora_fin: '16:00', numero_invitados: 20, estado: 'cotizacion', anticipo: 100, total: 300 });
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); sessionStorage.clear(); });
describe('Compra 3C: datos autorizados y acciones explícitas', () => {
  it('compra mixta: muestra detalles reales, total del servidor y no prueba disponibilidad contra la propia reserva', async () => {
    mount();
    expect(await screen.findByText('Sede verificable')).toBeInTheDocument();
    expect(await screen.findByText('Evento reservado')).toBeInTheDocument();
    expect(screen.getByText(/Q 900.00 · ≈ US\$ 115.38/)).toBeInTheDocument();
    expect(screen.queryByText(/9999/)).not.toBeInTheDocument();
    expect(reservasApi.getDisponibilidad).not.toHaveBeenCalled();
    expect(pagosApi.create).not.toHaveBeenCalled(); expect(carritoApi.create).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Nueva búsqueda con estas fechas' })).toHaveAttribute('href', expect.stringContaining('/habitaciones?'));
    expect(screen.getByText(/no modifica ni cancela su reserva actual/)).toBeInTheDocument();
  });
  it.each(['processing', 'sin_identificador', 'unknown', 'network'])('bloquea retiradas ante intento %s o consulta incierta sin generar otro', async (kind) => {
    if (kind === 'network') vi.mocked(pagosApi.getIntentoActivo).mockRejectedValue(new Error('network'));
    else vi.mocked(pagosApi.getIntentoActivo).mockResolvedValue(crearIntentoActivo({ estado_pasarela: kind, payment_intent_id: kind === 'sin_identificador' ? null : 'pi_test' }));
    mount(); await screen.findByText('Sede verificable');
    expect(screen.getByRole('button', { name: 'Retirar artículo #501' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Consultar o recuperar pago' })).toHaveAttribute('href', '/checkout');
    expect(carritoApi.removeItem).not.toHaveBeenCalled(); expect(pagosApi.create).not.toHaveBeenCalled();
  });
  it('confirma con nombre y retira sin cancelar; los mensajes cambian inmediatamente a inglés', async () => {
    mount(); const user = userEvent.setup(); const remove = await screen.findByRole('button', { name: 'Retirar artículo #501' });
    await waitFor(() => expect(remove).toBeEnabled()); await user.click(remove);
    const modal = screen.getByRole('dialog'); expect(within(modal).getByText(/Reserva de habitación #12/)).toBeInTheDocument();
    expect(within(modal).getByText(/no cancela su reserva/)).toBeInTheDocument();
    await user.click(within(modal).getByRole('button', { name: 'Retirar del carrito' }));
    expect(await screen.findByText('Se retiró el artículo del carrito.')).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByText('The item was removed from the cart.')).toBeInTheDocument();
    expect(carritoApi.removeItem).toHaveBeenCalledTimes(1); expect(carritoApi.removeItem).toHaveBeenCalledWith(10, 501); expect(reservasApi.create).not.toHaveBeenCalled();
    expect(vi.mocked(fetch).mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true);
  });
  it('los datos de cuenta permanecen al volver entre carrito y pago y se aíslan al cambiar de usuario', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({ accessToken: 'qa-user-4', usuario: { id: 4, nombre: 'Cuenta B 李', email: 'cuenta-b@example.test', telefono: '+34612345678', rol: 'cliente' } });
    vi.mocked(carritoApi.getCurrent).mockResolvedValueOnce(crearCarrito()).mockResolvedValue(crearCarrito({ id: 20, usuario_id: 4 }));
    vi.mocked(carritoApi.getItems).mockImplementation(async (id) => ({ items: [crearItem({ carrito_id: id, referencia_id: id === 10 ? 12 : 13, descripcion: id === 10 ? 'Reserva cuenta A' : 'Reserva cuenta B' })], total: 900 }));
    vi.mocked(reservasApi.getById).mockImplementation(async (id) => ({ ...room, id, usuario_id: id === 12 ? 3 : 4 }));
    function ChangeAccount() { const { login } = useAuth(); return <button onClick={() => { void login({ email: 'cuenta-b@example.test', password: 'qa-password' }); }}>Cambiar cuenta</button>; }
    renderWithProviders(<LocaleProvider><ChangeAccount /><Routes><Route path="/checkout" element={<CheckoutPage />} /><Route path="/carrito" element={<CarritoPage />} /></Routes></LocaleProvider>, { route: '/checkout' });
    await screen.findByText('cliente-3@ejemplo.com');
    const user = userEvent.setup(); await user.click(screen.getByRole('button', { name: 'Cambiar cuenta' }));
    expect(await screen.findByText('cuenta-b@example.test')).toBeInTheDocument();
    expect(screen.queryByText('cliente-3@ejemplo.com')).not.toBeInTheDocument(); expect(screen.queryByText('Reserva cuenta A')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Carrito' })); await screen.findByRole('heading', { name: 'Su carrito' });
    await user.click(screen.getByRole('link', { name: 'Continuar al pago' }));
    expect(await screen.findByText('cuenta-b@example.test')).toBeInTheDocument();
    expect(JSON.stringify(sessionStorage)).not.toContain('cuenta-b@example.test');
    expect(pagosApi.create).not.toHaveBeenCalled(); expect(reservasApi.create).not.toHaveBeenCalled();
  });
  it('confirmación directa y recarga usan el carrito histórico, sin creaciones ni catálogo actual para el importe', async () => {
    const first = mount('/pagos/88/resultado');
    expect(await screen.findByRole('heading', { name: 'Pago aprobado' })).toBeInTheDocument();
    expect(await screen.findByText('Sede verificable')).toBeInTheDocument();
    expect(carritoApi.getItems).toHaveBeenCalledWith(10); expect(carritoApi.getCurrent).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Ver reserva #12' })).toHaveAttribute('href', '/mis-reservas/12');
    expect(screen.getByRole('link', { name: 'Ver reserva #6' })).toHaveAttribute('href', '/mis-reservas/eventos/6');
    expect(screen.getAllByText(/Estado de la reserva: Pendiente/).length).toBeGreaterThan(0);
    first.unmount(); mount('/pagos/88/resultado'); await screen.findByRole('heading', { name: 'Pago aprobado' });
    expect(pagosApi.create).not.toHaveBeenCalled(); expect(reservasApi.create).not.toHaveBeenCalled(); expect(carritoApi.create).not.toHaveBeenCalled();
  });
  it('copia la referencia real del pago sin crear ni enviar otro recurso', async () => {
    mount('/pagos/88/resultado'); await screen.findByRole('heading', { name: 'Pago aprobado' });
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar referencia de pago' }));
      expect(await screen.findByText('Referencia copiada.')).toBeInTheDocument();
      expect(writeText).toHaveBeenCalledTimes(1); expect(writeText).toHaveBeenCalledWith('Pago #88');
      expect(pagosApi.create).not.toHaveBeenCalled(); expect(carritoApi.create).not.toHaveBeenCalled();
    } finally {
      if (original) Object.defineProperty(navigator, 'clipboard', original);
      else delete (navigator as unknown as { clipboard?: Clipboard }).clipboard;
    }
  });
  it('un pago histórico rechazado no conduce al checkout de un carrito nuevo', async () => {
    vi.mocked(pagosApi.getById).mockResolvedValue({ ...payment, estado: 'rechazado' });
    vi.mocked(carritoApi.getCurrent).mockResolvedValue(crearCarrito({ id: 20 }));
    mount('/pagos/88/resultado'); await waitFor(() => expect(carritoApi.getCurrent).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: 'Regresar al checkout' })).not.toBeInTheDocument();
    expect(pagosApi.create).not.toHaveBeenCalled();
  });
  it('muestra solo el contacto de la cuenta; no inventa un formulario fiscal ni un paso Datos', async () => {
    mount('/checkout'); await screen.findByText('Contacto de su cuenta');
    expect(screen.getByText('cliente-3@ejemplo.com')).toBeInTheDocument();
    expect(screen.queryByLabelText(/NIT|DPI|pasaporte|dirección fiscal/i)).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Recorrido de compra' }).querySelector('[aria-current="step"]')).toHaveTextContent('Pago');
    expect(pagosApi.create).not.toHaveBeenCalled();
  });
});
it('calendario local: fechas reales, salida exclusiva, Unicode y estado tentativo sin inferir horarios', () => {
  const data = roomCalendar({ id: 12, arrival: '2030-01-01', departure: '2030-01-03', title: 'Estancia 李, Antigua', state: 'pendiente' });
  expect(data).toContain('DTSTART;VALUE=DATE:20300101'); expect(data).toContain('DTEND;VALUE=DATE:20300103'); expect(data).toContain('STATUS:TENTATIVE'); expect(data).toContain('李\\, Antigua');
  expect(roomCalendar({ id: 12, arrival: '2030-02-31', departure: '2030-03-03', title: 'x', state: 'pendiente' })).toBeNull();
});
