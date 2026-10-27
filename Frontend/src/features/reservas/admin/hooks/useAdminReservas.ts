import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { reservasAdminQueryKeys } from '../types';

/**
 * Consulta todas las reservas de habitación para personal administrativo.
 *
 * Utiliza claves de consulta independientes de las de clientes ("Mis reservas"),
 * asociadas a la identidad administrativa (userId).
 */
export function useAdminReservasQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: reservasAdminQueryKeys.list(user?.id),
    queryFn: () => reservasApi.getAllAdmin(),
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
