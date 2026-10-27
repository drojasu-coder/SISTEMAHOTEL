import React from 'react';
import { cn } from '@/lib/cn';

export interface SkeletonProps {
  className?: string;
  height?: string;
}

/**
 * Esqueleto de estado de carga.
 * - `aria-hidden` porque es solo una pista visual.
 * - Respeta `prefers-reduced-motion` desactivando la animación.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className, height = 'h-4' }) => {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReducedMotion(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <span
      aria-hidden="true"
      className={cn('block rounded-md bg-neutro-200', reducedMotion ? 'animate-none' : 'animate-pulse', height, className)}
    />
  );
};
