import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { CatalogoEventosPage } from '@/pages/CatalogoEventosPage';
import type { Salon } from './types';

const mockSalones: Salon[] = [
  {
    id: 1,
    sucursal_id: 1,
    nombre: 'Gran Salón Hunahpú',
    capacidad_maxima: 250,
    tarifa_base: 4500,
    descripcion: 'Salón principal con iluminación y audio.',
    sucursal: {
      id: 1,
      nombre: 'Sede Principal Antigua',
    },
  },
  {
    id: 2,
    sucursal_id: 2,
    nombre: 'Salón Ejecutivo Atitlán',
    capacidad_maxima: 50,
    tarifa_base: 2000,
    descripcion: 'Espacio ideal para conferencias y reuniones.',
    sucursal: {
      id: 2,
      nombre: 'Sede Panajachel',
    },
  },
];

describe('Catálogo de Salones y Eventos (CatalogoEventosPage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (role?: 'cliente' | 'admin') => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        if (!role) {
          return Promise.resolve(errorResponse(401, 'UNAUTHORIZED', 'No autenticado'));
        }
        return Promise.resolve(meResponse(role));
      }
      if (urlStr.endsWith('/salones') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockSalones,
          }),
        );
      }
      if (urlStr.endsWith('/servicios-evento')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: [],
          }),
        );
      }
      return Promise.resolve(errorResponse(404, 'NOT_FOUND', 'Not found'));
    });
  };

  it('renderiza la lista de salones públicos con sus detalles y tarifas', async () => {
    setupFetchMock();
    renderWithProviders(<CatalogoEventosPage />);

    expect(await screen.findByText('Gran Salón Hunahpú')).toBeInTheDocument();
    expect(screen.getByText('Salón Ejecutivo Atitlán')).toBeInTheDocument();
    expect(screen.getByText('Hasta 250 personas')).toBeInTheDocument();
    expect(screen.getByText('Q4,500.00')).toBeInTheDocument();
  });

  it('permite filtrar los salones por nombre', async () => {
    setupFetchMock();
    const user = userEvent.setup();
    renderWithProviders(<CatalogoEventosPage />);

    expect(await screen.findByText('Gran Salón Hunahpú')).toBeInTheDocument();
    const inputBuscar = screen.getByPlaceholderText(/buscar salón/i);
    await user.type(inputBuscar, 'Atitlán');

    expect(screen.queryByText('Gran Salón Hunahpú')).not.toBeInTheDocument();
    expect(screen.getByText('Salón Ejecutivo Atitlán')).toBeInTheDocument();
  });

  it('abre el modal de solicitud de cotización al pulsar Cotizar evento', async () => {
    tokenStorage.set('cliente-token');
    setupFetchMock('cliente');
    const user = userEvent.setup();
    renderWithProviders(<CatalogoEventosPage />);

    expect(await screen.findByText('Gran Salón Hunahpú')).toBeInTheDocument();
    const botonesCotizar = screen.getAllByRole('button', { name: /cotizar evento/i });
    await user.click(botonesCotizar[0]);

    expect(await screen.findByRole('heading', { name: /solicitud de cotización de evento/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de evento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número estimado de invitados/i)).toBeInTheDocument();
  });
});
