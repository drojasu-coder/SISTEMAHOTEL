import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actividadesApi } from '../api/actividadesApi';
import { actividadesQueryKeys } from '../constants/queryKeys';
import type {
  CreateRecursoActividadInput,
  UpdateRecursoActividadInput,
  CreateInstructorInput,
  UpdateInstructorInput,
} from '../types';

export function useRecursosActividadQuery() {
  return useQuery({
    queryKey: actividadesQueryKeys.recursos(),
    queryFn: actividadesApi.getRecursos,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecursoActividadQuery(id?: number) {
  return useQuery({
    queryKey: actividadesQueryKeys.recursoDetail(id!),
    queryFn: () => actividadesApi.getRecursoById(id!),
    enabled: typeof id === 'number' && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstructoresQuery() {
  return useQuery({
    queryKey: actividadesQueryKeys.instructores(),
    queryFn: actividadesApi.getInstructores,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRecursoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecursoActividadInput) => actividadesApi.createRecurso(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.recursos() });
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all });
    },
  });
}

export function useUpdateRecursoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecursoActividadInput }) =>
      actividadesApi.updateRecurso(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.recursoDetail(id) });
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.recursos() });
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all });
    },
  });
}

export function useCreateInstructorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInstructorInput) => actividadesApi.createInstructor(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.instructores() });
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all });
    },
  });
}

export function useUpdateInstructorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInstructorInput }) =>
      actividadesApi.updateInstructor(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.instructores() });
      void queryClient.invalidateQueries({ queryKey: actividadesQueryKeys.all });
    },
  });
}
