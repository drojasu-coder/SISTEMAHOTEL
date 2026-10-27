import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Field } from './Field';
import { usePublicInterface } from '@/i18n/public';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: React.ReactNode;
  /** Texto auxiliar junto a la etiqueta, p. ej. "(opcional)". */
  labelSuffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelSuffix, hint, error, className, id: givenId, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;
    return (
      <Field id={id} label={label} labelSuffix={labelSuffix} hint={hint} error={error} required={props.required}>
        <input
          {...props}
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-help` : undefined}
          className={cn('field-control', className)}
        />
      </Field>
    );
  },
);
Input.displayName = 'Input';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ label, labelSuffix, hint, error, className, id: givenId, ...props }, ref) => {
    const { p } = usePublicInterface();
    const autoId = useId();
    const id = givenId ?? autoId;
    const [visible, setVisible] = useState(false);
    return (
      <Field id={id} label={label} labelSuffix={labelSuffix} hint={hint} error={error} required={props.required}>
        <div className="relative">
          <input
            {...props}
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${id}-help` : undefined}
            className={cn('field-control pr-12', className)}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-pressed={visible}
            aria-label={visible ? p('hidePassword') : p('showPassword')}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-neutro-600 hover:text-bronce-700"
          >
            {visible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </Field>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
