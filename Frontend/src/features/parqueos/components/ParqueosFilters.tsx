import React from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { textosParqueos } from "../textos";
import type { EstadoParqueo, ParqueosFiltersState } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface ParqueosFiltersProps {
  filters: ParqueosFiltersState;
  onChange: (
    updater: (prev: ParqueosFiltersState) => ParqueosFiltersState
  ) => void;
  sedes: Sucursal[];
  totalResults: number;
}

/**
 * Filtros del catálogo de parqueos. Todas las opciones provienen de los datos
 * cargados: el catálogo de sedes (GET /api/sucursales) y los estados que
 * admite el backend. El filtrado es local porque el backend no acepta
 * parámetros de consulta.
 */
export const ParqueosFilters: React.FC<ParqueosFiltersProps> = ({
  filters,
  onChange,
  sedes,
  totalResults,
}) => {
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.sucursalId !== "all" ||
    filters.estado !== "all";

  const handleClearAll = () => {
    onChange(() => ({
      search: "",
      sucursalId: "all",
      estado: "all",
    }));
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutro-200 bg-white p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Búsqueda por número */}
        <div className="relative">
          <label htmlFor="filtro-parqueo-numero" className="sr-only">
            {textosParqueos.buscarLabel}
          </label>
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutro-500"
            aria-hidden="true"
          />
          <input
            id="filtro-parqueo-numero"
            type="search"
            aria-label={textosParqueos.buscarLabel}
            placeholder={textosParqueos.buscarPlaceholder}
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
              aria-label={textosParqueos.limpiarBusqueda}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutro-500 hover:bg-neutro-100 hover:text-neutro-900"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filtro por Sede */}
        <div>
          <label htmlFor="filtro-parqueo-sede" className="sr-only">
            {textosParqueos.filtroSedeLabel}
          </label>
          <select
            id="filtro-parqueo-sede"
            aria-label={textosParqueos.filtroSedeLabel}
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
            <option value="all">{textosParqueos.todasLasSedes}</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Estado */}
        <div>
          <label htmlFor="filtro-parqueo-estado" className="sr-only">
            {textosParqueos.filtroEstadoLabel}
          </label>
          <select
            id="filtro-parqueo-estado"
            aria-label={textosParqueos.filtroEstadoLabel}
            value={filters.estado}
            onChange={(e) => {
              const val = e.target.value as EstadoParqueo | "all";
              onChange((prev) => ({ ...prev, estado: val }));
            }}
            className="field-control"
          >
            <option value="all">{textosParqueos.todosLosEstados}</option>
            {(["disponible", "ocupado", "mantenimiento"] as EstadoParqueo[]).map(
              (estado) => (
                <option key={estado} value={estado}>
                  {textosParqueos.estados[estado]}
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
              aria-label={textosParqueos.limpiarFiltros}
              className="text-xs"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>{textosParqueos.limpiarFiltros}</span>
            </Button>
          )}
          <span className="text-xs font-medium text-neutro-500 whitespace-nowrap">
            {textosParqueos.parqueosMostrados(totalResults)}
          </span>
        </div>
      </div>
    </div>
  );
};
