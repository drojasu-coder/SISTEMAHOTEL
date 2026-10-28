import { MoneyReference } from '@/components/ui/MoneyReference';
import { groupItems, itemTypeLabel } from '@/features/compra/itemGroups';
import { useLocale } from '@/i18n/LocaleContext';
import { PurchaseItemDetails } from '@/features/compra/PurchaseItemDetails';
import { usePublicTexts } from '@/i18n/public';
import React from 'react';
import type { CarritoItem } from '@/features/carrito/types';
import {
  descripcionItem,
  etiquetaTipoItem,
} from '../textos';

interface ListaArticulosCheckoutProps {
  items: CarritoItem[];
}

/**
 * Presenta los artículos registrados por el servidor.
 *
 * No deduce nombres ni relaciones ausentes y no suma precios: el total se
 * muestra únicamente desde el resumen financiero del backend.
 */
export const ListaArticulosCheckout: React.FC<
  ListaArticulosCheckoutProps
> = ({ items }) => { const textosCheckout = usePublicTexts('checkout'); const { locale } = useLocale(); return (
  <section aria-labelledby="checkout-articulos" className="flex flex-col gap-3">
    <h2
      id="checkout-articulos"
      className="text-lg font-serif font-semibold text-neutro-900"
    >
      {textosCheckout.articulosLista.titulo}
    </h2>
    <p className="text-xs text-neutro-500">
      {textosCheckout.articulos(items.length)}
    </p>
    <ul className="flex flex-col gap-3">
      {groupItems(items).flatMap((group) => group.entries.map((item, index) => (
        <li key={item.id}>
          {index === 0 && <h3 className="mb-3 font-serif text-lg">{itemTypeLabel(group.type, locale)}</h3>}
          <article className="surface flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-neutro-200 bg-neutro-100 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-neutro-700">
                {locale === 'es' ? etiquetaTipoItem(item.tipo_item) : itemTypeLabel(item.tipo_item, locale)}
              </span>
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-neutro-500">
                {textosCheckout.articulosLista.referencia} #{item.id}
              </span>
            </div>

            <h3 lang="es" className="break-words text-base font-serif font-semibold text-neutro-900">
              {descripcionItem(item)}
            </h3>

            <PurchaseItemDetails item={item} />
            <dl className="grid grid-cols-2 gap-3 border-t border-neutro-200 pt-3 text-xs">
              <div className="flex flex-col gap-1">
                <dt className="eyebrow">
                  {textosCheckout.articulosLista.precio}
                </dt>
                <dd className="text-neutro-900">
                  <MoneyReference amount={item.precio} />
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="eyebrow">
                  {textosCheckout.articulosLista.cantidad}
                </dt>
                <dd className="text-neutro-900">{item.cantidad}</dd>
              </div>
            </dl>

            {item.tipo_item !== 'habitacion' && (
              <p className="text-xs text-neutro-600">
                {textosCheckout.articulosLista.referencia} #{item.referencia_id}
              </p>
            )}
          </article>
        </li>
      )))}
    </ul>
  </section>
); };
