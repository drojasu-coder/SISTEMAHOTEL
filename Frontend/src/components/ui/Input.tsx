import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  /** Texto auxiliar junto a la etiqueta, p. ej. "(opcional)". */
  labelSuffix?: string;
}

interface FieldShellProps {
  id: string;
  label: string;
  labelSuffix?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

/** Etiqueta + control + ayuda/error, con asociación accesible (guía: Field). */
const FieldShell: React.FC<FieldShellProps> = ({ id, label, labelSuffix, hint, error, children }) => (
  <div className="flex min-w-0 flex-col gap-2" data-invalid={error ? true : undefined}>
    <label htmlFor={id} className="text-xs font-semibold text-neutro-700">
      {label}
      {labelSuffix && <span className="ml-1 font-normal text-neutro-500">{labelSuffix}</span>}
    </label>
    {children}
    {error ? (
      <p id={`${id}-help`} role="alert" className="flex items-start gap-2 text-xs text-error-600">
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

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelSuffix, hint, error, className, id: givenId, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;
    return (
      <FieldShell id={id} label={label} labelSuffix={labelSuffix} hint={hint} error={error}>
        <input
          {...props}
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-help` : undefined}
          className={cn('field-control', className)}
        />
      </FieldShell>
    );
  },
);
Input.displayName = 'Input';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ label, labelSuffix, hint, error, className, id: givenId, ...props }, ref) => {
    const autoId = useId();
    const id = givenId ?? autoId;
    const [visible, setVisible] = useState(false);
    return (
      <FieldShell id={id} label={label} labelSuffix={labelSuffix} hint={hint} error={error}>
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
            aria-label={visible ? es.comunes.ocultarContrasena : es.comunes.verContrasena}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-neutro-600 hover:text-bronce-700"
          >
            {visible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </FieldShell>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
