import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { habitacionesApi } from '@/features/habitaciones/api/habitacionesApi';
import { reservasHabitacionQueryKeys } from '@/features/reservas/constants/queryKeys';
import { useAuth } from '@/features/auth/AuthContext';
import { carritoQueryKeys } from '@/features/carrito/constants/queryKeys';
import type {
  CreateReservaHabitacionInput,
  DisponibilidadHabitacionQuery,
  HabitacionDisponible,
  ReservaHabitacionConCarrito,
} from '@/features/reservas/types';
import type { HabitacionDisponiblePublico } from '@/features/habitaciones/types';
import { commercialRoomName } from '@/features/habitaciones/public/roomCategories';

/**
 * Transforma una HabitacionDisponible (endpoint privado) a HabitacionDisponiblePublico
 * para mantener una estructura consistente tanto para clientes como para visitantes.
 */
function toPublico(h: HabitacionDisponible): HabitacionDisponiblePublico {
  return {
    id: h.id,
    tipo: h.TipoHabitacion
      ? {
          id: h.TipoHabitacion.id,
          nombre: commercialRoomName(h.TipoHabitacion),
          descripcion: h.TipoHabitacion.descripcion ?? null,
          capacidad_maxima: h.TipoHabitacion.capacidad_maxima,
          tarifa_noche: String(h.TipoHabitacion.tarifa_noche ?? '0'),
          imagen_url: h.TipoHabitacion.imagen_url ?? null,
          imagen_creditos: h.TipoHabitacion.imagen_creditos ?? null,
        }
      : null,
    sucursal: h.Sucursal
      ? {
          id: h.Sucursal.id,
          nombre: h.Sucursal.nombre,
        }
      : null,
    imagen_url: h.imagen_url ?? null,
    imagen_creditos: h.imagen_creditos ?? null,
    noches: h.noches,
    tarifa_noche: String(h.tarifa_noche ?? '0'),
    total_estimado: String(h.total_estimado ?? '0'),
  };
}

/**
 * Consulta de habitaciones disponibles según los criterios confirmados por el usuario.
 * Es pública: cualquier visitante puede consultar disponibilidad real sin sesión.
 * Cuando hay sesión de cliente, se usa el endpoint privado; de lo contrario, el público.
 */
export function useDisponibilidadQuery(
  query: DisponibilidadHabitacionQuery | null,
  enabled: boolean = true
) {
  const { user, status } = useAuth();
  const isClient = status === 'authenticated' && user?.rol === 'cliente';

  return useQuery<HabitacionDisponiblePublico[], Error>({
    queryKey: query
      ? [...reservasHabitacionQueryKeys.disponibilidad(query), isClient ? user.id : 'public']
      : (['reservas-habitacion', 'disponibilidad', 'disabled'] as const),
    queryFn: async () => {
      if (!query) {
        throw new Error('No se han especificado criterios de búsqueda');
      }
      if (isClient) {
        const privado = await reservasApi.getDisponibilidad(query);
        return privado.map(toPublico);
      }
      return habitacionesApi.getPublicDisponibles(query);
    },
    enabled: Boolean(query) && enabled,
  });
}

/**
 * Mutación para crear una reserva de habitación en estado pendiente.
 * Requiere autenticación (el backend la protege con authMiddleware + requireRole).
 * No reintenta automáticamente para evitar creaciones duplicadas en caso de fallo de red.
 */
export function useCreateReservaMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<ReservaHabitacionConCarrito, Error, CreateReservaHabitacionInput>({
    mutationFn: (data) => reservasApi.create(data),
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
      // La reserva queda ya en el carrito: refrescar el carrito y su contador del encabezado.
      queryClient.invalidateQueries({ queryKey: carritoQueryKeys.all });
    },
  });
}
