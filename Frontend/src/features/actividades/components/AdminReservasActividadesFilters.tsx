import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { textosActividades } from '../textos';
import type { RecursoActividad } from '../types';
import type { Sucursal } from '@/features/sedes/types';

export interface ReservasActividadAdminFiltersState {
  search: string;
  sucursalId: number | 'all';
  recursoId: number | 'all';
  fecha: string;
  estado: string;
}

interface AdminReservasActividadesFiltersProps {
  filters: ReservasActividadAdminFiltersState;
  onFilterChange: (filters: ReservasActividadAdminFiltersState) => void;
  sedes: Sucursal[];
  recursos: RecursoActividad[];
}

export const AdminReservasActividadesFilters: React.FC<AdminReservasActividadesFiltersProps> = ({
  filters,
  onFilterChange,
  sedes,
  recursos,
}) => {
  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.sucursalId !== 'all' ||
    filters.recursoId !== 'all' ||
    Boolean(filters.fecha) ||
    filters.estado !== 'all';

  const handleReset = () => {
    onFilterChange({
      search: '',
      sucursalId: 'all',
      recursoId: 'all',
      fecha: '',
      estado: 'all',
    });
  };

  // Filtrar recursos según la sede seleccionada
  const recursosDisponibles =
    filters.sucursalId === 'all'
      ? recursos
      : recursos.filter((r) => r.sucursal_id === filters.sucursalId);

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-6 bg-white border border-neutro-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Búsqueda por ID, cliente o correo */}
        <div className="relative lg:col-span-2">
          <label htmlFor="filtro-admin-busqueda" className="sr-only">
            Buscar por ID, cliente o correo
          </label>
          <input
            id="filtro-admin-busqueda"
            type="search"
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            placeholder="Buscar por ID, cliente o correo..."
            className="w-full rounded-md border border-neutro-300 py-2 pl-9 pr-3 text-sm text-neutro-900 placeholder-neutro-400 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          />
          <Search
            className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutro-400"
            aria-hidden="true"
          />
        </div>

        {/* Filtro por Sede */}
        <div>
          <label htmlFor="filtro-admin-sede" className="sr-only">
            {textosActividades.filtrarPorSede}
          </label>
          <select
            id="filtro-admin-sede"
            value={filters.sucursalId}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({
                ...filters,
                sucursalId: val === 'all' ? 'all' : Number(val),
                recursoId: 'all',
              });
            }}
            className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm text-neutro-700 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="all">{textosActividades.todasLasSedes}</option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Instalación / Recurso */}
        <div>
          <label htmlFor="filtro-admin-recurso" className="sr-only">
            {textosActividades.recurso}
          </label>
          <select
            id="filtro-admin-recurso"
            value={filters.recursoId}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({
                ...filters,
                recursoId: val === 'all' ? 'all' : Number(val),
              });
            }}
            className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm text-neutro-700 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="all">Todas las instalaciones</option>
            {recursosDisponibles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Estado */}
        <div>
          <label htmlFor="filtro-admin-estado" className="sr-only">
            {textosActividades.filtrarPorEstado}
          </label>
          <select
            id="filtro-admin-estado"
            value={filters.estado}
            onChange={(e) =>
              onFilterChange({ ...filters, estado: e.target.value })
            }
            className="w-full rounded-md border border-neutro-300 py-2 pl-3 pr-8 text-sm text-neutro-700 bg-white focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmada">{textosActividades.estados.confirmada}</option>
            <option value="cancelada">{textosActividades.estados.cancelada}</option>
            <option value="completada">{textosActividades.estados.completada}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutro-100">
        <div className="flex items-center gap-2">
          <label htmlFor="filtro-admin-fecha" className="text-xs font-medium text-neutro-600">
            Fecha:
          </label>
          <input
            id="filtro-admin-fecha"
            type="date"
            value={filters.fecha}
            onChange={(e) =>
              onFilterChange({ ...filters, fecha: e.target.value })
            }
            className="rounded-md border border-neutro-300 py-1.5 px-2.5 text-xs text-neutro-700 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
          />
        </div>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-neutro-600 hover:text-neutro-900"
          >
            <RotateCcw className="size-3.5 mr-1" aria-hidden="true" />
            <span>{textosActividades.limpiarFiltros}</span>
          </Button>
        )}
      </div>
    </Card>
  );
};
