import React from 'react';
import { Building2, Eye, Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useTextosSedes } from '../textos';
import type { Sucursal } from '../types';

export const EstadoSede: React.FC<{ activa: boolean }> = ({ activa }) => {
  const t = useTextosSedes();
  return <span className={cn('inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', activa ? 'border-exito-600/20 bg-exito-50 text-exito-700' : 'border-neutro-300 bg-neutro-100 text-neutro-600')}>{activa ? t.activa : t.inactiva}</span>;
};

const Miniatura: React.FC<{ sede: Sucursal; className?: string }> = ({ sede, className }) => {
  const t = useTextosSedes();
  return sede.imagen_url
    ? <img src={sede.imagen_url} alt="" loading="lazy" className={cn('rounded-lg border border-neutro-200 object-cover', className)} />
    : <span title={t.sinFoto} className={cn('inline-flex items-center justify-center rounded-lg border border-neutro-200 bg-neutro-100 text-neutro-400', className)}><Building2 className="size-5" aria-hidden /></span>;
};

interface Props { sedes: Sucursal[]; canEdit: boolean; onView: (s: Sucursal) => void; onEdit: (s: Sucursal) => void; onToggleStatus: (s: Sucursal) => void }

/** Filas compactas: tabla desde xl y filas apiladas en pantallas menores. */
export const SedesList: React.FC<Props> = ({ sedes, canEdit, onView, onEdit, onToggleStatus }) => {
  const t = useTextosSedes();
  const acciones = (s: Sucursal) => <div className="flex flex-wrap items-center gap-2">
    <Button variant="secondary" size="sm" onClick={() => onView(s)} aria-label={t.verDe(s.nombre)}><Eye className="size-4" aria-hidden /><span className="hidden 2xl:inline">{t.ver}</span></Button>
    {canEdit && <>
      <Button variant="secondary" size="sm" onClick={() => onEdit(s)} aria-label={t.editarDe(s.nombre)}><Pencil className="size-4" aria-hidden /><span className="hidden 2xl:inline">{t.editar}</span></Button>
      <Button variant="ghost" size="sm" onClick={() => onToggleStatus(s)} aria-label={s.activa ? t.desactivarDe(s.nombre) : t.activarDe(s.nombre)} className={s.activa ? 'text-error-700 hover:bg-error-50' : 'text-exito-700 hover:bg-exito-50'}><Power className="size-4" aria-hidden /><span className="hidden 2xl:inline">{s.activa ? t.desactivar : t.activar}</span></Button></>}
  </div>;
  return <>
    <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutro-50 text-xs text-neutro-500"><tr>{Object.values(t.cols).map(h => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-neutro-100">{sedes.map(s => <tr key={s.id} className="hover:bg-neutro-50">
          <td className="px-4 py-3"><div className="flex items-center gap-3"><Miniatura sede={s} className="size-12 shrink-0" /><div className="min-w-0"><p className="font-semibold text-neutro-900">{s.nombre}</p><p className="text-xs text-neutro-500">{s.ciudad || t.noRegistrado}</p></div></div></td>
          <td className="max-w-xs px-4 py-3 text-neutro-700">{s.direccion || <span className="text-neutro-400">{t.noRegistrado}</span>}</td>
          <td className="whitespace-nowrap px-4 py-3 text-neutro-700">{s.telefono || <span className="text-neutro-400">{t.noRegistrado}</span>}</td>
          <td className="px-4 py-3"><EstadoSede activa={s.activa} /></td><td className="px-4 py-3">{acciones(s)}</td></tr>)}</tbody>
      </table>
    </div>
    <ul className="space-y-2 xl:hidden">{sedes.map(s => <li key={s.id} className="rounded-xl border border-neutro-200 bg-white p-3">
      <div className="flex items-start gap-3"><Miniatura sede={s} className="size-14 shrink-0" />
        <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-neutro-900">{s.nombre}</p><EstadoSede activa={s.activa} /></div>
          <p className="text-xs text-neutro-500">{[s.ciudad, s.direccion].filter(Boolean).join(' · ') || t.noRegistrado}</p><p className="text-xs text-neutro-500">{s.telefono || t.noRegistrado}</p></div></div>
      <div className="mt-2 border-t border-neutro-100 pt-2 [&_span.hidden]:!inline">{acciones(s)}</div>
    </li>)}</ul>
  </>;
};
