import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Checkbox } from './Checkbox';

function CheckboxForm() {
  const { register } = useForm<{ terminos: boolean }>();
  return (
    <form>
      <Checkbox
        id="terminos"
        label="Acepto los términos y condiciones"
        {...register('terminos')}
      />
    </form>
  );
}

describe('Checkbox', () => {
  it('renderiza label y checkbox con tamaño táctil', () => {
    render(<CheckboxForm />);
    const checkbox = screen.getByLabelText('Acepto los términos y condiciones') as HTMLInputElement;
    expect(checkbox.type).toBe('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('funciona con register() de React Hook Form', () => {
    render(<CheckboxForm />);
    const checkbox = screen.getByLabelText('Acepto los términos y condiciones') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });
});
