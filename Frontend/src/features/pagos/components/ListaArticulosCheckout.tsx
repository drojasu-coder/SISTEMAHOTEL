import { MoneyReference } from '@/components/ui/MoneyReference';
import { itemTypeLabel } from '@/features/compra/itemGroups';
import { useLocale } from '@/i18n/LocaleContext';
import { PurchaseItemDetails } from '@/features/compra/PurchaseItemDetails';
import { usePublicTexts } from '@/i18n/public';
import React from 'react';
import type { CarritoItem } from '@/features/carrito/types';
import { descripcionItem, etiquetaTipoItem } from '../textos';

interface ListaArticulosCheckoutProps {
  items: CarritoItem[];
}

const CON_DETALLE = new Set(['habitacion', 'evento', 'actividad', 'bienestar']);

/**
 * Artículos registrados por el servidor en una lista compacta (sin tarjetas por artículo ni identificadores técnicos).
 * No deduce nombres ni suma precios: el total sale únicamente del resumen financiero del backend.
 */
export const ListaArticulosCheckout: React.FC<ListaArticulosCheckoutProps> = ({ items }) => {
  const textosCheckout = usePublicTexts('checkout');
  const { locale } = useLocale();
  return (
    <section aria-labelledby="checkout-articulos" className="flex flex-col gap-2">
      <h3 id="checkout-articulos" className="font-serif text-base font-semibold text-neutro-900">{textosCheckout.articulosLista.titulo}</h3>
      <ul className="divide-y divide-neutro-200 rounded-lg border border-neutro-200 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 p-3">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-bronce-700">
                {locale === 'es' ? etiquetaTipoItem(item.tipo_item) : itemTypeLabel(item.tipo_item, locale)}
              </p>
              {CON_DETALLE.has(item.tipo_item)
                ? <PurchaseItemDetails item={item} compact />
                : <p lang="es" className="break-words font-serif text-base font-semibold text-neutro-900">{descripcionItem(item)}</p>}
            </div>
            <p className="shrink-0 text-sm font-semibold text-neutro-900"><MoneyReference amount={item.precio} /></p>
          </li>
        ))}
      </ul>
    </section>
  );
};
