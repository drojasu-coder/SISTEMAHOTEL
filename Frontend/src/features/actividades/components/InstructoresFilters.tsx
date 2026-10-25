import React from 'react';
import { Search, UserCheck } from 'lucide-react';
import { textosActividades } from '../textos';

export interface InstructoresFiltersState {
  search: string;
  estado: 'all' | 'activo' | 'inactivo';
}

interface InstructoresFiltersProps {
  filters: InstructoresFiltersState;
  onChange: (filters: InstructoresFiltersState) => void;
}

export const InstructoresFilters: React.FC<InstructoresFiltersProps> = ({
  filters,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Búsqueda por nombre o especialidad */}
      <div>
        <label htmlFor="filtro-instructor-nombre" className="sr-only">
          Buscar instructor...
        </label>
        <div className="relative">
          <input
            id="filtro-instructor-nombre"
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          />
          <Search className="pointer-events-none absolute right-3 top-2.5 size-3.5 text-neutro-400" />
        </div>
      </div>

      {/* Filtro por estado activo/inactivo */}
      <div>
        <label htmlFor="filtro-instructor-estado" className="sr-only">
          {textosActividades.filtrarPorEstado}
        </label>
        <div className="relative">
          <select
            id="filtro-instructor-estado"
            value={filters.estado}
            onChange={(e) =>
              onChange({
                ...filters,
                estado: e.target.value as 'all' | 'activo' | 'inactivo',
              })
            }
            className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 bg-white"
          >
            <option value="all">Todos los estados</option>
            <option value="activo">{textosActividades.instructorActivo}</option>
            <option value="inactivo">{textosActividades.instructorInactivo}</option>
          </select>
          <UserCheck className="pointer-events-none absolute right-3 top-2.5 size-3.5 text-neutro-400" />
        </div>
      </div>
    </div>
  );
};
