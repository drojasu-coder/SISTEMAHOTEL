import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inicioApi } from '../api/inicioApi';
import type { InicioData, UpdateInicioInput } from '../types';

export const INICIO_QUERY_KEY = ['inicio'] as const;

export const RENEWAL_LEAD_TIME_MS = 5 * 60 * 1000; // 5 min de anticipación

export function calculateInicioRenewalDelay(
  data: InicioData | undefined,
  isError: boolean,
  now: number = Date.now(),
): number | false {
  if (isError || !data || !data.expiresAt) return false;

  const expiryTime = new Date(data.expiresAt).getTime();
  if (Number.isNaN(expiryTime)) return false;

  const msUntilExpiry = expiryTime - now;

  if (msUntilExpiry <= 0) {
    return 5 * 1000;
  }

  if (msUntilExpiry <= RENEWAL_LEAD_TIME_MS) {
    return 10 * 1000;
  }

  return msUntilExpiry - RENEWAL_LEAD_TIME_MS;
}

export interface UseInicioQueryOptions {
  retry?: boolean | number;
}

export function useInicioQuery(options?: UseInicioQueryOptions) {
  return useQuery<InicioData>({
    queryKey: INICIO_QUERY_KEY,
    queryFn: inicioApi.getContent,
    staleTime: 1000 * 60 * 45,
    gcTime: 1000 * 60 * 65,
    refetchInterval: (query) => {
      const data = query.state.data;
      const isError = query.state.status === 'error';
      return calculateInicioRenewalDelay(data, isError);
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: (query) => {
      const data = query.state.data;
      if (!data) return true;
      if (!data.expiresAt) return false;
      const expiryTime = new Date(data.expiresAt).getTime();
      return expiryTime - Date.now() <= RENEWAL_LEAD_TIME_MS;
    },
    refetchOnReconnect: true,
    ...options,
  });
}

export function useUpdateInicioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInicioInput) => inicioApi.updateContent(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(INICIO_QUERY_KEY, updated);
    },
  });
}

export function useUploadInicioImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      section,
      file,
      onProgress,
    }: {
      section: 'hero' | 'presentacion' | 'experiencias';
      file: File;
      onProgress?: (pct: number) => void;
    }) => inicioApi.uploadImage(section, file, onProgress),
    onSuccess: (updated) => {
      queryClient.setQueryData(INICIO_QUERY_KEY, updated);
    },
  });
}

export function useRemoveInicioImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (section: 'hero' | 'presentacion' | 'experiencias') =>
      inicioApi.removeImage(section),
    onSuccess: (updated) => {
      queryClient.setQueryData(INICIO_QUERY_KEY, updated);
    },
  });
}
