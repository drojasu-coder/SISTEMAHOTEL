import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XCircle } from 'lucide-react';
import { ApiError } from '@/api/client/http';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { useLocale } from '@/i18n/LocaleContext';
import { reservasApi, reservasHabitacionQueryKeys } from '@/features/reservas';
import { carritoQueryKeys } from '@/features/carrito/constants/queryKeys';

const T = {
  es: {
    action: 'Cancelar reserva', cancelLabel: (id: number) => `Cancelar la reserva #${id}`, title: 'Cancelar reserva', keep: 'Conservar reserva', confirm: 'Sí, cancelar', working: 'Cancelando…',
    body: (id: number) => `La reserva #${id} se cancelará y la habitación quedará libre para otros huéspedes.`,
    cart: 'Si estaba en su carrito, se retirará automáticamente.',
    done: 'Reserva cancelada.',
    cartNotUpdated: 'No pudimos retirarla del carrito. No podrá pagarse; retírela desde el carrito.',
    errors: {
      RESERVATION_PAYMENT_IN_PROGRESS: 'No podemos cancelar mientras el estado del pago sea incierto. Consulte su estado o contacte con el hotel; su reserva permanece protegida.',
      RESERVATION_HAS_APPROVED_PAYMENT: 'Esta reserva ya tiene un pago aprobado y no puede cancelarse desde aquí.',
      RESERVATION_NOT_CANCELLABLE: 'Esta reserva ya no puede cancelarse.',
      RESERVATION_BUSY: 'La reserva se está procesando. Inténtelo de nuevo en unos segundos.',
      RESERVA_HABITACION_NOT_FOUND: 'No encontramos esta reserva.',
      network: 'No fue posible conectar con el servidor. Revise su conexión e inténtelo de nuevo.',
      generic: 'No fue posible cancelar la reserva. Inténtelo de nuevo.',
    } as Record<string, string>,
  },
  en: {
    action: 'Cancel reservation', cancelLabel: (id: number) => `Cancel reservation #${id}`, title: 'Cancel reservation', keep: 'Keep reservation', confirm: 'Yes, cancel', working: 'Cancelling…',
    body: (id: number) => `Reservation #${id} will be cancelled and the room will be released for other guests.`,
    cart: 'If it was in your cart, it will be removed automatically.',
    done: 'Reservation cancelled.',
    cartNotUpdated: 'We could not remove it from your cart. It cannot be paid; remove it from the cart.',
    errors: {
      RESERVATION_PAYMENT_IN_PROGRESS: 'We cannot cancel while the payment status is uncertain. Check its status or contact the hotel; your reservation remains protected.',
      RESERVATION_HAS_APPROVED_PAYMENT: 'This reservation already has an approved payment and cannot be cancelled here.',
      RESERVATION_NOT_CANCELLABLE: 'This reservation can no longer be cancelled.',
      RESERVATION_BUSY: 'The reservation is being processed. Please try again in a few seconds.',
      RESERVA_HABITACION_NOT_FOUND: 'We could not find this reservation.',
      network: 'Could not reach the server. Check your connection and try again.',
      generic: 'The reservation could not be cancelled. Please try again.',
    } as Record<string, string>,
  },
} as const;

/** Cancelación voluntaria de una reserva pendiente propia. El servidor decide si es seguro; aquí solo se muestra el resultado real. */
/** `onCancelled` permite al contenedor seguir mostrando este componente (y su mensaje de éxito) cuando la lista se refresca y la reserva ya no está pendiente. */
export const CancelarReservaPropia: React.FC<{ reservaId: number; compact?: boolean; onCancelled?: () => void }> = ({ reservaId, compact = false, onCancelled }) => {
  const { locale } = useLocale();
  const t = T[locale === 'en' ? 'en' : 'es'];
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [cartNotUpdated, setCartNotUpdated] = useState(false);
  const mutation = useMutation({
    mutationFn: () => reservasApi.cancelMine(reservaId),
    retry: false,
    onSuccess: async (result) => {
      setDone(true); setOpen(false); setError(null); setCartNotUpdated(!result.carritoActualizado);
      onCancelled?.();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reservasHabitacionQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: carritoQueryKeys.all }),
      ]);
    },
    onError: (e: unknown) => {
      const code = e instanceof ApiError ? (e.status === 0 ? 'network' : e.code ?? 'generic') : 'generic';
      setError(t.errors[code] ?? t.errors.generic);
    },
  });
  if (done) return (
    <div role="status" className="flex flex-col gap-1">
      <p className="text-sm font-medium text-exito-700">{t.done}</p>
      {cartNotUpdated && <p className="text-xs text-advertencia-800">{t.cartNotUpdated}</p>}
    </div>
  );
  return (
    <>
      <Button type="button" variant={compact ? 'text' : 'secondary'} size="sm" aria-label={t.cancelLabel(reservaId)} onClick={() => { setError(null); setOpen(true); }}
        className="text-error-700 hover:bg-error-50">
        <XCircle className="size-4" aria-hidden="true" />{t.action}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} busy={mutation.isPending} busyLabel={t.working} title={t.title} closeLabel={locale === 'en' ? 'Close' : 'Cerrar'}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutro-800">{t.body(reservaId)}</p>
          <p className="text-xs text-neutro-600">{t.cart}</p>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>{t.keep}</Button>
            <Button type="button" onClick={() => mutation.mutate()} isLoading={mutation.isPending}>{mutation.isPending ? t.working : t.confirm}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
