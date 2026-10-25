import React from 'react';
import { Search, MapPin, Tag } from 'lucide-react';
import type { Sucursal } from '@/features/sedes/types';
import { textosActividades } from '../textos';

export interface RecursosActividadFiltersState {
  search: string;
  sucursalId: string; // 'all' or string number
  tipo: string; // 'all' or string
}

interface RecursosActividadFiltersProps {
  filters: RecursosActividadFiltersState;
  onChange: (filters: RecursosActividadFiltersState) => void;
  sedes: Sucursal[];
  tiposDisponibles: string[];
}

export const RecursosActividadFilters: React.FC<RecursosActividadFiltersProps> = ({
  filters,
  onChange,
  sedes,
  tiposDisponibles,
}) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Búsqueda por nombre */}
      <div>
        <label htmlFor="filtro-nombre" className="sr-only">
          {textosActividades.buscarActividad}
        </label>
        <div className="relative">
          <input
            id="filtro-nombre"
            type="text"
            placeholder="Buscar por nombre o tipo..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          />
          <Search className="pointer-events-none absolute right-3 top-2.5 size-3.5 text-neutro-400" />
        </div>
      </div>

      {/* Filtro por sede */}
      <div>
        <label htmlFor="filtro-sede" className="sr-only">
          {textosActividades.filtrarPorSede}
        </label>
        <div className="relative">
          <select
            id="filtro-sede"
            value={filters.sucursalId}
            onChange={(e) => onChange({ ...filters, sucursalId: e.target.value })}
            className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 bg-white"
          >
            <option value="all">{textosActividades.todasLasSedes}</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
          <MapPin className="pointer-events-none absolute right-3 top-2.5 size-3.5 text-neutro-400" />
        </div>
      </div>

      {/* Filtro por tipo */}
      <div>
        <label htmlFor="filtro-tipo" className="sr-only">
          {textosActividades.filtrarPorTipo}
        </label>
        <div className="relative">
          <select
            id="filtro-tipo"
            value={filters.tipo}
            onChange={(e) => onChange({ ...filters, tipo: e.target.value })}
            className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 bg-white capitalize"
          >
            <option value="all">{textosActividades.todosLosTipos}</option>
            {tiposDisponibles.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
          <Tag className="pointer-events-none absolute right-3 top-2.5 size-3.5 text-neutro-400" />
        </div>
      </div>
    </div>
  );
};
