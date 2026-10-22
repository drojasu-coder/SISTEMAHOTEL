import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';
import { Spinner } from './Button';

type Tone = 'error' | 'success' | 'info' | 'warning';

const tones: Record<Tone, { box: string; icon: React.ComponentType<{ className?: string }> }> = {
  error: { box: 'border-error-600/20 bg-error-50 text-error-700', icon: AlertCircle },
  success: { box: 'border-exito-600/20 bg-exito-50 text-exito-700', icon: CheckCircle2 },
  info: { box: 'border-info-600/20 bg-info-50 text-info-700', icon: Info },
  warning: { box: 'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700', icon: TriangleAlert },
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Mensaje en línea. Los errores se anuncian como alerta; el resto como estado. */
export const Alert: React.FC<AlertProps> = ({ tone = 'info', title, children, className }) => {
  const { box, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border p-4', box, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-1 text-xs">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
};

/** Pantalla completa para estados de carga o error de la sesión. */
export const StatusScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-neutro-50 px-4">
    <div className="flex max-w-sm flex-col items-center gap-4 text-center" aria-live="polite">
      {children}
    </div>
  </div>
);

export const LoadingNotice: React.FC<{ label?: string }> = ({ label = es.comunes.cargando }) => (
  <p role="status" className="inline-flex items-center gap-2 text-sm text-neutro-600">
    <Spinner />
    {label}
  </p>
);
