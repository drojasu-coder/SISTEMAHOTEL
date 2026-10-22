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
import { useAuth } from '@/features/auth/AuthContext';
import { CarritoPage } from '@/pages/CarritoPage';
import { textosCarrito } from './textos';
import {
  crearCarrito,
  crearItem,
  instalarFetch,
  respuestaCarrito,
  respuestaItems,
  respuestaLogin,
  respuestaMe,
  sinContenido,
  type FetchCall,
} from './pantalla-test-utils';

const CARRITO_ACTUAL = '/carritos/actual';
const itemsUrl = (carritoId: number) => `/carritos/${carritoId}/items`;
const itemUrl = (carritoId: number, itemId: number) =>
  `/carritos/${carritoId}/items/${itemId}`;

const DESCRIPCION_INICIAL =
  'Reserva de habitación #12 (2026-12-05 a 2026-12-09)';
const DESCRIPCION_EVENTO = 'Evento boda - 2026-12-01';
const DESCRIPCION_OTRO_USUARIO =
  'Reserva de habitación #99 (2027-01-10 a 2027-01-12)';

const llamadas = (calls: FetchCall[], method: string, sufijo: string) =>
  calls.filter(
    (call) => call.method === method && call.url.endsWith(sufijo),
  );

const crearEvento = () =>
  crearItem({
    id: 502,
    tipo_item: 'evento',
    referencia_id: 6,
    descripcion: DESCRIPCION_EVENTO,
    precio: '300.00',
  });

describe('Carrito (CarritoPage)', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
    global.fetch = fetchOriginal;
  });

  it('muestra los artículos, los importes y el total del servidor sin recalcularlo', async () => {
    tokenStorage.set('jwt-cliente-3');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (
        call.url.endsWith(CARRITO_ACTUAL) &&
        call.method === 'GET'
      ) {
        return respuestaCarrito(crearCarrito());
      }
      if (
        call.url.endsWith(itemsUrl(10)) &&
        call.method === 'GET'
      ) {
        return respuestaItems({
          items: [crearItem(), crearEvento()],
          // No coincide con la suma de los precios: debe mostrarse el total
          // persistido por el servidor, no uno recalculado en el cliente.
          total: 999.99,
        });
      }
      return undefined;
    });

    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: textosCarrito.titulo,
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();
    expect(screen.getByText(DESCRIPCION_EVENTO)).toBeInTheDocument();
    expect(screen.getByText('Habitación')).toBeInTheDocument();
    expect(screen.getByText('Evento')).toBeInTheDocument();
    expect(screen.getByText('Q625.50')).toBeInTheDocument();
    expect(screen.getByText('Q300.00')).toBeInTheDocument();
    expect(screen.getByText('Q999.99')).toBeInTheDocument();
    expect(
      screen.getByText(textosCarrito.notaTotal),
    ).toBeInTheDocument();
    expect(screen.queryByText('Pagado')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/saldo pendiente/i),
    ).not.toBeInTheDocument();

    const enlaceReserva = screen.getByRole('link', {
      name: textosCarrito.verReserva(12),
    });
    expect(enlaceReserva).toHaveAttribute('href', '/mis-reservas/12');
    expect(
      screen.queryByRole('link', {
        name: textosCarrito.verReserva(6),
      }),
    ).not.toBeInTheDocument();

    expect(llamadas(calls, 'GET', CARRITO_ACTUAL)).toHaveLength(1);
    expect(llamadas(calls, 'GET', itemsUrl(10))).toHaveLength(1);
  });

  it('muestra el estado vacío sin crear un carrito cuando no hay carrito activo', async () => {
    tokenStorage.set('jwt-cliente-3');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (
        call.url.endsWith(CARRITO_ACTUAL) &&
        call.method === 'GET'
      ) {
        return errorResponse(
          404,
          'ACTIVE_CART_NOT_FOUND',
          'El usuario no tiene un carrito activo',
        );
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(textosCarrito.sinCarritoTitulo),
    ).toBeInTheDocument();

    const enlacesReservar = screen.getAllByRole('link', {
      name: textosCarrito.reservar,
    });
    expect(enlacesReservar.length).toBeGreaterThan(0);
    expect(
      enlacesReservar.every(
        (enlace) => enlace.getAttribute('href') === '/reservar',
      ),
    ).toBe(true);

    const enlacesMisReservas = screen.getAllByRole('link', {
      name: textosCarrito.irMisReservas,
    });
    expect(enlacesMisReservas.length).toBeGreaterThan(0);
    expect(
      enlacesMisReservas.every(
        (enlace) =>
          enlace.getAttribute('href') === '/mis-reservas',
      ),
    ).toBe(true);

    expect(
      calls.filter(
        (call) =>
          call.method === 'POST' && call.url.endsWith('/carritos'),
      ),
    ).toHaveLength(0);

    const consultasIniciales = llamadas(
      calls,
      'GET',
      CARRITO_ACTUAL,
    ).length;

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.actualizar,
      }),
    );

    await waitFor(() =>
      expect(llamadas(calls, 'GET', CARRITO_ACTUAL)).toHaveLength(
        consultasIniciales + 1,
      ),
    );
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(
      0,
    );
  });

  it('no consulta el carrito mientras se restaura la sesión', async () => {
    tokenStorage.set('jwt-cliente-3');
    let resolverMe!: (respuesta: Response) => void;
    const mePendiente = new Promise<Response>((resolve) => {
      resolverMe = resolve;
    });

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return mePendiente;
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        return respuestaItems({
          items: [crearItem()],
          total: 625.5,
        });
      }
      return undefined;
    });

    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(
        textosCarrito.acceso.verificandoSesion,
      ),
    ).toBeInTheDocument();
    expect(llamadas(calls, 'GET', CARRITO_ACTUAL)).toHaveLength(0);

    resolverMe(respuestaMe(3));

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();
    expect(llamadas(calls, 'GET', CARRITO_ACTUAL)).toHaveLength(1);
  });

  it('no consulta ni muestra un carrito sin sesión', async () => {
    const { calls } = instalarFetch(() => undefined);

    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByRole('heading', {
        name: textosCarrito.acceso.sinSesionTitulo,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: textosCarrito.acceso.iniciarSesion,
      }),
    ).toHaveAttribute('href', '/login');
    expect(calls).toHaveLength(0);
  });

  it('no consulta el carrito con un rol fuera del alcance', async () => {
    tokenStorage.set('jwt-admin');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) {
        return respuestaMe(1, 'admin', 'Administradora Prueba');
      }
      return undefined;
    });

    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByRole('heading', {
        name: textosCarrito.acceso.rolTitulo,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: textosCarrito.acceso.irMiEspacio,
      }),
    ).toHaveAttribute('href', '/admin');
    expect(
      calls.some((call) => call.url.includes('/carritos')),
    ).toBe(false);
  });

  it('retira el artículo con el carrito y el ID correctos, maneja HTTP 204 y refresca', async () => {
    tokenStorage.set('jwt-cliente-3');
    let retirado = false;

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        return respuestaItems(
          retirado
            ? { items: [crearEvento()], total: 777.77 }
            : {
                items: [crearItem(), crearEvento()],
                total: 925.5,
              },
        );
      }
      if (
        call.url.endsWith(itemUrl(10, 501)) &&
        call.method === 'DELETE'
      ) {
        retirado = true;
        return sinContenido();
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.retirarArticulo(501),
      }),
    );

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(textosCarrito.confirmarHabitacion),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.confirmarRetirar,
      }),
    );

    await waitFor(() =>
      expect(llamadas(calls, 'DELETE', itemUrl(10, 501))).toHaveLength(
        1,
      ),
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByText(textosCarrito.retiroExito),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByText(DESCRIPCION_INICIAL),
      ).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('Q777.77')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        llamadas(calls, 'GET', itemsUrl(10)).length,
      ).toBeGreaterThan(1),
    );

    expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(
      1,
    );
    expect(
      calls.some(
        (call) =>
          call.method === 'DELETE' &&
          call.url.includes('/reservas-habitacion'),
      ),
    ).toBe(false);
  });

  it('bloquea envíos duplicados mientras la retirada está en curso', async () => {
    tokenStorage.set('jwt-cliente-3');
    let resolverDelete!: (respuesta: Response) => void;
    const deletePendiente = new Promise<Response>((resolve) => {
      resolverDelete = resolve;
    });
    let retirado = false;

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        return respuestaItems(
          retirado
            ? { items: [], total: 0 }
            : { items: [crearItem()], total: 625.5 },
        );
      }
      if (
        call.url.endsWith(itemUrl(10, 501)) &&
        call.method === 'DELETE'
      ) {
        return deletePendiente;
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.retirarArticulo(501),
      }),
    );

    const confirmar = screen.getByRole('button', {
      name: textosCarrito.confirmarRetirar,
    });
    await user.click(confirmar);

    await waitFor(() => expect(confirmar).toBeDisabled());
    expect(confirmar).toHaveAttribute('aria-busy', 'true');

    const botonesRetirar = screen.getAllByRole('button', {
      name: /^Retirar artículo #/,
    });
    expect(
      botonesRetirar.every(
        (boton) => (boton as HTMLButtonElement).disabled,
      ),
    ).toBe(true);

    await user.click(confirmar);
    await user.click(botonesRetirar[0]);

    expect(llamadas(calls, 'DELETE', itemUrl(10, 501))).toHaveLength(1);

    retirado = true;
    resolverDelete(sinContenido());

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('ante un fallo de red al retirar, refresca el estado y no repite el DELETE', async () => {
    tokenStorage.set('jwt-cliente-3');
    let consultasItems = 0;

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        consultasItems += 1;
        return respuestaItems({
          items: [crearItem()],
          total: 625.5,
        });
      }
      if (
        call.url.endsWith(itemUrl(10, 501)) &&
        call.method === 'DELETE'
      ) {
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.retirarArticulo(501),
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.confirmarRetirar,
      }),
    );

    expect(
      await screen.findByText(textosCarrito.retiroRed),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(consultasItems).toBeGreaterThanOrEqual(2),
    );
    expect(screen.getByText(DESCRIPCION_INICIAL)).toBeInTheDocument();
    expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(
      1,
    );

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.comprobarEstado,
      }),
    );

    await waitFor(() =>
      expect(consultasItems).toBeGreaterThanOrEqual(3),
    );
    expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(
      1,
    );
    expect(
      screen.queryByText(textosCarrito.retiroExito),
    ).not.toBeInTheDocument();
  });

  it('si el carrito vence al retirar, refresca su estado, avisa y no crea otro carrito', async () => {
    tokenStorage.set('jwt-cliente-3');
    let vencido = false;

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return vencido
          ? errorResponse(
              404,
              'ACTIVE_CART_NOT_FOUND',
              'El usuario no tiene un carrito activo',
            )
          : respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        return vencido
          ? errorResponse(
              404,
              'CART_NOT_FOUND',
              'El carrito solicitado no existe',
            )
          : respuestaItems({
              items: [crearItem()],
              total: 625.5,
            });
      }
      if (
        call.url.endsWith(itemUrl(10, 501)) &&
        call.method === 'DELETE'
      ) {
        vencido = true;
        return errorResponse(
          409,
          'CART_NOT_ACTIVE',
          'El carrito ya no se encuentra activo',
        );
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.retirarArticulo(501),
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.confirmarRetirar,
      }),
    );

    expect(
      await screen.findByText(textosCarrito.retiroCarritoVencido),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(textosCarrito.sinCarritoTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(DESCRIPCION_INICIAL),
    ).not.toBeInTheDocument();

    expect(
      calls.filter(
        (call) =>
          call.method === 'POST' && call.url.endsWith('/carritos'),
      ),
    ).toHaveLength(0);
    expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(
      1,
    );
    expect(
      llamadas(calls, 'GET', CARRITO_ACTUAL).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('muestra el error del carrito y permite reintentar', async () => {
    tokenStorage.set('jwt-cliente-3');
    let intentos = 0;

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        intentos += 1;
        if (intentos <= 2) {
          return errorResponse(
            500,
            'INTERNAL_SERVER_ERROR',
            'Error al consultar el carrito',
          );
        }
        return respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        return respuestaItems({
          items: [crearItem()],
          total: 625.5,
        });
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(
        textosCarrito.errorCarritoTitulo,
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(intentos).toBe(2);

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.reintentar,
      }),
    );

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();
    expect(intentos).toBe(3);
    expect(llamadas(calls, 'GET', CARRITO_ACTUAL)).toHaveLength(3);
  });

  it('muestra el error de los artículos y permite reintentar', async () => {
    tokenStorage.set('jwt-cliente-3');
    let intentos = 0;

    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        intentos += 1;
        if (intentos <= 2) {
          return errorResponse(
            500,
            'INTERNAL_SERVER_ERROR',
            'Error al consultar los artículos',
          );
        }
        return respuestaItems({
          items: [crearItem()],
          total: 625.5,
        });
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(
        textosCarrito.errorArticulosTitulo,
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(intentos).toBe(2);

    await user.click(
      screen.getByRole('button', {
        name: textosCarrito.reintentar,
      }),
    );

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();
    expect(intentos).toBe(3);
  });

  it('no muestra los artículos cuando el servidor niega el acceso al carrito', async () => {
    tokenStorage.set('jwt-cliente-3');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        return errorResponse(
          403,
          'INSUFFICIENT_PERMISSIONS',
          'No tiene permisos para acceder a este carrito',
        );
      }
      return undefined;
    });

    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(textosCarrito.errorAccesoTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(DESCRIPCION_INICIAL),
    ).not.toBeInTheDocument();
    expect(llamadas(calls, 'GET', itemsUrl(10))).toHaveLength(1);
  });

  it('cambia de usuario sin conservar los artículos del carrito anterior', async () => {
    tokenStorage.set('jwt-cliente-3');

    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) {
        return call.token === 'Bearer jwt-cliente-4'
          ? respuestaMe(4, 'cliente', 'Otra Persona')
          : respuestaMe(3);
      }

      if (
        call.url.endsWith('/auth/login') &&
        call.method === 'POST'
      ) {
        return respuestaLogin(4, 'jwt-cliente-4');
      }

      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return call.token === 'Bearer jwt-cliente-4'
          ? respuestaCarrito(
              crearCarrito({ id: 20, usuario_id: 4 }),
            )
          : respuestaCarrito(crearCarrito());
      }

      if (call.url.endsWith(itemsUrl(10))) {
        return respuestaItems({
          items: [crearItem()],
          total: 625.5,
        });
      }

      if (call.url.endsWith(itemsUrl(20))) {
        return respuestaItems({
          items: [
            crearItem({
              id: 701,
              carrito_id: 20,
              referencia_id: 99,
              descripcion: DESCRIPCION_OTRO_USUARIO,
              precio: '800.00',
            }),
          ],
          total: 800,
        });
      }

      return undefined;
    });

    const CambioDeUsuario: React.FC = () => {
      const { login, status, user } = useAuth();

      return (
        <div>
          <p data-testid="estado-sesion">
            {status}:{user?.id ?? 'sin-usuario'}
          </p>
          <button
            type="button"
            onClick={() => {
              void login({
                email: 'otro@ejemplo.com',
                password: 'Secreta123',
              });
            }}
          >
            Entrar con otra cuenta
          </button>
          <CarritoPage />
        </div>
      );
    };

    const user = userEvent.setup();
    renderWithProviders(<CambioDeUsuario />);

    expect(
      await screen.findByText(DESCRIPCION_INICIAL),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Q625.50').length,
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', {
        name: 'Entrar con otra cuenta',
      }),
    );

    expect(
      await screen.findByText(DESCRIPCION_OTRO_USUARIO),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(DESCRIPCION_INICIAL),
    ).not.toBeInTheDocument();
    expect(
      screen.queryAllByText('Q625.50'),
    ).toHaveLength(0);
    expect(
      screen.getAllByText('Q800.00').length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId('estado-sesion')).toHaveTextContent(
      'authenticated:4',
    );
  });

  it('muestra el estado vacío de un carrito activo sin artículos', async () => {
    tokenStorage.set('jwt-cliente-3');
    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return respuestaCarrito(crearCarrito());
      }
      if (call.url.endsWith(itemsUrl(10))) {
        return respuestaItems({ items: [], total: 0 });
      }
      return undefined;
    });

    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(textosCarrito.carritoVacioTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(textosCarrito.sinCarritoTitulo),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Carrito #10')).toBeInTheDocument();
  });

  it('no muestra un carrito que no pertenece al usuario autenticado', async () => {
    tokenStorage.set('jwt-cliente-3');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(CARRITO_ACTUAL)) {
        return respuestaCarrito(
          crearCarrito({ usuario_id: 99 }),
        );
      }
      return undefined;
    });

    renderWithProviders(<CarritoPage />);

    expect(
      await screen.findByText(textosCarrito.errorCarritoTitulo),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(DESCRIPCION_INICIAL),
    ).not.toBeInTheDocument();
    expect(llamadas(calls, 'GET', itemsUrl(10))).toHaveLength(0);
  });
});
