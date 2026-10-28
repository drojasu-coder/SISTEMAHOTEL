import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Sucursal } from '@/features/sedes/types';
import { SelectField } from './SelectField';
import { useTextosMesas } from '../texts';

interface MesaFiltersProps {
  /**
   * Catálogo real de sedes (GET /api/sucursales). El selector local de sede solo
   * se muestra si se recibe onSedeChange; en el panel la sede la decide el
   * selector global.
   */
  sedes?: Sucursal[];
  /** Zonas presentes en las mesas cargadas: no hay catálogo de zonas en el backend. */
  zonas: string[];
  sedeSeleccionada?: string;
  zonaSeleccionada: string;
  onSedeChange?: (value: string) => void;
  onZonaChange: (value: string) => void;
  onClear: () => void;
}

/** Filtros por sede y zona. El filtrado ocurre en el cliente: el backend no admite parámetros. */
export const MesaFilters: React.FC<MesaFiltersProps> = ({
  sedes = [],
  zonas,
  sedeSeleccionada = '',
  zonaSeleccionada,
  onSedeChange,
  onZonaChange,
  onClear,
}) => {
  const textosMesas = useTextosMesas();
  const hayFiltros = sedeSeleccionada !== '' || zonaSeleccionada !== '';

  return (
    <section
      aria-label={textosMesas.filtros}
      className="flex flex-col gap-4 rounded-xl border border-neutro-200 bg-white p-4 sm:flex-row sm:items-end sm:p-5"
    >
      {onSedeChange && (
      <div className="flex-1">
        <SelectField
          label={textosMesas.filtroSede}
          value={sedeSeleccionada}
          onChange={(event) => onSedeChange(event.target.value)}
          disabled={sedes.length === 0}
        >
          <option value="">{textosMesas.todasLasSedes}</option>
          {sedes.map((sede) => (
            <option key={sede.id} value={String(sede.id)}>
              {sede.nombre}
            </option>
          ))}
        </SelectField>
      </div>
      )}

      <div className="flex-1">
        <SelectField
          label={textosMesas.filtroZona}
          value={zonaSeleccionada}
          onChange={(event) => onZonaChange(event.target.value)}
          disabled={zonas.length === 0}
        >
          <option value="">{textosMesas.todasLasZonas}</option>
          {zonas.map((zona) => (
            <option key={zona} value={zona}>
              {zona}
            </option>
          ))}
        </SelectField>
      </div>

      {hayFiltros && (
        <Button type="button" variant="ghost" onClick={onClear} className="sm:mb-0.5">
          <X className="size-4" aria-hidden="true" />
          {textosMesas.limpiarFiltros}
        </Button>
      )}

      {!hayFiltros && (
        <p className="inline-flex items-center gap-2 text-xs text-neutro-500 sm:mb-2.5">
          <Filter className="size-4" aria-hidden="true" />
          {textosMesas.filtros}
        </p>
      )}
    </section>
  );
};
