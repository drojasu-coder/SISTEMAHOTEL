import { useMutation } from '@tanstack/react-query';
import { pagosApi } from '../api/pagosApi';
import { recordCheckoutPagoId } from '../utils/idempotency';
import type { CreatePagoSuccessData } from '../types';

export interface CrearIntentoPagoInput {
  carritoId: number;
  monto: number;
  idempotencyKey: string;
}

/**
 * Crea o reproduce un intento de pago con tarjeta.
 *
 * La mutación nunca reintenta automáticamente: un POST repetido sin control
 * puede ocultar el estado real del intento. El usuario debe solicitar
 * explícitamente cualquier reintento y se reutiliza la misma clave.
 */
export function useCrearIntentoPago(userId: number) {
  return useMutation<CreatePagoSuccessData, Error, CrearIntentoPagoInput>({
    mutationFn: ({ carritoId, monto, idempotencyKey }) =>
      pagosApi.create({
        carrito_id: carritoId,
        monto,
        metodo: 'tarjeta',
        tipo_pago: 'total',
        moneda: 'GTQ',
        idempotency_key: idempotencyKey,
      }),
    retry: false,
    onSuccess: (data, variables) => {
      recordCheckoutPagoId(userId, variables.carritoId, data.pago_id);
    },
  });
}
