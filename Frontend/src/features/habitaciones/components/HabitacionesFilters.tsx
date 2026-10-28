import React from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { textosHabitaciones } from "../textos";
import type { EstadoHabitacion, HabitacionesFiltersState } from "../types";

interface HabitacionesFiltersProps {
  filters: HabitacionesFiltersState;
  onChange: (updater: (prev: HabitacionesFiltersState) => HabitacionesFiltersState) => void;
  totalResults: number;
}

export const HabitacionesFilters: React.FC<HabitacionesFiltersProps> = ({
  filters,
  onChange,
  totalResults,
}) => {
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.estado !== "all";

  const handleClearAll = () => {
    // La sede la decide el selector global del panel; aquí no se reinicia.
    onChange((prev) => ({
      ...prev,
      search: "",
      estado: "all",
    }));
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutro-200 bg-white p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Búsqueda por número */}
        <div className="relative">
          <label htmlFor="filtro-numero" className="sr-only">
            {textosHabitaciones.buscarLabel}
          </label>
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutro-500"
            aria-hidden="true"
          />
          <input
            id="filtro-numero"
            type="search"
            aria-label={textosHabitaciones.buscarLabel}
            placeholder={textosHabitaciones.buscarPlaceholder}
            value={filters.search}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, search: e.target.value }))
            }
            className="field-control pl-10 pr-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, search: "" }))}
              aria-label={textosHabitaciones.limpiarBusqueda}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutro-500 hover:bg-neutro-100 hover:text-neutro-900"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filtro por Estado */}
        <div>
          <label htmlFor="filtro-estado" className="sr-only">
            {textosHabitaciones.filtroEstadoLabel}
          </label>
          <select
            id="filtro-estado"
            aria-label={textosHabitaciones.filtroEstadoLabel}
            value={filters.estado}
            onChange={(e) => {
              const val = e.target.value as EstadoHabitacion | "all";
              onChange((prev) => ({ ...prev, estado: val }));
            }}
            className="field-control"
          >
            <option value="all">{textosHabitaciones.todosLosEstados}</option>
            {(["disponible", "ocupada", "mantenimiento", "limpieza"] as EstadoHabitacion[]).map(
              (est) => (
                <option key={est} value={est}>
                  {textosHabitaciones.estados[est]}
                </option>
              )
            )}
          </select>
        </div>

        {/* Botón limpiar y contador */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              aria-label={textosHabitaciones.limpiarFiltros}
              className="text-xs"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>{textosHabitaciones.limpiarFiltros}</span>
            </Button>
          )}
          <span className="text-xs font-medium text-neutro-500 whitespace-nowrap">
            {textosHabitaciones.habitacionesMostradas(totalResults)}
          </span>
        </div>
      </div>
    </div>
  );
};
