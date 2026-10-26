import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Brand } from '@/components/shared/Brand';
import { es } from '@/i18n/es';
import * as mediaApi from './api/mediaApi';

const mockBrandingData: mediaApi.BrandingData = {
  logoHorizontalColor: 'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-color.svg?X-Amz-Signature=test1',
  logoHorizontalBlanco: 'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-blanco.svg?X-Amz-Signature=test2',
  isotipoColor: 'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-isotipo-color.svg?X-Amz-Signature=test3',
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
};

function renderWithClient(ui: React.ReactElement, client?: QueryClient) {
  const queryClient = client ?? new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>,
    ),
    queryClient,
  };
}

describe('Brand Component & S3 Dynamic Media', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el fallback de texto estilizado mientras carga', () => {
    vi.spyOn(mediaApi, 'fetchBranding').mockImplementation(() => new Promise(() => {}));

    renderWithClient(<Brand />);

    expect(screen.getByText(es.marca.nombre)).toBeInTheDocument();
    expect(screen.getByText(es.marca.pais)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renderiza la imagen del logo principal cuando el endpoint responde exitosamente', async () => {
    vi.spyOn(mediaApi, 'fetchBranding').mockResolvedValue(mockBrandingData);

    renderWithClient(<Brand />);

    await waitFor(() => {
      const img = screen.getByRole('img', { name: new RegExp(es.marca.nombre, 'i') });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockBrandingData.logoHorizontalColor);
    });
  });

  it('renderiza la variante blanca para fondos oscuros (inverse)', async () => {
    vi.spyOn(mediaApi, 'fetchBranding').mockResolvedValue(mockBrandingData);

    renderWithClient(<Brand inverse />);

    await waitFor(() => {
      const img = screen.getByRole('img', { name: new RegExp(es.marca.nombre, 'i') });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockBrandingData.logoHorizontalBlanco);
    });
  });

  it('renderiza la variante compacta (isotipoColor) cuando variant="compact"', async () => {
    vi.spyOn(mediaApi, 'fetchBranding').mockResolvedValue(mockBrandingData);

    renderWithClient(<Brand variant="compact" />);

    await waitFor(() => {
      const img = screen.getByRole('img', { name: new RegExp(es.marca.nombre, 'i') });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockBrandingData.isotipoColor);
    });
  });

  it('revierte al fallback tipográfico si la carga de la imagen falla (onError)', async () => {
    vi.spyOn(mediaApi, 'fetchBranding').mockResolvedValue(mockBrandingData);

    renderWithClient(<Brand />);

    const img = await screen.findByRole('img', { name: new RegExp(es.marca.nombre, 'i') });
    expect(img).toBeInTheDocument();

    // Simula fallo al descargar o decodificar imagen en el navegador
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText(es.marca.nombre)).toBeInTheDocument();
      expect(screen.getByText(es.marca.pais)).toBeInTheDocument();
    });
  });

  it('se recupera del error de imagen cuando llega una nueva URL renovada', async () => {
    const fetchSpy = vi.spyOn(mediaApi, 'fetchBranding').mockResolvedValue(mockBrandingData);

    const { queryClient } = renderWithClient(<Brand />);

    const img = await screen.findByRole('img', { name: new RegExp(es.marca.nombre, 'i') });
    expect(img).toBeInTheDocument();

    // Simula que la primera URL falló (ej. expiración)
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText(es.marca.nombre)).toBeInTheDocument();
    });

    // Nueva URL renovada tras refetch
    const renewedData: mediaApi.BrandingData = {
      ...mockBrandingData,
      logoHorizontalColor: 'https://hotel-hunahpu-media-2026.s3.us-east-2.amazonaws.com/branding/logos/hotel-hunahpu-logo-horizontal-color.svg?X-Amz-Signature=renewed-v2',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
    fetchSpy.mockResolvedValue(renewedData);

    // Provocar refetch de TanStack Query
    queryClient.setQueryData(['media', 'branding'], renewedData);

    // Debe recuperarse y renderizar la nueva imagen sin quedarse permanentemente en fallback
    await waitFor(() => {
      const recoveredImg = screen.getByRole('img', { name: new RegExp(es.marca.nombre, 'i') });
      expect(recoveredImg).toBeInTheDocument();
      expect(recoveredImg).toHaveAttribute('src', renewedData.logoHorizontalColor);
    });
  });

  it('mantiene el fallback de texto de forma segura si la API responde con error', async () => {
    vi.spyOn(mediaApi, 'fetchBranding').mockRejectedValue(new Error('Network error'));

    renderWithClient(<Brand />);

    await waitFor(() => {
      expect(screen.getByText(es.marca.nombre)).toBeInTheDocument();
      expect(screen.getByText(es.marca.pais)).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });
});
