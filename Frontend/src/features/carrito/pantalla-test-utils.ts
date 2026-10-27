import { vi } from 'vitest';
import { jsonResponse } from '@/test/renderWithProviders';
import type { Carrito, CarritoItem, CarritoItemsData } from './types';

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

      // Carrito sin pago previo, salvo que el escenario responda explícitamente otra cosa.
      const respuesta = handler(call) ?? (call.method === 'GET' && /\/pagos\/intento-activo\?carrito_id=\d+$/.test(call.url) ? jsonResponse({ data: null }) : undefined);
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

export function respuestaCarrito(carrito: Carrito) {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: 'Carrito activo obtenido correctamente',
    data: carrito,
  });
}

export function respuestaItems(data: CarritoItemsData) {
  return jsonResponse({
    success: true,
    statusCode: 200,
    message: 'Ítems del carrito obtenidos correctamente',
    data,
  });
}

/** HTTP 204 sin cuerpo ni tipo de contenido, como responde el backend real. */
export function sinContenido(): Response {
  return {
    ok: true,
    status: 204,
    statusText: 'No Content',
    headers: { get: () => null },
    text: async () => '',
  } as unknown as Response;
}

export function crearCarrito(
  overrides: Partial<Carrito> = {},
): Carrito {
  return {
    id: 10,
    usuario_id: 3,
    estado: 'activo',
    expira_en: '2030-10-22T18:00:00.000Z',
    createdAt: '2026-10-22T17:00:00.000Z',
    updatedAt: '2026-10-22T17:00:00.000Z',
    ...overrides,
  };
}

export function crearItem(
  overrides: Partial<CarritoItem> = {},
): CarritoItem {
  return {
    id: 501,
    carrito_id: 10,
    tipo_item: 'habitacion',
    referencia_id: 12,
    descripcion:
      'Reserva de habitación #12 (2026-12-05 a 2026-12-09)',
    precio: '625.50',
    cantidad: 1,
    promocion_id: null,
    createdAt: '2026-10-22T17:05:00.000Z',
    updatedAt: '2026-10-22T17:05:00.000Z',
    ...overrides,
  };
}
