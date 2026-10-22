/**
 * Referencias centralizadas de medios de marca.
 *
 * Las imágenes y logos definitivos se servirán desde AWS S3 (el backend autoriza las
 * cargas con URLs prefirmadas). Mientras esa integración no exista, no se incluyen
 * archivos locales: los componentes muestran la marca en texto.
 * No guardar aquí URLs firmadas temporales.
 */
export interface BrandMedia {
  logoHorizontalColor: string | null;
  logoHorizontalBlanco: string | null;
  isotipoColor: string | null;
}

const cleanUrl = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const brandMedia: BrandMedia = {
  logoHorizontalColor: cleanUrl(import.meta.env.VITE_BRAND_LOGO_HORIZONTAL_COLOR),
  logoHorizontalBlanco: cleanUrl(import.meta.env.VITE_BRAND_LOGO_HORIZONTAL_BLANCO),
  isotipoColor: cleanUrl(import.meta.env.VITE_BRAND_ISOTIPO_COLOR),
};
