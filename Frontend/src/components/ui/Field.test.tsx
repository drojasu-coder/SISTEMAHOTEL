import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field } from './Field';

describe('Field', () => {
  it('renderiza etiqueta, control y mensaje de ayuda vinculado por id', () => {
    const { container } = render(
      <Field id="campo1" label="Nombre" hint="Ingrese su nombre">
        <input id="campo1" type="text" />
      </Field>,
    );
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Ingrese su nombre')).toBeInTheDocument();
    const help = container.querySelector('#campo1-help');
    expect(help).not.toBeNull();
    expect(help?.textContent).toBe('Ingrese su nombre');
  });

  it('renderiza error con role="alert"', () => {
    render(
      <Field id="campo2" label="Correo" error="Correo inválido">
        <input id="campo2" type="email" />
      </Field>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Correo inválido')).toBeInTheDocument();
  });

  it('genera id cuando no se provee', () => {
    render(
      <Field label="Sin id" hint="pista">
        <input type="text" />
      </Field>,
    );
    const label = screen.getByText('Sin id') as HTMLLabelElement;
    const forAttr = label.getAttribute('for');
    expect(forAttr).toBeDefined();
    const help = document.querySelector(`#${forAttr!}-help`);
    expect(help?.textContent).toBe('pista');
  });

  it('muestra estado de carga con texto de cargando', () => {
    const { container } = render(
      <Field id="campo3" label="Estado" loading>
        <input id="campo3" type="text" />
      </Field>,
    );
    const help = container.querySelector('#campo3-help');
    expect(help?.textContent).toBe('Cargando');
  });
});
