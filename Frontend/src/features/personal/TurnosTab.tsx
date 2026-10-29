import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { ConfirmActionModal, readableError, useAdminList, useAdminSave } from '@/features/admin-core/workbench';
import { formatAdminCalendarDate, formatAdminTimeOfDay } from '@/features/admin-core/adminDates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useLocale } from '@/i18n/LocaleContext';
import { cn } from '@/lib/cn';
import { ClearFilters, EmptyBox, Pager, ResponsiveList, SearchField, SelectField, THead, readPage, thClass } from './common';
import { useTextosPersonal } from './textos';
import { useUrlFilters } from './useUrlFilters';
import type { Empleado, Sucursal, Turno } from './types';

const VISTAS = ['hoy', 'proximos', 'historial'] as const;
type Vista = typeof VISTAS[number];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMPTY = { empleado_id: '', fecha: '', hora_inicio: '08:00', hora_fin: '16:00' };

/** Turnos por empleado: hoy, próximos e historial, filtrados por la sede global (sede del empleado), empleado y fecha. */
export const TurnosTab: React.FC = () => {
  const t = useTextosPersonal();
  const { locale } = useLocale();
  const scope = useAdminScope();
  const { params, update } = useUrlFilters();
  const turnos = useAdminList<Turno>('personal-turnos', '/turnos');
  const empleados = useAdminList<Empleado>('personal-empleados', '/empleados');
  const sucursales = useAdminList<Sucursal>('personal-sucursales', '/sucursales');
  const save = useAdminSave('personal');
  const [editing, setEditing] = useState<Turno | 'new' | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Turno | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const empMap = useMemo(() => new Map((empleados.data ?? []).map((e) => [e.id, e])), [empleados.data]);
  const empNombre = (id: number) => empMap.get(id)?.Usuario?.nombre ?? `#${id}`;
  const sedeNombre = (id?: number) => (id == null ? '—' : sucursales.data?.find((s) => s.id === id)?.nombre ?? `#${id}`);
  const enSede = useMemo(() => (turnos.data ?? []).filter((x) => {
    if (scope.selectedSedeId === 'all') return true;
    const e = empMap.get(x.empleado_id);
    return Boolean(e && (e.sucursal_id === scope.selectedSedeId || e.sedesAdicionales?.some((s) => s.sucursal_id === scope.selectedSedeId)));
  }), [turnos.data, empMap, scope.selectedSedeId]);
  const empleadosEnSede = (empleados.data ?? []).filter((e) => scope.selectedSedeId === 'all' || e.sucursal_id === scope.selectedSedeId);

  const today = getTodayInGuatemala();
  const porVista = useMemo(() => {
    const asc = (a: Turno, b: Turno) => `${a.fecha} ${a.hora_inicio}`.localeCompare(`${b.fecha} ${b.hora_inicio}`) || a.id - b.id;
    return {
      hoy: enSede.filter((x) => x.fecha.slice(0, 10) === today).sort(asc),
      proximos: enSede.filter((x) => x.fecha.slice(0, 10) > today).sort(asc),
      historial: enSede.filter((x) => x.fecha.slice(0, 10) < today).sort((a, b) => asc(b, a)),
    } satisfies Record<Vista, Turno[]>;
  }, [enSede, today]);

  const vista: Vista = (VISTAS as readonly string[]).includes(params.get('vista') ?? '') ? params.get('vista') as Vista : 'hoy';
  const q = params.get('q') ?? '';
  const empleadoFiltro = /^[1-9]\d*$/.test(params.get('empleado') ?? '') ? Number(params.get('empleado')) : null;
  const fecha = ISO_DATE.test(params.get('fecha') ?? '') ? params.get('fecha')! : '';
  const term = q.trim().toLowerCase();
  const filtrados = porVista[vista].filter((x) => (!term || empNombre(x.empleado_id).toLowerCase().includes(term)) && (empleadoFiltro === null || x.empleado_id === empleadoFiltro) && (!fecha || x.fecha.slice(0, 10) === fecha));
  const hasFilters = Boolean(q || fecha || empleadoFiltro);
  const { page, total, slice } = readPage(params.get('pagina'), filtrados.length);
  const date = (v: string) => formatAdminCalendarDate(v.slice(0, 10), locale);
  const hora = (v: string) => formatAdminTimeOfDay(v, locale);
  const nocturno = (x: Turno) => x.hora_fin.slice(0, 5) <= x.hora_inicio.slice(0, 5);

  const begin = (item: Turno | 'new') => {
    setError(null); setSuccess(null); setEditing(item);
    setForm(item === 'new' ? { ...EMPTY, empleado_id: empleadoFiltro ? String(empleadoFiltro) : '', fecha: today } : { empleado_id: String(item.empleado_id), fecha: item.fecha.slice(0, 10), hora_inicio: item.hora_inicio.slice(0, 5), hora_fin: item.hora_fin.slice(0, 5) });
  };
  const close = () => { setEditing(null); setError(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (save.isPending) return;
    setError(null);
    const isNew = editing === 'new';
    if (isNew && !(Number.isInteger(Number(form.empleado_id)) && Number(form.empleado_id) > 0)) { setError(t.errEmpleado); return; }
    const body: Record<string, unknown> = { fecha: form.fecha, hora_inicio: form.hora_inicio, hora_fin: form.hora_fin };
    if (isNew) body.empleado_id = Number(form.empleado_id);
    try {
      await save.mutateAsync({ endpoint: isNew ? '/turnos' : `/turnos/${(editing as Turno).id}`, method: isNew ? 'POST' : 'PATCH', body });
      setEditing(null); setSuccess(t.guardado);
    } catch (e) { setError(readableError(e)); }
  };
  const confirmDelete = async () => {
    if (!toDelete || save.isPending) return;
    setDeleteError(null);
    try { await save.mutateAsync({ endpoint: `/turnos/${toDelete.id}`, method: 'DELETE' }); setToDelete(null); setSuccess(t.operacionOk); }
    catch (e) { setDeleteError(readableError(e)); }
  };
  const acciones = (x: Turno, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <button type="button" onClick={() => begin(x)} aria-label={`${t.editar} #${x.id}`} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}><Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.editar}</span></button>
    <button type="button" onClick={() => { setDeleteError(null); setToDelete(x); }} aria-label={`${t.eliminar} #${x.id}`} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5 text-error-700 hover:bg-error-50' })}><Trash2 className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.eliminar}</span></button>
  </div>;

  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <p className="text-sm text-neutro-600">{turnos.isSuccess ? t.turnosResumen(enSede.length) : ' '}</p>
      <Button type="button" onClick={() => begin('new')} disabled={!turnos.isSuccess || !empleados.isSuccess}><Plus className="size-4" aria-hidden="true" />{t.nuevoTurno}</Button>
    </div>
    {success && <Alert tone="success"><span>{success}</span></Alert>}
    {turnos.isPending && <LoadingNotice label={t.cargando} />}
    {turnos.isError && <Alert tone="error"><p>{readableError(turnos.error)}</p><Button className="mt-3" variant="secondary" onClick={() => void turnos.refetch()}>{t.reintentar}</Button></Alert>}
    {turnos.isSuccess && <>
      <div role="group" aria-label={t.vistasLabel} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
        {VISTAS.map((key) => <button key={key} type="button" aria-pressed={vista === key} onClick={() => update({ vista: key === 'hoy' ? null : key })}
          className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors', vista === key ? 'bg-bronce-50 text-bronce-800' : 'text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900')}>
          {t.vistas[key]}<span className={cn('rounded-full px-1.5 text-xs tabular-nums', vista === key ? 'bg-bronce-600 text-white' : 'bg-neutro-100 text-neutro-700')}>{porVista[key].length}</span></button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <SearchField value={q} placeholder={t.buscarTurno} onChange={(v) => update({ q: v || null })} />
        <SelectField label={t.empleado} value={empleadoFiltro ? String(empleadoFiltro) : ''} onChange={(v) => update({ empleado: v || null })}><option value="">{t.todosEmpleados}</option>{empleadosEnSede.map((e) => <option key={e.id} value={e.id} lang="es">{e.Usuario?.nombre ?? `#${e.id}`}</option>)}</SelectField>
        {vista !== 'hoy' && <label className="min-w-0"><span className="sr-only">{t.fecha}</span><input type="date" aria-label={t.fecha} value={fecha} onChange={(e) => update({ fecha: e.target.value || null })} className="field-control" /></label>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {empleadoFiltro !== null && <button type="button" onClick={() => update({ empleado: null })} aria-label={t.limpiar} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bronce-200 bg-bronce-50 px-3 text-xs font-medium text-bronce-800 hover:border-bronce-400"><span lang="es">{empNombre(empleadoFiltro)}</span><X className="size-3.5" aria-hidden="true" /></button>}
        <ClearFilters show={hasFilters} onClick={() => update({ q: null, fecha: null, empleado: null })} />
      </div>
      {filtrados.length === 0 ? <EmptyBox>{hasFilters ? t.sinResultados : t.vacioT[vista]}</EmptyBox> : <>
        <ResponsiveList
          table={<table className="w-full text-left text-sm text-neutro-800"><caption className="sr-only">{t.vistas[vista]}</caption>
            <THead><th scope="col" className={thClass}>{t.colT.fecha}</th><th scope="col" className={thClass}>{t.colT.horario}</th><th scope="col" className={thClass}>{t.colT.empleado}</th><th scope="col" className={thClass}>{t.colT.sede}</th><th scope="col" className={thClass}><span className="sr-only">{t.colT.acciones}</span></th></THead>
            <tbody className="divide-y divide-neutro-100">{slice(filtrados).map((x) => <tr key={x.id} className="hover:bg-bronce-50/40">
              <td className={cn('whitespace-nowrap px-3 py-2.5 font-medium', x.fecha.slice(0, 10) === today ? 'text-bronce-800' : 'text-neutro-900')}>{date(x.fecha)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{hora(x.hora_inicio)} – {hora(x.hora_fin)}{nocturno(x) && <span className="block text-xs text-neutro-500">{t.nocturno}</span>}</td>
              <td className="px-3 py-2.5 font-semibold text-neutro-900" lang="es">{empNombre(x.empleado_id)}</td>
              <td className="px-3 py-2.5" lang="es">{sedeNombre(empMap.get(x.empleado_id)?.sucursal_id)}</td>
              <td className="px-3 py-1.5">{acciones(x)}</td></tr>)}</tbody></table>}
          rows={slice(filtrados).map((x) => <li key={x.id} className="flex items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-neutro-900">{date(x.fecha)} · {hora(x.hora_inicio)} – {hora(x.hora_fin)}</span>
            <span className="block truncate text-xs text-neutro-600" lang="es">{empNombre(x.empleado_id)} · {sedeNombre(empMap.get(x.empleado_id)?.sucursal_id)}{nocturno(x) && ` · ${t.nocturno}`}</span></span>{acciones(x, true)}</li>)} />
        <Pager page={page} total={total} count={filtrados.length} onPage={(p) => update({ pagina: p > 1 ? String(p) : null })} />
      </>}
    </>}

    <Modal open={editing !== null} onClose={close} busy={save.isPending} closeLabel={t.cerrar} title={editing === 'new' ? t.nuevoTurno : t.editar}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {editing === 'new'
          ? <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutro-700">{t.empleado}
            <select className="field-control" value={form.empleado_id} onChange={(e) => setForm((f) => ({ ...f, empleado_id: e.target.value }))}>
              <option value="">{t.elegirUsuario}</option>{(empleados.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.Usuario?.nombre ?? `#${e.id}`} · {e.area}</option>)}</select></label>
          : <p className="text-sm font-semibold text-neutro-900" lang="es">{editing !== null && empNombre(editing.empleado_id)}</p>}
        <Input label={t.fechaTurno} type="date" required value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3"><Input label={t.horaInicio} type="time" required value={form.hora_inicio} onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))} /><Input label={t.horaFin} type="time" required value={form.hora_fin} onChange={(e) => setForm((f) => ({ ...f, hora_fin: e.target.value }))} /></div>
        <p className="text-xs text-neutro-500">{t.turnoNota}</p>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-3 border-t border-neutro-200 pt-4"><Button type="button" variant="ghost" onClick={close} disabled={save.isPending}>{t.cancelar}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t.guardando : editing === 'new' ? t.crear : t.guardar}</Button></div>
      </form>
    </Modal>
    <ConfirmActionModal open={toDelete !== null} title={t.eliminarTurnoTitulo} description={t.eliminarTurnoDesc} target={toDelete ? `${empNombre(toDelete.empleado_id)} · ${date(toDelete.fecha)}` : ''} confirmLabel={t.eliminar}
      busy={save.isPending} destructive error={deleteError} onClose={() => { setToDelete(null); setDeleteError(null); }} onConfirm={() => void confirmDelete()} />
  </div>;
};
