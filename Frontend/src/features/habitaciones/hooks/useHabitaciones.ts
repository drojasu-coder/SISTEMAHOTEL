import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { habitacionesApi } from "../api/habitacionesApi";
import type { CreateHabitacionInput, UpdateHabitacionInput } from "../types";

export const HABITACIONES_QUERY_KEY = ["habitaciones"] as const;
export const TIPOS_HABITACION_QUERY_KEY = ["tipos-habitacion"] as const;

export function useHabitacionesQuery() {
  return useQuery({
    queryKey: HABITACIONES_QUERY_KEY,
    queryFn: habitacionesApi.getAll,
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
    },
  });
}
