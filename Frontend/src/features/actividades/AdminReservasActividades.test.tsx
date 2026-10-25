import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { AdminReservasActividadesPage } from '@/pages/AdminReservasActividadesPage';
import { AdminDetalleReservaActividadPage } from '@/pages/AdminDetalleReservaActividadPage';
import type { ReservaActividad, RecursoActividad } from './types';
import type { Sucursal } from '@/features/sedes/types';

const mockSedes: Sucursal[] = [
  {
    id: 1,
    nombre: 'Hotel Hunapú Antigua',
    ciudad: 'Antigua Guatemala',
    direccion: '5ta Avenida Norte #12',
    telefono: '78320011',
    activa: true,
  },
];

const mockRecursos: RecursoActividad[] = [
  {
    id: 101,
    sucursal_id: 1,
    tipo: 'tenis',
    nombre: 'Cancha de Tenis Central',
    precio_hora: 75.0,
    Sucursal: { id: 1, nombre: 'Hotel Hunapú Antigua' },
  },
];

const mockReservasAdmin: ReservaActividad[] = [
  {
    id: 801,
    usuario_id: 10,
    recurso_id: 101,
    instructor_id: null,
    fecha: '2027-11-20',
    hora_inicio: '14:00:00',
    hora_fin: '15:30:00',
    con_equipo: false,
    total: '112.50',
    estado: 'confirmada',
    Usuario: { id: 10, nombre: 'Ana Gómez', email: 'ana@example.com' },
    RecursoActividad: mockRecursos[0],
    Instructor: null,
  },
];

describe('Administración de Reservas de Actividades', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (patchResponse?: any) => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('admin'));
      }
      if (urlStr.endsWith('/sucursales')) {
        return Promise.resolve(jsonResponse({ status: 'success', data: mockSedes }));
      }
      if (urlStr.endsWith('/recursos-actividad')) {
        return Promise.resolve(jsonResponse({ status: 'success', data: mockRecursos }));
      }
      if (urlStr.endsWith('/reservas-actividad') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockReservasAdmin,
          })
        );
      }
      const singleMatch = urlStr.match(/\/reservas-actividad\/(\d+)$/);
      if (singleMatch && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockReservasAdmin[0],
          })
        );
      }
      if (urlStr.includes('/reservas-actividad/801/estado') && config?.method === 'PATCH') {
        if (patchResponse) {
          return Promise.resolve(patchResponse);
        }
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: { ...mockReservasAdmin[0], estado: 'completada' },
          })
        );
      }
      return Promise.reject(new Error(`Unhandled mock fetch url: ${urlStr}`));
    });
  };

  it('1. Admin lista todas las reservas con datos del cliente y estado', async () => {
    tokenStorage.set('admin-token');
    setupFetchMock();
    renderWithProviders(<AdminReservasActividadesPage />);

    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Cancha de Tenis Central').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Q112.50')).toBeInTheDocument();
  });

  it('2. Admin completa una reserva y actualiza su estado', async () => {
    tokenStorage.set('admin-token');
    setupFetchMock();
    const user = userEvent.setup();
    renderWithProviders(<AdminReservasActividadesPage />);

    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument();

    const btnCompletar = screen.getByRole('button', { name: /Completar/i });
    await user.click(btnCompletar);

    // Modal de confirmación
    expect(screen.getByText(/Confirmar cambio de estado/i)).toBeInTheDocument();
    const btnConfirmarModal = screen.getByRole('button', { name: /Confirmar/i });
    await user.click(btnConfirmarModal);

    await waitFor(() => {
      expect(screen.queryByText(/Confirmar cambio de estado/i)).not.toBeInTheDocument();
    });
  });

  it('3. Muestra error del servidor si la actividad todavía no ha finalizado (409 RESERVATION_NOT_FINISHED)', async () => {
    tokenStorage.set('admin-token');
    setupFetchMock(
      errorResponse(409, 'RESERVATION_NOT_FINISHED', 'La actividad todavía no ha finalizado')
    );
    const user = userEvent.setup();
    renderWithProviders(<AdminReservasActividadesPage />);

    expect(await screen.findByText('Ana Gómez')).toBeInTheDocument();

    const btnCompletar = screen.getByRole('button', { name: /Completar/i });
    await user.click(btnCompletar);

    const btnConfirmarModal = screen.getByRole('button', { name: /Confirmar/i });
    await user.click(btnConfirmarModal);

    await waitFor(() => {
      expect(
        screen.getByText(/No es posible completar la actividad porque aún no ha finalizado su horario programado/i)
      ).toBeInTheDocument();
    });
  });

  it('4. Admin consulta el detalle por URL directa', async () => {
    tokenStorage.set('admin-token');
    setupFetchMock();
    renderWithProviders(
      <Routes>
        <Route
          path="/admin/reservas-actividades/:id"
          element={<AdminDetalleReservaActividadPage />}
        />
      </Routes>,
      { route: '/admin/reservas-actividades/801' }
    );

    expect(await screen.findByText(/Detalle de Reserva #801/i)).toBeInTheDocument();
    expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    expect(screen.getByText('Cancha de Tenis Central')).toBeInTheDocument();
  });
});
