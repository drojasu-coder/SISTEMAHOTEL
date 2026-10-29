import React, { useMemo, useState } from 'react';
import { Building2, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { useUrlFilters } from '@/features/personal/useUrlFilters';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { SedesList } from '@/features/sedes/components/SedesList';
import { SedeDetalle } from '@/features/sedes/components/SedeDetalle';
import { SedeFormModal } from '@/features/sedes/components/SedeFormModal';
import { SedeStatusDialog } from '@/features/sedes/components/SedeStatusDialog';
import { useTextosSedes } from '@/features/sedes/textos';
import type { Sucursal } from '@/features/sedes/types';
import { getApiErrorMessage } from '@/api/errors';

export const SedesPage: React.FC = () => {
  const t = useTextosSedes();
  const { user } = useAuth();
  const canManageSedes = user ? hasPermission(user.rol, 'configuracion.administrar') : false;
  const { data: sedes, isLoading, isError, error, refetch } = useSedesQuery();
  const { params, update } = useUrlFilters();
  const q = params.get('q') ?? '';
  const detailId = Number(params.get('sede')) || null;
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);
  const [statusSede, setStatusSede] = useState<Sucursal | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (sedes ?? []).filter(s => !term || [s.nombre, s.ciudad, s.direccion].some(v => (v ?? '').toLowerCase().includes(term)));
  }, [sedes, q]);
  const detail = sedes?.find(s => s.id === detailId) ?? null;
  const openForm = (s: Sucursal | null) => { setEditing(s); setFormOpen(true); update({ sede: null }); };
  const activeCount = (sedes ?? []).filter(s => s.activa).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-medium text-neutro-500">{t.categoria}</p>
          <h1 className="font-sans text-2xl font-semibold text-neutro-900">{t.titulo}</h1>
          {sedes && sedes.length > 0 && <p className="text-sm text-neutro-500">{t.resumen(sedes.length, activeCount)}</p>}</div>
        {canManageSedes && <Button onClick={() => openForm(null)}><Plus className="size-4" aria-hidden />{t.nueva}</Button>}
      </header>

      {feedback && <Alert tone="success"><div className="flex items-center justify-between gap-4"><span>{feedback}</span>
        <button type="button" onClick={() => setFeedback(null)} className="text-xs font-semibold underline">{t.cerrar}</button></div></Alert>}

      {isLoading && <LoadingNotice label={t.cargando} />}
      {isError && <div role="alert" className="rounded-xl border border-error-600/20 bg-error-50 p-4 text-sm text-error-700">{t.error} <span className="text-xs">{getApiErrorMessage(error)}</span> <Button variant="secondary" size="sm" onClick={() => refetch()}>{t.reintentar}</Button></div>}

      {!isLoading && !isError && sedes && sedes.length === 0 && (
        <div role="status" className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutro-300 py-10 text-center">
          <Building2 className="size-10 text-neutro-400" aria-hidden /><p className="font-semibold text-neutro-800">{t.vacio}</p>
          <p className="text-xs text-neutro-500">{canManageSedes ? t.vacioAyuda : t.vacioLectura}</p></div>)}

      {!isLoading && !isError && sedes && sedes.length > 0 && <>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-400" aria-hidden />
            <input type="search" aria-label={t.buscar} placeholder={t.buscar} value={q} onChange={e => update({ q: e.target.value || null })} className="field-control pl-9 pr-9" />
            {q && <button type="button" onClick={() => update({ q: null })} aria-label={t.limpiar} className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-neutro-500 hover:bg-neutro-100"><X className="size-4" aria-hidden /></button>}</div>
          {q && <span className="text-xs text-neutro-500">{t.mostradas(filtered.length)}</span>}
        </div>
        {filtered.length === 0
          ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 p-6 text-center text-sm text-neutro-500">{t.sinResultados}</p>
          : <SedesList sedes={filtered} canEdit={canManageSedes} onView={s => update({ sede: String(s.id) })} onEdit={s => openForm(s)} onToggleStatus={s => setStatusSede(s)} />}
      </>}

      <SedeDetalle sede={detail} canEdit={canManageSedes} onClose={() => update({ sede: null })} onEdit={s => openForm(s)} onToggleStatus={s => { update({ sede: null }); setStatusSede(s); }} />
      {canManageSedes && <>
        <SedeFormModal open={formOpen} onClose={() => setFormOpen(false)} sede={editing} onSuccess={setFeedback} />
        <SedeStatusDialog open={statusSede !== null} onClose={() => setStatusSede(null)} sede={statusSede} onSuccess={setFeedback} />
      </>}
    </div>
  );
};
