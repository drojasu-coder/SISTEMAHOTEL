/**
 * Referencias centralizadas de medios de marca.
 *
 * Los logos de HOTEL HUNAHPÚ se sirven desde el bucket privado de AWS S3 mediante
 * URLs prefirmadas emitidas por el backend (GET /api/media/branding).
 * Para renderizarlos en la interfaz reactiva, use el hook `useBranding()`.
 *
 * No guardar enlaces temporales como configuración permanente o estática.
 */
export interface BrandMedia {
  logoHorizontalColor: string | null;
  logoHorizontalBlanco: string | null;
  isotipoColor: string | null;
  expiresAt?: string | null;
}

export { useBranding } from '@/features/media/hooks/useBranding';
export { fetchBranding } from '@/features/media/api/mediaApi';
