import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Textarea } from './Textarea';

function TextareaForm() {
  const { register, formState: { errors } } = useForm<{ comentarios: string }>();
  return (
    <form>
      <Textarea
        id="comentarios"
        label="Comentarios"
        hint="Escriba un comentario…"
        {...register('comentarios')}
        error={errors.comentarios?.message}
      />
      {errors.comentarios && <span data-testid="error">{errors.comentarios.message}</span>}
    </form>
  );
}

describe('Textarea', () => {
  it('renderiza label y textarea con aria-describedby', () => {
    render(<TextareaForm />);
    expect(screen.getByLabelText('Comentarios')).toBeInTheDocument();
    const textarea = screen.getByLabelText('Comentarios') as HTMLTextAreaElement;
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.getAttribute('aria-describedby')).toBe('comentarios-help');
    expect(screen.getByText('Escriba un comentario…')).toBeInTheDocument();
  });

  it('funciona con register() de React Hook Form', () => {
    render(<TextareaForm />);
    const textarea = screen.getByLabelText('Comentarios') as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: 'Hola mundo' } });
    expect(textarea.value).toBe('Hola mundo');
  });
});
