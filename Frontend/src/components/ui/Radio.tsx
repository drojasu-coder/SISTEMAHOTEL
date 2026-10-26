import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label'> {
  label: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  id?: string;
  className?: string;
  name?: string;
}

/**
 * Radio con tamaño táctil mínimo de 44 px. Propaga props al input nativo para
 * funcionar con `{...register('campo')}` de React Hook Form.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, hint, error, loading, id: givenId, className, name, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;
    return (
      <Field id={id} label={label} hint={hint} error={error} loading={loading}>
        <div className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            {...props}
            ref={ref}
            id={id}
            type="radio"
            name={name}
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
Radio.displayName = 'Radio';
