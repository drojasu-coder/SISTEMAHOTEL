import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * Mock global por defecto para mediaApi.fetchBranding.
 * Evita que la consulta automática de logos desde el Navbar/Footer intercepte o consuma
 * llamadas a global.fetch en pruebas de integración de otros módulos (como Auth o Formularios).
 * En Brand.test.tsx y useBranding.test.tsx se puede sobreescribir con vi.spyOn para pruebas controladas.
 */
vi.mock('@/features/media/api/mediaApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/media/api/mediaApi')>();
  return {
    ...actual,
    fetchBranding: vi.fn().mockResolvedValue({
      logoHorizontalColor:
        'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-color.svg?mock',
      logoHorizontalBlanco:
        'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg?mock',
      isotipoColor:
        'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-isotipo-color.svg?mock',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    }),
  };
});

// Idioma determinista de la suite; los casos bilingües establecen su navegador explícitamente.
Object.defineProperty(window.navigator, 'language', { configurable: true, value: 'es-GT' });
