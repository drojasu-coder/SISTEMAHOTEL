import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  User,
  ArrowLeft,
  AlertCircle,
  Trophy,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';

import { useAuth } from '@/features/auth/AuthContext';
import { useMiReservaActividadQuery } from '../hooks/useReservasActividad';
import { ACTIVIDADES_ROUTES } from '../constants/routes';
import { textosActividades, formatearGTQ } from '../textos';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';

export const DetalleReservaActividad: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const reservaId = Number(id);

  const { user } = useAuth();
  const reservaQuery = useMiReservaActividadQuery(reservaId, user?.id);
  const reserva = reservaQuery.data;

  if (reservaQuery.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12" aria-busy="true">
        <Card className="p-8 space-y-6">
          <div className="h-8 w-1/3 animate-pulse rounded bg-neutro-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutro-200" />
          <div className="h-24 w-full animate-pulse rounded bg-neutro-200" />
        </Card>
      </div>
    );
  }

  if (reservaQuery.isError || !reserva) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="flex flex-col items-center justify-center p-12 text-center border-rojo-200 bg-rojo-50">
          <AlertCircle className="size-12 text-rojo-500 mb-4" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-neutro-900 mb-2">
            No fue posible cargar el detalle de la actividad
          </h1>
          <p className="text-sm text-neutro-600 max-w-md mb-6">
            La reserva solicitada no existe, no pertenece a su cuenta o se produjo un inconveniente al consultar los datos.
          </p>
          <div className="flex gap-4">
            <Button type="button" variant="primary" onClick={() => reservaQuery.refetch()}>
              {textosActividades.reintentar}
            </Button>
            <Link
              to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
              className={buttonStyles({ variant: 'secondary' })}
            >
              {textosActividades.volverMisReservas}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const estadoClave = reserva.estado || 'confirmada';
  const estadoTexto = textosActividades.estados[estadoClave] || estadoClave;

  const estadoBadgeColor =
    estadoClave === 'confirmada'
      ? 'bg-verde-100 text-verde-800'
      : estadoClave === 'completada'
        ? 'bg-azul-100 text-azul-800'
        : 'bg-neutro-100 text-neutro-800';

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <Link
          to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-bronce-700 hover:text-bronce-800 mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{textosActividades.volverMisReservas}</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="eyebrow">{textosActividades.detalleSubtitulo}</p>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-neutro-900">
              {textosActividades.detalleTitulo(reserva.id!)}
            </h1>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-center ${estadoBadgeColor}`}
          >
            {estadoTexto}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel principal */}
        <Card className="p-6 md:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2 flex items-center gap-2">
              <Trophy className="size-4 text-bronce-600" aria-hidden="true" />
              <span>{textosActividades.informacionGeneral}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-neutro-500 block">{textosActividades.recurso}:</span>
                <span className="font-medium text-neutro-900">
                  {reserva.RecursoActividad?.nombre || `Recurso #${reserva.recurso_id}`}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutro-500 block">{textosActividades.tipoActividad}:</span>
                <span className="font-medium text-neutro-900 uppercase text-xs tracking-wider">
                  {reserva.RecursoActividad?.tipo || 'General'}
                </span>
              </div>

              {reserva.RecursoActividad?.Sucursal?.nombre && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-neutro-500 block">{textosActividades.sedeUbicacion}:</span>
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

          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2 flex items-center gap-2">
              <Calendar className="size-4 text-bronce-600" aria-hidden="true" />
              <span>{textosActividades.fechaYHorario}</span>
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
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2 flex items-center gap-2">
              <User className="size-4 text-bronce-600" aria-hidden="true" />
              <span>Servicios adicionales</span>
            </h2>

            <div className="space-y-2 text-sm text-neutro-800">
              <div className="flex justify-between py-1 border-b border-neutro-50">
                <span className="text-neutro-500">Instructor:</span>
                <span className="font-medium">
                  {reserva.Instructor ? (
                    `${reserva.Instructor.nombre} ${reserva.Instructor.especialidad ? `(${reserva.Instructor.especialidad})` : ''}`
                  ) : (
                    <span className="text-neutro-400 font-normal">{textosActividades.sinInstructor}</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-neutro-500">Equipamiento deportivo:</span>
                <span className="font-medium">
                  {reserva.con_equipo ? (
                    <span className="text-verde-700">✓ {textosActividades.conEquipo}</span>
                  ) : (
                    <span className="text-neutro-400 font-normal">{textosActividades.sinEquipo}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Panel lateral de pago y acciones */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutro-900 border-b border-neutro-100 pb-2">
              Importe
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-neutro-500">{textosActividades.totalCalculado}:</span>
                <span className="text-2xl font-serif font-semibold text-bronce-700">
                  {formatearGTQ(reserva.total)}
                </span>
              </div>
              <p className="text-[11px] text-neutro-500 leading-tight">
                Importe definitivo calculado por el servidor para la sesión y servicios programados.
              </p>
            </div>

            {/* Acción de pago con carrito activo si la reserva está confirmada */}
            {estadoClave === 'confirmada' && (
              <div className="pt-2">
                <BotonAnadirAlCarrito
                  reservaId={reserva.id!}
                  reservaEstado={reserva.estado || 'confirmada'}
                  tipo_item="actividad"
                  variant="primary"
                  className="w-full justify-center"
                />
              </div>
            )}
          </Card>

          <Card className="p-4 bg-neutro-50 border-neutro-200 text-xs text-neutro-600 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="size-4 text-bronce-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                Conserve su número de reserva <strong>#{reserva.id}</strong> para presentarlo al momento de ingresar a las instalaciones deportivas.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
