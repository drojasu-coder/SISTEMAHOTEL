import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reservasAmenidadApi } from "../api/amenidadesApi";
import { amenidadesQueryKeys } from "../constants/queryKeys";
import type {
  CreateReservaAmenidadInput,
} from "../types";

/**
 * Consulta de listado de reservas del usuario autenticado (cliente).
 */
export function useMisReservasAmenidadQuery(userId?: number, enabled?: boolean) {
  return useQuery({
    queryKey: amenidadesQueryKeys.reservas.list(userId),
    queryFn: () => reservasAmenidadApi.getAll(),
    enabled: enabled !== undefined ? enabled && Boolean(userId) : Boolean(userId),
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Consulta del detalle individual de una reserva de amenidad.
 */
export function useReservaAmenidadDetalleQuery(
  id: number | null,
  userId?: number,
  enabled?: boolean
) {
  return useQuery({
    queryKey: amenidadesQueryKeys.reservas.detail(id ?? 0, userId),
    queryFn: () => reservasAmenidadApi.getById(id!),
    enabled:
      enabled !== undefined
        ? enabled && Boolean(id && id > 0 && userId)
        : Boolean(id && id > 0 && userId),
    staleTime: 1000 * 60,
  });
}

/**
 * Mutación para crear una nueva reserva de amenidad.
 */
export function useCreateReservaAmenidadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservaAmenidadInput) =>
      reservasAmenidadApi.create(data),
    onSuccess: () => {
      // Invalidar reservas propias del cliente
      queryClient.invalidateQueries({
        queryKey: amenidadesQueryKeys.reservas.all,
      });
    },
  });
}

/**
 * Consulta administrativa de todas las reservas de amenidades del hotel.
 * Aislada con clave queryKey específica para rol administrativo.
 */
export function useAdminReservasAmenidadQuery(userId?: number) {
  return useQuery({
    queryKey: amenidadesQueryKeys.reservas.adminList(userId),
    queryFn: () => reservasAmenidadApi.getAll(),
    enabled: Boolean(userId),
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Consulta administrativa del detalle individual de una reserva de amenidad.
 */
export function useAdminReservaAmenidadDetalleQuery(
  id: number | null,
  userId?: number,
  enabled?: boolean
) {
  return useQuery({
    queryKey: amenidadesQueryKeys.reservas.adminDetail(id ?? 0, userId),
    queryFn: () => reservasAmenidadApi.getById(id!),
    enabled:
      enabled !== undefined
        ? enabled && Boolean(id && id > 0 && userId)
        : Boolean(id && id > 0 && userId),
    staleTime: 1000 * 30,
  });
}

/**
 * Mutación administrativa para actualizar el estado operativo de una reserva (usada o cancelada).
 * Refresca automáticamente las consultas administrativas y las de cliente afectadas.
 */
export function useUpdateEstadoReservaAmenidadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      estado,
    }: {
      id: number;
      estado: "cancelada" | "usada";
    }) => reservasAmenidadApi.updateEstado(id, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: amenidadesQueryKeys.reservas.all,
      });
    },
  });
}
