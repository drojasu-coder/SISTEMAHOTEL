import { vi } from 'vitest';
import { jsonResponse } from '@/test/renderWithProviders';
import type {
  ReservaHabitacion,
  ReservaHabitacionHabitacion,
} from '@/features/reservas';
import type { Sucursal } from '@/features/sedes/types';

export interface FetchCall {
  url: string;
  method: string;
  body: string | null;
  token: string | null;
}

export type FetchHandler = (
  call: FetchCall,
) => Response | Promise<Response> | undefined;

/**
 * Sustituye fetch para las pruebas y registra cada petición. Un handler que
 * devuelve undefined hace visible una ruta no contemplada en el escenario.
 */
export function instalarFetch(handler: FetchHandler) {
  const calls: FetchCall[] = [];

  const fetchMock = vi.fn(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      const headers = new Headers(init?.headers);
      const call: FetchCall = {
        url,
        method,
        body: typeof init?.body === 'string' ? init.body : null,
        token: headers.get('Authorization'),
      };
      calls.push(call);

      const respuesta = handler(call);
      if (respuesta === undefined) {
        return Promise.reject(
          new Error(`Ruta no manejada en mock: ${method} ${url}`),
        );
      }
      return Promise.resolve(respuesta);
    },
  );

  global.fetch = fetchMock as unknown as typeof fetch;
  return { calls, fetchMock };
}

export function respuestaMe(
  id: number,
  rol = 'cliente',
  nombre = 'Cliente Prueba',
) {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: 'Sesión vigente',
    data: {
      id,
      nombre,
      email: `cliente-${id}@ejemplo.com`,
      telefono: null,
      rol,
      activo: true,
    },
  });
}

export function respuestaLogin(
  id: number,
  token: string,
  rol = 'cliente',
  nombre = 'Otro Cliente',
) {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: 'Inicio de sesión exitoso',
    data: {
      accessToken: token,
      usuario: {
        id,
        nombre,
        email: `cliente-${id}@ejemplo.com`,
        telefono: null,
        rol,
        activo: true,
      },
    },
  });
}

export function respuestaLista(reservas: ReservaHabitacion[]) {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: 'Reservas de habitación obtenidas correctamente',
    data: reservas,
  });
}

export function respuestaDetalle(reserva: ReservaHabitacion) {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: 'Reserva de habitación obtenida correctamente',
    data: reserva,
  });
}

export function respuestaSedes(sedes: Sucursal[]) {
  return jsonResponse({ status: 'success', data: sedes });
}

export function crearHabitacion(
  overrides: Partial<ReservaHabitacionHabitacion> = {},
): ReservaHabitacionHabitacion {
  return {
    id: 101,
    sucursal_id: 1,
    tipo_habitacion_id: 2,
    numero: '101',
    estado: 'disponible',
    TipoHabitacion: {
      id: 2,
      nombre: 'Doble Deluxe',
      capacidad_maxima: 4,
      tarifa_noche: '1250.00',
      descripcion: 'Habitación con dos camas matrimoniales',
    },
    Sucursal: {
      id: 1,
      nombre: 'Hotel Hunapú Antigua',
      activa: true,
    },
    ...overrides,
  };
}

export function crearReserva(
  overrides: Partial<ReservaHabitacion> = {},
): ReservaHabitacion {
  return {
    id: 12,
    usuario_id: 3,
    habitacion_id: 101,
    fecha_entrada: '2026-12-05',
    fecha_salida: '2026-12-09',
    numero_huespedes: 2,
    estado: 'confirmada',
    // El total no coincide con 4 noches × Q1,250.00: debe mostrarse el total
    // persistido y no uno recalculado con la tarifa actual del catálogo.
    total: '2750.50',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    Habitacion: crearHabitacion(),
    ...overrides,
  };
}

export const sedeAntigua: Sucursal = {
  id: 1,
  nombre: 'Hotel Hunapú Antigua',
  direccion: '5ta Avenida Norte #12',
  ciudad: 'Antigua Guatemala',
  telefono: '78320011',
  activa: true,
};

export const sedeAtitlan: Sucursal = {
  id: 2,
  nombre: 'Hotel Hunapú Atitlán',
  direccion: 'Calle Santander',
  ciudad: 'Panajachel',
  telefono: '77620022',
  activa: true,
};
