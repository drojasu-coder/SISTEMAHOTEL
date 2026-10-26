import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Select } from './Select';

function SelectForm() {
  const { register, formState: { errors } } = useForm<{ sede: string }>();
  return (
    <form>
      <Select
        id="sede"
        label="Sede"
        hint="Elija una sede de la lista"
        {...register('sede')}
        error={errors.sede?.message}
      >
        <option value="" disabled>Seleccione una sede</option>
        <option value="central">Sede Central</option>
        <option value="antigua">Antigua</option>
      </Select>
      {errors.sede && <span data-testid="error">{errors.sede.message}</span>}
    </form>
  );
}

describe('Select', () => {
  it('renderiza label, opciones y vincula aria-describedby al mensaje de ayuda', () => {
    render(<SelectForm />);
    expect(screen.getByLabelText('Sede')).toBeInTheDocument();
    const select = screen.getByLabelText('Sede') as HTMLSelectElement;
    expect(select.getAttribute('aria-describedby')).toBe('sede-help');
    expect(screen.getByText('Elija una sede de la lista')).toBeInTheDocument();
  });

  it('funciona con register() de React Hook Form', () => {
    render(<SelectForm />);
    const select = screen.getByLabelText('Sede') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'central' } });
    expect(select.value).toBe('central');
  });
});
