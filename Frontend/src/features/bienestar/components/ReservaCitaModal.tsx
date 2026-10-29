import { DateField } from '@/components/ui/DateField';
import { SlotPicker } from '@/components/ui/SlotPicker';
import { formatearHoraFranja, useTextosFranjas } from '@/i18n/franjas';
import { Select } from '@/components/ui/Select';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { ServiceReservationPanel, ServiceAuthNotice } from '@/components/shared/ServiceReservationPanel';
import { useServiceDraft } from '@/features/auth/serviceDraft';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { Alert } from '@/components/ui/Feedback';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { useRevalidateErrors, usePublicTexts, usePublicInterface } from '@/i18n/public';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useTerapeutasQuery, useCreateCitaMutation, useMiCitaSpaQuery } from '../hooks/useBienestar';
import { createReservaCitaSchema, type ReservaCitaFormValues } from '../schemas/bienestar.schemas';

import { BIENESTAR_ROUTES } from '../constants/routes';
import { ApiError } from '@/api/client/http';
import type { ServicioBienestar, CitaBienestar } from '../types';
import { CarritoAutomatico } from '@/features/carrito/components/CarritoAutomatico';
import { bienestarApi } from '../api/bienestarApi';
import { readCitaBooking, saveCitaBooking, isCitaForService, normalizeCitaTime, type CitaBookingRecord } from '../bookingRecovery';
import { useWellnessCopy } from '../wellnessCopy';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';

interface ReservaCitaModalProps {
  servicio: ServicioBienestar;
  onClose: () => void;
  onSuccess?: (cita: CitaBienestar) => void;
}

export const ReservaCitaModal: React.FC<ReservaCitaModalProps> = ({
  servicio,
  onClose,
  onSuccess,
}) => {
  const textosBienestar = usePublicTexts('bienestar');
  const { p, locale, date: calendarDate } = usePublicInterface();
  const copy = useWellnessCopy();
  const { t: tf, locale: localeFranjas } = useTextosFranjas();
  const { sites } = usePublicPreferences();
  const sedeNombre = sites.find((sede) => sede.id === servicio.sucursal_id)?.nombre ?? null;
  const siteBlocked = useDraftSiteGuard(servicio.id, servicio.sucursal_id);
  const { user, status } = useAuth();
  const isAuthenticated = status === 'authenticated' && user?.rol === 'cliente';
  const terapeutasQuery = useTerapeutasQuery();
  const createCitaMutation = useCreateCitaMutation();

  const [createdCita, setCreatedCita] = useState<CitaBienestar | null>(null);
  const [errorMessage, setErrorMessage] = useState<LocalizedError | null>(null);
  // Código de un rechazo de franja (horario pasado, fuera de horario, ocupado); se traduce al mostrarlo.
  const [errorFranja, setErrorFranja] = useState<string | null>(null);
  const [booking, setBooking] = useState<CitaBookingRecord | null>(() => readCitaBooking(user?.id, servicio.id!));
  const submitLock = useRef(false);
  const checkLock = useRef(false);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const [checkedEmpty, setCheckedEmpty] = useState(false);
  const restoredQuery = useMiCitaSpaQuery(booking?.phase === 'created' && !createdCita ? booking.id : 0, isAuthenticated ? user?.id : undefined);

  useEffect(() => {
    setCreatedCita(null);
    setBooking(readCitaBooking(user?.id, servicio.id!));
    setErrorMessage(null); setCheckError(false); setCheckedEmpty(false);
  }, [user?.id, servicio.id]);

  useEffect(() => {
    if (booking?.phase === 'created' && isCitaForService(restoredQuery.data, servicio.id!) && restoredQuery.data.id === booking.id) setCreatedCita(restoredQuery.data);
  }, [restoredQuery.data, booking, servicio.id]);

  const remember = (record: CitaBookingRecord | null) => {
    if (user?.id) saveCitaBooking(user.id, servicio.id!, record);
    setBooking(record);
  };
  const close = () => { if (!submitLock.current && !checkLock.current) onClose(); };

  // Un servicio de sede solo lo atienden terapeutas de esa sede (el backend lo exige con THERAPIST_BRANCH_MISMATCH).
  const terapeutasActivos = (terapeutasQuery.data ?? []).filter((t) => t.activo === true && (servicio.sucursal_id == null || t.sucursal_id === servicio.sucursal_id));
  // Sin terapeutas activos el servidor no puede asignar la cita: no se invita a rellenar campos.
  const sinTerapeutas = terapeutasQuery.isSuccess && terapeutasActivos.length === 0;

  const todayStr = getTodayInGuatemala();
  const draft = useServiceDraft('bienestar', servicio.id ?? 0, { fecha: todayStr, hora_inicio: '', terapeuta_id: undefined as number | undefined });

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ReservaCitaFormValues>({
    resolver: zodResolver(createReservaCitaSchema(p, copy('pastDateTime'))),
    defaultValues: { ...draft.initial, servicio_bienestar_id: servicio.id },
  });
  const camposBloqueados = isSubmitting || terapeutasQuery.isPending || terapeutasQuery.isError || sinTerapeutas;

  const fechaElegida = watch('fecha');
  const horaElegida = watch('hora_inicio');
  const terapeutaElegido = Number(watch('terapeuta_id')) || null;
  const disponibilidadQuery = useQuery({
    queryKey: ['bienestar-disponibilidad', servicio.id, fechaElegida],
    queryFn: () => bienestarApi.getDisponibilidad(servicio.id!, fechaElegida),
    enabled: Boolean(servicio.id) && /^\d{4}-\d{2}-\d{2}$/.test(fechaElegida ?? '') && !sinTerapeutas,
    staleTime: 30_000,
    retry: false,
  });
  // Las franjas las calcula el backend (horario del servicio, citas y descanso del terapeuta).
  const disponibilidad = disponibilidadQuery.data;
  const franjas = disponibilidad?.terapeutas.find((item) => item.id === terapeutaElegido)?.horarios ?? [];
  const horaValida = Boolean(horaElegida) && franjas.includes(horaElegida.slice(0, 5));

  // Al cambiar de fecha o terapeuta, una hora que ya no se ofrece deja de estar elegida.
  useEffect(() => {
    if (disponibilidadQuery.isSuccess && horaElegida && !franjas.includes(horaElegida.slice(0, 5))) setValue('hora_inicio', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disponibilidadQuery.data, terapeutaElegido]);

  useEffect(() => {
    const subscription = watch((values) => draft.save(values));
    return () => subscription.unsubscribe();
  }, [watch, draft.save]);

  const onSubmit = async (values: ReservaCitaFormValues) => {
    if (siteBlocked || !isAuthenticated || !user?.id || booking || createdCita || createCitaMutation.isPending || terapeutasQuery.isPending || terapeutasQuery.isError) return;
    if (!terapeutasActivos.some((item) => item.id === values.terapeuta_id)) {
      setErrorMessage({ section: 'bienestar', key: 'errorTerapeutaInactivo' }); return;
    }
    setErrorMessage(null); setErrorFranja(null);
    const actor = user.id;
    const request = { servicio_bienestar_id: servicio.id!, terapeuta_id: Number(values.terapeuta_id), fecha: values.fecha, hora_inicio: values.hora_inicio };
    remember({ phase: 'pending', request });
    draft.save(values);
    try {
      const cita = await createCitaMutation.mutateAsync(request);
      if (!isCitaForService(cita, servicio.id!) || cita.estado !== 'confirmada') throw new Error('Incomplete appointment response');
      saveCitaBooking(actor, servicio.id!, { phase: 'created', id: cita.id });
      if (currentUser.current !== actor) return;
      setBooking({ phase: 'created', id: cita.id });
      draft.clear();
      setCreatedCita(cita);
      onSuccess?.(cita);
    } catch (err: unknown) {
      if (currentUser.current !== actor) return;
      if (!(err instanceof ApiError) || err.status === 0 || err.status === 408 || err.status >= 500) return;
      remember(null);
      if (err instanceof ApiError) {
        if (err.code && tf.errores[err.code]) {
          setErrorFranja(err.code);
          void disponibilidadQuery.refetch();
        } else if (err.code === 'THERAPIST_INACTIVE') {
          setErrorMessage({ section: 'bienestar', key: 'errorTerapeutaInactivo' });
        } else if (err.code === 'WELLNESS_SERVICE_NOT_FOUND') {
          setErrorMessage({ section: 'bienestar', key: 'errorServicioNoEncontrado' });
        } else {
          setErrorMessage({ api: err });
        }
      } else {
        setErrorMessage({ section: 'bienestar', key: 'errorInciertoRed' });
      }
    }
  };

  const checkAppointments = async () => {
    if (booking?.phase !== 'pending' || !isAuthenticated || checkLock.current) return;
    const actor = user?.id;
    checkLock.current = true; setChecking(true); setCheckError(false); setCheckedEmpty(false);
    try {
      const citas = await bienestarApi.getMisCitas();
      if (currentUser.current !== actor) return;
      const request = booking.request;
      const found = citas.find((item) => isCitaForService(item, servicio.id!) && item.estado === 'confirmada' &&
        item.terapeuta_id === request.terapeuta_id && item.fecha === request.fecha &&
        normalizeCitaTime(item.hora_inicio!) === normalizeCitaTime(request.hora_inicio));
      if (found && isCitaForService(found, servicio.id!)) {
        remember({ phase: 'created', id: found.id }); draft.clear(); setCreatedCita(found);
      } else setCheckedEmpty(true);
    } catch { if (currentUser.current === actor) setCheckError(true); }
    finally { checkLock.current = false; setChecking(false); }
  };

  useRevalidateErrors(locale, () => trigger(), Object.keys(errors).length > 0);

  return (
    <ServiceReservationPanel compact={Boolean(createdCita)} name={servicio.nombre} siteId={servicio.sucursal_id ?? undefined} media={{ src: servicio.imagen_url, alt: servicio.nombre, credits: servicio.imagen_creditos }} open onClose={close} closeLabel={p('closeModal')} title={createdCita ? (createdCita.estado === 'confirmada' ? textosBienestar.citaExitosaTitulo : textosBienestar.detalleTitulo) : textosBienestar.modalReservaTitulo} busy={createCitaMutation.isPending || isSubmitting || checking} busyLabel={p('processingRequest')}>
        {/* Pantalla de éxito */}
        {createdCita ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="sr-only">{textosBienestar.citaExitosaTitulo}</p>
            {/* Resumen: solo lo necesario, con el estado de la reserva y el del pago diferenciados */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-neutro-200 bg-neutro-50 p-4 text-sm">
              <div className="col-span-2 min-w-0"><dt className="text-xs text-neutro-500">{tf.confirmacion.servicio}</dt><dd className="font-medium text-neutro-900" lang="es">{createdCita.ServicioBienestar?.nombre ?? servicio.nombre}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-neutro-500">{tf.confirmacion.sede}</dt><dd className="text-neutro-900" lang="es">{sedeNombre ?? '—'}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-neutro-500">{tf.confirmacion.terapeuta}</dt><dd className="text-neutro-900" lang="es">{createdCita.Terapeuta?.nombre ?? p('assignedTherapist')}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-neutro-500">{tf.confirmacion.fecha}</dt><dd className="text-neutro-900">{calendarDate(createdCita.fecha)}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-neutro-500">{tf.confirmacion.horario}</dt><dd className="tabular-nums text-neutro-900">{createdCita.hora_inicio && createdCita.hora_fin ? `${formatearHoraFranja(createdCita.hora_inicio.slice(0, 5), localeFranjas)} – ${formatearHoraFranja(createdCita.hora_fin.slice(0, 5), localeFranjas)}` : '—'}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-neutro-500">{tf.confirmacion.duracion}</dt><dd className="text-neutro-900">{createdCita.ServicioBienestar?.duracion_minutos ? p('sessionDuration', { n: createdCita.ServicioBienestar.duracion_minutos }) : '—'}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-neutro-500">{tf.confirmacion.tarifa}</dt><dd className="font-semibold text-bronce-700"><MoneyReference amount={createdCita.ServicioBienestar?.precio ?? servicio.precio} /></dd></div>
              <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutro-200 pt-3">
                <span className="flex items-center gap-2 text-xs text-neutro-600">{tf.confirmacion.reserva}: <StatusBadge domain="reservation" value={createdCita.estado} /></span>
                <span className="flex items-center gap-2 text-xs text-neutro-600">{tf.confirmacion.pago}: <Badge tone="advertencia">{tf.confirmacion.pagoPendiente}</Badge></span>
              </div>
            </dl>
            <div className="flex flex-col gap-2">
              {createdCita.id && createdCita.estado && <CarritoAutomatico key={createdCita.id} tipo_item="bienestar" reservaId={createdCita.id} reservaEstado={createdCita.estado} />}
              <Link to={BIENESTAR_ROUTES.MIS_RESERVAS} className={buttonStyles({ variant: 'secondary', className: 'w-full justify-center' })}>{tf.confirmacion.verCitas}</Link>
            </div>
          </div>
        ) : booking?.phase === 'created' ? (
          <Alert tone={restoredQuery.isError || (restoredQuery.isSuccess && !isCitaForService(restoredQuery.data, servicio.id!)) ? 'error' : 'info'}>
            <p>{p(restoredQuery.isError || restoredQuery.isSuccess ? 'wellnessRestoreError' : 'wellnessRestoring')}</p>
            <p>{textosBienestar.citaNumero(booking.id)}</p>
            <Link to={BIENESTAR_ROUTES.MIS_RESERVAS} className="inline-flex min-h-11 items-center underline">{textosBienestar.volverAMisCitas}</Link>
            <Button type="button" variant="ghost" onClick={() => void restoredQuery.refetch()}>{p('retry')}</Button>
          </Alert>
        ) : (
          <form onSubmit={(event) => {
            event.preventDefault();
            if (siteBlocked || submitLock.current || booking || createdCita) return;
            submitLock.current = true;
            void handleSubmit(onSubmit)(event).finally(() => { submitLock.current = false; });
          }} className="flex flex-col gap-5">
            <ServiceAuthNotice kind="bienestar" resourceId={servicio.id!} />
            <DraftSiteNotice blocked={siteBlocked} />
            {booking?.phase === 'pending' && !isSubmitting && <Alert tone="warning">
              <p>{p('wellnessUncertain')}</p>
              <div className="mt-3 flex flex-wrap gap-3"><Link to={BIENESTAR_ROUTES.MIS_RESERVAS} className="inline-flex min-h-11 items-center underline">{textosBienestar.volverAMisCitas}</Link><Button type="button" variant="secondary" disabled={!isAuthenticated || checking} onClick={() => void checkAppointments()}>{p('wellnessCheckAppointments')}</Button></div>
              {checkError && <p role="alert">{p('wellnessCheckError')}</p>}
              {checkedEmpty && <div><p>{p('wellnessNoMatch')}</p><Button type="button" variant="ghost" onClick={() => { remember(null); setCheckedEmpty(false); }}>{p('wellnessPrepareAgain')}</Button></div>}
            </Alert>}
            <fieldset disabled={siteBlocked || Boolean(booking) || isSubmitting} className="contents">
            {/* Resumen del servicio: qué se reserva, cuánto dura y cuánto cuesta */}
            <div className="flex flex-col gap-2 rounded-lg border border-selva-200 bg-selva-50/60 p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-selva-700">{copy('selectedService')}</p>
                <p className="font-semibold text-selva-900"><span lang="es">{servicio.nombre}</span></p>
                <p className="text-selva-700">
                  {servicio.duracion_minutos ? p('sessionDuration', { n: servicio.duracion_minutos }) : p('wellnessDurationMissing')}
                </p>
              </div>
              <p className="text-sm font-bold text-selva-900"><MoneyReference amount={servicio.precio} /></p>
            </div>


            {errorFranja && <Alert tone="warning"><p className="text-xs">{tf.errores[errorFranja]}</p></Alert>}
            {errorMessage && (
              <div role="alert" className="rounded-md bg-rojo-50 p-3 border border-rojo-200 flex items-start gap-2.5 text-xs text-rojo-700">
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span><TranslatedError error={errorMessage} /></span>
              </div>
            )}

            {terapeutasQuery.isError && <Alert tone="error"><p>{p('serviceOptionsError')}</p><Button variant="ghost" onClick={() => { void terapeutasQuery.refetch(); }}>{p('retry')}</Button></Alert>}
            {sinTerapeutas && <Alert tone="info" title={copy('onlineUnavailableTitle')}><p>{p('serviceNoTherapists')}</p><p>{copy('onlineUnavailableDesc')}</p></Alert>}
            <Select label={textosBienestar.seleccionarTerapeuta} id="terapeuta_id" {...register('terapeuta_id', { valueAsNumber: true })} value={watch('terapeuta_id') || ''} error={errors.terapeuta_id?.message} disabled={camposBloqueados}>
              <option value="">{p('serviceChooseTherapist')}</option>
              {terapeutasActivos.map((terapeuta) => <option key={terapeuta.id} value={terapeuta.id} lang="es">{terapeuta.nombre}</option>)}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField label={textosBienestar.fecha} id="fecha" min={todayStr} {...register('fecha')} error={errors.fecha?.message} disabled={camposBloqueados} />
            </div>

            {/* Franjas disponibles: solo las que ofrece el backend para el terapeuta y la fecha elegidos */}
            {!sinTerapeutas && <div className="flex flex-col gap-2" aria-live="polite">
              {disponibilidadQuery.isPending && disponibilidadQuery.fetchStatus !== 'idle' ? <p className="text-xs text-neutro-600">{tf.cargando}</p>
                : disponibilidadQuery.isError ? <Alert tone="error"><p className="text-xs">{tf.error}</p><Button type="button" variant="ghost" size="sm" onClick={() => void disponibilidadQuery.refetch()}>{tf.reintentar}</Button></Alert>
                : disponibilidad && !disponibilidad.horario ? <Alert tone="info" title={tf.sinHorarioTitulo}><p className="text-xs">{tf.sinHorario}</p></Alert>
                : disponibilidad?.horario && <>
                  <p className="text-xs text-neutro-600">{tf.horarioAtencion(formatearHoraFranja(disponibilidad.horario.apertura, localeFranjas), formatearHoraFranja(disponibilidad.horario.cierre, localeFranjas))}</p>
                  {!terapeutaElegido ? <p className="text-xs text-neutro-600">{tf.elegirTerapeuta}</p>
                    : franjas.length === 0 ? <p className="rounded-md border border-neutro-200 bg-neutro-50 p-3 text-xs text-neutro-700">{tf.sinFranjas}</p>
                    : <SlotPicker label={tf.horaInicio} slots={franjas} value={horaElegida ?? ''} onChange={(value) => setValue('hora_inicio', value, { shouldDirty: true, shouldValidate: true })} durationMinutes={disponibilidad.duracion_minutos} disabled={camposBloqueados} error={errors.hora_inicio?.message} />}
                  <p className="text-xs text-neutro-500">{tf.descanso}</p>
                </>}
            </div>}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={close} disabled={isSubmitting}>
                {textosBienestar.cancelar}
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!isAuthenticated || terapeutasQuery.isPending || terapeutasQuery.isError || terapeutasActivos.length === 0 || !horaValida}>
                {isSubmitting ? textosBienestar.procesandoCita : textosBienestar.confirmarCita}
              </Button>
            </div>
            </fieldset>
          </form>
        )}
        {!createdCita && <p className="mt-5 text-sm text-neutro-600">{p('wellnessContactConditions')} <Link to="/sedes" className="inline-flex min-h-11 items-center text-bronce-700 underline">{p('wellnessContact')}</Link></p>}
    </ServiceReservationPanel>
  );
};
