import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchBox, StatCard, formatHotelDate } from './workbench';

describe('Presentación administrativa: fechas, números y búsqueda', () => {
  it('muestra cifras con tipografía sans-serif y números normales', () => {
    render(<StatCard label="Registradas" value={1} />);
    expect(screen.getByText('1')).toHaveClass('font-sans', 'lining-nums', 'tabular-nums');
  });

  it('mantiene la lupa centrada en el campo, no en el conjunto etiqueta + campo', () => {
    const onSearch = vi.fn();
    render(<SearchBox search="" onSearch={onSearch} placeholder="Buscar factura" />);
    const input = screen.getByRole('searchbox', { name: /buscar/i });
    expect(input.parentElement).toHaveClass('relative');
    expect(input.parentElement?.querySelector('svg')).toHaveClass('top-1/2');
    fireEvent.change(input, { target: { value: 'PAS-2026' } });
    expect(onSearch).toHaveBeenCalledWith('PAS-2026');
  });

  it('muestra fechas según Guatemala y preserva fechas calendario', () => {
    expect(formatHotelDate('2026-10-27T06:37:45.000Z')).toBe('27/10/2026');
    expect(formatHotelDate('2026-10-27T02:00:00.000Z')).toBe('26/10/2026');
    expect(formatHotelDate('2026-10-27')).toBe('27/10/2026');
    expect(formatHotelDate(null)).toBe('Sin registrar');
    expect(formatHotelDate('no-es-fecha')).toBe('Sin registrar');
  });
});
