import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parqueosApi } from "../api/parqueosApi";
import type { CreateParqueoInput, UpdateParqueoInput } from "../types";

export const PARQUEOS_QUERY_KEY = ["parqueos"] as const;

export function useParqueosQuery() {
  return useQuery({
    queryKey: PARQUEOS_QUERY_KEY,
    queryFn: parqueosApi.getAll,
  });
}

export function useCreateParqueoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParqueoInput) => parqueosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARQUEOS_QUERY_KEY });
    },
  });
}

export function useUpdateParqueoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateParqueoInput }) =>
      parqueosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARQUEOS_QUERY_KEY });
    },
  });
}
