import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label'> {
  label: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  id?: string;
  className?: string;
}

/**
 * Switch con `role="switch"` y `aria-checked`. Propaga props al input nativo
 * para funcionar con `{...register('campo')}` de React Hook Form.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, hint, error, loading, id: givenId, className, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;
    const checked = props.checked ?? false;
    return (
      <Field id={id} label={label} hint={hint} error={error} loading={loading}>
        <div className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <span className="relative inline-flex shrink-0">
            <input
              {...props}
              ref={ref}
              id={id}
              type="checkbox"
              role="switch"
              aria-checked={checked}
              disabled={props.disabled || loading}
              aria-invalid={!!error || undefined}
              aria-describedby={error || hint || loading ? `${id}-help` : undefined}
              className="peer sr-only"
            />
            <span
              className={cn(
                'h-6 w-11 rounded-full border border-neutro-400 bg-neutro-200 transition-colors',
                checked ? 'peer-checked:border-bronce-600 peer-checked:bg-bronce-600' : '',
                props.disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
              )}
            />
            <span
              className={cn(
                'pointer-events-none absolute left-1 top-1 size-4 rounded-full bg-white transition-transform',
                checked ? 'peer-checked:translate-x-5' : '',
              )}
            />
          </span>
          {label}
        </div>
      </Field>
    );
  },
);
Switch.displayName = 'Switch';
