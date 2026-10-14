import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'cream' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-charcoal-200/60 shadow-sm',
    cream: 'bg-cream-100 border border-gold-100',
    elevated: 'bg-white shadow-md border border-charcoal-200/40',
  }[variant];

  const hasPadding = /(^|\s)p[xytrbl]?-\d+/.test(className);
  const paddingClass = hasPadding ? '' : 'p-4 sm:p-6';

  return (
    <div className={`rounded-2xl ${paddingClass} ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
