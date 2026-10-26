import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSedesQuery,
  calculateSedesRenewalDelay,
  RENEWAL_LEAD_TIME_MS,
} from './useSedes';
import { sedesApi } from '../api/sedesApi';
import type { Sucursal } from '../types';

const mockSedesWithImages: Sucursal[] = [
  {
    id: 1,
    nombre: 'Sede Central',
    ciudad: 'Guatemala',
    direccion: 'Zona 10',
    telefono: '12345678',
    activa: true,
    imagen_key: null,
    imagen_url: null,
    imagen_expires_at: null,
  },
  {
    id: 2,
    nombre: 'Hotel Hunahpú Atitlán',
    ciudad: 'Sololá',
    direccion: 'Panajachel',
    telefono: '87654321',
    activa: true,
    imagen_key: 'sedes/2/portada_1792961997929_90ce1baa6953.webp',
    imagen_url: 'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/sedes/2/portada.webp?X-Amz-Expires=3600',
    imagen_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    imagen_creditos: 'Chad Davis (CC BY 2.0)',
  },
];

describe('useSedes Hook & Proactive Expiration Renewal (controlled clock)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateSedesRenewalDelay', () => {
    const fixedNow = 1700000000000;

    it('verifica la constante RENEWAL_LEAD_TIME_MS en 5 minutos', () => {
      expect(RENEWAL_LEAD_TIME_MS).toBe(5 * 60 * 1000);
    });

    it('calcula la renovación 5 minutos antes de la expiración más temprana (+60 min -> 55 min)', () => {
      const sedes: Sucursal[] = [
        {
          ...mockSedesWithImages[0],
        },
        {
          ...mockSedesWithImages[1],
          imagen_expires_at: new Date(fixedNow + 60 * 60 * 1000).toISOString(),
        },
      ];

      const delay = calculateSedesRenewalDelay(sedes, false, fixedNow);
      expect(delay).toBe(55 * 60 * 1000);
    });

    it('toma la expiración más corta cuando existen múltiples sedes con imágenes', () => {
      const sedes: Sucursal[] = [
        {
          ...mockSedesWithImages[1],
          id: 2,
          imagen_expires_at: new Date(fixedNow + 40 * 60 * 1000).toISOString(), // 40 min
        },
        {
          ...mockSedesWithImages[1],
          id: 3,
          imagen_expires_at: new Date(fixedNow + 20 * 60 * 1000).toISOString(), // 20 min -> más temprana
        },
      ];

      const delay = calculateSedesRenewalDelay(sedes, false, fixedNow);
      // 20 min - 5 min lead time = 15 minutos
      expect(delay).toBe(15 * 60 * 1000);
    });

    it('programa reintento en 10 segundos si restan menos de 5 minutos para expirar', () => {
      const sedes: Sucursal[] = [
        {
          ...mockSedesWithImages[1],
          imagen_expires_at: new Date(fixedNow + 2 * 60 * 1000).toISOString(), // 2 min
        },
      ];

      const delay = calculateSedesRenewalDelay(sedes, false, fixedNow);
      expect(delay).toBe(10 * 1000);
    });

    it('programa reintento en 5 segundos si el enlace ya expiró en el pasado', () => {
      const sedes: Sucursal[] = [
        {
          ...mockSedesWithImages[1],
          imagen_expires_at: new Date(fixedNow - 30 * 1000).toISOString(), // vencido hace 30s
        },
      ];

      const delay = calculateSedesRenewalDelay(sedes, false, fixedNow);
      expect(delay).toBe(5 * 1000);
    });

    it('retorna false si no hay sedes con imágenes o si ocurrió un error de API', () => {
      expect(calculateSedesRenewalDelay([], false, fixedNow)).toBe(false);
      expect(calculateSedesRenewalDelay(undefined, false, fixedNow)).toBe(false);
      expect(calculateSedesRenewalDelay(mockSedesWithImages, true, fixedNow)).toBe(false);
    });
  });

  describe('useSedesQuery con reloj controlado (permanencia hasta el vencimiento)', () => {
    it('renueva automáticamente las URLs antes del vencimiento mientras el usuario permanece en la página', async () => {
      const startTime = 1700000000000;
      vi.useFakeTimers();
      vi.setSystemTime(startTime);

      const firstSedes: Sucursal[] = [
        {
          ...mockSedesWithImages[1],
          imagen_url: 'https://s3.example.com/portada_v1.webp?token=v1',
          imagen_expires_at: new Date(startTime + 60 * 60 * 1000).toISOString(),
        },
      ];

      const renewedSedes: Sucursal[] = [
        {
          ...mockSedesWithImages[1],
          imagen_url: 'https://s3.example.com/portada_v2_renewed.webp?token=v2',
          imagen_expires_at: new Date(startTime + 120 * 60 * 1000).toISOString(),
        },
      ];

      const getAllSpy = vi.spyOn(sedesApi, 'getAll')
        .mockResolvedValueOnce(firstSedes)
        .mockResolvedValueOnce(renewedSedes);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useSedesQuery({ retry: false }), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.[0].imagen_url).toContain('token=v1');
      expect(getAllSpy).toHaveBeenCalledTimes(1);

      // El usuario permanece en la página activa durante 55 minutos (3300 segundos = lead time de 5 min antes de vencer)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(55 * 60 * 1000);
      });

      // El temporizador de refetchInterval se disparó de forma proactiva
      expect(getAllSpy).toHaveBeenCalledTimes(2);
      expect(result.current.data?.[0].imagen_url).toContain('portada_v2_renewed');
    });
  });
});
