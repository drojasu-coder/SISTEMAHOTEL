import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Countdown } from './Countdown';

describe('Countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T12:00:00Z').getTime());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el tiempo restante calculado desde expiresAt del servidor', () => {
    const expiresAt = new Date('2026-10-25T12:15:00Z').getTime(); // 15 min desde ahora
    render(<Countdown expiresAt={expiresAt} />);
    expect(screen.getByRole('timer')).toHaveTextContent('15:00');
  });

  it('avisa con aria-live cuando quedan menos de 2 minutos', () => {
    const expiresAt = new Date('2026-10-25T12:01:30Z').getTime(); // 1.5 min desde ahora
    render(<Countdown expiresAt={expiresAt} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Quedan menos de 2 minutos');
  });

  it('llama a onExpire al llegar a cero', () => {
    const onExpire = vi.fn();
    const expiresAt = new Date('2026-10-25T12:00:05Z').getTime(); // 5 segundos desde ahora
    render(<Countdown expiresAt={expiresAt} onExpire={onExpire} />);
    vi.advanceTimersByTime(6000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('no baja de cero ni se desborda', () => {
    const expiresAt = new Date('2026-10-25T11:00:00Z').getTime(); // ya vencido
    render(<Countdown expiresAt={expiresAt} />);
    expect(screen.getByRole('timer')).toHaveTextContent('00:00');
    expect(screen.getByRole('status').textContent).toContain('ha expirado');
  });

  it('limpia el intervalo al desmontar', () => {
    const expiresAt = new Date('2026-10-25T12:15:00Z').getTime();
    const { unmount } = render(<Countdown expiresAt={expiresAt} />);
    expect(() => unmount()).not.toThrow();
    // Avanzar tiempo después de desmontar no debe lanzar
    vi.advanceTimersByTime(60000);
  });
});
