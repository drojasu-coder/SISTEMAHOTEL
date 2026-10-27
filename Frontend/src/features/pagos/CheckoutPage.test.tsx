import React from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  errorResponse,
  renderWithProviders,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { CheckoutPage } from '@/pages/CheckoutPage';
import {
  crearCarrito,
  crearItem,
  instalarFetch,
  respuestaCarrito,
  respuestaItems,
  respuestaMe,
  type FetchCall,
} from '@/features/carrito/pantalla-test-utils';
import {
  crearIntentoActivo,
  respuestaCrearPago,
  respuestaIntento,
  respuestaPago,
  respuestaResumen,
} from './checkout-test-utils';
import type { IntentoActivoData } from './types';
import { textosCheckout } from './textos';
import {
  getOrCreateCheckoutIdempotencyKey,
  getStoredCheckoutAttempt,
  recordCheckoutPagoId,
} from './utils/idempotency';

const stripeMocks = vi.hoisted(() => ({
  confirmPayment: vi.fn(),
}));

vi.mock('@stripe/react-stripe-js', async () => {
  const ReactActual = await vi.importActual<typeof import('react')>('react');

  return {
    Elements: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(
        'div',
        { 'data-testid': 'stripe-elements' },
        children,
      ),
    PaymentElement: () =>
      ReactActual.createElement('div', { 'data-testid': 'payment-element' }),
    useStripe: () => ({ confirmPayment: stripeMocks.confirmPayment }),
    useElements: () => ({ mockElements: true }),
  };
});

vi.mock('@/features/pagos/utils/stripe', () => ({
  getStripe: () => Promise.resolve({ id: 'stripe-mock' }),
}));

const CARRITO_ACTUAL = '/carritos/actual';
const itemsUrl = '/carritos/10/items';
const resumenUrl = '/pagos/resumen?carrito_id=10';
const intentoUrl = '/pagos/intento-activo?carrito_id=10';
const pagoUrl = '/pagos/88';

const llamadas = (calls: FetchCall[], method: string, sufijo: string) =>
  calls.filter(
    (call) => call.method === method && call.url.endsWith(sufijo),
  );

const postsPago = (calls: FetchCall[]) =>
  calls.filter(
    (call) => call.method === 'POST' && call.url.endsWith('/pagos'),
  );

const responderBase = (
  call: FetchCall,
  opciones: {
    items?: ReturnType<typeof crearItem>[];
    total?: number;
    saldo?: number;
  } = {},
) => {
  if (call.url.endsWith('/auth/me')) return respuestaMe(3);
  if (call.url.endsWith(CARRITO_ACTUAL) && call.method === 'GET') {
    return respuestaCarrito(crearCarrito());
  }
  if (call.url.endsWith(itemsUrl) && call.method === 'GET') {
    return respuestaItems({
      items: opciones.items ?? [crearItem()],
      total: opciones.total ?? 600,
    });
  }
  if (call.url.endsWith(resumenUrl) && call.method === 'GET') {
    return respuestaResumen({
      total: opciones.total ?? 600,
      saldo: opciones.saldo ?? 600,
    });
  }
  return undefined;
};

describe('Checkout (CheckoutPage)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    tokenStorage.clear();
    window.sessionStorage.clear();
    stripeMocks.confirmPayment.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
    window.sessionStorage.clear();
    global.fetch = fetchOriginal;
  });

  it('no consulta ni crea pagos sin sesión', async () => {
    const { calls } = instalarFetch(() => undefined);

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByRole('heading', {
        name: textosCheckout.acceso.sinSesionTitulo,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: textosCheckout.acceso.iniciarSesion,
      }),
    ).toHaveAttribute('href', '/login');
    expect(calls).toHaveLength(0);
  });

  it('no consulta pagos con un rol fuera del alcance', async () => {
    tokenStorage.set('jwt-admin');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) {
        return respuestaMe(1, 'admin', 'Administradora Prueba');
      }
      return undefined;
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByRole('heading', {
        name: textosCheckout.acceso.rolTitulo,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: textosCheckout.acceso.irMiEspacio,
      }),
    ).toHaveAttribute('href', '/admin');
    expect(calls.some((call) => call.url.includes('/pagos'))).toBe(false);
  });

  it('no crea el intento al montar y usa el saldo del servidor al pulsar continuar', async () => {
    tokenStorage.set('jwt-cliente-3');
    let intentoActivo: IntentoActivoData | null = null;

    const { calls } = instalarFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/pagos')) {
        return respuestaCrearPago({ monto: 600 });
      }

      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(intentoActivo);
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago({ estado: 'procesando' });
      }

      return responderBase(call, {
        items: [crearItem({ precio: '999.99' })],
        total: 999.99,
        saldo: 600,
      });
    });

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    const botonPreparar = await screen.findByRole('button', {
      name: textosCheckout.pago.preparar,
    });

    // La pantalla solo consulta. El POST debe nacer de una acción explícita.
    expect(postsPago(calls)).toHaveLength(0);
    expect(
      screen.getByText(textosCheckout.pago.crearIntento),
    ).toBeInTheDocument();

    await user.click(botonPreparar);

    expect(
      await screen.findByTestId('payment-element'),
    ).toBeInTheDocument();

    const post = postsPago(calls);
    expect(post).toHaveLength(1);

    const cuerpo = JSON.parse(post[0].body ?? '{}') as Record<string, unknown>;
    expect(cuerpo).toMatchObject({
      carrito_id: 10,
      monto: 600,
      metodo: 'tarjeta',
      tipo_pago: 'total',
      moneda: 'GTQ',
    });
    expect(String(cuerpo.idempotency_key)).toMatch(/^chk-u3-c10-/);

    // El intento no se confirma por el simple hecho de crear el formulario.
    expect(stripeMocks.confirmPayment).not.toHaveBeenCalled();
  });

  it('confirma con Stripe y solo muestra aprobado cuando el servidor lo confirma', async () => {
    tokenStorage.set('jwt-cliente-3');
    let pagoAprobado = false;
    let intentoActivo: IntentoActivoData | null = null;

    stripeMocks.confirmPayment.mockImplementation(async () => {
      pagoAprobado = true;
      intentoActivo = crearIntentoActivo({
        estado_local: 'aprobado',
        estado_intento: 'completado_en_pasarela',
        puede_confirmar: false,
        client_secret: null,
      });
      return { paymentIntent: { status: 'succeeded' } };
    });

    const { calls } = instalarFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/pagos')) {
        intentoActivo = crearIntentoActivo();
        return respuestaCrearPago();
      }

      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(intentoActivo);
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago({
          estado: pagoAprobado ? 'aprobado' : 'procesando',
        });
      }

      return responderBase(call);
    });

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await user.click(
      await screen.findByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    );

    await screen.findByTestId('payment-element');
    await user.click(
      screen.getByRole('button', {
        name: textosCheckout.pago.confirmar,
      }),
    );

    expect(
      await screen.findByText(textosCheckout.estados.exitoTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(textosCheckout.estados.confirmacionEnviada),
    ).not.toBeInTheDocument();

    expect(stripeMocks.confirmPayment).toHaveBeenCalledTimes(1);
    const argumentos = stripeMocks.confirmPayment.mock.calls[0][0] as {
      redirect?: string;
      confirmParams?: { return_url?: string };
    };
    expect(argumentos.redirect).toBe('if_required');
    expect(argumentos.confirmParams?.return_url).toContain(
      '/pagos/88/resultado',
    );

    // El resultado del SDK no se trata como aprobación: fue necesario que
    // GET /pagos/88 devolviera estado aprobado.
    expect(postsPago(calls)).toHaveLength(1);
    expect(getStoredCheckoutAttempt(3, 10)).toBeNull();
  });

  it('no muestra aprobado si Stripe confirma pero el backend sigue procesando', async () => {
    tokenStorage.set('jwt-cliente-3');
    let confirmado = false;
    stripeMocks.confirmPayment.mockImplementation(async () => {
      confirmado = true;
      return { paymentIntent: { status: 'succeeded' } };
    });

    const { calls } = instalarFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/pagos')) {
        return respuestaCrearPago();
      }

      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(
          confirmado
            ? crearIntentoActivo({
                estado_local: 'procesando',
                estado_pasarela: 'processing',
                estado_intento: 'procesando',
                puede_confirmar: false,
              })
            : null,
        );
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago({ estado: 'procesando' });
      }

      return responderBase(call);
    });

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await user.click(
      await screen.findByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    );

    await user.click(
      await screen.findByRole('button', {
        name: textosCheckout.pago.confirmar,
      }),
    );

    expect(
      await screen.findByText(textosCheckout.estados.procesandoTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(textosCheckout.estados.exitoTitulo),
    ).not.toBeInTheDocument();
    expect(stripeMocks.confirmPayment).toHaveBeenCalledTimes(1);
    expect(postsPago(calls)).toHaveLength(1);
  });

  it('bloquea la confirmación cuando el intento recuperado no coincide con el saldo', async () => {
    tokenStorage.set('jwt-cliente-3');

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(crearIntentoActivo({ monto: 500 }));
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago();
      }

      return responderBase(call, { saldo: 600 });
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(
        textosCheckout.errores.montoDifiereTitulo,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        textosCheckout.errores.intentoMonto('Q500.00'),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        textosCheckout.errores.saldoActual('Q600.00'),
      ),
    ).toBeInTheDocument();

    expect(screen.queryByTestId('payment-element')).not.toBeInTheDocument();
    expect(stripeMocks.confirmPayment).not.toHaveBeenCalled();
    expect(postsPago(calls)).toHaveLength(0);
  });

  it('compara el importe aunque el backend serialice el saldo como texto', async () => {
    tokenStorage.set('jwt-cliente-3');

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(crearIntentoActivo({ monto: 500 }));
      }

      if (call.url.endsWith(resumenUrl)) {
        return respuestaResumen({
          total: 600,
          saldo: '600.00' as unknown as number,
        });
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago();
      }

      return responderBase(call);
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(textosCheckout.errores.montoDifiereTitulo),
    ).toBeInTheDocument();
    expect(
      screen.getByText(textosCheckout.errores.saldoActual('Q600.00')),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('payment-element')).not.toBeInTheDocument();
    expect(postsPago(calls)).toHaveLength(0);
  });

  it('recupera un intento cuyo importe coincide con el saldo y permite confirmarlo', async () => {
    tokenStorage.set('jwt-cliente-3');

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(crearIntentoActivo({ monto: 600 }));
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago();
      }

      return responderBase(call, { saldo: 600 });
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByTestId('payment-element'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: textosCheckout.pago.confirmar,
      }),
    ).toBeInTheDocument();
    expect(postsPago(calls)).toHaveLength(0);
    expect(stripeMocks.confirmPayment).not.toHaveBeenCalled();
  });

  it('bloquea un nuevo intento si la clave guardada pertenece a otro importe', async () => {
    tokenStorage.set('jwt-cliente-3');
    getOrCreateCheckoutIdempotencyKey(3, 10, 500);

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(null);
      }

      return responderBase(call, { saldo: 600 });
    });

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await user.click(
      await screen.findByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    );

    expect(
      await screen.findByText(
        textosCheckout.errores.montoDifiereTitulo,
      ),
    ).toBeInTheDocument();
    expect(postsPago(calls)).toHaveLength(0);
    expect(stripeMocks.confirmPayment).not.toHaveBeenCalled();
    expect(getStoredCheckoutAttempt(3, 10)?.monto).toBe(500);
  });

  it('ante PAYMENT_EXCEEDS_BALANCE reconsulta intento y resumen sin crear otro cobro', async () => {
    tokenStorage.set('jwt-cliente-3');
    const claveInicial = getOrCreateCheckoutIdempotencyKey(3, 10, 600).key;
    let intentoActivo: IntentoActivoData | null = null;

    const { calls } = instalarFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/pagos')) {
        intentoActivo = crearIntentoActivo({
          estado_local: 'procesando',
          estado_pasarela: 'processing',
          estado_intento: 'procesando',
          puede_confirmar: false,
        });
        return errorResponse(
          409,
          'PAYMENT_EXCEEDS_BALANCE',
          'El pago excede el saldo pendiente',
        );
      }

      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(intentoActivo);
      }

      return responderBase(call, { saldo: 600 });
    });

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await user.click(
      await screen.findByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    );

    expect(
      await screen.findByText(textosCheckout.errores.conflictoTitulo),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(textosCheckout.estados.procesandoTitulo),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(textosCheckout.estados.exitoTitulo),
    ).not.toBeInTheDocument();
    expect(postsPago(calls)).toHaveLength(1);
    expect(llamadas(calls, 'GET', intentoUrl).length).toBeGreaterThanOrEqual(
      2,
    );
    expect(llamadas(calls, 'GET', resumenUrl).length).toBeGreaterThanOrEqual(
      2,
    );

    const guardado = getStoredCheckoutAttempt(3, 10);
    expect(guardado?.monto).toBe(600);
    expect(guardado?.key).toBe(claveInicial);
  });

  it('muestra el intento cancelado sin habilitar otro cobro', async () => {
    tokenStorage.set('jwt-cliente-3');

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(
          crearIntentoActivo({
            estado_local: 'cancelado',
            estado_intento: 'cancelado',
            puede_confirmar: false,
            client_secret: null,
          }),
        );
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago({ estado: 'cancelado' });
      }

      return responderBase(call);
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(
        textosCheckout.resumen.titulo,
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(textosCheckout.estados.canceladoTitulo),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('payment-element')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    ).not.toBeInTheDocument();
    expect(postsPago(calls)).toHaveLength(0);
  });

  it('muestra un error de recuperación y permite reintentar sin crear un cobro', async () => {
    tokenStorage.set('jwt-cliente-3');
    let intentos = 0;

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        intentos += 1;
        if (intentos === 1) {
          return errorResponse(
            502,
            'STRIPE_UNAVAILABLE',
            'No fue posible consultar Stripe',
          );
        }
        return respuestaIntento(null);
      }

      return responderBase(call);
    });

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(textosCheckout.errores.recuperacionTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: textosCheckout.comprobarEstado,
      }),
    );

    expect(
      await screen.findByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    ).toBeInTheDocument();

    expect(intentos).toBe(2);
    expect(postsPago(calls)).toHaveLength(0);
  });

  it('recupera el pago guardado y muestra aprobado aunque falle el intento activo', async () => {
    tokenStorage.set('jwt-cliente-3');
    getOrCreateCheckoutIdempotencyKey(3, 10, 600);
    recordCheckoutPagoId(3, 10, 88);

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        return errorResponse(
          502,
          'STRIPE_UNAVAILABLE',
          'No fue posible consultar Stripe',
        );
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago({ estado: 'aprobado' });
      }

      return responderBase(call);
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(textosCheckout.estados.exitoTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(textosCheckout.errores.recuperacionTitulo),
    ).not.toBeInTheDocument();
    expect(postsPago(calls)).toHaveLength(0);
    expect(getStoredCheckoutAttempt(3, 10)).toBeNull();
  });

  it('no habilita otro cobro si el pago guardado sigue en proceso', async () => {
    tokenStorage.set('jwt-cliente-3');
    getOrCreateCheckoutIdempotencyKey(3, 10, 600);
    recordCheckoutPagoId(3, 10, 88);

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(null);
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago({ estado: 'procesando' });
      }

      return responderBase(call);
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(textosCheckout.estados.procesandoTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    ).not.toBeInTheDocument();
    expect(postsPago(calls)).toHaveLength(0);
  });

  it('bloquea si no puede recuperar el pago guardado', async () => {
    tokenStorage.set('jwt-cliente-3');
    getOrCreateCheckoutIdempotencyKey(3, 10, 600);
    recordCheckoutPagoId(3, 10, 88);

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(null);
      }

      if (call.url.endsWith(pagoUrl)) {
        return errorResponse(
          502,
          'PAYMENT_LOOKUP_FAILED',
          'No fue posible consultar el pago',
        );
      }

      return responderBase(call);
    });

    renderWithProviders(<CheckoutPage />);

    expect(
      await screen.findByText(textosCheckout.errores.recuperacionTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    ).not.toBeInTheDocument();
    expect(postsPago(calls)).toHaveLength(0);
  });

  it('no reintenta automáticamente el POST ante un fallo de red', async () => {
    tokenStorage.set('jwt-cliente-3');

    const { calls } = instalarFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/pagos')) {
        return Promise.reject(new Error('network down'));
      }

      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(null);
      }

      return responderBase(call);
    });

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await user.click(
      await screen.findByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    );

    expect(
      await screen.findByText(textosCheckout.errores.crearRed),
    ).toBeInTheDocument();

    await waitFor(() => expect(postsPago(calls)).toHaveLength(1));
    expect(
      screen.getByRole('button', {
        name: textosCheckout.comprobarEstado,
      }),
    ).toBeInTheDocument();
  });

  it('mantiene el formulario y muestra el error cuando la tarjeta es rechazada', async () => {
    tokenStorage.set('jwt-cliente-3');
    stripeMocks.confirmPayment.mockResolvedValue({
      error: { type: 'card_error', message: 'Your card was declined.' },
    });

    const { calls } = instalarFetch((call) => {
      if (call.method === 'POST' && call.url.endsWith('/pagos')) {
        return respuestaCrearPago();
      }

      if (call.url.endsWith(intentoUrl)) {
        return respuestaIntento(null);
      }

      if (call.url.endsWith(pagoUrl)) {
        return respuestaPago();
      }

      return responderBase(call);
    });

    const user = userEvent.setup();
    renderWithProviders(<CheckoutPage />);

    await user.click(
      await screen.findByRole('button', {
        name: textosCheckout.pago.preparar,
      }),
    );

    await user.click(
      await screen.findByRole('button', {
        name: textosCheckout.pago.confirmar,
      }),
    );

    expect(
      await screen.findByText(textosCheckout.errores.tarjetaRechazada),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: textosCheckout.pago.confirmar,
      }),
    ).toBeInTheDocument();
    expect(stripeMocks.confirmPayment).toHaveBeenCalledTimes(1);
    expect(postsPago(calls)).toHaveLength(1);
  });
});
