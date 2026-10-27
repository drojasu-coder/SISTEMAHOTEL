import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from '@/test/renderWithProviders';
import { tokenStorage } from '@/api/session';
import { AdminReservasPage } from '@/pages/AdminReservasPage';
import { AdminReservaDetallePage } from '@/pages/AdminReservaDetallePage';
import { textosAdminReservas } from './textos';
import type { ReservaHabitacion } from '../types';

const mockSedes = [
  { id: 1, nombre: 'Hotel Hunapú Central', direccion: 'Zona 10', ciudad: 'Guatemala', telefono: '22221111', activa: true },
  { id: 2, nombre: 'Hotel Hunapú Antigua', direccion: 'Calle del Arco', ciudad: 'Antigua', telefono: '22222222', activa: true },
];

const mockReservas: ReservaHabitacion[] = [
  {
    id: 101,
    usuario_id: 5,
    habitacion_id: 10,
    fecha_entrada: '2026-11-10',
    fecha_salida: '2026-11-14',
    numero_huespedes: 2,
    estado: 'confirmada',
    total: '1800.00',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    Usuario: {
      id: 5,
      nombre: 'Carlos Mendoza',
      email: 'carlos@ejemplo.com',
      rol: 'cliente',
      telefono: '55551234',
      activo: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
    Habitacion: {
      id: 10,
      sucursal_id: 1,
      tipo_habitacion_id: 2,
      numero: '201',
      estado: 'disponible',
      TipoHabitacion: {
        id: 2,
        nombre: 'Doble Superior',
        capacidad_maxima: 2,
        tarifa_noche: '450.00',
      },
      Sucursal: {
        id: 1,
        nombre: 'Hotel Hunapú Central',
        activa: true,
      },
    },
  },
  {
    id: 102,
    usuario_id: 6,
    habitacion_id: 11,
    fecha_entrada: '2026-12-01',
    fecha_salida: '2026-12-05',
    numero_huespedes: 1,
    estado: 'pendiente',
    total: '1200.00',
    createdAt: '2026-10-21T12:00:00.000Z',
    updatedAt: '2026-10-21T12:00:00.000Z',
    Usuario: {
      id: 6,
      nombre: 'Lucía Morales',
      email: 'lucia@ejemplo.com',
      rol: 'cliente',
      telefono: null,
      activo: true,
      createdAt: '2026-09-02T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z',
    },
    Habitacion: {
      id: 11,
      sucursal_id: 2,
      tipo_habitacion_id: 1,
      numero: '105',
      estado: 'ocupada',
      TipoHabitacion: {
        id: 1,
        nombre: 'Individual Estándar',
        capacidad_maxima: 1,
        tarifa_noche: '300.00',
      },
      Sucursal: {
        id: 2,
        nombre: 'Hotel Hunapú Antigua',
        activa: true,
      },
    },
  },
];

function instalarFetchMock(reservas = mockReservas, sedes = mockSedes) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.endsWith('/auth/me')) {
      return meResponse('recepcionista', 'Recepcionista Turno');
    }

    if (url.endsWith('/sucursales')) {
      return jsonResponse({
        status: 'success',
        data: sedes,
      });
    }

    if (url.includes('/reservas-habitacion/101')) {
      return jsonResponse({
        success: true,
        statusCode: 200,
        message: 'Reserva obtenida',
        data: reservas.find((r) => r.id === 101) ?? reservas[0],
      });
    }

    if (url.includes('/reservas-habitacion/999')) {
      return errorResponse(404, 'RESERVA_HABITACION_NOT_FOUND', 'La reserva no fue encontrada');
    }

    if (url.endsWith('/reservas-habitacion')) {
      return jsonResponse({
        success: true,
        statusCode: 200,
        message: 'Reservas obtenidas',
        data: reservas,
      });
    }

    return errorResponse(404, 'NOT_FOUND', 'Ruta no encontrada');
  });
}

describe('Consulta administrativa de reservas (AdminReservasPage y AdminReservaDetallePage)', () => {
  beforeEach(() => {
    tokenStorage.clear();
    tokenStorage.set('jwt-recepcionista-valido');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it('1. renderiza el listado administrativo con datos reales disponibles (identificador, cliente, sede, habitación, fechas, huéspedes, estado e importe en GTQ)', async () => {
    instalarFetchMock();

    renderWithProviders(<AdminReservasPage />, { route: '/admin/reservas' });

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: textosAdminReservas.titulo,
      })
    ).toBeInTheDocument();

    // Comprobar reserva 101
    expect(await screen.findByText('Reserva #101')).toBeInTheDocument();
    expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
    expect(screen.getByText('carlos@ejemplo.com')).toBeInTheDocument();
    expect(screen.getAllByText('Hotel Hunapú Central').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hab. 201')).toBeInTheDocument();
    expect(screen.getByText('Doble Superior')).toBeInTheDocument();
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument();
    expect(screen.getByText('10 nov 2026 — 14 nov 2026')).toBeInTheDocument();
    expect(screen.getAllByText('(4 noches)').length).toBe(2);
    expect(screen.getAllByText('Confirmada').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Q1,800.00')).toBeInTheDocument();

    // Comprobar reserva 102
    expect(screen.getByText('Reserva #102')).toBeInTheDocument();
    expect(screen.getByText('Lucía Morales')).toBeInTheDocument();
    expect(screen.getByText('lucia@ejemplo.com')).toBeInTheDocument();
    expect(screen.getAllByText('Hotel Hunapú Antigua').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hab. 105')).toBeInTheDocument();
    expect(screen.getByText('1 huésped')).toBeInTheDocument();
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Q1,200.00')).toBeInTheDocument();

    // Enlaces al detalle
    const enlaces = screen.getAllByRole('link', { name: /ver detalle/i });
    expect(enlaces).toHaveLength(2);
    expect(enlaces[0]).toHaveAttribute('href', '/admin/reservas/101');
    expect(enlaces[1]).toHaveAttribute('href', '/admin/reservas/102');
  });

  it('2. filtra por término de búsqueda (nombre de cliente, correo o habitación)', async () => {
    const user = userEvent.setup();
    instalarFetchMock();

    renderWithProviders(<AdminReservasPage />, { route: '/admin/reservas' });

    expect(await screen.findByText('Reserva #101')).toBeInTheDocument();
    expect(screen.getByText('Reserva #102')).toBeInTheDocument();

    const searchInput = screen.getByLabelText(textosAdminReservas.filtros.buscarLabel);

    // Buscar por nombre Carlos
    await user.type(searchInput, 'Carlos');
    expect(screen.getByText('Reserva #101')).toBeInTheDocument();
    expect(screen.queryByText('Reserva #102')).not.toBeInTheDocument();

    // Limpiar búsqueda
    await user.clear(searchInput);
    expect(screen.getByText('Reserva #101')).toBeInTheDocument();
    expect(screen.getByText('Reserva #102')).toBeInTheDocument();

    // Buscar por número de habitación 105
    await user.type(searchInput, '105');
    expect(screen.queryByText('Reserva #101')).not.toBeInTheDocument();
    expect(screen.getByText('Reserva #102')).toBeInTheDocument();
  });

  it('3. filtra por estado y por sede hotelera', async () => {
    const user = userEvent.setup();
    instalarFetchMock();

    renderWithProviders(<AdminReservasPage />, { route: '/admin/reservas' });

    expect(await screen.findByText('Reserva #101')).toBeInTheDocument();

    const estadoSelect = screen.getByLabelText(textosAdminReservas.filtros.estadoLabel);
    await user.selectOptions(estadoSelect, 'pendiente');

    expect(screen.queryByText('Reserva #101')).not.toBeInTheDocument();
    expect(screen.getByText('Reserva #102')).toBeInTheDocument();

    // Filtro por sede incompatible
    const sedeSelect = screen.getByLabelText(textosAdminReservas.filtros.sedeLabel);
    await user.selectOptions(sedeSelect, '1'); // Hunapú Central
    expect(screen.queryByText('Reserva #101')).not.toBeInTheDocument();
    expect(screen.queryByText('Reserva #102')).not.toBeInTheDocument();
    expect(screen.getByText(textosAdminReservas.listado.sinResultadosTitulo)).toBeInTheDocument();
  });

  it('4. presenta estado de catálogo vacío cuando no hay reservas registradas', async () => {
    instalarFetchMock([], mockSedes);

    renderWithProviders(<AdminReservasPage />, { route: '/admin/reservas' });

    expect(await screen.findByText(textosAdminReservas.listado.vacioTitulo)).toBeInTheDocument();
    expect(screen.getByText(textosAdminReservas.listado.vacioDescripcion)).toBeInTheDocument();
  });

  it('5. presenta mensaje de error y permite reintentar ante fallo del servidor', async () => {
    let respondioError = true;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/auth/me')) return meResponse('admin');
      if (url.endsWith('/sucursales')) return jsonResponse({ status: 'success', data: mockSedes });
      if (url.endsWith('/reservas-habitacion')) {
        if (respondioError) {
          return errorResponse(500, 'INTERNAL_ERROR', 'Fallo interno temporal');
        }
        return jsonResponse({ success: true, statusCode: 200, message: 'OK', data: mockReservas });
      }
      return errorResponse(404, 'NOT_FOUND', 'Not found');
    });

    const user = userEvent.setup();
    renderWithProviders(<AdminReservasPage />, { route: '/admin/reservas' });

    expect(await screen.findByText(textosAdminReservas.listado.errorTitulo)).toBeInTheDocument();
    const reintentarBtn = screen.getByRole('button', { name: textosAdminReservas.listado.reintentar });

    respondioError = false;
    await user.click(reintentarBtn);

    expect(await screen.findByText('Reserva #101')).toBeInTheDocument();
  });

  it('6. muestra el detalle completo de una reserva accesible por URL directa (/admin/reservas/:id) y tras recarga', async () => {
    instalarFetchMock();

    renderWithProviders(
      <Routes>
        <Route path="/admin/reservas/:id" element={<AdminReservaDetallePage />} />
      </Routes>,
      { route: '/admin/reservas/101' }
    );

    // Comprobar título del detalle con identificador
    expect(await screen.findByRole('heading', { level: 1, name: 'Reserva #101' })).toBeInTheDocument();

    // Comprobar datos del cliente
    expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
    expect(screen.getByText('carlos@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByText('55551234')).toBeInTheDocument();

    // Comprobar datos de la estancia
    expect(screen.getByText('Hotel Hunapú Central')).toBeInTheDocument();
    expect(screen.getByText('Hab. 201')).toBeInTheDocument();
    expect(screen.getByText('Doble Superior')).toBeInTheDocument();
    expect(screen.getByText('10 nov 2026')).toBeInTheDocument();
    expect(screen.getByText('14 nov 2026')).toBeInTheDocument();
    expect(screen.getByText('4 noches')).toBeInTheDocument();
    expect(screen.getByText('2 huéspedes')).toBeInTheDocument();

    // Comprobar registro financiero
    expect(screen.getByText('Q1,800.00')).toBeInTheDocument();
    expect(screen.getByText(textosAdminReservas.detalle.campos.importeNota)).toBeInTheDocument();

    // Enlace para volver a la lista
    const volverEnlace = screen.getByRole('link', { name: textosAdminReservas.volverAListado });
    expect(volverEnlace).toHaveAttribute('href', '/admin/reservas');
  });

  it('7. maneja adecuadamente una reserva inexistente o ID inválido en el detalle', async () => {
    instalarFetchMock();

    renderWithProviders(
      <Routes>
        <Route path="/admin/reservas/:id" element={<AdminReservaDetallePage />} />
      </Routes>,
      { route: '/admin/reservas/999' }
    );

    expect(await screen.findByText(textosAdminReservas.detalle.errorTitulo)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: textosAdminReservas.detalle.reintentar })).toBeInTheDocument();
  });
});
