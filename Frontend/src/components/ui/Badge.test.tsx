import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('resuelve el tono y el texto a partir de status', () => {
    render(<Badge status="confirmada" />);
    const badge = screen.getByText('Confirmada');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-exito-50');
    expect(badge.className).toContain('text-exito-700');
  });

  it('mapea estados de error al tono error', () => {
    render(<Badge status="rechazado" />);
    expect(screen.getByText('Rechazado').className).toContain('bg-error-50');
  });

  it('usa tone cuando se provee', () => {
    render(<Badge tone="advertencia">Pendiente</Badge>);
    expect(screen.getByText('Pendiente').className).toContain('bg-advertencia-50');
  });

  it('renderiza children cuando se proveen', () => {
    render(<Badge status="disponible">Disponible ahora</Badge>);
    expect(screen.getByText('Disponible ahora')).toBeInTheDocument();
  });

  it('usa tono neutro por defecto', () => {
    render(<Badge>Sin estado</Badge>);
    expect(screen.getByText('Sin estado').className).toContain('bg-neutro-100');
  });
});
