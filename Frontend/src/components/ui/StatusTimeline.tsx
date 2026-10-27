import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';
import { Check, Clock } from 'lucide-react';

export interface TimelineItem {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
}

export interface StatusTimelineProps {
  items: TimelineItem[];
  className?: string;
}

/**
 * Línea de tiempo de estados.
 * - Lista ordenada con iconos de lucide (check/reloj) y conectores verticales.
 * - No depende solo del color para indicar el estado (usa icono + texto).
 * - `aria-label` con el título de la cronología.
 */
export function StatusTimeline({ items, className }: StatusTimelineProps) {
  return (
    <ol
      aria-label={es.componentes.cronologia}
      className={cn('flex flex-col gap-4', className)}
    >
      {items.map((item, i) => (
        <li key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full shrink-0',
                item.done
                  ? 'bg-selva-100 text-selva-700 border border-selva-200'
                  : 'border bg-white text-neutro-500 border-neutro-200',
              )}
            >
              {item.done ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Clock className="size-4" aria-hidden="true" />
              )}
            </span>
            {i < items.length - 1 && (
              <span
                aria-hidden="true"
                className="min-h-8 w-px flex-1 bg-neutro-200"
              />
            )}
          </div>
          <div className="pb-6">
            <p className={cn('font-medium', item.done ? 'text-neutro-900' : 'text-neutro-600')}>
              {item.label}
            </p>
            {item.detail && (
              <p className="mt-1 text-xs text-neutro-600">{item.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
