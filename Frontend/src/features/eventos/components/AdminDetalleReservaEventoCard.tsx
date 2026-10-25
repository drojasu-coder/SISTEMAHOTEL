import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Building2,
  User,
  Mail,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import {
  useAdminReservaEventoQuery,
  useReservaServiciosQuery,
} from '../hooks/useEventos';
import { AdminReservaEventoEstadoModal } from './AdminReservaEventoEstadoModal';
import {
  etiquetasTipoEvento,
  etiquetasEstadoReserva,
  formatearGTQ,
} from '../textos';
import { getApiErrorMessage } from '@/api/errors';

interface AdminDetalleReservaEventoCardProps {
  id: number;
}

export const AdminDetalleReservaEventoCard: React.FC<AdminDetalleReservaEventoCardProps> = ({
  id,
}) => {
  const navigate = useNavigate();
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);

  const reservaQuery = useAdminReservaEventoQuery(id);
  const serviciosQuery = useReservaServiciosQuery(id);

  const reserva = reservaQuery.data;
  const servicios = serviciosQuery.data ?? [];

  if (reservaQuery.isPending) {
    return (
      <div className="flex justify-center py-20">
        <LoadingNotice label="Cargando reserva de evento..." />
      </div>
    );
  }

  if (reservaQuery.isError || !reserva) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Link
          to="/admin/reservas-evento"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors w-fit"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Volver al listado</span>
        </Link>
        <Card className="p-8">
          <Alert tone="error" title="No se encontró la reserva">
            {getApiErrorMessage(reservaQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate('/admin/reservas-evento')}>
              Volver al listado
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  const estadoInfo = etiquetasEstadoReserva[reserva.estado] ?? {
    label: reserva.estado,
    tone: 'neutral',
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Retorno */}
      <Link
        to="/admin/reservas-evento"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors w-fit"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Volver al listado administrativo</span>
      </Link>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutro-200 pb-6">
        <div>
          <p className="eyebrow">Gestión Administrativa</p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutro-900 mt-1">
            Reserva #{reserva.id} — {etiquetasTipoEvento[reserva.tipo_evento] ?? reserva.tipo_evento}
          </h1>
          <p className="text-sm text-neutro-600 mt-0.5">
            Salón: {reserva.Salon?.nombre ?? 'Salón'}
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalEstadoAbierto(true)}
            className="inline-flex items-center gap-1.5 text-xs"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            <span>Actualizar estado</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Columna Izquierda: Información de Cliente y Evento */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Datos del Cliente */}
          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-neutro-900 mb-3">
              Información del Cliente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2.5">
                <User className="size-4 text-neutro-400" />
                <div>
                  <span className="text-xs text-neutro-500 block">Nombre del cliente</span>
                  <span className="font-semibold text-neutro-900">
                    {reserva.Usuario?.nombre ?? 'Usuario no especificado'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-neutro-400" />
                <div>
                  <span className="text-xs text-neutro-500 block">Correo electrónico</span>
                  <span className="font-semibold text-neutro-900">
                    {reserva.Usuario?.email ?? 'Sin correo'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Datos de Reserva */}
          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-neutro-900 mb-4">
              Especificaciones del Evento
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
                  <dt className="text-xs text-neutro-500 font-medium">Asistentes estimados</dt>
                  <dd className="font-semibold text-neutro-900">{reserva.numero_invitados} invitados</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="size-4 text-neutro-400 mt-0.5" />
                <div>
                  <dt className="text-xs text-neutro-500 font-medium">Salón asignado</dt>
                  <dd className="font-semibold text-neutro-900">{reserva.Salon?.nombre ?? 'Salón'}</dd>
                </div>
              </div>
            </dl>
          </Card>

          {/* Servicios adicionales */}
          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-neutro-900 mb-3">
              Servicios Adicionales Solicitados
            </h2>
            {servicios.length === 0 ? (
              <p className="text-xs text-neutro-500">
                La cotización no cuenta con servicios adicionales agregados.
              </p>
            ) : (
              <div className="divide-y divide-neutro-100 overflow-hidden rounded-lg border border-neutro-200">
                {servicios.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3.5 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-neutro-900">
                        {item.ServicioEvento?.nombre ?? 'Servicio'}
                      </span>
                      <span className="text-xs text-neutro-500">
                        {item.cantidad} x {formatearGTQ(item.ServicioEvento?.precio)}
                      </span>
                    </div>
                    <span className="font-semibold text-neutro-900">
                      {formatearGTQ(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Totales Financieros */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-4 border-neutro-200">
            <h3 className="font-serif text-lg font-bold text-neutro-900">
              Desglose Económico
            </h3>
            <dl className="flex flex-col gap-3 text-sm border-t border-b border-neutro-100 py-4">
              <div className="flex justify-between text-xs text-neutro-600">
                <dt>Tarifa base del salón</dt>
                <dd className="font-medium text-neutro-800">
                  {formatearGTQ(reserva.Salon?.tarifa_base)}
                </dd>
              </div>

              {servicios.length > 0 && (
                <div className="flex justify-between text-xs text-neutro-600">
                  <dt>Servicios extra</dt>
                  <dd className="font-medium text-neutro-800">
                    {formatearGTQ(
                      servicios.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0)
                    )}
                  </dd>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-neutro-900 pt-2 border-t border-neutro-100">
                <dt>Total presupuestado</dt>
                <dd className="text-bronce-700">{formatearGTQ(reserva.total)}</dd>
              </div>

              <div className="flex justify-between text-xs font-semibold text-selva-800 bg-selva-50 p-2.5 rounded-lg border border-selva-200">
                <dt>Anticipo reglamentario</dt>
                <dd>{formatearGTQ(reserva.anticipo)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      {modalEstadoAbierto && (
        <AdminReservaEventoEstadoModal
          reserva={reserva}
          isOpen={modalEstadoAbierto}
          onClose={() => setModalEstadoAbierto(false)}
        />
      )}
    </section>
  );
};
