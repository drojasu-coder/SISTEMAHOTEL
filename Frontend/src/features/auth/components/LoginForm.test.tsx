import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm component', () => {
  it('displays validation errors on empty submission', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/El correo electrónico es obligatorio/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/La contraseña es obligatoria/i),
      ).toBeInTheDocument();
    });
  });

  it('displays invalid email error format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    await user.type(emailInput, 'correo-invalido');

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Ingrese un correo electrónico válido/i),
      ).toBeInTheDocument();
    });
  });

  it('submits successfully when inputs are valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passwordInput = screen.getByLabelText(/^Contraseña$/i);

    await user.type(emailInput, 'recepcion@hotelhunapu.com');
    await user.type(passwordInput, 'Hunapu2026!');

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Validación de formulario exitosa/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/recepcion@hotelhunapu.com/i),
      ).toBeInTheDocument();
    });
  });
});
