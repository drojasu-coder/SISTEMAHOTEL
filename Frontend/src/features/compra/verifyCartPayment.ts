import type { QueryClient } from '@tanstack/react-query';
import { pagosApi } from '@/features/pagos/api/pagosApi';
import { pagosQueryKeys } from '@/features/pagos/constants/queryKeys';
/** Solo lecturas; conserva un resultado incierto como tal antes de revalidar un carrito vencido. */
export async function verifyCartPayment(client: QueryClient, userId: number, cartId: number, knownPaymentId: number | null) {
  let paymentId = knownPaymentId; let uncertain = false;
  try {
    const attempt = await client.fetchQuery({ queryKey: pagosQueryKeys.intentoActivo(cartId, userId), queryFn: () => pagosApi.getIntentoActivo(cartId), staleTime: 0, retry: false });
    if (attempt) paymentId = attempt.pago_id;
  } catch { uncertain = true; }
  if (paymentId !== null && Number.isSafeInteger(paymentId) && paymentId > 0) {
    try {
      const verifiedId = paymentId;
      const payment = await client.fetchQuery({ queryKey: pagosQueryKeys.detail(verifiedId, userId), queryFn: () => pagosApi.getById(verifiedId), staleTime: 0, retry: false });
      if (payment.id !== paymentId || payment.carrito_id !== cartId) { paymentId = null; uncertain = true; }
    } catch { uncertain = true; }
  } else if (paymentId !== null) { paymentId = null; uncertain = true; }
  return { paymentId, uncertain };
}
