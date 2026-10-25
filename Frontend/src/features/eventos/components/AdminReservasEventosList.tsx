import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Users,
  Search,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAdminReservasEventosQuery } from '../hooks/useEventos';
import { AdminReservaEventoEstadoModal } from './AdminReservaEventoEstadoModal';
import {
  textosEventos,
  etiquetasTipoEvento,
  etiquetasEstadoReserva,
  formatearGTQ,
} from '../textos';
import type { ReservaEvento } from '../types';
import { getApiErrorMessage } from '@/api/errors';

export const AdminReservasEventosList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [reservaParaCambioEstado, setReservaParaCambioEstado] = useState<ReservaEvento | null>(null);

  const reservasQuery = useAdminReservasEventosQuery();
  const reservas = reservasQuery.data ?? [];

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
      const matchFecha = !filtroFecha || r.fecha === filtroFecha;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        (r.Usuario?.nombre ?? '').toLowerCase().includes(term) ||
        (r.Usuario?.email ?? '').toLowerCase().includes(term) ||
        (r.Salon?.nombre ?? '').toLowerCase().includes(term) ||
        String(r.id).includes(term);

      return matchEstado && matchFecha && matchSearch;
    });
  }, [reservas, filtroEstado, filtroFecha, searchTerm]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Retorno */}
      <Link
        to="/admin/servicios"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors w-fit"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Volver a servicios</span>
      </Link>

      {/* Encabezado */}
      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">{textosEventos.adminReservasEyebrow}</p>
        <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
          {textosEventos.adminReservasTitulo}
        </h1>
        <p className="max-w-2xl text-sm text-neutro-600">
          {textosEventos.adminReservasDesc}
        </p>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-white p-4 rounded-xl border border-neutro-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-400" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={textosEventos.buscarPorCliente}
            className="w-full rounded-lg border border-neutro-300 pl-9 pr-3 py-2 text-sm text-neutro-900 placeholder-neutro-400 focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
          />
        </div>

        <div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
          >
            <option value="todos">{textosEventos.todosLosEstados}</option>
            <option value="cotizacion">Cotización</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
          />
        </div>
      </div>

      {/* Estados */}
      {reservasQuery.isPending && (
        <div className="flex justify-center py-16">
          <LoadingNotice label="Cargando reservas de eventos..." />
        </div>
      )}

      {reservasQuery.isError && (
        <Card className="p-6">
          <Alert tone="error" title="Error al listar reservas">
            {getApiErrorMessage(reservasQuery.error)}
          </Alert>
        </Card>
      )}

      {!reservasQuery.isPending && !reservasQuery.isError && (
        <>
          {reservasFiltradas.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <Building2 className="size-12 text-neutro-300 mb-3" aria-hidden="true" />
              <h2 className="text-base font-semibold text-neutro-800">
                No se encontraron reservas
              </h2>
              <p className="mt-1 text-sm text-neutro-500">
                No hay solicitudes de eventos que coincidan con los filtros aplicados.
              </p>
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
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 border border-neutro-200"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
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

                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <h2 className="text-base font-serif font-bold text-neutro-900">
                          {reserva.Salon?.nombre ?? 'Salón'}
                        </h2>
                        {reserva.Usuario?.nombre && (
                          <span className="text-xs text-neutro-600">
                            — Cliente: <strong className="font-semibold text-neutro-800">{reserva.Usuario.nombre}</strong> ({reserva.Usuario.email})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutro-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-neutro-400" aria-hidden="true" />
                          {reserva.fecha}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-neutro-400" aria-hidden="true" />
                          {reserva.hora_inicio} - {reserva.hora_fin}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="size-3.5 text-neutro-400" aria-hidden="true" />
                          {reserva.numero_invitados} invitados
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-neutro-100">
                      <div className="flex flex-col lg:text-right">
                        <span className="text-xs text-neutro-500">Total presupuestado</span>
                        <span className="text-base font-bold text-neutro-900">
                          {formatearGTQ(reserva.total)}
                        </span>
                        <span className="text-[0.6875rem] text-selva-700 font-medium">
                          Anticipo: {formatearGTQ(reserva.anticipo)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setReservaParaCambioEstado(reserva)}
                          className="text-xs"
                        >
                          Estado
                        </Button>
                        <Link
                          to={`/admin/reservas-evento/${reserva.id}`}
                          className={buttonStyles({
                            variant: 'primary',
                            size: 'sm',
                            className: 'inline-flex items-center gap-1 text-xs',
                          })}
                        >
                          <span>Detalle</span>
                          <ChevronRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {reservaParaCambioEstado && (
        <AdminReservaEventoEstadoModal
          reserva={reservaParaCambioEstado}
          isOpen={Boolean(reservaParaCambioEstado)}
          onClose={() => setReservaParaCambioEstado(null)}
        />
      )}
    </div>
  );
};
