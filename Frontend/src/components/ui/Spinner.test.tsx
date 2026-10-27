import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renderiza un SVG decorativo oculto a tecnologías de asistencia y animado', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg') ?? container.firstElementChild;
    expect(svg?.tagName).toBe('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('class')).toContain('animate-spin');
  });

  it('renderiza un anuncio de estado (role="status") cuando se pasa label', () => {
    render(<Spinner label="Cargando" />);
    const status = screen.getByRole('status');
    expect(status).not.toBeNull();
    expect(status.getAttribute('aria-label')).toBe('Cargando');
    expect(status.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(status.querySelector('.sr-only')?.textContent).toBe('Cargando');
  });

  it('acepta el tamaño lg', () => {
    const { container } = render(<Spinner size="lg" />);
    const svg = container.querySelector('svg') ?? container.firstElementChild;
    expect(svg?.getAttribute('class')).toContain('size-6');
  });
});
