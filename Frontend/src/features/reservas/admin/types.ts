import type { EstadoReservaHabitacion } from '../types';

export interface ReservasAdminFiltersState {
  search: string;
  sucursalId: number | 'all';
  estado: EstadoReservaHabitacion | 'all';
}

export const reservasAdminQueryKeys = {
  all: ['reservas', 'admin'] as const,
  list: (userId: number | undefined, filters?: ReservasAdminFiltersState) =>
    ['reservas', 'admin', 'list', userId, filters] as const,
  detail: (id: number, userId: number | undefined) =>
    ['reservas', 'admin', 'detail', userId, id] as const,
};
