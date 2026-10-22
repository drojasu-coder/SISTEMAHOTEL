import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  errorResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { useAuth } from '@/features/auth/AuthContext';
import { MisReservasPage } from '@/pages/MisReservasPage';
import { textosMisReservas } from './textos';
import {
  crearHabitacion,
  crearReserva,
  instalarFetch,
  respuestaLista,
  respuestaLogin,
  respuestaMe,
} from './test-utils';

const RESERVA_URL = '/reservas-habitacion';

describe('Mis reservas (MisReservasPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('muestra el listado con ID, habitación, tipo, sede, fechas, huéspedes, estado e importe', async () => {
    tokenStorage.set('jwt-cliente-3');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(RESERVA_URL) && call.method === 'GET') {
        return respuestaLista([crearReserva()]);
      }
      return undefined;
    });

    renderWithProviders(<MisReservasPage />);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: textosMisReservas.titulo,
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText('Reserva #12')).toBeInTheDocument();
    expect(screen.getByText('Habitación 101')).toBeInTheDocument();
    expect(screen.getByText('Doble Deluxe')).toBeInTheDocument();
    expect(screen.getByText('Hotel Hunapú Antigua')).toBeInTheDocument();
    expect(screen.getByText('5 dic 2026')).toBeInTheDocument();
    expect(screen.getByText('9 dic 2026')).toBeInTheDocument();
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument();
    expect(screen.getByText('4 noches')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('Q2,750.50')).toBeInTheDocument();

    const enlaceDetalle = screen.getByRole('link', {
      name: textosMisReservas.verDetalleReserva(12),
    });
    expect(enlaceDetalle).toHaveAttribute('href', '/mis-reservas/12');

    // La relación Sucursal vino incluida: no hace falta consultar el catálogo.
    expect(calls.some((call) => call.url.endsWith('/sucursales'))).toBe(
      false,
    );
  });

  it('representa los cinco estados reales de la reserva', async () => {
    tokenStorage.set('jwt-cliente-3');
    const estados = [
      'pendiente',
      'confirmada',
      'cancelada',
      'finalizada',
      'expirada',
    ] as const;

    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(RESERVA_URL) && call.method === 'GET') {
        return respuestaLista(
          estados.map((estado, indice) =>
            crearReserva({
              id: indice + 1,
              estado,
              Habitacion: crearHabitacion({
                id: 100 + indice,
                numero: String(100 + indice),
              }),
            }),
          ),
        );
      }
      return undefined;
    });

    renderWithProviders(<MisReservasPage />);

    expect(await screen.findByText('Reserva #1')).toBeInTheDocument();
    for (const etiqueta of [
      'Pendiente',
      'Confirmada',
      'Cancelada',
      'Finalizada',
      'Expirada',
    ]) {
      expect(screen.getByText(etiqueta)).toBeInTheDocument();
    }
  });

  it('muestra el estado vacío con enlace para reservar', async () => {
    tokenStorage.set('jwt-cliente-3');
    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(RESERVA_URL) && call.method === 'GET') {
        return respuestaLista([]);
      }
      return undefined;
    });

    renderWithProviders(<MisReservasPage />);

    expect(
      await screen.findByText(textosMisReservas.vacioTitulo),
    ).toBeInTheDocument();
    expect(
      screen.getByText(textosMisReservas.vacioDescripcion),
    ).toBeInTheDocument();

    const enlacesReservar = screen.getAllByRole('link', {
      name: textosMisReservas.reservar,
    });
    expect(enlacesReservar.length).toBeGreaterThan(0);
    expect(
      enlacesReservar.every(
        (enlace) => enlace.getAttribute('href') === '/reservar',
      ),
    ).toBe(true);
  });

  it('muestra el error del listado y permite reintentar', async () => {
    tokenStorage.set('jwt-cliente-3');
    let intentosListado = 0;

    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return respuestaMe(3);
      if (call.url.endsWith(RESERVA_URL) && call.method === 'GET') {
        intentosListado += 1;
        // El primer intento y el reintento automático fallan; el reintento
        // manual del usuario obtiene los datos.
        if (intentosListado <= 2) {
          return errorResponse(
            500,
            'INTERNAL_SERVER_ERROR',
            'Error al consultar las reservas',
          );
        }
        return respuestaLista([crearReserva()]);
      }
      return undefined;
    });

    const user = userEvent.setup();
    renderWithProviders(<MisReservasPage />);

    expect(
      await screen.findByText(
        textosMisReservas.errorListadoTitulo,
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: textosMisReservas.acceso.reintentar,
      }),
    );

    expect(await screen.findByText('Reserva #12')).toBeInTheDocument();
    expect(intentosListado).toBe(3);
  });

  it('no consulta ni muestra reservas sin sesión', async () => {
    const { calls } = instalarFetch(() => undefined);

    renderWithProviders(<MisReservasPage />);

    expect(
      await screen.findByRole('heading', {
        name: textosMisReservas.acceso.sinSesionTitulo,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: textosMisReservas.acceso.iniciarSesion,
      }),
    ).toHaveAttribute('href', '/login');
    expect(calls).toHaveLength(0);
  });

  it('no consulta reservas con un rol fuera del alcance', async () => {
    tokenStorage.set('jwt-admin');
    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) {
        return respuestaMe(1, 'admin', 'Administradora Prueba');
      }
      return undefined;
    });

    renderWithProviders(<MisReservasPage />);

    expect(
      await screen.findByRole('heading', {
        name: textosMisReservas.acceso.rolTitulo,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: textosMisReservas.acceso.irMiEspacio,
      }),
    ).toHaveAttribute('href', '/admin');

    expect(calls.some((call) => call.url.endsWith(RESERVA_URL))).toBe(
      false,
    );
    expect(calls.some((call) => call.url.endsWith('/sucursales'))).toBe(
      false,
    );
  });

  it('no consulta reservas mientras se restaura la sesión', async () => {
    tokenStorage.set('jwt-cliente-3');
    let resolverMe!: (respuesta: Response) => void;
    const mePendiente = new Promise<Response>((resolve) => {
      resolverMe = resolve;
    });

    const { calls } = instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) return mePendiente;
      if (call.url.endsWith(RESERVA_URL) && call.method === 'GET') {
        return respuestaLista([crearReserva()]);
      }
      return undefined;
    });

    renderWithProviders(<MisReservasPage />);

    expect(
      await screen.findByText(textosMisReservas.acceso.verificandoSesion),
    ).toBeInTheDocument();
    expect(calls.some((call) => call.url.endsWith(RESERVA_URL))).toBe(
      false,
    );

    resolverMe(respuestaMe(3));

    expect(await screen.findByText('Reserva #12')).toBeInTheDocument();
  });

  it('cambia de usuario sin conservar reservas de la sesión anterior', async () => {
    tokenStorage.set('jwt-cliente-3');

    instalarFetch((call) => {
      if (call.url.endsWith('/auth/me')) {
        return call.token === 'Bearer jwt-cliente-4'
          ? respuestaMe(4, 'cliente', 'Otra Persona')
          : respuestaMe(3);
      }

      if (call.url.endsWith('/auth/login') && call.method === 'POST') {
        return respuestaLogin(4, 'jwt-cliente-4');
      }

      if (call.url.endsWith(RESERVA_URL) && call.method === 'GET') {
        if (call.token === 'Bearer jwt-cliente-4') {
          return respuestaLista([
            crearReserva({
              id: 99,
              usuario_id: 4,
              total: '1500.00',
              Habitacion: crearHabitacion({
                id: 202,
                numero: '202',
              }),
            }),
          ]);
        }
        return respuestaLista([crearReserva()]);
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
          <MisReservasPage />
        </div>
      );
    };

    const user = userEvent.setup();
    renderWithProviders(<CambioDeUsuario />);

    expect(await screen.findByText('Reserva #12')).toBeInTheDocument();
    expect(screen.getByText('Habitación 101')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Entrar con otra cuenta' }),
    );

    expect(await screen.findByText('Reserva #99')).toBeInTheDocument();
    expect(screen.getByText('Habitación 202')).toBeInTheDocument();
    expect(screen.queryByText('Reserva #12')).not.toBeInTheDocument();
    expect(screen.queryByText('Habitación 101')).not.toBeInTheDocument();
    expect(screen.getByTestId('estado-sesion')).toHaveTextContent(
      'authenticated:4',
    );
  });
});
