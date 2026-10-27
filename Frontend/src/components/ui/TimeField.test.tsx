import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { TimeField } from './TimeField';

function TimeFieldForm() {
  const { register } = useForm<{ hora: string }>();
  return (
    <form>
      <TimeField id="hora" label="Hora" hint="Seleccione una hora" {...register('hora')} />
    </form>
  );
}

describe('TimeField', () => {
  it('renderiza input type="time" con label y forwardRef', () => {
    render(<TimeFieldForm />);
    const input = screen.getByLabelText('Hora') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('type')).toBe('time');
    expect(input.getAttribute('aria-describedby')).toBe('hora-help');
    expect(screen.getByText('Seleccione una hora')).toBeInTheDocument();
  });

  it('funciona con register() de React Hook Form', () => {
    render(<TimeFieldForm />);
    const input = screen.getByLabelText('Hora') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '14:30' } });
    expect(input.value).toBe('14:30');
  });
});
