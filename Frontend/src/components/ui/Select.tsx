import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'label'> {
  label: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Select envuelto en Field. Propaga el resto de props al `<select>` nativo
 * para funcionar con `{...register('campo')}` de React Hook Form.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, loading, id: givenId, className, children, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;
    const helpId = `${id}-help`;
    return (
      <Field id={id} label={label} hint={hint} error={error} loading={loading}>
        <select
          {...props}
          ref={ref}
          id={id}
          disabled={props.disabled || loading}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint || loading ? helpId : undefined}
          className={cn('field-control', className)}
        >
          {children}
        </select>
      </Field>
    );
  },
);
Select.displayName = 'Select';
