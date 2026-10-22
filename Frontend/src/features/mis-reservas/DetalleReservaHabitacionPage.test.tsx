import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Route, Routes } from 'react-router-dom';
import {
  renderWithProviders,
  errorResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { DetalleReservaHabitacionPage } from '@/pages/DetalleReservaHabitacionPage';
import { textosMisReservas } from './textos';
import {
  crearHabitacion,
  crearReserva,
  instalarFetch,
  respuestaDetalle,
  respuestaMe,
  respuestaSedes,
  sedeAtitlan,
} from './test-utils';

const DETALLE_12 = /\/reservas-habitacion\/12$/;

function renderDetalle(ruta = '/mis-reservas/12') {
  return renderWithProviders(
    <Routes>
      <Route
        path="/mis-reservas/:id"
        element={<DetalleReservaHabitacionPage />}
      />
      <Route path="/mis-reservas" element={<p>Listado de reservas</p>} />
    </Routes>,
    { route: ruta },
  );
}

describe('Detalle de reserva de habitación (DetalleReservaHabitacionPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('consulta el detalle por ID directamente, sin pasar por el listado', async () => {
    tokenStorage.set('jwt-cliente-3');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        return respuestaDetalle(crearReserva());
      }
      return undefined;
    });

    renderDetalle();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: textosMisReservas.reservaNumero(12),
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText('101')).toBeInTheDocument();
    expect(screen.getByText('Doble Deluxe')).toBeInTheDocument();
    expect(screen.getByText('Hotel Hunapú Antigua')).toBeInTheDocument();
    expect(screen.getByText('5 dic 2026')).toBeInTheDocument();
    expect(screen.getByText('9 dic 2026')).toBeInTheDocument();
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument();
    expect(screen.getByText('4 noches')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('Q2,750.50')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: textosMisReservas.volverListado,
      }),
    ).toHaveAttribute('href', '/mis-reservas');

    // Nunca se solicitó el listado: el detalle se resolvió solo con el ID.
    expect(
      calls.some((call) => call.url.endsWith('/reservas-habitacion')),
    ).toBe(false);
  });

  it('muestra el importe persistido por el backend y no lo recalcula', async () => {
    tokenStorage.set('jwt-cliente-3');
    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        return respuestaDetalle(
          crearReserva({
            total: '1999.99',
            Habitacion: crearHabitacion({
              TipoHabitacion: {
                id: 2,
                nombre: 'Doble Deluxe',
                capacidad_maxima: 4,
                tarifa_noche: '1250.00',
              },
            }),
          }),
        );
      }
      return undefined;
    });

    renderDetalle();

    expect(await screen.findByText('Q1,999.99')).toBeInTheDocument();
    expect(
      screen.getByText(textosMisReservas.campos.importe),
    ).toBeInTheDocument();
    expect(
      screen.getByText(textosMisReservas.importeNota),
    ).toBeInTheDocument();

    // 4 noches × Q1,250.00 sería Q5,000.00; ese cálculo no debe mostrarse.
    expect(screen.queryByText('Q5,000.00')).not.toBeInTheDocument();
    const texto = document.body.textContent ?? '';
    expect(texto).not.toMatch(/Pagado|Saldo pendiente/i);
  });

  it('resuelve el nombre de la sede desde el catálogo si la relación no viene incluida', async () => {
    tokenStorage.set('jwt-cliente-3');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        return respuestaDetalle(
          crearReserva({
            Habitacion: crearHabitacion({
              sucursal_id: 2,
              Sucursal: undefined,
            }),
          }),
        );
      }
      if (call.url.endsWith('/sucursales')) {
        return respuestaSedes([sedeAtitlan]);
      }
      return undefined;
    });

    renderDetalle();

    expect(
      await screen.findByText('Hotel Hunapú Atitlán'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(textosMisReservas.avisoSedes),
    ).not.toBeInTheDocument();
    expect(calls.some((call) => call.url.endsWith('/sucursales'))).toBe(
      true,
    );
  });

  it('conserva la información de la reserva y muestra el identificador si falla el catálogo de sedes', async () => {
    tokenStorage.set('jwt-cliente-3');
    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        return respuestaDetalle(
          crearReserva({
            Habitacion: crearHabitacion({
              sucursal_id: 2,
              Sucursal: undefined,
            }),
          }),
        );
      }
      if (call.url.endsWith('/sucursales')) {
        return errorResponse(
          500,
          'INTERNAL_SERVER_ERROR',
          'No fue posible cargar las sedes',
        );
      }
      return undefined;
    });

    renderDetalle();

    expect(await screen.findByText('Sede #2')).toBeInTheDocument();
    expect(
      await screen.findByText(textosMisReservas.avisoSedes),
    ).toBeInTheDocument();

    // Los datos propios de la reserva siguen visibles.
    expect(screen.getByText('Doble Deluxe')).toBeInTheDocument();
    expect(screen.getByText('5 dic 2026')).toBeInTheDocument();
    expect(screen.getByText('Q2,750.50')).toBeInTheDocument();
  });

  it('representa relaciones opcionales ausentes sin bloquear el detalle', async () => {
    tokenStorage.set('jwt-cliente-3');
    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        return respuestaDetalle(crearReserva({ Habitacion: undefined }));
      }
      return undefined;
    });

    renderDetalle();

    expect(
      await screen.findByText(textosMisReservas.sinHabitacion),
    ).toBeInTheDocument();
    expect(screen.getByText(textosMisReservas.sinTipo)).toBeInTheDocument();
    expect(screen.getByText(textosMisReservas.sinSede)).toBeInTheDocument();
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument();
    expect(screen.getByText('5 dic 2026')).toBeInTheDocument();
    expect(screen.getByText('Q2,750.50')).toBeInTheDocument();
  });

  it('distingue un 403 y no muestra datos del detalle', async () => {
    tokenStorage.set('jwt-cliente-3');
    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        return errorResponse(
          403,
          'INSUFFICIENT_PERMISSIONS',
          'No tiene permisos para acceder a esta reserva',
        );
      }
      return undefined;
    });

    renderDetalle();

    expect(
      await screen.findByRole('heading', {
        name: textosMisReservas.sinAccesoTitulo,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Doble Deluxe')).not.toBeInTheDocument();
    expect(screen.queryByText('Q2,750.50')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: textosMisReservas.acceso.reintentar,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('link', {
        name: textosMisReservas.volverListado,
      }).length,
    ).toBeGreaterThan(0);
  });

  it('distingue un 404 y no muestra datos del detalle', async () => {
    tokenStorage.set('jwt-cliente-3');
    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        return errorResponse(
          404,
          'RESERVA_HABITACION_NOT_FOUND',
          'La reserva de habitación no fue encontrada',
        );
      }
      return undefined;
    });

    renderDetalle();

    expect(
      await screen.findByRole('heading', {
        name: textosMisReservas.noEncontradaTitulo,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Doble Deluxe')).not.toBeInTheDocument();
    expect(screen.queryByText('Q2,750.50')).not.toBeInTheDocument();
  });

  it('distingue un fallo de red y permite reintentar', async () => {
    tokenStorage.set('jwt-cliente-3');
    let intentos = 0;

    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        intentos += 1;
        // Fallan el primer intento y el reintento automático; el reintento
        // manual solicita el detalle correctamente.
        if (intentos <= 2) {
          return errorResponse(
            0,
            'NETWORK_ERROR',
            'No fue posible conectar con el servidor',
          );
        }
        return respuestaDetalle(crearReserva());
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderDetalle();

    expect(
      await screen.findByRole(
        'heading',
        { name: textosMisReservas.errorConexionTitulo },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: textosMisReservas.acceso.reintentar,
      }),
    );

    expect(await screen.findByText('Doble Deluxe')).toBeInTheDocument();
    expect(screen.getByText('Q2,750.50')).toBeInTheDocument();
    expect(intentos).toBe(3);
  });

  it('valida el formato del ID y no consulta el backend si es inválido', async () => {
    tokenStorage.set('jwt-cliente-3');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      return undefined;
    });

    renderDetalle('/mis-reservas/abc');

    expect(
      await screen.findByRole('heading', {
        name: textosMisReservas.idInvalidoTitulo,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(textosMisReservas.cargandoDetalle),
    ).not.toBeInTheDocument();
    expect(
      calls.some((call) => call.url.includes('/reservas-habitacion/')),
    ).toBe(false);
  });

  it('no muestra el detalle anterior durante un cambio de ID', async () => {
    tokenStorage.set('jwt-cliente-3');
    let resolverDetalle99!: (respuesta: Response) => void;
    const detalle99Pendiente = new Promise<Response>((resolve) => {
      resolverDetalle99 = resolve;
    });

    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (DETALLE_12.test(call.url) && call.method === 'GET') {
        return respuestaDetalle(crearReserva());
      }
      if (/\/reservas-habitacion\/99$/.test(call.url)) {
        return detalle99Pendiente;
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Link to="/mis-reservas/99">Ir a la reserva 99</Link>
        <Routes>
          <Route
            path="/mis-reservas/:id"
            element={<DetalleReservaHabitacionPage />}
          />
        </Routes>
      </>,
      { route: '/mis-reservas/12' },
    );

    expect(await screen.findByText('Q2,750.50')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: 'Ir a la reserva 99' }),
    );

    expect(
      await screen.findByText(textosMisReservas.cargandoDetalle),
    ).toBeInTheDocument();
    expect(screen.queryByText('101')).not.toBeInTheDocument();
    expect(screen.queryByText('Q2,750.50')).not.toBeInTheDocument();
    expect(screen.queryByText('Doble Deluxe')).not.toBeInTheDocument();

    resolverDetalle99(
      respuestaDetalle(
        crearReserva({
          id: 99,
          total: '1500.00',
          Habitacion: crearHabitacion({ id: 202, numero: '202' }),
        }),
      ),
    );

    expect(await screen.findByText('202')).toBeInTheDocument();
    expect(screen.getByText('Q1,500.00')).toBeInTheDocument();
    expect(screen.queryByText('101')).not.toBeInTheDocument();
    expect(screen.queryByText('Q2,750.50')).not.toBeInTheDocument();
  });

  it('no consulta el detalle sin sesión', async () => {
    const { calls } = instalarFetch(() => undefined);

    renderDetalle();

    expect(
      await screen.findByRole('heading', {
        name: textosMisReservas.acceso.sinSesionTitulo,
      }),
    ).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('no consulta el detalle con un rol fuera del alcance', async () => {
    tokenStorage.set('jwt-admin');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) {
        return respuestaMe(1, 'admin', 'Administradora Prueba');
      }
      return undefined;
    });

    renderDetalle();

    expect(
      await screen.findByRole('heading', {
        name: textosMisReservas.acceso.rolTitulo,
      }),
    ).toBeInTheDocument();
    expect(
      calls.some((call) => call.url.includes('/reservas-habitacion/')),
    ).toBe(false);
  });
});
