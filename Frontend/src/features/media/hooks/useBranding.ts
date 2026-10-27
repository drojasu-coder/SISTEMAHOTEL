import { useQuery } from '@tanstack/react-query';
import { fetchBranding, type BrandingData } from '../api/mediaApi';

export const BRANDING_QUERY_KEY = ['media', 'branding'] as const;

/**
 * Margen de tiempo para renovar la URL antes de su expiración (5 minutos).
 */
export const RENEWAL_LEAD_TIME_MS = 5 * 60 * 1000;

/**
 * Calcula el tiempo en milisegundos para la próxima renovación proactiva.
 * Retorna false si hay un error, no hay expiración (CloudFront) o datos inválidos.
 */
export function calculateRenewalDelay(
  expiresAt: string | null | undefined,
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
 * - Desactiva la renovación por temporizador si la URL no tiene expiración (CloudFront).
 * - En URLs prefirmadas de S3 con fecha de vencimiento, programa la renovación proactiva.
 * - Evalúa vigencia al reenfocar la ventana o reconectar la red.
 * - Evita bucles ante fallos de conexión deteniendo el intervalo automático en caso de error.
 */
export function useBranding(options?: UseBrandingOptions) {
  return useQuery<BrandingData>({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: fetchBranding,
    staleTime: 1000 * 60 * 45, // Considerado fresco hasta 45 minutos
    gcTime: 1000 * 60 * 65,
    refetchInterval: (query) => {
      const data = query.state.data;
      const isError = query.state.status === 'error';
      return calculateRenewalDelay(data?.expiresAt, isError);
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: (query) => {
      const data = query.state.data;
      if (!data) return true;
      if (!data.expiresAt) return false;
      const timeLeftMs = new Date(data.expiresAt).getTime() - Date.now();
      // Si faltan menos de 5 minutos o ya venció, renovar al retomar el foco
      return timeLeftMs <= RENEWAL_LEAD_TIME_MS;
    },
    refetchOnReconnect: true,
    retry: 1,
    ...options,
  });
}
