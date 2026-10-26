import { cn } from '@/lib/cn';
import { formatQ } from '@/utils/formatQ';
import { es } from '@/i18n/es';

export interface PriceSummaryProps {
  /** Subtotal calculado por el backend. */
  subtotal: number;
  /** Descuento calculado por el backend. */
  descuento?: number;
  /** Impuestos calculados por el backend. */
  impuestos: number;
  /** Total calculado por el backend. */
  total: number;
  className?: string;
}

/**
 * Desglose de precios SOLO PRESENTACIONAL.
 * - Recibe subtotal, descuento, impuestos y total ya calculados por el backend.
 * - Nunca calcula ni recalcula importes en el frontend.
 * - Si falta un valor, no se muestra esa fila (no se inventa ni se deriva).
 */
export function PriceSummary({
  subtotal,
  descuento = 0,
  impuestos,
  total,
  className,
}: PriceSummaryProps) {
  const rows: Array<[string, number]> = [
    [es.componentes.subtotal, subtotal],
  ];
  if (descuento && descuento > 0) {
    rows.push([es.componentes.descuento, -descuento]);
  }
  rows.push([es.componentes.impuestos, impuestos]);

  return (
    <dl className={cn('flex flex-col gap-3 text-sm text-neutro-600', className)}>
      {rows.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-4">
          <dt>{key}</dt>
          <dd className="tabular-nums">{formatQ(value)}</dd>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between gap-4 border-t pt-4 font-semibold">
        <dt>{es.componentes.total}</dt>
        <dd className="text-[1.5rem] font-medium tabular-nums">{formatQ(total)}</dd>
      </div>
    </dl>
  );
}
