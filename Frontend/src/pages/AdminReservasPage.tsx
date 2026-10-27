import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CalendarX, ArrowLeft, Bed } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useAdminReservasQuery } from '@/features/reservas/admin/hooks/useAdminReservas';
import { AdminReservasFilters } from '@/features/reservas/admin/components/AdminReservasFilters';
import { AdminReservasList } from '@/features/reservas/admin/components/AdminReservasList';
import { textosAdminReservas } from '@/features/reservas/admin/textos';
import type { ReservasAdminFiltersState } from '@/features/reservas/admin/types';

export const AdminReservasPage: React.FC = () => {
  const reservasQuery = useAdminReservasQuery();
  const sedesQuery = useSedesQuery();

  const [filters, setFilters] = useState<ReservasAdminFiltersState>({
    search: '',
    sucursalId: 'all',
    estado: 'all',
  });

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

      // Filtro por sede
      if (filters.sucursalId !== 'all') {
        const sucursalId = reserva.Habitacion?.sucursal_id;
        if (sucursalId !== filters.sucursalId) {
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
            sedes={sedes}
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
            <AdminReservasList
              reservas={filteredReservas}
              sedesPorId={sedesMap}
            />
          )}
        </div>
      )}
    </div>
  );
};
