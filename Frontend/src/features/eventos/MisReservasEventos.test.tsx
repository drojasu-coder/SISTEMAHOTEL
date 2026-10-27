import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { MisReservasEventosPage } from '@/pages/MisReservasEventosPage';
import type { ReservaEvento } from './types';

const mockReservas: ReservaEvento[] = [
  {
    id: 50,
    usuario_id: 3,
    salon_id: 1,
    tipo_evento: 'ejecutivo',
    fecha: '2026-11-25',
    hora_inicio: '09:00:00',
    hora_fin: '17:00:00',
    numero_invitados: 120,
    total: 6500,
    anticipo: 3250,
    estado: 'cotizacion',
    Salon: {
      id: 1,
      nombre: 'Gran Salón Hunahpú',
      capacidad_maxima: 250,
      tarifa_base: 4500,
      sucursal: {
        id: 1,
        nombre: 'Sede Principal Antigua',
      },
    },
  },
];

describe('Mis Reservas de Eventos (MisReservasEventosPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (reservas = mockReservas) => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('cliente'));
      }
      if (urlStr.includes('/reservas-evento')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: reservas,
          }),
        );
      }
      return Promise.resolve(jsonResponse({ status: 'success', data: [] }));
    });
  };

  it('renderiza la lista de cotizaciones y reservas del cliente con estado y montos', async () => {
    tokenStorage.set('cliente-token');
    setupFetchMock();
    renderWithProviders(<MisReservasEventosPage />);

    expect(await screen.findByText('Gran Salón Hunahpú')).toBeInTheDocument();
    expect(screen.getByText('Cotización')).toBeInTheDocument();
    expect(screen.getByText('Corporativo / Ejecutivo')).toBeInTheDocument();
    expect(screen.getByText(/120 invitados/i)).toBeInTheDocument();
    expect(screen.getByText('Q6,500.00')).toBeInTheDocument();
  });

  it('muestra el estado vacío si el cliente no tiene eventos solicitados', async () => {
    tokenStorage.set('cliente-token');
    setupFetchMock([]);
    renderWithProviders(<MisReservasEventosPage />);

    expect(
      await screen.findByText(/no tiene eventos registrados/i),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /cotizar nuevo evento/i }).length).toBeGreaterThan(0);
  });
});
