import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tiposHabitacionApi } from "../api/tiposHabitacionApi";
import { TIPOS_HABITACION_QUERY_KEY } from "@/features/habitaciones/hooks/useHabitaciones";
import type { CreateTipoHabitacionInput, UpdateTipoHabitacionInput } from "../types";
import { useAuth } from "@/features/auth/AuthContext";

export { TIPOS_HABITACION_QUERY_KEY };

export function useTiposHabitacionQuery(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...TIPOS_HABITACION_QUERY_KEY, 'admin', user?.id, user?.rol],
    queryFn: tiposHabitacionApi.getAll,
    enabled,
  });
}

export function useCreateTipoHabitacionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTipoHabitacionInput) =>
      tiposHabitacionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIPOS_HABITACION_QUERY_KEY });
    },
  });
}

export function useUpdateTipoHabitacionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTipoHabitacionInput }) =>
      tiposHabitacionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIPOS_HABITACION_QUERY_KEY });
    },
  });
}

export function useUploadTipoHabitacionImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      onProgress,
    }: {
      id: number;
      file: File;
      onProgress?: (pct: number) => void;
    }) => tiposHabitacionApi.uploadImage(id, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIPOS_HABITACION_QUERY_KEY });
    },
  });
}

export function useRemoveTipoHabitacionImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tiposHabitacionApi.removeImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIPOS_HABITACION_QUERY_KEY });
    },
  });
}
