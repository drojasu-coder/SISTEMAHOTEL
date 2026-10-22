import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BotonAnadirAlCarrito } from '../BotonAnadirAlCarrito';
import { carritoApi } from '../../api/carritoApi';
import { ApiError } from '@/api/client/http';
import * as authContext from '@/features/auth/AuthContext';

import type { Carrito, CarritoItem } from '../../types';

describe('BotonAnadirAlCarrito', () => {
  let queryClient: QueryClient;

  const mockUserCliente = {
    id: 15,
    nombre: 'Cliente Prueba',
    email: 'cliente@test.com',
    rol: 'cliente' as const,
    activo: true,
  };

  const mockCarrito: Carrito = {
    id: 99,
    usuario_id: 15,
    estado: 'activo',
    expira_en: '2026-11-01T12:00:00.000Z',
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T10:00:00.000Z',
  };

  const mockCreatedItem: CarritoItem = {
    id: 201,
    carrito_id: 99,
    tipo_item: 'habitacion',
    referencia_id: 42,
    descripcion: 'Reserva de habitación #42',
    precio: '700.00',
    cantidad: 1,
    promocion_id: null,
    createdAt: '2026-10-22T10:05:00.000Z',
    updatedAt: '2026-10-22T10:05:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      status: 'authenticated',
      user: mockUserCliente,
      token: 'jwt-token',
      login: vi.fn(),
      logout: vi.fn(),
      retry: vi.fn(),
    } as any);
  });

  const renderComponent = (props?: Partial<React.ComponentProps<typeof BotonAnadirAlCarrito>>) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <BotonAnadirAlCarrito
            reservaId={42}
            reservaEstado="pendiente"
            {...props}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('no se renderiza para roles que no sean cliente', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      status: 'authenticated',
      user: { ...mockUserCliente, rol: 'recepcionista' as any },
    } as any);

    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('añade la reserva existente al carrito invocando getOrCreateActiveCart y addItem', async () => {
    const getCartSpy = vi
      .spyOn(carritoApi, 'getOrCreateActiveCart')
      .mockResolvedValueOnce(mockCarrito);
    const addItemSpy = vi
      .spyOn(carritoApi, 'addItem')
      .mockResolvedValueOnce(mockCreatedItem);

    renderComponent();

    const button = screen.getByRole('button', { name: /añadir al carrito/i });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(getCartSpy).toHaveBeenCalledTimes(1);
    });

    expect(addItemSpy).toHaveBeenCalledWith(99, {
      tipo_item: 'habitacion',
      referencia_id: 42,
    });

    // Muestra alerta de éxito y enlace al carrito
    expect(await screen.findByText(/se añadió la reserva al carrito activo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver carrito/i })).toHaveAttribute('href', '/carrito');
  });

  it('muestra aviso claro si la reserva ya se encuentra en el carrito (409 CART_ITEM_ALREADY_EXISTS)', async () => {
    vi.spyOn(carritoApi, 'getOrCreateActiveCart').mockResolvedValueOnce(mockCarrito);
    vi.spyOn(carritoApi, 'addItem').mockRejectedValueOnce(
      new ApiError(409, 'La referencia ya se encuentra agregada al carrito', {
        code: 'CART_ITEM_ALREADY_EXISTS',
      })
    );

    renderComponent();

    const button = screen.getByRole('button', { name: /añadir al carrito/i });
    fireEvent.click(button);

    expect(await screen.findByText(/esta reserva ya se encuentra en su carrito activo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver carrito/i })).toHaveAttribute('href', '/carrito');
  });

  it('muestra aviso si la reserva ya no se encuentra disponible (409 CART_REFERENCE_NOT_AVAILABLE)', async () => {
    vi.spyOn(carritoApi, 'getOrCreateActiveCart').mockResolvedValueOnce(mockCarrito);
    vi.spyOn(carritoApi, 'addItem').mockRejectedValueOnce(
      new ApiError(409, 'La referencia seleccionada ya no se encuentra disponible', {
        code: 'CART_REFERENCE_NOT_AVAILABLE',
      })
    );

    renderComponent();

    const button = screen.getByRole('button', { name: /añadir al carrito/i });
    fireEvent.click(button);

    expect(await screen.findByText(/la reserva seleccionada ya no se encuentra disponible/i)).toBeInTheDocument();
  });

  it('muestra aviso si la reserva no pertenece al usuario autenticado (403 CART_REFERENCE_NOT_OWNED)', async () => {
    vi.spyOn(carritoApi, 'getOrCreateActiveCart').mockResolvedValueOnce(mockCarrito);
    vi.spyOn(carritoApi, 'addItem').mockRejectedValueOnce(
      new ApiError(403, 'La referencia seleccionada no pertenece al propietario del carrito', {
        code: 'CART_REFERENCE_NOT_OWNED',
      })
    );

    renderComponent();

    const button = screen.getByRole('button', { name: /añadir al carrito/i });
    fireEvent.click(button);

    expect(await screen.findByText(/la reserva seleccionada no pertenece a su cuenta/i)).toBeInTheDocument();
  });

  it('trata los fallos de red como resultado incierto sin reintentar automáticamente', async () => {
    vi.spyOn(carritoApi, 'getOrCreateActiveCart').mockResolvedValueOnce(mockCarrito);
    vi.spyOn(carritoApi, 'addItem').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    renderComponent();

    const button = screen.getByRole('button', { name: /añadir al carrito/i });
    fireEvent.click(button);

    expect(
      await screen.findByText(/no fue posible confirmar si la reserva se añadió al carrito debido a un fallo de conexión/i)
    ).toBeInTheDocument();

    // Permite verificar en el carrito
    expect(screen.getAllByRole('link', { name: /ver carrito/i }).length).toBeGreaterThan(0);
  });

  it('deshabilita la acción si la reserva se encuentra en un estado terminal evidente', () => {
    renderComponent({ reservaEstado: 'cancelada' });

    const button = screen.getByRole('button', { name: /añadir al carrito/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/esta reserva no está disponible para añadir al carrito en su estado actual/i)).toBeInTheDocument();
  });
});
