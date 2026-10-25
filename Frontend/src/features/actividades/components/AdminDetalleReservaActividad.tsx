import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  User,
  ArrowLeft,
  AlertCircle,
  Trophy,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import {
  useAdminReservaActividadQuery,
  useUpdateEstadoReservaActividadMutation,
} from '../hooks/useReservasActividad';
import { ACTIVIDADES_ROUTES } from '../constants/routes';
import { textosActividades, formatearGTQ } from '../textos';

export const AdminDetalleReservaActividad: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const reservaId = Number(id);

  const reservaQuery = useAdminReservaActividadQuery(reservaId);
  const reserva = reservaQuery.data;

  const [modalAction, setModalAction] = useState<'confirmada' | 'cancelada' | 'completada' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateMutation = useUpdateEstadoReservaActividadMutation(reservaId);

  if (reservaQuery.isPending) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12" aria-busy="true">
        <Card className="p-8 space-y-6">
          <div className="h-8 w-1/3 animate-pulse rounded bg-neutro-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutro-200" />
          <div className="h-32 w-full animate-pulse rounded bg-neutro-200" />
        </Card>
      </div>
    );
  }

  if (reservaQuery.isError || !reserva) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-neutro-900 mb-2">
            No se encontró la reserva de actividad
          </h1>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            La reserva solicitada no existe en el sistema o se produjo un inconveniente de conexión.
          </p>
          <div className="flex gap-4">
            <Button type="button" variant="primary" onClick={() => reservaQuery.refetch()}>
              {textosActividades.reintentar}
            </Button>
            <Link
              to={ACTIVIDADES_ROUTES.ADMIN_RESERVAS}
              className={buttonStyles({ variant: 'secondary' })}
            >
              Volver al listado
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const estadoClave = reserva.estado || 'confirmada';
  const estadoTexto = textosActividades.estados[estadoClave] || estadoClave;

  const estadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return 'border-verde-200 bg-verde-50 text-verde-800';
      case 'completada':
        return 'border-azul-200 bg-azul-50 text-azul-800';
      case 'cancelada':
        return 'border-neutro-300 bg-neutro-100 text-neutro-600';
      default:
        return 'border-neutro-200 bg-neutro-50 text-neutro-700';
    }
  };

  const handleConfirmAction = async () => {
    if (!modalAction) return;
    setActionError(null);

    try {
      await updateMutation.mutateAsync({
        estado: modalAction,
      });
      setModalAction(null);
    } catch (err: any) {
      const code = err?.code || err?.response?.data?.code;
      const msg = err?.message || err?.response?.data?.message;

      if (code === 'RESERVATION_NOT_FINISHED') {
        setActionError(textosActividades.errorNoFinalizada);
      } else if (code === 'RESOURCE_OVERLAP') {
        setActionError(textosActividades.errorRecursoOcupado);
      } else if (code === 'INSTRUCTOR_OVERLAP') {
        setActionError(textosActividades.errorInstructorOcupado);
      } else if (code === 'INSTRUCTOR_INACTIVE') {
        setActionError(textosActividades.errorInstructorInactivo);
      } else if (code === 'ACTIVITY_DATE_IN_PAST') {
        setActionError(textosActividades.errorFechaPasada);
      } else {
        setActionError(msg || 'No fue posible actualizar el estado de la reserva.');
      }
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <Link
          to={ACTIVIDADES_ROUTES.ADMIN_RESERVAS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-bronce-700 hover:text-bronce-800 mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Volver al listado de reservas</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="eyebrow">{textosActividades.adminSubtitulo}</p>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-neutro-900">
              Detalle de Reserva #{reserva.id}
            </h1>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-center border ${estadoBadgeClass(
              estadoClave
            )}`}
          >
            {estadoTexto}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información central */}
        <Card className="p-6 md:col-span-2 space-y-6">
          {/* Instalación y sede */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2 flex items-center gap-2">
              <Trophy className="size-4 text-bronce-600" aria-hidden="true" />
              <span>Instalación deportiva</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-neutro-500 block">Nombre del recurso:</span>
                <span className="font-semibold text-neutro-900">
                  {reserva.RecursoActividad?.nombre || `Recurso #${reserva.recurso_id}`}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutro-500 block">Tipo:</span>
                <span className="font-medium text-neutro-900 uppercase text-xs tracking-wider">
                  {reserva.RecursoActividad?.tipo || 'General'}
                </span>
              </div>

              {reserva.RecursoActividad?.Sucursal && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-neutro-500 block">Sede:</span>
                  <div className="flex items-center gap-1.5 font-medium text-neutro-900 mt-0.5">
                    <MapPin className="size-4 text-neutro-400 shrink-0" aria-hidden="true" />
                    <span>{reserva.RecursoActividad.Sucursal.nombre}</span>
                    {reserva.RecursoActividad.Sucursal.direccion && (
                      <span className="text-xs text-neutro-500 font-normal">
                        ({reserva.RecursoActividad.Sucursal.direccion})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2 flex items-center gap-2">
              <User className="size-4 text-bronce-600" aria-hidden="true" />
              <span>Datos del cliente</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-neutro-500 block">Nombre completo:</span>
                <span className="font-medium text-neutro-900">
                  {reserva.Usuario?.nombre || `Cliente #${reserva.usuario_id}`}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutro-500 block">Correo electrónico:</span>
                <div className="flex items-center gap-1.5 text-neutro-700">
                  <Mail className="size-3.5 text-neutro-400 shrink-0" />
                  <span>{reserva.Usuario?.email || 'No disponible'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fecha, hora y servicios */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2 flex items-center gap-2">
              <Calendar className="size-4 text-bronce-600" aria-hidden="true" />
              <span>Programación y servicios</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-neutro-500 block">Fecha reservada:</span>
                <span className="font-medium text-neutro-900">{reserva.fecha}</span>
              </div>

              <div>
                <span className="text-xs text-neutro-500 block">Horario de uso:</span>
                <span className="font-medium text-neutro-900">
                  {reserva.hora_inicio?.slice(0, 5)} - {reserva.hora_fin?.slice(0, 5)}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutro-500 block">Instructor asignado:</span>
                <span className="font-medium text-neutro-900">
                  {reserva.Instructor ? (
                    `${reserva.Instructor.nombre} ${reserva.Instructor.especialidad ? `(${reserva.Instructor.especialidad})` : ''}`
                  ) : (
                    <span className="text-neutro-400 font-normal">{textosActividades.sinInstructor}</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutro-500 block">Equipamiento adicional:</span>
                <span className="font-medium text-neutro-900">
                  {reserva.con_equipo ? (
                    <span className="text-verde-700">✓ Incluido</span>
                  ) : (
                    <span className="text-neutro-400 font-normal">No solicitado</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Panel lateral: Acciones administrativas e importes */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2">
              Importe de la sesión
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-neutro-500">Total registrado:</span>
                <span className="text-2xl font-serif font-semibold text-bronce-700">
                  {formatearGTQ(reserva.total)}
                </span>
              </div>
              <p className="text-[11px] text-neutro-500">
                Calculado con base en la duración ({reserva.hora_inicio?.slice(0, 5)} - {reserva.hora_fin?.slice(0, 5)}) y tarifas vigentes al momento de la reserva.
              </p>
            </div>
          </Card>

          {/* Acciones de estado */}
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2">
              Acciones de supervisión
            </h2>

            <div className="flex flex-col gap-2.5">
              {estadoClave === 'confirmada' && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full justify-center text-azul-700 hover:bg-azul-50 border-azul-200"
                    onClick={() => setModalAction('completada')}
                  >
                    <CheckCircle2 className="size-4 mr-2 text-azul-600" aria-hidden="true" />
                    <span>{textosActividades.completarActividad}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    className="w-full justify-center"
                    onClick={() => setModalAction('cancelada')}
                  >
                    <XCircle className="size-4 mr-2" aria-hidden="true" />
                    <span>{textosActividades.cancelarActividad}</span>
                  </Button>
                </>
              )}

              {(estadoClave === 'cancelada' || estadoClave === 'completada') && (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => setModalAction('confirmada')}
                >
                  <RefreshCw className="size-4 mr-2" aria-hidden="true" />
                  <span>{textosActividades.reactivarActividad}</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de confirmación */}
      {modalAction && (
        <Modal
          open={Boolean(modalAction)}
          onClose={() => {
            setModalAction(null);
            setActionError(null);
          }}
          title={textosActividades.confirmarCambioEstado}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutro-700">
              ¿Está seguro de cambiar el estado de la reserva recreativa <strong>#{reserva.id}</strong> al estado{' '}
              <strong className="uppercase text-bronce-700">{modalAction}</strong>?
            </p>

            {modalAction === 'completada' && (
              <p className="text-xs text-neutro-500 bg-neutro-50 p-2 rounded border border-neutro-200">
                {textosActividades.advertenciaCompletar}
              </p>
            )}

            {modalAction === 'confirmada' && (
              <p className="text-xs text-neutro-500 bg-neutro-50 p-2 rounded border border-neutro-200">
                {textosActividades.advertenciaReactivar}
              </p>
            )}

            {actionError && (
              <Alert tone="error">
                <p>{actionError}</p>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-neutro-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setModalAction(null);
                  setActionError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant={modalAction === 'cancelada' ? 'danger' : 'primary'}
                onClick={handleConfirmAction}
                isLoading={updateMutation.isPending}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Actualizando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};
