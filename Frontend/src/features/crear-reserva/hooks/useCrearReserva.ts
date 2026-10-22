import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { reservasHabitacionQueryKeys } from '@/features/reservas/constants/queryKeys';
import type {
  CreateReservaHabitacionInput,
  DisponibilidadHabitacionQuery,
  HabitacionDisponible,
  ReservaHabitacion,
} from '@/features/reservas/types';
import { useAuth } from '@/features/auth/AuthContext';

/**
 * Consulta de habitaciones disponibles según los criterios confirmados por el usuario.
 */
export function useDisponibilidadQuery(
  query: DisponibilidadHabitacionQuery | null,
  enabled: boolean = true
) {
  const { user } = useAuth();
  const isClient = user?.rol === 'cliente';

  return useQuery<HabitacionDisponible[], Error>({
    queryKey: query
      ? reservasHabitacionQueryKeys.disponibilidad(query)
      : (['reservas-habitacion', 'disponibilidad', 'disabled'] as const),
    queryFn: () => {
      if (!query) {
        throw new Error('No se han especificado criterios de búsqueda');
      }
      return reservasApi.getDisponibilidad(query);
    },
    enabled: Boolean(query) && enabled && isClient,
  });
}

/**
 * Mutación para crear una reserva de habitación en estado pendiente.
 * No reintenta automáticamente para evitar creaciones duplicadas en caso de fallo de red.
 */
export function useCreateReservaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<ReservaHabitacion, Error, CreateReservaHabitacionInput>({
    mutationFn: (data: CreateReservaHabitacionInput) => reservasApi.create(data),
    retry: false, // Bloquear reintentos automáticos del POST
    onSuccess: () => {
      // Invalidar las reservas del usuario autenticado
      queryClient.invalidateQueries({
        queryKey: reservasHabitacionQueryKeys.mine(user?.id),
      });
      // Invalidar consultas generales del dominio de reservas y disponibilidad
      queryClient.invalidateQueries({
        queryKey: reservasHabitacionQueryKeys.all,
      });
    },
  });
}
