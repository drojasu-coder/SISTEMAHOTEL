import { DateField } from '@/components/ui/DateField';
import { SlotPicker } from '@/components/ui/SlotPicker';
import { formatearHoraFranja, useTextosFranjas } from '@/i18n/franjas';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { ServiceReservationPanel, ServiceAuthNotice } from '@/components/shared/ServiceReservationPanel';
import { useServiceDraft } from '@/features/auth/serviceDraft';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { ApiError } from '@/api/client/http';
import { useRevalidateErrors, usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { publicEventCopy, publicVenueSite, usePublicEventQuoteMutation } from '../publicEventExperience';
import { eventosApi } from '../api/eventosApi';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
  const { p, locale, date: calendarDate } = usePublicInterface();
  const copy = publicEventCopy[locale];
  const etiquetasTipoEvento = usePublicTexts('tiposEvento');
  const siteBlocked = useDraftSiteGuard(salon?.id, salon?.sucursal_id);
  const { user, status } = useAuth();
  const { sites } = usePublicPreferences();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdQuote, setCreatedQuote] = useState<ReservaEvento | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkedEmpty, setCheckedEmpty] = useState(false);
  const submitLock = useRef(false);
  const checkLock = useRef(false);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const attemptKey = user?.id ? `hunahpu.public-event-attempt.v1.${user.id}.${salon.id}` : null;
  const markAttempt = (pending: boolean) => {
    try { if (attemptKey) pending ? sessionStorage.setItem(attemptKey, 'pending') : sessionStorage.removeItem(attemptKey); } catch { /* El bloqueo en memoria permanece activo. */ }
  };
  useEffect(() => {
    setCreatedQuote(null);
    try { setUncertain(Boolean(attemptKey && sessionStorage.getItem(attemptKey) === 'pending')); } catch { setUncertain(false); }
  }, [attemptKey]);

  const createMutation = usePublicEventQuoteMutation();

  const draft = useServiceDraft('eventos', salon.id ?? 0, { fecha: getTodayInGuatemala(), hora_inicio: '', hora_fin: '', numero_invitados: 1, tipo_evento: 'ejecutivo' as TipoEvento });

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateReservaEventoFormData>({
    resolver: zodResolver(buildReservaEventoSchema(p).superRefine((value, context) => {
      if (salon.capacidad_maxima != null && value.numero_invitados > salon.capacidad_maxima) context.addIssue({ code: 'custom', path: ['numero_invitados'], message: copy.capacityError });
    })),
    defaultValues: { ...draft.initial, salon_id: salon.id },
  });

  useEffect(() => {
    const subscription = watch((values) => draft.save(values));
    return () => subscription.unsubscribe();
  }, [watch, draft.save]);

  useRevalidateErrors(locale, () => trigger(), Object.keys(errors).length > 0);

  const fechaElegida = watch('fecha');
  const inicioElegido = watch('hora_inicio');
  const finElegido = watch('hora_fin');
  const disponibilidadQuery = useQuery({
    queryKey: ['salon-disponibilidad', salon.id, fechaElegida],
    queryFn: () => eventosApi.getDisponibilidadSalon(salon.id!, fechaElegida),
    enabled: isOpen && Boolean(salon.id) && /^\d{4}-\d{2}-\d{2}$/.test(fechaElegida ?? ''),
    staleTime: 30_000,
    retry: false,
  });
  // Franjas del backend: horario del salón, solicitudes y eventos existentes.
  const { t: tf, locale: localeFranjas } = useTextosFranjas();
  const disponibilidad = disponibilidadQuery.data;
  const franjas = disponibilidad?.horarios ?? [];
  const franjaElegida = franjas.find((franja) => franja.inicio === (inicioElegido ?? '').slice(0, 5));
  const fines = franjaElegida?.fines ?? [];
  const horarioValido = Boolean(franjaElegida) && fines.includes((finElegido ?? '').slice(0, 5));

  // Al cambiar de fecha, un horario que ya no se ofrece deja de estar elegido.
  useEffect(() => {
    if (!disponibilidadQuery.isSuccess) return;
    if (inicioElegido && !franjaElegida) { setValue('hora_inicio', ''); setValue('hora_fin', ''); }
    else if (finElegido && !fines.includes(finElegido.slice(0, 5))) setValue('hora_fin', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponibilidadQuery.data]);

  if (!isOpen) return null;

  const onSubmit = async (data: CreateReservaEventoFormData) => {
    if (createMutation.isPending || uncertain || createdQuote) return;
    if (status !== 'authenticated' || !user) {
      return;
    }

    setErrorMessage(null);
    const actor = user.id;
    markAttempt(true);
    draft.save(data);
    try {
      const nuevaReserva = await createMutation.mutateAsync({
        salon_id: salon.id!,
        tipo_evento: data.tipo_evento,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        numero_invitados: Number(data.numero_invitados),
      });

      if (!nuevaReserva || !Number.isSafeInteger(nuevaReserva.id) || nuevaReserva.id <= 0 || nuevaReserva.salon_id !== salon.id || nuevaReserva.estado !== 'cotizacion') throw new Error('Unverified quote response');
      markAttempt(false);
      if (currentUser.current !== actor) return;
      draft.clear();
      setCreatedQuote(nuevaReserva);
      onSuccess?.(nuevaReserva);
    } catch (err: unknown) {
      if (currentUser.current !== actor) return;
      if (!(err instanceof ApiError) || err.status === 0 || err.status === 408 || err.status >= 500) { setUncertain(true); return; }
      markAttempt(false);
      if (err.code && tf.errores[err.code]) { setErrorMessage(tf.errores[err.code]); void disponibilidadQuery.refetch(); return; }
      if (err.code === 'EVENT_ROOM_NOT_AVAILABLE') void disponibilidadQuery.refetch();
      const messages: Record<string, string> = { EVENT_ROOM_NOT_AVAILABLE: copy.conflict, EVENT_CAPACITY_EXCEEDED: copy.capacityError, BRANCH_INACTIVE: copy.inactive, EVENT_DATE_IN_PAST: copy.dateError, INVALID_EVENT_DATE: copy.dateError, INVALID_EVENT_TIME_RANGE: copy.timeError, EVENT_ROOM_NOT_FOUND: copy.notFound };
      setErrorMessage(messages[err.code ?? ''] ?? copy.requestError);
    }
  };
  const close = () => { if (!submitLock.current && !checkLock.current) onClose(); };
  const checkRequests = async () => {
    if (!user || checkLock.current) return;
    const actor = user.id;
    checkLock.current = true; setChecking(true); setErrorMessage(null); setCheckedEmpty(false);
    try {
      const values = watch();
      const requests = await eventosApi.getReservas();
      if (currentUser.current !== actor) return;
      const normalize = (time: string) => time.length === 5 ? `${time}:00` : time;
      const found = requests.find((item) => Number.isSafeInteger(item.id) && item.id > 0 && item.usuario_id === actor && item.salon_id === salon.id && item.fecha === values.fecha && item.tipo_evento === values.tipo_evento && item.numero_invitados === values.numero_invitados && normalize(item.hora_inicio) === normalize(values.hora_inicio) && normalize(item.hora_fin) === normalize(values.hora_fin));
      if (found) { markAttempt(false); setUncertain(false); setCreatedQuote(found); draft.clear(); }
      else setCheckedEmpty(true);
    } catch { if (currentUser.current === actor) setErrorMessage(copy.checkError); }
    finally { checkLock.current = false; setChecking(false); }
  };

  return (
    <ServiceReservationPanel compact name={salon.nombre} siteId={salon.sucursal_id} siteName={publicVenueSite(salon, sites) || copy.siteUnknown} media={{ src: salon.imagen_url, alt: salon.nombre, credits: salon.imagen_creditos }} open={isOpen} onClose={close} closeLabel={p('closeModal')} title={createdQuote ? copy.success : textosEventos.modalReservaTitulo} description={createdQuote ? copy.financialNotice : copy.quoteDescription} busy={createMutation.isPending || isSubmitting || checking} busyLabel={p('processingRequest')}>
      {createdQuote ? <div className="space-y-5">
        <Alert tone="success"><p>{copy.reference}: <strong>#{createdQuote.id}</strong></p></Alert>
        <dl className="grid gap-3 rounded-lg border border-neutro-200 bg-neutro-50 p-4 text-sm">
          <div><dt>{p('siteLabel')}</dt><dd lang="es">{publicVenueSite(createdQuote.Salon ?? salon, sites) || copy.siteUnknown}</dd></div>
          <div><dt>{textosEventos.campoFecha}</dt><dd>{calendarDate(createdQuote.fecha)}</dd></div>
          <div><dt>{textosEventos.campoHoraInicio} / {textosEventos.campoHoraFin}</dt><dd>{createdQuote.hora_inicio} – {createdQuote.hora_fin}</dd></div>
          <div><dt>{textosEventos.campoInvitados}</dt><dd>{createdQuote.numero_invitados}</dd></div>
          <div><dt>{copy.details}</dt><dd><StatusBadge domain="reservation" value={createdQuote.estado} /></dd></div>
          <div><dt>{copy.total}</dt><dd><MoneyReference amount={createdQuote.total} /></dd></div>
        </dl>
        <div className="flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center text-bronce-700 underline" to={`/mis-reservas/eventos/${createdQuote.id}`}>{copy.viewRequest}</Link><Button type="button" variant="secondary" onClick={close}>{p('closeModal')}</Button></div>
      </div> : <>
        <ServiceAuthNotice kind="eventos" resourceId={salon.id!} allowAuthenticated anonymousMessage={copy.signInToQuote} />
        {/* Resumen del Salón */}
        <div className="my-4 rounded-lg bg-neutro-50 p-4 border border-neutro-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-neutro-500 block">{p('maxVenueCapacity')}</span>
            <span className="font-semibold text-neutro-800">{salon.capacidad_maxima != null ? `${salon.capacidad_maxima} ${p('people')}` : copy.capacityUnknown}</span>
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
              {errorMessage}
            </Alert>
          </div>
        )}

        {uncertain && <Alert tone="warning"><p>{copy.uncertain}</p><div className="mt-3 flex flex-wrap gap-3"><Link to="/mis-reservas/eventos" className="inline-flex min-h-11 items-center underline">{copy.myRequests}</Link><Button type="button" variant="secondary" disabled={checking || !user} onClick={() => void checkRequests()}>{copy.checkRequests}</Button></div>{checkedEmpty && <div className="mt-3"><p>{copy.noMatch}</p><Button type="button" variant="ghost" onClick={() => { markAttempt(false); setUncertain(false); setCheckedEmpty(false); }}>{copy.prepareAgain}</Button></div>}</Alert>}
        <form onSubmit={(event) => {
          event.preventDefault();
          if (siteBlocked || submitLock.current || uncertain || createdQuote) return;
          submitLock.current = true;
          void handleSubmit(onSubmit)(event).finally(() => { submitLock.current = false; });
        }} className="flex flex-col gap-4 text-sm">
              <DraftSiteNotice blocked={siteBlocked} /><fieldset disabled={siteBlocked || uncertain || createMutation.isPending || isSubmitting} className="contents">
          <Select label={textosEventos.campoTipoEvento} id="tipo_evento" {...register('tipo_evento')} error={errors.tipo_evento?.message}>
            {(Object.keys(etiquetasTipoEvento) as TipoEvento[]).map((tipo) => <option key={tipo} value={tipo}>{etiquetasTipoEvento[tipo]}</option>)}
          </Select>
          <DateField label={textosEventos.campoFecha} id="fecha" min={getTodayInGuatemala()} {...register('fecha')} error={errors.fecha?.message} />
          {/* Franjas del backend: inicio dentro del horario del salón y finalizaciones libres */}
          <div className="flex flex-col gap-3" aria-live="polite">
            {disponibilidadQuery.isPending && disponibilidadQuery.fetchStatus !== 'idle' ? <p className="text-xs text-neutro-600">{tf.cargando}</p>
              : disponibilidadQuery.isError ? <Alert tone="error"><p className="text-xs">{tf.error}</p><Button type="button" variant="ghost" size="sm" onClick={() => void disponibilidadQuery.refetch()}>{tf.reintentar}</Button></Alert>
              : disponibilidad && !disponibilidad.horario ? <Alert tone="info" title={tf.sinHorarioTitulo}><p className="text-xs">{tf.sinHorario}</p></Alert>
              : disponibilidad?.horario && <>
                <p className="text-xs text-neutro-600">{tf.horarioAtencion(formatearHoraFranja(disponibilidad.horario.apertura, localeFranjas), formatearHoraFranja(disponibilidad.horario.cierre, localeFranjas))}</p>
                {franjas.length === 0 ? <p className="rounded-md border border-neutro-200 bg-neutro-50 p-3 text-xs text-neutro-700">{tf.sinFranjas}</p> : <>
                  <SlotPicker label={tf.horaInicio} slots={franjas.map((franja) => franja.inicio)} value={inicioElegido ?? ''} onChange={(value) => { setValue('hora_inicio', value, { shouldDirty: true, shouldValidate: true }); setValue('hora_fin', '', { shouldDirty: true }); }} error={errors.hora_inicio?.message} />
                  {franjaElegida && <SlotPicker label={tf.horaFin} slots={fines} value={finElegido ?? ''} onChange={(value) => setValue('hora_fin', value, { shouldDirty: true, shouldValidate: true })} error={errors.hora_fin?.message} />}
                </>}
              </>}
          </div>
          <Input label={`${textosEventos.campoInvitados}${salon.capacidad_maxima != null ? ` (${p('maxShort')} ${salon.capacidad_maxima})` : ''}`} id="numero_invitados" type="number" {...register('numero_invitados', { valueAsNumber: true })} min={1} max={salon.capacidad_maxima} error={errors.numero_invitados?.message} />

          <div className="rounded-lg bg-selva-50 border border-selva-200 p-3 text-xs text-selva-800">
            {copy.quoteNotice}
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={close} disabled={isSubmitting || createMutation.isPending}>
              {' '}{p('cancel')}{' '}</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={status !== 'authenticated' || !user || isSubmitting || createMutation.isPending || !horarioValido}
            >
              {isSubmitting || createMutation.isPending
                ? textosEventos.creandoCotizacion
                : textosEventos.botonCrearCotizacion}
            </Button>
          </div>
        </fieldset></form></>}
    </ServiceReservationPanel>
  );
};
