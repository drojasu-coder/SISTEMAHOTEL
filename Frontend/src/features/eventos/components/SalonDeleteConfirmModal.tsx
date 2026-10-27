import React from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import type { Salon } from '../types';

interface SalonDeleteConfirmModalProps {
  salon: Salon | null;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SalonDeleteConfirmModal: React.FC<SalonDeleteConfirmModalProps> = ({
  salon,
  pending,
  error,
  onCancel,
  onConfirm,
}) => {
  const handleClose = () => {
    if (!pending) onCancel();
  };

  return (
    <Modal open={salon !== null} onClose={handleClose} title="Eliminar salón">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-neutro-700">
          {salon
            ? `¿Está seguro de que desea eliminar el salón ${salon.nombre}? Esta acción no se puede deshacer.`
            : null}
        </p>

        {error && (
          <Alert tone="error" title="No fue posible eliminar el salón">
            {error}
          </Alert>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            isLoading={pending}
            disabled={pending}
          >
            Eliminar salón
          </Button>
        </div>
      </div>
    </Modal>
  );
};
