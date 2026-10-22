import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sedesApi } from '../api/sedesApi';
import type { CreateSucursalInput, UpdateSucursalInput } from '../types';

export const SEDES_QUERY_KEY = ['sedes'] as const;

export function useSedesQuery() {
  return useQuery({
    queryKey: SEDES_QUERY_KEY,
    queryFn: sedesApi.getAll,
  });
}

export function useCreateSedeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSucursalInput) => sedesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEDES_QUERY_KEY });
    },
  });
}

export function useUpdateSedeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSucursalInput }) =>
      sedesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEDES_QUERY_KEY });
    },
  });
}

export function useToggleSedeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      sedesApi.toggleEstado(id, activa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEDES_QUERY_KEY });
    },
  });
}
