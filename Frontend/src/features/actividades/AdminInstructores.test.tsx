import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, jsonResponse, errorResponse, meResponse } from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { AdminInstructoresPage } from '@/pages/AdminInstructoresPage';
import type { Instructor } from './types';

const mockInstructores: Instructor[] = [
  { id: 1, nombre: 'Carlos Méndez', especialidad: 'Tenis', activo: true },
  { id: 2, nombre: 'Ana Morales', especialidad: 'Yoga', activo: false },
];

describe('Administración de Instructores (AdminInstructoresPage)', () => {
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

  const setupFetch = (patchCustomHandler?: (url: string, config: any) => Promise<any>) => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);
      const method = config?.method ?? 'GET';

      if (urlStr.endsWith('/auth/me')) {
        return Promise.resolve(meResponse('admin'));
      }

      if (urlStr.endsWith('/instructores') && method === 'GET') {
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: mockInstructores,
          })
        );
      }

      if (urlStr.endsWith('/instructores') && method === 'POST') {
        const body = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse(
            {
              status: 'success',
              data: {
                id: 3,
                ...body,
              },
            },
            201
          )
        );
      }

      if (urlStr.match(/\/instructores\/\d+$/) && method === 'PATCH') {
        if (patchCustomHandler) {
          return patchCustomHandler(urlStr, config);
        }
        const body = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse({
            status: 'success',
            data: {
              ...mockInstructores[0],
              ...body,
            },
          })
        );
      }

      return Promise.reject(new Error(`Unhandled mock url: ${urlStr}`));
    });
  };

  it('1. Renderiza el listado de instructores con sus estados y especialidades', async () => {
    setupFetch();
    renderWithProviders(<AdminInstructoresPage />);

    expect(await screen.findByText('Carlos Méndez')).toBeInTheDocument();
    expect(screen.getByText('Ana Morales')).toBeInTheDocument();
    expect(screen.getByText('Especialidad: Tenis')).toBeInTheDocument();
    expect(screen.getByText('Especialidad: Yoga')).toBeInTheDocument();
  });

  it('2. Permite activar o desactivar un instructor sin conflictos', async () => {
    setupFetch();
    const user = userEvent.setup();
    renderWithProviders(<AdminInstructoresPage />);

    expect(await screen.findByText('Carlos Méndez')).toBeInTheDocument();

    const botonDesactivar = screen.getByRole('button', { name: /Desactivar/i });
    await user.click(botonDesactivar);

    await waitFor(() => {
      expect(
        screen.getByText(/ha sido desactivado/i)
      ).toBeInTheDocument();
    });
  });

  it('3. Muestra error de conflicto 409 si el instructor tiene reservas futuras confirmadas', async () => {
    setupFetch(() =>
      Promise.resolve(
        errorResponse(
          409,
          'INSTRUCTOR_HAS_FUTURE_RESERVATIONS',
          'El instructor tiene reservas futuras confirmadas y no puede desactivarse'
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(<AdminInstructoresPage />);

    expect(await screen.findByText('Carlos Méndez')).toBeInTheDocument();

    const botonDesactivar = screen.getByRole('button', { name: /Desactivar/i });
    await user.click(botonDesactivar);

    await waitFor(() => {
      expect(
        screen.getByText(/El instructor tiene reservas futuras confirmadas y no puede desactivarse/i)
      ).toBeInTheDocument();
    });
  });

  it('4. Abre el modal de creación y registra un nuevo instructor', async () => {
    setupFetch();
    const user = userEvent.setup();
    renderWithProviders(<AdminInstructoresPage />);

    expect(await screen.findByText('Carlos Méndez')).toBeInTheDocument();

    const botonNuevo = await screen.findByRole('button', { name: /Nuevo instructor/i });
    await user.click(botonNuevo);

    expect(screen.getByText(/Registrar nuevo instructor/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Ej. Carlos Méndez/i), 'Roberto Fuentes');
    await user.type(screen.getByPlaceholderText(/Ej. Tenis, Yoga/i), 'Natación');

    const botonGuardar = screen.getByRole('button', { name: /Registrar instructor/i });
    await user.click(botonGuardar);

    await waitFor(() => {
      expect(
        screen.getByText(/El instructor se ha guardado correctamente/i)
      ).toBeInTheDocument();
    });
  });
});
