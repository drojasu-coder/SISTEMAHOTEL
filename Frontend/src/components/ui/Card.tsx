import React from 'react';
import { cn } from '@/lib/cn';

export type CardProps = React.HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'article'; padding?: 'default' | 'none' };

/**
 * Superficie base de la guía (`surface`): borde suave, fondo blanco y sombra ligera.
 * Contrato conservado: sigue siendo un `<div>` con las mismas clases base.
 * CardHeader / CardContent / CardFooter son subcomponentes opcionales.
 */
export const Card: React.FC<CardProps> = ({ children, className, as: Element = 'div', padding = 'default', ...props }) => (
  <Element className={cn('surface', padding === 'default' && 'p-4 sm:p-6', className)} {...props}>
    {children}
  </Element>
);

export interface CardHeaderProps {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  className?: string;
}

/** Cabecera de tarjeta: título, descripción opcional y elemento aside (p. ej. Badge). */
export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  aside,
  className,
}) => (
  <header
    className={cn(
      'flex items-start justify-between gap-4 border-b border-neutro-200 p-6',
      className,
    )}
  >
    <div className="flex flex-col gap-1">
      <h3 className="text-lg font-serif font-semibold text-neutro-900">{title}</h3>
      {description && <p className="text-xs text-neutro-600">{description}</p>}
    </div>
    {aside}
  </header>
);

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

/** Cuerpo de tarjeta con relleno interno. */
export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn('p-6', className)}>{children}</div>
);

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/** Pie de tarjeta con borde superior y fondo sutil. */
export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <footer
    className={cn(
      'flex flex-wrap items-center justify-between gap-3 border-t border-neutro-200 bg-neutro-50/50 px-6 py-4',
      className,
    )}
  >
    {children}
  </footer>
);
