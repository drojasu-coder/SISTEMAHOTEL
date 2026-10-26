import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'label'> {
  label: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  id?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Textarea envuelto en Field. Propaga el resto de props al `<textarea>` nativo
 * para funcionar con `{...register('campo')}` de React Hook Form.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, loading, id: givenId, className, children, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;
    return (
      <Field id={id} label={label} hint={hint} error={error} loading={loading}>
        <textarea
          {...props}
          ref={ref}
          id={id}
          rows={3}
          disabled={props.disabled || loading}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint || loading ? `${id}-help` : undefined}
          className={cn('field-control resize-y', className)}
        >
          {children}
        </textarea>
      </Field>
    );
  },
);
Textarea.displayName = 'Textarea';
