import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mesasApi } from '../api/mesasApi';
import type { CreateMesaInput, UpdateMesaInput } from '../types';

export const MESAS_QUERY_KEY = ['mesas'] as const;

export function useMesasQuery() {
  return useQuery({
    queryKey: MESAS_QUERY_KEY,
    queryFn: mesasApi.getAll,
  });
}

export function useCreateMesaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMesaInput) => mesasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESAS_QUERY_KEY });
    },
  });
}

export function useUpdateMesaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMesaInput }) =>
      mesasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESAS_QUERY_KEY });
    },
  });
}
