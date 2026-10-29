import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { formatAdminCalendarDate, formatAdminTimeOfDay } from '@/features/admin-core/adminDates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useMesasQuery } from '@/features/mesas/hooks/useMesas';
import { MesaFormModal } from '@/features/mesas/components/MesaFormModal';
import { MesasList, estadoMesaClase } from '@/features/mesas/components/MesasList';
import { MesaAgendaModal } from '@/features/mesas/components/MesaAgendaModal';
import { useTextosGestionMesas } from '@/features/mesas/gestionTextos';
import { useTextosMesas } from '@/features/mesas/texts';
import type { Mesa } from '@/features/mesas/types';
import { useAdminReservasMesaQuery } from '@/features/restaurante/hooks/useReservasMesa';
import { getApiErrorMessage } from '@/api/errors';
import { useLocale } from '@/i18n/LocaleContext';
import { cn } from '@/lib/cn';

const PAGE_SIZE = 25;

/**
 * Mesas del restaurante: inventario filtrable (sede global, zona, capacidad,
 * estado físico y número) con acceso a la agenda de cada mesa. El estado
 * físico no equivale a disponibilidad por fecha y hora.
 */
export const MesasPage: React.FC = () => {
  const t = useTextosGestionMesas();
  const textosMesas = useTextosMesas();
  const { locale } = useLocale();
  const { user, status } = useAuth();
  const canManageMesas = user ? hasPermission(user.rol, 'restaurante.gestionar') : false;
  const { data: mesas, isLoading, isError, error, refetch } = useMesasQuery();
  const { data: sucursales } = useSedesQuery();
  const { selectedSedeId } = useAdminScope();
  const reservas = useAdminReservasMesaQuery(user?.id, status === 'authenticated' && canManageMesas, selectedSedeId);
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    if (!('pagina' in changes)) next.delete('pagina');
    setParams(next, { replace: true });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [agendaMesa, setAgendaMesa] = useState<Mesa | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const sedeNombrePorId = useMemo(() => new Map((sucursales ?? []).map((sede) => [sede.id, sede.nombre])), [sucursales]);
  // La sede la decide el selector global del panel.
  const enSede = useMemo(() => (Array.isArray(mesas) ? mesas : []).filter((mesa) => selectedSedeId === 'all' || mesa.sucursal_id === selectedSedeId), [mesas, selectedSedeId]);
  const zonas = useMemo(() => [...new Set(enSede.map((mesa) => mesa.zona).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [enSede]);
  const capacidades = useMemo(() => [...new Set(enSede.map((mesa) => mesa.capacidad))].sort((a, b) => a - b), [enSede]);
  const estados = useMemo(() => [...new Set(enSede.map((mesa) => mesa.estado))].sort(), [enSede]);

  const q = (params.get('q') ?? '').replace(/^#/, '').trim();
  const zona = zonas.includes(params.get('zona') ?? '') ? params.get('zona')! : '';
  const capacidad = capacidades.map(String).includes(params.get('capacidad') ?? '') ? params.get('capacidad')! : '';
  const estado = estados.includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const hasFilters = Boolean(q || zona || capacidad || estado);

  const base = enSede.filter((mesa) => (!q || String(mesa.id).includes(q)) && (!zona || mesa.zona === zona) && (!capacidad || mesa.capacidad >= Number(capacidad)));
  const filtered = estado ? base.filter((mesa) => mesa.estado === estado) : base;
  const rawPage = Number(params.get('pagina'));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 ? Math.min(rawPage, totalPages) : 1;
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Próxima reserva confirmada de cada mesa (fecha y hora de Guatemala), del listado administrativo real.
  const proximaPorMesa = useMemo(() => {
    if (!reservas.data) return undefined;
    const today = getTodayInGuatemala();
    const now = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Guatemala', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date());
    const next = new Map<number, { key: string; label: string }>();
    for (const r of reservas.data) {
      if (r.estado !== 'confirmada' || r.fecha < today || (r.fecha === today && r.hora < now)) continue;
      const key = `${r.fecha} ${r.hora}`;
      const current = next.get(r.mesa_id);
      if (!current || key < current.key) next.set(r.mesa_id, { key, label: `${formatAdminCalendarDate(r.fecha, locale)} · ${formatAdminTimeOfDay(r.hora, locale)}` });
    }
    return new Map([...next].map(([id, value]) => [id, value.label]));
  }, [reservas.data, locale]);

  const plazas = enSede.reduce((sum, mesa) => sum + mesa.capacidad, 0);
  const openCreate = () => { setMesaSeleccionada(null); setModalOpen(true); };
  const openEdit = (mesa: Mesa) => { setMesaSeleccionada(mesa); setModalOpen(true); };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.mesas}</h1>
          {Array.isArray(mesas) && <p className="mt-1 text-sm text-neutro-600">{t.mesasResumen(enSede.length, plazas)}</p>}
        </div>
        {canManageMesas && <Button type="button" onClick={openCreate}><Plus className="size-4" aria-hidden="true" />{t.nueva}</Button>}
      </header>

      {feedbackMessage && <Alert tone="success">
        <div className="flex items-center justify-between gap-4"><span>{feedbackMessage}</span>
          <button type="button" onClick={() => setFeedbackMessage(null)} aria-label={t.cerrar} className="rounded p-1 hover:bg-exito-100"><X className="size-4" aria-hidden="true" /></button></div>
      </Alert>}

      {isLoading && <LoadingNotice label={textosMesas.cargando} />}
      {isError && <Alert tone="error" title={textosMesas.errorCargar}>
        <p>{getApiErrorMessage(error)}</p>
        <Button className="mt-3" variant="secondary" onClick={() => void refetch()}>{textosMesas.reintentar}</Button>
      </Alert>}

      {!isLoading && !isError && enSede.length === 0 && <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.vacio}</p>}

      {!isLoading && !isError && enSede.length > 0 && <>
        {/* Estado físico con conteo; solo los estados presentes en los datos. */}
        <div className="space-y-1.5">
          <div role="group" aria-label={t.estado} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
            {['', ...estados].map((key) => <button key={key || 'all'} type="button" aria-pressed={estado === key} onClick={() => update({ estado: key || null })}
              className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium capitalize transition-colors', estado === key ? 'bg-bronce-50 text-bronce-800' : 'text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900')}>
              {key && <span aria-hidden="true" className={cn('size-2 rounded-full border', estadoMesaClase(key))} />}
              <span lang={key ? 'es' : undefined}>{key || t.todosEstados}</span>
              <span className={cn('rounded-full px-1.5 text-xs tabular-nums', estado === key ? 'bg-bronce-600 text-white' : 'bg-neutro-100 text-neutro-700')}>{key ? base.filter((mesa) => mesa.estado === key).length : base.length}</span>
            </button>)}
          </div>
          <p className="text-xs text-neutro-500">{t.estado}: {t.estadoNota}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="relative min-w-0"><span className="sr-only">{t.buscar}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" inputMode="numeric" value={params.get('q') ?? ''} placeholder={t.buscar} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.zona}</span>
            <select value={zona} onChange={(event) => update({ zona: event.target.value || null })} className="field-control">
              <option value="">{t.todasZonas}</option>
              {zonas.map((value) => <option key={value} value={value} lang="es">{value}</option>)}
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.capacidad}</span>
            <select value={capacidad} onChange={(event) => update({ capacidad: event.target.value || null })} className="field-control">
              <option value="">{t.cualquierCapacidad}</option>
              {capacidades.map((value) => <option key={value} value={String(value)}>{t.capacidadMin(value)}</option>)}
            </select></label>
        </div>
        {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, zona: null, capacidad: null, estado: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}

        {filtered.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinResultados}</p> : <>
          <MesasList mesas={visible} canEdit={canManageMesas} onEdit={openEdit} onAgenda={setAgendaMesa} sedeNombrePorId={sedeNombrePorId}
            proximaPorMesa={proximaPorMesa} showSite={selectedSedeId === 'all'} />
          {totalPages > 1 && <nav className="flex items-center justify-between gap-3 text-xs text-neutro-600" aria-label={t.paginaDe(page, totalPages)}>
            <span>{t.pagina((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, filtered.length), filtered.length)}</span>
            <span className="flex items-center gap-1">
              <Button variant="ghost" size="sm" aria-label={t.anterior} disabled={page <= 1} onClick={() => update({ pagina: page - 1 > 1 ? String(page - 1) : null })}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
              <span className="px-1 font-medium text-neutro-900">{t.paginaDe(page, totalPages)}</span>
              <Button variant="ghost" size="sm" aria-label={t.siguiente} disabled={page >= totalPages} onClick={() => update({ pagina: String(page + 1) })}><ChevronRight className="size-4" aria-hidden="true" /></Button>
            </span>
          </nav>}
        </>}
      </>}

      {canManageMesas && <MesaFormModal open={modalOpen} onClose={() => setModalOpen(false)} mesa={mesaSeleccionada} onSuccess={setFeedbackMessage} />}
      <MesaAgendaModal key={agendaMesa?.id} mesa={agendaMesa} sede={agendaMesa ? sedeNombrePorId.get(agendaMesa.sucursal_id) : undefined}
        reservas={reservas.data ?? []} onClose={() => setAgendaMesa(null)} />
    </div>
  );
};
