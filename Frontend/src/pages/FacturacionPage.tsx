import React, { useState } from 'react';
import { Eye, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Feedback';
import { useAdminI18n } from '@/features/admin-core/i18n';
import { ActionError, ConfirmActionModal, useAdminList, useAdminSave, readableError } from '@/features/admin-core/workbench';
import { useUrlFilters } from '@/features/personal/useUrlFilters';
import { useLocale } from '@/i18n/LocaleContext';
import { Amount, EstadoFacturaBadge, hotelDate, hotelDay } from '@/features/finanzas/common';
import { useTextosFinanzas } from '@/features/finanzas/textos';

interface Factura { id: number; usuario_id: number; nit: string; nombre_fiscal: string; direccion_fiscal: string | null; precios_incluyen_impuestos?: boolean; inguat?: string | number; subtotal: string | number; iva: string | number; total: string | number; estado: string; fecha_emision: string | null; createdAt?: string | null }
interface FacturaItem { id: number; factura_id: number; descripcion: string; cantidad: number; precio_unitario: string | number; subtotal: string | number }
interface Usuario { id: number; nombre: string; email: string }
const initial = { usuario_id: '', nit: '', nombre_fiscal: '', direccion_fiscal: '' };
const initialItem = { descripcion: '', cantidad: '1', precio_unitario: '', tipo_concepto: 'servicio' };
const PAGE_SIZE = 20;
const field = 'h-10 w-full rounded-lg border border-neutro-300 bg-white px-3 text-sm text-neutro-900 focus:border-bronce-600 focus:outline-none focus:ring-2 focus:ring-bronce-600/30';

export const FacturacionPage: React.FC = () => {
  const t = useTextosFinanzas();
  const { t: ta } = useAdminI18n();
  const { locale } = useLocale();
  const { user } = useAuth();
  const { params, update } = useUrlFilters();
  const invoices = useAdminList<Factura>('facturas', '/facturas');
  const items = useAdminList<FacturaItem>('factura-items', '/factura-items');
  const users = useAdminList<Usuario>('factura-usuarios', '/usuarios', user?.rol === 'admin');
  const save = useAdminSave('facturas');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Factura | 'new' | null>(null);
  const [form, setForm] = useState(initial);
  const [itemForm, setItemForm] = useState(initialItem);
  const [addingItem, setAddingItem] = useState(false);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<FacturaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const q = params.get('q') ?? '', estado = params.get('estado') ?? '', desde = params.get('desde') ?? '', hasta = params.get('hasta') ?? '';
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const all = [...(invoices.data ?? [])].sort((a, b) => b.id - a.id);
  const needle = q.trim().toLowerCase();
  const visible = all.filter(x => {
    const day = hotelDay(x.createdAt ?? x.fecha_emision);
    if (estado && x.estado !== estado) return false;
    if (desde && day < desde) return false;
    if (hasta && day > hasta) return false;
    return !needle || [x.id, x.nit, x.nombre_fiscal, x.usuario_id].some(v => String(v ?? '').toLowerCase().includes(needle));
  });
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(pagina, pages);
  const rows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtered = !!(q || estado || desde || hasta);
  const selected = all.find(x => x.id === selectedId) ?? null;
  const detailItems = (items.data ?? []).filter(i => i.factura_id === selected?.id);
  const refresh = () => { void invoices.refetch(); void items.refetch(); };
  const openForm = (value: Factura | 'new') => {
    setError(null); setNotice(null); setEditing(value);
    setForm(value === 'new' ? initial : { usuario_id: String(value.usuario_id), nit: value.nit, nombre_fiscal: value.nombre_fiscal, direccion_fiscal: value.direccion_fiscal ?? '' });
  };
  const submitInvoice = async (event: React.FormEvent) => {
    event.preventDefault(); if (save.isPending) return; setError(null);
    const usuarioId = Number(form.usuario_id);
    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) { setError(t.errUsuario); return; }
    if (!form.nit.trim() || !form.nombre_fiscal.trim()) { setError(t.errNit); return; }
    try {
      const body = { usuario_id: usuarioId, nit: form.nit.trim().toUpperCase(), nombre_fiscal: form.nombre_fiscal.trim(), direccion_fiscal: form.direccion_fiscal.trim() || null };
      if (editing === 'new') await save.mutateAsync({ endpoint: '/facturas', method: 'POST', body: { ...body, subtotal: 0, precios_incluyen_impuestos: true } });
      else if (editing) await save.mutateAsync({ endpoint: `/facturas/${editing.id}`, method: 'PATCH', body });
      setEditing(null); setNotice(t.okFactura);
    } catch (e) { setError(ta(readableError(e))); }
  };
  const submitItem = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || save.isPending) return; setError(null);
    const cantidad = Number(itemForm.cantidad), precio = Number(itemForm.precio_unitario);
    if (!itemForm.descripcion.trim() || !Number.isSafeInteger(cantidad) || cantidad <= 0 || !Number.isFinite(precio) || precio < 0) { setError(t.errConcepto); return; }
    try {
      await save.mutateAsync({ endpoint: '/factura-items', method: 'POST', body: { factura_id: selected.id, descripcion: itemForm.descripcion.trim(), cantidad, precio_unitario: precio, ...(selected.precios_incluyen_impuestos ? { tipo_concepto: itemForm.tipo_concepto } : {}) } });
      await invoices.refetch();
      setItemForm(initialItem); setAddingItem(false); setNotice(t.okConcepto);
    } catch (e) { setError(ta(readableError(e))); }
  };
  const removeItem = async () => {
    if (!pendingRemoveItem) return; setError(null);
    try {
      await save.mutateAsync({ endpoint: `/factura-items/${pendingRemoveItem.id}`, method: 'DELETE' });
      await invoices.refetch(); setPendingRemoveItem(null); setNotice(t.okQuitar);
    } catch (e) { setPendingRemoveItem(null); setError(ta(readableError(e))); }
  };
  const kpi = (label: string, value: React.ReactNode, note = '') => (
    <div className="rounded-xl border border-neutro-200 bg-white px-4 py-3"><p className="text-xs text-neutro-500">{label}</p><p className="mt-0.5 text-lg font-semibold text-neutro-900">{value}</p><p className="text-xs text-neutro-400">{note}</p></div>
  );
  const registro = (x: Factura) => hotelDate(x.createdAt ?? x.fecha_emision, locale);
  const openView = (x: Factura) => { setSelectedId(x.id); setAddingItem(false); setError(null); };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-medium text-neutro-500">{t.facturasCategoria}</p><h1 className="font-sans text-2xl font-semibold text-neutro-900">{t.facturasTitulo}</h1></div>
        <Button onClick={() => openForm('new')}><Plus className="mr-2 inline size-4" aria-hidden />{t.nuevaFactura}</Button>
      </header>
      <p className="rounded-lg border border-info-600/20 bg-info-50 px-3 py-2 text-xs text-info-700">{t.docInterno}</p>
      <ActionError error={error && !selected && !editing ? error : null} success={notice} />
      {invoices.isLoading ? <p role="status" className="text-sm text-neutro-500">{t.cargando}</p>
        : invoices.isError ? <div role="alert" className="rounded-xl border border-error-600/20 bg-error-50 p-4 text-sm text-error-700">{t.errorF} <Button variant="secondary" size="sm" onClick={refresh}>{t.reintentar}</Button></div>
        : <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi(t.kpiF.registradas, all.length)}
            {kpi(t.kpiF.pendientes, all.filter(x => x.estado === 'pendiente').length)}
            {kpi(t.kpiF.pagadas, all.filter(x => x.estado === 'pagada').length)}
            {kpi(t.kpiF.total, <Amount amount={visible.reduce((s, x) => s + Number(x.total || 0), 0)} />, t.kpiF.totalNota)}
          </div>
          <form role="search" onSubmit={e => e.preventDefault()} className="grid gap-3 rounded-xl border border-neutro-200 bg-white p-3 sm:grid-cols-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(10rem,1fr)_9.5rem_9.5rem_auto]">
            <label className="relative sm:col-span-3 xl:col-span-1"><span className="sr-only">{t.buscarFactura}</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutro-400" aria-hidden />
              <input className={`${field} pl-9`} value={q} placeholder={t.buscarFactura} onChange={e => update({ q: e.target.value })} /></label>
            <select aria-label={t.estado} className={field} value={estado} onChange={e => update({ estado: e.target.value })}><option value="">{t.todosEstados}</option>{Object.entries(t.estadosF).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input type="date" aria-label={t.desde} title={t.desde} className={field} value={desde} onChange={e => update({ desde: e.target.value })} />
            <input type="date" aria-label={t.hasta} title={t.hasta} className={field} value={hasta} onChange={e => update({ hasta: e.target.value })} />
            {filtered && <Button type="button" variant="ghost" size="sm" onClick={() => update({ q: null, estado: null, desde: null, hasta: null })}>{t.limpiar}</Button>}
          </form>
          {rows.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 p-6 text-center text-sm text-neutro-500">{all.length === 0 ? t.vacioF : t.sinResultadosF}</p> : <>
            <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutro-50 text-xs text-neutro-500"><tr>{Object.values(t.colF).map(h => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-neutro-100">{rows.map(x => (
                  <tr key={x.id} className="hover:bg-neutro-50">
                    <td className="px-4 py-3 font-semibold">#{x.id}</td>
                    <td className="px-4 py-3"><p className="font-medium">{x.nombre_fiscal}</p><p className="text-xs text-neutro-500">{t.nit}: {x.nit}</p></td>
                    <td className="px-4 py-3"><p>{registro(x)}</p><p className="text-xs text-neutro-500">{x.fecha_emision ? `${t.emitida}: ${hotelDate(x.fecha_emision, locale)}` : t.sinEmision}</p></td>
                    <td className="px-4 py-3"><EstadoFacturaBadge estado={x.estado} /></td>
                    <td className="px-4 py-3 font-semibold"><Amount amount={x.total} /></td>
                    <td className="px-4 py-3"><div className="flex gap-2">
                      <Button size="sm" variant="secondary" aria-label={t.verFactura(x.id)} onClick={() => openView(x)}><Eye className="h-4 w-4" aria-hidden /></Button>
                      <Button size="sm" variant="secondary" aria-label={t.editarFactura(x.id)} onClick={() => openForm(x)}><Pencil className="h-4 w-4" aria-hidden /></Button></div></td>
                  </tr>))}</tbody>
              </table>
            </div>
            <ul className="space-y-2 xl:hidden">{rows.map(x => (
              <li key={x.id} className="rounded-xl border border-neutro-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold">#{x.id} · {x.nombre_fiscal}</p><p className="text-xs text-neutro-500">{t.nit}: {x.nit} · {registro(x)}</p></div><EstadoFacturaBadge estado={x.estado} /></div>
                <div className="mt-2 flex items-center justify-between gap-2"><span className="font-semibold"><Amount amount={x.total} /></span>
                  <div className="flex gap-2"><Button size="sm" variant="secondary" aria-label={t.verFactura(x.id)} onClick={() => openView(x)}><Eye className="h-4 w-4" aria-hidden /></Button><Button size="sm" variant="secondary" aria-label={t.editarFactura(x.id)} onClick={() => openForm(x)}><Pencil className="h-4 w-4" aria-hidden /></Button></div></div>
              </li>))}</ul>
          </>}
          {visible.length > PAGE_SIZE && (
            <nav aria-label="Paginación" className="flex items-center justify-between gap-3 text-sm text-neutro-600">
              <span>{t.pagina((current - 1) * PAGE_SIZE + 1, Math.min(current * PAGE_SIZE, visible.length), visible.length)}</span>
              <div className="flex items-center gap-2"><Button variant="secondary" size="sm" disabled={current <= 1} onClick={() => update({ pagina: String(current - 1) })}>{t.anterior}</Button><span>{t.paginaDe(current, pages)}</span><Button variant="secondary" size="sm" disabled={current >= pages} onClick={() => update({ pagina: String(current + 1) })}>{t.siguiente}</Button></div>
            </nav>)}
        </>}

      <Modal open={editing !== null} onClose={() => setEditing(null)} busy={save.isPending} closeLabel={t.cerrar} title={editing === 'new' ? t.nuevaFactura : t.editarFacturaTitulo(editing?.id ?? '')} description={t.formNota}>
        <form className="flex flex-col gap-4" onSubmit={submitInvoice}>
          {users.data?.length ? <label className="flex flex-col gap-2 text-xs font-semibold text-neutro-700">{t.formUsuario}<select className="field-control" value={form.usuario_id} required onChange={e => setForm({ ...form, usuario_id: e.target.value })}><option value="">{t.elegirUsuario}</option>
            {users.data.map(u => <option key={u.id} value={u.id}>{u.nombre} · {u.email}</option>)}</select></label>
            : <Input label={t.idUsuario} type="number" min={1} required value={form.usuario_id} onChange={e => setForm({ ...form, usuario_id: e.target.value })} />}
          <Input label={t.nit} maxLength={20} required spellCheck={false} autoCapitalize="characters" hint={t.nitAyuda} value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value.toUpperCase() })} />
          <Input label={t.nombreFiscal} maxLength={150} required value={form.nombre_fiscal} onChange={e => setForm({ ...form, nombre_fiscal: e.target.value })} />
          <Input label={t.direccion} maxLength={255} value={form.direccion_fiscal} onChange={e => setForm({ ...form, direccion_fiscal: e.target.value })} />
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setEditing(null)}>{t.cancelar}</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? t.guardando : t.guardarFactura}</Button></div>
        </form>
      </Modal>

      <Modal closeLabel={t.cerrar} busy={save.isPending} open={!!selected && !pendingRemoveItem} onClose={() => { setSelectedId(null); setAddingItem(false); }} title={t.facturaTitulo(selected?.id ?? 0)} description={t.docInterno} className="max-w-2xl">
        {selected && <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-neutro-50 p-4 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-neutro-500">{t.gTitular}</dt><dd className="font-medium">{selected.nombre_fiscal}</dd></div>
            <div><dt className="text-xs text-neutro-500">{t.nit}</dt><dd className="font-medium">{selected.nit}</dd></div>
            <div><dt className="text-xs text-neutro-500">{t.colF.estado}</dt><dd><EstadoFacturaBadge estado={selected.estado} /></dd></div>
            <div><dt className="text-xs text-neutro-500">{t.registrada}</dt><dd className="font-medium">{registro(selected)}</dd></div>
            <div><dt className="text-xs text-neutro-500">{t.emitida}</dt><dd className="font-medium">{selected.fecha_emision ? hotelDate(selected.fecha_emision, locale) : t.sinRegistrar}</dd></div>
            <div><dt className="text-xs text-neutro-500">{selected.precios_incluyen_impuestos ? t.baseImponible : t.subtotal}</dt><dd className="font-medium"><Amount amount={selected.subtotal} /></dd></div>
            <div><dt className="text-xs text-neutro-500">{t.iva}</dt><dd className="font-medium"><Amount amount={selected.iva} /></dd></div>
            <div><dt className="text-xs text-neutro-500">{t.inguat}</dt><dd className="font-medium"><Amount amount={selected.inguat ?? 0} /></dd></div>
            <div><dt className="text-xs text-neutro-500">{t.total}</dt><dd className="text-lg font-semibold"><Amount amount={selected.total} /></dd></div>
          </dl>
          <p className="text-xs text-neutro-500">{selected.precios_incluyen_impuestos ? t.notaImpuestos : t.notaBase} {t.sinPagoAsociado}</p>
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{t.conceptos}</h3><Button size="sm" onClick={() => { setAddingItem(true); setError(null); }}><Plus className="mr-1 inline size-4" aria-hidden />{t.agregarConcepto}</Button></div>
          {items.isPending ? <p role="status" className="text-sm">{t.cargando}</p> : items.isError ? <Alert tone="error">{readableError(items.error)}</Alert>
            : detailItems.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 p-3 text-sm text-neutro-500">{t.sinConceptos}</p>
            : <div className="space-y-2">{detailItems.map(item => <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-neutro-200 p-3 text-sm">
              <div className="min-w-0"><p className="font-semibold break-words">{item.descripcion}</p><p className="text-xs text-neutro-500">{item.cantidad} × <Amount amount={item.precio_unitario} /> = <Amount amount={item.subtotal} /></p></div>
              <Button size="sm" variant="ghost" aria-label={t.quitarConcepto(item.descripcion)} onClick={() => setPendingRemoveItem(item)} disabled={save.isPending}><Trash2 className="size-4" aria-hidden /></Button></div>)}</div>}
          {addingItem && <form className="flex flex-col gap-3 rounded-lg bg-neutro-50 p-4" onSubmit={submitItem}>
            {selected.precios_incluyen_impuestos && <label className="flex flex-col gap-2 text-xs font-semibold text-neutro-700">{t.tipoConcepto}<select className="field-control" value={itemForm.tipo_concepto} onChange={e => setItemForm({ ...itemForm, tipo_concepto: e.target.value })}><option value="servicio">{t.conceptoServicio}</option><option value="hospedaje">{t.conceptoHospedaje}</option></select></label>}
            <Input label={t.descripcion} required maxLength={255} value={itemForm.descripcion} onChange={e => setItemForm({ ...itemForm, descripcion: e.target.value })} />
            <div className="grid grid-cols-2 gap-3"><Input label={t.cantidad} type="number" min={1} step={1} required value={itemForm.cantidad} onChange={e => setItemForm({ ...itemForm, cantidad: e.target.value })} />
              <Input label={selected.precios_incluyen_impuestos ? t.precioFinal : t.precioBase} type="number" min={0} step="0.01" required value={itemForm.precio_unitario} onChange={e => setItemForm({ ...itemForm, precio_unitario: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setAddingItem(false)}>{t.cancelar}</Button><Button type="submit" disabled={save.isPending}>{t.guardarConcepto}</Button></div>
          </form>}
          {error && <Alert tone="error">{error}</Alert>}
          <p className="flex items-start gap-2 text-xs text-neutro-500"><Receipt className="size-4 shrink-0" aria-hidden />{t.docInterno}</p>
        </div>}
      </Modal>
      <ConfirmActionModal open={!!pendingRemoveItem} title={t.quitarTitulo} description={t.quitarDesc} target={pendingRemoveItem?.descripcion ?? ''} confirmLabel={t.eliminarConcepto} busy={save.isPending} onClose={() => setPendingRemoveItem(null)} onConfirm={() => void removeItem()} />
    </div>
  );
};
export default FacturacionPage;
