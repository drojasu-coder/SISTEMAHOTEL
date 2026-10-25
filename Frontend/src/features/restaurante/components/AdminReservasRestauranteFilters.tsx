import React from "react";
import { Button } from "@/components/ui/Button";
import { textosRestaurante } from "../textos";
import { RotateCcw, Search, Calendar } from "lucide-react";

export interface AdminReservasRestauranteFiltersState {
  busqueda: string;
  sucursalId: string;
  estado: string;
  fecha: string;
}

interface AdminReservasRestauranteFiltersProps {
  filters: AdminReservasRestauranteFiltersState;
  onChange: (filters: AdminReservasRestauranteFiltersState) => void;
  onReset: () => void;
  sedes: Array<{ id: number; nombre: string }>;
  totalCount: number;
  filteredCount: number;
}

export const AdminReservasRestauranteFilters: React.FC<
  AdminReservasRestauranteFiltersProps
> = ({
  filters,
  onChange,
  onReset,
  sedes,
  totalCount,
  filteredCount,
}) => {
  const t = textosRestaurante.adminReservas;

  const hasActiveFilters =
    filters.busqueda !== "" ||
    filters.sucursalId !== "" ||
    filters.estado !== "" ||
    filters.fecha !== "";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutro-200 bg-neutro-50 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda por Cliente */}
        <div>
          <label
            htmlFor="filtro-busqueda-admin"
            className="block text-xs font-semibold uppercase tracking-wider text-neutro-700 mb-1"
          >
            {t.buscarPlaceholder}
          </label>
          <div className="relative">
            <input
              id="filtro-busqueda-admin"
              type="text"
              placeholder={t.buscarPlaceholder}
              value={filters.busqueda}
              onChange={(e) => onChange({ ...filters, busqueda: e.target.value })}
              className="w-full rounded-md border border-neutro-300 pl-9 pr-3 py-2 text-sm text-neutro-900 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            />
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
          </div>
        </div>

        {/* Filtro por Sede */}
        <div>
          <label
            htmlFor="filtro-sede-admin"
            className="block text-xs font-semibold uppercase tracking-wider text-neutro-700 mb-1"
          >
            {t.todasLasSedes}
          </label>
          <select
            id="filtro-sede-admin"
            value={filters.sucursalId}
            onChange={(e) => onChange({ ...filters, sucursalId: e.target.value })}
            className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="">{t.todasLasSedes}</option>
            {sedes.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Fecha */}
        <div>
          <label
            htmlFor="filtro-fecha-admin"
            className="block text-xs font-semibold uppercase tracking-wider text-neutro-700 mb-1"
          >
            {t.filtrarPorFecha}
          </label>
          <div className="relative">
            <input
              id="filtro-fecha-admin"
              type="date"
              value={filters.fecha}
              onChange={(e) => onChange({ ...filters, fecha: e.target.value })}
              className="w-full rounded-md border border-neutro-300 pl-9 pr-3 py-2 text-sm text-neutro-900 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            />
            <Calendar className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
          </div>
        </div>

        {/* Filtro por Estado */}
        <div>
          <label
            htmlFor="filtro-estado-admin"
            className="block text-xs font-semibold uppercase tracking-wider text-neutro-700 mb-1"
          >
            {t.todosLosEstados}
          </label>
          <select
            id="filtro-estado-admin"
            value={filters.estado}
            onChange={(e) => onChange({ ...filters, estado: e.target.value })}
            className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="">{t.todosLosEstados}</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Barra inferior de conteo y limpiar */}
      <div className="flex items-center justify-between border-t border-neutro-200 pt-3 text-xs text-neutro-500">
        <span>
          {t.reservasMostradas(filteredCount)} (Total: {totalCount})
        </span>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="text-xs"
          >
            <RotateCcw className="size-3.5 mr-1" aria-hidden="true" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
};
