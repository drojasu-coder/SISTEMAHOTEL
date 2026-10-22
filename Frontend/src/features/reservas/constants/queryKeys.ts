import type { DisponibilidadHabitacionQuery } from '../types';

/**
 * Claves de TanStack Query centralizadas para el dominio de reservas de habitación.
 *
 * Directrices:
 * - Consultas privadas vinculan el ID de usuario autenticado para evitar fugas de caché entre sesiones.
 * - Consultas de disponibilidad incluyen todos los parámetros de filtrado en la clave.
 */
export const reservasHabitacionQueryKeys = {
  all: ['reservas-habitacion'] as const,

  // Consultas de disponibilidad por fechas y sede
  disponibilidad: (filters: DisponibilidadHabitacionQuery) =>
    [...reservasHabitacionQueryKeys.all, 'disponibilidad', filters] as const,

  // Listado de reservas del usuario autenticado ("Mis reservas")
  mine: (userId?: number) =>
    [...reservasHabitacionQueryKeys.all, 'mine', userId ?? 'anonymous'] as const,

  // Detalle individual de una reserva
  detail: (id: number, userId?: number) =>
    [...reservasHabitacionQueryKeys.all, 'detail', id, userId ?? 'anonymous'] as const,
};
