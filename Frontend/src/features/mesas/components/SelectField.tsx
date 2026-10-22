import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  /** Texto auxiliar junto a la etiqueta, p. ej. "(opcional)". */
  labelSuffix?: string;
}

/**
 * Campo de selección con etiqueta y ayuda/error asociados de forma accesible.
 * El proyecto no tiene un `Select` compartido; este control vive dentro del
 * módulo de mesas para no alterar componentes compartidos.
 *
 * Reenvía el `ref` al `<select>` porque React Hook Form lo necesita para
 * registrar el campo (igual que hace el `Input` compartido).
 */
export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, hint, error, labelSuffix, className, id: givenId, children, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;

    return (
      <div className="flex min-w-0 flex-col gap-2" data-invalid={error ? true : undefined}>
        <label htmlFor={id} className="text-xs font-semibold text-neutro-700">
          {label}
          {labelSuffix && <span className="ml-1 font-normal text-neutro-500">{labelSuffix}</span>}
        </label>
        <select
          {...props}
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-help` : undefined}
          className={cn('field-control appearance-none pr-8', className)}
        >
          {children}
        </select>
        {error ? (
          <p
            id={`${id}-help`}
            role="alert"
            className="flex items-start gap-2 text-xs text-error-600"
          >
            <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : (
          hint && (
            <p id={`${id}-help`} className="text-xs text-neutro-600">
              {hint}
            </p>
          )
        )}
      </div>
    );
  },
);

SelectField.displayName = 'SelectField';
