import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-charcoal-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`h-12 px-4 rounded-lg border bg-white text-charcoal-900 placeholder:text-charcoal-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-bronze-500 focus:border-transparent ${
            error
              ? 'border-status-danger focus:ring-status-danger'
              : 'border-charcoal-200 hover:border-charcoal-400'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-status-danger font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-charcoal-400">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
