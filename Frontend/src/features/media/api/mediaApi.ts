import { httpClient } from '@/api/client/http';

export interface BrandingData {
  logoHorizontalColor: string;
  logoHorizontalBlanco: string;
  isotipoColor: string;
  expiresAt: string;
}

export interface BrandingResponse {
  status: 'success';
  data: BrandingData;
}

/**
 * Consulta las URLs prefirmadas de lectura para la identidad visual desde el backend.
 * Se realiza como solicitud anónima (token: null) ya que los logos son de consulta pública.
 */
export async function fetchBranding(): Promise<BrandingData> {
  const response = await httpClient<BrandingResponse>('/media/branding', {
    token: null,
  });
  return response.data;
}
