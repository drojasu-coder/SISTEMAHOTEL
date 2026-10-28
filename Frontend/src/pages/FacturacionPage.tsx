import { useAdminI18n } from '@/features/admin-core/i18n';
import React, { useState } from 'react';
import { FileText, Plus, Eye, Pencil, Trash2, Receipt } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Feedback';
import { AdminHeading, StatCard, SearchBox, QueryPanel, ActionError, ConfirmActionModal, useAdminList, useAdminSave, AdminMoney, formatHotelDate, lower, readableError } from '@/features/admin-core/workbench';

interface Factura { id: number; usuario_id: number; nit: string; nombre_fiscal: string; direccion_fiscal: string | null; precios_incluyen_impuestos?: boolean; inguat?: string | number; subtotal: string | number; iva: string | number; total: string | number; estado: string; fecha_emision: string | null; createdAt?: string | null }
interface FacturaItem { id: number; factura_id: number; descripcion: string; cantidad: number; precio_unitario: string | number; subtotal: string | number }
interface Usuario { id: number; nombre: string; email: string }
const initial = { usuario_id: '', nit: '', nombre_fiscal: '', direccion_fiscal: '' };
const initialItem = { descripcion: '', cantidad: '1', precio_unitario: '', tipo_concepto: 'servicio' };

export const FacturacionPage: React.FC = () => {
  const { t } = useAdminI18n();
  const { user } = useAuth();
  const invoices = useAdminList<Factura>('facturas', '/facturas');
  const items = useAdminList<FacturaItem>('factura-items', '/factura-items');
  const users = useAdminList<Usuario>('factura-usuarios', '/usuarios', user?.rol === 'admin');
  const save = useAdminSave('facturas');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todos');
  const [selected, setSelected] = useState<Factura | null>(null);
  const [editing, setEditing] = useState<Factura | 'new' | null>(null);
  const [form, setForm] = useState(initial);
  const [itemForm, setItemForm] = useState(initialItem);
  const [addingItem, setAddingItem] = useState(false);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<FacturaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const all = invoices.data ?? [];
  const visible = all.filter(x => (status === 'todos' || x.estado === status) &&
    [x.id, x.nit, x.nombre_fiscal, x.usuario_id].some(v => lower(v).includes(lower(search))));
  const detailItems = (items.data ?? []).filter(i => i.factura_id === selected?.id);
  const refresh = () => { void invoices.refetch(); void items.refetch(); };
  const openForm = (value: Factura | 'new') => {
    setError(null); setNotice(null); setEditing(value);
    setForm(value === 'new' ? initial : {
      usuario_id: String(value.usuario_id), nit: value.nit, nombre_fiscal: value.nombre_fiscal,
      direccion_fiscal: value.direccion_fiscal ?? '',
    });
  };
  const submitInvoice = async (event: React.FormEvent) => {
    event.preventDefault(); if (save.isPending) return; setError(null);
    const usuarioId = Number(form.usuario_id);
    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) { setError(t("Seleccione un usuario válido.")); return; }
    if (!form.nit.trim() || !form.nombre_fiscal.trim()) { setError(t("NIT y nombre fiscal son obligatorios.")); return; }
    const nit = form.nit.trim().toUpperCase();
    try {
      const body = { usuario_id: usuarioId, nit, nombre_fiscal: form.nombre_fiscal.trim(), direccion_fiscal: form.direccion_fiscal.trim() || null };
      if (editing === 'new') {
        await save.mutateAsync({ endpoint: '/facturas', method: 'POST', body: { ...body, subtotal: 0, precios_incluyen_impuestos: true } });
      } else if (editing) {
        await save.mutateAsync({ endpoint: `/facturas/${editing.id}`, method: 'PATCH', body });
      }
      setEditing(null); setNotice(t("Factura guardada. Los importes se calculan automáticamente al registrar conceptos."));
    } catch (e) { setError(t(readableError(e))); }
  };
  const submitItem = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || save.isPending) return; setError(null);
    const cantidad = Number(itemForm.cantidad), precio = Number(itemForm.precio_unitario);
    if (!itemForm.descripcion.trim() || !Number.isSafeInteger(cantidad) || cantidad <= 0 || !Number.isFinite(precio) || precio < 0) {
      setError(t("Indique descripción, cantidad entera positiva y un precio no negativo.")); return;
    }
    try {
      await save.mutateAsync({ endpoint: '/factura-items', method: 'POST', body: { factura_id: selected.id, descripcion: itemForm.descripcion.trim(), cantidad, precio_unitario: precio, ...(selected.precios_incluyen_impuestos ? { tipo_concepto: itemForm.tipo_concepto } : {}) } });
      await invoices.refetch();
      setItemForm(initialItem); setAddingItem(false); setNotice(t("Concepto agregado y totales recalculados por el servidor."));
    } catch (e) { setError(t(readableError(e))); }
  };
  const removeItem = async () => {
    if (!pendingRemoveItem) return;
    setError(null);
    try {
      await save.mutateAsync({ endpoint: `/factura-items/${pendingRemoveItem.id}`, method: 'DELETE' });
      await invoices.refetch();
      setPendingRemoveItem(null);
      setNotice(t("Concepto eliminado; totales actualizados."));
    } catch (e) { setPendingRemoveItem(null); setError(t(readableError(e))); }
  };
  const selectedCurrent = all.find(x => x.id === selected?.id) ?? selected;
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 pb-12">
    <AdminHeading category={t("Gestión fiscal")} title={t("Facturación")} subtitle={t("Registre documentos internos, consulte conceptos e importes y mantenga la trazabilidad de cada factura.")} onReload={refresh} busy={invoices.isFetching} />
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-neutro-600">{t("Documentos internos. No equivale a certificación FEL ante SAT.")}</p>
      <Button onClick={() => openForm('new')}><Plus className="mr-2 inline size-4" />{t("Nueva factura")}</Button></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={t("Registradas")} value={all.length} />
      <StatCard label={t("Pendientes")} value={all.filter(x => x.estado === 'pendiente').length} />
      <StatCard label={t("Pagadas (estado registrado)")} value={all.filter(x => x.estado === 'pagada').length} />
      <StatCard label={t("Total filtrado")} value={<AdminMoney amount={visible.reduce((sum, x) => sum + Number(x.total), 0)} />} help={t("No representa ingresos efectivamente cobrados.")} />
    </div>
    <ActionError error={error} success={notice} />
    <Card className="grid gap-4 sm:grid-cols-[1fr_240px]"><SearchBox search={search} onSearch={setSearch} placeholder={t("ID, cliente, NIT o usuario")} />
      <label className="flex flex-col gap-2 text-xs font-semibold text-neutro-700">{t("Estado")}<select className="field-control" aria-label={t("Filtrar facturas por estado")} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="todos">{t("Todos los estados")}</option><option value="pendiente">{t("Pendiente")}</option><option value="pagada">{t("Pagada")}</option><option value="anulada">{t("Anulada")}</option>
        </select></label></Card>
    <QueryPanel pending={invoices.isPending} error={invoices.error} retry={refresh} empty={visible.length === 0} filtered={!!search || status !== 'todos'}>
      <Card padding="none" className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-neutro-50 text-xs uppercase text-neutro-600"><tr>{[t("Factura"),t('Cliente / documento'),t("Fecha de registro"),t("Estado"),t("Total"),t("Acciones")].map(x => <th key={x} className="px-5 py-4">{x}</th>)}</tr></thead>
        <tbody className="divide-y divide-neutro-100">{visible.map(x => <tr key={x.id} className="hover:bg-neutro-50/70">
          <td className="px-5 py-4 font-semibold">#{x.id}</td><td className="px-5 py-4"><p className="font-medium">{x.nombre_fiscal}</p><p className="text-xs text-neutro-500">{t("NIT:")}{x.nit}</p></td>
          <td className="px-5 py-4"><span className="block font-medium">{t(formatHotelDate(x.createdAt ?? x.fecha_emision))}</span>
            {x.fecha_emision ? <span className="block text-xs text-neutro-500">{t("Emitida:")}{formatHotelDate(x.fecha_emision)}</span> : <span className="block text-xs text-neutro-500">{t("Emisión sin registrar")}</span>}
          </td><td className="px-5 py-4"><Badge tone={x.estado === 'pagada' ? 'exito' : x.estado === 'anulada' ? 'error' : 'advertencia'}>{t(x.estado)}</Badge></td>
          <td className="px-5 py-4 font-semibold">{<AdminMoney amount={x.total} />}</td><td className="px-5 py-4"><div className="flex gap-2">
            <Button size="sm" variant="ghost" aria-label={t("Ver factura {0}", {0: x.id})} onClick={() => { setSelected(x); setAddingItem(false); setError(null); }}><Eye className="size-4" /></Button>
            <Button size="sm" variant="ghost" aria-label={t("Editar factura {0}", {0: x.id})} onClick={() => openForm(x)}><Pencil className="size-4" /></Button>
          </div></td></tr>)}</tbody></table></div></Card>
    </QueryPanel>
    <Modal open={editing !== null} onClose={() => setEditing(null)} busy={save.isPending} closeLabel={t('Cerrar')} title={editing === 'new' ? t("Nueva factura") : t("Editar factura #{0}", {0: editing?.id ?? ''})} description={t("Los conceptos determinan el subtotal, IVA y total; no se modifican desde este formulario.")}>
      <form className="flex flex-col gap-4" onSubmit={submitInvoice}>
        {users.data?.length ? <label className="flex flex-col gap-2 text-xs font-semibold text-neutro-700">{t("Cliente o usuario")}<select className="field-control" value={form.usuario_id} required onChange={e => setForm({ ...form, usuario_id: e.target.value })}><option value="">{t("Seleccione un usuario")}</option>
            {users.data.map(u => <option key={u.id} value={u.id}>{u.nombre} · {u.email}</option>)}</select></label>
          : <Input label={t("ID del usuario")} type="number" min={1} required value={form.usuario_id} onChange={e => setForm({ ...form, usuario_id: e.target.value })} />}
        <Input label="NIT" maxLength={20} required spellCheck={false} autoCapitalize="characters"
          hint={t("Ingrese el NIT del titular, hasta 20 caracteres.")}
          value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value.toUpperCase() })} />
        <Input label={t("Razón social o nombre fiscal")} maxLength={150} required value={form.nombre_fiscal} onChange={e => setForm({ ...form, nombre_fiscal: e.target.value })} />
        <Input label={t("Dirección fiscal (opcional)")} maxLength={255} value={form.direccion_fiscal} onChange={e => setForm({ ...form, direccion_fiscal: e.target.value })} />
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setEditing(null)}>{t("Cancelar")}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t("Guardando...") : t("Guardar factura")}</Button></div>
      </form>
    </Modal>
    <Modal closeLabel={t('Cerrar')} busy={save.isPending} open={!!selected && !pendingRemoveItem} onClose={() => { setSelected(null); setAddingItem(false); }} title={t("Factura #{0}", {0: selected?.id ?? ''})} description={t("Detalle fiscal y conceptos asociados")} className="max-w-2xl">
      {selectedCurrent && <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-neutro-50 p-4 text-sm"><p><span className="text-neutro-500">{t("Cliente:")}</span><br />{selectedCurrent.nombre_fiscal}</p><p><span className="text-neutro-500">{t("NIT:")}</span><br />{selectedCurrent.nit}</p>
          <p><span className="text-neutro-500">{t("Fecha de registro:")}</span><br />{t(formatHotelDate(selectedCurrent.createdAt ?? selectedCurrent.fecha_emision))}</p>
          <p><span className="text-neutro-500">{t("Fecha de emisión:")}</span><br />{selectedCurrent.fecha_emision ? formatHotelDate(selectedCurrent.fecha_emision) : t("No registrada")}</p>
          <p>{t(selectedCurrent.precios_incluyen_impuestos ? "Base imponible:" : "Subtotal:")}<strong>{<AdminMoney amount={selectedCurrent.subtotal} />}</strong></p><p>{t("IVA:")}<strong>{<AdminMoney amount={selectedCurrent.iva} />}</strong></p><p>{t("INGUAT:")}<strong><AdminMoney amount={selectedCurrent.inguat ?? 0} /></strong></p><p className="col-span-2 text-lg">{t("Total:")}<strong>{<AdminMoney amount={selectedCurrent.total} />}</strong></p></div>
        <Alert tone="info">{t(selectedCurrent.precios_incluyen_impuestos ? "Los precios son finales. IVA incluido; INGUAT solo para hospedaje. No se añaden impuestos al total." : "Documento anterior con precios base. El precio unitario se registra sin IVA.")}</Alert>
        <div className="flex items-center justify-between"><h3 className="font-serif text-lg font-semibold">{t("Conceptos de factura")}</h3>
          <Button size="sm" onClick={() => { setAddingItem(true); setError(null); }}><Plus className="mr-2 inline size-4" />{t("Agregar concepto")}</Button></div>
        {items.isPending ? <p className="text-sm">{t("Cargando conceptos...")}</p> : items.isError ? <Alert tone="error">{readableError(items.error)}</Alert> : detailItems.length === 0 ? <p className="text-sm text-neutro-500">{t("Esta factura todavía no tiene conceptos.")}</p> :
          <div className="space-y-2">{detailItems.map(item => <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm">
            <div><p className="font-semibold">{item.descripcion}</p><p className="text-xs text-neutro-500">{item.cantidad} {t("×")}{<AdminMoney amount={item.precio_unitario} />} = {<AdminMoney amount={item.subtotal} />}</p></div>
            <Button size="sm" variant="ghost" aria-label={t("Quitar {0}", {0: item.descripcion})} onClick={() => setPendingRemoveItem(item)} disabled={save.isPending}><Trash2 className="size-4" /></Button>
          </div>)}</div>}
        {addingItem && <form className="flex flex-col gap-3 rounded-lg bg-neutro-50 p-4" onSubmit={submitItem}>
          {selectedCurrent.precios_incluyen_impuestos && <label className="flex flex-col gap-2 text-xs font-semibold text-neutro-700">{t("Tipo de concepto")}<select className="field-control" aria-label={t("Tipo de concepto")} value={itemForm.tipo_concepto} onChange={e => setItemForm({ ...itemForm, tipo_concepto: e.target.value })}><option value="servicio">{t("Otros servicios (IVA incluido)")}</option><option value="hospedaje">{t("Hospedaje (IVA e INGUAT incluidos)")}</option></select></label>}
          <Input label={t("Descripción")} required maxLength={255} value={itemForm.descripcion} onChange={e => setItemForm({ ...itemForm, descripcion: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Input label={t("Cantidad")} type="number" min={1} step={1} required value={itemForm.cantidad} onChange={e => setItemForm({ ...itemForm, cantidad: e.target.value })} />
          <Input label={t(selectedCurrent.precios_incluyen_impuestos ? "Precio unitario final (GTQ)" : "Precio unitario (GTQ)")} type="number" min={0} step="0.01" required value={itemForm.precio_unitario} onChange={e => setItemForm({ ...itemForm, precio_unitario: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setAddingItem(false)}>{t("Cancelar")}</Button><Button type="submit" disabled={save.isPending}>{t("Guardar concepto")}</Button></div>
        </form>}
        {error && <Alert tone="error">{error}</Alert>}
        <p className="flex items-start gap-2 text-xs text-neutro-500"><Receipt className="size-4 shrink-0" />{t("El servidor recalcula los importes al crear o eliminar conceptos. Este registro no constituye un DTE certificado.")}</p>
      </div>}
    </Modal>
    <ConfirmActionModal open={!!pendingRemoveItem} title={t("Eliminar concepto de factura")}
      description={t("Se eliminará el concepto seleccionado y el servidor recalculará el subtotal, IVA y total de la factura.")}
      target={pendingRemoveItem?.descripcion ?? ''} confirmLabel="Eliminar concepto" busy={save.isPending}
      onClose={() => setPendingRemoveItem(null)} onConfirm={() => void removeItem()} />
    <p className="flex items-center gap-2 text-xs text-neutro-500"><FileText className="size-4" />{t("Control documental interno. La emisión electrónica certificada requiere integración FEL independiente.")}</p>
  </div>;
};
