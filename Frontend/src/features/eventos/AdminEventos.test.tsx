import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { AdminSalonesPage } from '@/pages/AdminSalonesPage';
import { AdminReservasEventosPage } from '@/pages/AdminReservasEventosPage';
import type { Salon, ReservaEvento } from './types';

const mockSalones: Salon[] = [
  {
    id: 1,
    sucursal_id: 1,
    nombre: 'Gran Salón Hunahpú',
    capacidad_maxima: 250,
    tarifa_base: 4500,
    descripcion: 'Salón principal para eventos ejecutivos.',
  },
];

const mockReservasAdmin: ReservaEvento[] = [
  {
    id: 88,
    usuario_id: 5,
    salon_id: 1,
    tipo_evento: 'ejecutivo',
    fecha: '2026-12-15',
    hora_inicio: '18:00:00',
    hora_fin: '23:00:00',
    numero_invitados: 200,
    total: 8000,
    anticipo: 4000,
    estado: 'cotizacion',
    Salon: {
      id: 1,
      nombre: 'Gran Salón Hunahpú',
      capacidad_maxima: 250,
      tarifa_base: 4500,
    },
    Usuario: {
      id: 5,
      nombre: 'Carlos López',
      email: 'carlos@empresa.com',
    },
  },
];

describe('Administración de Eventos', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  it('permite a un admin ver la lista de salones para gestión', async () => {
    tokenStorage.set('admin-token');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('admin'));
      }
      if (urlStr.endsWith('/salones')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockSalones,
          }),
        );
      }
      return Promise.resolve(jsonResponse({ status: 'success', data: [] }));
    });

    renderWithProviders(<AdminSalonesPage />);

    expect(await screen.findByText('Gran Salón Hunahpú')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo salón/i })).toBeInTheDocument();
  });

  it('permite a un admin visualizar las solicitudes de eventos con datos del cliente y estado', async () => {
    tokenStorage.set('admin-token');
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('admin'));
      }
      if (urlStr.includes('/reservas-evento')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockReservasAdmin,
          }),
        );
      }
      return Promise.resolve(jsonResponse({ status: 'success', data: [] }));
    });

    renderWithProviders(<AdminReservasEventosPage />);

    expect(await screen.findByText('Gran Salón Hunahpú')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
    expect(screen.getAllByText('Cotización').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^estado$/i })).toBeInTheDocument();
  });
});
