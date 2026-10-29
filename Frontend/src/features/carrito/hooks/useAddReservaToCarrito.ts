import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client/http';
import { useAuth } from '@/features/auth/AuthContext';
import { carritoApi } from '../api/carritoApi';
import { carritoQueryKeys } from '../constants/queryKeys';
import { textosCarrito } from '../textos';
import type { CarritoItem, TipoItemCarrito } from '../types';
import type { ExtraKey } from '@/i18n/publicExtra';

export interface UseAddReservaToCarritoOptions {
  tipo_item?: TipoItemCarrito;
  onSuccess?: (item: CarritoItem) => void;
  onError?: (error: unknown) => void;
}

export interface EstadoFeedbackAnadir {
  tono: 'success' | 'warning' | 'error' | 'info';
  texto: string;
  verCarrito?: boolean;
  esIncierto?: boolean;
  publicKey?: ExtraKey;
}

/**
 * Hook reutilizable para añadir una reserva de habitación existente al carrito activo.
 *
 * Reglas de negocio e integración:
 * 1. Invoca carritoApi.getOrCreateActiveCart() solo al ejecutar la mutación.
 * 2. Envía { tipo_item: "habitacion", referencia_id: reservaId }.
 * 3. retry: false (no repetir escrituras ante fallos de red).
 * 4. Maneja códigos reales del backend:
 *    - CART_ITEM_ALREADY_EXISTS (409): La reserva ya está en el carrito.
 *    - CART_REFERENCE_NOT_OWNED (403): La reserva es ajena.
 *    - CART_REFERENCE_NOT_AVAILABLE (409): Estado no disponible o totalmente pagada.
 *    - CART_NOT_ACTIVE (409): Carrito expiró durante la operación.
 * 5. Si ocurre error de red (TypeError o ApiError status 0), marca resultado incierto.
 * 6. Tras éxito, invalida las claves por usuario de carrito actual e ítems.
 */
export function useAddReservaToCarrito(options?: UseAddReservaToCarritoOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<EstadoFeedbackAnadir | null>(null);
  const adding = useRef(false);

  const mutation = useMutation({
    mutationFn: async (reservaId: number) => {
      // 1. Obtener o crear carrito activo para el cliente autenticado
      const carrito = await carritoApi.getOrCreateActiveCart();

      // 2. Añadir la referencia de la reserva existente
      const item = await carritoApi.addItem(carrito.id, {
        tipo_item: options?.tipo_item ?? 'habitacion',
        referencia_id: reservaId,
      });

      return { item, carritoId: carrito.id };
    },
    retry: false,
    onSuccess: ({ item, carritoId }) => {
      const userId = user?.id;

      // Invalidar claves de consulta aisladas por usuario
      void queryClient.invalidateQueries({
        queryKey: carritoQueryKeys.current(userId),
      });
      // La reserva ya está en el carrito: su estado de carrito/pago debe reflejarlo.
      void queryClient.invalidateQueries({ queryKey: [...carritoQueryKeys.all, 'estado-referencia'] });
      void queryClient.invalidateQueries({
        queryKey: carritoQueryKeys.items(carritoId, userId),
      });

      setFeedback({
        tono: 'success',
        texto: textosCarrito.anadirExito,
        publicKey: 'addedCart',
        verCarrito: true,
      });

      options?.onSuccess?.(item);
    },
    onError: (error) => {
      const userId = user?.id;

      // Ante error, invalidar para refrescar el estado del carrito
      void queryClient.invalidateQueries({
        queryKey: carritoQueryKeys.current(userId),
      });
      void queryClient.invalidateQueries({ queryKey: [...carritoQueryKeys.all, 'estado-referencia'] });

      if (error instanceof ApiError) {
        if (error.code === 'CART_ITEM_ALREADY_EXISTS') {
          setFeedback({
            tono: 'info',
            texto: textosCarrito.yaEnCarrito,
            publicKey: 'wellnessCartAlready',
            verCarrito: true,
          });
          options?.onError?.(error);
          return;
        }

        if (error.code === 'CART_REFERENCE_NOT_OWNED' || error.status === 403) {
          setFeedback({
            tono: 'error',
            texto: textosCarrito.referenciaAjena,
            publicKey: 'wellnessCartNotOwned',
          });
          options?.onError?.(error);
          return;
        }

        if (error.code === 'CART_REFERENCE_NOT_AVAILABLE') {
          setFeedback({
            tono: 'warning',
            texto: textosCarrito.referenciaNoDisponible,
            publicKey: 'wellnessCartUnavailable',
          });
          options?.onError?.(error);
          return;
        }

        if (error.code === 'CART_NOT_ACTIVE') {
          setFeedback({
            tono: 'warning',
            texto: textosCarrito.carritoInactivo,
            publicKey: 'wellnessCartInactive',
          });
          options?.onError?.(error);
          return;
        }

        if (error.status === 0) {
          setFeedback({
            tono: 'warning',
            texto: textosCarrito.errorRedAnadir,
            publicKey: 'wellnessCartUncertain',
            verCarrito: true,
            esIncierto: true,
          });
          options?.onError?.(error);
          return;
        }
      }

      // Si es un TypeError (error de red nativo de fetch)
      if (error instanceof TypeError) {
        setFeedback({
          tono: 'warning',
          texto: textosCarrito.errorRedAnadir,
          publicKey: 'wellnessCartUncertain',
          verCarrito: true,
          esIncierto: true,
        });
        options?.onError?.(error);
        return;
      }

      setFeedback({
        tono: 'error',
        texto: textosCarrito.errorAnadirGenerico,
        publicKey: 'wellnessCartFailed',
      });
      options?.onError?.(error);
    },
    onSettled: () => { adding.current = false; },
  });

  return {
    anadirAlCarrito: (reservaId: number) => {
      if (adding.current) return;
      adding.current = true;
      setFeedback(null);
      mutation.mutate(reservaId);
    },
    isLoading: mutation.isPending,
    feedback,
    limpiarFeedback: () => setFeedback(null),
  };
}
