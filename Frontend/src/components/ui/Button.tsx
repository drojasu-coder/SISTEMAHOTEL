import React from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'border-transparent bg-bronce-600 text-white hover:bg-bronce-700 active:bg-bronce-800',
  // Acción normal o filtro no seleccionado: contorno bronce de la identidad (el verde queda para estados semánticos).
  secondary: 'border-bronce-600 bg-white text-bronce-800 hover:bg-bronce-50 active:bg-bronce-100',
  ghost:
    'border-neutro-300 bg-transparent text-neutro-700 hover:bg-neutro-100 active:bg-neutro-200',
  text: 'border-transparent bg-transparent text-bronce-700 hover:underline active:text-bronce-900',
  danger: 'border-transparent bg-error-600 text-white hover:bg-error-700 active:bg-error-700',
} as const;

const sizes = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'min-h-13 px-6 py-4',
} as const;

export const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('size-4 animate-spin', className)}
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

/** Clases de un botón; permite dar apariencia de botón a un enlace sin anidar controles. */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: Pick<ButtonProps, 'variant' | 'size' | 'className'> = {}): string {
  return cn(
    'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
    variants[variant],
    sizes[size],
    className,
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  type = 'button',
  ...props
}, ref) => (
  <button
    ref={ref}
    {...props}
    type={type}
    disabled={disabled || isLoading}
    aria-busy={isLoading || undefined}
    className={buttonStyles({ variant, size, className })}
  >
    {isLoading && <Spinner />}
    {children}
  </button>
));
Button.displayName = 'Button';
