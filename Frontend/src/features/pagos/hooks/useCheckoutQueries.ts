import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../api/pagosApi';
import { pagosQueryKeys } from '../constants/queryKeys';

const idValido = (value: number | null | undefined): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value > 0;

/**
 * Resumen financiero calculado por el servidor para el carrito.
 *
 * No se reintenta automáticamente: un error de resumen debe ser visible y el
 * usuario debe decidir cuándo volver a consultarlo. Tampoco se recalcula nada
 * en el cliente.
 */
export function useResumenCheckoutQuery(
  carritoId: number | null | undefined,
  userId: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: pagosQueryKeys.resumenCarrito(carritoId ?? 0, userId),
    queryFn: () => pagosApi.getResumen({ carrito_id: carritoId as number }),
    enabled: enabled && idValido(carritoId) && idValido(userId),
    retry: false,
  });
}

/**
 * Intento de pago activo recuperado de forma autorizada.
 *
 * Un error de esta consulta no equivale a "no existe intento": la pantalla
 * debe bloquear el cobro y ofrecer una comprobación manual.
 */
export function useIntentoActivoQuery(
  carritoId: number | null | undefined,
  userId: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: pagosQueryKeys.intentoActivo(carritoId ?? 0, userId),
    queryFn: () => pagosApi.getIntentoActivo(carritoId as number),
    enabled: enabled && idValido(carritoId) && idValido(userId),
    retry: false,
  });
}

/** Detalle del pago local, usado para verificar la confirmación del servidor. */
export function usePagoQuery(
  pagoId: number | null | undefined,
  userId: number,
) {
  return useQuery({
    queryKey: pagosQueryKeys.detail(pagoId ?? 0, userId),
    queryFn: () => pagosApi.getById(pagoId as number),
    enabled: idValido(pagoId) && idValido(userId),
    retry: false,
  });
}
