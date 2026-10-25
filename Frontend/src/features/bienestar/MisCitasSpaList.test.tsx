import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { MisReservasBienestarPage } from '@/pages/MisReservasBienestarPage';
import type { CitaBienestar } from './types';

const mockCitas: CitaBienestar[] = [
  {
    id: 101,
    usuario_id: 3,
    servicio_bienestar_id: 1,
    terapeuta_id: 10,
    fecha: '2026-11-20',
    hora_inicio: '10:00:00',
    hora_fin: '11:00:00',
    estado: 'confirmada',
    ServicioBienestar: {
      id: 1,
      nombre: 'Masaje Relajante',
      duracion_minutos: 60,
      precio: 350,
    },
    Terapeuta: {
      id: 10,
      nombre: 'Ana Morales',
      activo: true,
    },
  },
];

describe('Mis Citas de Spa (MisReservasBienestarPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (citas = mockCitas) => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('cliente'));
      }
      if (urlStr.includes('/citas-spa/mis-reservas')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: citas,
          })
        );
      }
      return Promise.resolve(jsonResponse({ status: 'success', data: [] }));
    });
  };

  it('muestra las citas de bienestar reservadas del cliente con su terapeuta y botón de añadir al carrito', async () => {
    tokenStorage.set('valid-token');
    setupFetchMock();
    renderWithProviders(<MisReservasBienestarPage />);

    expect(await screen.findByText('Masaje Relajante')).toBeInTheDocument();
    expect(screen.getByText('Cita #101')).toBeInTheDocument();
    expect(screen.getByText('Ana Morales')).toBeInTheDocument();
    expect(screen.getByText('2026-11-20')).toBeInTheDocument();
    expect(screen.getByText('Q350.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Añadir al carrito/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver detalle completo/i })).toBeInTheDocument();
  });

  it('muestra estado vacío si el cliente no tiene citas registradas', async () => {
    tokenStorage.set('valid-token');
    setupFetchMock([]);
    renderWithProviders(<MisReservasBienestarPage />);

    expect(await screen.findByText('No tiene citas de spa reservadas')).toBeInTheDocument();
    expect(screen.getByText('Explorar catálogo de bienestar')).toBeInTheDocument();
  });
});
