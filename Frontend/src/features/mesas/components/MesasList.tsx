import React from 'react';
import { CalendarDays, Pencil } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { Mesa } from '../types';
import { useTextosGestionMesas } from '../gestionTextos';

interface MesasListProps {
  mesas: Mesa[];
  canEdit: boolean;
  onEdit: (mesa: Mesa) => void;
  onAgenda: (mesa: Mesa) => void;
  /** Nombre de la sede por identificador, del catálogo real de sedes. */
  sedeNombrePorId: Map<number, string>;
  /** Próxima reserva confirmada por mesa, ya formateada. */
  proximaPorMesa?: ReadonlyMap<number, string>;
  showSite?: boolean;
}

/** El estado de mesa es texto libre del backend: solo «disponible» se destaca como tal. */
export const estadoMesaClase = (estado: string) => estado.trim().toLowerCase() === 'disponible'
  ? 'border-exito-600/20 bg-exito-50 text-exito-700'
  : estado.trim().toLowerCase() === 'mantenimiento' ? 'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700'
  : 'border-neutro-300 bg-neutro-100 text-neutro-700';

/** Mesas en tabla compacta (escritorio) o filas (móvil), identificadas por su número real. */
export const MesasList: React.FC<MesasListProps> = ({ mesas, canEdit, onEdit, onAgenda, sedeNombrePorId, proximaPorMesa, showSite = true }) => {
  const t = useTextosGestionMesas();
  const sede = (mesa: Mesa) => mesa.Sucursal?.nombre?.trim() || sedeNombrePorId.get(mesa.sucursal_id) || `#${mesa.sucursal_id}`;
  const acciones = (mesa: Mesa, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <button type="button" onClick={() => onAgenda(mesa)} aria-label={t.agendaDe(mesa.id)} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <CalendarDays className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden xl:inline'}>{t.agenda}</span></button>
    {canEdit && <button type="button" onClick={() => onEdit(mesa)} aria-label={t.editarDe(mesa.id)} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden xl:inline'}>{t.editar}</span></button>}
  </div>;

  return <>
    <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
      <table className="w-full text-left text-sm text-neutro-800">
        <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
          <tr>
            <th scope="col" className="px-4 py-3">{t.col.mesa}</th>
            <th scope="col" className="px-4 py-3">{t.col.zona}</th>
            {showSite && <th scope="col" className="px-4 py-3">{t.col.sede}</th>}
            <th scope="col" className="px-4 py-3">{t.col.capacidad}</th>
            <th scope="col" className="px-4 py-3">{t.col.estado}</th>
            {proximaPorMesa && <th scope="col" className="px-4 py-3">{t.col.proxima}</th>}
            <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">{t.col.acciones}</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutro-100">
          {mesas.map((mesa) => <tr key={mesa.id} className="hover:bg-bronce-50/40">
            <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-neutro-900">{t.mesa(mesa.id)}</td>
            <td className="px-4 py-2.5" lang="es">{mesa.zona}</td>
            {showSite && <td className="px-4 py-2.5 text-neutro-700" lang="es">{sede(mesa)}</td>}
            <td className="whitespace-nowrap px-4 py-2.5">{t.personas(mesa.capacidad)}</td>
            <td className="px-4 py-2.5"><span lang="es" className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize', estadoMesaClase(mesa.estado))}>{mesa.estado}</span></td>
            {proximaPorMesa && <td className="whitespace-nowrap px-4 py-2.5 text-neutro-700">{proximaPorMesa.get(mesa.id) ?? <span className="text-neutro-400">{t.sinProxima}</span>}</td>}
            <td className="px-4 py-1.5">{acciones(mesa)}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
      {mesas.map((mesa) => <li key={mesa.id} className="flex items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900">{t.mesa(mesa.id)}</span>
            <span lang="es" className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize', estadoMesaClase(mesa.estado))}>{mesa.estado}</span></span>
          <span className="block truncate text-xs text-neutro-600"><span lang="es">{mesa.zona}</span> · {t.personas(mesa.capacidad)}{showSite && <> · <span lang="es">{sede(mesa)}</span></>}</span>
          {proximaPorMesa?.get(mesa.id) && <span className="block text-xs text-bronce-700">{t.col.proxima}: {proximaPorMesa.get(mesa.id)}</span>}
        </span>
        {acciones(mesa, true)}
      </li>)}
    </ul>
  </>;
};
