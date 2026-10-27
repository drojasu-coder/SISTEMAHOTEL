import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('renderiza pasos con estados completado, actual y error', () => {
    render(
      <Stepper
        steps={['Selección', 'Datos', 'Confirmación']}
        current={1}
        onChange={vi.fn()}
      />,
    );
    // Paso 0 completado: ícono de check
    expect(screen.getAllByText('Selección')[0]).toBeInTheDocument();
    // Paso 1 actual: aria-current="step"
    const actual = screen.getByText('Datos');
    expect(actual.closest('button')?.getAttribute('aria-current')).toBe('step');
    // Paso 2: número 3 (pendiente)
    expect(screen.getByText('Confirmación')).toBeInTheDocument();
  });

  it('usa aria-current="step" en el paso actual', () => {
    render(
      <Stepper steps={['A', 'B', 'C']} current={0} onChange={vi.fn()} />,
    );
    expect(screen.getByText('A').closest('button')?.getAttribute('aria-current')).toBe('step');
  });

  it('muestra estado de error en el paso actual', () => {
    render(
      <Stepper steps={['A', 'B', 'C']} current={1} error onChange={vi.fn()} />,
    );
    const pasoActual = screen.getByText('B').closest('button');
    expect(pasoActual?.className).toContain('text-error-600');
  });

  it('llama a onChange al hacer clic en un paso habilitado', () => {
    const onChange = vi.fn();
    render(
      <Stepper steps={['A', 'B', 'C']} current={2} onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('A'));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('no permite hacer clic en pasos futuros (deshabilitados)', () => {
    const onChange = vi.fn();
    render(
      <Stepper steps={['A', 'B', 'C']} current={0} onChange={onChange} />,
    );
    fireEvent.click(screen.getByText('C'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
