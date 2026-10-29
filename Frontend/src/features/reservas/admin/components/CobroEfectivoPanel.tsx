import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import { formatGTQ } from '@/features/mis-reservas/formato';
import { reservasApi } from '../../api/reservasApi';
import { reservasAdminQueryKeys } from '../types';
import { reservasHabitacionQueryKeys } from '../../constants/queryKeys';

export const TEXTOS_COBRO = {
  es: {
    title: 'Cobro en efectivo', total: 'Total', paid: 'Pagado', processing: 'En proceso', balance: 'Saldo',
    confirm: (amount: string) => `Confirmo que recibí ${amount} en efectivo`, register: 'Registrar cobro', registering: 'Registrando…',
    paidDone: 'Reserva pagada', processingNote: 'Hay un pago en proceso para esta reserva; no registre efectivo hasta que se resuelva.',
    notPayable: 'La reserva no admite cobros en su estado actual.', success: 'Cobro en efectivo registrado. La reserva quedó confirmada.',
    loading: 'Consultando saldo…', fullOnly: 'Se cobra el saldo completo: las habitaciones no admiten pagos parciales.',
  },
  en: {
    title: 'Cash payment', total: 'Total', paid: 'Paid', processing: 'In progress', balance: 'Balance',
    confirm: (amount: string) => `I confirm I received ${amount} in cash`, register: 'Record payment', registering: 'Recording…',
    paidDone: 'Reservation paid', processingNote: 'A payment for this reservation is in progress; do not record cash until it is resolved.',
    notPayable: 'This reservation cannot receive payments in its current state.', success: 'Cash payment recorded. The reservation is now confirmed.',
    loading: 'Checking balance…', fullOnly: 'The full balance is charged: rooms do not accept partial payments.',
  },
} as const;

/** Clave por intento de cobro: un reintento con la misma clave devuelve el mismo pago (nunca duplica). */
export const nuevaClaveCobro = () => `efe_${(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/[^A-Za-z0-9]/g, '')}`;

/**
 * Cobro en efectivo de recepción para una reserva de su sede. El importe es siempre el
 * saldo que calcula el servidor y exige confirmar explícitamente que se recibió el dinero.
 */
export const CobroEfectivoPanel: React.FC<{ reservaId: number; estadoReserva: string }> = ({ reservaId, estadoReserva }) => {
  const { locale } = useLocale();
  const t = TEXTOS_COBRO[locale === 'en' ? 'en' : 'es'];
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recibido, setRecibido] = useState(false);
  const clave = useRef(nuevaClaveCobro());

  const saldoQuery = useQuery({
    queryKey: [...reservasAdminQueryKeys.all, 'saldo', reservaId, user?.id],
    queryFn: ({ signal }) => reservasApi.getSaldoRecepcion(reservaId, signal),
    staleTime: 0,
  });
  const cobro = useMutation({
    mutationFn: (monto: number) => reservasApi.registrarEfectivo(reservaId, { monto, idempotency_key: clave.current, efectivo_recibido: true }),
    retry: false,
    onSuccess: () => {
      clave.current = nuevaClaveCobro();
      setRecibido(false);
      void queryClient.invalidateQueries({ queryKey: reservasAdminQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: reservasHabitacionQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    // Ante un error la clave se conserva: si el cobro llegó a registrarse, el reintento lo devuelve sin duplicarlo.
    onError: () => { void saldoQuery.refetch(); },
  });

  const s = saldoQuery.data;
  const row = (label: string, value: number, strong = false) => <div className="flex justify-between gap-3"><dt className="text-neutro-600">{label}</dt><dd className={'tabular-nums ' + (strong ? 'font-semibold text-neutro-900' : 'text-neutro-800')}>{formatGTQ(value)}</dd></div>;

  return (
    <section aria-label={t.title} className="rounded-xl border border-neutro-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-neutro-900"><Banknote className="size-4 text-bronce-700" aria-hidden="true" />{t.title}</h2>
      {saldoQuery.isLoading && <p className="mt-2 text-sm text-neutro-500" role="status">{t.loading}</p>}
      {saldoQuery.isError && <div className="mt-2"><Alert tone="error">{getApiErrorMessage(saldoQuery.error)}</Alert></div>}
      {s && <>
        <dl className="mt-3 space-y-1 text-sm">
          {row(t.total, s.total)}
          {s.aprobado > 0 && row(t.paid, s.aprobado)}
          {s.en_proceso > 0 && row(t.processing, s.en_proceso)}
          {row(t.balance, s.saldo, true)}
        </dl>
        {cobro.isSuccess ? <div className="mt-3"><Alert tone="success">{t.success}</Alert></div>
          : s.saldo <= 0 ? <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-exito-700" role="status"><CheckCircle2 className="size-4" aria-hidden="true" />{t.paidDone}</p>
          : s.en_proceso > 0 ? <p className="mt-3 inline-flex items-start gap-1.5 text-sm text-neutro-700" role="status"><Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t.processingNote}</p>
          : (s.estado !== 'pendiente' || estadoReserva !== 'pendiente') ? <p className="mt-3 text-sm text-neutro-600">{t.notPayable}</p>
          : <div className="mt-3 space-y-3">
            <label className="flex items-start gap-2 text-sm text-neutro-800">
              <input type="checkbox" className="mt-0.5 size-4 accent-bronce-700" checked={recibido} onChange={(e) => setRecibido(e.target.checked)} />
              <span>{t.confirm(formatGTQ(s.saldo) ?? '')}</span>
            </label>
            <p className="text-xs text-neutro-500">{t.fullOnly}</p>
            {cobro.isError && <Alert tone="error">{getApiErrorMessage(cobro.error)}</Alert>}
            <Button onClick={() => cobro.mutate(s.saldo)} disabled={!recibido || cobro.isPending} isLoading={cobro.isPending}>{cobro.isPending ? t.registering : t.register}</Button>
          </div>}
      </>}
    </section>
  );
};
