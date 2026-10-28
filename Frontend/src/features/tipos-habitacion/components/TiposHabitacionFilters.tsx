import React from "react";
import { Search, X } from "lucide-react";
import { useTiposHabitacionTexts } from "../textos";
import type { TiposHabitacionFiltersState } from "../types";

interface TiposHabitacionFiltersProps {
  filters: TiposHabitacionFiltersState;
  onChange: (updater: (prev: TiposHabitacionFiltersState) => TiposHabitacionFiltersState) => void;
  totalResults: number;
}

export const TiposHabitacionFilters: React.FC<TiposHabitacionFiltersProps> = ({
  filters,
  onChange,
  totalResults,
}) => {
  const textosTiposHabitacion = useTiposHabitacionTexts();
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutro-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <label htmlFor="filtro-nombre-tipo" className="sr-only">
            {textosTiposHabitacion.buscarLabel}
          </label>
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutro-500"
            aria-hidden="true"
          />
          <input
            id="filtro-nombre-tipo"
            type="search"
            aria-label={textosTiposHabitacion.buscarLabel}
            placeholder={textosTiposHabitacion.buscarPlaceholder}
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
              aria-label={textosTiposHabitacion.limpiarBusqueda}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutro-500 hover:bg-neutro-100 hover:text-neutro-900"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <span className="text-xs font-medium text-neutro-500 whitespace-nowrap">
          {textosTiposHabitacion.tiposMostrados(totalResults)}
        </span>
      </div>
    </div>
  );
};
