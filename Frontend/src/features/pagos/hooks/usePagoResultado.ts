import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { pagosApi } from '../api/pagosApi';
import { pagosQueryKeys } from '../constants/queryKeys';
import { clearMatchingStoredAttempt } from '../utils/idempotency';
import type { Pago } from '../types';

export function usePagoResultado(pagoId: number) {
  const { user, status } = useAuth();
  const queryClient = useQueryClient();

  const isCliente = status === 'authenticated' && user?.rol === 'cliente';
  const isValidId = Number.isInteger(pagoId) && pagoId > 0;
  const isEnabled = isCliente && Boolean(user?.id) && isValidId;

  const queryKey = pagosQueryKeys.detail(pagoId, user?.id);

  const query = useQuery<Pago, Error>({
    queryKey,
    queryFn: () => pagosApi.getById(pagoId),
    enabled: isEnabled,
    refetchInterval: (q) => {
      // Bloquear polling si el usuario no es cliente o la consulta está inhabilitada
      if (!isEnabled) return false;
      const data = q.state.data;
      if (!data) return false;
      // Mantener sondeo activo únicamente en estados no terminales
      if (data.estado === 'pendiente' || data.estado === 'procesando') {
        return 2500;
      }
      return false;
    },
    refetchIntervalInBackground: false,
  });

  const pago = query.data;

  // Manejo de efectos colaterales al alcanzar estados terminales verificados
  useEffect(() => {
    if (!pago || !user?.id) return;

    if (pago.estado === 'aprobado') {
      // Solo ejecutar utilidades de carrito si pago.carrito_id es válido
      if (pago.carrito_id !== null) {
        clearMatchingStoredAttempt(
          user.id,
          pago.carrito_id,
          pago.id,
          pago.idempotency_key
        );
        void queryClient.invalidateQueries({ queryKey: ['carrito'] });
        void queryClient.invalidateQueries({ queryKey: ['carritos'] });
        void queryClient.invalidateQueries({
          queryKey: pagosQueryKeys.resumenCarrito(pago.carrito_id, user.id),
        });
        void queryClient.invalidateQueries({
          queryKey: pagosQueryKeys.intentoActivo(pago.carrito_id, user.id),
        });
        // Invalidar reservas de habitación, actividad, bienestar y eventos al aprobar el carrito
        void queryClient.invalidateQueries({ queryKey: ['reservas-habitacion'] });
        void queryClient.invalidateQueries({ queryKey: ['reservas-actividad'] });
        void queryClient.invalidateQueries({ queryKey: ['citas-bienestar'] });
        void queryClient.invalidateQueries({ queryKey: ['reservas-evento'] });
      } else if (pago.reserva_habitacion_id !== null) {
        // Si no proviene de carrito sino de reserva directa, invalidar reservas
        void queryClient.invalidateQueries({ queryKey: ['reservas-habitacion'] });
        void queryClient.invalidateQueries({
          queryKey: ['reservas-habitacion', 'detail', pago.reserva_habitacion_id],
        });
        void queryClient.invalidateQueries({
          queryKey: ['reservas-habitacion', 'mine', user.id],
        });
        void queryClient.invalidateQueries({
          queryKey: ['pagos', 'resumen', 'reserva', pago.reserva_habitacion_id],
        });
      }

      // Invalidar consultas generales de pagos
      void queryClient.invalidateQueries({ queryKey: pagosQueryKeys.all });
    } else if (pago.estado === 'cancelado') {
      // Estado cancelado: limpiar clave guardada únicamente si coincide con el pago mostrado
      if (pago.carrito_id !== null) {
        clearMatchingStoredAttempt(
          user.id,
          pago.carrito_id,
          pago.id,
          pago.idempotency_key
        );
        void queryClient.invalidateQueries({
          queryKey: pagosQueryKeys.intentoActivo(pago.carrito_id, user.id),
        });
        void queryClient.invalidateQueries({
          queryKey: pagosQueryKeys.resumenCarrito(pago.carrito_id, user.id),
        });
      }
    }
  }, [pago, user?.id, queryClient]);

  return {
    ...query,
    pago,
    isCliente,
    isAuthLoading: status === 'loading',
    isValidId,
  };
}
