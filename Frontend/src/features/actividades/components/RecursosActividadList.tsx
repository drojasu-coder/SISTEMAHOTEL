import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ImageOff, Pencil } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { formatearGTQ } from '../textos';
import { ACTIVIDADES_ROUTES } from '../constants/routes';
import { useTextosGestionActividades } from '../gestionTextos';
import type { RecursoActividad } from '../types';
import { HorarioBadge } from '@/components/ui/HorarioBadge';

interface RecursosActividadListProps {
  recursos: RecursoActividad[];
  onEdit: (recurso: RecursoActividad) => void;
  canEdit?: boolean;
  sedeNombre: (recurso: RecursoActividad) => string;
  showSite?: boolean;
}

const hasAmount = (value: unknown) => value !== null && value !== undefined && value !== '' && Number(value) > 0;

/**
 * Recursos en tabla compacta (escritorio) o filas (móvil). La tarifa se presenta
 * según la modalidad real del recurso; sin importes, se indica «Sin tarifa».
 */
export const RecursosActividadList: React.FC<RecursosActividadListProps> = ({ recursos, onEdit, canEdit = true, sedeNombre, showSite = true }) => {
  const t = useTextosGestionActividades();
  const tarifa = (r: RecursoActividad) => {
    if (r.modalidad === 'experiencia') return hasAmount(r.precio_persona) ? [t.porPersona(formatearGTQ(r.precio_persona))] : [t.sinTarifa];
    const lines = hasAmount(r.precio_hora) ? [t.porHora(formatearGTQ(r.precio_hora))] : [t.sinTarifa];
    if (hasAmount(r.precio_equipo)) lines.push(t.equipo(formatearGTQ(r.precio_equipo)));
    if (hasAmount(r.precio_instructor_hora)) lines.push(t.instructorHora(formatearGTQ(r.precio_instructor_hora)));
    return lines;
  };
  const detalles = (r: RecursoActividad) => r.modalidad === 'experiencia'
    ? [r.duracion_minutos ? t.minutos(r.duracion_minutos) : null, r.cupo_maximo ? t.cupo(r.cupo_maximo) : null].filter(Boolean).join(' · ') || '—'
    : '—';
  const thumb = (r: RecursoActividad, size: string) => r.imagen_url
    ? <img src={r.imagen_url} alt="" loading="lazy" className={cn(size, 'shrink-0 rounded-md border border-neutro-200 object-cover')} />
    : <span title={t.sinFoto} className={cn(size, 'flex shrink-0 items-center justify-center rounded-md border border-dashed border-neutro-300 bg-neutro-50 text-neutro-400')}><ImageOff className="size-4" aria-hidden="true" /><span className="sr-only">{t.sinFoto}</span></span>;
  const acciones = (r: RecursoActividad, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <Link to={`${ACTIVIDADES_ROUTES.ADMIN_RESERVAS}?vista=todas&recurso=${r.id}`} aria-label={t.reservasDe(r.nombre ?? "")} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <CalendarCheck className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.reservas}</span></Link>
    {canEdit && <button type="button" onClick={() => onEdit(r)} aria-label={t.editarDe(r.nombre ?? "")} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.editar}</span></button>}
  </div>;
  const modalidad = (r: RecursoActividad) => r.modalidad ? t.modalidades[r.modalidad] : '—';

  return <>
    <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
      <table className="w-full text-left text-sm text-neutro-800">
        <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
          <tr>
            <th scope="col" className="px-3 py-3">{t.col.recurso}</th>
            {showSite && <th scope="col" className="px-3 py-3">{t.col.sede}</th>}
            <th scope="col" className="px-3 py-3">{t.col.modalidad}</th>
            <th scope="col" className="px-3 py-3">{t.col.tarifa}</th>
            <th scope="col" className="px-3 py-3">{t.col.detalles}</th>
            <th scope="col" className="px-3 py-3 text-right"><span className="sr-only">{t.col.acciones}</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutro-100">
          {recursos.map((r) => { const lines = tarifa(r); return <tr key={r.id} className="hover:bg-bronce-50/40">
            <td className="px-3 py-2.5"><span className="flex items-center gap-3">{thumb(r, 'size-10')}
              <span className="min-w-0"><span className="block font-semibold text-neutro-900" lang="es">{r.nombre}</span><span className="block text-xs capitalize text-neutro-500" lang="es">{r.tipo}</span><span className="mt-1 block"><HorarioBadge registro={r} /></span></span></span></td>
            {showSite && <td className="px-3 py-2.5 text-neutro-700" lang="es">{sedeNombre(r)}</td>}
            <td className="whitespace-nowrap px-3 py-2.5">{modalidad(r)}</td>
            <td className="whitespace-nowrap px-3 py-2.5"><span className="block font-medium tabular-nums text-neutro-900">{lines[0]}</span>
              {lines.slice(1).map((line) => <span key={line} className="block text-xs tabular-nums text-neutro-500">{line}</span>)}</td>
            <td className="whitespace-nowrap px-3 py-2.5 text-neutro-700">{detalles(r)}</td>
            <td className="px-3 py-1.5">{acciones(r)}</td>
          </tr>; })}
        </tbody>
      </table>
    </div>
    <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
      {recursos.map((r) => { const lines = tarifa(r); return <li key={r.id} className="flex items-center gap-3 px-3 py-3">
        {thumb(r, 'size-12')}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-neutro-900" lang="es">{r.nombre}</span>
          <span className="mt-1 block"><HorarioBadge registro={r} /></span>
          <span className="block truncate text-xs text-neutro-600"><span className="capitalize" lang="es">{r.tipo}</span> · {modalidad(r)}{showSite && <> · <span lang="es">{sedeNombre(r)}</span></>}</span>
          <span className="block truncate text-xs tabular-nums text-neutro-800">{lines.join(' · ')}{r.modalidad === 'experiencia' && detalles(r) !== '—' && ` · ${detalles(r)}`}</span>
        </span>
        {acciones(r, true)}
      </li>; })}
    </ul>
  </>;
};
