import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldAlert } from 'lucide-react';
import { Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyRecords, Metric, OperationsState, OperationsTitle, StatusPill } from '@/features/operaciones/OperationsUI';
import { dineroGTQ, fechaCorta, operacionesApi } from '@/features/operaciones/operacionesApi';

export const PagosAdminPage: React.FC = () => {
  const pagosQuery = useQuery({ queryKey: ['admin', 'pagos'], queryFn: operacionesApi.pagos });
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('todos');
  const [metodo, setMetodo] = useState('todos');
  const pagos = pagosQuery.data ?? [];
  const filtrados = useMemo(() => pagos.filter(p =>
    (estado === 'todos' || p.estado === estado) &&
    (metodo === 'todos' || p.metodo === metodo) &&
    (!search.trim() || `${p.id} ${p.carrito_id ?? ''} ${p.reserva_habitacion_id ?? ''}`.includes(search.trim()))
  ), [pagos, search, estado, metodo]);
  const aprobados = pagos.filter(p => p.estado === 'aprobado');
  const totalAprobado = aprobados.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const enRevision = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'procesando').length;
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
    <OperationsTitle overline="Control financiero" title="Pagos y reembolsos" description="Seguimiento de transacciones registradas, estados y referencias de reservas.">
      <Button variant="secondary" onClick={() => void pagosQuery.refetch()}>Actualizar</Button>
    </OperationsTitle>
    <Alert tone="info" title="Consulta protegida">Para esta versión, las operaciones de aprobación, cobro y reembolso no están habilitadas desde el panel. El flujo financiero requiere cerrar las pruebas de integridad e idempotencia antes de efectuar movimientos.</Alert>
    <OperationsState loading={pagosQuery.isPending} error={pagosQuery.error} retry={() => void pagosQuery.refetch()}/>
    {!pagosQuery.isPending && !pagosQuery.isError && <>
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Transacciones" value={pagos.length}/><Metric label="Pendientes / procesando" value={enRevision}/><Metric label="Monto aprobado registrado" value={dineroGTQ(totalAprobado)} detail="No descuenta reembolsos ni representa un balance contable."/></div>
      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative"><Search className="absolute left-3 top-3 size-4 text-neutro-400"/><input aria-label="Buscar pagos" className="field-control pl-10" placeholder="ID de pago, carrito o reserva" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select aria-label="Filtrar pagos por estado" className="field-control" value={estado} onChange={e=>setEstado(e.target.value)}><option value="todos">Todos los estados</option>{['pendiente','procesando','aprobado','rechazado','cancelado','reembolsado','reembolsado_parcial'].map(v=><option key={v} value={v}>{v.replace('_',' ')}</option>)}</select>
        <select aria-label="Filtrar pagos por método" className="field-control" value={metodo} onChange={e=>setMetodo(e.target.value)}><option value="todos">Todos los métodos</option><option value="tarjeta">Tarjeta</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select>
      </Card>
      {filtrados.length===0?<EmptyRecords/>:<div className="overflow-x-auto rounded-2xl border border-neutro-200 bg-white shadow-sm"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b bg-neutro-50 text-xs uppercase text-neutro-600"><tr><th className="p-4">Pago</th><th className="p-4">Referencia</th><th className="p-4">Método / tipo</th><th className="p-4">Importe</th><th className="p-4">Estado</th><th className="p-4">Fecha</th></tr></thead><tbody className="divide-y">{filtrados.map(p=><tr className="hover:bg-neutro-50" key={p.id}><td className="p-4 font-semibold">#{p.id}</td><td className="p-4">{p.carrito_id!=null?`Carrito #${p.carrito_id}`:p.reserva_habitacion_id!=null?`Habitación #${p.reserva_habitacion_id}`:'Sin referencia'}</td><td className="p-4 capitalize">{p.metodo}<div className="text-xs text-neutro-500">{p.tipo_pago}</div></td><td className="p-4 font-semibold">{dineroGTQ(p.monto)}</td><td className="p-4"><StatusPill value={p.estado}/></td><td className="p-4">{fechaCorta(p.fecha_pago || p.createdAt)}</td></tr>)}</tbody></table></div>}
      <p className="flex items-center gap-2 text-xs text-neutro-500"><ShieldAlert className="size-4"/> Se muestran estados persistidos por el backend; esta pantalla no realiza operaciones sobre pasarelas de pago.</p>
    </>}
  </div>;
};
