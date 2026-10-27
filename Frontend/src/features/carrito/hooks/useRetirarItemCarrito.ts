import { useMutation, useQueryClient } from '@tanstack/react-query';
import { carritoApi } from '../api/carritoApi';
import { carritoQueryKeys } from '../constants/queryKeys';
import { esErrorCarritoInactivo } from './useCarritoPantalla';

export interface RetirarItemCarritoInput {
  carritoId: number;
  itemId: number;
}

/**
 * Retira un artículo del carrito activo.
 *
 * - La mutación nunca reintenta automáticamente: un DELETE repetido podría
 *   ocultar el estado real del servidor.
 * - Tras cualquier resultado se refrescan el carrito y sus artículos.
 * - Si el carrito venció o dejó de existir, se reinician las consultas para
 *   descartar los datos anteriores y comprobar el estado vigente sin crear un
 *   carrito nuevo.
 */
export function useRetirarItemCarrito(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ carritoId, itemId }: RetirarItemCarritoInput) =>
      carritoApi.removeItem(carritoId, itemId),
    retry: false,
    onSuccess: (_data, { carritoId }) => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: carritoQueryKeys.items(carritoId, userId),
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: carritoQueryKeys.current(userId),
          exact: true,
        }),
      ]);
    },
    onError: (error, { carritoId }) => {
      const consultas = [
        carritoQueryKeys.items(carritoId, userId),
        carritoQueryKeys.current(userId),
      ];

      if (esErrorCarritoInactivo(error)) {
        void Promise.all(
          consultas.map((queryKey) =>
            queryClient.resetQueries({ queryKey, exact: true }),
          ),
        );
        return;
      }

      void Promise.all(
        consultas.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey, exact: true }),
        ),
      );
    },
  });
}
