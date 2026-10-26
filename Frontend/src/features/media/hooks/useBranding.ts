import { useQuery } from '@tanstack/react-query';
import { fetchBranding, type BrandingData } from '../api/mediaApi';

export const BRANDING_QUERY_KEY = ['media', 'branding'] as const;

/**
 * Margen de tiempo para renovar la URL antes de su expiración (5 minutos).
 */
export const RENEWAL_LEAD_TIME_MS = 5 * 60 * 1000;

/**
 * Calcula el tiempo en milisegundos para la próxima renovación proactiva.
 * Retorna false si hay un error o datos inválidos para evitar bucles de peticiones.
 */
export function calculateRenewalDelay(
  expiresAt: string | undefined,
  isError: boolean,
  now: number = Date.now(),
): number | false {
  if (isError || !expiresAt) return false;

  const expiryTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryTime)) return false;

  const msUntilExpiry = expiryTime - now;

  // Si ya expiró, programar un reintento controlado en 5 segundos
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

export interface UseBrandingOptions {
  retry?: boolean | number;
}

/**
 * Hook de TanStack Query para compartir la carga y vigencia de los logos de HOTEL HUNAHPÚ.
 * - Programa la renovación automática antes de que expiren las URLs prefirmadas mientras la página siga abierta.
 * - Evalúa vigencia al reenfocar la ventana o reconectar la red.
 * - Evita bucles ante fallos de conexión deteniendo el intervalo automático en caso de error.
 */
export function useBranding(options?: UseBrandingOptions) {
  return useQuery<BrandingData>({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: fetchBranding,
    staleTime: 1000 * 60 * 45, // Considerado fresco hasta 45 minutos si la expiración estándar es de 60 min
    gcTime: 1000 * 60 * 65, // Retener en caché durante la vida útil de las URLs
    refetchInterval: (query) => {
      const data = query.state.data;
      const isError = query.state.status === 'error';
      return calculateRenewalDelay(data?.expiresAt, isError);
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: (query) => {
      const data = query.state.data;
      if (!data?.expiresAt) return true;
      const timeLeftMs = new Date(data.expiresAt).getTime() - Date.now();
      // Si faltan menos de 5 minutos o ya venció, renovar al retomar el foco
      return timeLeftMs <= RENEWAL_LEAD_TIME_MS;
    },
    refetchOnReconnect: true,
    retry: 1,
    ...options,
  });
}
