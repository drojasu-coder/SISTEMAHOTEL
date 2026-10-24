import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reservasAmenidadApi } from "../api/amenidadesApi";
import { amenidadesQueryKeys } from "../constants/queryKeys";
import type { CreateReservaAmenidadInput, ReservaAmenidad } from "../types";

export function useMisReservasAmenidadQuery(
  userId: number | undefined,
  enabled: boolean = true
) {
  return useQuery<ReservaAmenidad[]>({
    queryKey: amenidadesQueryKeys.reservas.list(userId),
    queryFn: reservasAmenidadApi.getAll,
    enabled: Boolean(userId) && enabled,
    retry: false,
  });
}

export function useReservaAmenidadDetalleQuery(
  id: number,
  userId: number | undefined,
  enabled: boolean = true
) {
  return useQuery<ReservaAmenidad>({
    queryKey: amenidadesQueryKeys.reservas.detail(id, userId),
    queryFn: () => reservasAmenidadApi.getById(id),
    enabled: Boolean(id && id > 0) && Boolean(userId) && enabled,
    retry: false,
  });
}

export function useCreateReservaAmenidadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservaAmenidadInput) =>
      reservasAmenidadApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: amenidadesQueryKeys.reservas.all,
      });
    },
  });
}
