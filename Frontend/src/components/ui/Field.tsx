import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

export interface FieldProps {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Etiqueta + control + ayuda o error, con asociación accesible:
 * - `id` generado con `useId()` si no se provee.
 * - `aria-describedby` vinculando el control al mensaje de ayuda/error.
 * - `aria-invalid` y `role="alert"` en el mensaje de error.
 */
export function Field({
  id: givenId,
  label,
  hint,
  error,
  loading,
  children,
  className,
}: FieldProps) {
  const id = givenId ?? useId();
  const helpId = `${id}-help`;
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)} data-invalid={!!error || undefined}>
      <label htmlFor={id} className="text-xs font-semibold text-neutro-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={helpId} role="alert" className="flex items-start gap-2 text-xs text-error-600">
          {error}
        </p>
      ) : (hint || loading) && (
        <p id={helpId} className="flex items-center gap-2 text-xs text-neutro-600">
          {loading ? es.comunes.cargando : hint}
        </p>
      )}
    </div>
  );
}
