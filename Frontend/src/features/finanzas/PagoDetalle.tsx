import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/api/client/http';
import { DescargarComprobanteButton } from '@/features/pagos/components/DescargarComprobante';
import type { Pago } from '@/features/pagos/types';
import { useLocale } from '@/i18n/LocaleContext';
import { Amount, EstadoPagoBadge, hotelDateTime, maskReference } from './common';
import { useTextosFinanzas } from './textos';

interface CartItem { id?: number; tipo_item: string; referencia_id: number | null; descripcion?: string | null; precio: string | number; cantidad: number }
const RUTA_RESERVA: Record<string, string> = {
  habitacion: '/admin/reservas', mesa: '/admin/reservas-restaurante', actividad: '/admin/reservas-actividades',
  amenidad: '/admin/reservas-amenidades', bienestar: '/admin/citas-spa', evento: '/admin/reservas-evento',
};

export function PagoDetalle({ pago, cliente, onClose }: { pago: Pago; cliente: string | null; onClose: () => void }) {
  const t = useTextosFinanzas();
  const { locale } = useLocale();
  const items = useQuery({
    queryKey: ['admin-pago-items', pago.carrito_id], enabled: !!pago.carrito_id,
    queryFn: async () => {
      const r = await api.get<{ data?: { items?: CartItem[] } | CartItem[] }>(`/carritos/${pago.carrito_id}/items`);
      const d = r.data;
      return (Array.isArray(d) ? d : d?.items ?? []) as CartItem[];
    },
  });
  const dt = (label: string, value: React.ReactNode) => <div><dt className="text-xs text-neutro-500">{label}</dt><dd className="mt-0.5 text-sm font-medium text-neutro-900 break-words">{value}</dd></div>;
  return (
    <Modal open onClose={onClose} title={t.detallePago(pago.id)} closeLabel={t.cerrar} className="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutro-200 bg-neutro-50 px-4 py-3">
          <EstadoPagoBadge estado={pago.estado} />
          <Amount amount={pago.monto} currency={pago.moneda} className="text-xl font-semibold text-neutro-900" />
        </div>
        {pago.estado !== 'aprobado' && pago.estado !== 'reembolsado' && pago.estado !== 'reembolsado_parcial' && (
          <p role="status" className="rounded-lg border border-advertencia-600/20 bg-advertencia-50 px-3 py-2 text-xs text-advertencia-700">{t.alertaProcesamiento}</p>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {dt(t.cliente, cliente ?? t.clienteNoIdentificado)}
          {dt(t.metodo, t.metodos[pago.metodo] ?? pago.metodo)}
          {dt(t.tipoPago, pago.tipo_pago ? t.tipos[pago.tipo_pago] ?? pago.tipo_pago : '—')}
          {dt(t.moneda, pago.moneda)}
          {dt(t.creado, hotelDateTime(pago.createdAt, locale))}
          {dt(t.fechaPago, pago.fecha_pago ? hotelDateTime(pago.fecha_pago, locale) : t.sinFechaPago)}
          {dt(t.pasarela, pago.pasarela ?? '—')}
          {dt(t.referencia, <span className="font-mono text-xs">{maskReference(pago.id_transaccion_externo)}</span>)}
          {dt(t.carritoN(pago.carrito_id ?? 0).split(' ')[0], pago.carrito_id ? `#${pago.carrito_id}` : '—')}
        </dl>
        <section aria-label={t.articulos}>
          <h3 className="mb-2 text-sm font-semibold text-neutro-900">{t.articulos}</h3>
          {items.isLoading ? <p role="status" className="text-sm text-neutro-500">{t.articulosCargando}</p>
            : items.isError ? <p role="alert" className="text-sm text-error-700">{t.articulosError}</p>
            : !items.data?.length ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 p-3 text-sm text-neutro-500">{t.sinArticulos}</p>
            : <ul className="divide-y divide-neutro-100 rounded-xl border border-neutro-200">
              {items.data.map((it, i) => {
                const ruta = RUTA_RESERVA[it.tipo_item];
                return <li key={it.id ?? i} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                  <div className="min-w-0"><p className="font-medium text-neutro-900">{t.tiposItem[it.tipo_item] ?? it.tipo_item}{it.referencia_id ? ` #${it.referencia_id}` : ''}</p>
                    {it.descripcion && <p className="truncate text-xs text-neutro-500">{it.descripcion}</p>}</div>
                  <div className="flex items-center gap-3"><span className="text-xs text-neutro-500">{t.cantidadPrecio(it.cantidad, '')}<Amount amount={it.precio} currency={pago.moneda} /></span>
                    {ruta && it.referencia_id && <Link to={`${ruta}/${it.referencia_id}`} className="text-xs font-semibold text-bronce-700 underline">{t.verRegistro}</Link>}</div>
                </li>;
              })}
            </ul>}
        </section>
        <section aria-label={t.comprobante} className="flex flex-wrap items-center justify-between gap-3 border-t border-neutro-200 pt-4">
          <p className="max-w-sm text-xs text-neutro-500">{pago.estado === 'aprobado' ? t.comprobanteNota : t.comprobanteNoDisponible}</p>
          {pago.estado === 'aprobado' && <DescargarComprobanteButton pagoId={pago.id} label={t.descargar} />}
        </section>
      </div>
    </Modal>
  );
}
