import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import { useSedesQuery } from "@/features/sedes/hooks/useSedes";
import { useAmenidadesQuery } from "@/features/amenidades/hooks/useAmenidades";
import { useAdminReservasAmenidadQuery } from "@/features/amenidades/hooks/useReservasAmenidad";
import { AdminReservasAmenidadesFilters } from "@/features/amenidades/components/AdminReservasAmenidadesFilters";
import { AdminReservasAmenidadesList } from "@/features/amenidades/components/AdminReservasAmenidadesList";
import { textosAmenidades } from "@/features/amenidades/textos";
import type { ReservasAmenidadAdminFiltersState } from "@/features/amenidades/types";

export const AdminReservasAmenidadesPage: React.FC = () => {
  const { user } = useAuth();
  const t = textosAmenidades.adminReservas;

  const reservasQuery = useAdminReservasAmenidadQuery(user?.id);
  const sedesQuery = useSedesQuery();
  const amenidadesQuery = useAmenidadesQuery();

  const [filters, setFilters] = useState<ReservasAmenidadAdminFiltersState>({
    search: "",
    sucursalId: "all",
    amenidadId: "all",
    fecha: "",
    estado: "all",
  });

  const sedes = sedesQuery.data ?? [];
  const amenidades = amenidadesQuery.data ?? [];
  const reservas = reservasQuery.data ?? [];

  const filteredReservas = useMemo(() => {
    return reservas.filter((reserva) => {
      // 1. Búsqueda por término (ID, cliente o email)
      const term = filters.search.trim().toLowerCase();
      if (term) {
        const idMatch = String(reserva.id).includes(term);
        const clienteMatch = reserva.Usuario?.nombre?.toLowerCase().includes(term);
        const emailMatch = reserva.Usuario?.email?.toLowerCase().includes(term);
        const amenidadMatch = reserva.Amenidad?.nombre?.toLowerCase().includes(term);

        if (!idMatch && !clienteMatch && !emailMatch && !amenidadMatch) {
          return false;
        }
      }

      // 2. Filtro por sede
      if (filters.sucursalId !== "all") {
        const sucursalId =
          reserva.Amenidad?.sucursal_id ||
          amenidades.find((a) => a.id === reserva.amenidad_id)?.sucursal_id;
        if (sucursalId !== filters.sucursalId) {
          return false;
        }
      }

      // 3. Filtro por amenidad
      if (filters.amenidadId !== "all") {
        if (reserva.amenidad_id !== filters.amenidadId) {
          return false;
        }
      }

      // 4. Filtro por fecha (YYYY-MM-DD)
      if (filters.fecha && reserva.fecha !== filters.fecha) {
        return false;
      }

      // 5. Filtro por estado
      if (filters.estado !== "all" && reserva.estado !== filters.estado) {
        return false;
      }

      return true;
    });
  }, [reservas, amenidades, filters]);

  const isLoading =
    reservasQuery.isPending || sedesQuery.isPending || amenidadesQuery.isPending;
  const isError = reservasQuery.isError;

  const handleRefetch = () => {
    reservasQuery.refetch();
    sedesQuery.refetch();
    amenidadesQuery.refetch();
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">{t.subtitulo}</p>
          <h1 className="text-[2rem] leading-[2.375rem] text-neutro-900 md:text-[2.5rem] md:leading-[3rem] font-serif font-semibold">
            {t.titulo}
          </h1>
          <p className="max-w-2xl text-sm text-neutro-600">
            {t.descripcion}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <Link
            to="/admin"
            className={buttonStyles({ variant: "ghost" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{t.volverAlPanel}</span>
          </Link>
          <Link
            to="/admin/amenidades"
            className={buttonStyles({ variant: "secondary" })}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            <span>{t.irGestionAmenidades}</span>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros */}
      <AdminReservasAmenidadesFilters
        filters={filters}
        onFilterChange={setFilters}
        sedes={sedes}
        amenidades={amenidades}
      />

      {/* Listado de reservas */}
      <AdminReservasAmenidadesList
        reservas={filteredReservas}
        isLoading={isLoading}
        isError={isError}
        onRefetch={handleRefetch}
        totalSinFiltrar={reservas.length}
      />
    </div>
  );
};
