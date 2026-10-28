import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmActionModal } from './workbench';

describe('ConfirmActionModal', () => {
  const props = {
    open: true,
    title: 'Eliminar turno',
    description: 'Esta acción no se puede deshacer.',
    target: 'Turno #12',
    confirmLabel: 'Eliminar definitivamente',
  };

  it('presenta el registro y confirma solo tras pulsar la acción', () => {
    const onConfirm = vi.fn();
    render(<ConfirmActionModal {...props} onConfirm={onConfirm} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Eliminar turno' })).toBeInTheDocument();
    expect(screen.getByText('Turno #12')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('permite cancelar sin ejecutar cambios', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmActionModal {...props} onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('evita acciones dobles cuando el servidor procesa', () => {
    const onConfirm = vi.fn();
    render(<ConfirmActionModal {...props} busy onConfirm={onConfirm} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Procesando...' })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
