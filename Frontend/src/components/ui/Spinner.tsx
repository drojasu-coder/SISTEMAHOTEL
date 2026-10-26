import React from 'react';
import { cn } from '@/lib/cn';

export interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

/**
 * Indicador de carga accesible.
 * - Sin `label`: SVG decorativo (`aria-hidden`), sin rol.
 * - Con `label`: se anuncia como `role="status"`; el SVG queda oculto a
 *   tecnologías de asistencia y el texto accesible va en un `sr-only`.
 * - Respeta `prefers-reduced-motion` desactivando la animación.
 */
export const Spinner: React.FC<SpinnerProps> = ({ className, size = 'md', label }) => {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReducedMotion(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const sizeClass = { sm: 'size-3', md: 'size-4', lg: 'size-6' }[size];

  const svg = (
    <svg
      className={cn('animate-spin shrink-0', sizeClass, reducedMotion ? 'animate-none' : '', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );

  if (!label) return svg;

  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-2">
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  );
};
