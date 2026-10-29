import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useRecursosActividadQuery } from '@/features/actividades/hooks/useActividades';
import { RecursosActividadList } from '@/features/actividades/components/RecursosActividadList';
import { RecursoActividadFormModal } from '@/features/actividades/components/RecursoActividadFormModal';
import { ActividadesAdminNav } from '@/features/actividades/components/ActividadesAdminNav';
import { useTextosGestionActividades } from '@/features/actividades/gestionTextos';
import type { RecursoActividad } from '@/features/actividades/types';
import { getApiErrorMessage } from '@/api/errors';

/**
 * Recursos de actividades recreativas: inventario filtrable por la sede global,
 * nombre, tipo, modalidad y fotografía, con acceso a sus reservas y a la edición.
 */
export const AdminRecursosActividadPage: React.FC = () => {
  const t = useTextosGestionActividades();
  const { user } = useAuth();
  const canManage = user ? hasPermission(user.rol, 'servicios.administrar') : false;
  const { selectedSedeId } = useAdminScope();
  const recursosQuery = useRecursosActividadQuery();
  const sedesQuery = useSedesQuery();
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecurso, setSelectedRecurso] = useState<RecursoActividad | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const sedes = sedesQuery.data ?? [];
  const sedesMap = useMemo(() => new Map(sedes.map((sede) => [sede.id, sede.nombre])), [sedes]);
  const sedeNombre = (r: RecursoActividad) => r.Sucursal?.nombre || (r.sucursal_id != null ? sedesMap.get(r.sucursal_id) : undefined) || `#${r.sucursal_id}`;
  // La sede la decide el selector global del panel.
  const enSede = useMemo(() => (recursosQuery.data ?? []).filter((r) => selectedSedeId === 'all' || r.sucursal_id === selectedSedeId), [recursosQuery.data, selectedSedeId]);
  const tipos = useMemo(() => [...new Set(enSede.map((r) => (r.tipo ?? '').toLowerCase()).filter(Boolean))].sort(), [enSede]);

  const q = params.get('q') ?? '';
  const tipo = tipos.includes(params.get('tipo') ?? '') ? params.get('tipo')! : '';
  const modalidad = ['por_hora', 'experiencia'].includes(params.get('modalidad') ?? '') ? params.get('modalidad')! : '';
  const imagen = ['con', 'sin'].includes(params.get('imagen') ?? '') ? params.get('imagen')! : '';
  const hasFilters = Boolean(q || tipo || modalidad || imagen);
  const term = q.trim().toLowerCase();
  const filtrados = enSede.filter((r) =>
    (!term || (r.nombre ?? '').toLowerCase().includes(term)) &&
    (!tipo || (r.tipo ?? '').toLowerCase() === tipo) &&
    (!modalidad || r.modalidad === modalidad) &&
    (!imagen || (imagen === 'con') === Boolean(r.imagen_url)));
  const sinImagen = enSede.filter((r) => !r.imagen_url).length;

  const openCreate = () => { setSelectedRecurso(null); setModalOpen(true); };
  const openEdit = (r: RecursoActividad) => { setSelectedRecurso(r); setModalOpen(true); };
  const isLoading = recursosQuery.isLoading || sedesQuery.isLoading;
  const isError = recursosQuery.isError || sedesQuery.isError;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.recursos}</h1>
          {recursosQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.recursosResumen(enSede.length, sinImagen)}</p>}
        </div>
        {canManage && <Button type="button" onClick={openCreate}><Plus className="size-4" aria-hidden="true" />{t.nuevoRecurso}</Button>}
      </header>
      <ActividadesAdminNav />

      {feedbackMessage && <Alert tone="success">
        <div className="flex items-center justify-between gap-4"><span>{feedbackMessage}</span>
          <button type="button" onClick={() => setFeedbackMessage(null)} aria-label={t.cerrar} className="rounded p-1 hover:bg-exito-100"><X className="size-4" aria-hidden="true" /></button></div>
      </Alert>}
      {isLoading && <LoadingNotice label={t.cargando} />}
      {isError && <Alert tone="error">
        <p>{getApiErrorMessage(recursosQuery.error || sedesQuery.error)}</p>
        <Button className="mt-3" variant="secondary" onClick={() => { void recursosQuery.refetch(); void sedesQuery.refetch(); }}>{t.reintentar}</Button>
      </Alert>}

      {!isLoading && !isError && enSede.length === 0 && <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.vacio}</p>}
      {!isLoading && !isError && enSede.length > 0 && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative min-w-0 sm:col-span-2 xl:col-span-1"><span className="sr-only">{t.buscar}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscar} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.tipo}</span>
            <select value={tipo} onChange={(event) => update({ tipo: event.target.value || null })} className="field-control">
              <option value="">{t.todosTipos}</option>
              {tipos.map((value) => <option key={value} value={value} lang="es">{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.modalidad}</span>
            <select value={modalidad} onChange={(event) => update({ modalidad: event.target.value || null })} className="field-control">
              <option value="">{t.todasModalidades}</option>
              <option value="por_hora">{t.modalidades.por_hora}</option>
              <option value="experiencia">{t.modalidades.experiencia}</option>
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.imagen}</span>
            <select value={imagen} onChange={(event) => update({ imagen: event.target.value || null })} className="field-control">
              <option value="">{t.todasImagenes}</option>
              <option value="con">{t.conImagen}</option>
              <option value="sin">{t.sinImagen}</option>
            </select></label>
        </div>
        {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, tipo: null, modalidad: null, imagen: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}
        {filtrados.length === 0
          ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinResultados}</p>
          : <RecursosActividadList recursos={filtrados} onEdit={openEdit} canEdit={canManage} sedeNombre={sedeNombre} showSite={selectedSedeId === 'all'} />}
      </>}

      {canManage && <RecursoActividadFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} recurso={selectedRecurso} sedes={sedes} onSuccess={setFeedbackMessage} />}
    </div>
  );
};
