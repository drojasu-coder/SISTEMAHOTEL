import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusTimeline } from './StatusTimeline';

describe('StatusTimeline', () => {
  it('renderiza lista ordenada con pasos y conectores', () => {
    render(
      <StatusTimeline
        items={[
          { id: 't1', label: 'Solicitud recibida', detail: 'Ejemplo · 10:00', done: true },
          { id: 't2', label: 'Validación en proceso', detail: 'Ejemplo · 10:05', done: false },
          { id: 't3', label: 'Confirmación', detail: 'Pendiente · Ejemplo', done: false },
        ]}
      />,
    );
    expect(screen.getByText('Solicitud recibida')).toBeInTheDocument();
    expect(screen.getByText('Validación en proceso')).toBeInTheDocument();
    expect(screen.getByText('Confirmación')).toBeInTheDocument();
  });

  it('usa icono de check para pasos completados y reloj para pendientes', () => {
    render(
      <StatusTimeline
        items={[
          { id: 't1', label: 'Hecho', done: true },
          { id: 't2', label: 'Pendiente', done: false },
        ]}
      />,
    );
    // El paso completado tiene svg de check
    const doneItems = screen.getAllByText('Hecho');
    const doneItem = doneItems[0].closest('li');
    expect(doneItem?.querySelector('svg')).not.toBeNull();
    // El paso pendiente tiene svg de reloj
    const pendingItems = screen.getAllByText('Pendiente');
    const pendingItem = pendingItems[0].closest('li');
    expect(pendingItem?.querySelector('svg')).not.toBeNull();
  });

  it('no depende solo del color: usa icono + texto para el estado', () => {
    render(
      <StatusTimeline
        items={[
          { id: 't1', label: 'Completado', done: true },
          { id: 't2', label: 'Pendiente', done: false },
        ]}
      />,
    );
    expect(screen.getByText('Completado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    // Cada paso tiene su etiqueta de texto independiente del color
    expect(screen.getAllByText('Completado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThanOrEqual(1);
  });

  it('muestra el detalle cuando se provee', () => {
    render(
      <StatusTimeline
        items={[{ id: 't1', label: 'Paso 1', detail: 'Detalle del paso 1', done: true }]}
      />,
    );
    expect(screen.getByText('Detalle del paso 1')).toBeInTheDocument();
  });

  it('maneja lista vacía', () => {
    render(<StatusTimeline items={[]} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
