import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { FacturacionPage } from '@/pages/FacturacionPage';
import { PagosAdminPage } from '@/pages/PagosAdminPage';
import { PersonalPage } from '@/pages/PersonalPage';

vi.mock('@/features/operaciones/operacionesApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/operaciones/operacionesApi')>();
  return {
    ...original,
    operacionesApi: {
      facturas: async () => [{ id: 3, usuario_id: 8, nit: '1234', nombre_fiscal: 'Cliente QA', subtotal: '100.00', iva: '12.00', total: '112.00', estado: 'pendiente' }],
      facturaItems: async () => [{ id: 1, factura_id: 3, descripcion: 'Hospedaje QA', cantidad: 1, precio_unitario: '100.00', subtotal: '100.00' }],
      pagos: async () => [{ id: 4, monto: '112.00', moneda: 'GTQ', metodo: 'transferencia', tipo_pago: 'total', estado: 'pendiente', carrito_id: 5 }],
      empleados: async () => [{ id: 7, usuario_id: 8, sucursal_id: 1, area: 'Recepción', Usuario: { nombre: 'Operadora QA' }, Sucursal: { nombre: 'Hotel Central' } }],
      turnos: async () => [{ id: 2, empleado_id: 7, fecha: '2026-10-27', hora_inicio: '08:00:00', hora_fin: '16:00:00' }],
      choferes: async () => [{ id: 9, nombre: 'Chofer QA', activo: true }],
      vehiculos: async () => [{ id: 5, tipo: 'Van', capacidad: 8, placa: 'QA-000' }],
    },
  };
});

const setup = (page: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter>{page}</MemoryRouter></QueryClientProvider>);
};

describe('Paneles administrativos conectados a la API', () => {
  it('facturación lista registros y carga sus conceptos', async () => {
    setup(<FacturacionPage />);
    expect(await screen.findByText('Cliente QA')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /Ver detalle/i }));
    const dialog = screen.getByRole('dialog', { name: /Factura #3/i });
    expect(dialog).toBeInTheDocument();
    expect(await within(dialog).findByText(/Hospedaje QA/i)).toBeInTheDocument();
  });
  it('pagos permite visualizar y filtrar transacciones sin acciones financieras', async () => {
    setup(<PagosAdminPage />);
    expect(await screen.findByText('Carrito #5')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Filtrar pagos por estado/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reembolsar|aprobar transferencia/i })).not.toBeInTheDocument();
  });
  it('personal cambia entre empleados, turnos, choferes y vehículos', async () => {
    setup(<PersonalPage />);
    expect(await screen.findByText('Operadora QA')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Turnos/i }));
    expect(await screen.findByText('Turno #2')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Choferes/i }));
    expect(await screen.findByText('Chofer QA')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Vehículos/i }));
    expect(await screen.findByText('QA-000', { exact: false })).toBeInTheDocument();
  });
});
