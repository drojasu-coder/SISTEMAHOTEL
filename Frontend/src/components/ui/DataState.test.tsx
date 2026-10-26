import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataState } from './DataState';

describe('DataState', () => {
  it('muestra esqueletos cuando status es loading', () => {
    render(<DataState status="loading" />);
    expect(screen.getAllByText('')[0]).toBeDefined();
    expect(document.querySelector('.bg-neutro-200')).not.toBeNull();
  });

  it('muestra EmptyState cuando status es empty', () => {
    render(<DataState status="empty" />);
    expect(screen.getByText('Todavía no hay información')).toBeInTheDocument();
  });

  it('muestra ErrorState con role="alert" cuando status es error', () => {
    render(<DataState status="error" onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('muestra los hijos cuando status es success', () => {
    render(
      <DataState status="success">
        <p>Contenido real</p>
      </DataState>
    );
    expect(screen.getByText('Contenido real')).toBeInTheDocument();
  });

  it('usa success por defecto', () => {
    render(<DataState><p>Por defecto</p></DataState>);
    expect(screen.getByText('Por defecto')).toBeInTheDocument();
  });
});
