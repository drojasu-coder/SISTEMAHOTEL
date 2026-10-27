import { useQuery } from '@tanstack/react-query';
import { carritoApi } from '@/features/carrito/api/carritoApi';
import { useAuth } from '@/features/auth/AuthContext';
import { PurchaseItemDetails } from './PurchaseItemDetails';
import { usePublicInterface } from '@/i18n/public';
import { MoneyReference } from '@/components/ui/MoneyReference';
import type { Pago } from '@/features/pagos/types';

/** Asociación histórica por el carrito DEL PAGO, nunca por el carrito actual del cliente. */
export function PurchaseReservations({ payment }: { payment: Pago }) {
  const { user, status } = useAuth(); const { p } = usePublicInterface();
  const cartId = payment.carrito_id;
  const items = useQuery({ queryKey: ['purchase-history-items', user?.id, payment.id, cartId], queryFn: () => carritoApi.getItems(cartId!), enabled: status === 'authenticated' && user?.rol === 'cliente' && Number.isSafeInteger(cartId) && Number(cartId) > 0, retry: false, staleTime: 0 });
  const valid = Array.isArray(items.data?.items) && items.data.items.every((item) => item.carrito_id === cartId);
  return <section className="surface flex flex-col gap-4 p-5"><h2 className="font-serif text-xl">{p('purchaseRefs')}</h2><p className="text-sm text-neutro-600">{p('purchaseRefsNote')}</p>
    {cartId !== null && items.isPending && <p>{p('purchaseDetailsLoading')}</p>}
    {cartId !== null && (items.isError || (items.isSuccess && !valid)) && <p role="alert" className="text-sm">{p('purchaseRefError')}</p>}
    {cartId !== null && valid && <ul className="flex flex-col gap-5">{items.data!.items.map((item) => <li className="border-t border-neutro-200 pt-4" key={item.id}>
      <h3 className="font-semibold" lang="es">{item.descripcion || `${p('purchaseItem', { id: item.id })} · #${item.referencia_id}`}</h3>
      <p className="text-xs text-neutro-600">{p('purchaseView')} #{item.referencia_id}</p>
      <PurchaseItemDetails item={item} />
      <div className="mt-2 text-sm"><MoneyReference amount={item.precio} /> · {item.cantidad}</div>
    </li>)}</ul>}
    {cartId === null && payment.reserva_habitacion_id !== null && <PurchaseItemDetails item={{ tipo_item: 'habitacion', referencia_id: payment.reserva_habitacion_id }} />}
    <p className="text-xs text-neutro-600">{p('purchaseHistorical')}</p>
  </section>;
}
