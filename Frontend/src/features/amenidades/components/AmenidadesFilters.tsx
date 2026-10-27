import React from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { textosAmenidades } from "../textos";
import type { AmenidadesFiltersState } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface AmenidadesFiltersProps {
  filters: AmenidadesFiltersState;
  onChange: (updater: (prev: AmenidadesFiltersState) => AmenidadesFiltersState) => void;
  sedes: Sucursal[];
  totalResults: number;
}

export const AmenidadesFilters: React.FC<AmenidadesFiltersProps> = ({
  filters,
  onChange,
  sedes,
  totalResults,
}) => {
  const hasActiveFilters =
    Boolean(filters.search.trim()) || filters.sucursalId !== "all";

  const handleClearAll = () => {
    onChange(() => ({
      search: "",
      sucursalId: "all",
    }));
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutro-200 bg-white p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Búsqueda por nombre */}
        <div className="relative">
          <label htmlFor="filtro-nombre-amenidad" className="sr-only">
            {textosAmenidades.buscarLabel}
          </label>
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutro-500"
            aria-hidden="true"
          />
          <input
            id="filtro-nombre-amenidad"
            type="search"
            aria-label={textosAmenidades.buscarLabel}
            placeholder={textosAmenidades.buscarPlaceholder}
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
              aria-label={textosAmenidades.limpiarBusqueda}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutro-500 hover:bg-neutro-100 hover:text-neutro-900"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filtro por Sede */}
        <div>
          <label htmlFor="filtro-sede-amenidad" className="sr-only">
            {textosAmenidades.filtroSedeLabel}
          </label>
          <select
            id="filtro-sede-amenidad"
            aria-label={textosAmenidades.filtroSedeLabel}
            value={filters.sucursalId}
            onChange={(e) => {
              const val = e.target.value;
              onChange((prev) => ({
                ...prev,
                sucursalId: val === "all" ? "all" : Number(val),
              }));
            }}
            className="field-control"
          >
            <option value="all">{textosAmenidades.todasLasSedes}</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
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
              aria-label={textosAmenidades.limpiarFiltros}
              className="text-xs"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>{textosAmenidades.limpiarFiltros}</span>
            </Button>
          )}
          <span className="text-xs font-medium text-neutro-500 whitespace-nowrap">
            {textosAmenidades.amenidadesMostradas(totalResults)}
          </span>
        </div>
      </div>
    </div>
  );
};
