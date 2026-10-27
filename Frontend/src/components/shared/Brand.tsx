import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';
import { useBranding } from '@/features/media/hooks/useBranding';

export interface BrandProps {
  /** Para fondos oscuros (ej. Footer). Usa logoHorizontalBlanco. */
  inverse?: boolean;
  /** Variante de presentación: 'full' (horizontal) o 'compact' (isotipo). Por defecto 'full'. */
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * Marca institucional de HOTEL HUNAHPÚ.
 * Carga el logo vectorial dinámicamente desde AWS S3 mediante URLs prefirmadas
 * gestionadas con TanStack Query.
 *
 * Características:
 * - Soporta variantes 'full' (horizontal color o blanco) y 'compact' (isotipo color).
 * - Si la imagen falla (error de red o decodificación), muestra fallback textual institucional.
 * - Si llega una nueva URL (por renovación o recuperación), se reintenta automáticamente
 *   sin quedarse atrapado en el estado de error anterior.
 */
export const Brand: React.FC<BrandProps> = ({
  inverse = false,
  variant = 'full',
  className,
}) => {
  const { data: branding, isError } = useBranding();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  let src: string | undefined;
  if (variant === 'compact') {
    src = branding?.isotipoColor;
  } else {
    src = inverse
      ? branding?.logoHorizontalBlanco
      : branding?.logoHorizontalColor;
  }

  const hasImageError = Boolean(src && failedSrc === src);

  if (src && !isError && !hasImageError) {
    return (
      <img
        src={src}
        alt={es.marca.nombre}
        className={cn('h-8 w-auto object-contain md:h-10', className)}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span className={cn('inline-flex flex-col leading-none', className)}>
      <span
        className={cn(
          'font-serif text-2xl font-semibold tracking-tight',
          inverse ? 'text-white' : 'text-neutro-900',
        )}
      >
        {es.marca.nombre}
      </span>
      <span
        className={cn(
          'mt-1 text-[0.6875rem] font-semibold uppercase tracking-widest',
          inverse ? 'text-bronce-300' : 'text-bronce-700',
        )}
      >
        {es.marca.pais}
      </span>
    </span>
  );
};
