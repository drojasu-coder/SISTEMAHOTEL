import React from 'react';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

export type Tone = 'exito' | 'error' | 'advertencia' | 'info' | 'neutro';
export type Status = keyof typeof es.estados;

const statusTone: Partial<Record<Status, Tone>> & Record<string, Tone> = {
  disponible: 'exito',
  confirmada: 'exito',
  pagada: 'exito',
  activa: 'exito',
  completada: 'exito',
  vigente: 'exito',
  rechazado: 'error',
  cancelada: 'error',
  vencida: 'error',
  limpieza: 'advertencia',
  no_show: 'error',
  pago_vencido: 'error',
  agotado: 'error',
  pendiente: 'advertencia',
  en_proceso: 'advertencia',
  en_espera: 'advertencia',
  expirada: 'advertencia',
  ocupada: 'advertencia',
  informativo: 'info',
  cotizada: 'info',
  programada: 'info',
  reservada: 'info',
  cancelado: 'neutro',
  reembolsado: 'neutro',
  reembolsado_parcial: 'neutro',
  desactivada: 'neutro',
  finalizada: 'neutro',
  inactiva: 'neutro',
  mantenimiento: 'neutro',
  libre: 'neutro',
};

const toneClasses: Record<Tone, string> = {
  exito: 'bg-exito-50 text-exito-700 border-exito-600/15',
  error: 'bg-error-50 text-error-700 border-error-600/15',
  advertencia: 'bg-advertencia-50 text-advertencia-700 border-advertencia-600/15',
  info: 'bg-info-50 text-info-700 border-info-600/15',
  neutro: 'bg-neutro-100 text-neutro-600 border-neutro-300',
};

export interface BadgeProps {
  status?: Status;
  tone?: Tone;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Etiqueta de estado. Si se provee `status`, se resuelve el tono automáticamente
 * desde `es.estados`; de lo contrario se usa `tone` (por defecto `neutro`).
 * El punto de color usa `bg-current` para heredar el color del texto.\n */
export const Badge: React.FC<BadgeProps> = ({ status, tone = 'neutro', className, children }) => {
  const resolved = status ? (statusTone[status] ?? tone) : tone;
  const label = children ?? (status ? es.estados[status] : undefined);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs font-medium',
        toneClasses[resolved],
        className
      )}
      aria-label={label ? String(label) : undefined}
    >
      <span className="size-1 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
};
