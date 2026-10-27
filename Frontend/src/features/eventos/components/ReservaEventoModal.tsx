import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { Modal } from '@/components/ui/Modal';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { useRevalidateErrors, usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { useCreateReservaEventoMutation } from '../hooks/useEventos';
import {
  buildReservaEventoSchema,
  type CreateReservaEventoFormData,
} from '../schemas/evento.schemas';

import type { Salon, ReservaEvento, TipoEvento } from '../types';

interface ReservaEventoModalProps {
  salon: Salon;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reserva: ReservaEvento) => void;
}

export const ReservaEventoModal: React.FC<ReservaEventoModalProps> = ({
  salon,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const textosEventos = usePublicTexts('eventos');
  const { p, locale} = usePublicInterface();
  const etiquetasTipoEvento = usePublicTexts('tiposEvento');
  const siteBlocked = useDraftSiteGuard(salon?.id, salon?.sucursal_id);
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<LocalizedError | null>(null);

  const createMutation = useCreateReservaEventoMutation();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateReservaEventoFormData>({
    resolver: zodResolver(buildReservaEventoSchema(p), { errorMap: () => ({ message: p('invalidField') }) }),
    defaultValues: {
      salon_id: salon.id ?? 0,
      tipo_evento: 'ejecutivo',
      fecha: defaultDate,
      hora_inicio: '10:00',
      hora_fin: '14:00',
      numero_invitados: Math.min(50, salon.capacidad_maxima ?? 50),
    },
  });

  useRevalidateErrors(locale, () => trigger(), Object.keys(errors).length > 0);

  if (!isOpen) return null;

  const onSubmit = async (data: CreateReservaEventoFormData) => {
    if (createMutation.isPending) return;
    if (status !== 'authenticated' || !user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    setErrorMessage(null);
    try {
      const nuevaReserva = await createMutation.mutateAsync({
        salon_id: salon.id!,
        tipo_evento: data.tipo_evento,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        numero_invitados: Number(data.numero_invitados),
      });

      reset();
      if (onSuccess) {
        onSuccess(nuevaReserva);
      } else {
        navigate(`/mis-reservas/eventos/${nuevaReserva.id}`);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage({ api: err });
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} closeLabel={p('closeModal')} title={textosEventos.modalReservaTitulo} description={textosEventos.modalReservaSubtitulo} busy={createMutation.isPending || isSubmitting} busyLabel={p('processingRequest')}>
        {/* Resumen del Salón */}
        <div className="my-4 rounded-lg bg-neutro-50 p-4 border border-neutro-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-neutro-500 block">{p('maxVenueCapacity')}</span>
            <span className="font-semibold text-neutro-800">{salon.capacidad_maxima} {' '}{p('people')}</span>
          </div>
          <div>
            <span className="text-neutro-500 block">{p('venueBaseRate')}</span>
            <span className="font-semibold text-bronce-700"><MoneyReference amount={salon.tarifa_base} /></span>
          </div>
          {salon.sucursal?.nombre && (
            <div>
              <span className="text-neutro-500 block">{p('siteLabel')}</span>
              <span className="font-semibold text-neutro-800"><span lang="es">{salon.sucursal.nombre}</span></span>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4">
            <Alert tone="error" title={p('quoteError')}>
              <TranslatedError error={errorMessage} />
            </Alert>
          </div>
        )}

        <form onSubmit={(event) => { if (siteBlocked || createMutation.isPending) { event.preventDefault(); return; } void handleSubmit(onSubmit)(event); }} className="flex flex-col gap-4 text-sm">
              <DraftSiteNotice blocked={siteBlocked} /><fieldset disabled={siteBlocked || createMutation.isPending || isSubmitting} className="contents">
          <Select label={textosEventos.campoTipoEvento} id="tipo_evento" {...register('tipo_evento')} error={errors.tipo_evento?.message}>
            {(Object.keys(etiquetasTipoEvento) as TipoEvento[]).map((tipo) => <option key={tipo} value={tipo}>{etiquetasTipoEvento[tipo]}</option>)}
          </Select>
          <DateField label={textosEventos.campoFecha} id="fecha" {...register('fecha')} error={errors.fecha?.message} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TimeField label={textosEventos.campoHoraInicio} id="hora_inicio" {...register('hora_inicio')} error={errors.hora_inicio?.message} />
            <TimeField label={textosEventos.campoHoraFin} id="hora_fin" {...register('hora_fin')} error={errors.hora_fin?.message} />
          </div>
          <Input label={`${textosEventos.campoInvitados} (${p('maxShort')} ${salon.capacidad_maxima})`} id="numero_invitados" type="number" {...register('numero_invitados', { valueAsNumber: true })} min={1} max={salon.capacidad_maxima ?? 500} error={errors.numero_invitados?.message} />

          <div className="rounded-lg bg-selva-50 border border-selva-200 p-3 text-xs text-selva-800">
            {textosEventos.avisoDisponibilidad}
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting || createMutation.isPending}>
              {' '}{p('cancel')}{' '}</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending
                ? textosEventos.creandoCotizacion
                : textosEventos.botonCrearCotizacion}
            </Button>
          </div>
        </fieldset></form>
    </Modal>
  );
};
