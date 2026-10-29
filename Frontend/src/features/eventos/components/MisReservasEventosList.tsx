import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { useMisReservasEventosQuery } from '../hooks/useEventos';
import {
  textosEventos,
  etiquetasTipoEvento,
  etiquetasEstadoReserva,
  formatearGTQ,
} from '../textos';
import { getApiErrorMessage } from '@/api/errors';
import { MisReservasLayout } from '@/features/mis-reservas/components/MisReservasLayout';
import { cn } from '@/lib/cn';

const estadoCardClass = (tone: string) => {
  if (tone === 'success') return 'border-exito-600/20 bg-exito-50 text-exito-700';
  if (tone === 'warning') return 'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700';
  if (tone === 'error') return 'border-error-600/20 bg-error-50 text-error-700';
  return 'border-neutro-200 bg-neutro-100 text-neutro-600';
};

export const MisReservasEventosList: React.FC = () => {
  const { user } = useAuth();
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const reservasQuery = useMisReservasEventosQuery(user?.id);
  const reservas = reservasQuery.data ?? [];

  const reservasFiltradas = useMemo(() => {
    if (filtroEstado === 'todos') return reservas;
    return reservas.filter((r) => r.estado === filtroEstado);
  }, [reservas, filtroEstado]);

  return (
    <MisReservasLayout>
      <div className="flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-serif font-semibold text-neutro-900 sm:text-2xl">
              {textosEventos.pestanaEventos}
            </h1>
            {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
              <p className="text-xs text-neutro-500">
                {reservas.length === 1 ? "1 reserva" : `${reservas.length} reservas`}
              </p>
            )}
          </div>
          <Link
            to="/eventos"
            className={buttonStyles({
              variant: 'primary',
              size: 'sm',
              className: 'self-start sm:self-center',
            })}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>{textosEventos.nuevaCotizacion}</span>
          </Link>
        </div>

        {/* Filtro de estado — compacto, sin scroll horizontal */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filtroEstado === 'todos'
                  ? 'bg-neutro-900 text-white'
                  : 'bg-neutro-100 text-neutro-600 hover:bg-neutro-200',
              )}
            >
              Todos ({reservas.length})
            </button>
            {(['cotizacion', 'confirmada', 'cancelada', 'finalizada'] as const).map((est) => {
              const count = reservas.filter((r) => r.estado === est).length;
              if (count === 0) return null;
              return (
                <button
                  key={est}
                  type="button"
                  onClick={() => setFiltroEstado(est)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    filtroEstado === est
                      ? 'bg-neutro-900 text-white'
                      : 'bg-neutro-100 text-neutro-600 hover:bg-neutro-200',
                  )}
                >
                  {etiquetasEstadoReserva[est].label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Cargando */}
        {reservasQuery.isPending && (
          <div className="flex justify-center py-12">
            <LoadingNotice label="Cargando sus eventos y cotizaciones…" />
          </div>
        )}

        {/* Error */}
        {reservasQuery.isError && (
          <Card className="p-6">
            <Alert tone="error" title="No fue posible cargar sus reservas de eventos">
              {getApiErrorMessage(reservasQuery.error)}
            </Alert>
          </Card>
        )}

        {/* Estado vacío */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservasFiltradas.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Building2 className="size-10 text-neutro-300" aria-hidden="true" />
            <div className="flex max-w-sm flex-col gap-1">
              <h2 className="text-base font-serif font-semibold text-neutro-800">
                {textosEventos.sinReservasTitulo}
              </h2>
              <p className="text-xs text-neutro-500 max-w-xs mx-auto">
                {textosEventos.sinReservasMensaje}
              </p>
            </div>
            <Link
              to="/eventos"
              className={buttonStyles({ variant: 'primary', size: 'sm' })}
            >
              {textosEventos.nuevaCotizacion}
            </Link>
          </Card>
        )}

        {/* Listado — tarjetas horizontales para eventos (más datos por ítem) */}
        {!reservasQuery.isPending && !reservasQuery.isError && reservasFiltradas.length > 0 && (
          <div className="flex flex-col gap-3">
            {reservasFiltradas.map((reserva) => {
              const estado = etiquetasEstadoReserva[reserva.estado] ?? {
                label: reserva.estado,
                tone: 'neutral',
              };
              return (
                <article
                  key={reserva.id}
                  className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 transition-shadow hover:shadow-md"
                >
                  {/* Info principal */}
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-neutro-400">
                        #{reserva.id}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
                          estadoCardClass(estado.tone),
                        )}
                      >
                        {estado.label}
                      </span>
                      <span className="rounded-full bg-neutro-100 px-2.5 py-0.5 text-xs font-semibold text-neutro-700">
                        {etiquetasTipoEvento[reserva.tipo_evento] ?? reserva.tipo_evento}
                      </span>
                    </div>

                    <h2 className="text-sm font-serif font-bold text-neutro-900">
                      {reserva.Salon?.nombre ?? 'Salón de Eventos'}
                    </h2>

                    <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutro-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3.5 text-neutro-400" aria-hidden="true" />
                        <dt className="sr-only">Fecha</dt>
                        <dd>{reserva.fecha}</dd>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3.5 text-neutro-400" aria-hidden="true" />
                        <dt className="sr-only">Hora</dt>
                        <dd>
                          {reserva.hora_inicio} – {reserva.hora_fin}
                        </dd>
                      </div>
                      <dd>{reserva.numero_invitados} invitados</dd>
                    </dl>
                  </div>

                  {/* Importes + acción */}
                  <div className="flex items-center justify-between gap-4 border-t border-neutro-100 pt-3 sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end sm:shrink-0">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs text-neutro-400">Total presupuestado</span>
                      <span className="text-sm font-bold text-neutro-900">
                        {formatearGTQ(reserva.total)}
                      </span>
                      <span className="text-[0.6875rem] font-medium text-selva-700">
                        Anticipo: {formatearGTQ(reserva.anticipo)}
                      </span>
                    </div>
                    <Link
                      to={`/mis-reservas/eventos/${reserva.id}`}
                      className={buttonStyles({
                        variant: 'secondary',
                        size: 'sm',
                        className: 'inline-flex items-center gap-1',
                      })}
                    >
                      <span>{textosEventos.verDetalle}</span>
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </Link>
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
