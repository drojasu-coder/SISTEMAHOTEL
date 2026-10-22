import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatearGTQ, textosCarrito } from '../textos';

interface ResumenCarritoProps {
  total: number | string | null | undefined;
  cantidadArticulos: number;
}

/**
 * Total calculado por el servidor. No se recalcula ni se interpreta como un
 * pago realizado.
 */
export const ResumenCarrito: React.FC<ResumenCarritoProps> = ({
  total,
  cantidadArticulos,
}) => (
  <Card className="flex flex-col gap-2 bg-bronce-50 lg:sticky lg:top-6">
    <p className="eyebrow">{textosCarrito.campos.total}</p>
    <p className="font-serif text-[2rem] font-semibold leading-tight text-neutro-900">
      {formatearGTQ(total)}
    </p>
    <p className="text-xs text-neutro-600">{textosCarrito.notaTotal}</p>
    <p className="text-xs text-neutro-500">{textosCarrito.notaCarrito}</p>
    <p className="border-t border-bronce-200 pt-2 text-xs text-neutro-600">
      {textosCarrito.articulos(cantidadArticulos)}
    </p>
  </Card>
);
