import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { habitacionesApi } from "../api/habitacionesApi";
import type { CreateHabitacionInput, UpdateHabitacionInput } from "../types";

export const HABITACIONES_QUERY_KEY = ["habitaciones"] as const;
export const TIPOS_HABITACION_QUERY_KEY = ["tipos-habitacion"] as const;

export function useHabitacionesQuery(sucursalId: number | "all" = "all") {
  return useQuery({
    queryKey: [...HABITACIONES_QUERY_KEY, sucursalId],
    queryFn: () => habitacionesApi.getAll(sucursalId === "all" ? undefined : sucursalId),
  });
}

export function useTiposHabitacionQuery() {
  return useQuery({
    queryKey: TIPOS_HABITACION_QUERY_KEY,
    queryFn: habitacionesApi.getTiposHabitacion,
  });
}

export function useCreateHabitacionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHabitacionInput) => habitacionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITACIONES_QUERY_KEY });
      // Catálogo y disponibilidad públicos: la habitación debe poder encontrarse sin recargar.
      queryClient.invalidateQueries({ queryKey: ['habitaciones-public-ui'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

export function useUpdateHabitacionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHabitacionInput }) =>
      habitacionesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITACIONES_QUERY_KEY });
      // Catálogo y disponibilidad públicos: la habitación debe poder encontrarse sin recargar.
      queryClient.invalidateQueries({ queryKey: ['habitaciones-public-ui'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
}

export function useUploadHabitacionImageMutation() {
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
    }) => habitacionesApi.uploadImage(id, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITACIONES_QUERY_KEY });
      // Catálogo y disponibilidad públicos: la habitación debe poder encontrarse sin recargar.
      queryClient.invalidateQueries({ queryKey: ['habitaciones-public-ui'] });
    },
  });
}

export function useRemoveHabitacionImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => habitacionesApi.removeImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITACIONES_QUERY_KEY });
      // Catálogo y disponibilidad públicos: la habitación debe poder encontrarse sin recargar.
      queryClient.invalidateQueries({ queryKey: ['habitaciones-public-ui'] });
    },
  });
}
