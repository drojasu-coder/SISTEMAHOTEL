import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';
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
import { formatearGTQ, textosActividades } from '../textos';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCliente = user?.rol === 'cliente';

  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState<string>(hoy);
  const [horaInicio, setHoraInicio] = useState<string>('10:00');
  const [horaFin, setHoraFin] = useState<string>('11:00');
  const [instructorId, setInstructorId] = useState<string>('');
  const [conEquipo, setConEquipo] = useState<boolean>(false);

  const [errorLocal, setErrorLocal] = useState<string | null>(null);
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
      setErrorLocal('Debe iniciar sesión como cliente para reservar una actividad recreativa.');
      return;
    }

    if (!fecha) {
      setErrorLocal('La fecha es obligatoria.');
      return;
    }

    const minInicio = timeToMinutes(horaInicio);
    const minFin = timeToMinutes(horaFin);
    const duracionMin = minFin - minInicio;

    if (minInicio >= minFin) {
      setErrorLocal(textosActividades.errorRangoInvalido);
      return;
    }

    if (duracionMin < 30 || duracionMin > 120) {
      setErrorLocal(textosActividades.errorDuracionInvalida);
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
        setErrorLocal(textosActividades.errorRecursoOcupado);
      } else if (
        code === 'INSTRUCTOR_OVERLAP' ||
        (msgLower.includes('instructor') && (msgLower.includes('ocupad') || msgLower.includes('clase'))) ||
        msg.includes('INSTRUCTOR_OVERLAP')
      ) {
        setErrorLocal(textosActividades.errorInstructorOcupado);
      } else if (
        code === 'INSTRUCTOR_INACTIVE' ||
        msgLower.includes('inactivo') ||
        msg.includes('INSTRUCTOR_INACTIVE')
      ) {
        setErrorLocal(textosActividades.errorInstructorInactivo);
      } else if (
        code === 'INVALID_ACTIVITY_DURATION' ||
        msgLower.includes('duración') ||
        msgLower.includes('30 minutos') ||
        msg.includes('INVALID_ACTIVITY_DURATION')
      ) {
        setErrorLocal(textosActividades.errorDuracionInvalida);
      } else if (
        code === 'PAST_DATE_TIME' ||
        msgLower.includes('pasado') ||
        msgLower.includes('pasada') ||
        msg.includes('PAST_DATE_TIME')
      ) {
        setErrorLocal(textosActividades.errorFechaPasada);
      } else if (
        msgLower.includes('red') ||
        msgLower.includes('conexión') ||
        msgLower.includes('fetch') ||
        msgLower.includes('timeout')
      ) {
        setErrorLocal(textosActividades.errorInciertoRed);
        setFalloIncierto(true);
      } else {
        setErrorLocal(msg || textosActividades.errorGenericoCreacion);
      }
    }
  };

  const handleResetAndClose = () => {
    setReservaCreada(null);
    setErrorLocal(null);
    setFalloIncierto(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-actividad-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutro-900/50 backdrop-blur-xs"
    >
      <div className="surface flex w-full max-w-lg flex-col gap-5 rounded-2xl p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
        {/* Cabecera / Cierre */}
        <div className="flex items-center justify-between border-b border-neutro-100 pb-3">
          <span className="text-xs font-semibold text-bronce-700 tracking-wide uppercase">
            {textosActividades.nuevaReservaTitulo}
          </span>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded p-1 text-neutro-400 hover:text-neutro-600 focus:outline-none"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {reservaCreada ? (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-verde-100 text-verde-600">
              <CheckCircle className="size-8" aria-hidden="true" />
            </div>

            <h2 id="modal-actividad-titulo" className="text-xl font-semibold text-neutro-900">
              {textosActividades.reservaExitosaTitulo}
            </h2>

            <p className="text-sm text-neutro-600 max-w-sm">
              {textosActividades.reservaExitosaDesc}
            </p>

            <div className="w-full rounded-lg bg-neutro-50 p-4 text-left border border-neutro-200 space-y-2 text-sm text-neutro-800">
              <div className="flex justify-between">
                <span className="text-neutro-500">Reserva:</span>
                <span className="font-semibold text-neutro-900">#{reservaCreada.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">Instalación:</span>
                <span className="font-medium text-neutro-900">{recurso.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">Fecha y horario:</span>
                <span className="font-medium text-neutro-900">
                  {reservaCreada.fecha} ({reservaCreada.hora_inicio?.slice(0, 5)} - {reservaCreada.hora_fin?.slice(0, 5)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">Total calculado:</span>
                <span className="font-semibold text-bronce-700">
                  {formatearGTQ(reservaCreada.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">Estado:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-verde-100 text-verde-800">
                  {textosActividades.estados[reservaCreada.estado || 'confirmada']}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full gap-3 pt-3">
              {/* Botón de añadir al carrito activo para proceder al pago */}
              <div className="flex-1">
                <BotonAnadirAlCarrito
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <p className="eyebrow text-bronce-700 font-semibold">{textosActividades.subtitulo}</p>
              <h2 id="modal-actividad-titulo" className="text-xl font-semibold text-neutro-900 mt-1">
                {recurso.nombre}
              </h2>
              <p className="text-xs text-neutro-500 mt-0.5">
                {recurso.Sucursal?.nombre ? `Sede: ${recurso.Sucursal.nombre} · ` : ''}
                Tipo: {recurso.tipo}
              </p>
            </div>

            {/* Tarifas del servidor */}
            <div className="rounded-lg bg-neutro-50 p-3.5 border border-neutro-200 text-xs text-neutro-700 space-y-1.5">
              <div className="flex justify-between">
                <span>{textosActividades.precioPorHora}</span>
                <span className="font-semibold text-neutro-900">{formatearGTQ(recurso.precio_hora)}</span>
              </div>
              <div className="pt-1.5 border-t border-neutro-200 flex justify-between font-medium text-neutro-900">
                <span>{textosActividades.totalCalculado}:</span>
                <span className="text-bronce-700 font-semibold">{formatearGTQ(totalEstimado)}</span>
              </div>
            </div>

            {/* Advertencia si no está autenticado como cliente */}
            {!isCliente && (
              <Alert tone="warning" title="Acceso exclusivo para clientes">
                Para solicitar una reserva recreativa, debe{' '}
                <Link to="/login" className="font-semibold underline">
                  iniciar sesión
                </Link>{' '}
                con su cuenta de cliente.
              </Alert>
            )}

            {errorLocal && (
              <Alert tone="error">
                <p className="text-xs">{errorLocal}</p>
                {falloIncierto && (
                  <div className="mt-2">
                    <Link
                      to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
                      className="text-xs font-semibold text-rojo-700 underline"
                    >
                      Consultar mis actividades
                    </Link>
                  </div>
                )}
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="fecha" className="block text-xs font-medium text-neutro-700 mb-1">
                  {textosActividades.campoFecha}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="fecha"
                    min={hoy}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                    required
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="hora_inicio" className="block text-xs font-medium text-neutro-700 mb-1">
                    {textosActividades.campoHoraInicio}
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="hora_inicio"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                      required
                    />
                    <Clock className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="hora_fin" className="block text-xs font-medium text-neutro-700 mb-1">
                    {textosActividades.campoHoraFin}
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="hora_fin"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                      required
                    />
                    <Clock className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-neutro-500">{textosActividades.duracionRegla}</p>

              {/* Selector opcional de Instructor */}
              <div>
                <label htmlFor="instructor_id" className="block text-xs font-medium text-neutro-700 mb-1">
                  {textosActividades.campoInstructor}
                </label>
                <div className="relative">
                  <select
                    id="instructor_id"
                    value={instructorId}
                    onChange={(e) => setInstructorId(e.target.value)}
                    className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 bg-white"
                  >
                    <option value="">{textosActividades.seleccionarInstructor}</option>
                    {instructoresActivos.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre} {inst.especialidad ? `(${inst.especialidad})` : ''}
                      </option>
                    ))}
                  </select>
                  <User className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" />
                </div>
              </div>

              {/* Opción de equipamiento */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="con_equipo"
                  checked={conEquipo}
                  onChange={(e) => setConEquipo(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-neutro-300 text-bronce-600 focus:ring-bronce-500"
                />
                <label htmlFor="con_equipo" className="text-xs text-neutro-700 cursor-pointer">
                  {textosActividades.campoEquipo}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutro-100">
              <Button type="button" variant="ghost" onClick={handleResetAndClose}>
                Cancelar
              </Button>
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
          </form>
        )}
      </div>
    </div>
  );
};
