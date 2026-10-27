import { useIntentoActivoQuery, usePagoQuery } from '@/features/pagos/hooks/useCheckoutQueries';
import { getStoredCheckoutAttempt } from '@/features/pagos/utils/idempotency';
/** No interpreta errores o intentos incompletos como ausencia de un compromiso. */
export function useCartPaymentLock(cartId: number | null, userId: number) {
  const attempt = useIntentoActivoQuery(cartId, userId, cartId !== null);
  const stored = cartId !== null ? getStoredCheckoutAttempt(userId, cartId) : null;
  const payment = usePagoQuery(stored?.pagoId, userId);
  const locked = cartId !== null && (attempt.isPending || attempt.isFetching || attempt.isError || attempt.data !== null || Boolean(stored?.pagoId));
  return { locked, attempt, payment, hasStoredPayment: Boolean(stored?.pagoId) };
}
