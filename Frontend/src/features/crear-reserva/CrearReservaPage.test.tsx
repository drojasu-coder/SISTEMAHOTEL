import { setStayDates, changeGuestCount } from '@/test/stayControls';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { CrearReservaPage } from '@/pages/CrearReservaPage';
import type { HabitacionDisponible, ReservaHabitacion } from './types';

const mockSedes = [
  {
    id: 1,
    nombre: 'Hotel Hunapú Antigua',
    ciudad: 'Antigua Guatemala',
    direccion: '5ta Avenida Norte #12',
    telefono: '78320011',
    activa: true,
  },
  {
    id: 2,
    nombre: 'Hotel Hunapú Atitlán',
    ciudad: 'Panajachel',
    direccion: 'Calle Santander',
    telefono: '77620022',
    activa: true,
  },
];

const mockTipos = [
  {
    id: 1,
    nombre: 'Suite Presidencial',
    capacidad_maxima: 2,
    tarifa_noche: '1250.00',
    descripcion: 'Habitación de lujo',
  },
  {
    id: 2,
    nombre: 'Doble Deluxe',
    capacidad_maxima: 4,
    tarifa_noche: '750.00',
    descripcion: 'Dos camas matrimoniales',
  },
];

const mockHabitacionesDisponibles: HabitacionDisponible[] = [
  {
    id: 101,
    numero: '101',
    estado: 'disponible',
    sucursal_id: 1,
    tipo_habitacion_id: 1,
    noches: 2,
    tarifa_noche: '1250.00',
    total_estimado: '2500.00',
    Sucursal: {
      id: 1,
      nombre: 'Hotel Hunapú Antigua',
    },
    TipoHabitacion: {
      id: 1,
      nombre: 'Suite Presidencial',
      capacidad_maxima: 2,
      tarifa_noche: '1250.00',
    },
  },
  {
    id: 102,
    numero: '102',
    estado: 'disponible',
    sucursal_id: 1,
    tipo_habitacion_id: 2,
    noches: 2,
    tarifa_noche: '750.00',
    total_estimado: '1500.00',
    Sucursal: {
      id: 1,
      nombre: 'Hotel Hunapú Antigua',
    },
    TipoHabitacion: {
      id: 2,
      nombre: 'Doble Deluxe',
      capacidad_maxima: 4,
      tarifa_noche: '750.00',
    },
  },
];

const mockReservaCreada: ReservaHabitacion = {
  id: 88,
  usuario_id: 3,
  habitacion_id: 101,
  fecha_entrada: '2026-11-01',
  fecha_salida: '2026-11-03',
  numero_huespedes: 2,
  estado: 'pendiente',
  total: '2500.00',
  createdAt: '2026-10-22T12:00:00Z',
  updatedAt: '2026-10-22T12:00:00Z',
  Habitacion: {
    id: 101,
    sucursal_id: 1,
    tipo_habitacion_id: 1,
    numero: '101',
    estado: 'disponible',
    TipoHabitacion: {
      id: 1,
      nombre: 'Suite Presidencial',
      capacidad_maxima: 2,
      tarifa_noche: '1250.00',
    },
  },
};

describe('Flujo de disponibilidad y creación de reservas (CrearReservaPage)', () => {
  let capturedPostPayload: unknown = null;
  let capturedGetDisponibilidadUrl: string | null = null;

  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
    capturedPostPayload = null;
    capturedGetDisponibilidadUrl = null;
  });

  const setupFetchMock = (options?: {
    role?: string;
    disponibles?: HabitacionDisponible[];
    postResponse?: 'success' | 'conflict409' | 'validation422' | 'networkError';
    sedesError?: boolean;
  }) => {
    const role = options?.role ?? 'cliente';
    const disponibles = options?.disponibles ?? mockHabitacionesDisponibles;
    const postResponse = options?.postResponse ?? 'success';

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);

      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse(role));
      }

      if (urlStr.includes('/sucursales')) {
        if (options?.sedesError) {
          return Promise.resolve(errorResponse(500, 'SERVER_ERROR', 'Error cargando sedes'));
        }
        return Promise.resolve(jsonResponse({ status: 'success', data: mockSedes }));
      }

      if (urlStr.includes('/tipos-habitacion')) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: 'Tipos obtenidos',
            data: mockTipos,
          })
        );
      }

      if (urlStr.includes('/habitaciones/disponibles') || urlStr.includes('/api/public/habitaciones/disponibles')) {
        capturedGetDisponibilidadUrl = urlStr;
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: 'Disponibilidad calculada',
            data: disponibles,
          })
        );
      }

      if (urlStr.includes('/reservas-habitacion') && config?.method === 'POST') {
        capturedPostPayload = JSON.parse(config.body);

        if (postResponse === 'conflict409') {
          return Promise.resolve(
            errorResponse(
              409,
              'ROOM_UNAVAILABLE',
              'La habitación ya no se encuentra disponible'
            )
          );
        }

        if (postResponse === 'validation422') {
          return Promise.resolve(
            errorResponse(
              422,
              'VALIDATION_ERROR',
              'La fecha de salida debe ser posterior a la fecha de entrada'
            )
          );
        }

        if (postResponse === 'networkError') {
          return Promise.reject(new TypeError('Failed to fetch'));
        }

        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 201,
            message: 'Reserva creada con éxito',
            data: mockReservaCreada,
          })
        );
      }

      return Promise.reject(new Error(`Endpoint no manejado en mock: ${urlStr}`));
    });
  };

  it('permite el acceso al visitante sin sesión y muestra el formulario de búsqueda', async () => {
    tokenStorage.clear();
    setupFetchMock({ role: 'cliente' });

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Reservar habitación' })
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Sede del hotel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Fechas de estancia/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Número de huéspedes')).toBeInTheDocument();

    // No debe mostrar pantalla de acceso restringido
    expect(screen.queryByText('Acceso reservado para clientes')).not.toBeInTheDocument();
  });

  it('permite el acceso a usuarios con rol cliente y muestra el formulario de búsqueda', async () => {
    tokenStorage.set('token-cliente');
    setupFetchMock({ role: 'cliente' });

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Reservar habitación' })
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Sede del hotel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Fechas de estancia/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Número de huéspedes')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de habitación (opcional)')).toBeInTheDocument();
  });

  it('valida campos obligatorios y fechas inválidas en el cliente', async () => {
    tokenStorage.set('token-cliente');
    setupFetchMock({ role: 'cliente' });
    const user = userEvent.setup();

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buscar disponibilidad/i })).toBeInTheDocument();
    });

    // La cantidad propone dos huéspedes; se puede vaciar para corregirla.
    await user.clear(screen.getByLabelText('Número de huéspedes'));
    // Envío en blanco
    await user.click(screen.getByRole('button', { name: /buscar disponibilidad/i }));

    await waitFor(() => {
      expect(screen.getByText('Debe seleccionar una sede')).toBeInTheDocument();
      expect(screen.getByText('La fecha de entrada es obligatoria')).toBeInTheDocument();
      expect(screen.getByText('La fecha de salida es obligatoria')).toBeInTheDocument();
      expect(screen.getByText('El número de huéspedes es obligatorio')).toBeInTheDocument();
    });

    // El contador impide introducir cero y deshabilita disminuir en el mínimo real.
    await user.click(screen.getByRole('button', { name: 'Aumentar huéspedes' }));
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(1);
    expect(screen.getByRole('button', { name: 'Disminuir huéspedes' })).toBeDisabled();
    changeGuestCount('0');
    expect(screen.getByLabelText('Número de huéspedes')).toHaveValue(1);

  });

  it('busca disponibilidad con parámetros exactos y muestra resultados con montos del servidor', async () => {
    tokenStorage.set('token-cliente');
    setupFetchMock({ role: 'cliente' });
    const user = userEvent.setup();

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Sede del hotel')).toBeInTheDocument();
    });

    // Llenar formulario
    await user.selectOptions(screen.getByLabelText('Sede del hotel'), '1');


    await setStayDates('2026-11-01', '2026-11-03');
    changeGuestCount('2');

    await user.click(screen.getByRole('button', { name: /buscar disponibilidad/i }));

    await waitFor(() => {
      expect(capturedGetDisponibilidadUrl).toContain('/habitaciones/disponibles');
      expect(capturedGetDisponibilidadUrl).toContain('sucursal_id=1');
      expect(capturedGetDisponibilidadUrl).toContain('fecha_entrada=2026-11-01');
      expect(capturedGetDisponibilidadUrl).toContain('fecha_salida=2026-11-03');
      expect(capturedGetDisponibilidadUrl).toContain('numero_huespedes=2');
    });

    // Muestra los resultados devueltos por el backend (nombres de tipo, no números de habitación internos)
    await waitFor(() => {
      expect(screen.getAllByText('Suite Presidencial').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Doble Deluxe').length).toBeGreaterThan(0);
    });

    // Verificar formato GTQ y cifras exactas del servidor sin recalcular
    expect(screen.getByText(/Q\s*1,250\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Q\s*2,500\.00/)).toBeInTheDocument();
    expect(screen.getAllByText('2 noches de estancia').length).toBe(2);
  });

  it('invalida la selección previa y advierte cuando los criterios en el formulario se modifican', async () => {
    tokenStorage.set('token-cliente');
    setupFetchMock({ role: 'cliente' });
    const user = userEvent.setup();

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Sede del hotel')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Sede del hotel'), '1');
    await setStayDates('2026-11-01', '2026-11-03');
    changeGuestCount('2');

    await user.click(screen.getByRole('button', { name: /buscar disponibilidad/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Suite Presidencial').length).toBeGreaterThan(0);
    });

    // Ahora el usuario modifica el número de huéspedes
    const huespedes = screen.getByLabelText('Número de huéspedes');
    await user.clear(huespedes);
    changeGuestCount('3');

    // Debe mostrar la advertencia de que los criterios se han modificado
    await waitFor(() => {
      expect(
        screen.getByText(/Ha modificado los criterios en el formulario/i)
      ).toBeInTheDocument();
    });

    // Los botones de seleccionar habitación deben estar deshabilitados para evitar reservar con criterios obsoletos
    const botonesSeleccionar = screen.getAllByRole('button', { name: /seleccionar habitación/i });
    expect(botonesSeleccionar[0]).toBeDisabled();
  });

  it('abre el resumen y envía el payload exacto { habitacion_id, fecha_entrada, fecha_salida, numero_huespedes }', async () => {
    tokenStorage.set('token-cliente');
    setupFetchMock({ role: 'cliente', postResponse: 'success' });
    const user = userEvent.setup();

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Sede del hotel')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Sede del hotel'), '1');
    await setStayDates('2026-11-01', '2026-11-03');
    changeGuestCount('2');

    await user.click(screen.getByRole('button', { name: /buscar disponibilidad/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Suite Presidencial').length).toBeGreaterThan(0);
    });

    // Seleccionar habitación
    const botonesSeleccionar = screen.getAllByRole('button', { name: /seleccionar habitación/i });
    await user.click(botonesSeleccionar[0]);

    // Modal de resumen abierto
    await waitFor(() => {
      expect(screen.getByText('Resumen de su reserva')).toBeInTheDocument();
      expect(screen.getAllByText('Suite Presidencial').length).toBeGreaterThan(0);
      expect(screen.getByText('Total de la reserva:')).toBeInTheDocument();
    });

    // Confirmar y crear la reserva
    const botonConfirmar = screen.getByRole('button', { name: 'Confirmar y reservar' });
    await user.click(botonConfirmar);

    // Verificar el payload exacto enviado al backend
    await waitFor(() => {
      expect(capturedPostPayload).toEqual({
        habitacion_id: 101,
        fecha_entrada: '2026-11-01',
        fecha_salida: '2026-11-03',
        numero_huespedes: 2,
      });
    });

    // Verificar que NO se enviaron usuario_id, estado, tarifa ni total
    expect((capturedPostPayload as any).usuario_id).toBeUndefined();
    expect((capturedPostPayload as any).estado).toBeUndefined();
    expect((capturedPostPayload as any).tarifa).toBeUndefined();
    expect((capturedPostPayload as any).total).toBeUndefined();

    // Pantalla de éxito con estado pendiente devuelto por el servidor
    await waitFor(() => {
      expect(screen.getByText('¡Reserva creada exitosamente!')).toBeInTheDocument();
      expect(screen.getByText('#88')).toBeInTheDocument();
      expect(screen.getByText(/^pendiente$/i)).toBeInTheDocument();
      expect(screen.getByText(/Q\s*2,500\.00/)).toBeInTheDocument();
      expect(screen.getByText(/Su reserva se encuentra en estado "Pendiente"/i)).toBeInTheDocument();
    });

    // Enlaces de navegación con RESERVAS_ROUTES
    expect(screen.getByRole('link', { name: 'Ir a Mis reservas' })).toHaveAttribute(
      'href',
      '/mis-reservas'
    );
    expect(
      screen.getByRole('link', { name: /ver detalle de esta reserva/i })
    ).toHaveAttribute('href', '/mis-reservas/88');
  });

  it('maneja error 409 (conflicto) conservando los criterios y ofreciendo actualizar disponibilidad', async () => {
    tokenStorage.set('token-cliente');
    setupFetchMock({ role: 'cliente', postResponse: 'conflict409' });
    const user = userEvent.setup();

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Sede del hotel')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Sede del hotel'), '1');
    await setStayDates('2026-11-01', '2026-11-03');
    changeGuestCount('2');

    await user.click(screen.getByRole('button', { name: /buscar disponibilidad/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Suite Presidencial').length).toBeGreaterThan(0);
    });

    const botonesSeleccionar = screen.getAllByRole('button', { name: /seleccionar habitación/i });
    await user.click(botonesSeleccionar[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar y reservar' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Confirmar y reservar' }));

    // Al responder 409, se muestra el aviso de conflicto dentro del modal
    await waitFor(() => {
      expect(screen.getByText('Habitación no disponible')).toBeInTheDocument();
      expect(
        screen.getByText(/La habitación seleccionada ya fue reservada por otro huésped/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /actualizar disponibilidad/i })
      ).toBeInTheDocument();
    });

    // Al pulsar "Actualizar disponibilidad", se cierra el modal y se refresca la disponibilidad
    await user.click(screen.getByRole('button', { name: /actualizar disponibilidad/i }));

    await waitFor(() => {
      expect(screen.queryByText('Resumen de su reserva')).not.toBeInTheDocument();
    });
  });

  it('maneja fallo de red sin afirmar que la reserva no existe y ofreciendo consultar Mis reservas', async () => {
    tokenStorage.set('token-cliente');
    setupFetchMock({ role: 'cliente', postResponse: 'networkError' });
    const user = userEvent.setup();

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Sede del hotel')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Sede del hotel'), '1');
    await setStayDates('2026-11-01', '2026-11-03');
    changeGuestCount('2');

    await user.click(screen.getByRole('button', { name: /buscar disponibilidad/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Suite Presidencial').length).toBeGreaterThan(0);
    });

    const botonesSeleccionar = screen.getAllByRole('button', { name: /seleccionar habitación/i });
    await user.click(botonesSeleccionar[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar y reservar' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Confirmar y reservar' }));

    // Al haber error de red (status 0 / NETWORK_ERROR)
    await waitFor(() => {
      expect(
        screen.getByText('Resultado incierto por problema de red')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/No fue posible confirmar la respuesta del servidor debido a un problema de conexión/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Ir a Mis reservas' })).toHaveAttribute(
        'href',
        '/mis-reservas'
      );
    });
    expect(screen.getByRole('button', { name: 'Confirmar y reservar' })).toBeDisabled();

  });

  it('maneja fallo en la carga de catálogos auxiliares con botón de reintento', async () => {
    tokenStorage.set('token-cliente');
    setupFetchMock({ role: 'cliente', sedesError: true });

    renderWithProviders(<CrearReservaPage />);

    await waitFor(() => {
      expect(
        screen.getByText('No fue posible cargar el listado de sedes. Por favor, intente de nuevo.')
      ).toBeInTheDocument();
    });
  });
});
