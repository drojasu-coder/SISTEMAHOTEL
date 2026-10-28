import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { habitacionesApi } from "../api/habitacionesApi";
import { calculateSedesRenewalDelay } from "@/features/sedes/hooks/useSedes";
import type { HabitacionPublico, HabitacionDisponiblePublico } from "../types";
import type { RoomCriteria } from "./roomSearch";

function renewalDelay(data: unknown): number | false {
  const rows = Array.isArray(data) ? data : [data];
  const media = rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as { imagen_url?: string; imagen_expires_at?: string | number | null };
    return [{ imagen_url: record.imagen_url, imagen_expires_at: record.imagen_expires_at }];
  });
  return calculateSedesRenewalDelay(media, false);
}

/**
 * Consulta el catálogo público de habitaciones.
 * Está habilitado para cualquier visitante (con o senza sesión de cliente).
 */
export function useRoomCatalog() {
  const { user } = useAuth();
  return useQuery<HabitacionPublico[], Error>({
    queryKey: ['habitaciones-public-ui', user?.id, 'catalog'],
    queryFn: () => habitacionesApi.getPublic(),
    enabled: true,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (query) => query.isActive() && !query.state.error ? renewalDelay(query.state.data) : false,
  });
}

/**
 * Consulta el detalle público de una habitación.
 * Habilitado para cualquier visitante con un ID válido.
 */
export function useRoomDetail(id: number) {
  const { user } = useAuth();
  return useQuery<HabitacionPublico, Error>({
    queryKey: ['habitaciones-public-ui', user?.id, 'detail', id],
    queryFn: () => habitacionesApi.getPublicById(id),
    enabled: Number.isSafeInteger(id) && id > 0,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (query) => !query.state.error ? renewalDelay(query.state.data) : false,
  });
}

/**
 * Consulta disponibilidad pública por criterios de búsqueda.
 * Habilitado cuando hay criterios válidos y al menos una sede.
 * No requiere autenticación.
 */
export function useRoomAvailability(
  criteria: RoomCriteria,
  sites: number[],
  enabled: boolean
) {
  const { user } = useAuth();
  return useQuery<HabitacionDisponiblePublico[], Error>({
    queryKey: ['habitaciones-public-ui', user?.id, 'availability', criteria, sites],
    queryFn: async () => {
      return habitacionesApi.getPublicDisponibles({
        sucursal_id: sites[0],
        fecha_entrada: criteria.fecha_entrada,
        fecha_salida: criteria.fecha_salida,
        numero_huespedes: Number(criteria.numero_huespedes),
        ...(criteria.tipo_habitacion_id ? { tipo_habitacion_id: Number(criteria.tipo_habitacion_id) } : {}),
      });
    },
    enabled: enabled && sites.length > 0,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (query) => !query.state.error ? renewalDelay(query.state.data) : false,
  });
}
