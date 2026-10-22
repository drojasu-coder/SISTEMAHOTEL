import { useQuery } from '@tanstack/react-query';
import { sedesApi } from '@/features/sedes/api/sedesApi';
import { SEDES_QUERY_KEY } from '@/features/sedes/hooks/useSedes';

/**
 * Consulta opcional del catálogo de sedes para resolver nombres cuando la
 * relación de la reserva no los incluye. Comparte clave y caché con el módulo
 * de sedes; si falla, la reserva se sigue mostrando con su identificador.
 */
export function useSedesFallback(enabled: boolean) {
  return useQuery({
    queryKey: SEDES_QUERY_KEY,
    queryFn: sedesApi.getAll,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
