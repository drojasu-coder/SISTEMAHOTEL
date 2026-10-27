import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Sparkles,
  Edit,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAdminCitaSpaQuery } from '../hooks/useBienestar';
import { AdminCitaEstadoModal } from './AdminCitaEstadoModal';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { textosBienestar, formatearGTQ } from '../textos';

interface AdminDetalleCitaCardProps {
  id: number;
}

export const AdminDetalleCitaCard: React.FC<AdminDetalleCitaCardProps> = ({ id }) => {
  const citaQuery = useAdminCitaSpaQuery(id);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cita = citaQuery.data;

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-12">
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">Identificador no válido</h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            El identificador de cita proporcionado no es válido.
          </p>
          <Link
            to={BIENESTAR_ROUTES.ADMIN_CITAS}
            className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Volver al listado de citas</span>
          </Link>
        </Card>
      </div>
    );
  }

  if (citaQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-12" aria-busy="true">
        <div className="h-6 w-36 animate-pulse rounded bg-neutro-200" />
        <Card className="p-8 space-y-4">
          <div className="h-8 w-1/2 animate-pulse rounded bg-neutro-200" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-neutro-200" />
        </Card>
      </div>
    );
  }

  if (citaQuery.isError || !cita) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-12">
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            Cita de spa no encontrada
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            No fue posible localizar la cita solicitada en la base de datos.
          </p>
          <Link
            to={BIENESTAR_ROUTES.ADMIN_CITAS}
            className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Volver a citas de spa</span>
          </Link>
        </Card>
      </div>
    );
  }

  const estadoClases =
    cita.estado === 'confirmada'
      ? 'bg-selva-100 text-selva-800'
      : cita.estado === 'cancelada'
      ? 'bg-rojo-100 text-rojo-800'
      : 'bg-neutro-100 text-neutro-800';

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-12">
      <Link
        to={BIENESTAR_ROUTES.ADMIN_CITAS}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Volver a citas de spa</span>
      </Link>

      <Card className="p-6 sm:p-8 space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutro-200 pb-6">
          <div>
            <p className="eyebrow">{textosBienestar.adminCitasSubtitulo}</p>
            <h1 className="font-serif text-2xl font-bold text-neutro-900 mt-1">
              {textosBienestar.citaNumero(cita.id ?? '')}
            </h1>
            <p className="text-sm text-neutro-600">
              {cita.ServicioBienestar?.nombre ?? 'Tratamiento de spa'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${estadoClases}`}
            >
              {cita.estado}
            </span>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-1.5 text-xs"
            >
              <Edit className="size-3.5" aria-hidden="true" />
              <span>{textosBienestar.cambiarEstado}</span>
            </Button>
          </div>
        </div>

        {/* Grilla de Datos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          {/* Columna Izquierda: Huésped y Servicio */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                Información del Huésped
              </p>
              <div className="flex items-center gap-2 text-neutro-900 font-medium">
                <User className="size-4 text-neutro-400" />
                <span>{cita.Usuario?.nombre ?? 'Cliente no registrado'}</span>
              </div>
              {cita.Usuario?.email && (
                <div className="flex items-center gap-2 text-neutro-600 text-xs mt-1">
                  <Mail className="size-3.5 text-neutro-400" />
                  <span>{cita.Usuario.email}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.servicioContratado}
              </p>
              <div className="flex items-center gap-2 text-neutro-900 font-medium">
                <Sparkles className="size-4 text-selva-600" />
                <span>{cita.ServicioBienestar?.nombre ?? textosBienestar.noDisponible}</span>
              </div>
              <p className="text-xs text-neutro-500 mt-0.5">
                Duración: {cita.ServicioBienestar?.duracion_minutos ?? '--'} {textosBienestar.minutos}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.tarifaServicio}
              </p>
              <span className="text-xl font-bold font-serif text-bronce-700">
                {formatearGTQ(cita.ServicioBienestar?.precio)}
              </span>
            </div>
          </div>

          {/* Columna Derecha: Programación y Terapeuta */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.terapeutaAsignado}
              </p>
              <div className="flex items-center gap-2 text-neutro-900 font-medium">
                <User className="size-4 text-neutro-400" />
                <span>{cita.Terapeuta?.nombre ?? 'Terapeuta asignado'}</span>
              </div>
              <span className="inline-block mt-1 text-xs text-neutro-500">
                Estado: {cita.Terapeuta?.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.fechaCita}
              </p>
              <div className="flex items-center gap-2 text-neutro-900 font-medium">
                <Calendar className="size-4 text-neutro-400" />
                <span>{cita.fecha}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.horarioCita}
              </p>
              <div className="flex items-center gap-2 text-neutro-900 font-medium">
                <Clock className="size-4 text-neutro-400" />
                <span>{cita.hora_inicio} a {cita.hora_fin}</span>
              </div>
              <p className="text-[0.6875rem] text-neutro-500 mt-1 italic">
                Regla operativa: intervalo reglamentario de 15 minutos de descanso post-sesión verificado por el backend.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal Cambio de Estado */}
      {modalAbierto && (
        <AdminCitaEstadoModal
          cita={cita}
          onClose={() => setModalAbierto(false)}
          onSuccess={() => citaQuery.refetch()}
        />
      )}
    </div>
  );
};
