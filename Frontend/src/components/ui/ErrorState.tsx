import React from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { es } from '@/i18n/es';

export interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
  loading?: boolean;
}

/**
 * Estado de error en línea. Se anuncia como `role="alert"` y ofrece un
 * botón de reintento accesible.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message = es.errores.inesperado,
  onRetry,
  loading = false,
}) => (
  <div
    role="alert"
    className={cn(
      'flex flex-col items-center gap-3 rounded-lg border border-error-600/20 bg-error-50 p-6 text-center',
      loading ? 'opacity-70' : ''
    )}
    aria-live="polite"
  >
    <svg className="size-6 shrink-0 text-error-600" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
      <path d="M18.364 5.364a9 9 0 11-12.728 12.728M9.364 9.364l12.728 12.728" />
    </svg>
    <p className="font-semibold text-error-700">{message}</p>
    <p className="text-xs text-neutro-600">{es.errores.ayuda}</p>
    <Button variant="ghost" onClick={onRetry} isLoading={loading}>
      {loading ? es.comunes.cargando : es.comunes.reintentar}
    </Button>
  </div>
);
