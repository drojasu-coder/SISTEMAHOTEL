import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Plus,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { useMisReservasActividadQuery } from '../hooks/useReservasActividad';
import { ACTIVIDADES_ROUTES } from '../constants/routes';
import { textosActividades, formatearGTQ } from '../textos';
import { MisReservasLayout } from '@/features/mis-reservas/components/MisReservasLayout';
import { BotonAnadirAlCarrito } from '@/features/carrito/components/BotonAnadirAlCarrito';
import { cn } from '@/lib/cn';

const estadoBadgeClass = (estado: string) => {
  if (estado === 'confirmada') return 'border-exito-600/20 bg-exito-50 text-exito-700';
  if (estado === 'completada') return 'border-info-600/20 bg-info-50 text-info-700';
  return 'border-neutro-200 bg-neutro-100 text-neutro-600';
};

export const MisReservasActividadesList: React.FC = () => {
  const { user } = useAuth();
  const reservasQuery = useMisReservasActividadQuery(user?.id);
  const reservas = reservasQuery.data ?? [];

  return (
    <MisReservasLayout>
      <div className="flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-serif font-semibold text-neutro-900 sm:text-2xl">
              {textosActividades.pestanaActividades}
            </h1>
            {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
              <p className="text-xs text-neutro-500">
                {reservas.length === 1 ? "1 reserva" : `${reservas.length} reservas`}
              </p>
            )}
          </div>
          <Link
            to={ACTIVIDADES_ROUTES.CATALOGO}
            className="inline-flex items-center gap-2 self-start rounded-md bg-bronce-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-bronce-700 transition-colors sm:self-center"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{textosActividades.reservarActividad}</span>
          </Link>
        </div>

        {/* Cargando */}
        {reservasQuery.isPending && (
          <div className="flex justify-center py-12">
            <LoadingNotice label="Cargando sus actividades…" />
          </div>
        )}

        {/* Error */}
        {reservasQuery.isError && (
          <Card className="flex flex-col items-center justify-center p-10 text-center">
            <AlertCircle className="size-10 text-error-500 mb-3" aria-hidden="true" />
            <h2 className="text-base font-semibold text-neutro-900 mb-2">
              {textosActividades.errorCargarReservas}
            </h2>
            <Button type="button" variant="primary" size="sm" onClick={() => reservasQuery.refetch()}>
              {textosActividades.reintentar}
            </Button>
          </Card>
        )}

        {/* Estado vacío */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Compass className="size-10 text-neutro-300" aria-hidden="true" />
            <div className="flex max-w-sm flex-col gap-1">
              <h2 className="text-base font-serif font-semibold text-neutro-800">
                {textosActividades.sinReservasTitulo}
              </h2>
              <p className="text-xs text-neutro-500">{textosActividades.sinReservasDesc}</p>
            </div>
            <Link
              to={ACTIVIDADES_ROUTES.CATALOGO}
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
            >
              {textosActividades.reservarActividad}
            </Link>
          </Card>
        )}

        {/* Listado */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reservas.map((reserva) => {
              const estadoClave = reserva.estado || 'confirmada';
              const estadoTexto = textosActividades.estados[estadoClave] || estadoClave;

              return (
                <article
                  key={reserva.id}
                  className="surface flex flex-col gap-3 p-4 transition-shadow hover:shadow-md"
                >
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-bronce-700">
                        Reserva #{reserva.id}
                      </p>
                      <h2 className="truncate text-sm font-semibold text-neutro-900">
                        {reserva.RecursoActividad?.nombre || `Actividad #${reserva.recurso_id}`}
                      </h2>
                      {reserva.RecursoActividad?.tipo && (
                        <p className="text-xs uppercase tracking-wide text-neutro-400">
                          {reserva.RecursoActividad.tipo}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        estadoBadgeClass(estadoClave),
                      )}
                    >
                      {estadoTexto}
                    </span>
                  </div>

                  {/* Detalles compactos */}
                  <dl className="flex flex-col gap-1.5 text-xs text-neutro-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                      <dt className="sr-only">Fecha</dt>
                      <dd>{reserva.fecha}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                      <dt className="sr-only">Hora</dt>
                      <dd>
                        {reserva.hora_inicio?.slice(0, 5)} – {reserva.hora_fin?.slice(0, 5)}
                      </dd>
                    </div>
                    {reserva.RecursoActividad?.Sucursal?.nombre && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                        <dt className="sr-only">Sede</dt>
                        <dd className="truncate">{reserva.RecursoActividad.Sucursal.nombre}</dd>
                      </div>
                    )}
                    {reserva.Instructor ? (
                      <div className="flex items-center gap-1.5">
                        <User className="size-3.5 shrink-0 text-neutro-400" aria-hidden="true" />
                        <dt className="sr-only">Instructor</dt>
                        <dd className="truncate">
                          {reserva.Instructor.nombre}
                          {reserva.Instructor.especialidad
                            ? ` (${reserva.Instructor.especialidad})`
                            : ''}
                        </dd>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-neutro-400">
                        <User className="size-3.5 shrink-0" aria-hidden="true" />
                        <dd>{textosActividades.sinInstructor}</dd>
                      </div>
                    )}
                    {reserva.con_equipo && (
                      <p className="text-[0.6875rem] font-medium text-bronce-700">
                        ✓ {textosActividades.conEquipo}
                      </p>
                    )}
                  </dl>

                  {/* Pie: importe + acciones */}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutro-100 pt-3">
                    <span className="text-sm font-semibold text-neutro-900">
                      {formatearGTQ(reserva.total)}
                    </span>
                    <div className="flex items-center gap-2">
                      {estadoClave === 'confirmada' && (
                        <BotonAnadirAlCarrito
                          reservaId={reserva.id!}
                          reservaEstado={reserva.estado || 'confirmada'}
                          tipo_item="actividad"
                          size="sm"
                        />
                      )}
                      <Link
                        to={ACTIVIDADES_ROUTES.DETALLE_RESERVA(reserva.id!)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-bronce-700 hover:text-bronce-900 transition-colors"
                      >
                        <span>Ver</span>
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </MisReservasLayout>
  );
};
