import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { buttonStyles } from '@/components/ui/Button';
import { PAGOS_ROUTES } from '@/features/pagos';


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
}) => { const textosCarrito = usePublicTexts('carrito'); const { p } = usePublicInterface(); return (
  <Card className="flex flex-col gap-2 bg-bronce-50 lg:sticky lg:top-6">
    <p className="eyebrow">{textosCarrito.campos.total}</p>
    <p className="font-serif text-[2rem] font-semibold leading-tight text-neutro-900">
      <MoneyReference amount={total} />
    </p>
    <p className="text-xs text-neutro-600">{textosCarrito.articulos(cantidadArticulos)}</p>

    {cantidadArticulos > 0 && (
      <Link
        to={PAGOS_ROUTES.CHECKOUT}
        className={buttonStyles({ className: 'mt-2 w-full justify-center' })}
      >
        <CreditCard className="size-4" aria-hidden="true" />
        {p('purchaseContinue')}
      </Link>
    )}
  </Card>
); };
