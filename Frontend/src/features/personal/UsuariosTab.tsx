import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, IdCard, Pencil, Plus, Power, UserCog } from 'lucide-react';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/AuthContext';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { ConfirmActionModal, readableError, useAdminList, useAdminSave } from '@/features/admin-core/workbench';
import { cn } from '@/lib/cn';
import { ClearFilters, EmptyBox, EstadoBadge, Pager, ResponsiveList, SearchField, SelectField, THead, readPage, thClass } from './common';
import { useTextosPersonal } from './textos';
import { useUrlFilters } from './useUrlFilters';
import { ASSIGNABLE_ROLES, STAFF_ROLES, type Empleado, type Sucursal, type Usuario } from './types';

const EMPTY = { nombre: '', email: '', telefono: '', rol: 'cliente', password: '' };
type Pending = { endpoint: string; body: unknown; title: string; description: string; target: string; confirmLabel: string; destructive: boolean };

/**
 * Cuentas de acceso. Solo el administrador general las gestiona (como en el
 * servidor). La ficha de empleado se crea desde «Empleados»; aquí «Crear ficha»
 * lleva allí con la cuenta ya elegida, para no repetir pasos.
 */
export const UsuariosTab: React.FC = () => {
  const t = useTextosPersonal();
  const { user } = useAuth();
  const scope = useAdminScope();
  const { params, update } = useUrlFilters();
  const usuarios = useAdminList<Usuario>('personal-usuarios', '/usuarios');
  const empleados = useAdminList<Empleado>('personal-empleados', '/empleados');
  const sucursales = useAdminList<Sucursal>('personal-sucursales', '/sucursales');
  const save = useAdminSave('personal');
  const [editing, setEditing] = useState<Usuario | 'new' | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roleUser, setRoleUser] = useState<Usuario | null>(null);
  const [newRole, setNewRole] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const fichaDe = useMemo(() => new Map((empleados.data ?? []).map((e) => [e.usuario_id, e])), [empleados.data]);
  const sedeNombre = (id: number) => sucursales.data?.find((s) => s.id === id)?.nombre ?? `#${id}`;
  const rows = usuarios.data ?? [];
  // Con una sede elegida solo se ven las cuentas de su personal (las demás no pertenecen a ninguna sede).
  const enSede = useMemo(() => rows.filter((u) => {
    if (scope.selectedSedeId === 'all') return true;
    const f = fichaDe.get(u.id);
    return Boolean(f && (f.sucursal_id === scope.selectedSedeId || f.sedesAdicionales?.some((s) => s.sucursal_id === scope.selectedSedeId)));
  }), [rows, fichaDe, scope.selectedSedeId]);
  const roles = [...new Set(enSede.map((u) => u.rol))];

  const q = params.get('q') ?? '';
  const rol = roles.includes(params.get('rol') ?? '') ? params.get('rol')! : '';
  const estado = ['activo', 'inactivo'].includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const hasFilters = Boolean(q || rol || estado);
  const term = q.trim().toLowerCase();
  const filtrados = enSede.filter((u) => (!term || [u.nombre, u.email].some((v) => v?.toLowerCase().includes(term))) && (!rol || u.rol === rol) && (!estado || (estado === 'activo') === u.activo));
  const { page, total, slice } = readPage(params.get('pagina'), filtrados.length);
  const rolLabel = (r: string) => t.roles[r] ?? r;

  const begin = (item: Usuario | 'new') => {
    setError(null); setSuccess(null); setEditing(item);
    setForm(item === 'new' ? { ...EMPTY } : { nombre: item.nombre, email: item.email, telefono: item.telefono ?? '', rol: item.rol, password: '' });
  };
  const close = () => { setEditing(null); setForm({ ...EMPTY }); setError(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (save.isPending) return;
    const isNew = editing === 'new';
    setError(null);
    if (isNew && !form.password) { setError(t.errPassword); return; }
    let body: Record<string, unknown> = { nombre: form.nombre.trim(), email: form.email.trim(), telefono: form.telefono.trim() || null };
    if (isNew) body = { ...body, rol: form.rol, password: form.password };
    try {
      await save.mutateAsync({ endpoint: isNew ? '/usuarios' : `/usuarios/${(editing as Usuario).id}`, method: isNew ? 'POST' : 'PATCH', body });
      setEditing(null); setForm({ ...EMPTY }); setSuccess(t.guardado);
    } catch (e) { setError(readableError(e)); }
  };
  const confirm = async () => {
    if (!pending || save.isPending) return;
    setPendingError(null);
    try { await save.mutateAsync({ endpoint: pending.endpoint, method: 'PATCH', body: pending.body }); setPending(null); setSuccess(t.operacionOk); }
    catch (e) { setPendingError(readableError(e)); }
  };
  const toggleEstado = (u: Usuario) => { setPendingError(null); setPending({ endpoint: `/usuarios/${u.id}/estado`, body: { activo: !u.activo }, title: u.activo ? t.desactivarUsuario : t.reactivarUsuario, description: u.activo ? t.desactivarUsuarioDesc : t.reactivarUsuarioDesc, target: u.nombre, confirmLabel: u.activo ? t.desactivar : t.activar, destructive: u.activo }); };

  const acciones = (u: Usuario, compact = false) => {
    const own = u.id === user?.id;
    const puedeFicha = STAFF_ROLES.some((rol) => rol === u.rol) && u.activo && !fichaDe.has(u.id);
    const cls = buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' });
    const lbl = compact ? 'sr-only' : 'hidden 2xl:inline';
    return <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
      {puedeFicha && <Link to={`?seccion=empleados&nuevo=${u.id}`} aria-label={t.crearFichaDe(u.nombre)} className={cls}><IdCard className="size-4" aria-hidden="true" /><span className={lbl}>{t.crearFicha}</span></Link>}
      <button type="button" onClick={() => begin(u)} aria-label={t.editar + ' ' + u.nombre} className={cls}><Pencil className="size-4" aria-hidden="true" /><span className={lbl}>{t.editar}</span></button>
      <button type="button" disabled={own} title={own ? t.cuentaPropia : undefined} onClick={() => { setRoleUser(u); setNewRole(u.rol); }} aria-label={t.cambiarRolDe(u.nombre)} className={cls}><UserCog className="size-4" aria-hidden="true" /><span className={lbl}>{t.cambiarRol}</span></button>
      <button type="button" disabled={own && u.activo} title={own && u.activo ? t.cuentaPropia : undefined} onClick={() => toggleEstado(u)} aria-label={(u.activo ? t.desactivar : t.activar) + ' ' + u.nombre} className={cn(cls, u.activo && 'text-error-700 hover:bg-error-50')}><Power className="size-4" aria-hidden="true" /><span className={lbl}>{u.activo ? t.desactivar : t.activar}</span></button>
    </div>;
  };
  const ficha = (u: Usuario) => { const f = fichaDe.get(u.id); return f
    ? <Link to={`?seccion=empleados&q=${encodeURIComponent(u.email)}`} aria-label={t.verFicha(u.nombre)} className="inline-flex items-center gap-1.5 text-bronce-700 hover:underline"><BadgeCheck className="size-4" aria-hidden="true" /><span lang="es">{f.Sucursal?.nombre ?? sedeNombre(f.sucursal_id)} · {f.area}</span></Link>
    : <span className="text-neutro-400">{t.sinFicha}</span>; };

  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <p className="text-sm text-neutro-600">{usuarios.isSuccess ? t.usuariosResumen(enSede.length, enSede.filter((u) => u.activo).length) : ' '}</p>
      <div className="flex flex-wrap gap-2">
        <Link to="?seccion=empleados&nuevo=cuenta" className={buttonStyles({ variant: 'secondary' })}><Plus className="size-4" aria-hidden="true" />{t.nuevoEmpleado}</Link>
        <Button type="button" onClick={() => begin('new')} disabled={!usuarios.isSuccess}><Plus className="size-4" aria-hidden="true" />{t.nuevoUsuario}</Button>
      </div>
    </div>
    {success && <Alert tone="success"><span>{success}</span></Alert>}
    {usuarios.isPending && <LoadingNotice label={t.cargando} />}
    {usuarios.isError && <Alert tone="error"><p>{readableError(usuarios.error)}</p><Button className="mt-3" variant="secondary" onClick={() => void usuarios.refetch()}>{t.reintentar}</Button></Alert>}
    {usuarios.isSuccess && enSede.length === 0 && <EmptyBox>{t.vacioU}</EmptyBox>}
    {usuarios.isSuccess && enSede.length > 0 && <>
      <div className="grid gap-3 sm:grid-cols-3">
        <SearchField value={q} placeholder={t.buscarUsuario} onChange={(v) => update({ q: v || null })} />
        <SelectField label={t.rol} value={rol} onChange={(v) => update({ rol: v || null })}><option value="">{t.todosRoles}</option>{roles.map((r) => <option key={r} value={r}>{rolLabel(r)}</option>)}</SelectField>
        <SelectField label={t.estado} value={estado} onChange={(v) => update({ estado: v || null })}><option value="">{t.todosEstados}</option><option value="activo">{t.activos}</option><option value="inactivo">{t.inactivos}</option></SelectField>
      </div>
      <ClearFilters show={hasFilters} onClick={() => update({ q: null, rol: null, estado: null })} />
      {scope.selectedSedeId !== 'all' && <p className="text-xs text-neutro-500">{t.soloSedeNota}</p>}
      {filtrados.length === 0 ? <EmptyBox>{t.sinResultados}</EmptyBox> : <>
        <ResponsiveList
          table={<table className="w-full text-left text-sm text-neutro-800">
            <THead><th scope="col" className={thClass}>{t.colU.usuario}</th><th scope="col" className={thClass}>{t.colU.rol}</th><th scope="col" className={thClass}>{t.colU.estado}</th><th scope="col" className={thClass}>{t.colU.ficha}</th><th scope="col" className={thClass}><span className="sr-only">{t.colU.acciones}</span></th></THead>
            <tbody className="divide-y divide-neutro-100">{slice(filtrados).map((u) => <tr key={u.id} className={cn('hover:bg-bronce-50/40', !u.activo && 'text-neutro-500')}>
              <td className="px-3 py-2.5"><span className="block font-semibold text-neutro-900" lang="es">{u.nombre}</span><span className="block max-w-[18rem] truncate text-xs text-neutro-500">{u.email}</span></td>
              <td className="px-3 py-2.5">{rolLabel(u.rol)}</td>
              <td className="px-3 py-2.5"><EstadoBadge activo={u.activo} /></td>
              <td className="px-3 py-2.5">{ficha(u)}</td>
              <td className="px-3 py-1.5">{acciones(u)}</td>
            </tr>)}</tbody></table>}
          rows={slice(filtrados).map((u) => <li key={u.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900" lang="es">{u.nombre}</span><EstadoBadge activo={u.activo} /></span>
              <span className="block truncate text-xs text-neutro-600">{u.email}</span><span className="block truncate text-xs text-neutro-600">{rolLabel(u.rol)} · {ficha(u)}</span></span>
            {acciones(u, true)}
          </li>)} />
        <Pager page={page} total={total} count={filtrados.length} onPage={(p) => update({ pagina: p > 1 ? String(p) : null })} />
      </>}
    </>}

    <Modal open={editing !== null} onClose={close} busy={save.isPending} closeLabel={t.cerrar} title={editing === 'new' ? t.nuevoUsuario : t.editar}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <fieldset className="grid min-w-0 gap-3 rounded-lg border border-neutro-200 p-4 sm:grid-cols-2"><legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutro-600">{t.gDatos}</legend>
          <Input label={t.nombre} required minLength={2} maxLength={150} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          <Input label={t.telefono} value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
        </fieldset>
        <fieldset className="flex min-w-0 flex-col gap-3 rounded-lg border border-neutro-200 p-4"><legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutro-600">{t.gAcceso}</legend>
          <Input label={t.correo} type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          {editing === 'new' && <>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutro-700">{t.rolInicial}
              <select className="field-control" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>{ASSIGNABLE_ROLES.filter((r) => r === 'admin' || r === 'cliente').map((r) => <option key={r} value={r}>{rolLabel(r)}</option>)}</select></label>
            <p className="text-xs text-neutro-500">{t.altaPersonalNota}</p>
            <Input label={t.passwordProvisional} type="password" required minLength={8} maxLength={72} autoComplete="new-password" hint={t.passwordAyuda} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </>}
        </fieldset>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-3 border-t border-neutro-200 pt-4"><Button type="button" variant="ghost" onClick={close} disabled={save.isPending}>{t.cancelar}</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? t.guardando : editing === 'new' ? t.crear : t.guardar}</Button></div>
      </form>
    </Modal>

    <Modal open={roleUser !== null} onClose={() => setRoleUser(null)} closeLabel={t.cerrar} title={t.rolTitulo} description={roleUser?.nombre}>
      <form className="flex flex-col gap-4" onSubmit={(event) => {
        event.preventDefault();
        if (!roleUser || newRole === roleUser.rol) return;
        setPendingError(null);
        setPending({ endpoint: `/usuarios/${roleUser.id}/rol`, body: { rol: newRole }, title: t.confirmarRol, description: t.confirmarRolDesc, target: `${roleUser.nombre} · ${rolLabel(newRole)}`, confirmLabel: t.cambiarRol, destructive: false });
        setRoleUser(null);
      }}>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutro-700">{t.rol}
          <select className="field-control" value={newRole} onChange={(e) => setNewRole(e.target.value)}>{ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{rolLabel(r)}</option>)}</select></label>
        <p className="text-xs text-neutro-500">{t.rolDesc}</p>
        <div className="flex justify-end gap-3 border-t border-neutro-200 pt-4"><Button type="button" variant="ghost" onClick={() => setRoleUser(null)}>{t.cancelar}</Button><Button type="submit" disabled={!newRole || newRole === roleUser?.rol}>{t.continuar}</Button></div>
      </form>
    </Modal>

    <ConfirmActionModal open={pending !== null} title={pending?.title ?? ''} description={pending?.description ?? ''} target={pending?.target ?? ''} confirmLabel={pending?.confirmLabel ?? t.confirmar}
      busy={save.isPending} destructive={pending?.destructive ?? true} error={pendingError} onClose={() => { setPending(null); setPendingError(null); }} onConfirm={() => void confirm()} />
  </div>;
};
