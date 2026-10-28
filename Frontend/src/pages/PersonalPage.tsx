import { useAdminI18n } from '@/features/admin-core/i18n';
import React, { useState } from 'react';
import { Users, Clock3, Truck, CarFront, UserRoundCog, Plus, Pencil, Trash2, Power } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/AuthContext';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Feedback';
import { AdminHeading, SearchBox, QueryPanel, ActionError, ConfirmActionModal, useAdminList, useAdminSave, date, lower, readableError } from '@/features/admin-core/workbench';

type Section = 'empleados' | 'turnos' | 'choferes' | 'vehiculos' | 'usuarios';
interface Usuario { id: number; nombre: string; email: string; rol: string; activo: boolean; telefono?: string | null }
interface Sucursal { id: number; nombre: string; activa: boolean }
interface Empleado { id: number; usuario_id: number; sucursal_id: number; area: string; fecha_contratacion: string | null; Usuario?: Usuario; Sucursal?: Sucursal; sedesAdicionales?: Array<{ sucursal_id: number }> }
interface Turno { id: number; empleado_id: number; fecha: string; hora_inicio: string; hora_fin: string; Empleado?: Empleado }
interface Chofer { id: number; nombre: string; licencia: string | null; activo: boolean }
interface Vehiculo { id: number; tipo: string; placa: string | null; capacidad: number }
type Entry = Empleado | Turno | Chofer | Vehiculo | Usuario;
const titles: Record<Section, string> = { empleados: 'Empleados', turnos: 'Turnos', choferes: 'Choferes', vehiculos: 'Vehículos', usuarios: 'Usuarios' };
const tabs: Array<{ key: Section; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'empleados', icon: Users }, { key: 'turnos', icon: Clock3 }, { key: 'choferes', icon: Truck },
  { key: 'vehiculos', icon: CarFront }, { key: 'usuarios', icon: UserRoundCog },
];
const endpoints: Record<Section, string> = { empleados: '/empleados', turnos: '/turnos', choferes: '/choferes', vehiculos: '/vehiculos', usuarios: '/usuarios' };
const empty: Record<Section, Record<string, string>> = {
  empleados: { usuario_id: '', sucursal_id: '', area: '', fecha_contratacion: '', sedes_adicionales: '' },
  turnos: { empleado_id: '', fecha: '', hora_inicio: '08:00', hora_fin: '16:00' },
  choferes: { nombre: '', licencia: '' },
  vehiculos: { tipo: 'van', capacidad: '4', placa: '' },
  usuarios: { nombre: '', email: '', password: '', rol: 'empleado_operativo', telefono: '' },
};
const roleOptions = ['admin', 'gerente_habitaciones', 'recepcionista', 'empleado_operativo', 'cliente'];
function FormSelect({ label, name, options, value, onChange, disabled = false }: { label: string; name: string; options: Array<{ value: string; label: string }>; value: string; onChange: (name: string, value: string) => void; disabled?: boolean }) {
  const { t } = useAdminI18n();
  return <label className="flex flex-col gap-2 text-xs font-semibold text-neutro-700">{label}
    <select className="field-control" required value={value} onChange={e => onChange(name, e.target.value)} disabled={disabled}>
      <option value="">{t("Seleccione una opción")}</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select></label>;
}

export const PersonalPage: React.FC = () => {
  const { t } = useAdminI18n();
  const { user } = useAuth();
  const isGeneralAdmin = user?.rol === 'admin';
  const scope = useAdminScope();
  const [section, setSection] = useState<Section>('empleados');
  const [pendingAction, setPendingAction] = useState<{ endpoint: string; method: 'PATCH' | 'DELETE'; body?: unknown; title: string; description: string; target: string; confirmLabel: string; destructive: boolean } | null>(null);
  const [roleUser, setRoleUser] = useState<Usuario | null>(null);
  const [newRole, setNewRole] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Entry | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, string>>(empty.empleados);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const empleados = useAdminList<Empleado>('personal-empleados', '/empleados');
  const turnos = useAdminList<Turno>('personal-turnos', '/turnos');
  const choferes = useAdminList<Chofer>('personal-choferes', '/choferes', isGeneralAdmin);
  const vehiculos = useAdminList<Vehiculo>('personal-vehiculos', '/vehiculos', isGeneralAdmin);
  const usuarios = useAdminList<Usuario>('personal-usuarios', '/usuarios', isGeneralAdmin);
  const sucursales = useAdminList<Sucursal>('personal-sucursales', '/sucursales');
  const save = useAdminSave('personal');
  const queries = { empleados, turnos, choferes, vehiculos, usuarios };
  const query = queries[section];
  const data = (query.data ?? []) as Entry[];
  const filtered = data.filter(item => {
    const extra = section === 'empleados' ? (item as Empleado).Usuario?.nombre ?? '' :
      section === 'turnos' ? empleados.data?.find(x => x.id === (item as Turno).empleado_id)?.Usuario?.nombre ?? '' : '';
    return lower([...(Object.values(item).filter(v => ['string', 'number'].includes(typeof v))), extra].join(' ')).includes(lower(search));
  });
  const updateField = (name: string, value: string) => setForm(v => ({ ...v, [name]: value }));
  const closeEditor = () => { setEditing(null); setForm({ ...empty[section] }); setError(null); };
  const begin = (item: Entry | 'new') => {
    setError(null); setSuccess(null); setEditing(item);
    if (item === 'new') { setForm({ ...empty[section] }); return; }
    const entry = item as unknown as Record<string, unknown>;
    const obj = { ...empty[section] };
    for (const key of Object.keys(obj)) if (key !== 'password') obj[key] = String(entry[key] ?? '').slice(0, key === 'fecha_contratacion' || key === 'fecha' ? 10 : undefined);
    if (section === 'turnos') { obj.hora_inicio = String(entry.hora_inicio ?? '').slice(0, 5); obj.hora_fin = String(entry.hora_fin ?? '').slice(0, 5); }
    if (section === 'empleados') obj.sedes_adicionales = ((item as Empleado).sedesAdicionales ?? []).map(site => site.sucursal_id).join(',');
    setForm(obj);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (save.isPending) return; setError(null);
    const isNew = editing === 'new';
    const fields = { ...form };
    let body: Record<string, unknown>;
    if (section === 'empleados') {
      body = { ...(!isNew ? {} : { usuario_id: Number(fields.usuario_id) }), sucursal_id: Number(fields.sucursal_id), area: fields.area.trim(), fecha_contratacion: fields.fecha_contratacion || null };
      if (isGeneralAdmin) body.sedes_adicionales = (fields.sedes_adicionales || '').split(',').filter(Boolean).map(Number).filter(id => id !== Number(fields.sucursal_id));
      else delete body.sucursal_id;
      if (isNew && (!Number.isInteger(Number(body.usuario_id)) || Number(body.usuario_id) <= 0)) { setError(t("Seleccione un usuario válido.")); return; }
      if ((isGeneralAdmin && (!Number.isInteger(Number(body.sucursal_id)) || Number(body.sucursal_id) <= 0)) || String(body.area).length < 2) { setError(t("Seleccione una sede e indique un área de al menos dos caracteres.")); return; }
    } else if (section === 'turnos') {
      body = { ...(!isNew ? {} : { empleado_id: Number(fields.empleado_id) }), fecha: fields.fecha, hora_inicio: fields.hora_inicio, hora_fin: fields.hora_fin };
      if (isNew && (!Number.isInteger(Number(body.empleado_id)) || Number(body.empleado_id) <= 0)) { setError(t("Seleccione un empleado.")); return; }
    } else if (section === 'choferes') {
      const licencia = fields.licencia.trim();
      body = { nombre: fields.nombre.trim(), licencia: licencia || null };
    } else if (section === 'vehiculos') {
      const placa = fields.placa.trim();
      body = { tipo: fields.tipo, capacidad: Number(fields.capacidad), placa: placa || null };
      if (!Number.isSafeInteger(Number(body.capacidad)) || Number(body.capacidad) < 1) { setError(t("La capacidad debe ser un entero positivo.")); return; }
    } else {
      body = { nombre: fields.nombre.trim(), email: fields.email.trim(), telefono: fields.telefono.trim() || null };
      if (isNew) body = { ...body, rol: fields.rol, password: fields.password };
      if (isNew && !fields.password) { setError(t("Indique una contraseña válida: 8 caracteres, mayúscula, minúscula y número.")); return; }
    }
    try {
      await save.mutateAsync({ endpoint: isNew ? endpoints[section] : `${endpoints[section]}/${(editing as Entry).id}`, method: isNew ? 'POST' : 'PATCH', body });
      setEditing(null); setForm({ ...empty[section] }); setSuccess(t("{0}: registro guardado correctamente.", {0: titles[section]}));
    } catch (e) { setError(t(readableError(e))); }
  };
  const requestAction = (endpoint: string, method: 'PATCH' | 'DELETE', body: unknown, title: string, description: string, target: string, confirmLabel: string, destructive = true) => {
    setError(null); setSuccess(null);
    setPendingAction({ endpoint, method, body, title, description, target, confirmLabel, destructive });
  };
  const confirmAction = async () => {
    if (!pendingAction || save.isPending) return;
    setError(null);
    try {
      await save.mutateAsync({ endpoint: pendingAction.endpoint, method: pendingAction.method, body: pendingAction.body });
      setPendingAction(null);
      setSuccess(t("Operación realizada. El listado se actualizó desde el servidor."));
    } catch (e) {
      // Mantener abierto para que el usuario pueda leer el error y cancelar de forma segura.
      setError(t(readableError(e)));
    }
  };
  const labelFor = (row: Entry): string => {
    if (section === 'empleados') { const x = row as Empleado; return x.Usuario?.nombre ?? usuarios.data?.find(u => u.id === x.usuario_id)?.nombre ?? t("Empleado #{0}", {0: x.id}); }
    if (section === 'turnos') return t("Turno #{0}", {0: row.id});
    if (section === 'choferes') return (row as Chofer).nombre;
    if (section === 'vehiculos') return `${(row as Vehiculo).tipo.toUpperCase()} · ${(row as Vehiculo).placa || t("Sin placa")}`;
    return (row as Usuario).nombre;
  };
  const secondary = (row: Entry): React.ReactNode => {
    if (section === 'empleados') { const x = row as Empleado; return <>{x.area} · {x.Sucursal?.nombre ?? sucursales.data?.find(s => s.id === x.sucursal_id)?.nombre ?? t("Sede sin identificar")}<br />{t("Contratación:")}{date(x.fecha_contratacion)} {t("· Usuario #")}{x.usuario_id}</>; }
    if (section === 'turnos') { const x = row as Turno; const emp = empleados.data?.find(e => e.id === x.empleado_id); return <>{emp?.Usuario?.nombre ?? t("Empleado #{0}", {0: x.empleado_id})} · {date(x.fecha)} · {String(x.hora_inicio).slice(0, 5)}–{String(x.hora_fin).slice(0, 5)}</>; }
    if (section === 'choferes') return <>{t("Licencia:")}{(row as Chofer).licencia || t("Sin registrar")}</>;
    if (section === 'vehiculos') return <>{t("Capacidad:")}{(row as Vehiculo).capacidad} {t("personas")}</>;
    const x = row as Usuario; return <>{x.email} · {t(x.rol)}{x.telefono && ` · ${x.telefono}`}</>;
  };
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 pb-12">
    <AdminHeading category={t("Operación hotelera")} title={t(isGeneralAdmin ? "Personal y usuarios" : "Personal")} subtitle={t("Gestione empleados, horarios, conductores, vehículos y accesos administrativos desde un solo lugar.")} onReload={() => { void query.refetch(); void empleados.refetch(); if (isGeneralAdmin) void usuarios.refetch(); void sucursales.refetch(); }} busy={query.isFetching} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" role="group" aria-label={t("Secciones de personal")}>{tabs.filter(tab => isGeneralAdmin || ['empleados', 'turnos'].includes(tab.key)).map(tab => <button key={tab.key} type="button" aria-pressed={section === tab.key}
      onClick={() => { closeEditor(); setPendingAction(null); setRoleUser(null); setSection(tab.key); setSearch(''); setError(null); setSuccess(null); }} className={`flex min-h-16 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors ${section === tab.key ? 'border-selva-600 bg-selva-50 text-selva-800' : 'border-neutro-200 bg-white text-neutro-700 hover:border-bronce-400'}`}>
      <tab.icon className="size-5 shrink-0" />{t(titles[tab.key])}</button>)}</div>
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex-1"><SearchBox search={search} onSearch={setSearch} placeholder={t("Buscar en {0}...", {0: t(titles[section]).toLowerCase()})} /></div>
      {(isGeneralAdmin || section === 'turnos') && <Button onClick={() => begin('new')} disabled={query.isPending || query.isError || save.isPending}><Plus className="mr-2 inline size-4" />{t("Nuevo")}{' '}{t(section === 'usuarios' ? 'usuario' : section === 'empleados' ? 'empleado' : section === 'turnos' ? 'turno' : section === 'choferes' ? 'chofer' : 'vehículo')}</Button>}</Card>
    <p className="text-sm text-neutro-600">{filtered.length} {t("registros visibles ·")}{' '}{t(titles[section])}</p>
    <ActionError error={error} success={success} />
    <QueryPanel pending={query.isPending} error={query.error} retry={() => void query.refetch()} empty={filtered.length === 0} filtered={!!search}>
      <div className="grid gap-3 md:grid-cols-2">{filtered.map(x => <Card key={x.id} className="flex min-w-0 flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1 [overflow-wrap:anywhere]"><h2 className="font-serif text-lg font-semibold text-neutro-900">{labelFor(x)}</h2>
          <p className="mt-2 text-sm leading-6 text-neutro-600">{secondary(x)}</p></div>
          <div className="flex shrink-0 items-center gap-2">{(section === 'choferes' || section === 'usuarios') && <Badge tone={(x as Chofer | Usuario).activo ? 'exito' : 'neutro'}>{(x as Chofer | Usuario).activo ? t("Activo") : t("Inactivo")}</Badge>}
            <span className="text-xs text-neutro-400">#{x.id}</span></div></div>
        <div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => begin(x)}><Pencil className="mr-2 inline size-4" />{t("Editar")}</Button>
          {section === 'choferes' && <Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => requestAction(`/choferes/${x.id}/estado`, 'PATCH', { activo: !(x as Chofer).activo }, (x as Chofer).activo ? 'Desactivar chofer' : 'Reactivar chofer', 'Este cambio modifica la disponibilidad del conductor en el sistema.', labelFor(x), (x as Chofer).activo ? 'Desactivar chofer' : 'Reactivar chofer', (x as Chofer).activo)}><Power className="mr-1 inline size-4" />{(x as Chofer).activo ? t("Desactivar") : t("Activar")}</Button>}
          {section === 'usuarios' && <Button size="sm" variant="ghost" disabled={save.isPending || x.id === user?.id} onClick={() => { setRoleUser(x as Usuario); setNewRole((x as Usuario).rol); setError(null); }}>{t('Cambiar rol')}</Button>}
          {section === 'usuarios' && <Button size="sm" variant="ghost" disabled={save.isPending || (x as Usuario).activo && x.id === user?.id} title={(x as Usuario).activo && x.id === user?.id ? t("No puede desactivar su propia cuenta") : undefined} onClick={() => requestAction(`/usuarios/${x.id}/estado`, 'PATCH', { activo: !(x as Usuario).activo }, (x as Usuario).activo ? 'Desactivar usuario' : 'Reactivar usuario', 'Al desactivar una cuenta se restringirá su acceso. El servidor verifica permisos y evita desactivar la cuenta propia.', labelFor(x), (x as Usuario).activo ? 'Desactivar usuario' : 'Reactivar usuario', (x as Usuario).activo)}><Power className="mr-1 inline size-4" />{(x as Usuario).activo ? t("Desactivar") : t("Activar")}</Button>}
          {(section === 'turnos' || (isGeneralAdmin && (section === 'vehiculos' || section === 'empleados'))) && <Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => requestAction(`${endpoints[section]}/${x.id}`, 'DELETE', undefined, t('Eliminar {0}', { 0: t(section === 'empleados' ? 'empleado' : section === 'turnos' ? 'turno' : 'vehículo') }), 'Esta acción no se puede deshacer. Si existen relaciones asociadas, el servidor la rechazará.', labelFor(x), 'Eliminar definitivamente')}><Trash2 className="mr-1 inline size-4" />{t("Eliminar")}</Button>}
        </div>
      </Card>)}</div>
    </QueryPanel>
    <Modal open={roleUser !== null} onClose={() => setRoleUser(null)} title={t('Cambiar rol')} closeLabel={t('Cerrar')}>
      <form className="flex flex-col gap-4" onSubmit={event => {
        event.preventDefault(); if (!roleUser || newRole === roleUser.rol) return;
        requestAction(`/usuarios/${roleUser.id}/rol`, 'PATCH', { rol: newRole }, t('Confirmar cambio de rol'),
          t('El nuevo rol determina los permisos de esta cuenta.'), `${roleUser.nombre} · ${t(newRole)}`, t('Cambiar rol'));
        setRoleUser(null);
      }}>
        <p>{roleUser?.nombre}</p>
        <FormSelect label={t('Rol')} name="rol" value={newRole} onChange={(_, value) => setNewRole(value)} options={roleOptions.map(rol => ({ value: rol, label: t(rol) }))} />
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setRoleUser(null)}>{t('Cancelar')}</Button><Button type="submit" disabled={!newRole || newRole === roleUser?.rol}>{t('Continuar')}</Button></div>
      </form>
    </Modal>
    <ConfirmActionModal open={pendingAction !== null} title={pendingAction?.title ?? t("Confirmar operación")}
      description={pendingAction?.description ?? ''} target={pendingAction?.target ?? ''} confirmLabel={pendingAction?.confirmLabel ?? 'Confirmar'}
      busy={save.isPending} destructive={pendingAction?.destructive ?? true} error={pendingAction ? error : null}
      onClose={() => { setPendingAction(null); setError(null); }} onConfirm={() => void confirmAction()} />
    <Modal closeLabel={t('Cerrar')} open={editing !== null} onClose={closeEditor} busy={save.isPending} title={`${editing === 'new' ? t("Nuevo registro") : t("Editar registro")} · ${t(titles[section])}`} description={t("Complete los datos y guarde. Los controles del servidor validan reglas y permisos.")}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {section === 'empleados' && [usuarios, sucursales, empleados].some(q => q.isError) && <Alert tone="error">{t("No fue posible cargar las opciones. Cierre el formulario y actualice los registros antes de continuar.")}</Alert>}
        {section === 'empleados' && <>
          {editing === 'new' && <FormSelect value={form.usuario_id ?? ''} onChange={updateField} label={t("Usuario")} name="usuario_id" options={(usuarios.data ?? []).filter(u => u.activo && u.rol !== 'cliente' && !empleados.data?.some(e => e.usuario_id === u.id)).map(u => ({ value: String(u.id), label: `${u.nombre} · ${u.email}` }))} />}
          <FormSelect value={form.sucursal_id ?? ''} onChange={updateField} label={t("Sede del empleado")} name="sucursal_id" disabled={!isGeneralAdmin} options={(sucursales.data ?? []).filter(s => s.activa && (isGeneralAdmin || scope.sedes.some(site => site.id === s.id))).map(s => ({ value: String(s.id), label: s.nombre }))} />
          {isGeneralAdmin && <fieldset className="space-y-2 rounded-lg border border-neutro-200 p-3"><legend className="px-1 text-sm font-semibold">{t('Sedes adicionales')}</legend>
            {(sucursales.data ?? []).filter(site => site.activa && site.id !== Number(form.sucursal_id)).map(site => <label key={site.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={(form.sedes_adicionales || '').split(',').includes(String(site.id))} onChange={event => { const ids = new Set((form.sedes_adicionales || '').split(',').filter(Boolean)); if (event.target.checked) ids.add(String(site.id)); else ids.delete(String(site.id)); updateField('sedes_adicionales', [...ids].join(',')); }} />{site.nombre}</label>)}
          </fieldset>}
          <Input label={t("Área de trabajo")} required minLength={2} maxLength={50} value={form.area} onChange={e => updateField('area', e.target.value)} />
          <Input label={t("Fecha de contratación (opcional)")} type="date" value={form.fecha_contratacion} onChange={e => updateField('fecha_contratacion', e.target.value)} />
        </>}
        {section === 'turnos' && <>
          {editing === 'new' && <FormSelect value={form.empleado_id ?? ''} onChange={updateField} label={t("Empleado")} name="empleado_id" options={(empleados.data ?? []).map(e => ({ value: String(e.id), label: `${e.Usuario?.nombre ?? 'Empleado'} · ${e.area}` }))} />}
          <Input label={t("Fecha del turno")} type="date" required value={form.fecha} onChange={e => updateField('fecha', e.target.value)} />
          <div className="grid grid-cols-2 gap-3"><Input label={t("Hora de inicio")} type="time" required value={form.hora_inicio} onChange={e => updateField('hora_inicio', e.target.value)} /><Input label={t("Hora de fin")} type="time" required value={form.hora_fin} onChange={e => updateField('hora_fin', e.target.value)} /></div>
          <p className="text-xs text-neutro-500">{t("Se permiten turnos nocturnos. El servidor valida conflictos y asignaciones.")}</p>
        </>}
        {section === 'choferes' && <><Input label={t("Nombre completo")} required minLength={2} maxLength={150} value={form.nombre} onChange={e => updateField('nombre', e.target.value)} /><Input label={t("Licencia (opcional)")} maxLength={50} value={form.licencia} onChange={e => updateField('licencia', e.target.value)} /></>}
        {section === 'vehiculos' && <><FormSelect value={form.tipo ?? ''} onChange={updateField} label={t("Tipo de vehículo")} name="tipo" options={['van','shuttle','sedan'].map(v => ({ value: v, label: v.toUpperCase() }))} /><Input label={t("Capacidad de pasajeros")} required type="number" min={1} step={1} value={form.capacidad} onChange={e => updateField('capacidad', e.target.value)} /><Input label={t("Placa del vehículo (opcional)")} maxLength={20} value={form.placa} onChange={e => updateField('placa', e.target.value)} /></>}
        {section === 'usuarios' && <><Input label={t("Nombre completo")} required minLength={2} maxLength={150} value={form.nombre} onChange={e => updateField('nombre', e.target.value)} /><Input label={t("Correo electrónico")} type="email" required value={form.email} onChange={e => updateField('email', e.target.value)} /><Input label={t("Teléfono (opcional)")} value={form.telefono} onChange={e => updateField('telefono', e.target.value)} />
          {editing === 'new' && <><FormSelect value={form.rol ?? ''} onChange={updateField} label={t("Rol inicial")} name="rol" options={roleOptions.map(x => ({ value: x, label: t(x).replaceAll('_',' ') }))} /><Input label={t("Contraseña provisional")} type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={form.password} onChange={e => updateField('password', e.target.value)} /><p className="text-xs text-neutro-500">{t("Debe tener mayúscula, minúscula y número. No se almacena en el navegador después de cerrar el formulario.")}</p></>}
        </>}
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={closeEditor}>{t("Cancelar")}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t("Guardando...") : editing === 'new' ? t("Crear registro") : t("Guardar cambios")}</Button></div>
      </form>
    </Modal>
    <p className="text-xs text-neutro-500">{t("Gestión protegida por permisos del backend. Cambios de estado, turnos y asignaciones pueden ser rechazados si afectan registros relacionados.")}</p>
  </div>;
};
