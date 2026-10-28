import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CalendarX, ArrowLeft, Bed, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useAdminReservasQuery } from '@/features/reservas/admin/hooks/useAdminReservas';
import { AdminReservasFilters } from '@/features/reservas/admin/components/AdminReservasFilters';
import { AdminReservasList } from '@/features/reservas/admin/components/AdminReservasList';
import { useTextosAdminReservas } from '@/features/reservas/admin/textos';
import type { ReservasAdminFiltersState } from '@/features/reservas/admin/types';

export const AdminReservasPage: React.FC = () => {
  const textosAdminReservas = useTextosAdminReservas();
  const { selectedSedeId } = useAdminScope();
  // La sede del selector global se aplica en el servidor; aquí solo se filtra por búsqueda y estado.
  const reservasQuery = useAdminReservasQuery(selectedSedeId);
  const sedesQuery = useSedesQuery();

  const [filters, setFilters] = useState<ReservasAdminFiltersState>({
    search: '',
    sucursalId: selectedSedeId ?? 'all',
    estado: 'all',
  });

  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (selectedSedeId !== undefined) {
      setFilters((prev) => ({
        ...prev,
        sucursalId: selectedSedeId,
      }));
    }
  }, [selectedSedeId]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const sedes = sedesQuery.data ?? [];
  const reservas = reservasQuery.data ?? [];

  const sedesMap = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const sede of sedes) {
      mapa.set(sede.id, sede.nombre);
    }
    return mapa;
  }, [sedes]);

  const filteredReservas = useMemo(() => {
    return reservas.filter((reserva) => {
      // Filtro por término de búsqueda (ID, cliente, correo, habitación)
      const term = filters.search.trim().toLowerCase();
      if (term) {
        const idMatch = String(reserva.id).includes(term);
        const clienteMatch = reserva.Usuario?.nombre?.toLowerCase().includes(term);
        const emailMatch = reserva.Usuario?.email?.toLowerCase().includes(term);
        const habitacionMatch = reserva.Habitacion?.numero?.toLowerCase().includes(term);

        if (!idMatch && !clienteMatch && !emailMatch && !habitacionMatch) {
          return false;
        }
      }

      // Filtro por estado
      if (filters.estado !== 'all' && reserva.estado !== filters.estado) {
        return false;
      }

      return true;
    });
  }, [reservas, filters]);

  const isLoading = reservasQuery.isLoading || sedesQuery.isLoading;
  const isError = reservasQuery.isError;
  const handleRefetch = () => {
    reservasQuery.refetch();
    sedesQuery.refetch();
  };

  const counts = useMemo(() => {
    const base = reservas;
    return {
      total: base.length,
      pendiente: base.filter((r) => r.estado === 'pendiente').length,
      confirmada: base.filter((r) => r.estado === 'confirmada').length,
      finalizada: base.filter((r) => r.estado === 'finalizada').length,
      cancelada: base.filter((r) => r.estado === 'cancelada').length,
    };
  }, [reservas]);

  const totalPages = Math.max(1, Math.ceil(filteredReservas.length / pageSize));
  const paginatedReservas = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReservas.slice(start, start + pageSize);
  }, [filteredReservas, page, pageSize]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{textosAdminReservas.subtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem]">
            {textosAdminReservas.titulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {textosAdminReservas.descripcion}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <Link
            to="/admin"
            className={buttonStyles({ variant: 'ghost' })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{textosAdminReservas.volverAlPanel}</span>
          </Link>
          <Link
            to="/admin/habitaciones"
            className={buttonStyles({ variant: 'secondary' })}
          >
            <Bed className="size-4" aria-hidden="true" />
            <span>{textosAdminReservas.irAHabitaciones}</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas rápidas de estado de reservas */}
      {!isLoading && !isError && reservas.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <button
            type="button"
            onClick={() => setFilters((p) => ({ ...p, estado: 'all' }))}
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === 'all'
                ? 'border-bronce-500 bg-bronce-50/70 shadow-xs ring-1 ring-bronce-500'
                : 'border-neutro-200 bg-white hover:border-neutro-300'
            }`}
          >
            <span className="text-[11px] font-medium text-neutro-500 uppercase tracking-wider">{textosAdminReservas.tarjetas.total}</span>
            <span className="font-serif text-2xl font-bold text-neutro-900">{counts.total}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                estado: p.estado === 'pendiente' ? 'all' : 'pendiente',
              }))
            }
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === 'pendiente'
                ? 'border-advertencia-500 bg-advertencia-50 shadow-xs ring-1 ring-advertencia-500'
                : 'border-neutro-200 bg-white hover:border-neutro-300'
            }`}
          >
            <span className="text-[11px] font-medium text-advertencia-700 uppercase tracking-wider">{textosAdminReservas.tarjetas.pendientes}</span>
            <span className="font-serif text-2xl font-bold text-advertencia-800">{counts.pendiente}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                estado: p.estado === 'confirmada' ? 'all' : 'confirmada',
              }))
            }
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === 'confirmada'
                ? 'border-exito-500 bg-exito-50 shadow-xs ring-1 ring-exito-500'
                : 'border-neutro-200 bg-white hover:border-neutro-300'
            }`}
          >
            <span className="text-[11px] font-medium text-exito-700 uppercase tracking-wider">{textosAdminReservas.tarjetas.confirmadas}</span>
            <span className="font-serif text-2xl font-bold text-exito-800">{counts.confirmada}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                estado: p.estado === 'finalizada' ? 'all' : 'finalizada',
              }))
            }
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === 'finalizada'
                ? 'border-info-500 bg-info-50 shadow-xs ring-1 ring-info-500'
                : 'border-neutro-200 bg-white hover:border-neutro-300'
            }`}
          >
            <span className="text-[11px] font-medium text-info-700 uppercase tracking-wider">{textosAdminReservas.tarjetas.finalizadas}</span>
            <span className="font-serif text-2xl font-bold text-info-800">{counts.finalizada}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters((p) => ({
                ...p,
                estado: p.estado === 'cancelada' ? 'all' : 'cancelada',
              }))
            }
            className={`flex flex-col rounded-xl border p-3 text-left transition-all ${
              filters.estado === 'cancelada'
                ? 'border-error-500 bg-error-50 shadow-xs ring-1 ring-error-500'
                : 'border-neutro-200 bg-white hover:border-neutro-300'
            }`}
          >
            <span className="text-[11px] font-medium text-error-700 uppercase tracking-wider">{textosAdminReservas.tarjetas.canceladas}</span>
            <span className="font-serif text-2xl font-bold text-error-800">{counts.cancelada}</span>
          </button>
        </div>
      )}

      {/* Estados de carga y error */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingNotice label={textosAdminReservas.listado.cargando} />
        </div>
      )}

      {isError && (
        <Card className="flex flex-col items-start gap-4">
          <Alert
            tone="error"
            title={textosAdminReservas.listado.errorTitulo}
          >
            {getApiErrorMessage(reservasQuery.error) ||
              textosAdminReservas.listado.errorDescripcion}
          </Alert>
          <Button
            type="button"
            variant="ghost"
            onClick={handleRefetch}
          >
            {textosAdminReservas.listado.reintentar}
          </Button>
        </Card>
      )}

      {/* Catálogo vacío global */}
      {!isLoading && !isError && reservas.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <BedDouble className="size-12 text-neutro-400" aria-hidden="true" />
          <div className="flex max-w-md flex-col gap-1">
            <h2 className="text-lg font-serif font-semibold text-neutro-800">
              {textosAdminReservas.listado.vacioTitulo}
            </h2>
            <p className="text-xs text-neutro-600">
              {textosAdminReservas.listado.vacioDescripcion}
            </p>
          </div>
        </Card>
      )}

      {/* Catálogo con datos y filtros */}
      {!isLoading && !isError && reservas.length > 0 && (
        <div className="flex flex-col gap-6">
          <AdminReservasFilters
            filters={filters}
            onChange={setFilters}
            totalResults={filteredReservas.length}
            totalCatalog={reservas.length}
          />

          {filteredReservas.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <CalendarX className="size-10 text-neutro-400" aria-hidden="true" />
              <h3 className="text-base font-semibold text-neutro-800">
                {textosAdminReservas.listado.sinResultadosTitulo}
              </h3>
              <p className="max-w-md text-xs text-neutro-600">
                {textosAdminReservas.listado.sinResultadosDescripcion}
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              <AdminReservasList
                reservas={paginatedReservas}
                sedesPorId={sedesMap}
              />

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutro-200 pt-4 text-xs text-neutro-600">
                  <span>
                    Mostrando {(page - 1) * pageSize + 1} a{' '}
                    {Math.min(page * pageSize, filteredReservas.length)} de{' '}
                    {filteredReservas.length} reservas
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-xs"
                    >
                      <ChevronLeft className="size-3.5" aria-hidden="true" />
                      <span>{textosAdminReservas.paginacion.anterior}</span>
                    </Button>
                    <span className="px-2 font-medium text-neutro-900">
                      {textosAdminReservas.paginacion.pagina(page, totalPages)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 text-xs"
                    >
                      <span>{textosAdminReservas.paginacion.siguiente}</span>
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
