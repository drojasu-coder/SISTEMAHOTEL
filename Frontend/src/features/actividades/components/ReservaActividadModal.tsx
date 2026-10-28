import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
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
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/api/client/http';
import { getApiErrorMessage } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthContext';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';
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
  const navigate = useNavigate();
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
  const salidasQuery = useSalidasActividadQuery(recurso?.id, fecha, isOpen && esExperiencia);
  const salidas = salidasQuery.data?.salidas ?? [];
  const salidaElegida = salidas.find((salida) => salida.hora_inicio.slice(0, 5) === horaInicio);
  const maxParticipantes = Math.max(1, salidaElegida ? salidaElegida.disponibles : cupo);

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
        if (code === 'ACTIVITY_CAPACITY_EXCEEDED') { setXpError('errorCapacity'); void salidasQuery.refetch(); }
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

      if (
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
              {/* Botón de añadir al carrito activo para proceder al pago */}
              <div className="flex-1">
                <BotonAnadirAlCarrito
          publicInterface
                  reservaId={reservaCreada.id!}
                  reservaEstado={reservaCreada.estado || 'confirmada'}
                  tipo_item="actividad"
                  variant="primary"
                  className="w-full justify-center"
                  onSuccess={() => {
                    navigate('/carrito');
                  }}
                />
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

            {esExperiencia ? <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateField label={textosActividades.campoFecha} id="fecha" min={hoy} value={fecha} onChange={(e) => { setFecha(e.target.value); setXpError(null); }} required />
                <TimeField label={textosActividades.campoHoraInicio} id="hora_inicio" value={horaInicio} onChange={(e) => { setHoraInicio(e.target.value); setXpError(null); }} required />
              </div>
              <p className="text-sm text-neutro-700" aria-live="polite">{horaFinCalculada ? xp('endsAt', { time: horaFinCalculada }) : horaInicio ? xp('errorSameDay') : xp('chooseStart')} · {xp('duration')}: {formatDuration(duracion)}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutro-800">{xp('departuresTitle')}</p>
                {salidasQuery.isPending && <p className="text-xs text-neutro-600">{xp('departuresLoading')}</p>}
                {salidasQuery.isError && <Alert tone="error"><p className="text-xs">{xp('departuresError')}</p><Button type="button" variant="ghost" size="sm" onClick={() => { void salidasQuery.refetch(); }}>{p('retry')}</Button></Alert>}
                {salidasQuery.isSuccess && (salidas.length === 0
                  ? <p className="text-xs text-neutro-600">{xp('departuresNone')}</p>
                  : <div className="flex flex-wrap gap-2">{salidas.map((salida) => {
                      const time = salida.hora_inicio.slice(0, 5);
                      const lleno = salida.disponibles <= 0;
                      return <Button key={salida.hora_inicio} type="button" size="sm" variant={horaInicio === time ? 'primary' : 'secondary'} disabled={lleno} aria-pressed={horaInicio === time} aria-label={lleno ? `${time} · ${xp('full')}` : xp('joinDeparture', { time })} onClick={() => { setHoraInicio(time); setXpError(null); }}>
                        {time} · {lleno ? xp('full') : xp('spotsLeft', { n: salida.disponibles })}
                      </Button>;
                    })}</div>)}
              </div>
              <ParticipantStepper value={participantes} max={maxParticipantes} onChange={(n) => { setParticipantes(n); setXpError(null); }} label={xp('participants')} decreaseLabel={xp('decrease')} increaseLabel={xp('increase')} hint={salidaElegida ? xp('maxForDeparture', { n: salidaElegida.disponibles }) : xp('capacityPerDeparture') + ': ' + xp('people', { n: cupo })} />
              <div className="flex flex-col gap-1 rounded-lg border border-bronce-200 bg-bronce-50/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-neutro-700">{xp('estimatedTotal')}</span>
                <span className="text-lg font-semibold text-bronce-700"><MoneyReference amount={Number(recurso.precio_persona) * participantes} /></span>
              </div>
              <p className="text-xs text-neutro-600">{xp('estimatedTotalNote', { n: participantes, price: money(recurso.precio_persona) })}</p>
            </div> : <div className="space-y-4">
              <DateField label={textosActividades.campoFecha} id="fecha" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TimeField label={textosActividades.campoHoraInicio} id="hora_inicio" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
                <TimeField label={textosActividades.campoHoraFin} id="hora_fin" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
              </div>
              <p className="text-xs text-neutro-600">{textosActividades.duracionRegla}</p>
              {instructorsQuery.isError && <Alert tone="error"><p>{p('serviceOptionsError')}</p><Button variant="ghost" onClick={() => { void instructorsQuery.refetch(); }}>{p('retry')}</Button></Alert>}
              <div className="space-y-1">
                <Select disabled={instructorsQuery.isPending || instructorsQuery.isError || sinInstructores} label={textosActividades.campoInstructor} id="instructor_id" value={sinInstructores ? '' : instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                  <option value="">{textosActividades.seleccionarInstructor}</option>
                  {instructoresActivos.map((inst) => <option lang="es" key={inst.id} value={inst.id}>{inst.nombre} {inst.especialidad ? `(${inst.especialidad})` : ''}</option>)}
                </Select>
                <p className="text-xs text-neutro-600">{sinInstructores ? xp('noInstructors') : tarifaInstructor > 0 ? xp('instructorCharge', { price: money(tarifaInstructor) }) : xp('instructorNoCharge')}</p>
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
                disabled={!isCliente || createMutation.isPending}
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
