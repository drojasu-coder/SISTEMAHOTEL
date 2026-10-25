import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, jsonResponse, meResponse } from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { AdminRecursosActividadPage } from '@/pages/AdminRecursosActividadPage';
import type { RecursoActividad } from './types';

const mockSedes = [
  { id: 1, nombre: 'Hotel Hunapú Antigua', activo: true },
  { id: 2, nombre: 'Hotel Hunapú Atitlán', activo: true },
];

const mockRecursos: RecursoActividad[] = [
  {
    id: 1,
    sucursal_id: 1,
    tipo: 'tenis',
    nombre: 'Cancha Central 1',
    precio_hora: 100,
    precio_equipo: 25,
    precio_instructor_hora: 50,
    Sucursal: { id: 1, nombre: 'Hotel Hunapú Antigua' },
  },
  {
    id: 2,
    sucursal_id: 2,
    tipo: 'golf',
    nombre: 'Campo de Práctica 1',
    precio_hora: 150,
    precio_equipo: 40,
    precio_instructor_hora: 80,
    Sucursal: { id: 2, nombre: 'Hotel Hunapú Atitlán' },
  },
];

describe('Administración de Recursos de Actividad (AdminRecursosActividadPage)', () => {
  beforeEach(() => {
    tokenStorage.set('token-admin');
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
    window.sessionStorage.clear();
  });

  const setupFetch = () => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);
      const method = config?.method ?? 'GET';

      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('admin'));
      }

      if (urlStr.endsWith('/sucursales')) {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockSedes,
          })
        );
      }

      if (urlStr.endsWith('/recursos-actividad') && method === 'GET') {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockRecursos,
          })
        );
      }

      if (urlStr.endsWith('/recursos-actividad') && method === 'POST') {
        const body = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse(
            {
              status: 'success',
              data: {
                id: 3,
                ...body,
                Sucursal: { id: body.sucursal_id, nombre: 'Hotel Hunapú Antigua' },
              },
            },
            201
          )
        );
      }

      if (urlStr.match(/\/recursos-actividad\/\d+$/) && method === 'PATCH') {
        const body = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: {
              ...mockRecursos[0],
              ...body,
            },
          })
        );
      }

      return Promise.reject(new Error(`Unhandled mock url: ${urlStr}`));
    });
  };

  it('1. Renderiza el listado administrativo con tarifas en GTQ', async () => {
    setupFetch();
    renderWithProviders(<AdminRecursosActividadPage />);

    expect(await screen.findByText('Cancha Central 1')).toBeInTheDocument();
    expect(screen.getByText('Campo de Práctica 1')).toBeInTheDocument();
    expect(screen.getByText('Q100.00 / h')).toBeInTheDocument();
    expect(screen.getByText('Q150.00 / h')).toBeInTheDocument();
  });

  it('2. Filtra recursos por texto', async () => {
    setupFetch();
    const user = userEvent.setup();
    renderWithProviders(<AdminRecursosActividadPage />);

    expect(await screen.findByText('Cancha Central 1')).toBeInTheDocument();

    const inputBusqueda = screen.getByPlaceholderText(/Buscar por nombre o tipo/i);
    await user.type(inputBusqueda, 'Golf');

    expect(screen.getByText('Campo de Práctica 1')).toBeInTheDocument();
    expect(screen.queryByText('Cancha Central 1')).not.toBeInTheDocument();
  });

  it('3. Abre el modal de creación y registra un nuevo recurso', async () => {
    setupFetch();
    const user = userEvent.setup();
    renderWithProviders(<AdminRecursosActividadPage />);

    expect(await screen.findByText('Cancha Central 1')).toBeInTheDocument();

    const botonNuevo = await screen.findByRole('button', { name: /Nuevo recurso/i });
    await user.click(botonNuevo);

    expect(screen.getByText(/Registrar nueva instalación o recurso/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Ej. tenis, golf/i), 'billar');
    await user.type(screen.getByPlaceholderText(/Ej. Cancha Central 1/i), 'Mesa de Billar 1');

    const botonGuardar = screen.getByRole('button', { name: /Registrar recurso/i });
    await user.click(botonGuardar);

    await waitFor(() => {
      expect(
        screen.getByText(/El recurso de actividad se ha guardado correctamente/i)
      ).toBeInTheDocument();
    });
  });

  it('4. Abre el modal de edición para un recurso existente', async () => {
    setupFetch();
    const user = userEvent.setup();
    renderWithProviders(<AdminRecursosActividadPage />);

    expect(await screen.findByText('Cancha Central 1')).toBeInTheDocument();

    const botonesEditar = screen.getAllByRole('button', { name: /Editar recurso/i });
    await user.click(botonesEditar[0]);

    expect(screen.getByText(/Editar instalación o recurso/i)).toBeInTheDocument();

    const inputNombre = screen.getByDisplayValue('Cancha Central 1');
    await user.clear(inputNombre);
    await user.type(inputNombre, 'Cancha Central Modificada');

    const botonGuardar = screen.getByRole('button', { name: /Guardar cambios/i });
    await user.click(botonGuardar);

    await waitFor(() => {
      expect(
        screen.getByText(/El recurso de actividad se ha guardado correctamente/i)
      ).toBeInTheDocument();
    });
  });
});
