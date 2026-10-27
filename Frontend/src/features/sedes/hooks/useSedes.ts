import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sedesApi } from '../api/sedesApi';
import type { CreateSucursalInput, Sucursal, UpdateSucursalInput } from '../types';

export const SEDES_QUERY_KEY = ['sedes'] as const;

/**
 * Margen de tiempo para renovar la URL antes de su expiración (5 minutos).
 * Coherente con el patrón establecido en useBranding.
 */
export const RENEWAL_LEAD_TIME_MS = 5 * 60 * 1000;

/**
 * Calcula el tiempo en milisegundos para la próxima renovación proactiva de sedes.
 * Retorna false si hay un error, no hay sedes o no hay URLs con expiración.
 */
export function calculateSedesRenewalDelay(
  sedes: Sucursal[] | undefined,
  isError: boolean,
  now: number = Date.now(),
): number | false {
  if (isError || !sedes || !Array.isArray(sedes) || sedes.length === 0) return false;

  const expirationTimes = sedes
    .filter((s) => s.imagen_url && s.imagen_expires_at)
    .map((s) => new Date(s.imagen_expires_at!).getTime())
    .filter((t) => !Number.isNaN(t));

  if (expirationTimes.length === 0) return false;

  const earliestExpiry = Math.min(...expirationTimes);
  const msUntilExpiry = earliestExpiry - now;

  // Si ya expiró, programar reintento controlado en 5 segundos
  if (msUntilExpiry <= 0) {
    return 5 * 1000;
  }

  // Si falta menos del margen de anticipación (5 min), renovar en 10 segundos
  if (msUntilExpiry <= RENEWAL_LEAD_TIME_MS) {
    return 10 * 1000;
  }

  // Renovar con el margen de anticipación antes de la expiración
  return msUntilExpiry - RENEWAL_LEAD_TIME_MS;
}

export interface UseSedesQueryOptions {
  retry?: boolean | number;
}

export function useSedesQuery(options?: UseSedesQueryOptions) {
  return useQuery<Sucursal[]>({
    queryKey: SEDES_QUERY_KEY,
    queryFn: sedesApi.getAll,
    staleTime: 1000 * 60 * 45, // 45 minutos si las URLs expiran a los 60 min
    gcTime: 1000 * 60 * 65,
    refetchInterval: (query) => {
      const data = query.state.data;
      const isError = query.state.status === 'error';
      return calculateSedesRenewalDelay(data, isError);
    },
    refetchIntervalInBackground: false, // Solo renueva activamente mientras la pestaña esté activa
    refetchOnWindowFocus: (query) => {
      const data = query.state.data;
      if (!data) return true;
      const expirationTimes = data
        .filter((s) => s.imagen_url && s.imagen_expires_at)
        .map((s) => new Date(s.imagen_expires_at!).getTime())
        .filter((t) => !Number.isNaN(t));
      if (expirationTimes.length === 0) return false;
      const earliestExpiry = Math.min(...expirationTimes);
      return earliestExpiry - Date.now() <= RENEWAL_LEAD_TIME_MS;
    },
    refetchOnReconnect: true,
    ...options,
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

export function useUploadSedeImageMutation() {
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
    }) => sedesApi.uploadSedeImage(id, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEDES_QUERY_KEY });
    },
  });
}

export function useRemoveSedeImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sedesApi.removeImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEDES_QUERY_KEY });
    },
  });
}
