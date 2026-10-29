import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Card } from '@/components/ui/Card';
import type { ResumenPagoData } from '../types';
import { useLocale } from '@/i18n/LocaleContext';
import { MONEY_PRESENTATION } from '@/lib/money';

interface ResumenCheckoutProps {
  resumen: ResumenPagoData;
  cantidadArticulos: number;
  /** Detalle completo de la compra (artículos, cuenta); se muestra solo al expandir. */
  children?: React.ReactNode;
}

/**
 * Resumen compacto calculado por el backend: importe a pagar siempre visible y el detalle a demanda.
 * No se recalcula ningún importe ni se interpreta el saldo como un pago ya aprobado.
 */
export const ResumenCheckout: React.FC<ResumenCheckoutProps> = ({ resumen, cantidadArticulos, children }) => {
  const { t } = useLocale();
  const { p } = usePublicInterface();
  const textosCheckout = usePublicTexts('checkout');
  const fila = (etiqueta: string, valor: number | string) => (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-neutro-700">{etiqueta}</dt>
      <dd className="font-semibold text-neutro-900"><MoneyReference amount={valor} /></dd>
    </div>
  );
  return (
    <Card className="flex flex-col gap-4 bg-bronce-50">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-neutro-900">{textosCheckout.resumen.titulo}</h2>
        <p className="text-xs text-neutro-600">{textosCheckout.articulos(cantidadArticulos)}</p>
      </div>
      <dl className="flex flex-col gap-2">
        {(resumen.aprobado > 0 || resumen.anticipo_requerido > 0) && fila(textosCheckout.resumen.total, resumen.total)}
        {resumen.anticipo_requerido > 0 && fila(textosCheckout.resumen.anticipo, resumen.anticipo_requerido)}
        {resumen.aprobado > 0 && fila(textosCheckout.resumen.aprobado, resumen.aprobado)}
        <div className="flex items-baseline justify-between gap-3 border-t border-bronce-200 pt-3">
          <dt className="text-sm font-semibold text-neutro-900">{resumen.aprobado > 0 || resumen.anticipo_requerido > 0 ? textosCheckout.resumen.saldo : p('purchaseToPay')}</dt>
          <dd className="font-serif text-2xl font-semibold leading-tight text-neutro-900"><MoneyReference amount={resumen.saldo} /></dd>
        </div>
      </dl>
      <p className="rounded-lg border border-bronce-200 bg-white p-3 text-xs text-neutro-700">{t('currencyCharge').replace('{rate}', MONEY_PRESENTATION.gtqPerUsd.toFixed(2))}</p>
      {children && (
        <details className="group border-t border-bronce-200 pt-3">
          <summary className="inline-flex min-h-10 cursor-pointer items-center text-sm font-semibold text-bronce-700 hover:underline">{p('purchaseDetailsToggle')}</summary>
          <div className="mt-3 flex flex-col gap-5">
            {children}
            <div className="flex flex-col gap-1.5 text-xs text-neutro-600">
              <p>{t('finalPricesPolicy')}</p>
              <p>{textosCheckout.resumen.nota}</p>
              <p>{textosCheckout.resumen.notaSaldo}</p>
            </div>
          </div>
        </details>
      )}
    </Card>
  );
};
