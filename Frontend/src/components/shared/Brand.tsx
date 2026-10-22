import React from 'react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';
import { brandMedia } from '@/app/config/media';

interface BrandProps {
  /** Para fondos oscuros. */
  inverse?: boolean;
  className?: string;
}

/**
 * Marca del hotel. Usa el logo de S3 cuando esté configurado en `brandMedia`;
 * mientras tanto presenta el nombre en texto, sin imágenes locales.
 */
export const Brand: React.FC<BrandProps> = ({ inverse = false, className }) => {
  const src = inverse ? brandMedia.logoHorizontalBlanco : brandMedia.logoHorizontalColor;

  if (src) {
    return <img src={src} alt={es.marca.nombre} className={cn('h-8 w-auto object-contain md:h-10', className)} />;
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
