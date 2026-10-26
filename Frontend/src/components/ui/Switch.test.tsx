import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Switch } from './Switch';

function SwitchForm() {
  const [checked, setChecked] = React.useState(false);
  return (
    <form>
      <Switch
        id="notificaciones"
        label="Recibir notificaciones"
        checked={checked}
        onChange={() => setChecked((c) => !c)}
      />
    </form>
  );
}

import React from 'react';

describe('Switch', () => {
  it('renderiza con role="switch" y aria-checked', () => {
    render(<SwitchForm />);
    const switchEl = screen.getByLabelText('Recibir notificaciones') as HTMLInputElement;
    expect(switchEl.getAttribute('role')).toBe('switch');
    expect(switchEl.getAttribute('aria-checked')).toBe('false');
  });

  it('cambia aria-checked al hacer clic', () => {
    render(<SwitchForm />);
    const switchEl = screen.getByLabelText('Recibir notificaciones') as HTMLInputElement;
    fireEvent.click(switchEl);
    expect(switchEl.getAttribute('aria-checked')).toBe('true');
  });

  it('propaga los handlers de register() de React Hook Form', () => {
    const onChange = vi.fn();
    function Probe() {
      const { register } = useForm<{ notificaciones: boolean }>();
      const field = register('notificaciones');
      return (
        <Switch
          id="notificaciones"
          label="Recibir notificaciones"
          name={field.name}
          checked={false}
          onChange={(e) => {
            field.onChange(e);
            onChange();
          }}
        />
      );
    }
    render(<Probe />);
    const switchEl = screen.getByLabelText('Recibir notificaciones') as HTMLInputElement;
    expect(switchEl.getAttribute('name')).toBe('notificaciones');
    fireEvent.click(switchEl);
    expect(onChange).toHaveBeenCalled();
  });
});
