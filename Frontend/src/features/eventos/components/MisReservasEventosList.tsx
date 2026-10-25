import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Compass,
  Heart,
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
import { RESERVAS_ROUTES } from '@/features/reservas';
import { RESTAURANTE_ROUTES } from '@/features/restaurante';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { ACTIVIDADES_ROUTES } from '@/features/actividades';
import { BIENESTAR_ROUTES } from '@/features/bienestar';
import { EVENTOS_ROUTES } from '../constants/routes';
import { getApiErrorMessage } from '@/api/errors';

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
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Pestañas de navegación de Mis Reservas */}
      <div className="flex border-b border-neutro-200 overflow-x-auto">
        <Link
          to={RESERVAS_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <BedDouble className="size-4" aria-hidden="true" />
          <span>{textosEventos.pestanaHabitaciones}</span>
        </Link>
        <Link
          to={RESTAURANTE_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <UtensilsCrossed className="size-4" aria-hidden="true" />
          <span>{textosEventos.pestanaRestaurante}</span>
        </Link>
        <Link
          to={AMENIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          <span>{textosEventos.pestanaAmenidades}</span>
        </Link>
        <Link
          to={ACTIVIDADES_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Compass className="size-4" aria-hidden="true" />
          <span>{textosEventos.pestanaActividades}</span>
        </Link>
        <Link
          to={BIENESTAR_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-neutro-600 hover:border-neutro-300 hover:text-neutro-900 transition-colors whitespace-nowrap"
        >
          <Heart className="size-4" aria-hidden="true" />
          <span>{textosEventos.pestanaBienestar}</span>
        </Link>
        <Link
          to={EVENTOS_ROUTES.MIS_RESERVAS}
          className="flex items-center gap-2 border-b-2 border-bronce-600 px-4 py-3 text-sm font-semibold text-bronce-700 whitespace-nowrap"
          aria-current="page"
        >
          <Building2 className="size-4" aria-hidden="true" />
          <span>{textosEventos.pestanaEventos}</span>
        </Link>
      </div>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosEventos.misReservasEyebrow}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {textosEventos.misReservasTitulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosEventos.misReservasDescripcion}
          </p>
        </div>

        <Link
          to="/eventos"
          className={buttonStyles({
            variant: 'primary',
            className: 'inline-flex items-center gap-2 self-start sm:self-center',
          })}
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>{textosEventos.nuevaCotizacion}</span>
        </Link>
      </div>

      {/* Filtro de Estado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFiltroEstado('todos')}
          className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
            filtroEstado === 'todos'
              ? 'bg-neutro-900 text-white'
              : 'bg-neutro-100 text-neutro-600 hover:bg-neutro-200'
          }`}
        >
          Todos ({reservas.length})
        </button>
        {(['cotizacion', 'confirmada', 'cancelada', 'finalizada'] as const).map((est) => {
          const count = reservas.filter((r) => r.estado === est).length;
          return (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                filtroEstado === est
                  ? 'bg-neutro-900 text-white'
                  : 'bg-neutro-100 text-neutro-600 hover:bg-neutro-200'
              }`}
            >
              {etiquetasEstadoReserva[est].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Estados */}
      {reservasQuery.isPending && (
        <div className="flex justify-center py-16">
          <LoadingNotice label="Cargando sus eventos y cotizaciones..." />
        </div>
      )}

      {reservasQuery.isError && (
        <Card className="p-6">
          <Alert tone="error" title="No fue posible cargar sus reservas de eventos">
            {getApiErrorMessage(reservasQuery.error)}
          </Alert>
        </Card>
      )}

      {!reservasQuery.isPending && !reservasQuery.isError && (
        <>
          {reservasFiltradas.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <Building2 className="size-12 text-neutro-300 mb-3" aria-hidden="true" />
              <h2 className="text-lg font-serif font-semibold text-neutro-800">
                {textosEventos.sinReservasTitulo}
              </h2>
              <p className="mt-1 text-sm text-neutro-500 max-w-md">
                {textosEventos.sinReservasMensaje}
              </p>
              <div className="mt-6">
                <Link
                  to="/eventos"
                  className={buttonStyles({ variant: 'primary', size: 'sm' })}
                >
                  {textosEventos.nuevaCotizacion}
                </Link>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {reservasFiltradas.map((reserva) => {
                const estado = etiquetasEstadoReserva[reserva.estado] ?? {
                  label: reserva.estado,
                  tone: 'neutral',
                };
                return (
                  <Card
                    key={reserva.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border border-neutro-200 transition-all hover:border-selva-300"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-neutro-500">
                          #{reserva.id}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                            estado.tone === 'success'
                              ? 'bg-selva-100 text-selva-800'
                              : estado.tone === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : estado.tone === 'error'
                              ? 'bg-rojo-100 text-rojo-800'
                              : 'bg-neutro-100 text-neutro-800'
                          }`}
                        >
                          {estado.label}
                        </span>
                        <span className="text-xs font-semibold text-neutro-700 bg-neutro-100 px-2.5 py-0.5 rounded-full">
                          {etiquetasTipoEvento[reserva.tipo_evento] ?? reserva.tipo_evento}
                        </span>
                      </div>

                      <h2 className="text-base font-serif font-bold text-neutro-900">
                        {reserva.Salon?.nombre ?? 'Salón de Eventos'}
                      </h2>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutro-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-neutro-400" aria-hidden="true" />
                          {reserva.fecha}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-neutro-400" aria-hidden="true" />
                          {reserva.hora_inicio} - {reserva.hora_fin}
                        </span>
                        <span>{reserva.numero_invitados} invitados</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutro-100">
                      <div className="flex flex-col sm:text-right">
                        <span className="text-xs text-neutro-500">Total presupuestado</span>
                        <span className="text-base font-bold text-neutro-900">
                          {formatearGTQ(reserva.total)}
                        </span>
                        <span className="text-[0.6875rem] text-selva-700 font-medium">
                          Anticipo: {formatearGTQ(reserva.anticipo)}
                        </span>
                      </div>

                      <Link
                        to={`/mis-reservas/eventos/${reserva.id}`}
                        className={buttonStyles({
                          variant: 'secondary',
                          size: 'sm',
                          className: 'inline-flex items-center gap-1 text-xs',
                        })}
                      >
                        <span>{textosEventos.verDetalle}</span>
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};
