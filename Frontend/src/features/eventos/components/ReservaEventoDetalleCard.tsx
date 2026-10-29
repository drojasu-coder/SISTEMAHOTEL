import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Building2,
  Trash2,
  Plus,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useMiReservaEventoQuery,
  useReservaServiciosQuery,
  useCancelarReservaEventoMutation,
  useRemoveServicioFromReservaMutation,
} from '../hooks/useEventos';
import { AgregarServicioEventoModal } from './AgregarServicioEventoModal';
import { BotonAnadirAlCarrito } from '@/features/carrito';
import {
  textosEventos,
  etiquetasTipoEvento,
  etiquetasEstadoReserva,
  formatearGTQ,
} from '../textos';
import { getApiErrorMessage } from '@/api/errors';
import { ApiError } from '@/api/client/http';

interface ReservaEventoDetalleCardProps {
  id: number;
}

export const ReservaEventoDetalleCard: React.FC<ReservaEventoDetalleCardProps> = ({ id }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [modalServicioAbierto, setModalServicioAbierto] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const reservaQuery = useMiReservaEventoQuery(id, user?.id);
  const serviciosQuery = useReservaServiciosQuery(id);
  const cancelarMutation = useCancelarReservaEventoMutation();
  const removeServicioMutation = useRemoveServicioFromReservaMutation();

  const reserva = reservaQuery.data;
  const servicios = serviciosQuery.data ?? [];

  if (reservaQuery.isPending) {
    return (
      <div className="flex justify-center py-20">
        <LoadingNotice label="Cargando información del evento..." />
      </div>
    );
  }

  const isForbidden =
    reservaQuery.error instanceof ApiError && reservaQuery.error.status === 403;
  const isNotFound =
    reservaQuery.error instanceof ApiError && reservaQuery.error.status === 404;

  if (reservaQuery.isError || !reserva) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Link
          to="/mis-reservas/eventos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{textosEventos.volverAMisReservas}</span>
        </Link>
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          {isForbidden ? (
            <ShieldAlert className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          )}
          <h2 className="text-lg font-serif font-bold text-neutro-900 mb-2">
            {isForbidden
              ? 'Acceso denegado'
              : isNotFound
              ? 'Evento no encontrado'
              : 'Error al cargar la reserva'}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {isForbidden
              ? 'No tiene permisos para consultar este evento porque pertenece a otro usuario.'
              : isNotFound
              ? 'La reserva de evento solicitada no existe o fue retirada.'
              : getApiErrorMessage(reservaQuery.error)}
          </p>
          <Button variant="secondary" onClick={() => navigate('/mis-reservas/eventos')}>
            {textosEventos.volverAMisReservas}
          </Button>
        </Card>
      </section>
    );
  }

  const estadoInfo = etiquetasEstadoReserva[reserva.estado] ?? {
    label: reserva.estado,
    tone: 'neutral',
  };

  const puedeModificarServicios = reserva.estado === 'cotizacion';
  const puedeCancelar = reserva.estado === 'cotizacion';
  const esPagable = reserva.estado === 'cotizacion' || reserva.estado === 'confirmada';

  const handleCancelar = async () => {
    setErrorAccion(null);
    try {
      await cancelarMutation.mutateAsync(reserva.id);
      setConfirmarCancelacion(false);
    } catch (err: unknown) {
      setErrorAccion(getApiErrorMessage(err));
    }
  };

  const handleRemoveServicio = async (asociacionId: number) => {
    setErrorAccion(null);
    try {
      await removeServicioMutation.mutateAsync({
        reservaId: reserva.id,
        id: asociacionId,
      });
    } catch (err: unknown) {
      setErrorAccion(getApiErrorMessage(err));
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Botón de retorno */}
      <Link
        to="/mis-reservas/eventos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors w-fit"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{textosEventos.volverAMisReservas}</span>
      </Link>

      {errorAccion && (
        <Alert tone="error" title="Atención">
          {errorAccion}
        </Alert>
      )}

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutro-200 pb-6">
        <div>
          <p className="eyebrow">{textosEventos.detalleReservaEyebrow}</p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutro-900 mt-1">
            Evento #{reserva.id} — {etiquetasTipoEvento[reserva.tipo_evento] ?? reserva.tipo_evento}
          </h1>
          <p className="text-sm text-neutro-600 mt-0.5">
            Salón: {reserva.Salon?.nombre ?? 'Salón del hotel'}
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            estadoInfo.tone === 'success'
              ? 'bg-selva-100 text-selva-800'
              : estadoInfo.tone === 'warning'
              ? 'bg-amber-100 text-amber-800'
              : estadoInfo.tone === 'error'
              ? 'bg-rojo-100 text-rojo-800'
              : 'bg-neutro-100 text-neutro-800'
          }`}
        >
          {estadoInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna Izquierda: Información y Servicios */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Detalles del Evento */}
          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-neutro-900 mb-4">
              {textosEventos.informacionGeneral}
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="size-4 text-neutro-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-neutro-500 font-medium">Fecha programada</dt>
                  <dd className="font-semibold text-neutro-900">{reserva.fecha}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="size-4 text-neutro-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-neutro-500 font-medium">Horario reservado</dt>
                  <dd className="font-semibold text-neutro-900">
                    {reserva.hora_inicio} a {reserva.hora_fin}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="size-4 text-neutro-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-neutro-500 font-medium">Cantidad de invitados</dt>
                  <dd className="font-semibold text-neutro-900">{reserva.numero_invitados} personas</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="size-4 text-neutro-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-neutro-500 font-medium">Espacio / Salón</dt>
                  <dd className="font-semibold text-neutro-900">{reserva.Salon?.nombre ?? 'Salón'}</dd>
                </div>
              </div>
            </dl>
          </Card>

          {/* Servicios Adicionales */}
          <Card className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-neutro-900">
                  {textosEventos.serviciosAdicionalesTitulo}
                </h2>
                <p className="text-xs text-neutro-600">
                  {textosEventos.serviciosAdicionalesDesc}
                </p>
              </div>

              {puedeModificarServicios && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs"
                  onClick={() => setModalServicioAbierto(true)}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>{textosEventos.agregarServicioBoton}</span>
                </Button>
              )}
            </div>

            {servicios.length === 0 ? (
              <div className="rounded-lg bg-neutro-50 p-6 text-center text-xs text-neutro-500">
                {textosEventos.sinServiciosAgregados}
              </div>
            ) : (
              <div className="divide-y divide-neutro-100 overflow-hidden rounded-lg border border-neutro-200">
                {servicios.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-neutro-900">
                        {item.ServicioEvento?.nombre ?? 'Servicio adicional'}
                      </span>
                      <span className="text-xs text-neutro-500">
                        {item.cantidad} x {formatearGTQ(item.ServicioEvento?.precio)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-neutro-900">
                        {formatearGTQ(item.subtotal)}
                      </span>
                      {puedeModificarServicios && (
                        <button
                          type="button"
                          onClick={() => handleRemoveServicio(item.id)}
                          className="rounded p-1 text-neutro-400 hover:text-rojo-600 hover:bg-rojo-50 transition-colors"
                          title={textosEventos.eliminarServicio}
                          aria-label={textosEventos.eliminarServicio}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Resumen Financiero y Acciones */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-6 border-bronce-200">
            <div>
              <p className="eyebrow text-bronce-700">{textosEventos.resumenFinanciero}</p>
              <h2 className="text-xl font-serif font-bold text-neutro-900 mt-1">
                Presupuesto
              </h2>
            </div>

            <dl className="flex flex-col gap-3 text-sm border-t border-b border-neutro-100 py-4">
              <div className="flex justify-between text-xs text-neutro-600">
                <dt>{textosEventos.tarifaSalon}</dt>
                <dd className="font-medium text-neutro-800">
                  {formatearGTQ(reserva.Salon?.tarifa_base)}
                </dd>
              </div>

              {servicios.length > 0 && (
                <div className="flex justify-between text-xs text-neutro-600">
                  <dt>{textosEventos.totalServicios}</dt>
                  <dd className="font-medium text-neutro-800">
                    {formatearGTQ(
                      servicios.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0)
                    )}
                  </dd>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-neutro-900 pt-2 border-t border-neutro-100">
                <dt>{textosEventos.totalEstimado}</dt>
                <dd className="text-bronce-700">{formatearGTQ(reserva.total)}</dd>
              </div>

              <div className="flex justify-between text-xs font-semibold text-selva-800 bg-selva-50 p-2.5 rounded-lg border border-selva-200">
                <dt>{textosEventos.anticipoRequerido}</dt>
                <dd>{formatearGTQ(reserva.anticipo)}</dd>
              </div>
            </dl>

            {/* Acciones de Pago */}
            {esPagable && (
              <div className="flex flex-col gap-2">
                <BotonAnadirAlCarrito
                  reservaId={reserva.id}
                  reservaEstado={reserva.estado}
                  tipo_item="evento"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  notaPagable={
                    <p className="text-[0.6875rem] text-neutro-500 text-center">
                      Al pagar el carrito podrá optar por liquidar el total o el anticipo reglamentario.
                    </p>
                  }
                />
              </div>
            )}

            {/* Cancelación */}
            {puedeCancelar && (
              <div className="border-t border-neutro-100 pt-4">
                {confirmarCancelacion ? (
                  <div className="flex flex-col gap-2 rounded-lg bg-rojo-50 p-3 border border-rojo-200 text-xs">
                    <p className="font-semibold text-rojo-800">
                      {textosEventos.confirmarCancelacion}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs"
                        onClick={handleCancelar}
                        disabled={cancelarMutation.isPending}
                      >
                        {cancelarMutation.isPending ? textosEventos.cancelando : 'Sí, cancelar'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={() => setConfirmarCancelacion(false)}
                      >
                        Volver
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-rojo-600 hover:text-rojo-700 hover:bg-rojo-50"
                    onClick={() => setConfirmarCancelacion(true)}
                  >
                    {textosEventos.cancelarCotizacion}
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {modalServicioAbierto && (
        <AgregarServicioEventoModal
          reservaId={reserva.id}
          isOpen={modalServicioAbierto}
          onClose={() => setModalServicioAbierto(false)}
        />
      )}
    </section>
  );
};
