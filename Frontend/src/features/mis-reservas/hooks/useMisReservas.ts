import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/api/client/http';
import {
  reservasApi,
  reservasHabitacionQueryKeys,
} from '@/features/reservas';

/**
 * Un 403 o 404 no mejora al reintentarse: la reserva no pertenece al usuario o
 * no existe. Los fallos de red o del servidor se reintentan una vez.
 */
const reintentarConsulta = (intentos: number, error: unknown): boolean => {
  if (
    error instanceof ApiError &&
    [400, 403, 404].includes(error.status)
  ) {
    return false;
  }
  return intentos < 1;
};

/** Reservas propias del cliente autenticado. */
export function useMisReservasQuery(userId: number) {
  const habilitada = Number.isSafeInteger(userId) && userId > 0;

  return useQuery({
    queryKey: reservasHabitacionQueryKeys.mine(userId),
    queryFn: () => reservasApi.getAllMine(),
    enabled: habilitada,
    retry: reintentarConsulta,
  });
}

/** Detalle individual de una reserva propia. */
export function useReservaHabitacionQuery(
  id: number | null,
  userId: number,
) {
  const habilitada =
    id !== null &&
    Number.isSafeInteger(id) &&
    id > 0 &&
    Number.isSafeInteger(userId) &&
    userId > 0;

  return useQuery({
    queryKey: reservasHabitacionQueryKeys.detail(id ?? 0, userId),
    queryFn: () => reservasApi.getById(id as number),
    enabled: habilitada,
    retry: reintentarConsulta,
  });
}
