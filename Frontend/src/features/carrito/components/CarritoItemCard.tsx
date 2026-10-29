import { MoneyReference } from '@/components/ui/MoneyReference';
import { itemTypeLabel } from '@/features/compra/itemGroups';
import { PurchaseItemDetails } from '@/features/compra/PurchaseItemDetails';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CarritoItem } from '../types';
import { etiquetaTipoItem, formatearCantidad } from '../textos';

interface CarritoItemCardProps {
  item: CarritoItem;
  onRetirar: (item: CarritoItem) => void;
  retiroBloqueado: boolean;
}

// Tipos cuyo detalle se consulta en el servidor; el resto se identifica por la descripción que registró el carrito.
const CON_DETALLE = new Set(['habitacion', 'evento', 'actividad', 'bienestar']);

/**
 * Fila compacta de un artículo: qué es, dónde y cuándo, y cuánto cuesta. Los datos secundarios van en "Más detalles";
 * el identificador técnico del artículo no se muestra. Retirar del carrito no cancela la reserva.
 */
export const CarritoItemCard: React.FC<CarritoItemCardProps> = ({ item, onRetirar, retiroBloqueado }) => {
  const textosCarrito = usePublicTexts('carrito');
  const { locale } = usePublicInterface();
  const tipo = locale === 'es' ? etiquetaTipoItem(item.tipo_item) : itemTypeLabel(item.tipo_item, locale);
  const descripcion = item.descripcion?.trim() || textosCarrito.sinDescripcion(item.id);
  const cantidad = formatearCantidad(item.cantidad);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        {CON_DETALLE.has(item.tipo_item)
          ? <PurchaseItemDetails item={item} allowNewSearch={!retiroBloqueado} compact />
          : <div className="flex flex-col gap-1">
              <p className="mb-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-bronce-700">{tipo}</p>
              <p lang="es" className="break-words font-serif text-base font-semibold text-neutro-900">{descripcion}</p>
            </div>}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1.5">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-neutro-900">
            <MoneyReference amount={item.precio} />
          </p>
          {String(cantidad) !== '1' && <span className="text-xs font-normal text-neutro-500">× {cantidad}</span>}
        </div>
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={() => onRetirar(item)}
          disabled={retiroBloqueado}
          className="text-neutro-500 hover:text-rojo-700 px-2 py-1.5"
          aria-label={textosCarrito.retirarArticulo(item.id)}
        >
          <Trash2 className="size-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
