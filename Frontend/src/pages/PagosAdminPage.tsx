import React, { useMemo, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Pago } from '@/features/pagos/types';
import { useAdminList } from '@/features/admin-core/workbench';
import { useUrlFilters } from '@/features/personal/useUrlFilters';
import { useLocale } from '@/i18n/LocaleContext';
import { Amount, EstadoPagoBadge, hotelDateTime, hotelDay, maskReference } from '@/features/finanzas/common';
import { PagoDetalle } from '@/features/finanzas/PagoDetalle';
import { useTextosFinanzas } from '@/features/finanzas/textos';

interface Carrito { id: number; usuario_id: number }
interface Usuario { id: number; nombre: string; email: string }
const PAGE_SIZE = 20;
const ESTADOS = ['pendiente', 'procesando', 'aprobado', 'rechazado', 'cancelado', 'reembolsado', 'reembolsado_parcial'];
const METODOS = ['tarjeta', 'efectivo', 'transferencia'];
const field = 'h-10 w-full rounded-lg border border-neutro-300 bg-white px-3 text-sm text-neutro-900 focus:border-bronce-600 focus:outline-none focus:ring-2 focus:ring-bronce-600/30';

export const PagosAdminPage: React.FC = () => {
  const t = useTextosFinanzas();
  const { locale } = useLocale();
  const { params, update } = useUrlFilters();
  const [selected, setSelected] = useState<number | null>(null);
  const payments = useAdminList<Pago>('pagos', '/pagos');
  const carts = useAdminList<Carrito>('pagos-carritos', '/carritos');
  const users = useAdminList<Usuario>('pagos-usuarios', '/usuarios');
  const q = params.get('q') ?? '', estado = params.get('estado') ?? '', metodo = params.get('metodo') ?? '';
  const desde = params.get('desde') ?? '', hasta = params.get('hasta') ?? '';
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);

  const clienteDe = useMemo(() => {
    const byUser = new Map((users.data ?? []).map(u => [u.id, u]));
    const byCart = new Map((carts.data ?? []).map(c => [c.id, c.usuario_id]));
    return (p: Pago) => { const u = p.carrito_id ? byUser.get(byCart.get(p.carrito_id) ?? -1) : undefined; return u ? `${u.nombre}` : null; };
  }, [users.data, carts.data]);

  const all = payments.data ?? [];
  const ordered = useMemo(() => [...all].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id - a.id), [all]);
  const needle = q.trim().toLowerCase();
  const visible = ordered.filter(p => {
    const day = hotelDay(p.fecha_pago ?? p.createdAt);
    if (estado && p.estado !== estado) return false;
    if (metodo && p.metodo !== metodo) return false;
    if (desde && day < desde) return false;
    if (hasta && day > hasta) return false;
    if (!needle) return true;
    return [p.id, p.carrito_id, p.reserva_habitacion_id, p.id_transaccion_externo, clienteDe(p)].some(v => String(v ?? '').toLowerCase().includes(needle));
  });
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(pagina, pages);
  const rows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const sum = (list: Pago[]) => list.reduce((s, p) => s + Number(p.monto || 0), 0);
  const aprobados = all.filter(p => p.estado === 'aprobado');
  const enCurso = all.filter(p => p.estado === 'pendiente' || p.estado === 'procesando');
  const noCompl = all.filter(p => p.estado === 'rechazado' || p.estado === 'cancelado');
  const filtered = !!(q || estado || metodo || desde || hasta);
  const detail = all.find(p => p.id === selected) ?? null;
  const origen = (p: Pago) => p.carrito_id ? t.carritoN(p.carrito_id) : p.reserva_habitacion_id ? t.habitacionN(p.reserva_habitacion_id) : t.sinOrigen;

  const kpi = (label: string, value: React.ReactNode, note: string) => (
    <div className="rounded-xl border border-neutro-200 bg-white px-4 py-3"><p className="text-xs text-neutro-500">{label}</p><p className="mt-0.5 text-lg font-semibold text-neutro-900">{value}</p><p className="text-xs text-neutro-400">{note}</p></div>
  );

  return (
    <div className="space-y-5">
      <header><p className="text-xs font-medium text-neutro-500">{t.pagosCategoria}</p><h1 className="font-sans text-2xl font-semibold text-neutro-900">{t.pagosTitulo}</h1></header>
      {payments.isLoading ? <p role="status" className="text-sm text-neutro-500">{t.cargando}</p>
        : payments.isError ? <div role="alert" className="rounded-xl border border-error-600/20 bg-error-50 p-4 text-sm text-error-700">{t.errorP} <Button variant="secondary" size="sm" onClick={() => payments.refetch()}>{t.reintentar}</Button></div>
        : <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpi(t.kpi.transacciones, all.length, '')}
            {kpi(t.kpi.cobrado, <Amount amount={sum(aprobados)} />, t.kpi.soloAprobados)}
            {kpi(t.kpi.enCurso, enCurso.length, t.kpi.pendProc)}
            {kpi(t.kpi.noCompletados, noCompl.length, t.pagoNoCobrado)}
          </div>
          <form role="search" onSubmit={e => e.preventDefault()} className="grid gap-3 rounded-xl border border-neutro-200 bg-white p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_9.5rem_9.5rem_auto]">
            <label className="relative sm:col-span-2 xl:col-span-1"><span className="sr-only">{t.buscarPago}</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutro-400" aria-hidden />
              <input className={`${field} pl-9`} value={q} placeholder={t.buscarPago} onChange={e => update({ q: e.target.value })} /></label>
            <label><span className="sr-only">{t.estado}</span><select aria-label={t.estado} className={field} value={estado} onChange={e => update({ estado: e.target.value })}><option value="">{t.todosEstados}</option>{ESTADOS.map(s => <option key={s} value={s}>{t.estados[s]}</option>)}</select></label>
            <label><span className="sr-only">{t.metodo}</span><select aria-label={t.metodo} className={field} value={metodo} onChange={e => update({ metodo: e.target.value })}><option value="">{t.todosMetodos}</option>{METODOS.map(s => <option key={s} value={s}>{t.metodos[s]}</option>)}</select></label>
            <label><span className="sr-only">{t.desde}</span><input type="date" aria-label={t.desde} title={t.desde} className={field} value={desde} onChange={e => update({ desde: e.target.value })} /></label>
            <label><span className="sr-only">{t.hasta}</span><input type="date" aria-label={t.hasta} title={t.hasta} className={field} value={hasta} onChange={e => update({ hasta: e.target.value })} /></label>
            {filtered && <Button type="button" variant="ghost" size="sm" onClick={() => update({ q: null, estado: null, metodo: null, desde: null, hasta: null })}>{t.limpiar}</Button>}
          </form>
          {rows.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 p-6 text-center text-sm text-neutro-500">{all.length === 0 ? t.vacioP : t.sinResultadosP}</p> : <>
            <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutro-50 text-xs text-neutro-500"><tr>{[t.colP.pago, t.colP.fecha, t.colP.cliente, t.colP.concepto, t.colP.metodo, t.colP.importe, t.colP.estado, t.colP.acciones].map(h => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-neutro-100">{rows.map(p => (
                  <tr key={p.id} className="hover:bg-neutro-50">
                    <td className="px-4 py-3"><p className="font-semibold">#{p.id}</p><p className="whitespace-nowrap font-mono text-xs text-neutro-400">{maskReference(p.id_transaccion_externo)}</p></td>
                    <td className="px-4 py-3 whitespace-nowrap text-neutro-700">{hotelDateTime(p.fecha_pago ?? p.createdAt, locale)}</td>
                    <td className="px-4 py-3">{clienteDe(p) ?? <span className="text-neutro-400">{t.clienteNoIdentificado}</span>}</td>
                    <td className="px-4 py-3 text-neutro-700">{origen(p)}</td>
                    <td className="px-4 py-3">{t.metodos[p.metodo] ?? p.metodo}</td>
                    <td className="px-4 py-3 font-semibold"><Amount amount={p.monto} currency={p.moneda} /></td>
                    <td className="px-4 py-3"><EstadoPagoBadge estado={p.estado} /></td>
                    <td className="px-4 py-3"><Button variant="secondary" size="sm" aria-label={t.verPago(p.id)} onClick={() => setSelected(p.id)}><Eye className="h-4 w-4" aria-hidden /><span className="hidden 2xl:inline">{t.ver}</span></Button></td>
                  </tr>))}</tbody>
              </table>
            </div>
            <ul className="space-y-2 xl:hidden">{rows.map(p => (
              <li key={p.id} className="rounded-xl border border-neutro-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">#{p.id} · {origen(p)}</p><p className="text-xs text-neutro-500">{hotelDateTime(p.fecha_pago ?? p.createdAt, locale)}</p></div><EstadoPagoBadge estado={p.estado} /></div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-neutro-600">{clienteDe(p) ?? t.clienteNoIdentificado} · {t.metodos[p.metodo] ?? p.metodo}</span><span className="font-semibold"><Amount amount={p.monto} currency={p.moneda} /></span></div>
                <Button className="mt-2" variant="secondary" size="sm" aria-label={t.verPago(p.id)} onClick={() => setSelected(p.id)}><Eye className="h-4 w-4" aria-hidden />{t.ver}</Button>
              </li>))}</ul>
          </>}
          {visible.length > PAGE_SIZE && (
            <nav aria-label="Paginación" className="flex items-center justify-between gap-3 text-sm text-neutro-600">
              <span>{t.pagina((current - 1) * PAGE_SIZE + 1, Math.min(current * PAGE_SIZE, visible.length), visible.length)}</span>
              <div className="flex items-center gap-2"><Button variant="secondary" size="sm" disabled={current <= 1} onClick={() => update({ pagina: String(current - 1) })}>{t.anterior}</Button><span>{t.paginaDe(current, pages)}</span><Button variant="secondary" size="sm" disabled={current >= pages} onClick={() => update({ pagina: String(current + 1) })}>{t.siguiente}</Button></div>
            </nav>)}
        </>}
      {detail && <PagoDetalle pago={detail} cliente={clienteDe(detail)} onClose={() => setSelected(null)} />}
    </div>
  );
};
export default PagosAdminPage;
