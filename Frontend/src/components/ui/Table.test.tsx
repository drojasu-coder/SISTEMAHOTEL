import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table, type Column } from './Table';
import { Badge } from './Badge';

interface Reserva {
  id: string;
  nombre: string;
  estado: string;
  total: number;
}

const rows: Reserva[] = [
  { id: '1', nombre: 'Reserva A', estado: 'confirmada', total: 1250 },
  { id: '2', nombre: 'Reserva B', estado: 'pendiente', total: 950 },
];

const columns: Column<Reserva>[] = [
  { key: 'nombre', label: 'Nombre', render: (row) => <span className="font-medium">{row.nombre}</span> },
  { key: 'estado', label: 'Estado', render: (row) => <Badge status={row.estado as any} /> },
  { key: 'total', label: 'Total', render: (row) => `Q${row.total}` },
];

describe('Table', () => {
  it('renderiza tabla con caption sr-only y filas en desktop', () => {
    render(<Table rows={rows} columns={columns} caption="Reservas" />);
    // El caption es sr-only (accesible pero no visible)
    expect(document.querySelector('caption')?.textContent).toBe('Reservas');
    // En desktop, las filas están en celdas de tabla
    const cells = screen.getAllByText('Reserva A');
    expect(cells.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Reserva B').length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza filas como lista de definición en móvil', () => {
    render(<Table rows={rows} columns={columns} caption="Reservas" />);
    const dl = document.querySelectorAll('dl');
    expect(dl.length).toBeGreaterThanOrEqual(rows.length);
  });

  it('usa Badge para estados', () => {
    render(<Table rows={rows} columns={columns} caption="Reservas" />);
    const badges = screen.getAllByText('Confirmada');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('muestra EmptyState cuando no hay filas', () => {
    render(<Table rows={[]} columns={columns} caption="Vacía" />);
    expect(screen.getByText('Todavía no hay información')).toBeInTheDocument();
  });

  it('muestra ErrorState con onRetry cuando status es error', () => {
    const onRetry = vi.fn();
    render(
      <Table
        rows={[]}
        columns={columns}
        caption="Error"
        status="error"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
