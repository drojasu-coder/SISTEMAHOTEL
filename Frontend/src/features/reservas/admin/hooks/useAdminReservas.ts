import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { reservasAdminQueryKeys } from '../types';

/**
 * Consulta todas las reservas de habitación para personal administrativo.
 *
 * Utiliza claves de consulta independientes de las de clientes ("Mis reservas"),
 * asociadas a la identidad administrativa (userId).
 */
export function useAdminReservasQuery(sucursalId: number | 'all' = 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...reservasAdminQueryKeys.list(user?.id), sucursalId] as const,
    queryFn: () => reservasApi.getAllAdmin(sucursalId === 'all' ? undefined : sucursalId),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
}

/**
 * Consulta el detalle individual de una reserva de habitación para personal administrativo.
 */
export function useAdminReservaDetalleQuery(id: number | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: reservasAdminQueryKeys.detail(id ?? 0, user?.id),
    queryFn: () => reservasApi.getById(id!),
    enabled: Boolean(user?.id && id !== null && id > 0),
    staleTime: 30_000,
  });
}

/**
 * Mutación para actualizar el estado de una reserva de habitación.
 */
export function useUpdateAdminReservaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { estado?: string } }) =>
      reservasApi.updateAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasAdminQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: ['admin-dashboard'],
      });
    },
  });
}

/**
 * Mutación para cancelar lógicamente una reserva de habitación.
 */
export function useCancelAdminReservaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reservasApi.cancelAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasAdminQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: ['admin-dashboard'],
      });
    },
  });
}
