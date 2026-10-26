import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label'> {
  label: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  id?: string;
  className?: string;
}

/**
 * Checkbox con tamaño táctil mínimo de 44 px (`size-5` = 1.25rem ≈ 20px del
 * control más el área táctil del contenedor Field). Propaga props al input
 * nativo para funcionar con `{...register('campo')}` de React Hook Form.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, error, loading, id: givenId, className, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;
    return (
      <Field id={id} label={label} hint={hint} error={error} loading={loading}>
        <div className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            {...props}
            ref={ref}
            id={id}
            type="checkbox"
            disabled={props.disabled || loading}
            aria-invalid={!!error || undefined}
            aria-describedby={error || hint || loading ? `${id}-help` : undefined}
            className={cn('size-5 shrink-0', error && 'outline outline-error-600', className)}
          />
          {label}
        </div>
      </Field>
    );
  },
);
Checkbox.displayName = 'Checkbox';
