import React, { useRef, useState } from 'react';
import { Pencil, Plus, Power } from 'lucide-react';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmActionModal, readableError, useAdminList, useAdminSave } from '@/features/admin-core/workbench';
import { cn } from '@/lib/cn';
import { ClearFilters, EmptyBox, EstadoBadge, Pager, ResponsiveList, SearchField, SelectField, THead, readPage, thClass } from './common';
import { useTextosPersonal } from './textos';
import { useUrlFilters } from './useUrlFilters';
import type { Usuario } from './types';

const EMPTY = { nombre: '', email: '', telefono: '', password: '' };
type Pending = { endpoint: string; body: unknown; title: string; description: string; target: string; confirmLabel: string; destructive: boolean };

/**
 * Clientes: solo cuentas con rol cliente. Se crean siempre como cliente y no
 * se ofrece cambiar el rol, para no otorgar permisos de personal por accidente;
 * el personal se gestiona en la sección Personal.
 */
export const ClientesTab: React.FC = () => {
  const t = useTextosPersonal();
  const { params, update } = useUrlFilters();
  const usuarios = useAdminList<Usuario>('personal-usuarios', '/usuarios');
  const save = useAdminSave('personal');
  const enviando = useRef(false);
  const [editing, setEditing] = useState<Usuario | 'new' | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const clientes = (usuarios.data ?? []).filter((u) => u.rol === 'cliente');
  const q = params.get('q') ?? '';
  const estado = ['activo', 'inactivo'].includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const term = q.trim().toLowerCase();
  const filtrados = clientes.filter((u) => (!term || [u.nombre, u.email].some((v) => v?.toLowerCase().includes(term))) && (!estado || (estado === 'activo') === u.activo));
  const { page, total, slice } = readPage(params.get('pagina'), filtrados.length);

  const begin = (item: Usuario | 'new') => {
    setError(null); setSuccess(null); setEditing(item);
    setForm(item === 'new' ? { ...EMPTY } : { nombre: item.nombre, email: item.email, telefono: item.telefono ?? '', password: '' });
  };
  const close = () => { setEditing(null); setForm({ ...EMPTY }); setError(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Bloqueo síncrono: un doble clic no envía dos peticiones antes de que React actualice el estado.
    if (enviando.current || save.isPending) return;
    const isNew = editing === 'new';
    setError(null);
    if (isNew && !form.password) { setError(t.errPassword); return; }
    let body: Record<string, unknown> = { nombre: form.nombre.trim(), email: form.email.trim(), telefono: form.telefono.trim() || null };
    if (isNew) body = { ...body, rol: 'cliente', password: form.password };
    enviando.current = true;
    try {
      await save.mutateAsync({ endpoint: isNew ? '/usuarios' : `/usuarios/${(editing as Usuario).id}`, method: isNew ? 'POST' : 'PATCH', body });
      setEditing(null); setForm({ ...EMPTY }); setSuccess(t.guardado);
    } catch (e) { setError(readableError(e)); }
    finally { enviando.current = false; }
  };
  const confirm = async () => {
    if (!pending || save.isPending) return;
    setPendingError(null);
    try { await save.mutateAsync({ endpoint: pending.endpoint, method: 'PATCH', body: pending.body }); setPending(null); setSuccess(t.operacionOk); }
    catch (e) { setPendingError(readableError(e)); }
  };
  const toggleEstado = (u: Usuario) => { setPendingError(null); setPending({ endpoint: `/usuarios/${u.id}/estado`, body: { activo: !u.activo }, title: u.activo ? t.desactivarUsuario : t.reactivarUsuario, description: u.activo ? t.desactivarUsuarioDesc : t.reactivarUsuarioDesc, target: u.nombre, confirmLabel: u.activo ? t.desactivar : t.activar, destructive: u.activo }); };

  const acciones = (u: Usuario, compact = false) => {
    const cls = buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' });
    const lbl = compact ? 'sr-only' : 'hidden 2xl:inline';
    return <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
      <button type="button" onClick={() => begin(u)} aria-label={t.editar + ' ' + u.nombre} className={cls}><Pencil className="size-4" aria-hidden="true" /><span className={lbl}>{t.editar}</span></button>
      <button type="button" onClick={() => toggleEstado(u)} aria-label={(u.activo ? t.desactivar : t.activar) + ' ' + u.nombre} className={cn(cls, u.activo && 'text-error-700 hover:bg-error-50')}><Power className="size-4" aria-hidden="true" /><span className={lbl}>{u.activo ? t.desactivar : t.activar}</span></button>
    </div>;
  };

  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <p className="text-sm text-neutro-600">{usuarios.isSuccess ? t.clientesResumen(clientes.length, clientes.filter((u) => u.activo).length) : ' '}</p>
      <Button type="button" onClick={() => begin('new')} disabled={!usuarios.isSuccess}><Plus className="size-4" aria-hidden="true" />{t.nuevoCliente}</Button>
    </div>
    <p className="text-xs text-neutro-500">{t.clientesNota}</p>
    {success && <Alert tone="success"><span>{success}</span></Alert>}
    {usuarios.isPending && <LoadingNotice label={t.cargando} />}
    {usuarios.isError && <Alert tone="error"><p>{readableError(usuarios.error)}</p><Button className="mt-3" variant="secondary" onClick={() => void usuarios.refetch()}>{t.reintentar}</Button></Alert>}
    {usuarios.isSuccess && clientes.length === 0 && <EmptyBox>{t.vacioClientes}</EmptyBox>}
    {usuarios.isSuccess && clientes.length > 0 && <>
      <div className="grid gap-3 sm:grid-cols-2">
        <SearchField value={q} placeholder={t.buscarUsuario} onChange={(v) => update({ q: v || null })} />
        <SelectField label={t.estado} value={estado} onChange={(v) => update({ estado: v || null })}><option value="">{t.todosEstados}</option><option value="activo">{t.activos}</option><option value="inactivo">{t.inactivos}</option></SelectField>
      </div>
      <ClearFilters show={Boolean(q || estado)} onClick={() => update({ q: null, estado: null })} />
      {filtrados.length === 0 ? <EmptyBox>{t.sinResultados}</EmptyBox> : <>
        <ResponsiveList
          table={<table className="w-full text-left text-sm text-neutro-800">
            <THead><th scope="col" className={thClass}>{t.colU.usuario}</th><th scope="col" className={thClass}>{t.telefono}</th><th scope="col" className={thClass}>{t.colU.estado}</th><th scope="col" className={thClass}><span className="sr-only">{t.colU.acciones}</span></th></THead>
            <tbody className="divide-y divide-neutro-100">{slice(filtrados).map((u) => <tr key={u.id} className={cn('hover:bg-bronce-50/40', !u.activo && 'text-neutro-500')}>
              <td className="px-3 py-2.5"><span className="block font-semibold text-neutro-900" lang="es">{u.nombre}</span><span className="block max-w-[18rem] truncate text-xs text-neutro-500">{u.email}</span></td>
              <td className="px-3 py-2.5">{u.telefono || '—'}</td>
              <td className="px-3 py-2.5"><EstadoBadge activo={u.activo} /></td>
              <td className="px-3 py-1.5">{acciones(u)}</td>
            </tr>)}</tbody></table>}
          rows={slice(filtrados).map((u) => <li key={u.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900" lang="es">{u.nombre}</span><EstadoBadge activo={u.activo} /></span>
              <span className="block truncate text-xs text-neutro-600">{u.email}</span></span>
            {acciones(u, true)}
          </li>)} />
        <Pager page={page} total={total} count={filtrados.length} onPage={(p) => update({ pagina: p > 1 ? String(p) : null })} />
      </>}
    </>}

    <Modal open={editing !== null} onClose={close} busy={save.isPending} closeLabel={t.cerrar} title={editing === 'new' ? t.nuevoCliente : t.editar}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label={t.nombre} required minLength={2} maxLength={150} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
        <Input label={t.telefono} value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
        <div className="sm:col-span-2"><Input label={t.correo} type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
        {editing === 'new' && <div className="sm:col-span-2"><Input label={t.passwordProvisional} type="password" required minLength={8} maxLength={72} autoComplete="new-password" hint={t.passwordAyuda} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>}
        {error && <div className="sm:col-span-2"><Alert tone="error">{error}</Alert></div>}
        <div className="flex justify-end gap-3 border-t border-neutro-200 pt-4 sm:col-span-2"><Button type="button" variant="ghost" onClick={close} disabled={save.isPending}>{t.cancelar}</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? t.guardando : editing === 'new' ? t.crear : t.guardar}</Button></div>
      </form>
    </Modal>

    <ConfirmActionModal open={pending !== null} title={pending?.title ?? ''} description={pending?.description ?? ''} target={pending?.target ?? ''} confirmLabel={pending?.confirmLabel ?? t.confirmar}
      busy={save.isPending} destructive={pending?.destructive ?? true} error={pendingError} onClose={() => { setPending(null); setPendingError(null); }} onConfirm={() => void confirm()} />
  </div>;
};
