import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
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
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useTerapeutasQuery, useCreateCitaMutation, useMiCitaSpaQuery } from '../hooks/useBienestar';
import { createReservaCitaSchema, type ReservaCitaFormValues } from '../schemas/bienestar.schemas';

import { BIENESTAR_ROUTES } from '../constants/routes';
import { ApiError } from '@/api/client/http';
import type { ServicioBienestar, CitaBienestar } from '../types';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';
import { bienestarApi } from '../api/bienestarApi';
import { readCitaBooking, saveCitaBooking, isCitaForService, normalizeCitaTime, type CitaBookingRecord } from '../bookingRecovery';
import { useWellnessCopy } from '../wellnessCopy';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';

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
  const siteBlocked = useDraftSiteGuard(servicio.id, servicio.sucursal_id);
  const { user, status } = useAuth();
  const isAuthenticated = status === 'authenticated' && user?.rol === 'cliente';
  const terapeutasQuery = useTerapeutasQuery();
  const createCitaMutation = useCreateCitaMutation();

  const [createdCita, setCreatedCita] = useState<CitaBienestar | null>(null);
  const [errorMessage, setErrorMessage] = useState<LocalizedError | null>(null);
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
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ReservaCitaFormValues>({
    resolver: zodResolver(createReservaCitaSchema(p, copy('pastDateTime'))),
    defaultValues: { ...draft.initial, servicio_bienestar_id: servicio.id },
  });
  const camposBloqueados = isSubmitting || terapeutasQuery.isPending || terapeutasQuery.isError || sinTerapeutas;

  useEffect(() => {
    const subscription = watch((values) => draft.save(values));
    return () => subscription.unsubscribe();
  }, [watch, draft.save]);

  const onSubmit = async (values: ReservaCitaFormValues) => {
    if (siteBlocked || !isAuthenticated || !user?.id || booking || createdCita || createCitaMutation.isPending || terapeutasQuery.isPending || terapeutasQuery.isError) return;
    if (!terapeutasActivos.some((item) => item.id === values.terapeuta_id)) {
      setErrorMessage({ section: 'bienestar', key: 'errorTerapeutaInactivo' }); return;
    }
    setErrorMessage(null);
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
        if (err.code === 'THERAPIST_BUSY_OR_BUFFER') {
          setErrorMessage({ section: 'bienestar', key: 'errorTerapeutaOcupado' });
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
    <ServiceReservationPanel name={servicio.nombre} siteId={servicio.sucursal_id ?? undefined} media={{ src: servicio.imagen_url, alt: servicio.nombre, credits: servicio.imagen_creditos }} open onClose={close} closeLabel={p('closeModal')} title={createdCita ? (createdCita.estado === 'confirmada' ? textosBienestar.citaExitosaTitulo : textosBienestar.detalleTitulo) : textosBienestar.modalReservaTitulo} busy={createCitaMutation.isPending || isSubmitting || checking} busyLabel={p('processingRequest')}>
        {/* Pantalla de éxito */}
        {createdCita ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-selva-100 text-selva-700">
              <CheckCircle className="size-8" aria-hidden="true" />
            </div>

            <p role="status" className="text-sm text-neutro-600 mb-6 max-w-md">
              {textosBienestar.citaExitosaDesc}
            </p>

            <div className="w-full rounded-lg bg-neutro-50 p-4 text-left border border-neutro-200 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutro-500 font-medium">{textosBienestar.citaNumero(createdCita.id ?? '')}</span>
                <span><span className="sr-only">{p('purchaseOperational')}: </span><StatusBadge domain="reservation" value={createdCita.estado} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.servicioContratado}</span>
                <span className="font-medium text-neutro-900"><span lang="es">{createdCita.ServicioBienestar?.nombre ?? servicio.nombre}</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.terapeutaAsignado}</span>
                <span className="font-medium text-neutro-900">
                  {createdCita.Terapeuta?.nombre ?? p('assignedTherapist')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.fechaCita}</span>
                <span className="font-medium text-neutro-900">{calendarDate(createdCita.fecha)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.horarioCita}</span>
                <span className="font-medium text-neutro-900">
                  {createdCita.hora_inicio} - {createdCita.hora_fin}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutro-200">
                <span className="font-semibold text-neutro-700">{textosBienestar.tarifaServicio}</span>
                <span className="font-bold text-bronce-700"><MoneyReference amount={createdCita.ServicioBienestar?.precio} /></span>
              </div>
              <p>{createdCita.ServicioBienestar?.duracion_minutos ? p('sessionDuration', { n: createdCita.ServicioBienestar.duracion_minutos }) : p('wellnessDurationMissing')}</p>
            </div>

            <div className="mb-5 w-full space-y-3 text-left">
              <p className="text-sm text-neutro-600">{p('wellnessFinancialNotice')}</p>
              <p className="text-sm text-neutro-600">{p('wellnessCartRecovery')}</p>
              {createdCita.id && createdCita.estado && <BotonAnadirAlCarrito key={createdCita.id} tipo_item="bienestar" reservaId={createdCita.id} reservaEstado={createdCita.estado} publicInterface />}
            </div>

            <div className="flex w-full flex-col sm:flex-row gap-3">
              <Link
                to={BIENESTAR_ROUTES.MIS_RESERVAS}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-bronce-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-bronce-700 transition-colors"
              >
                <span>{textosBienestar.volverAMisCitas}</span>
              </Link>
              <Button type="button" variant="secondary" onClick={close} className="w-full">
                {p('closeModal')}
              </Button>
            </div>
            <Button type="button" variant="ghost" className="mt-3" onClick={() => { remember(null); setCreatedCita(null); setErrorMessage(null); }}>{p('wellnessAnotherAppointment')}</Button>
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

            {!sinTerapeutas && <p className="text-xs text-neutro-600">{textosBienestar.modalReservaDesc}</p>}

            {errorMessage && (
              <div role="alert" className="rounded-md bg-rojo-50 p-3 border border-rojo-200 flex items-start gap-2.5 text-xs text-rojo-700">
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span><TranslatedError error={errorMessage} /></span>
              </div>
            )}

            {terapeutasQuery.isError && <Alert tone="error"><p>{p('serviceOptionsError')}</p><Button variant="ghost" onClick={() => { void terapeutasQuery.refetch(); }}>{p('retry')}</Button></Alert>}
            {sinTerapeutas && <Alert tone="info" title={copy('onlineUnavailableTitle')}><p>{p('serviceNoTherapists')}</p><p>{copy('onlineUnavailableDesc')}</p></Alert>}
            {!sinTerapeutas && <p className="text-xs text-neutro-600">{p('serviceActiveNotAvailable')}</p>}
            <Select label={textosBienestar.seleccionarTerapeuta} id="terapeuta_id" {...register('terapeuta_id', { valueAsNumber: true })} value={watch('terapeuta_id') || ''} error={errors.terapeuta_id?.message} disabled={camposBloqueados}>
              <option value="">{p('serviceChooseTherapist')}</option>
              {terapeutasActivos.map((terapeuta) => <option key={terapeuta.id} value={terapeuta.id} lang="es">{terapeuta.nombre}</option>)}
            </Select>
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField label={textosBienestar.fecha} id="fecha" min={todayStr} {...register('fecha')} error={errors.fecha?.message} disabled={camposBloqueados} />
              <TimeField label={textosBienestar.horaInicio} id="hora_inicio" {...register('hora_inicio')} error={errors.hora_inicio?.message} disabled={camposBloqueados} />
            </div>

            {!sinTerapeutas && <p className="text-xs text-neutro-500">{textosBienestar.notaDisponibilidad}</p>}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={close} disabled={isSubmitting}>
                {textosBienestar.cancelar}
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!isAuthenticated || terapeutasQuery.isPending || terapeutasQuery.isError || terapeutasActivos.length === 0}>
                {isSubmitting ? textosBienestar.procesandoCita : textosBienestar.confirmarCita}
              </Button>
            </div>
            </fieldset>
          </form>
        )}
        <p className="mt-5 text-sm text-neutro-600">{p('wellnessContactConditions')} <Link to="/sedes" className="inline-flex min-h-11 items-center text-bronce-700 underline">{p('wellnessContact')}</Link></p>
    </ServiceReservationPanel>
  );
};
