import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renderiza paginación con página actual, total y flechas', () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={10} onChange={onChange} />);
    expect(screen.getByText('Página 2 de 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument();
    // La página actual tiene aria-current="page"
    expect(document.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  it('marca la página actual con aria-current="page" y variante primaria', () => {
    const onChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onChange={onChange} />);
    const page3 = document.querySelector('[aria-current="page"]') as HTMLElement;
    expect(page3).not.toBeNull();
    expect(page3.className).toContain('bg-bronce-600');
  });

  it('muestra puntos suspensivos cuando hay saltos', () => {
    const onChange = vi.fn();
    render(<Pagination page={5} totalPages={20} onChange={onChange} />);
    const ellipsis = screen.getAllByText('…');
    expect(ellipsis.length).toBeGreaterThanOrEqual(1);
  });

  it('llama a onChange al hacer clic en una página', () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onChange={onChange} />);
    fireEvent.click(screen.getByText('2', { exact: true }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('deshabilita anterior en página 1', () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  });

  it('deshabilita siguiente en la última página', () => {
    const onChange = vi.fn();
    render(<Pagination page={5} totalPages={5} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('no renderiza nada si totalPages < 1', () => {
    const { container } = render(<Pagination page={1} totalPages={0} onChange={vi.fn()} />);
    expect(container.children.length).toBe(0);
  });
});
