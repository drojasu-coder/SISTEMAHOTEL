import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CreditCard, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { PAGOS_ROUTES } from '@/features/pagos/constants/routes';
import { ApiError } from '@/api/client/http';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/i18n/LocaleContext';
import { reservasApi, reservasHabitacionQueryKeys } from '@/features/reservas';
import { carritoQueryKeys } from '@/features/carrito/constants/queryKeys';
import { CARRITO_ROUTES } from '@/features/carrito/constants/routes';

const T = {
  es: {
    check: 'Consultar estado', checking: 'Consultando…', uncertain: 'El pago está pendiente de verificar. No inicie otro cobro. Consulte su estado o contacte con el hotel.', unavailable: 'Esta reserva ya no está disponible para pago.', paid: 'Esta reserva ya tiene un pago aprobado.', statusError: 'No pudimos consultar el estado del pago. Inténtelo de nuevo.',
    action: 'Continuar con el pago', label: (id: number) => `Continuar con el pago de la reserva #${id}`, working: 'Preparando…',
    errors: {
      RESERVATION_PAYMENT_WINDOW_EXPIRED: 'El plazo para pagar esta reserva venció. Cancélela y cree una nueva.',
      RESERVATION_PAYMENT_IN_PROGRESS: 'El pago está pendiente de verificar. Consulte su estado o contacte con el hotel; no inicie otro cobro.',
      RESERVATION_HAS_APPROVED_PAYMENT: 'Esta reserva ya tiene un pago aprobado.',
      CART_HAS_PROCESSING_PAYMENT: 'Su carrito tiene un pago pendiente de verificar. Consulte su estado o contacte con el hotel.',
      RESERVATION_NOT_PAYABLE: 'Esta reserva ya no está pendiente de pago.',
      RESERVATION_STAY_ENDED: 'La estancia de esta reserva ya terminó y no puede pagarse.',
      RESERVATION_BUSY: 'La reserva se está procesando. Inténtelo de nuevo en unos segundos.',
      RESERVA_HABITACION_NOT_FOUND: 'No encontramos esta reserva.',
      network: 'No fue posible conectar con el servidor. Revise su conexión e inténtelo de nuevo.',
      generic: 'No fue posible preparar el pago. Inténtelo de nuevo.',
    } as Record<string, string>,
  },
  en: {
    check: 'Check status', checking: 'Checking…', uncertain: 'The payment is awaiting verification. Do not start another payment. Check its status or contact the hotel.', unavailable: 'This reservation is no longer available for payment.', paid: 'This reservation already has an approved payment.', statusError: 'We could not check the payment status. Please try again.',
    action: 'Continue to payment', label: (id: number) => `Continue to payment for reservation #${id}`, working: 'Preparing…',
    errors: {
      RESERVATION_PAYMENT_WINDOW_EXPIRED: 'The payment window for this reservation has expired. Cancel it and create a new one.',
      RESERVATION_PAYMENT_IN_PROGRESS: 'The payment is awaiting verification. Check its status or contact the hotel; do not start another payment.',
      RESERVATION_HAS_APPROVED_PAYMENT: 'This reservation already has an approved payment.',
      CART_HAS_PROCESSING_PAYMENT: 'Your cart has a payment awaiting verification. Check its status or contact the hotel.',
      RESERVATION_NOT_PAYABLE: 'This reservation is no longer awaiting payment.',
      RESERVATION_STAY_ENDED: 'This reservation’s stay has ended and it can no longer be paid.',
      RESERVATION_BUSY: 'The reservation is being processed. Please try again in a few seconds.',
      RESERVA_HABITACION_NOT_FOUND: 'We could not find this reservation.',
      network: 'Could not reach the server. Check your connection and try again.',
      generic: 'Payment could not be prepared. Please try again.',
    } as Record<string, string>,
  },
} as const;

/**
 * Reanuda el pago de una reserva pendiente propia: el servidor reutiliza la reserva (sin crear otra ni ampliar su plazo),
 * consulta primero su estado y reutiliza el checkout si hay un intento confirmable. Nunca inicia el pago.
 */
export const ContinuarPagoReserva: React.FC<{ reservaId: number; compact?: boolean }> = ({ reservaId, compact = false }) => {
  const { locale } = useLocale();
  const t = T[locale === 'en' ? 'en' : 'es'];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const status = useQuery({
    queryKey: [...reservasHabitacionQueryKeys.detail(reservaId, user?.id), 'estado-pago'],
    queryFn: ({ signal }) => reservasApi.getPaymentStatus(reservaId, signal),
    enabled: Boolean(user),
    retry: false,
    staleTime: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      // Releer al pulsar: otra pestaña o el webhook pueden haber cambiado el estado.
      const current = await status.refetch();
      if (!current.isSuccess) throw current.error;
      if (current.data.estado === 'reanudable') return PAGOS_ROUTES.CHECKOUT;
      if (current.data.estado !== 'pagable') return null;
      await reservasApi.continuePayment(reservaId);
      return CARRITO_ROUTES.CARRITO;
    },
    retry: false,
    onSuccess: async (destination) => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: carritoQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: reservasHabitacionQueryKeys.all }),
      ]);
      if (destination) navigate(destination);
    },
    onError: (e: unknown) => {
      const code = e instanceof ApiError ? (e.status === 0 ? 'network' : e.code ?? 'generic') : 'generic';
      setError(t.errors[code] ?? t.errors.generic);
      void status.refetch();
    },
  });
  const state = !status.isError && !status.isFetching ? status.data?.estado : undefined;
  const canContinue = state === 'pagable' || state === 'reanudable';
  const busy = mutation.isPending || status.isFetching;
  const check = async () => {
    setError(null);
    const current = await status.refetch();
    if (current.isSuccess && current.data.estado === 'incierto' && current.data.pago_id) {
      navigate(PAGOS_ROUTES.RESULTADO(current.data.pago_id));
    }
  };
  return (
    <div className="flex flex-col gap-1">
      {state === 'pagada' ? <p role="status" className="text-xs text-neutro-600">{t.paid}</p>
        : state === 'no_disponible' ? <p role="status" className="text-xs text-neutro-600">{t.unavailable}</p>
        : <Button type="button" className="w-full justify-center" variant={compact ? 'secondary' : 'primary'} size="sm"
            aria-label={canContinue ? t.label(reservaId) : t.check} isLoading={busy} disabled={busy}
            onClick={() => { if (canContinue) { setError(null); mutation.mutate(); } else { void check(); } }}>
            {canContinue ? <CreditCard className="size-4" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            {busy ? t.checking : canContinue ? t.action : t.check}
          </Button>}
      {state === 'incierto' && <p role="status" className="text-xs text-neutro-600">{t.uncertain}</p>}
      {status.isError && <p role="alert" className="text-xs font-medium text-error-700">{t.statusError}</p>}
      {error && <p role="alert" className="text-xs font-medium text-error-700">{error}</p>}
    </div>
  );
};
