import { useEffect, useState, useRef } from 'react';
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
  const isValidId = Number.isSafeInteger(pagoId) && pagoId > 0;
  const isEnabled = isCliente && Boolean(user?.id) && isValidId;

  const pollingDeadline = useRef(Date.now() + 60000);
  const [pollingPaused, setPollingPaused] = useState(false);
  const [pollWindow, setPollWindow] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<unknown>(null);
  const verificationLock = useRef<string | null>(null);
  const context = `${user?.id}:${pagoId}`;
  const currentContext = useRef(context);
  currentContext.current = context;
  useEffect(() => { setVerificationError(null); setIsVerifying(false); }, [context]);
  useEffect(() => {
    pollingDeadline.current = Date.now() + 60000;
    setPollingPaused(false);
    if (!isEnabled) return;
    const deadline = setTimeout(() => setPollingPaused(true), 60000);
    return () => clearTimeout(deadline);
  }, [isEnabled, pagoId, user?.id, pollWindow]);

  const queryKey = pagosQueryKeys.detail(pagoId, user?.id);

  const query = useQuery<Pago, Error>({
    queryKey,
    queryFn: () => pagosApi.getById(pagoId),
    enabled: isEnabled,
    refetchInterval: (q) => {
      // Bloquear polling si el usuario no es cliente o la consulta está inhabilitada
      if (!isEnabled || pollingPaused || Date.now() >= pollingDeadline.current) return false;
      const data = q.state.data;
      if (!data) return false;
      // Mantener sondeo activo únicamente en estados no terminales
      if (data.estado === 'pendiente' || data.estado === 'procesando') {
        return 2500;
      }
      return false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const pago = query.data;

  const verify = async () => {
    if (!isEnabled || verificationLock.current === context) return;
    if (!pago || pago.metodo !== 'tarjeta' || !['pendiente', 'procesando', 'rechazado'].includes(pago.estado)) {
      await query.refetch();
      return;
    }
    verificationLock.current = context;
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const verified = await pagosApi.verify(pagoId);
      if (currentContext.current !== context) return;
      if (verified.id !== pagoId || verified.carrito_id !== pago.carrito_id || verified.reserva_habitacion_id !== pago.reserva_habitacion_id) throw new Error('Payment identity mismatch');
      await query.refetch();
      pollingDeadline.current = Date.now() + 60000;
      setPollWindow((value) => value + 1);
    } catch (error) {
      if (currentContext.current === context) setVerificationError(error);
    } finally {
      if (verificationLock.current === context) verificationLock.current = null;
      if (currentContext.current === context) setIsVerifying(false);
    }
  };

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
    refetch: () => { pollingDeadline.current = Date.now() + 60000; setPollWindow((value) => value + 1); return query.refetch(); },
    pollingPaused,
    verify,
    isVerifying,
    verificationError,
    pago,
    isCliente,
    isAuthLoading: status === 'loading',
    isValidId,
  };
}
