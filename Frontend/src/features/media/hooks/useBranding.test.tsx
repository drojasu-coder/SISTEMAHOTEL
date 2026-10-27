import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useBranding,
  calculateRenewalDelay,
} from './useBranding';
import * as mediaApi from '../api/mediaApi';

const mockBrandingData: mediaApi.BrandingData = {
  logoHorizontalColor: 'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-color.svg?X-Amz-Signature=test1',
  logoHorizontalBlanco: 'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg?X-Amz-Signature=test2',
  isotipoColor: 'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-isotipo-color.svg?X-Amz-Signature=test3',
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useBranding Hook & Renewal Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateRenewalDelay (Tiempo controlado)', () => {
    const fixedNow = 1700000000000;

    it('calcula la renovación exactamente 5 minutos antes de la expiración estándar (1 hora)', () => {
      const expiresAt = new Date(fixedNow + 60 * 60 * 1000).toISOString(); // +60 min
      const delay = calculateRenewalDelay(expiresAt, false, fixedNow);

      // Debe ser 55 minutos (3300 segundos = 3,300,000 ms)
      expect(delay).toBe(55 * 60 * 1000);
    });

    it('programa reintento en 10 segundos si restan menos de 5 minutos para expirar', () => {
      const expiresAt = new Date(fixedNow + 3 * 60 * 1000).toISOString(); // +3 min
      const delay = calculateRenewalDelay(expiresAt, false, fixedNow);

      expect(delay).toBe(10 * 1000);
    });

    it('programa reintento en 5 segundos si el enlace ya expiró en el pasado', () => {
      const expiresAt = new Date(fixedNow - 10 * 1000).toISOString(); // -10 seg
      const delay = calculateRenewalDelay(expiresAt, false, fixedNow);

      expect(delay).toBe(5 * 1000);
    });

    it('detiene el temporizador (retorna false) ante error de API para evitar bucles', () => {
      const expiresAt = new Date(fixedNow + 60 * 60 * 1000).toISOString();
      const delay = calculateRenewalDelay(expiresAt, true, fixedNow);

      expect(delay).toBe(false);
    });

    it('retorna false si no se proporciona expiresAt, es null (CloudFront) o la fecha es inválida', () => {
      expect(calculateRenewalDelay(undefined, false, fixedNow)).toBe(false);
      expect(calculateRenewalDelay(null, false, fixedNow)).toBe(false);
      expect(calculateRenewalDelay('invalid-date', false, fixedNow)).toBe(false);
    });
  });

  describe('useBranding lifecycle & React Query integration', () => {
    it('obtiene los datos de branding y los comparte en caché', async () => {
      vi.spyOn(mediaApi, 'fetchBranding').mockResolvedValue(mockBrandingData);

      const { result } = renderHook(() => useBranding(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.logoHorizontalColor).toBe(
        mockBrandingData.logoHorizontalColor,
      );
      expect(result.current.data?.logoHorizontalBlanco).toBe(
        mockBrandingData.logoHorizontalBlanco,
      );
      expect(result.current.data?.isotipoColor).toBe(
        mockBrandingData.isotipoColor,
      );
    });

    it('maneja errores de red sin lanzar excepciones no controladas', async () => {
      vi.spyOn(mediaApi, 'fetchBranding').mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBranding({ retry: false }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
    });

    it('permite reintentar y recuperarse tras un error inicial cuando se reactiva el servicio', async () => {
      const fetchSpy = vi.spyOn(mediaApi, 'fetchBranding')
        .mockRejectedValueOnce(new Error('Temporarily unavailable'))
        .mockResolvedValueOnce(mockBrandingData);

      const { result } = renderHook(() => useBranding({ retry: false }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Se ejecuta reintento manual
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data?.logoHorizontalColor).toBe(mockBrandingData.logoHorizontalColor);
      });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
