import { httpClient } from '@/api/client/http';
import { uploadEntityImage } from '@/api/mediaUpload';

export interface BrandingData {
  logoHorizontalColor: string;
  logoHorizontalBlanco: string;
  isotipoColor: string;
  expiresAt: string | null;
}

export interface BrandingResponse {
  status: 'success';
  data: BrandingData;
}

export type BrandingVariant = 'logoHorizontalColor' | 'logoHorizontalBlanco' | 'isotipoColor';

/**
 * Consulta las URLs de lectura para la identidad visual desde el backend (CloudFront o S3).
 * Se realiza como solicitud anónima (token: null) ya que los logos son de consulta pública.
 */
export async function fetchBranding(): Promise<BrandingData> {
  const response = await httpClient<BrandingResponse>('/media/branding', {
    token: null,
  });
  return response.data;
}

/**
 * Sube y reemplaza un recurso oficial de identidad visual de HOTEL HUNAHPÚ:
 * - Solicita URL prefirmada PUT al endpoint /media/branding/:variant/presign.
 * - Sube a AWS S3.
 * - Confirma y valida en el servidor (sharp / SVG sanitizer) con /media/branding/:variant/confirmar.
 */
export async function uploadBrandingAsset(
  variant: BrandingVariant,
  file: File,
  onProgress?: (progress: number) => void
): Promise<BrandingData> {
  return uploadEntityImage<BrandingData>(
    {
      presignEndpoint: `/media/branding/${variant}/presign`,
      confirmEndpoint: `/media/branding/${variant}/confirmar`,
      file,
      onProgress,
    }
  );
}
