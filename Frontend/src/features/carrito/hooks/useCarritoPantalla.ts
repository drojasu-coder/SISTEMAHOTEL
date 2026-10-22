import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client/http';
import { carritoApi } from '../api/carritoApi';
import { carritoQueryKeys } from '../constants/queryKeys';

/**
 * Un 400, 401, 403, 404 o 409 no mejora al reintentarse: describen una
 * condición estable del carrito o de la sesión. Los fallos de red o del
 * servidor se reintentan una vez.
 */
const ESTADOS_SIN_REINTENTO = [400, 401, 403, 404, 409];

export function reintentarConsultaCarrito(
  intentos: number,
  error: unknown,
): boolean {
  if (
    error instanceof ApiError &&
    ESTADOS_SIN_REINTENTO.includes(error.status)
  ) {
    return false;
  }

  return intentos < 1;
}

export function esErrorHttp(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

export function codigoErrorCarrito(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

/** El carrito dejó de existir o ya no está activo. */
export function esErrorCarritoInactivo(error: unknown): boolean {
  return (
    esErrorHttp(error, 409) ||
    (esErrorHttp(error, 404) &&
      codigoErrorCarrito(error) === 'CART_NOT_FOUND')
  );
}

/** Carrito activo del cliente autenticado. El backend responde 404 si no existe. */
export function useCarritoActualQuery(userId: number) {
  const habilitada = Number.isSafeInteger(userId) && userId > 0;

  return useQuery({
    queryKey: carritoQueryKeys.current(userId),
    queryFn: () => carritoApi.getCurrent(),
    enabled: habilitada,
    retry: reintentarConsultaCarrito,
  });
}

/** Artículos y total del carrito vigente. */
export function useCarritoItemsQuery(
  carritoId: number | null | undefined,
  userId: number,
) {
  const habilitada =
    typeof carritoId === 'number' &&
    Number.isSafeInteger(carritoId) &&
    carritoId > 0 &&
    Number.isSafeInteger(userId) &&
    userId > 0;

  return useQuery({
    queryKey: carritoQueryKeys.items(carritoId ?? 0, userId),
    queryFn: () => carritoApi.getItems(carritoId as number),
    enabled: habilitada,
    retry: reintentarConsultaCarrito,
  });
}
