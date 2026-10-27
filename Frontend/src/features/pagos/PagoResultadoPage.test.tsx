import { formatReferenceMoney } from '@/lib/money';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import {
  renderWithProviders,
  jsonResponse,

  errorResponse,

} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { PagoResultadoPage } from '@/pages/PagoResultadoPage';
import {
  getOrCreateCheckoutIdempotencyKey,
  getStoredCheckoutAttempt,
  recordCheckoutPagoId,
} from './utils/idempotency';
import type { Pago } from './types';

const mockPagoAprobadoCarrito: Pago = {
  id: 10,
  carrito_id: 3,
  reserva_habitacion_id: null,
  monto: 2500,
  metodo: 'tarjeta',
  estado: 'aprobado',
  id_transaccion_externo: 'pi_stripe_12345',
  moneda: 'GTQ',
  tipo_pago: 'total',
  pasarela: 'stripe',
  idempotency_key: 'chk-u7-c3-key123',
  fecha_pago: '2026-10-22 14:30',
  codigo_error_externo: null,
  mensaje_error: null,
  createdAt: '2026-10-22T14:30:00Z',
  updatedAt: '2026-10-22T14:30:05Z',
};

const mockPagoRechazado: Pago = {
  id: 11,
  carrito_id: 3,
  reserva_habitacion_id: null,
  monto: 2500,
  metodo: 'tarjeta',
  estado: 'rechazado',
  id_transaccion_externo: 'pi_stripe_rechazado',
  moneda: 'GTQ',
  tipo_pago: 'total',
  pasarela: 'stripe',
  idempotency_key: 'chk-u7-c3-key123',
  fecha_pago: null,
  codigo_error_externo: 'card_declined',
  mensaje_error: 'Fondos insuficientes en la tarjeta.',
  createdAt: '2026-10-22T14:32:00Z',
  updatedAt: '2026-10-22T14:32:02Z',
};

const mockPagoCancelado: Pago = {
  id: 12,
  carrito_id: 3,
  reserva_habitacion_id: null,
  monto: 2500,
  metodo: 'tarjeta',
  estado: 'cancelado',
  id_transaccion_externo: null,
  moneda: 'GTQ',
  tipo_pago: 'total',
  pasarela: 'stripe',
  idempotency_key: 'chk-u7-c3-key123',
  fecha_pago: null,
  codigo_error_externo: null,
  mensaje_error: null,
  createdAt: '2026-10-22T14:35:00Z',
  updatedAt: '2026-10-22T14:35:01Z',
};

const mockPagoProcesando: Pago = {
  id: 13,
  carrito_id: 3,
  reserva_habitacion_id: null,
  monto: 2500,
  metodo: 'tarjeta',
  estado: 'procesando',
  id_transaccion_externo: 'pi_stripe_proc',
  moneda: 'GTQ',
  tipo_pago: 'total',
  pasarela: 'stripe',
  idempotency_key: 'chk-u7-c3-keyproc',
  fecha_pago: null,
  codigo_error_externo: null,
  mensaje_error: null,
  createdAt: '2026-10-22T14:40:00Z',
  updatedAt: '2026-10-22T14:40:01Z',
};

const mockPagoReservaDirecta: Pago = {
  id: 14,
  carrito_id: null, // carrito_id es NULL
  reserva_habitacion_id: 77,
  monto: 1250,
  metodo: 'tarjeta',
  estado: 'aprobado',
  id_transaccion_externo: 'pi_stripe_directo',
  moneda: 'GTQ',
  tipo_pago: 'anticipo',
  pasarela: 'stripe',
  idempotency_key: null,
  fecha_pago: '2026-10-22 15:00',
  codigo_error_externo: null,
  mensaje_error: null,
  createdAt: '2026-10-22T15:00:00Z',
  updatedAt: '2026-10-22T15:00:05Z',
};

function renderPagoResultado(pagoId = 10) {
  return renderWithProviders(
    <Routes>
      <Route path="/pagos/:id/resultado" element={<PagoResultadoPage />} />
      <Route path="/checkout" element={<div>Pantalla Checkout</div>} />
      <Route path="/mis-reservas" element={<div>Listado Mis Reservas</div>} />
      <Route path="/mis-reservas/:id" element={<div>Detalle Reserva</div>} />
    </Routes>,
    { route: `/pagos/${pagoId}/resultado` }
  );
}

describe('Pantalla de resultado del pago (PagoResultadoPage)', () => {
  let fetchCalls: Array<{ url: string; method?: string; body?: unknown }> = [];

  beforeEach(() => {
    window.sessionStorage.clear();
    tokenStorage.clear();
    vi.restoreAllMocks();
    fetchCalls = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
    window.sessionStorage.clear();
  });

  const setupMockApi = (options?: {
    role?: string;
    userId?: number;
    pagoMap?: Record<number, Pago>;
  }) => {
    const role = options?.role ?? 'cliente';
    const userId = options?.userId ?? 7;
    const pagoMap = options?.pagoMap ?? {
      10: mockPagoAprobadoCarrito,
      11: mockPagoRechazado,
      12: mockPagoCancelado,
      13: mockPagoProcesando,
      14: mockPagoReservaDirecta,
    };

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);
      fetchCalls.push({
        url: urlStr,
        method: config?.method ?? 'GET',
        body: config?.body,
      });

      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            data: { id: userId, nombre: 'Cliente Prueba', email: 'cliente@test.com', rol: role },
          })
        );
      }

      if (urlStr.endsWith('/carritos/actual')) return Promise.resolve(jsonResponse({ data: { id: 3, usuario_id: userId, estado: 'activo', expira_en: '2030-01-01T00:00:00Z' } }));
      if (/\/carritos\/3\/items$/.test(urlStr)) return Promise.resolve(jsonResponse({ data: { items: [], total: 2500 } }));
      const matchPago = urlStr.match(/\/pagos\/(\d+)$/);
      if (matchPago) {
        const id = Number(matchPago[1]);
        const pago = pagoMap[id];
        if (pago) {
          return Promise.resolve(
            jsonResponse({
              success: true,
              statusCode: 200,
              message: 'Pago obtenido',
              data: pago,
            })
          );
        }
        return Promise.resolve(errorResponse(404, 'NOT_FOUND', 'Pago no encontrado'));
      }

      return Promise.reject(new Error(`Endpoint no manejado: ${urlStr}`));
    });
  };

  it('1. restringe el acceso al cliente autenticado y bloquea consultas privadas a otros roles', async () => {
    tokenStorage.set('token-admin');
    setupMockApi({ role: 'admin' });

    renderPagoResultado(10);

    await waitFor(() => {
      expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
    });

    // Ninguna llamada a /api/pagos/10 debe haberse emitido
    const pagoFetch = fetchCalls.find((c) => c.url.includes('/pagos/10'));
    expect(pagoFetch).toBeUndefined();
  });

  it('2. utiliza claves de consulta con userId y consulta el pago del cliente autenticado', async () => {
    tokenStorage.set('token-cliente');
    setupMockApi({ role: 'cliente', userId: 7 });

    renderPagoResultado(10);

    await waitFor(() => {
      expect(screen.getByText('Pago aprobado')).toBeInTheDocument();
      expect(screen.getByText('#10')).toBeInTheDocument();
      expect(screen.getByText(formatReferenceMoney(2500, 'es')!)).toBeInTheDocument();
    });

    const pagoFetch = fetchCalls.find((c) => c.url.includes('/pagos/10'));
    expect(pagoFetch).toBeDefined();
  });

  it('3. implementa la presentación completa del estado cancelado', async () => {
    tokenStorage.set('token-cliente');
    setupMockApi({ role: 'cliente' });

    renderPagoResultado(12); // Pago 12 cancelado

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pago cancelado' })).toBeInTheDocument();
    });

    expect(
      screen.getByText('Este intento de pago ha sido cancelado o ha expirado sin completarse.')
    ).toBeInTheDocument();
    expect(screen.getByText('#12')).toBeInTheDocument();
    expect(screen.getByText(formatReferenceMoney(2500, 'es')!)).toBeInTheDocument();
    expect(screen.getByText('cancelado')).toBeInTheDocument();
  });

  it('4. el enlace desde un pago cancelado o rechazado regresa al checkout sin crear otro intento', async () => {
    tokenStorage.set('token-cliente');
    setupMockApi({ role: 'cliente' });

    // Caso Rechazado
    const { unmount } = renderPagoResultado(11);

    await waitFor(() => {
      expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
      expect(screen.getByText('Fondos insuficientes en la tarjeta.')).toBeInTheDocument();
    });

    const linkRechazado = await screen.findByRole('link', { name: /regresar al checkout/i });
    expect(linkRechazado).toHaveAttribute('href', '/checkout');

    // Comprobar que no se envió ningún POST para crear un nuevo pago
    const postCalls = fetchCalls.filter((c) => c.method === 'POST');
    expect(postCalls).toHaveLength(0);

    unmount();

    // Caso Cancelado
    renderPagoResultado(12);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pago cancelado' })).toBeInTheDocument();
    });

    const linkCancelado = await screen.findByRole('link', { name: /regresar al checkout/i });
    expect(linkCancelado).toHaveAttribute('href', '/checkout');

    // Sigue sin haber ningún POST automático
    const postCallsCancelado = fetchCalls.filter((c) => c.method === 'POST');
    expect(postCallsCancelado).toHaveLength(0);
  });

  it('5. antes de limpiar la clave guardada, comprueba que corresponde al pago mostrado: visitar un pago anterior no borra un intento posterior', async () => {
    tokenStorage.set('token-cliente');
    setupMockApi({ role: 'cliente', userId: 7 });

    // Simular que el usuario tiene un intento posterior guardado en sessionStorage (pagoId: 99 para carrito 3)
    getOrCreateCheckoutIdempotencyKey(7, 3, 2500);
    recordCheckoutPagoId(7, 3, 99);

    // El usuario visita el resultado de un pago anterior (pagoId: 10)
    renderPagoResultado(10);

    await waitFor(() => {
      expect(screen.getByText('Pago aprobado')).toBeInTheDocument();
    });

    // Como 10 != 99, la clave del intento posterior 99 NO debe borrarse
    const attempt = getStoredCheckoutAttempt(7, 3);
    expect(attempt).not.toBeNull();
    expect(attempt?.pagoId).toBe(99);
  });

  it('6. limpia la clave guardada cuando el pago mostrado coincide con el intento almacenado', async () => {
    tokenStorage.set('token-cliente');
    setupMockApi({ role: 'cliente', userId: 7 });

    // Guardar intento correspondiente exactamente al pago 10
    getOrCreateCheckoutIdempotencyKey(7, 3, 2500);
    recordCheckoutPagoId(7, 3, 10);

    renderPagoResultado(10);

    await waitFor(() => {
      expect(screen.getByText('Pago aprobado')).toBeInTheDocument();
    });

    // Al coincidir el ID de pago mostrado (10), la clave guardada sí se limpia
    await waitFor(() => {
      const attempt = getStoredCheckoutAttempt(7, 3);
      expect(attempt).toBeNull();
    });
  });

  it('7. si pago.carrito_id es null, no ejecuta utilidades de carrito e invalida el origen real (reserva)', async () => {
    tokenStorage.set('token-cliente');
    setupMockApi({ role: 'cliente', userId: 7 });

    // Simular intento guardado en carrito 3
    getOrCreateCheckoutIdempotencyKey(7, 3, 2500);
    recordCheckoutPagoId(7, 3, 99);

    // Pago 14 tiene carrito_id: null y reserva_habitacion_id: 77
    renderPagoResultado(14);

    await waitFor(() => {
      expect(screen.getByText('Pago aprobado')).toBeInTheDocument();
      expect(screen.getByText('#14')).toBeInTheDocument();
      expect(screen.getByText('Reserva #77')).toBeInTheDocument();
    });

    // Enlace al detalle de la reserva de habitación
    const linkReserva = screen.getByRole('link', { name: /ver detalle de la reserva/i });
    expect(linkReserva).toHaveAttribute('href', '/mis-reservas/77');

    // No debe haber tocado el storage del carrito 3
    const attempt = getStoredCheckoutAttempt(7, 3);
    expect(attempt).not.toBeNull();
    expect(attempt?.pagoId).toBe(99);
  });

  it('8. muestra estado procesando con sondeo activo y no muestra datos antiguos al cambiar de pago', async () => {
    tokenStorage.set('token-cliente');
    setupMockApi({ role: 'cliente' });

    renderPagoResultado(13); // Pago 13 procesando

    await waitFor(() => {
      expect(screen.getByText('Procesando transacción')).toBeInTheDocument();
      expect(screen.getByText(/Verificando el estado de la transacción en tiempo real/i)).toBeInTheDocument();
      expect(screen.getByText('#13')).toBeInTheDocument();
    });
  });
});
