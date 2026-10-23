import React from 'react';
import { Card } from '@/components/ui/Card';
import type { ResumenPagoData } from '../types';
import { formatearGTQ, textosCheckout } from '../textos';

interface ResumenCheckoutProps {
  resumen: ResumenPagoData;
  cantidadArticulos: number;
}

/**
 * Resumen calculado por el backend. No se recalcula ningún importe ni se
 * interpreta el saldo como un pago ya aprobado.
 */
export const ResumenCheckout: React.FC<ResumenCheckoutProps> = ({
  resumen,
  cantidadArticulos,
}) => (
  <Card className="flex flex-col gap-4 bg-bronce-50 lg:sticky lg:top-6">
    <div className="flex flex-col gap-1">
      <p className="eyebrow">{textosCheckout.resumen.titulo}</p>
      <p className="text-xs text-neutro-600">
        {textosCheckout.articulos(cantidadArticulos)}
      </p>
    </div>

    <dl className="flex flex-col gap-3 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-neutro-700">{textosCheckout.resumen.total}</dt>
        <dd className="font-semibold text-neutro-900">
          {formatearGTQ(resumen.total)}
        </dd>
      </div>

      {resumen.anticipo_requerido > 0 && (
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-neutro-700">
            {textosCheckout.resumen.anticipo}
          </dt>
          <dd className="font-semibold text-neutro-900">
            {formatearGTQ(resumen.anticipo_requerido)}
          </dd>
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-neutro-700">
          {textosCheckout.resumen.aprobado}
        </dt>
        <dd className="font-semibold text-neutro-900">
          {formatearGTQ(resumen.aprobado)}
        </dd>
      </div>

      <div className="flex items-baseline justify-between gap-3 border-t border-bronce-200 pt-3">
        <dt className="text-sm font-semibold text-neutro-900">
          {textosCheckout.resumen.saldo}
        </dt>
        <dd className="font-serif text-2xl font-semibold leading-tight text-neutro-900">
          {formatearGTQ(resumen.saldo)}
        </dd>
      </div>
    </dl>

    <p className="text-xs text-neutro-600">
      {textosCheckout.resumen.nota}
    </p>
    <p className="border-t border-bronce-200 pt-3 text-xs text-neutro-600">
      {textosCheckout.resumen.notaSaldo}
    </p>
  </Card>
);
