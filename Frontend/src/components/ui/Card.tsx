import React from 'react';
import { cn } from '@/lib/cn';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/** Superficie base de la guía (`surface`): borde suave, fondo blanco y sombra ligera. */
export const Card: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={cn('surface p-4 sm:p-6', className)} {...props}>
    {children}
  </div>
);
