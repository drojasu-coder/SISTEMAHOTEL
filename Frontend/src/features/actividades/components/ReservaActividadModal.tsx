import { DateField } from '@/components/ui/DateField';
import { SlotPicker } from '@/components/ui/SlotPicker';
import { formatearHoraFranja, sumarMinutos, useTextosFranjas } from '@/i18n/franjas';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { ServiceReservationPanel, ServiceAuthNotice } from '@/components/shared/ServiceReservationPanel';
import { useServiceDraft } from '@/features/auth/serviceDraft';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import React, { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/api/client/http';
import { getApiErrorMessage } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthContext';
import { CarritoAutomatico } from '@/features/carrito/components/CarritoAutomatico';
import type { RecursoActividad, ReservaActividad } from '../types';
import { useInstructoresQuery, useSalidasActividadQuery } from '../hooks/useActividades';
import { experienceEnd, formatDuration, useExperienceCopy, type ExperienceCopyKey } from '../experienceCopy';
import { ParticipantStepper } from './ParticipantStepper';
import { useCreateReservaActividadMutation } from '../hooks/useReservasActividad';
import { ACTIVIDADES_ROUTES } from '../constants/routes';


interface ReservaActividadModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurso: RecursoActividad | null;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export const ReservaActividadModal: React.FC<ReservaActividadModalProps> = ({
  isOpen,
  onClose,
  recurso,
}) => {
  const textosActividades = usePublicTexts('actividades');
  const { p, date: calendarDate, money } = usePublicInterface();
  const xp = useExperienceCopy();
  const siteBlocked = useDraftSiteGuard(recurso?.id, recurso?.sucursal_id);
  const { user } = useAuth();
  const isCliente = user?.rol === 'cliente';

  const hoy = getTodayInGuatemala();
  const draft = useServiceDraft('actividades', recurso?.id ?? 0, { fecha: hoy, horaInicio: '', horaFin: '', instructorId: '', conEquipo: false, participantes: 1 });
  const [fecha, setFecha] = useState<string>(draft.initial.fecha);
  const [horaInicio, setHoraInicio] = useState<string>(draft.initial.horaInicio);
  const [horaFin, setHoraFin] = useState<string>(draft.initial.horaFin);
  const [instructorId, setInstructorId] = useState<string>(draft.initial.instructorId);
  const [conEquipo, setConEquipo] = useState<boolean>(draft.initial.conEquipo);
  const [participantes, setParticipantes] = useState<number>(Number(draft.initial.participantes) || 1);
  const [xpError, setXpError] = useState<ExperienceCopyKey | null>(null);

  // Experiencia: duración fija, cupo compartido por salida y precio por persona.
  const esExperiencia = recurso?.modalidad === 'experiencia';
  const duracion = Number(recurso?.duracion_minutos) || 0;
  const cupo = Number(recurso?.cupo_maximo) || 1;
  const horaFinCalculada = esExperiencia && horaInicio ? experienceEnd(horaInicio, duracion) : null;
  // Franjas del backend: horario del recurso, salidas y cupo (experiencias) o duraciones libres (por hora).
  const { t: tf, locale: localeFranjas } = useTextosFranjas();
  const salidasQuery = useSalidasActividadQuery(recurso?.id, fecha, isOpen, !esExperiencia && instructorId ? Number(instructorId) : undefined);
  const franjasServidor = salidasQuery.data?.horarios ?? [];
  const horarioRecurso = salidasQuery.data?.horario ?? null;
  const franjas = franjasServidor.filter((franja) => (esExperiencia ? (franja.disponibles ?? 0) > 0 : (franja.duraciones ?? []).length > 0));
  const franjaElegida = franjas.find((franja) => franja.inicio === horaInicio.slice(0, 5));
  const salidaElegida = esExperiencia && franjaElegida ? { disponibles: franjaElegida.disponibles ?? 0 } : undefined;
  const maxParticipantes = Math.max(1, salidaElegida ? salidaElegida.disponibles : cupo);
  const finesPosibles = !esExperiencia && franjaElegida ? (franjaElegida.duraciones ?? []).map((d) => sumarMinutos(franjaElegida.inicio, d)) : [];
  const [errorFranja, setErrorFranja] = useState<string | null>(null);

  // Al cambiar de fecha, una hora que ya no se ofrece deja de estar elegida.
  useEffect(() => {
    if (!salidasQuery.isSuccess) return;
    if (horaInicio && !franjas.some((franja) => franja.inicio === horaInicio.slice(0, 5))) { setHoraInicio(''); setHoraFin(''); }
    else if (!esExperiencia && horaFin && !finesPosibles.includes(horaFin.slice(0, 5))) setHoraFin('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salidasQuery.data]);

  const [errorLocal, setErrorLocal] = useState<LocalizedError | null>(null);
  const [falloIncierto, setFalloIncierto] = useState<boolean>(false);
  const [reservaCreada, setReservaCreada] = useState<ReservaActividad | null>(null);

  const instructorsQuery = useInstructoresQuery();
  const instructores = instructorsQuery.data ?? [];
  const instructoresActivos = useMemo(
    () => instructores.filter((i) => i.activo),
    [instructores]
  );

  const createMutation = useCreateReservaActividadMutation(user?.id);

  useEffect(() => { if (recurso && !reservaCreada) draft.save({ fecha, horaInicio, horaFin, instructorId, conEquipo, participantes }); }, [recurso?.id, fecha, horaInicio, horaFin, instructorId, conEquipo, participantes, reservaCreada, draft.save]);
  // Si la salida elegida tiene menos lugares, el selector no puede quedar por encima.
  useEffect(() => { if (esExperiencia && participantes > maxParticipantes) setParticipantes(maxParticipantes); }, [esExperiencia, participantes, maxParticipantes]);

  if (!isOpen || !recurso) return null;

  // Reglas de precio del servidor para alquileres por hora.
  const tarifaInstructor = Number(recurso.precio_instructor_hora) || 0;
  const equipoSinCargo = (Number(recurso.precio_equipo) || 0) === 0;
  const sinInstructores = instructorsQuery.isSuccess && instructoresActivos.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setXpError(null);
    setErrorFranja(null);
    setFalloIncierto(false);

    if (!isCliente) {
      setErrorLocal({ section: 'extra', key: 'activityLogin' });
      return;
    }

    if (!fecha) {
      setErrorLocal({ section: 'extra', key: 'requiredDate' });
      return;
    }

    if (esExperiencia) {
      if (!horaInicio) { setXpError('errorRequiredStart'); return; }
      if (!horaFinCalculada) { setXpError('errorSameDay'); return; }
      if (salidaElegida && participantes > salidaElegida.disponibles) { setXpError('errorCapacity'); return; }
      try {
        const created = await createMutation.mutateAsync({
          recurso_id: recurso.id!,
          fecha,
          hora_inicio: horaInicio,
          numero_participantes: participantes,
        });
        draft.clear();
        setReservaCreada(created);
      } catch (err: unknown) {
        const code = err instanceof ApiError ? err.code : '';
        if (code && tf.errores[code]) { setErrorFranja(code); void salidasQuery.refetch(); }
        else if (code === 'ACTIVITY_CAPACITY_EXCEEDED') { setXpError('errorCapacity'); void salidasQuery.refetch(); }
        else if (code === 'RESOURCE_OVERLAP') { setXpError('errorOverlap'); void salidasQuery.refetch(); }
        else if (code === 'INVALID_ACTIVITY_DURATION') setXpError('errorSameDay');
        else if (code === 'PAST_DATE_TIME' || code === 'ACTIVITY_DATE_IN_PAST' || code === 'ACTIVITY_TIME_IN_PAST') setErrorLocal({ section: 'actividades', key: 'errorFechaPasada' });
        else if (err instanceof ApiError) { const msg = getApiErrorMessage(err); setErrorLocal(msg ? { server: msg } : { section: 'actividades', key: 'errorGenericoCreacion' }); }
        else { setErrorLocal({ section: 'actividades', key: 'errorInciertoRed' }); setFalloIncierto(true); }
      }
      return;
    }

    const minInicio = timeToMinutes(horaInicio);
    const minFin = timeToMinutes(horaFin);
    const duracionMin = minFin - minInicio;

    if (minInicio >= minFin) {
      setErrorLocal({ section: 'actividades', key: 'errorRangoInvalido' });
      return;
    }

    if (duracionMin < 30 || duracionMin > 120) {
      setErrorLocal({ section: 'actividades', key: 'errorDuracionInvalida' });
      return;
    }

    if (instructorId && !instructoresActivos.some((item) => String(item.id) === instructorId)) {
      setErrorLocal({ section: 'actividades', key: 'errorInstructorInactivo' }); return;
    }

    const instIdNum = instructorId ? parseInt(instructorId, 10) : undefined;

    try {
      const created = await createMutation.mutateAsync({
        recurso_id: recurso.id!,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        instructor_id: sinInstructores ? null : instIdNum || null,
        con_equipo: equipoSinCargo ? conEquipo : false,
      });

      draft.clear();
      setReservaCreada(created);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      const code = err instanceof ApiError ? err.code : '';
      const msgLower = msg.toLowerCase();

      if (code && tf.errores[code]) {
        setErrorFranja(code);
        void salidasQuery.refetch();
      } else if (
        code === 'RESOURCE_OVERLAP' ||
        msgLower.includes('ocupad') ||
        msgLower.includes('traslape') ||
        msg.includes('RESOURCE_OVERLAP')
      ) {
        setErrorLocal({ section: 'actividades', key: 'errorRecursoOcupado' });
      } else if (
        code === 'INSTRUCTOR_OVERLAP' ||
        (msgLower.includes('instructor') && (msgLower.includes('ocupad') || msgLower.includes('clase'))) ||
        msg.includes('INSTRUCTOR_OVERLAP')
      ) {
        setErrorLocal({ section: 'actividades', key: 'errorInstructorOcupado' });
      } else if (
        code === 'INSTRUCTOR_INACTIVE' ||
        msgLower.includes('inactivo') ||
        msg.includes('INSTRUCTOR_INACTIVE')
      ) {
        setErrorLocal({ section: 'actividades', key: 'errorInstructorInactivo' });
      } else if (
        code === 'INVALID_ACTIVITY_DURATION' ||
        msgLower.includes('duración') ||
        msgLower.includes('30 minutos') ||
        msg.includes('INVALID_ACTIVITY_DURATION')
      ) {
        setErrorLocal({ section: 'actividades', key: 'errorDuracionInvalida' });
      } else if (
        code === 'PAST_DATE_TIME' || code === 'ACTIVITY_DATE_IN_PAST' || code === 'ACTIVITY_TIME_IN_PAST' ||
        msgLower.includes('pasado') ||
        msgLower.includes('pasada') ||
        msg.includes('PAST_DATE_TIME')
      ) {
        setErrorLocal({ section: 'actividades', key: 'errorFechaPasada' });
      } else if (
        msgLower.includes('red') ||
        msgLower.includes('conexión') ||
        msgLower.includes('fetch') ||
        msgLower.includes('timeout')
      ) {
        setErrorLocal({ section: 'actividades', key: 'errorInciertoRed' });
        setFalloIncierto(true);
      } else {
        setErrorLocal(msg ? { server: msg } : { section: 'actividades', key: 'errorGenericoCreacion' });
      }
    }
  };

  const handleResetAndClose = () => {
    if (createMutation.isPending) return;
    setReservaCreada(null);
    setErrorLocal(null);
    setXpError(null);
    setErrorFranja(null);
    setFalloIncierto(false);
    onClose();
  };

  return (
    <ServiceReservationPanel name={recurso.nombre} siteId={recurso.sucursal_id} siteName={recurso.Sucursal?.nombre} media={{ src: recurso.imagen_url, alt: recurso.nombre, credits: recurso.imagen_creditos }} open onClose={handleResetAndClose} closeLabel={p('closeModal')} title={reservaCreada ? textosActividades.reservaExitosaTitulo : recurso.nombre ?? p('facility')} busy={createMutation.isPending} busyLabel={p('processingRequest')}>
        {reservaCreada ? (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-verde-100 text-verde-600">
              <CheckCircle className="size-8" aria-hidden="true" />
            </div>



            <p className="text-sm text-neutro-600 max-w-sm">
              {textosActividades.reservaExitosaDesc}
            </p>

            <div className="w-full rounded-lg bg-neutro-50 p-4 text-left border border-neutro-200 space-y-2 text-sm text-neutro-800">
              <div className="flex justify-between">
                <span className="text-neutro-500">{p('reservation')}</span>
                <span className="font-semibold text-neutro-900">#{reservaCreada.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{p('facility')}</span>
                <span className="font-medium text-neutro-900"><span lang="es">{recurso.nombre}</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{p('dateTime')}</span>
                <span className="font-medium text-neutro-900">
                  {calendarDate(reservaCreada.fecha)} ({reservaCreada.hora_inicio?.slice(0, 5)} - {reservaCreada.hora_fin?.slice(0, 5)})
                </span>
              </div>
              {esExperiencia && reservaCreada.numero_participantes ? <div className="flex justify-between">
                <span className="text-neutro-500">{xp('participantsSummary')}</span>
                <span className="font-medium text-neutro-900">{reservaCreada.numero_participantes}</span>
              </div> : null}
              <div className="flex justify-between">
                <span className="text-neutro-500">{p('totalCalculated')}</span>
                <span className="font-semibold text-bronce-700">
                  <MoneyReference amount={reservaCreada.total} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{p('state')}</span>
                <StatusBadge domain="reservation" value={reservaCreada.estado} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full gap-3 pt-3">
              <div className="flex-1">
                <CarritoAutomatico reservaId={reservaCreada.id!} reservaEstado={reservaCreada.estado || 'confirmada'} tipo_item="actividad" />
              </div>

              <Link
                to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
                className={buttonStyles({
                  variant: 'secondary',
                  className: 'flex-1 justify-center',
                })}
              >
                {textosActividades.verEnMisReservas}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => { if (siteBlocked || createMutation.isPending) { event.preventDefault(); return; } void handleSubmit(event); }} className="flex flex-col gap-5">
              <DraftSiteNotice blocked={siteBlocked} /><fieldset disabled={siteBlocked || createMutation.isPending} className="contents">
            <div>
              <p className="eyebrow text-bronce-700 font-semibold">{textosActividades.subtitulo}</p>

              <p className="text-xs text-neutro-500 mt-0.5">
                {recurso.Sucursal?.nombre && <>{p('siteLabel')} <span lang="es">{recurso.Sucursal.nombre}</span> · </>}
                {' '}{p('type')}{' '}<span lang="es">{recurso.tipo}</span>
              </p>
            </div>

            {/* Tarifas del servidor */}
            {esExperiencia ? <div className="rounded-lg bg-neutro-50 p-3.5 border border-neutro-200 text-xs text-neutro-700 space-y-1.5">
              <div className="flex justify-between"><span>{xp('pricePerPerson')}</span><span className="font-semibold text-neutro-900"><MoneyReference amount={recurso.precio_persona} /></span></div>
              <div className="flex justify-between"><span>{xp('duration')}</span><span className="font-semibold text-neutro-900">{formatDuration(duracion)}</span></div>
              <div className="flex justify-between"><span>{xp('capacityPerDeparture')}</span><span className="font-semibold text-neutro-900">{xp('people', { n: cupo })}</span></div>
            </div> : <div className="rounded-lg bg-neutro-50 p-3.5 border border-neutro-200 text-xs text-neutro-700 space-y-1.5">
              <div className="flex justify-between">
                <span>{xp('resourceRate')}</span>
                <span className="font-semibold text-neutro-900"><MoneyReference amount={recurso.precio_hora} /></span>
              </div>
            </div>}
            <ServiceAuthNotice kind="actividades" resourceId={recurso.id!} />

            {xpError && <Alert tone="error"><p className="text-xs">{xp(xpError)}</p></Alert>}
            {errorLocal && (
              <Alert tone="error">
                <p className="text-xs"><TranslatedError error={errorLocal} /></p>
                {falloIncierto && (
                  <div className="mt-2">
                    <Link
                      to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
                      className="text-xs font-semibold text-rojo-700 underline"
                    >
                      {' '}{p('myActivities')}{' '}</Link>
                  </div>
                )}
              </Alert>
            )}

            {errorFranja && <Alert tone="warning"><p className="text-xs">{tf.errores[errorFranja]}</p></Alert>}

            {esExperiencia ? <div className="space-y-4">
              <DateField label={textosActividades.campoFecha} id="fecha" min={hoy} value={fecha} onChange={(e) => { setFecha(e.target.value); setXpError(null); }} required />
              <p className="text-sm text-neutro-700">{xp('duration')}: {formatDuration(duracion)}</p>
              {/* Salidas del backend: horario del recurso, sin solapes entre salidas y con plazas libres */}
              <div className="space-y-2" aria-live="polite">
                {salidasQuery.isPending && salidasQuery.fetchStatus !== 'idle' ? <p className="text-xs text-neutro-600">{tf.cargando}</p>
                  : salidasQuery.isError ? <Alert tone="error"><p className="text-xs">{tf.error}</p><Button type="button" variant="ghost" size="sm" onClick={() => { void salidasQuery.refetch(); }}>{tf.reintentar}</Button></Alert>
                  : salidasQuery.isSuccess && !horarioRecurso ? <Alert tone="info" title={tf.sinHorarioTitulo}><p className="text-xs">{tf.sinHorario}</p></Alert>
                  : horarioRecurso && <>
                    <p className="text-xs text-neutro-600">{tf.horarioAtencion(formatearHoraFranja(horarioRecurso.apertura, localeFranjas), formatearHoraFranja(horarioRecurso.cierre, localeFranjas))}</p>
                    {franjas.length === 0 ? <p className="rounded-md border border-neutro-200 bg-neutro-50 p-3 text-xs text-neutro-700">{tf.sinFranjas}</p>
                      : <SlotPicker label={xp('departuresTitle')} slots={franjas.map((franja) => franja.inicio)} value={horaInicio} onChange={(value) => { setHoraInicio(value); setXpError(null); }} durationMinutes={duracion} />}
                  </>}
              </div>
              <ParticipantStepper value={participantes} max={maxParticipantes} onChange={(n) => { setParticipantes(n); setXpError(null); }} label={xp('participants')} decreaseLabel={xp('decrease')} increaseLabel={xp('increase')} hint={salidaElegida ? xp('maxForDeparture', { n: salidaElegida.disponibles }) : xp('capacityPerDeparture') + ': ' + xp('people', { n: cupo })} />
              <div className="flex flex-col gap-1 rounded-lg border border-bronce-200 bg-bronce-50/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-neutro-700">{xp('estimatedTotal')}</span>
                <span className="text-lg font-semibold text-bronce-700"><MoneyReference amount={Number(recurso.precio_persona) * participantes} /></span>
              </div>
              <p className="text-xs text-neutro-600">{xp('estimatedTotalNote', { n: participantes, price: money(recurso.precio_persona) })}</p>
            </div> : <div className="space-y-4">
              <DateField label={textosActividades.campoFecha} id="fecha" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              {instructorsQuery.isError && <Alert tone="error"><p>{p('serviceOptionsError')}</p><Button variant="ghost" onClick={() => { void instructorsQuery.refetch(); }}>{p('retry')}</Button></Alert>}
              <div className="space-y-1">
                <Select disabled={instructorsQuery.isPending || instructorsQuery.isError || sinInstructores} label={textosActividades.campoInstructor} id="instructor_id" value={sinInstructores ? '' : instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                  <option value="">{textosActividades.seleccionarInstructor}</option>
                  {instructoresActivos.map((inst) => <option lang="es" key={inst.id} value={inst.id}>{inst.nombre} {inst.especialidad ? `(${inst.especialidad})` : ''}</option>)}
                </Select>
                <p className="text-xs text-neutro-600">{sinInstructores ? xp('noInstructors') : tarifaInstructor > 0 ? xp('instructorCharge', { price: money(tarifaInstructor) }) : xp('instructorNoCharge')}</p>
              </div>
              {/* Franjas del backend: inicio dentro del horario y fines que no se solapan ni pasan del cierre */}
              <div className="space-y-3" aria-live="polite">
                {salidasQuery.isPending && salidasQuery.fetchStatus !== 'idle' ? <p className="text-xs text-neutro-600">{tf.cargando}</p>
                  : salidasQuery.isError ? <Alert tone="error"><p className="text-xs">{tf.error}</p><Button type="button" variant="ghost" size="sm" onClick={() => { void salidasQuery.refetch(); }}>{tf.reintentar}</Button></Alert>
                  : salidasQuery.isSuccess && !horarioRecurso ? <Alert tone="info" title={tf.sinHorarioTitulo}><p className="text-xs">{tf.sinHorario}</p></Alert>
                  : horarioRecurso && <>
                    <p className="text-xs text-neutro-600">{tf.horarioAtencion(formatearHoraFranja(horarioRecurso.apertura, localeFranjas), formatearHoraFranja(horarioRecurso.cierre, localeFranjas))} {textosActividades.duracionRegla}</p>
                    {franjas.length === 0 ? <p className="rounded-md border border-neutro-200 bg-neutro-50 p-3 text-xs text-neutro-700">{tf.sinFranjas}</p> : <>
                      <SlotPicker label={tf.horaInicio} slots={franjas.map((franja) => franja.inicio)} value={horaInicio} onChange={(value) => { setHoraInicio(value); setHoraFin(''); }} />
                      {franjaElegida && <SlotPicker label={tf.horaFin} slots={finesPosibles} value={horaFin} onChange={setHoraFin} />}
                    </>}
                  </>}
              </div>
              {/* El equipamiento con tarifa no tiene unidad de cobro definida: el servidor lo rechaza, así que no se ofrece. */}
              {equipoSinCargo
                ? <Checkbox label={xp('equipmentNoCharge')} id="con_equipo" checked={conEquipo} onChange={(e) => setConEquipo(e.target.checked)} />
                : <p className="text-xs text-neutro-600">{xp('equipmentNotBookable')}</p>}
              {/* Mismo cálculo que el backend: (tarifa del espacio + instructor elegido) × horas. */}
              {(() => {
                const minutos = horaInicio && horaFin ? timeToMinutes(horaFin) - timeToMinutes(horaInicio) : 0;
                const valido = minutos >= 30 && minutos <= 120;
                const horas = minutos / 60;
                const conInstructor = Boolean(instructorId) && !sinInstructores;
                const tarifaHora = Number(recurso.precio_hora) + (conInstructor ? tarifaInstructor : 0);
                return <div className="rounded-lg border border-bronce-200 bg-bronce-50/40 p-3" aria-live="polite">
                  {valido ? <>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-neutro-700">{xp('estimatedTotal')}</span>
                      <span className="text-lg font-semibold text-bronce-700"><MoneyReference amount={Math.round(tarifaHora * horas * 100) / 100} /></span>
                    </div>
                    <p className="mt-1 text-xs text-neutro-600">{conInstructor && tarifaInstructor > 0
                      ? xp('hourlyBreakdown', { hours: Number(horas.toFixed(2)), base: money(recurso.precio_hora), instructor: money(tarifaInstructor) })
                      : xp('hourlyTotalNote', { hours: Number(horas.toFixed(2)), price: money(recurso.precio_hora) })}</p>
                  </> : <p className="text-xs text-neutro-600">{xp('chooseTimes')}</p>}
                </div>;
              })()}
            </div>}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutro-100">
              <Button type="button" variant="ghost" onClick={handleResetAndClose}>
                {' '}{p('cancel')}{' '}</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isCliente || createMutation.isPending || !franjaElegida || (!esExperiencia && !finesPosibles.includes(horaFin.slice(0, 5)))}
                isLoading={createMutation.isPending}
              >
                {createMutation.isPending
                  ? textosActividades.procesandoReserva
                  : textosActividades.confirmarReserva}
              </Button>
            </div>
          </fieldset></form>
        )}
    </ServiceReservationPanel>
  );
};
