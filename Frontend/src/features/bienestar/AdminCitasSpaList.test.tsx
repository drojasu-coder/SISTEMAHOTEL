import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { AdminCitasSpaPage } from '@/pages/AdminCitasSpaPage';
import type { CitaBienestar, Terapeuta } from './types';

const mockAdminCitas: CitaBienestar[] = [
  {
    id: 201,
    usuario_id: 8,
    servicio_bienestar_id: 1,
    terapeuta_id: 10,
    fecha: '2026-11-20',
    hora_inicio: '10:00:00',
    hora_fin: '11:00:00',
    estado: 'confirmada',
    Usuario: {
      id: 8,
      nombre: 'Elena Gómez',
      email: 'elena@ejemplo.com',
    },
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

const mockTerapeutas: Terapeuta[] = [
  { id: 10, nombre: 'Ana Morales', activo: true },
];

describe('Administración de Citas de Spa (AdminCitasSpaPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (citas = mockAdminCitas) => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('admin'));
      }
      if (urlStr.endsWith('/terapeutas')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockTerapeutas,
          })
        );
      }
      if (urlStr.includes('/citas-spa') && config?.method === 'PATCH') {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: { ...citas[0], estado: 'completada' },
          })
        );
      }
      if (urlStr.endsWith('/citas-spa')) {
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

  it('permite a un administrador ver las citas, información del huésped y abrir el modal de estado', async () => {
    tokenStorage.set('valid-admin-token');
    setupFetchMock();
    const user = userEvent.setup();
    renderWithProviders(<AdminCitasSpaPage />);

    expect(await screen.findByText('Masaje Relajante')).toBeInTheDocument();
    expect(screen.getByText('Elena Gómez')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Morales').length).toBeGreaterThan(0);
    expect(screen.getByText('Cita #201')).toBeInTheDocument();

    // Abrir modal de cambio de estado
    const cambiarEstadoBtn = screen.getByRole('button', { name: /Cambiar estado/i });
    await user.click(cambiarEstadoBtn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nuevo estado/i)).toBeInTheDocument();

    // Seleccionar completada y guardar
    await user.selectOptions(screen.getByLabelText(/Nuevo estado/i), 'completada');
    const guardarBtn = screen.getByRole('button', { name: /Guardar/i });
    await user.click(guardarBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
