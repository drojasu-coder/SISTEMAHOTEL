import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renderiza el mensaje y se anuncia como alert', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="No se pudo cargar la información." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('No se pudo cargar la información.')).toBeInTheDocument();
    expect(screen.getByText('Revise su conexión e inténtelo de nuevo.')).toBeInTheDocument();
  });

  it('llama a onRetry al hacer clic en Reintentar', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Reintentar'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('muestra estado de carga y deshabilita el botón cuando loading es true', () => {
    render(<ErrorState onRetry={vi.fn()} loading />);
    const button = screen.getByText('Cargando');
    expect(button).toBeDisabled();
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});
