import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Radio } from './Radio';

function RadioForm() {
  const { register } = useForm<{ metodo: string }>();
  return (
    <form>
      <Radio id="tarjeta" label="Tarjeta de crédito" value="tarjeta" {...register('metodo')} />
      <Radio id="transferencia" label="Transferencia bancaria" value="transferencia" {...register('metodo')} />
    </form>
  );
}

describe('Radio', () => {
  it('renderiza radios con el mismo name y tamaño táctil', () => {
    render(<RadioForm />);
    expect(screen.getByLabelText('Tarjeta de crédito')).toBeInTheDocument();
    expect(screen.getByLabelText('Transferencia bancaria')).toBeInTheDocument();
    expect(screen.getByLabelText('Tarjeta de crédito').getAttribute('name')).toBe('metodo');
  });

  it('funciona con register() de React Hook Form', () => {
    render(<RadioForm />);
    const radio = screen.getByLabelText('Transferencia bancaria') as HTMLInputElement;
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
  });
});
