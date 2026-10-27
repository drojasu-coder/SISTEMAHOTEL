import { api, ApiError } from '@/api/client/http';
import type {
  Carrito,
  CarritoItem,
  CarritoItemsData,
  CarritoItemsResponse,
  CarritoItemResponse,
  CarritoResponse,
  CreateCarritoItemInput,
} from '../types';

/**
 * Cliente HTTP tipado para el dominio de carrito e ítems.
 */
export const carritoApi = {
  /**
   * Obtiene el carrito activo del usuario autenticado.
   * Endpoint: GET /api/carritos/actual.
   * Lanza ApiError con status 404 si el usuario no tiene un carrito activo o si ya expiró.
   */
  getCurrent: async (): Promise<Carrito> => {
    const response = await api.get<CarritoResponse>('/carritos/actual');
    return response.data;
  },

  /**
   * Crea un nuevo carrito activo para el cliente autenticado.
   * Endpoint: POST /api/carritos.
   * Lanza ApiError con status 409 si el cliente ya posee un carrito activo.
   */
  create: async (): Promise<Carrito> => {
    const response = await api.post<CarritoResponse>('/carritos', {});
    return response.data;
  },

  /**
   * Obtiene o crea un carrito activo para el cliente tras una acción explícita (p. ej. añadir ítem).
   *
   * Reglas de resiliencia y concurrencia:
   * 1. Consulta el carrito activo existente mediante GET /carritos/actual.
   * 2. Distingue estrictamente 404 (inexistente o vencido) de cualquier otro error (401, 403, 500 o red).
   * 3. Si no existe (404), solicita la creación mediante POST /carritos.
   * 4. Si la creación colisiona con un conflicto específico de carrito activo ya existente
   *    (código CART_ALREADY_ACTIVE ante carrera concurrente), re-consulta el carrito activo creado en paralelo.
   * 5. No convierte cualquier 409 en éxito ni reintenta escrituras ante fallos de red.
   */
  getOrCreateActiveCart: async (): Promise<Carrito> => {
    try {
      return await carritoApi.getCurrent();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        try {
          return await carritoApi.create();
        } catch (createErr: unknown) {
          const isConcurrentCartActive =
            createErr instanceof ApiError &&
            createErr.status === 409 &&
            (createErr.code === 'CART_ALREADY_ACTIVE' ||
              createErr.message?.toLowerCase().includes('carrito activo'));

          if (isConcurrentCartActive) {
            return await carritoApi.getCurrent();
          }
          throw createErr;
        }
      }
      throw err;
    }
  },

  /**
   * Lista los ítems asociados a un carrito y su total calculado por el servidor.
   * Endpoint: GET /api/carritos/:carritoId/items.
   */
  getItems: async (carritoId: number): Promise<CarritoItemsData> => {
    const response = await api.get<CarritoItemsResponse>(
      `/carritos/${carritoId}/items`
    );
    return response.data;
  },

  /**
   * Añade una referencia (ej. reserva de habitación) al carrito activo.
   * Endpoint: POST /api/carritos/:carritoId/items.
   */
  addItem: async (
    carritoId: number,
    data: CreateCarritoItemInput
  ): Promise<CarritoItem> => {
    const response = await api.post<CarritoItemResponse>(
      `/carritos/${carritoId}/items`,
      data
    );
    return response.data;
  },

  /**
   * Elimina un ítem específico de un carrito activo.
   * Endpoint: DELETE /api/carritos/:carritoId/items/:id.
   * Responde HTTP 204 No Content. La reserva referenciada NO se cancela ni se elimina.
   */
  removeItem: async (carritoId: number, itemId: number): Promise<void> => {
    await api.delete<void>(`/carritos/${carritoId}/items/${itemId}`);
  },
};
