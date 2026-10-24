import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { textosAmenidades } from "../textos";
import type { Amenidad, ReservasAmenidadAdminFiltersState } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface AdminReservasAmenidadesFiltersProps {
  filters: ReservasAmenidadAdminFiltersState;
  onFilterChange: (filters: ReservasAmenidadAdminFiltersState) => void;
  sedes: Sucursal[];
  amenidades: Amenidad[];
}

export const AdminReservasAmenidadesFilters: React.FC<AdminReservasAmenidadesFiltersProps> = ({
  filters,
  onFilterChange,
  sedes,
  amenidades,
}) => {
  const t = textosAmenidades.adminReservas;

  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.sucursalId !== "all" ||
    filters.amenidadId !== "all" ||
    Boolean(filters.fecha) ||
    filters.estado !== "all";

  const handleReset = () => {
    onFilterChange({
      search: "",
      sucursalId: "all",
      amenidadId: "all",
      fecha: "",
      estado: "all",
    });
  };

  // Filtrar las amenidades según la sede seleccionada (si aplica)
  const amenidadesDisponibles =
    filters.sucursalId === "all"
      ? amenidades
      : amenidades.filter((a) => a.sucursal_id === filters.sucursalId);

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-6 bg-white border border-neutro-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Búsqueda por ID, cliente o correo */}
        <div className="relative lg:col-span-2">
          <label htmlFor="filtro-admin-busqueda" className="sr-only">
            {t.buscarPlaceholder}
          </label>
          <input
            id="filtro-admin-busqueda"
            type="search"
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            placeholder={t.buscarPlaceholder}
            className="w-full rounded-md border border-neutro-300 py-2 pl-9 pr-3 text-sm text-neutro-900 placeholder-neutro-400 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          />
          <Search
            className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutro-400"
            aria-hidden="true"
          />
        </div>

        {/* Filtro por sede */}
        <div className="relative">
          <label htmlFor="filtro-admin-sede" className="sr-only">
            {t.todasLasSedes}
          </label>
          <select
            id="filtro-admin-sede"
            value={filters.sucursalId}
            onChange={(e) => {
              const val = e.target.value === "all" ? "all" : Number(e.target.value);
              onFilterChange({
                ...filters,
                sucursalId: val,
                // Si la amenidad actual no pertenece a la nueva sede, resetear a 'all'
                amenidadId: "all",
              });
            }}
            className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="all">{t.todasLasSedes}</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por amenidad */}
        <div className="relative">
          <label htmlFor="filtro-admin-amenidad" className="sr-only">
            {t.todasLasAmenidades}
          </label>
          <select
            id="filtro-admin-amenidad"
            value={filters.amenidadId}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                amenidadId: e.target.value === "all" ? "all" : Number(e.target.value),
              })
            }
            className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="all">{t.todasLasAmenidades}</option>
            {amenidadesDisponibles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por estado */}
        <div className="relative">
          <label htmlFor="filtro-admin-estado" className="sr-only">
            {t.todosLosEstados}
          </label>
          <select
            id="filtro-admin-estado"
            value={filters.estado}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                estado: e.target.value as any,
              })
            }
            className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="all">{t.todosLosEstados}</option>
            <option value="confirmada">Confirmada</option>
            <option value="usada">Completada / Usada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Fila secundaria: Fecha y Limpieza de filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-neutro-100 pt-3">
        <div className="flex items-center gap-2">
          <label htmlFor="filtro-admin-fecha" className="text-xs font-semibold text-neutro-700">
            {t.filtrarPorFecha}:
          </label>
          <input
            id="filtro-admin-fecha"
            type="date"
            value={filters.fecha}
            onChange={(e) =>
              onFilterChange({ ...filters, fecha: e.target.value })
            }
            className="rounded-md border border-neutro-300 px-3 py-1.5 text-xs text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          />
          {
filters.fecha && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, fecha: "" })}
              className="text-xs text-neutro-500 hover:text-neutro-800 underline"
            >
              {t.todasLasFechas}
            </button>
          )}
        </div>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="self-start sm:self-auto gap-1 text-xs"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>{t.limpiarFiltros}</span>
          </Button>
        )}
      </div>
    </Card>
  );
};
