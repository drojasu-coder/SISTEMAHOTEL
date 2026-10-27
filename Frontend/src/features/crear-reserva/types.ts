import type {
  DisponibilidadHabitacionQuery,
  HabitacionDisponible,
  ReservaHabitacion,
  CreateReservaHabitacionInput,
} from '@/features/reservas/types';

export type {
  DisponibilidadHabitacionQuery,
  HabitacionDisponible,
  ReservaHabitacion,
  CreateReservaHabitacionInput,
};

/**
 * Valores del formulario de búsqueda en su estado de edición interactivo.
 */
export interface CriteriosBusquedaFormValues {
  sucursal_id: string | number;
  fecha_entrada: string;
  fecha_salida: string;
  numero_huespedes: string | number;
  tipo_habitacion_id?: string | number;
}
