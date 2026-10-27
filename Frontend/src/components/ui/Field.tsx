import { cloneElement, isValidElement, useId, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

export interface FieldProps {
  id?: string;
  label: string;
  hint?: string;
  error?: ReactNode;
  labelSuffix?: string;
  required?: boolean;
  loadingLabel?: string;
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
  labelSuffix,
  required,
  loadingLabel = es.comunes.cargando,
  children,
  className,
}: FieldProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const helpId = `${id}-help`;
  const control = isValidElement<HTMLAttributes<HTMLElement>>(children) && typeof children.type === 'string' && ['input', 'select', 'textarea'].includes(children.type)
    ? cloneElement(children, { id, 'aria-invalid': !!error || undefined, 'aria-describedby': [children.props['aria-describedby'], error || hint || loading ? helpId : undefined].filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(' ') || undefined }) : children;
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)} data-invalid={!!error || undefined}>
      <label htmlFor={id} className="text-xs font-semibold text-neutro-700">
        {label}
        {required && <span aria-hidden="true" className="ml-1 after:content-['*']" />}
        {labelSuffix && <span className="ml-1 font-normal text-neutro-500">{labelSuffix}</span>}
      </label>
      {control}
      {error ? (
        <p id={helpId} role="alert" className="flex items-start gap-2 text-xs text-error-600">
          {error}
        </p>
      ) : (hint || loading) && (
        <p id={helpId} className="flex items-center gap-2 text-xs text-neutro-600">
          {loading ? loadingLabel : hint}
        </p>
      )}
    </div>
  );
}
