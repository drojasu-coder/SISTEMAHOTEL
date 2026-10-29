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
  sedes: readonly Pick<Sucursal, 'imagen_url' | 'imagen_expires_at'>[] | undefined,
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

export function useSedeQuery(id: number) {
  return useQuery({
    queryKey: [...SEDES_QUERY_KEY, id] as const,
    queryFn: () => sedesApi.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * Una sede nueva, editada o reactivada debe aparecer de inmediato en el selector
 * de sede del panel (alcance del usuario) y en el resumen de recursos, no solo en el listado.
 */
const invalidateSedeViews = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: SEDES_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ['admin-sede-scope'] });
  void queryClient.invalidateQueries({ queryKey: ['sedes-recursos-resumen'] });
};

/** Muestra la sede devuelta por el servidor sin esperar al refetch (la imagen nueva aparece al instante). */
const applySedeToCache = (queryClient: ReturnType<typeof useQueryClient>, sede: Sucursal) => {
  queryClient.setQueryData<Sucursal[]>(SEDES_QUERY_KEY, (prev) => prev?.map((item) => (item.id === sede.id ? sede : item)));
  queryClient.setQueryData<Sucursal>([...SEDES_QUERY_KEY, sede.id], sede);
};

/**
 * La confirmación solo cuenta como éxito si el servidor guardó la referencia y puede
 * entregar una URL para mostrarla; en otro caso se informa en lugar de dar un falso éxito.
 */
const assertImageResolved = (sede: Sucursal, field: 'imagen' | 'restaurante_imagen') => {
  const record = sede as unknown as Record<string, unknown>;
  if (!record[`${field}_url`]) {
    throw new Error('La fotografía se subió, pero el servidor no pudo publicarla para su visualización. Intente de nuevo o contacte a soporte.');
  }
  return sede;
};

export function useCreateSedeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSucursalInput) => sedesApi.create(data),
    onSuccess: () => {
      invalidateSedeViews(queryClient);
    },
  });
}

export function useUpdateSedeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSucursalInput }) =>
      sedesApi.update(id, data),
    onSuccess: () => {
      invalidateSedeViews(queryClient);
    },
  });
}

export function useToggleSedeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activa }: { id: number; activa: boolean }) =>
      sedesApi.toggleEstado(id, activa),
    onSuccess: () => {
      invalidateSedeViews(queryClient);
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
    }) => sedesApi.uploadSedeImage(id, file, onProgress).then((sede) => assertImageResolved(sede, 'imagen')),
    onSuccess: (sede) => {
      applySedeToCache(queryClient, sede);
      invalidateSedeViews(queryClient);
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

export function useUploadRestauranteImageMutation() {
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
    }) => sedesApi.uploadRestauranteImage(id, file, onProgress).then((sede) => assertImageResolved(sede, 'restaurante_imagen')),
    onSuccess: (sede) => {
      applySedeToCache(queryClient, sede);
      invalidateSedeViews(queryClient);
    },
  });
}

export function useRemoveRestauranteImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sedesApi.removeRestauranteImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEDES_QUERY_KEY });
    },
  });
}
