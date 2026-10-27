import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { MisReservasActividadesPage } from '@/pages/MisReservasActividadesPage';
import { DetalleReservaActividadPage } from '@/pages/DetalleReservaActividadPage';
import type { ReservaActividad } from './types';

const mockReservasCliente: ReservaActividad[] = [
  {
    id: 501,
    usuario_id: 3,
    recurso_id: 101,
    instructor_id: 5,
    fecha: '2027-12-15',
    hora_inicio: '09:00:00',
    hora_fin: '10:30:00',
    con_equipo: true,
    total: '120.00',
    estado: 'confirmada',
    RecursoActividad: {
      id: 101,
      sucursal_id: 1,
      tipo: 'tenis',
      nombre: 'Cancha de Tenis Central',
      precio_hora: 75.0,
      Sucursal: { id: 1, nombre: 'Hotel Hunapú Antigua' },
    },
    Instructor: {
      id: 5,
      nombre: 'Carlos Méndez',
      especialidad: 'Tenis',
      activo: true,
    },
  },
];

describe('Mis Reservas de Actividades (Cliente)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (reservaDetail?: ReservaActividad) => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('cliente'));
      }
      if (urlStr.endsWith('/reservas-actividad/mis-reservas')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockReservasCliente,
          })
        );
      }
      const singleMatch = urlStr.match(/\/reservas-actividad\/mis-reservas\/(\d+)$/);
      if (singleMatch) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: reservaDetail || mockReservasCliente[0],
          })
        );
      }
      if (urlStr.endsWith('/carritos/activo')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: { id: 88, usuario_id: 3, estado: 'activo' },
          })
        );
      }
      return Promise.reject(new Error(`Unhandled mock fetch url: ${urlStr}`));
    });
  };

  it('1. Muestra el listado de actividades del cliente con fecha, horario y monto GTQ', async () => {
    tokenStorage.set('cliente-token');
    setupFetchMock();
    renderWithProviders(<MisReservasActividadesPage />);

    expect(await screen.findByText('Cancha de Tenis Central')).toBeInTheDocument();
    expect(screen.getByText(/2027-12-15/i)).toBeInTheDocument();
    expect(screen.getByText(/09:00 - 10:30/i)).toBeInTheDocument();
    expect(screen.getByText('Q120.00')).toBeInTheDocument();
    expect(screen.getByText(/Carlos Méndez/i)).toBeInTheDocument();
  });

  it('2. Presenta botón de añadir al carrito para reservas confirmadas', async () => {
    tokenStorage.set('cliente-token');
    setupFetchMock();
    renderWithProviders(<MisReservasActividadesPage />);

    expect(await screen.findByText('Cancha de Tenis Central')).toBeInTheDocument();
    const btnCarrito = screen.getByRole('button', { name: /Añadir al carrito/i });
    expect(btnCarrito).toBeInTheDocument();
  });

  it('3. Muestra el detalle accesible por URL directa con toda la información', async () => {
    tokenStorage.set('cliente-token');
    setupFetchMock();
    renderWithProviders(
      <Routes>
        <Route
          path="/mis-reservas/actividades/:id"
          element={<DetalleReservaActividadPage />}
        />
      </Routes>,
      { route: '/mis-reservas/actividades/501' }
    );

    expect(await screen.findByText(/Reserva de actividad #501/i)).toBeInTheDocument();
    expect(screen.getByText('Cancha de Tenis Central')).toBeInTheDocument();
    expect(screen.getByText('Q120.00')).toBeInTheDocument();
    expect(screen.getByText(/Hotel Hunapú Antigua/i)).toBeInTheDocument();
  });
});
