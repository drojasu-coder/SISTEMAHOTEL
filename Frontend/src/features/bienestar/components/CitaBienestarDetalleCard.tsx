import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Sparkles,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useMiCitaSpaQuery } from '../hooks/useBienestar';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { textosBienestar, formatearGTQ } from '../textos';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';
import { ApiError } from '@/api/client/http';

interface CitaBienestarDetalleCardProps {
  id: number;
}

export const CitaBienestarDetalleCard: React.FC<CitaBienestarDetalleCardProps> = ({ id }) => {
  const { user } = useAuth();
  const citaQuery = useMiCitaSpaQuery(id, user?.id);

  const cita = citaQuery.data;

  // Validación de identificador
  if (!Number.isInteger(id) || id <= 0) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">Identificador no válido</h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            El número de cita solicitado no es válido en el sistema.
          </p>
          <Link
            to={BIENESTAR_ROUTES.MIS_RESERVAS}
            className="inline-flex items-center gap-2 rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{textosBienestar.volverAMisCitas}</span>
          </Link>
        </Card>
      </section>
    );
  }

  // Estado: Cargando
  if (citaQuery.isPending) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-neutro-200" />
        <Card className="p-8 space-y-6">
          <div className="h-8 w-2/3 animate-pulse rounded bg-neutro-200" />
          <div className="space-y-3">
            <div className="h-5 w-1/2 animate-pulse rounded bg-neutro-200" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-neutro-200" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-neutro-200" />
          </div>
        </Card>
      </section>
    );
  }

  // Estado: Error 403 / 404 / General
  if (citaQuery.isError) {
    const error = citaQuery.error;
    const isForbidden = error instanceof ApiError && (error.status === 403 || error.code === 'FORBIDDEN');
    const isNotFound = error instanceof ApiError && (error.status === 404 || error.code === 'APPOINTMENT_NOT_FOUND');

    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          {isForbidden ? (
            <ShieldAlert className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          )}
          <h2 className="text-lg font-semibold text-neutro-900 mb-2">
            {isForbidden
              ? 'Acceso denegado'
              : isNotFound
              ? textosBienestar.citaNoEncontrada
              : textosBienestar.errorCargarDetalle}
          </h2>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            {isForbidden
              ? 'No tiene permisos para acceder a esta cita de spa porque pertenece a otro huésped.'
              : isNotFound
              ? textosBienestar.citaNoEncontradaDesc
              : 'Ocurrió un error al cargar los datos de la cita. Por favor verifique su conexión e intente nuevamente.'}
          </p>
          <div className="flex gap-4">
            {!isForbidden && !isNotFound && (
              <Button type="button" variant="primary" onClick={() => citaQuery.refetch()}>
                {textosBienestar.reintentar}
              </Button>
            )}
            <Link
              to={BIENESTAR_ROUTES.MIS_RESERVAS}
              className="inline-flex items-center gap-2 rounded-md border border-neutro-300 bg-white px-4 py-2 text-sm font-medium text-neutro-700 shadow-sm hover:bg-neutro-50 transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>{textosBienestar.volverAMisCitas}</span>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  if (!cita) return null;

  const estadoClases =
    cita.estado === 'confirmada'
      ? 'bg-selva-100 text-selva-800'
      : cita.estado === 'cancelada'
      ? 'bg-rojo-100 text-rojo-800'
      : 'bg-neutro-100 text-neutro-800';

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Enlace de retorno */}
      <Link
        to={BIENESTAR_ROUTES.MIS_RESERVAS}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{textosBienestar.volverAMisCitas}</span>
      </Link>

      <Card className="flex flex-col gap-6 p-6 sm:p-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutro-200 pb-6">
          <div>
            <p className="eyebrow">{textosBienestar.detalleSubtitulo}</p>
            <h1 className="font-serif text-2xl font-bold text-neutro-900 mt-1">
              {textosBienestar.citaNumero(cita.id ?? '')}
            </h1>
            <p className="text-sm text-neutro-600 mt-0.5">
              {cita.ServicioBienestar?.nombre ?? 'Tratamiento de spa'}
            </p>
          </div>
          <span
            className={`self-start sm:self-center inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase ${estadoClases}`}
          >
            {cita.estado}
          </span>
        </div>

        {/* Datos de la cita */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.servicioContratado}
              </p>
              <div className="flex items-center gap-2 text-neutro-900 font-medium">
                <Sparkles className="size-4 text-selva-600" />
                <span>{cita.ServicioBienestar?.nombre ?? textosBienestar.noDisponible}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.duracionServicio}
              </p>
              <div className="flex items-center gap-2 text-neutro-900">
                <Clock className="size-4 text-neutro-400" />
                <span>
                  {cita.ServicioBienestar?.duracion_minutos ?? '--'} {textosBienestar.minutos}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.terapeutaAsignado}
              </p>
              <div className="flex items-center gap-2 text-neutro-900">
                <User className="size-4 text-neutro-400" />
                <span>{cita.Terapeuta?.nombre ?? 'Terapeuta asignado'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.fechaCita}
              </p>
              <div className="flex items-center gap-2 text-neutro-900">
                <Calendar className="size-4 text-neutro-400" />
                <span>{cita.fecha}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutro-500 uppercase tracking-wider mb-1">
                {textosBienestar.horarioCita}
              </p>
              <div className="flex items-center gap-2 text-neutro-900">
                <Clock className="size-4 text-neutro-400" />
                <span>
                  {cita.hora_inicio} a {cita.hora_fin}
                </span>
              </div>
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
        </div>

        {/* Botón de pago / carrito */}
        <div className="border-t border-neutro-200 pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-xs text-neutro-500 max-w-sm">
            Las citas confirmadas pueden añadirse al carrito para abonarse de forma segura mediante pasarela o métodos autorizados.
          </p>

          <div className="w-full sm:w-auto">
            {cita.id && (
              <BotonAnadirAlCarrito
                reservaId={cita.id}
                reservaEstado={cita.estado ?? 'confirmada'}
                tipo_item="bienestar"
                variant="primary"
                size="md"
              />
            )}
          </div>
        </div>
      </Card>
    </section>
  );
};
