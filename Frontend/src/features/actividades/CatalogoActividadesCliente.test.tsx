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
import { CatalogoActividadesPage } from '@/pages/CatalogoActividadesPage';
import type { RecursoActividad, Instructor } from './types';
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
  {
    id: 2,
    nombre: 'Hotel Hunapú Atitlán',
    ciudad: 'Panajachel',
    direccion: 'Calle Santander',
    telefono: '77620022',
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
    precio_equipo: 15.0,
    precio_instructor_hora: 40.0,
    Sucursal: { id: 1, nombre: 'Hotel Hunapú Antigua' },
  },
  {
    id: 102,
    sucursal_id: 2,
    tipo: 'kayak',
    nombre: 'Kayaks de Lago',
    precio_hora: 50.0,
    precio_equipo: 10.0,
    precio_instructor_hora: 0.0,
    Sucursal: { id: 2, nombre: 'Hotel Hunapú Atitlán' },
  },
];

const mockInstructores: Instructor[] = [
  {
    id: 5,
    nombre: 'Carlos Méndez',
    especialidad: 'Tenis',
    activo: true,
  },
];

describe('Catálogo de Actividades para Clientes (CatalogoActividadesPage)', () => {
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
      if (urlStr.endsWith('/sucursales')) {
        return Promise.resolve(jsonResponse({ status: 'success', data: mockSedes }));
      }
      if (urlStr.endsWith('/recursos-actividad') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockRecursos,
          })
        );
      }
      if (urlStr.endsWith('/instructores') && (!config || config.method === 'GET')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockInstructores,
          })
        );
      }
      if (urlStr.endsWith('/reservas-actividad') && config?.method === 'POST') {
        if (postResponse) {
          return Promise.resolve(postResponse);
        }
        return Promise.resolve(
          jsonResponse(
            {
              status: 'success',
              data: {
                id: 301,
                usuario_id: 3,
                recurso_id: 101,
                instructor_id: 5,
                fecha: '2027-12-01',
                hora_inicio: '10:00:00',
                hora_fin: '11:00:00',
                con_equipo: true,
                total: '130.00',
                estado: 'confirmada',
                RecursoActividad: mockRecursos[0],
                Instructor: mockInstructores[0],
              },
            },
            201
          )
        );
      }
      return Promise.reject(new Error(`Unhandled mock fetch url: ${urlStr}`));
    });
  };

  it('1. Renderiza el catálogo público con actividades y tarifas formateadas en GTQ', async () => {
    setupFetchMock();
    renderWithProviders(<CatalogoActividadesPage />);

    expect(await screen.findByText('Cancha de Tenis Central')).toBeInTheDocument();
    expect(screen.getByText('Kayaks de Lago')).toBeInTheDocument();
    expect(screen.getByText('Q75.00')).toBeInTheDocument();
    expect(screen.getByText('Q50.00')).toBeInTheDocument();
  });

  it('2. Filtra actividades por término de búsqueda', async () => {
    setupFetchMock();
    const user = userEvent.setup();
    renderWithProviders(<CatalogoActividadesPage />);

    expect(await screen.findByText('Cancha de Tenis Central')).toBeInTheDocument();

    const inputBusqueda = screen.getByPlaceholderText(/Buscar actividad/i);
    await user.type(inputBusqueda, 'Kayak');

    expect(screen.getByText('Kayaks de Lago')).toBeInTheDocument();
    expect(screen.queryByText('Cancha de Tenis Central')).not.toBeInTheDocument();
  });

  it('3. Abre el modal de reserva y permite a un cliente reservar con éxito', async () => {
    tokenStorage.set('cliente-token');
    setupFetchMock('cliente');
    const user = userEvent.setup();
    renderWithProviders(<CatalogoActividadesPage />);

    expect(await screen.findByText('Cancha de Tenis Central')).toBeInTheDocument();

    const botonesReservar = screen.getAllByRole('button', { name: /Reservar actividad/i });
    await user.click(botonesReservar[0]);

    // Modal abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha de la actividad/i)).toBeInTheDocument();

    // Seleccionar instructor
    const selectInstructor = screen.getByLabelText(/Instructor/i);
    await user.selectOptions(selectInstructor, '5');

    // Marcar equipamiento
    const checkEquipo = screen.getByLabelText(/Requerir equipamiento/i);
    await user.click(checkEquipo);

    // Confirmar reserva
    const botonConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    await user.click(botonConfirmar);

    // Éxito
    await waitFor(() => {
      expect(screen.getByText(/¡Reserva confirmada exitosamente!/i)).toBeInTheDocument();
      expect(screen.getByText(/#301/i)).toBeInTheDocument();
      expect(screen.getByText(/Q130.00/i)).toBeInTheDocument();
    });
  });

  it('4. Maneja error 409 de traslape de recurso del servidor sin romper la interfaz', async () => {
    tokenStorage.set('cliente-token');
    setupFetchMock(
      'cliente',
      errorResponse(
        409,
        'RESOURCE_OVERLAP',
        'El recurso ya está ocupado en ese horario. Por favor elija otro horario.'
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<CatalogoActividadesPage />);

    expect(await screen.findByText('Cancha de Tenis Central')).toBeInTheDocument();

    const botonesReservar = screen.getAllByRole('button', { name: /Reservar actividad/i });
    await user.click(botonesReservar[0]);

    const botonConfirmar = screen.getByRole('button', { name: /Confirmar reserva/i });
    await user.click(botonConfirmar);

    await waitFor(() => {
      expect(
        screen.getByText(/La instalación seleccionada ya se encuentra ocupada en ese horario/i)
      ).toBeInTheDocument();
    });
  });
});
