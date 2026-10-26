import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from './Input';

export interface DateFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'label'> {
  label: string;
  hint?: string;
}

/**
 * Campo de fecha. Acepta `label` y `hint` y los pasa a `Input`; propaga el
 * resto de props al input nativo para funcionar con `{...register('campo')}`
 * de React Hook Form.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, hint, ...props }, ref) => (
    <Input {...props} ref={ref} type="date" label={label} hint={hint} />
  ),
);
DateField.displayName = 'DateField';
