import { useQuery } from '@tanstack/react-query';
import { actividadesApi } from '../api/actividadesApi';
import { actividadesQueryKeys } from '../constants/queryKeys';

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
