import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { amenidadesApi } from "../api/amenidadesApi";
import type { CreateAmenidadInput, UpdateAmenidadInput } from "../types";

export const AMENIDADES_QUERY_KEY = ["amenidades"] as const;

export function useAmenidadesQuery() {
  return useQuery({
    queryKey: AMENIDADES_QUERY_KEY,
    queryFn: amenidadesApi.getAll,
  });
}

export function useAmenidadQuery(id: number) {
  return useQuery({
    queryKey: [...AMENIDADES_QUERY_KEY, id] as const,
    queryFn: () => amenidadesApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAmenidadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAmenidadInput) => amenidadesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AMENIDADES_QUERY_KEY });
    },
  });
}

export function useUpdateAmenidadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAmenidadInput }) =>
      amenidadesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AMENIDADES_QUERY_KEY });
    },
  });
}
