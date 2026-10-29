import { Badge } from './Badge';
import { useTextosHorarioAdmin } from '@/i18n/horariosAdmin';

interface HorarioBadgeProps {
  registro: { hora_apertura?: string | null; hora_cierre?: string | null; duracion_minutos?: number | null };
  /** Amenidades: además del horario necesitan duración fija para ofrecer franjas. */
  requiereDuracion?: boolean;
}

/**
 * Indicador del panel: muestra el horario de reserva configurado o avisa que falta,
 * porque sin él el servicio no acepta reservas en línea.
 */
export function HorarioBadge({ registro, requiereDuracion = false }: HorarioBadgeProps) {
  const th = useTextosHorarioAdmin();
  const apertura = registro.hora_apertura?.slice(0, 5);
  const cierre = registro.hora_cierre?.slice(0, 5);
  const completo = Boolean(apertura && cierre) && (!requiereDuracion || Boolean(registro.duracion_minutos));
  if (!completo) {
    return <Badge tone="advertencia">{apertura && cierre ? th.faltaDuracion : th.sinHorario}</Badge>;
  }
  return <Badge tone="neutro">{`${apertura}–${cierre}${requiereDuracion ? ` · ${registro.duracion_minutos} min` : ''}`}</Badge>;
}
