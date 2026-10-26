import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renderiza título y descripción por defecto', () => {
    render(<EmptyState />);
    expect(screen.getByText('Todavía no hay información')).toBeInTheDocument();
    expect(
      screen.getByText('Los elementos aparecerán aquí cuando estén disponibles.')
    ).toBeInTheDocument();
  });

  it('usa los textos personalizados y se anuncia como status', () => {
    const { container } = render(
      <EmptyState title="Sin habitaciones" description="No hay habitaciones registradas." />
    );
    expect(screen.getByText('Sin habitaciones')).toBeInTheDocument();
    expect(screen.getByText('No hay habitaciones registradas.')).toBeInTheDocument();
    expect(container.firstElementChild?.getAttribute('role')).toBe('status');
  });

  it('renderiza una acción opcional', () => {
    const { container } = render(<EmptyState action={<button>Explorar</button>} />);
    expect(container.querySelector('button')?.textContent).toBe('Explorar');
  });
});
