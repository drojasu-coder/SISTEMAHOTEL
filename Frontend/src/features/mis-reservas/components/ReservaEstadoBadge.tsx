import React from 'react';
import {
  ESTADOS_RESERVA_HABITACION,
  type EstadoReservaHabitacion,
} from '@/features/reservas';
import { cn } from '@/lib/cn';
import { usePublicTexts } from '@/i18n/public';

const estilos: Record<EstadoReservaHabitacion, string> = {
  pendiente:
    'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700',
  confirmada: 'border-exito-600/20 bg-exito-50 text-exito-700',
  cancelada: 'border-error-600/20 bg-error-50 text-error-700',
  finalizada: 'border-info-600/20 bg-info-50 text-info-700',
  expirada: 'border-neutro-300 bg-neutro-100 text-neutro-700',
};

function esEstadoConocido(
  estado: string,
): estado is EstadoReservaHabitacion {
  return (ESTADOS_RESERVA_HABITACION as readonly string[]).includes(estado);
}

export const ReservaEstadoBadge: React.FC<{ estado: string }> = ({
  estado,
}) => {
  const textosMisReservas = usePublicTexts('misReservas');
  const conocido = esEstadoConocido(estado);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold',
        conocido ? estilos[estado] : estilos.expirada,
      )}
    >
      {conocido ? textosMisReservas.estados[estado] : estado}
    </span>
  );
};
