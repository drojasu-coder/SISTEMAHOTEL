import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { CatalogoBienestarPage } from '@/pages/CatalogoBienestarPage';
import type { ServicioBienestar, Terapeuta } from './types';

const mockServicios: ServicioBienestar[] = [
  {
    id: 1,
    nombre: 'Masaje Relajante con Aromaterapia',
    duracion_minutos: 60,
    precio: 350,
  },
  {
    id: 2,
    nombre: 'Tratamiento Facial Rejuvenecedor',
    duracion_minutos: 45,
    precio: 280,
  },
];

const mockTerapeutas: Terapeuta[] = [
  {
    id: 10,
    nombre: 'Ana Morales',
    activo: true,
  },
  {
    id: 11,
    nombre: 'Carlos Castillo',
    activo: false,
  },
];

describe('Catálogo de Bienestar y Spa (CatalogoBienestarPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (role?: 'cliente' | 'admin', postResponse?: any) => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        if (!role) {
          return Promise.resolve(errorResponse(401, 'UNAUTHORIZED', 'No autenticado'));
        }
        return Promise.resolve(meResponse(role));
      }
      if (urlStr.endsWith('/servicios-spa') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockServicios,
          })
        );
      }
      if (urlStr.endsWith('/terapeutas') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockTerapeutas,
          })
        );
      }
      if (urlStr.endsWith('/citas-spa') && config?.method === 'POST') {
        if (postResponse) {
          return Promise.resolve(postResponse);
        }
        return Promise.resolve(
          jsonResponse(
            {
              status: 'success',
              data: {
                id: 501,
                usuario_id: 3,
                servicio_bienestar_id: 1,
                terapeuta_id: 10,
                fecha: '2026-11-20',
                hora_inicio: '10:00:00',
                hora_fin: '11:00:00',
                estado: 'confirmada',
                ServicioBienestar: mockServicios[0],
                Terapeuta: mockTerapeutas[0],
              },
            },
            201
          )
        );
      }
      return Promise.resolve(jsonResponse({ status: 'success', data: [] }));
    });
  };

  it('renderiza la lista de servicios con duración y precio formateado en GTQ', async () => {
    setupFetchMock();
    renderWithProviders(<CatalogoBienestarPage />);

    expect(await screen.findByText('Masaje Relajante con Aromaterapia')).toBeInTheDocument();
    expect(screen.getByText('Tratamiento Facial Rejuvenecedor')).toBeInTheDocument();
    expect(screen.getByText('Q350.00')).toBeInTheDocument();
    expect(screen.getByText('Q280.00')).toBeInTheDocument();
    expect(screen.getByText(/60 minutos de sesión/)).toBeInTheDocument();
  });

  it('permite filtrar servicios mediante la barra de búsqueda', async () => {
    setupFetchMock();
    const user = userEvent.setup();
    renderWithProviders(<CatalogoBienestarPage />);

    expect(await screen.findByText('Masaje Relajante con Aromaterapia')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Buscar...');
    await user.type(searchInput, 'Facial');

    expect(screen.queryByText('Masaje Relajante con Aromaterapia')).not.toBeInTheDocument();
    expect(screen.getByText('Tratamiento Facial Rejuvenecedor')).toBeInTheDocument();
  });

  it('abre el modal de reserva y permite al cliente autenticado confirmar su cita', async () => {
    tokenStorage.set('valid-token');
    setupFetchMock('cliente');
    const user = userEvent.setup();
    renderWithProviders(<CatalogoBienestarPage />);

    expect(await screen.findByText('Masaje Relajante con Aromaterapia')).toBeInTheDocument();

    const reservarBtns = screen.getAllByRole('button', { name: /Reservar cita/i });
    await user.click(reservarBtns[0]);

    // Modal abierto
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Reservar Cita de Spa')).toBeInTheDocument();

    // Solo muestra terapeutas activos
    const terapeutaSelect = screen.getByLabelText(/Seleccionar terapeuta/i);
    expect(terapeutaSelect).toBeInTheDocument();
    await user.selectOptions(terapeutaSelect, '10');

    // Confirmar reserva
    const confirmarBtn = screen.getByRole('button', { name: /Confirmar reserva de cita/i });
    await user.click(confirmarBtn);

    // Pantalla de éxito
    await waitFor(() => {
      expect(screen.getByText('¡Cita reservada exitosamente!')).toBeInTheDocument();
    });
    expect(screen.getByText('Cita #501')).toBeInTheDocument();
  });

  it('muestra error de conflicto si el terapeuta está ocupado o en buffer de 15 minutos', async () => {
    tokenStorage.set('valid-token');
    setupFetchMock(
      'cliente',
      errorResponse(
        409,
        'THERAPIST_BUSY_OR_BUFFER',
        'El terapeuta no está disponible en este horario.'
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<CatalogoBienestarPage />);

    expect(await screen.findByText('Masaje Relajante con Aromaterapia')).toBeInTheDocument();

    const reservarBtns = screen.getAllByRole('button', { name: /Reservar cita/i });
    await user.click(reservarBtns[0]);

    const terapeutaSelect = await screen.findByLabelText(/Seleccionar terapeuta/i);
    await user.selectOptions(terapeutaSelect, '10');

    const confirmarBtn = screen.getByRole('button', { name: /Confirmar reserva de cita/i });
    await user.click(confirmarBtn);

    expect(
      await screen.findByText(/Se requiere un tiempo de descanso de 15 minutos entre citas/i)
    ).toBeInTheDocument();
  });
});
