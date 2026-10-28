import { useAdminI18n } from '@/features/admin-core/i18n';
import React, { useState } from 'react';
import { ShieldAlert, Eye, LockKeyhole } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Feedback';
import type { Pago } from '@/features/pagos/types';
import { AdminHeading, StatCard, SearchBox, QueryPanel, useAdminList, AdminMoney, date, lower } from '@/features/admin-core/workbench';

const states = ['pendiente', 'procesando', 'aprobado', 'rechazado', 'cancelado', 'reembolsado', 'reembolsado_parcial'];
const methods = ['tarjeta', 'efectivo', 'transferencia'];
const PAGE_SIZE = 20;

export const PagosAdminPage: React.FC = () => {
  const { t } = useAdminI18n();
  const payments = useAdminList<Pago>('pagos', '/pagos');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('todos');
  const [metodo, setMetodo] = useState('todos');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Pago | null>(null);
  const all = payments.data ?? [];
  const visible = all.filter(p => (estado === 'todos' || p.estado === estado) && (metodo === 'todos' || p.metodo === metodo) &&
    [p.id, p.carrito_id, p.reserva_habitacion_id, p.id_transaccion_externo].some(v => lower(v).includes(lower(search))));
  const current = all.find(p => p.id === selected?.id) ?? selected;
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);
  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 pb-12">
    <AdminHeading category={t("Control financiero")} title={t("Pagos y reembolsos")} subtitle={t("Monitoreo de transacciones, referencias, estados de aprobación y seguimiento de devoluciones.")} onReload={() => void payments.refetch()} busy={payments.isFetching} />
    <Alert tone="info" title={t("Consulta de pagos")}>{t("Consulte transacciones y estados registrados. Para gestionar una devolución, comuníquese con la administración.")}</Alert>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={t("Transacciones")} value={all.length} />
      <StatCard label={t('Pendientes / procesando')} value={all.filter(p => ['pendiente', 'procesando'].includes(p.estado)).length} />
      <StatCard label={t("Aprobadas")} value={all.filter(p => p.estado === 'aprobado').length} />
      <StatCard label={t("Importe aprobado registrado")} value={<div className="flex flex-col gap-1">{Array.from(new Set(all.filter(p => p.estado === 'aprobado').map(p => p.moneda))).map(currency => <AdminMoney key={currency} currency={currency} amount={all.filter(p => p.estado === 'aprobado' && p.moneda === currency).reduce((n,p) => n + Number(p.monto),0)} />)}</div>} help={t("No descuenta devoluciones ni es balance contable.")} />
    </div>
    <Card className="grid gap-4 lg:grid-cols-[1fr_220px_220px]"><SearchBox search={search} onSearch={changeSearch} placeholder={t("ID de pago, carrito, reserva o referencia")} />
      <label className="flex flex-col gap-2 text-xs font-semibold text-neutro-700">{t("Estado")}<select className="field-control" value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }} aria-label={t("Filtrar por estado")}>
        <option value="todos">{t("Todos los estados")}</option>{states.map(x => <option key={x} value={x}>{t(x).replaceAll('_',' ')}</option>)}
      </select></label>
      <label className="flex flex-col gap-2 text-xs font-semibold text-neutro-700">{t("Método")}<select className="field-control" value={metodo} onChange={e => { setMetodo(e.target.value); setPage(1); }} aria-label={t("Filtrar por método")}>
        <option value="todos">{t("Todos los métodos")}</option>{methods.map(x => <option key={x} value={x}>{t(x)}</option>)}
      </select></label></Card>
    <QueryPanel pending={payments.isPending} error={payments.error} retry={() => void payments.refetch()} empty={visible.length === 0} filtered={!!search || estado !== 'todos' || metodo !== 'todos'}>
      <Card padding="none" className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-neutro-50 text-xs uppercase text-neutro-600"><tr>{[t("Pago"),t("Origen"),t("Método"),t("Tipo"),t("Importe"),t("Estado"),t("Detalle")].map(x => <th key={x} className="px-4 py-4">{x}</th>)}</tr></thead>
        <tbody className="divide-y divide-neutro-100">{pageItems.map(p => <tr key={p.id} className="hover:bg-neutro-50/70"><td className="px-4 py-4 font-semibold">#{p.id}<p className="text-xs font-normal text-neutro-500">{date(p.createdAt)}</p></td>
          <td className="px-4 py-4">{p.carrito_id ? t("Carrito #{0}", {0: p.carrito_id}) : p.reserva_habitacion_id ? t("Habitación #{0}", {0: p.reserva_habitacion_id}) : t("Sin referencia")}</td>
          <td className="px-4 py-4 capitalize">{t(p.metodo)}</td><td className="px-4 py-4 capitalize">{t(p.tipo_pago)}</td>
          <td className="px-4 py-4 font-semibold">{<AdminMoney amount={p.monto} currency={p.moneda} />}</td><td className="px-4 py-4"><Badge tone={p.estado === 'aprobado' ? 'exito' : p.estado === 'pendiente' || p.estado === 'procesando' ? 'advertencia' : p.estado === 'rechazado' ? 'error' : 'neutro'}>{t(p.estado).replaceAll('_',' ')}</Badge></td>
          <td className="px-4 py-4"><Button size="sm" variant="ghost" onClick={() => { setSelected(p); }} aria-label={t("Ver pago {0}", {0: p.id})}><Eye className="mr-1 inline size-4" />{t("Ver")}</Button></td></tr>)}</tbody>
      </table></div></Card>
      {pages > 1 && <div className="flex items-center justify-center gap-4"><Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("Anterior")}</Button><span className="text-sm">{t("Página")}{Math.min(page, pages)} {t("de")}{pages}</span><Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>{t("Siguiente")}</Button></div>}
    </QueryPanel>
    <Modal closeLabel={t('Cerrar')} open={!!current} onClose={() => setSelected(null)} title={t("Pago #{0}", {0: current?.id ?? ''})} description={t("Datos persistidos por el servidor, sin modificar el estado financiero.")}>
      {current && <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between"><Badge tone={current.estado === 'aprobado' ? 'exito' : 'advertencia'}>{t(current.estado).replaceAll('_',' ')}</Badge><strong className="font-serif text-2xl">{<AdminMoney amount={current.monto} currency={current.moneda} />}</strong></div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-lg bg-neutro-50 p-4 text-sm">
          {([[t("Método"),current.metodo],[t("Tipo de pago"),current.tipo_pago],[t("Moneda"),current.moneda],[t("Fecha de pago"),date(current.fecha_pago)],[t("Carrito"),current.carrito_id ? `#${current.carrito_id}` : '—'],[t("Reserva de habitación"),current.reserva_habitacion_id ? `#${current.reserva_habitacion_id}` : '—'],[t("Pasarela"),current.pasarela || '—']] as Array<[string,string]>).map(([k,v]) => <div key={k}><dt className="text-xs text-neutro-500">{k}</dt><dd className="mt-1 font-semibold">{t(v)}</dd></div>)}
        </dl>
        {current.id_transaccion_externo && <p className="break-all text-xs text-neutro-600">{t("Referencia de pasarela:")}{current.id_transaccion_externo}</p>}
        {current.mensaje_error && <Alert tone="warning" title={t("Información del procesamiento")}>{t("El pago requiere revisión. Consulte su estado antes de continuar.")}</Alert>}
        <p className="flex items-center gap-2 text-xs text-neutro-500"><LockKeyhole className="size-4 shrink-0" />{t("Consulta de solo lectura.")}</p>
      </div>}
    </Modal>
    <p className="flex items-center gap-2 text-xs text-neutro-500"><ShieldAlert className="size-4" />{t("El listado refleja estados almacenados por backend. No constituye conciliación bancaria ni contabilidad oficial.")}</p>
  </div>;
};
