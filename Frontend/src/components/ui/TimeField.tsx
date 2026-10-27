import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from './Input';

export interface TimeFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'label'> {
  label: string;
  hint?: string;
}

/**
 * Campo de hora. Acepta `label` y `hint` y los pasa a `Input`; propaga el
 * resto de props al input nativo para funcionar con `{...register('campo')}`
 * de React Hook Form.
 */
export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(
  ({ label, hint, ...props }, ref) => (
    <Input {...props} ref={ref} type="time" label={label} hint={hint} />
  ),
);
TimeField.displayName = 'TimeField';
