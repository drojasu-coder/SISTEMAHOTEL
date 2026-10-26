import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function Probe() {
  const { notify } = useToast();
  return (
    <div>
      <button onClick={() => notify({ title: 'Guardado', tone: 'success' })}>
        notificar
      </button>
      <button onClick={() => notify({ title: 'Error', tone: 'error', description: 'Inténtelo de nuevo' })}>
        notificar error
      </button>
    </div>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra un toast tras notificar y lo autodescarte tras 7 segundos', () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('notificar'));
    });
    expect(screen.getByText('Guardado')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.queryByText('Guardado')).toBeNull();
  });

  it('anuncia los errores como alert', () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('notificar error'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Inténtelo de nuevo')).toBeInTheDocument();
  });

  it('cierra el toast al hacer clic en cerrar', () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('notificar'));
    });
    act(() => {
      fireEvent.click(screen.getByText('Cerrar'));
    });
    expect(screen.queryByText('Guardado')).toBeNull();
  });

  it('useToast lanza error si no está dentro de ToastProvider', () => {
    const BadProbe = () => {
      useToast();
      return null;
    };
    expect(() => render(<BadProbe />)).toThrow(/useToast debe usarse dentro de un ToastProvider/);
  });
});
