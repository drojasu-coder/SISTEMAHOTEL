import React from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useTextosPersonal } from './textos';

export const PAGE_SIZE = 25;

export function EstadoBadge({ activo }: { activo: boolean }) {
  const t = useTextosPersonal();
  return <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', activo ? 'border-exito-600/20 bg-exito-50 text-exito-700' : 'border-neutro-300 bg-neutro-100 text-neutro-600')}>{activo ? t.activo : t.inactivo}</span>;
}

export function EmptyBox({ children }: { children: React.ReactNode }) {
  return <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{children}</p>;
}

export function SearchField({ value, placeholder, onChange, className }: { value: string; placeholder: string; onChange: (value: string) => void; className?: string }) {
  return <label className={cn('relative min-w-0', className)}><span className="sr-only">{placeholder}</span>
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
    <input type="search" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="field-control !pl-9" /></label>;
}

export function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="min-w-0"><span className="sr-only">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="field-control">{children}</select></label>;
}

export function ClearFilters({ show, onClick }: { show: boolean; onClick: () => void }) {
  const t = useTextosPersonal();
  return show ? <div><Button variant="text" size="sm" onClick={onClick}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div> : null;
}

export function Pager({ page, total, count, onPage }: { page: number; total: number; count: number; onPage: (page: number) => void }) {
  const t = useTextosPersonal();
  if (total <= 1) return null;
  return <nav className="flex items-center justify-between gap-3 text-xs text-neutro-600" aria-label={t.paginaDe(page, total)}>
    <span>{t.pagina((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, count), count)}</span>
    <span className="flex items-center gap-1">
      <Button variant="ghost" size="sm" aria-label={t.anterior} disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
      <span className="px-1 font-medium text-neutro-900">{t.paginaDe(page, total)}</span>
      <Button variant="ghost" size="sm" aria-label={t.siguiente} disabled={page >= total} onClick={() => onPage(page + 1)}><ChevronRight className="size-4" aria-hidden="true" /></Button>
    </span>
  </nav>;
}

/** Normaliza el número de página de la URL dentro del rango válido. */
export function readPage(raw: string | null, totalItems: number) {
  const total = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const value = Number(raw);
  const page = Number.isSafeInteger(value) && value >= 1 ? Math.min(value, total) : 1;
  return { page, total, slice: <T,>(items: T[]) => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}

/** Tabla en escritorio (xl) y filas apiladas en pantallas menores; mismo patrón que los demás módulos. */
export function ResponsiveList({ table, rows }: { table: React.ReactNode; rows: React.ReactNode }) {
  return <>
    <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">{table}</div>
    <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">{rows}</ul>
  </>;
}

export const thClass = 'px-3 py-3';
export const THead = ({ children }: { children: React.ReactNode }) => <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600"><tr>{children}</tr></thead>;
