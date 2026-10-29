import React, { useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmActionModal, readableError, useAdminList, useAdminSave } from '@/features/admin-core/workbench';
import { cn } from '@/lib/cn';
import { ClearFilters, EmptyBox, EstadoBadge, ResponsiveList, SearchField, SelectField, THead, thClass } from './common';
import { useTextosPersonal } from './textos';
import { useUrlFilters } from './useUrlFilters';
import type { Chofer, Vehiculo } from './types';

const TIPOS_VEHICULO = ['van', 'shuttle', 'sedan'];

/** Choferes: lista con estado y activación confirmada. */
export const ChoferesTab: React.FC = () => {
  const t = useTextosPersonal();
  const { params, update } = useUrlFilters();
  const choferes = useAdminList<Chofer>('personal-choferes', '/choferes');
  const save = useAdminSave('personal');
  const [editing, setEditing] = useState<Chofer | 'new' | null>(null);
  const [form, setForm] = useState({ nombre: '', licencia: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<Chofer | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const rows = choferes.data ?? [];
  const q = params.get('q') ?? '';
  const estado = ['activo', 'inactivo'].includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const term = q.trim().toLowerCase();
  const filtrados = rows.filter((c) => (!term || [c.nombre, c.licencia].some((v) => v?.toLowerCase().includes(term))) && (!estado || (estado === 'activo') === c.activo));
  const begin = (item: Chofer | 'new') => { setError(null); setSuccess(null); setEditing(item); setForm(item === 'new' ? { nombre: '', licencia: '' } : { nombre: item.nombre, licencia: item.licencia ?? '' }); };
  const close = () => { setEditing(null); setError(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (save.isPending) return;
    setError(null);
    const isNew = editing === 'new';
    try {
      await save.mutateAsync({ endpoint: isNew ? '/choferes' : `/choferes/${(editing as Chofer).id}`, method: isNew ? 'POST' : 'PATCH', body: { nombre: form.nombre.trim(), licencia: form.licencia.trim() || null } });
      setEditing(null); setSuccess(t.guardado);
    } catch (e) { setError(readableError(e)); }
  };
  const confirm = async () => {
    if (!pending || save.isPending) return;
    setPendingError(null);
    try { await save.mutateAsync({ endpoint: `/choferes/${pending.id}/estado`, method: 'PATCH', body: { activo: !pending.activo } }); setPending(null); setSuccess(t.operacionOk); }
    catch (e) { setPendingError(readableError(e)); }
  };
  const acciones = (c: Chofer, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <button type="button" onClick={() => begin(c)} aria-label={`${t.editar} ${c.nombre}`} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}><Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.editar}</span></button>
    <button type="button" onClick={() => { setPendingError(null); setPending(c); }} aria-label={`${c.activo ? t.desactivar : t.activar} ${c.nombre}`} className={buttonStyles({ variant: 'ghost', size: 'sm', className: cn('gap-1.5', c.activo && 'text-error-700 hover:bg-error-50') })}><Power className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{c.activo ? t.desactivar : t.activar}</span></button>
  </div>;
  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <p className="text-sm text-neutro-600">{choferes.isSuccess ? t.choferesResumen(rows.length, rows.filter((c) => c.activo).length) : ' '}</p>
      <Button type="button" onClick={() => begin('new')} disabled={!choferes.isSuccess}><Plus className="size-4" aria-hidden="true" />{t.nuevoChofer}</Button>
    </div>
    {success && <Alert tone="success"><span>{success}</span></Alert>}
    {choferes.isPending && <LoadingNotice label={t.cargando} />}
    {choferes.isError && <Alert tone="error"><p>{readableError(choferes.error)}</p><Button className="mt-3" variant="secondary" onClick={() => void choferes.refetch()}>{t.reintentar}</Button></Alert>}
    {choferes.isSuccess && rows.length === 0 && <EmptyBox>{t.vacioC}</EmptyBox>}
    {choferes.isSuccess && rows.length > 0 && <>
      <div className="grid gap-3 sm:grid-cols-2"><SearchField value={q} placeholder={t.buscarChofer} onChange={(v) => update({ q: v || null })} />
        <SelectField label={t.estado} value={estado} onChange={(v) => update({ estado: v || null })}><option value="">{t.todosEstados}</option><option value="activo">{t.activos}</option><option value="inactivo">{t.inactivos}</option></SelectField></div>
      <ClearFilters show={Boolean(q || estado)} onClick={() => update({ q: null, estado: null })} />
      {filtrados.length === 0 ? <EmptyBox>{t.sinResultados}</EmptyBox> : <ResponsiveList
        table={<table className="w-full text-left text-sm text-neutro-800"><THead><th scope="col" className={thClass}>{t.colC.chofer}</th><th scope="col" className={thClass}>{t.colC.licencia}</th><th scope="col" className={thClass}>{t.colC.estado}</th><th scope="col" className={thClass}><span className="sr-only">{t.colC.acciones}</span></th></THead>
          <tbody className="divide-y divide-neutro-100">{filtrados.map((c) => <tr key={c.id} className="hover:bg-bronce-50/40"><td className="px-3 py-2.5 font-semibold text-neutro-900" lang="es">{c.nombre}</td><td className="px-3 py-2.5">{c.licencia || <span className="text-neutro-400">{t.sinRegistrar}</span>}</td><td className="px-3 py-2.5"><EstadoBadge activo={c.activo} /></td><td className="px-3 py-1.5">{acciones(c)}</td></tr>)}</tbody></table>}
        rows={filtrados.map((c) => <li key={c.id} className="flex items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900" lang="es">{c.nombre}</span><EstadoBadge activo={c.activo} /></span><span className="block text-xs text-neutro-600">{c.licencia || t.sinRegistrar}</span></span>{acciones(c, true)}</li>)} />}
    </>}
    <Modal open={editing !== null} onClose={close} busy={save.isPending} closeLabel={t.cerrar} title={editing === 'new' ? t.nuevoChofer : t.editar}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label={t.nombre} required minLength={2} maxLength={150} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
        <Input label={t.licencia} maxLength={50} value={form.licencia} onChange={(e) => setForm((f) => ({ ...f, licencia: e.target.value }))} />
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-3 border-t border-neutro-200 pt-4"><Button type="button" variant="ghost" onClick={close} disabled={save.isPending}>{t.cancelar}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t.guardando : editing === 'new' ? t.crear : t.guardar}</Button></div>
      </form>
    </Modal>
    <ConfirmActionModal open={pending !== null} title={pending?.activo ? t.desactivarChofer : t.reactivarChofer} description={t.choferEstadoDesc} target={pending?.nombre ?? ''} confirmLabel={pending?.activo ? t.desactivar : t.activar}
      busy={save.isPending} destructive={Boolean(pending?.activo)} error={pendingError} onClose={() => { setPending(null); setPendingError(null); }} onConfirm={() => void confirm()} />
  </div>;
};

/** Vehículos: tipo, placa y capacidad. */
export const VehiculosTab: React.FC = () => {
  const t = useTextosPersonal();
  const { params, update } = useUrlFilters();
  const vehiculos = useAdminList<Vehiculo>('personal-vehiculos', '/vehiculos');
  const save = useAdminSave('personal');
  const [editing, setEditing] = useState<Vehiculo | 'new' | null>(null);
  const [form, setForm] = useState({ tipo: 'van', capacidad: '4', placa: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Vehiculo | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const rows = vehiculos.data ?? [];
  const tipos = [...new Set(rows.map((v) => v.tipo))].sort();
  const q = params.get('q') ?? '';
  const tipo = tipos.includes(params.get('tipo') ?? '') ? params.get('tipo')! : '';
  const term = q.trim().toLowerCase();
  const filtrados = rows.filter((v) => (!term || [v.placa, v.tipo].some((x) => x?.toLowerCase().includes(term))) && (!tipo || v.tipo === tipo));
  const begin = (item: Vehiculo | 'new') => { setError(null); setSuccess(null); setEditing(item); setForm(item === 'new' ? { tipo: 'van', capacidad: '4', placa: '' } : { tipo: item.tipo, capacidad: String(item.capacidad), placa: item.placa ?? '' }); };
  const close = () => { setEditing(null); setError(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (save.isPending) return;
    setError(null);
    const isNew = editing === 'new';
    const capacidad = Number(form.capacidad);
    if (!Number.isSafeInteger(capacidad) || capacidad < 1) { setError(t.errCapacidad); return; }
    try {
      await save.mutateAsync({ endpoint: isNew ? '/vehiculos' : `/vehiculos/${(editing as Vehiculo).id}`, method: isNew ? 'POST' : 'PATCH', body: { tipo: form.tipo, capacidad, placa: form.placa.trim() || null } });
      setEditing(null); setSuccess(t.guardado);
    } catch (e) { setError(readableError(e)); }
  };
  const confirmDelete = async () => {
    if (!toDelete || save.isPending) return;
    setDeleteError(null);
    try { await save.mutateAsync({ endpoint: `/vehiculos/${toDelete.id}`, method: 'DELETE' }); setToDelete(null); setSuccess(t.operacionOk); }
    catch (e) { setDeleteError(readableError(e)); }
  };
  const nombre = (v: Vehiculo) => `${v.tipo.toUpperCase()} · ${v.placa || t.sinPlaca}`;
  const acciones = (v: Vehiculo, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <button type="button" onClick={() => begin(v)} aria-label={`${t.editar} ${nombre(v)}`} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}><Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.editar}</span></button>
    <button type="button" onClick={() => { setDeleteError(null); setToDelete(v); }} aria-label={`${t.eliminar} ${nombre(v)}`} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5 text-error-700 hover:bg-error-50' })}><Trash2 className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.eliminar}</span></button>
  </div>;
  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <p className="text-sm text-neutro-600">{vehiculos.isSuccess ? t.vehiculosResumen(rows.length) : ' '}</p>
      <Button type="button" onClick={() => begin('new')} disabled={!vehiculos.isSuccess}><Plus className="size-4" aria-hidden="true" />{t.nuevoVehiculo}</Button>
    </div>
    {success && <Alert tone="success"><span>{success}</span></Alert>}
    {vehiculos.isPending && <LoadingNotice label={t.cargando} />}
    {vehiculos.isError && <Alert tone="error"><p>{readableError(vehiculos.error)}</p><Button className="mt-3" variant="secondary" onClick={() => void vehiculos.refetch()}>{t.reintentar}</Button></Alert>}
    {vehiculos.isSuccess && rows.length === 0 && <EmptyBox>{t.vacioV}</EmptyBox>}
    {vehiculos.isSuccess && rows.length > 0 && <>
      <div className="grid gap-3 sm:grid-cols-2"><SearchField value={q} placeholder={t.buscarVehiculo} onChange={(v) => update({ q: v || null })} />
        <SelectField label={t.tipoVehiculo} value={tipo} onChange={(v) => update({ tipo: v || null })}><option value="">{t.todosTipos}</option>{tipos.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}</SelectField></div>
      <ClearFilters show={Boolean(q || tipo)} onClick={() => update({ q: null, tipo: null })} />
      {filtrados.length === 0 ? <EmptyBox>{t.sinResultados}</EmptyBox> : <ResponsiveList
        table={<table className="w-full text-left text-sm text-neutro-800"><THead><th scope="col" className={thClass}>{t.colV.tipo}</th><th scope="col" className={thClass}>{t.colV.placa}</th><th scope="col" className={thClass}>{t.colV.capacidad}</th><th scope="col" className={thClass}><span className="sr-only">{t.colV.acciones}</span></th></THead>
          <tbody className="divide-y divide-neutro-100">{filtrados.map((v) => <tr key={v.id} className="hover:bg-bronce-50/40"><td className="px-3 py-2.5 font-semibold text-neutro-900">{v.tipo.toUpperCase()}</td><td className="px-3 py-2.5">{v.placa || <span className="text-neutro-400">{t.sinPlaca}</span>}</td><td className="px-3 py-2.5">{t.pasajeros(v.capacidad)}</td><td className="px-3 py-1.5">{acciones(v)}</td></tr>)}</tbody></table>}
        rows={filtrados.map((v) => <li key={v.id} className="flex items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><span className="block font-semibold text-neutro-900">{nombre(v)}</span><span className="block text-xs text-neutro-600">{t.pasajeros(v.capacidad)}</span></span>{acciones(v, true)}</li>)} />}
    </>}
    <Modal open={editing !== null} onClose={close} busy={save.isPending} closeLabel={t.cerrar} title={editing === 'new' ? t.nuevoVehiculo : t.editar}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutro-700">{t.tipoVehiculo}<select className="field-control" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>{TIPOS_VEHICULO.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}</select></label>
        <div className="grid gap-3 sm:grid-cols-2"><Input label={t.capacidadLabel} type="number" min={1} step={1} required value={form.capacidad} onChange={(e) => setForm((f) => ({ ...f, capacidad: e.target.value }))} /><Input label={t.placa} maxLength={20} value={form.placa} onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value }))} /></div>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-3 border-t border-neutro-200 pt-4"><Button type="button" variant="ghost" onClick={close} disabled={save.isPending}>{t.cancelar}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t.guardando : editing === 'new' ? t.crear : t.guardar}</Button></div>
      </form>
    </Modal>
    <ConfirmActionModal open={toDelete !== null} title={t.eliminarVehiculoTitulo} description={t.eliminarVehiculoDesc} target={toDelete ? nombre(toDelete) : ''} confirmLabel={t.eliminar}
      busy={save.isPending} destructive error={deleteError} onClose={() => { setToDelete(null); setDeleteError(null); }} onConfirm={() => void confirmDelete()} />
  </div>;
};
