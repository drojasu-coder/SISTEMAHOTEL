import React from 'react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  headingLevel?: 2 | 3;
}

/**
 * Estado vacío. Muestra título, descripción y una acción opcional.
 * Se anuncia como `role="status"` para tecnologías de asistencia.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = es.componentes.vacio,
  description = es.componentes.vacioDescripcion,
  action,
  headingLevel = 3,
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
  <div
    className={cn('flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center')}
    role="status"
    aria-label={title}
  >
    <div className="flex size-20 items-center justify-center rounded-lg bg-neutro-100 text-neutro-400">
      <svg
        aria-hidden="true"
        className="size-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        viewBox="0 0 24 24"
      >
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <Heading className="font-serif text-xl font-semibold text-neutro-900">{title}</Heading>
    <p className="max-w-sm text-xs text-neutro-600">{description}</p>
    {action}
  </div>
); };
