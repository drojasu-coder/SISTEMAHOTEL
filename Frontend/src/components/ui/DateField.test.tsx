import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { DateField } from './DateField';

function DateFieldForm() {
  const { register } = useForm<{ fecha: string }>();
  return (
    <form>
      <DateField id="fecha" label="Fecha" hint="Seleccione una fecha" {...register('fecha')} />
    </form>
  );
}

describe('DateField', () => {
  it('renderiza input type="date" con label y forwardRef', () => {
    render(<DateFieldForm />);
    const input = screen.getByLabelText('Fecha') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('type')).toBe('date');
    expect(input.getAttribute('aria-describedby')).toBe('fecha-help');
    expect(screen.getByText('Seleccione una fecha')).toBeInTheDocument();
  });

  it('funciona con register() de React Hook Form', () => {
    render(<DateFieldForm />);
    const input = screen.getByLabelText('Fecha') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2026-10-25' } });
    expect(input.value).toBe('2026-10-25');
  });
});
