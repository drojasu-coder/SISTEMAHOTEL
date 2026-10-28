import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actividadesApi } from '../api/actividadesApi';
import { actividadesQueryKeys } from '../constants/queryKeys';
import type { CreateReservaActividadInput, UpdateReservaActividadInput } from '../types';

export function useMisReservasActividadQuery(userId?: number) {
  return useQuery({
    queryKey: actividadesQueryKeys.reservas.list(userId),
    queryFn: actividadesApi.getMyReservas,
    enabled: typeof userId === 'number' && userId > 0,
    staleTime: 60 * 1000,
  });
}

export function useMiReservaActividadQuery(id?: number, userId?: number) {
  return useQuery({
    queryKey: actividadesQueryKeys.reservas.detail(id!, userId),
    queryFn: () => actividadesApi.getMyReservaById(id!),
    enabled: typeof userId === 'number' && userId > 0 && typeof id === 'number' && id > 0,
    staleTime: 60 * 1000,
  });
}

export function useAdminReservasActividadQuery() {
  return useQuery({
    queryKey: actividadesQueryKeys.reservas.adminList(),
    queryFn: actividadesApi.getAdminReservas,
    staleTime: 30 * 1000,
  });
}

export function useAdminReservaActividadQuery(id?: number) {
  return useQuery({
    queryKey: actividadesQueryKeys.reservas.adminDetail(id!),
    queryFn: () => actividadesApi.getAdminReservaById(id!),
    enabled: typeof id === 'number' && id > 0,
    staleTime: 30 * 1000,
  });
}

export function useCreateReservaActividadMutation(userId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReservaActividadInput) => actividadesApi.createReserva(data),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: actividadesQueryKeys.reservas.list(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: actividadesQueryKeys.reservas.adminList(),
      });
      void queryClient.invalidateQueries({
        queryKey: [...actividadesQueryKeys.all, 'salidas'],
      });
    },
  });
}

export function useUpdateEstadoReservaActividadMutation(id: number, userId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateReservaActividadInput) => actividadesApi.updateEstadoReserva(id, data),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: actividadesQueryKeys.reservas.adminList(),
      });
      void queryClient.invalidateQueries({
        queryKey: actividadesQueryKeys.reservas.adminDetail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: actividadesQueryKeys.reservas.list(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: actividadesQueryKeys.reservas.detail(id, userId),
      });
    },
  });
}
