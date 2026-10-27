import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { Modal } from '@/components/ui/Modal';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { useDraftSiteGuard, DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';
import React, { useMemo, useState } from 'react';
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
import { useInstructoresQuery } from '../hooks/useActividades';
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
  const { p, date: calendarDate } = usePublicInterface();
  const navigate = useNavigate();
  const siteBlocked = useDraftSiteGuard(recurso?.id, recurso?.sucursal_id);
  const { user } = useAuth();
  const isCliente = user?.rol === 'cliente';

  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState<string>(hoy);
  const [horaInicio, setHoraInicio] = useState<string>('10:00');
  const [horaFin, setHoraFin] = useState<string>('11:00');
  const [instructorId, setInstructorId] = useState<string>('');
  const [conEquipo, setConEquipo] = useState<boolean>(false);

  const [errorLocal, setErrorLocal] = useState<LocalizedError | null>(null);
  const [falloIncierto, setFalloIncierto] = useState<boolean>(false);
  const [reservaCreada, setReservaCreada] = useState<ReservaActividad | null>(null);

  const { data: instructores = [] } = useInstructoresQuery();
  const instructoresActivos = useMemo(
    () => instructores.filter((i) => i.activo),
    [instructores]
  );

  const createMutation = useCreateReservaActividadMutation(user?.id);

  // Estimación previa de precio (el servidor valida y calcula el total definitivo)
  const totalEstimado = useMemo(() => {
    if (!recurso) return 0;
    const inicio = timeToMinutes(horaInicio);
    const fin = timeToMinutes(horaFin);
    const duracionHoras = Math.max(0, (fin - inicio) / 60);

    const precioBase = Number(recurso.precio_hora || 0) * duracionHoras;
    return Math.round((precioBase + Number.EPSILON) * 100) / 100;
  }, [recurso, horaInicio, horaFin]);

  if (!isOpen || !recurso) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setFalloIncierto(false);

    if (!isCliente) {
      setErrorLocal({ section: 'extra', key: 'activityLogin' });
      return;
    }

    if (!fecha) {
      setErrorLocal({ section: 'extra', key: 'requiredDate' });
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

    const instIdNum = instructorId ? parseInt(instructorId, 10) : undefined;

    try {
      const created = await createMutation.mutateAsync({
        recurso_id: recurso.id!,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        instructor_id: instIdNum || null,
        con_equipo: conEquipo,
      });

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
        code === 'PAST_DATE_TIME' ||
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
    setFalloIncierto(false);
    onClose();
  };

  return (
    <Modal open onClose={handleResetAndClose} closeLabel={p('closeModal')} title={reservaCreada ? textosActividades.reservaExitosaTitulo : recurso.nombre ?? p('facility')} busy={createMutation.isPending} busyLabel={p('processingRequest')}>
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
            <div className="rounded-lg bg-neutro-50 p-3.5 border border-neutro-200 text-xs text-neutro-700 space-y-1.5">
              <div className="flex justify-between">
                <span>{textosActividades.precioPorHora}</span>
                <span className="font-semibold text-neutro-900"><MoneyReference amount={recurso.precio_hora} /></span>
              </div>
              <div className="pt-1.5 border-t border-neutro-200 flex justify-between font-medium text-neutro-900">
                <span>{p('estimatedTotal')}:</span>
                <span className="text-bronce-700 font-semibold"><MoneyReference amount={totalEstimado} /></span>
              </div>
            </div>

            {/* Advertencia si no está autenticado como cliente */}
            {!isCliente && (
              <Alert tone="warning" title={p('customerAccess')}>
                {' '}{p('activityLoginPrefix')}{' '}
                <Link to="/login" className="font-semibold underline">
                  {' '}{p('signIn')}{' '}</Link>{' '}
                {' '}{p('customerAccountSuffix')}{' '}</Alert>
            )}

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

            <div className="space-y-4">
              <DateField label={textosActividades.campoFecha} id="fecha" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TimeField label={textosActividades.campoHoraInicio} id="hora_inicio" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
                <TimeField label={textosActividades.campoHoraFin} id="hora_fin" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
              </div>
              <p className="text-xs text-neutro-600">{textosActividades.duracionRegla}</p>
              <Select label={textosActividades.campoInstructor} id="instructor_id" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                <option value="">{textosActividades.seleccionarInstructor}</option>
                {instructoresActivos.map((inst) => <option lang="es" key={inst.id} value={inst.id}>{inst.nombre} {inst.especialidad ? `(${inst.especialidad})` : ''}</option>)}
              </Select>
              <Checkbox label={textosActividades.campoEquipo} id="con_equipo" checked={conEquipo} onChange={(e) => setConEquipo(e.target.checked)} />
            </div>

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
    </Modal>
  );
};
