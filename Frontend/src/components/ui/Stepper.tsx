import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

export interface StepperProps {
  steps: readonly string[];
  current: number;
  onChange?: (step: number) => void;
  error?: boolean;
  className?: string;
}

/**
 * Pasos numerados con estados: completado, actual y error.
 * - `aria-current="step"` en el paso actual.
 * - Navegable por teclado.
 * - Legible en móvil (apilado verticalmente en pantallas pequeñas).
 */
export function Stepper({
  steps,
  current,
  onChange,
  error,
  className,
}: StepperProps) {
  return (
    <ol
      aria-label={es.componentes.cronologia}
      className={cn('flex flex-wrap gap-4', className)}
    >
      {steps.map((label, i) => {
        const isCompleted = i < current;
        const isCurrent = i === current;
        const isError = isCurrent && Boolean(error);
        const disabled = !onChange || i > current;
        const icon = isCompleted ? (
          <svg
            aria-hidden="true"
            className="size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : isError ? (
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 text-error-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path d="M6 6l12 12M18 6L6 12" />
          </svg>
        ) : (
          <span className="size-4 shrink-0 flex items-center justify-center text-xs font-semibold">
            {i + 1}
          </span>
        );
        return (
          <li key={label} className="flex flex-1 items-center gap-3">
            <button
              aria-current={isCurrent ? 'step' : undefined}
              disabled={disabled}
              onClick={!disabled && onChange ? () => onChange(i) : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 text-xs',
                isCompleted
                  ? 'border-selva-600 bg-selva-600 text-white'
                  : isError
                    ? 'border-error-600 bg-error-50 text-error-600'
                    : isCurrent
                      ? 'border-bronce-600 bg-bronce-50 text-bronce-700 font-semibold'
                      : 'border-neutro-300 text-neutro-500',
              )}
            >
              {icon}
              <span className={cn(isCurrent ? 'font-semibold' : 'text-neutro-600')}>
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className="hidden h-px min-w-4 flex-1 bg-neutro-200 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
