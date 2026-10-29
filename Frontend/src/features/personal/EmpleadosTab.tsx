import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IdCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/AuthContext';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { ConfirmActionModal, readableError, useAdminList, useAdminSave } from '@/features/admin-core/workbench';
import { formatAdminCalendarDate } from '@/features/admin-core/adminDates';
import { useLocale } from '@/i18n/LocaleContext';
import { cn } from '@/lib/cn';
import { ClearFilters, EmptyBox, EstadoBadge, Pager, ResponsiveList, SearchField, SelectField, THead, readPage, thClass } from './common';
import { useTextosPersonal } from './textos';
import { useUrlFilters } from './useUrlFilters';
import { AREA_POR_ROL, STAFF_ROLES, type Empleado, type Sucursal, type Usuario } from './types';

const EMPTY = { modo: 'nueva', nombre: '', email: '', password: '', rol: 'recepcionista', usuario_id: '', sucursal_id: '', area: '', fecha_contratacion: '', activo: true };

export const EmpleadosTab: React.FC = () => {
  const t = useTextosPersonal();
  const { locale } = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const scope = useAdminScope();
  const { params, update } = useUrlFilters();
  const empleados = useAdminList<Empleado>('personal-empleados', '/empleados');
  const usuarios = useAdminList<Usuario>('personal-usuarios', '/usuarios', isAdmin);
  const sucursales = useAdminList<Sucursal>('personal-sucursales', '/sucursales');
  const save = useAdminSave('personal');
  const [editing, setEditing] = useState<Empleado | 'new' | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Empleado | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Bloqueo síncrono: un doble clic no envía dos altas antes de que React actualice el estado.
  const enviando = useRef(false);

  const rows = empleados.data ?? [];
  const sedeNombre = (id: number) => sucursales.data?.find((s) => s.id === id)?.nombre ?? `#${id}`;
  const enSede = useMemo(() => rows.filter((e) => scope.selectedSedeId === 'all' || e.sucursal_id === scope.selectedSedeId || e.sedesAdicionales?.some((s) => s.sucursal_id === scope.selectedSedeId)), [rows, scope.selectedSedeId]);
  const roles = [...new Set(enSede.map((e) => e.Usuario?.rol).filter((r): r is string => Boolean(r)))];
  const areas = [...new Set(enSede.map((e) => e.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

  const q = params.get('q') ?? '';
  const rol = roles.includes(params.get('rol') ?? '') ? params.get('rol')! : '';
  const area = areas.includes(params.get('area') ?? '') ? params.get('area')! : '';
  const estado = ['activo', 'inactivo'].includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const hasFilters = Boolean(q || rol || area || estado);
  const term = q.trim().toLowerCase();
  const filtrados = enSede.filter((e) =>
    (!term || [e.Usuario?.nombre, e.Usuario?.email].some((v) => v?.toLowerCase().includes(term))) &&
    (!rol || e.Usuario?.rol === rol) && (!area || e.area === area) && (!estado || (estado === 'activo') === Boolean(e.Usuario?.activo)));
  const { page, total, slice } = readPage(params.get('pagina'), filtrados.length);

  const elegibles = (usuarios.data ?? []).filter((u) => u.activo && STAFF_ROLES.some((rol) => rol === u.rol) && !rows.some((e) => e.usuario_id === u.id));
  const sinFicha = (usuarios.data ?? []).filter((u) => (u.rol === 'admin' || STAFF_ROLES.some((rol) => rol === u.rol)) && !rows.some((e) => e.usuario_id === u.id));
  const begin = (item: Empleado | 'new', usuarioId?: string) => {
    setError(null); setSuccess(null); setEditing(item);
    if (item === 'new') { setForm({ ...EMPTY, modo: usuarioId ? 'existente' : 'nueva', usuario_id: usuarioId ?? '', sucursal_id: scope.selectedSedeId === 'all' ? '' : String(scope.selectedSedeId) }); return; }
    setForm({ ...EMPTY, usuario_id: String(item.usuario_id), rol: item.Usuario?.rol ?? '', activo: item.Usuario?.activo ?? true, sucursal_id: String(item.sucursal_id), area: item.area, fecha_contratacion: (item.fecha_contratacion ?? '').slice(0, 10) });
  };
  // «Crear ficha» desde Usuarios llega con ?nuevo=<id de usuario>: abre el formulario ya con esa cuenta.
  const nuevoParam = params.get('nuevo');
  useEffect(() => {
    if (nuevoParam && isAdmin && empleados.isSuccess && (nuevoParam === 'cuenta' || usuarios.isSuccess)) { begin('new', nuevoParam === 'cuenta' ? undefined : nuevoParam); update({ nuevo: null }); }
  }, [nuevoParam, isAdmin, usuarios.isSuccess, empleados.isSuccess]);

  const close = () => { setEditing(null); setForm({ ...EMPTY }); setError(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (enviando.current || save.isPending) return;
    enviando.current = true;
    try { await guardar(); } finally { enviando.current = false; }
  };
  const guardar = async () => {
    setError(null);
    const isNew = editing === 'new';
    if (!isNew) { await guardarEdicion(editing as Empleado); return; }
    const sede = Number(form.sucursal_id);
    if (isNew && form.modo === 'existente' && !elegibles.some((u) => u.id === Number(form.usuario_id))) { setError(t.errUsuario); return; }
    const accountRole = form.modo === 'nueva' ? form.rol : elegibles.find((u) => u.id === Number(form.usuario_id))?.rol;
    const areaLaboral = accountRole ? AREA_POR_ROL[accountRole] : undefined;
    if (isNew && (!accountRole || !STAFF_ROLES.some((rol) => rol === accountRole) || !areaLaboral)) { setError(t.errRol); return; }
    if (isAdmin && !(Number.isInteger(sede) && sede > 0)) { setError(t.errSede); return; }
    if (!areaLaboral || areaLaboral.length < 2) { setError(t.errSedeArea); return; }
    const body: Record<string, unknown> = { area: areaLaboral };
    if (form.modo === 'nueva') {
      if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,72}$/.test(form.password)) { setError(t.errPassword); return; }
      body.cuenta = { nombre: form.nombre.trim(), email: form.email.trim(), password: form.password, rol: form.rol, activo: true };
    } else body.usuario_id = Number(form.usuario_id);
    if (isAdmin) body.sucursal_id = sede;
    try {
      await save.mutateAsync({ endpoint: '/empleados', method: 'POST', body });
      setEditing(null); setForm({ ...EMPTY }); setSuccess(t.guardado);
    } catch (e) { setError(mensajeError(e)); }
  };
  /**
   * Edición: la ficha (sede, fecha y área derivada solo si cambia el cargo) y, para el
   * administrador, el rol y el estado de la cuenta con sus endpoints existentes. Las sedes
   * adicionales registradas no se envían, así que se conservan sin cambios.
   */
  const guardarEdicion = async (empleado: Empleado) => {
    const sede = Number(form.sucursal_id);
    if (isAdmin && !(Number.isInteger(sede) && sede > 0)) { setError(t.errSede); return; }
    const cuenta = empleado.Usuario;
    const cambiaRol = isAdmin && Boolean(cuenta) && form.rol !== cuenta!.rol;
    if (cambiaRol && !STAFF_ROLES.some((r) => r === form.rol)) { setError(t.errRol); return; }
    const body: Record<string, unknown> = { fecha_contratacion: form.fecha_contratacion || null };
    if (isAdmin) body.sucursal_id = sede;
    if (cambiaRol) body.area = AREA_POR_ROL[form.rol];
    try { await save.mutateAsync({ endpoint: `/empleados/${empleado.id}`, method: 'PATCH', body }); }
    catch (e) { setError(mensajeError(e)); return; }
    try {
      if (cambiaRol) await save.mutateAsync({ endpoint: `/usuarios/${empleado.usuario_id}/rol`, method: 'PATCH', body: { rol: form.rol } });
      if (isAdmin && cuenta && form.activo !== cuenta.activo) await save.mutateAsync({ endpoint: `/usuarios/${empleado.usuario_id}/estado`, method: 'PATCH', body: { activo: form.activo } });
    } catch (e) { setError(t.guardadoParcial(mensajeError(e))); return; }
    setEditing(null); setForm({ ...EMPTY }); setSuccess(t.guardado);
  };
  const mensajeError = (e: unknown) => (e as { code?: string })?.code === 'USER_ALREADY_HAS_EMPLOYEE_PROFILE' ? t.yaVinculada : readableError(e);
  const confirmDelete = async () => {
    if (!toDelete || save.isPending) return;
    setDeleteError(null);
    try { await save.mutateAsync({ endpoint: `/empleados/${toDelete.id}`, method: 'DELETE' }); setToDelete(null); setSuccess(t.operacionOk); }
    catch (e) { setDeleteError(readableError(e)); }
  };

  const nombre = (e: Empleado) => e.Usuario?.nombre ?? usuarios.data?.find((u) => u.id === e.usuario_id)?.nombre ?? `#${e.id}`;
  const acciones = (e: Empleado, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <button type="button" onClick={() => begin(e)} aria-label={t.editarDe(nombre(e))} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}><Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.editar}</span></button>
    {isAdmin && <button type="button" onClick={() => { setDeleteError(null); setToDelete(e); }} aria-label={t.eliminarDe(nombre(e))} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5 text-error-700 hover:bg-error-50' })}><Trash2 className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.eliminar}</span></button>}
  </div>;
  const sede = (e: Empleado) => <><span className="block" lang="es">{e.Sucursal?.nombre ?? sedeNombre(e.sucursal_id)}</span>{(e.sedesAdicionales?.length ?? 0) > 0 && <span className="block text-xs text-neutro-500">{t.adicionales(e.sedesAdicionales!.length)}</span>}</>;
  const rolLabel = (r?: string) => (r && t.roles[r]) || r || '—';

  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <p className="text-sm text-neutro-600">{empleados.isSuccess ? t.empleadosResumen(enSede.length, enSede.filter((e) => e.Usuario?.activo).length) : ' '}</p>
      {isAdmin && <Button type="button" onClick={() => begin('new')} disabled={!empleados.isSuccess}><Plus className="size-4" aria-hidden="true" />{t.nuevoEmpleado}</Button>}
    </div>
    {success && <Alert tone="success"><span>{success}</span></Alert>}
    {empleados.isPending && <LoadingNotice label={t.cargando} />}
    {empleados.isError && <Alert tone="error"><p>{readableError(empleados.error)}</p><Button className="mt-3" variant="secondary" onClick={() => void empleados.refetch()}>{t.reintentar}</Button></Alert>}
    {empleados.isSuccess && enSede.length === 0 && <EmptyBox>{t.vacioE}</EmptyBox>}
    {empleados.isSuccess && enSede.length > 0 && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <SearchField className="sm:col-span-2 xl:col-span-1" value={q} placeholder={t.buscarEmpleado} onChange={(v) => update({ q: v || null })} />
        <SelectField label={t.rol} value={rol} onChange={(v) => update({ rol: v || null })}><option value="">{t.todosRoles}</option>{roles.map((r) => <option key={r} value={r}>{rolLabel(r)}</option>)}</SelectField>
        <SelectField label={t.area} value={area} onChange={(v) => update({ area: v || null })}><option value="">{t.todasAreas}</option>{areas.map((a) => <option key={a} value={a} lang="es">{a}</option>)}</SelectField>
        <SelectField label={t.estado} value={estado} onChange={(v) => update({ estado: v || null })}><option value="">{t.todosEstados}</option><option value="activo">{t.activos}</option><option value="inactivo">{t.inactivos}</option></SelectField>
      </div>
      <ClearFilters show={hasFilters} onClick={() => update({ q: null, rol: null, area: null, estado: null })} />
      {filtrados.length === 0 ? <EmptyBox>{t.sinResultados}</EmptyBox> : <>
        <ResponsiveList
          table={<table className="w-full text-left text-sm text-neutro-800">
            <THead><th scope="col" className={thClass}>{t.colE.empleado}</th><th scope="col" className={thClass}>{t.colE.rol}</th><th scope="col" className={thClass}>{t.colE.sede}</th><th scope="col" className={thClass}>{t.colE.area}</th><th scope="col" className={thClass}>{t.colE.contratacion}</th><th scope="col" className={thClass}>{t.colE.cuenta}</th><th scope="col" className={thClass}><span className="sr-only">{t.colE.acciones}</span></th></THead>
            <tbody className="divide-y divide-neutro-100">{slice(filtrados).map((e) => <tr key={e.id} className="hover:bg-bronce-50/40">
              <td className="px-3 py-2.5"><span className="block font-semibold text-neutro-900" lang="es">{nombre(e)}</span><span className="block max-w-[16rem] truncate text-xs text-neutro-500">{e.Usuario?.email}</span></td>
              <td className="px-3 py-2.5">{rolLabel(e.Usuario?.rol)}</td>
              <td className="px-3 py-2.5">{sede(e)}</td>
              <td className="px-3 py-2.5" lang="es">{e.area}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{e.fecha_contratacion ? formatAdminCalendarDate(e.fecha_contratacion.slice(0, 10), locale) : <span className="text-neutro-400">{t.sinRegistrar}</span>}</td>
              <td className="px-3 py-2.5">{e.Usuario && <EstadoBadge activo={e.Usuario.activo} />}</td>
              <td className="px-3 py-1.5">{acciones(e)}</td>
            </tr>)}</tbody></table>}
          rows={slice(filtrados).map((e) => <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900" lang="es">{nombre(e)}</span>{e.Usuario && <EstadoBadge activo={e.Usuario.activo} />}</span>
              <span className="block truncate text-xs text-neutro-600">{rolLabel(e.Usuario?.rol)} · <span lang="es">{e.area}</span></span>
              <span className="block truncate text-xs text-neutro-600" lang="es">{e.Sucursal?.nombre ?? sedeNombre(e.sucursal_id)}{(e.sedesAdicionales?.length ?? 0) > 0 && ` · ${t.adicionales(e.sedesAdicionales!.length)}`}</span></span>
            {acciones(e, true)}
          </li>)} />
        <Pager page={page} total={total} count={filtrados.length} onPage={(p) => update({ pagina: p > 1 ? String(p) : null })} />
      </>}
    </>}

    {/* Cuentas con rol de personal sin ficha: el administrador general tiene alcance global; los demás pueden vincularse aquí. */}
    {isAdmin && usuarios.isSuccess && empleados.isSuccess && sinFicha.length > 0 && <section aria-labelledby="personal-sin-ficha" className="rounded-xl border border-neutro-200 bg-white p-4">
      <h2 id="personal-sin-ficha" className="text-sm font-semibold text-neutro-900">{t.sinFichaTitulo}</h2>
      <p className="mt-1 text-xs text-neutro-500">{t.sinFichaAyuda}</p>
      <ul className="mt-3 divide-y divide-neutro-100">{sinFicha.map((u) => <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
        <span className="min-w-0"><span className="block font-semibold text-neutro-900" lang="es">{u.nombre}</span><span className="block truncate text-xs text-neutro-500">{u.email} · {rolLabel(u.rol)}</span></span>
        {u.rol === 'admin' ? <span className="text-xs text-neutro-600">{t.alcanceGlobal}</span>
          : u.activo ? <Button type="button" variant="secondary" size="sm" onClick={() => begin('new', String(u.id))}><IdCard className="size-4" aria-hidden="true" />{t.crearFicha}</Button>
          : <EstadoBadge activo={false} />}
      </li>)}</ul>
    </section>}

    <Modal open={editing !== null} onClose={close} busy={save.isPending} closeLabel={t.cerrar} title={editing === 'new' ? t.fichaTitulo.nuevo : t.fichaTitulo.editar}>
      <form onSubmit={submit} className={editing === 'new' ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "flex flex-col gap-4"}>
        {(sucursales.isError || (form.modo === 'existente' && usuarios.isError)) && <div className="sm:col-span-2"><Alert tone="error">{t.errOpciones}</Alert></div>}
        <fieldset className={editing === 'new' ? 'contents' : 'flex min-w-0 flex-col gap-3 rounded-lg border border-neutro-200 p-4'}><legend className={editing === 'new' ? 'sr-only' : 'px-1 text-xs font-semibold uppercase tracking-wide text-neutro-600'}>{t.gCuenta}</legend>
          {editing === 'new'
            ? <>
              {form.modo === 'nueva' ? <>
                <Input label={t.nombre} required minLength={2} maxLength={150} autoComplete="name" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
                <Input label={t.correo} required type="email" maxLength={150} autoComplete="off" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                <div className="sm:col-span-2"><Input label={t.passwordInicial} required type="password" minLength={8} maxLength={72} autoComplete="new-password" hint={t.passwordAyuda} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-neutro-700">{t.rol}
                  <select required className="field-control" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
                    {STAFF_ROLES.map((rol) => <option key={rol} value={rol}>{rolLabel(rol)}</option>)}
                  </select></label>
              </> : <div className="space-y-3 sm:col-span-2">
                {elegibles.length === 0 && <Alert tone="info">{t.sinUsuarios}</Alert>}
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutro-700">{t.usuario}
                  <select required className="field-control" value={form.usuario_id} onChange={(e) => setForm((f) => ({ ...f, usuario_id: e.target.value }))}>
                    <option value="">{t.elegirUsuario}</option>{elegibles.map((u) => <option key={u.id} value={u.id}>{u.nombre} · {u.email} · {rolLabel(u.rol)}</option>)}
                  </select></label>
                <p className="text-xs text-neutro-500">{t.cuentaExistenteNota}</p>
              </div>}
            </>
            : <>
              <p className="text-sm text-neutro-800"><span className="font-semibold" lang="es">{(editing as Empleado | null) && nombre(editing as Empleado)}</span><span className="block text-xs text-neutro-500">{(editing as Empleado | null)?.Usuario?.email}</span></p>
              {isAdmin ? <>
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-neutro-700">{t.rolActual}
                  <select required className="field-control" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}>
                    {STAFF_ROLES.map((rol) => <option key={rol} value={rol}>{rolLabel(rol)}</option>)}
                  </select></label>
                <label className="flex min-h-11 items-center gap-2 text-sm text-neutro-800"><input type="checkbox" checked={form.activo} disabled={(editing as Empleado | null)?.usuario_id === user?.id} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />{t.cuentaActivaLabel}</label>
              </> : <p className="text-xs text-neutro-600">{rolLabel((editing as Empleado | null)?.Usuario?.rol)} · {t.soloAdminCuenta}</p>}
              {/* El área guardada se conserva; solo se deriva del cargo si este cambia. */}
              <p className="text-xs text-neutro-500" lang="es">{t.areaSegunCargo((isAdmin && form.rol !== (editing as Empleado | null)?.Usuario?.rol && AREA_POR_ROL[form.rol]) || form.area)}</p>
            </>}
        </fieldset>
        <fieldset className={editing === 'new' ? 'contents' : 'flex min-w-0 flex-col gap-3 rounded-lg border border-neutro-200 p-4'}><legend className={editing === 'new' ? 'sr-only' : 'px-1 text-xs font-semibold uppercase tracking-wide text-neutro-600'}>{t.gAsignacion}</legend>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutro-700">{t.sedeAsignada}
            <select required className="field-control" disabled={!isAdmin} value={form.sucursal_id} onChange={(e) => setForm((f) => ({ ...f, sucursal_id: e.target.value }))}>
              <option value="">{t.elegirSede}</option>{(sucursales.data ?? []).filter((s) => s.activa || String(s.id) === form.sucursal_id).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select></label>
          {editing !== 'new' && ((editing as Empleado | null)?.sedesAdicionales?.length ?? 0) > 0 && <p className="text-xs text-neutro-500">{t.sedesAdicionalesConservadas((editing as Empleado).sedesAdicionales!.length)}</p>}
        </fieldset>
        {editing !== 'new' && <details className="rounded-lg border border-neutro-200 p-4"><summary className="min-h-11 cursor-pointer text-xs font-semibold uppercase tracking-wide text-neutro-600">{t.infoAdicional}</summary>
          <div className="pt-3"><Input label={t.fechaContratacion} type="date" value={form.fecha_contratacion} onChange={(e) => setForm((f) => ({ ...f, fecha_contratacion: e.target.value }))} /></div>
        </details>}
        {editing === 'new' && <button type="button" disabled={save.isPending} className="min-h-10 text-left text-xs font-semibold text-bronce-700 underline underline-offset-4 sm:col-span-2"
          onClick={() => { setError(null); setForm((f) => ({ ...f, modo: f.modo === 'nueva' ? 'existente' : 'nueva', password: '', usuario_id: '' })); }}>
          {form.modo === 'nueva' ? t.vincularCuenta : t.crearCuenta}
        </button>}
        {error && <div className="sm:col-span-2"><Alert tone="error">{error}</Alert></div>}
        <div className="flex justify-end sm:col-span-2 gap-3 border-t border-neutro-200 pt-4"><Button type="button" variant="ghost" onClick={close} disabled={save.isPending}>{t.cancelar}</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? t.guardando : editing === 'new' ? t.crear : t.guardar}</Button></div>
      </form>
    </Modal>

    <ConfirmActionModal open={toDelete !== null} title={t.eliminarFichaTitulo} description={t.eliminarFichaDesc} target={toDelete ? nombre(toDelete) : ''} confirmLabel={t.eliminar}
      busy={save.isPending} destructive error={deleteError} onClose={() => { setToDelete(null); setDeleteError(null); }} onConfirm={() => void confirmDelete()} />
  </div>;
};
