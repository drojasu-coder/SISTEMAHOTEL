import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyRecords, Metric, OperationsState, OperationsTitle, StatusPill } from '@/features/operaciones/OperationsUI';
import { dineroGTQ, fechaCorta, operacionesApi, type Factura } from '@/features/operaciones/operacionesApi';

const FacturacionPage: React.FC = () => {
  const facturasQuery = useQuery({ queryKey: ['admin', 'facturas'], queryFn: operacionesApi.facturas });
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('todos');
  const [seleccion, setSeleccion] = useState<Factura | null>(null);
  const itemsQuery = useQuery({ queryKey: ['admin', 'factura-items'], queryFn: operacionesApi.facturaItems, enabled: Boolean(seleccion) });
  const facturas = facturasQuery.data ?? [];
  const filtradas = useMemo(() => facturas.filter((f) => {
    const text = search.toLowerCase().trim();
    return (estado === 'todos' || f.estado === estado) &&
      (!text || `${f.id} ${f.nit} ${f.nombre_fiscal} ${f.usuario_id}`.toLowerCase().includes(text));
  }), [facturas, search, estado]);
  const total = filtradas.reduce((sum, f) => sum + (Number(f.total) || 0), 0);
  const pendientes = facturas.filter((f) => f.estado === 'pendiente').length;

  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
    <OperationsTitle overline="Gestión financiera" title="Facturación" description="Consulta administrativa de documentos fiscales e importes registrados en el sistema.">
      <Button variant="secondary" onClick={() => void facturasQuery.refetch()}>Actualizar</Button>
    </OperationsTitle>
    <OperationsState loading={facturasQuery.isPending} error={facturasQuery.error} retry={() => void facturasQuery.refetch()} />
    {!facturasQuery.isPending && !facturasQuery.isError && <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Facturas registradas" value={facturas.length} />
        <Metric label="Facturas pendientes" value={pendientes} />
        <Metric label="Importe filtrado" value={dineroGTQ(total)} detail="Incluye los estados seleccionados; no representa ingresos cobrados." />
      </div>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 size-4 text-neutro-400" /><input aria-label="Buscar facturas" className="field-control pl-10" placeholder="Buscar por número, NIT o razón social" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select aria-label="Filtrar facturas por estado" className="field-control sm:max-w-52" value={estado} onChange={e => setEstado(e.target.value)}>
          <option value="todos">Todos los estados</option><option value="pendiente">Pendiente</option><option value="pagada">Pagada</option><option value="anulada">Anulada</option>
        </select>
      </Card>
      {filtradas.length === 0 ? <EmptyRecords /> : <div className="overflow-x-auto rounded-2xl border border-neutro-200 bg-white shadow-sm">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="border-b bg-neutro-50 text-xs uppercase text-neutro-600"><tr><th className="p-4">Factura</th><th className="p-4">Razón social</th><th className="p-4">Emisión</th><th className="p-4">Total</th><th className="p-4">Estado</th><th className="p-4">Acción</th></tr></thead>
          <tbody className="divide-y">{filtradas.map(f => <tr key={f.id} className="hover:bg-neutro-50"><td className="p-4 font-semibold">#{f.id}<div className="text-xs font-normal text-neutro-500">NIT {f.nit}</div></td><td className="p-4">{f.nombre_fiscal}</td><td className="p-4">{fechaCorta(f.fecha_emision || f.createdAt)}</td><td className="p-4 font-semibold">{dineroGTQ(f.total)}</td><td className="p-4"><StatusPill value={f.estado} /></td><td className="p-4"><Button variant="secondary" size="sm" onClick={() => setSeleccion(f)}>Ver detalle</Button></td></tr>)}</tbody>
        </table>
      </div>}
      {seleccion && <div role="dialog" aria-modal="true" aria-labelledby="detalle-factura" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutro-950/60 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-xl space-y-4 p-6"><div className="flex items-center justify-between gap-3"><h2 id="detalle-factura" className="flex items-center gap-2 font-serif text-xl font-semibold"><FileText className="size-5"/> Factura #{seleccion.id}</h2><Button variant="ghost" onClick={() => setSeleccion(null)}><X className="size-4"/> Cerrar</Button></div>
          <dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-neutro-500">Razón social</dt><dd className="font-semibold">{seleccion.nombre_fiscal}</dd></div><div><dt className="text-neutro-500">NIT</dt><dd>{seleccion.nit}</dd></div><div><dt className="text-neutro-500">Subtotal</dt><dd>{dineroGTQ(seleccion.subtotal)}</dd></div><div><dt className="text-neutro-500">IVA</dt><dd>{dineroGTQ(seleccion.iva)}</dd></div><div><dt className="text-neutro-500">Total</dt><dd className="font-semibold text-bronce-700">{dineroGTQ(seleccion.total)}</dd></div><div><dt className="text-neutro-500">Estado</dt><dd><StatusPill value={seleccion.estado}/></dd></div></dl>
          <h3 className="font-semibold">Conceptos vinculados</h3><OperationsState loading={itemsQuery.isPending} error={itemsQuery.error} retry={() => void itemsQuery.refetch()} />
          {!itemsQuery.isPending && !itemsQuery.isError && (itemsQuery.data ?? []).filter(i => i.factura_id === seleccion.id).length === 0 && <p className="text-sm text-neutro-500">Sin conceptos vinculados.</p>}
          {(itemsQuery.data ?? []).filter(i => i.factura_id === seleccion.id).map(i => <div key={i.id} className="flex justify-between gap-3 border-t py-2 text-sm"><span>{i.descripcion || `Concepto #${i.id}`} · Cantidad {i.cantidad ?? 1}</span><strong>{dineroGTQ(i.subtotal ?? i.precio_unitario)}</strong></div>)}
        </Card>
      </div>}
    </>}
  </div>;
};
export { FacturacionPage };
