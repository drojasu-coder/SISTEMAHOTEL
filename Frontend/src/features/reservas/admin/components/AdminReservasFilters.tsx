import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ESTADOS_RESERVA_HABITACION, type EstadoReservaHabitacion } from '../../types';
import { useTextosAdminReservas } from '../textos';
import type { ReservasAdminFiltersState } from '../types';

interface AdminReservasFiltersProps {
  filters: ReservasAdminFiltersState;
  onChange: (
    updater: (prev: ReservasAdminFiltersState) => ReservasAdminFiltersState
  ) => void;
  totalResults: number;
  totalCatalog: number;
}

export const AdminReservasFilters: React.FC<AdminReservasFiltersProps> = ({
  filters,
  onChange,
  totalResults,
  totalCatalog,
}) => {
  const textosAdminReservas = useTextosAdminReservas();
  const hasActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.estado !== 'all';

  const handleClearAll = () => {
    // La sede la decide el selector global del panel; aquí no se reinicia.
    onChange((prev) => ({
      ...prev,
      search: '',
      estado: 'all',
    }));
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutro-200 bg-white p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Búsqueda por cliente, habitación o ID */}
        <div className="relative">
          <label htmlFor="filtro-reserva-buscar" className="sr-only">
            {textosAdminReservas.filtros.buscarLabel}
          </label>
          <Search
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutro-500"
            aria-hidden="true"
          />
          <input
            id="filtro-reserva-buscar"
            type="search"
            aria-label={textosAdminReservas.filtros.buscarLabel}
            placeholder={textosAdminReservas.filtros.buscarPlaceholder}
            value={filters.search}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, search: e.target.value }))
            }
            className="field-control pl-10 pr-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, search: '' }))}
              aria-label={textosAdminReservas.filtros.limpiarBusqueda}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutro-500 hover:bg-neutro-100 hover:text-neutro-900"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filtro por Estado */}
        <div>
          <label htmlFor="filtro-reserva-estado" className="sr-only">
            {textosAdminReservas.filtros.estadoLabel}
          </label>
          <select
            id="filtro-reserva-estado"
            aria-label={textosAdminReservas.filtros.estadoLabel}
            value={filters.estado}
            onChange={(e) => {
              const val = e.target.value as EstadoReservaHabitacion | 'all';
              onChange((prev) => ({ ...prev, estado: val }));
            }}
            className="field-control"
          >
            <option value="all">{textosAdminReservas.filtros.todosLosEstados}</option>
            {ESTADOS_RESERVA_HABITACION.map((estado) => (
              <option key={estado} value={estado}>
                {textosAdminReservas.estados[estado]}
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
              aria-label={textosAdminReservas.filtros.limpiar}
              className="text-xs"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>{textosAdminReservas.filtros.limpiar}</span>
            </Button>
          )}
          <span className="text-xs font-medium text-neutro-500 whitespace-nowrap">
            {textosAdminReservas.listado.totalMostradas(totalResults, totalCatalog)}
          </span>
        </div>
      </div>
    </div>
  );
};
