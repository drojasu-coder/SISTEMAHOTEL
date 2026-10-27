import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { es } from '@/i18n/es';
import { useToggleSedeMutation } from '../hooks/useSedes';
import type { Sucursal } from '../types';

interface SedeStatusDialogProps {
  open: boolean;
  onClose: () => void;
  sede: Sucursal | null;
  onSuccess: (message: string) => void;
}

export const SedeStatusDialog: React.FC<SedeStatusDialogProps> = ({
  open,
  onClose,
  sede,
  onSuccess,
}) => {
  const toggleMutation = useToggleSedeMutation();

  if (!sede) return null;

  const willActivate = !sede.activa;
  const title = willActivate ? es.sedes.activarTitulo : es.sedes.desactivarTitulo;
  const message = willActivate ? es.sedes.activarMensaje : es.sedes.desactivarMensaje;
  const confirmText = willActivate
    ? es.sedes.confirmarActivar
    : es.sedes.confirmarDesactivar;

  const handleConfirm = async () => {
    try {
      await toggleMutation.mutateAsync({
        id: sede.id,
        activa: willActivate,
      });
      onSuccess(es.sedes.estadoCambiadoExito);
      onClose();
    } catch {
      // Error handled by toggleMutation.isError and Alert
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={`Sede: ${sede.nombre}`}
    >
      <div className="flex flex-col gap-5">
        {toggleMutation.isError && (
          <Alert tone="error">
            {getApiErrorMessage(toggleMutation.error)}
          </Alert>
        )}

        <p className="text-sm text-neutro-700 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 border-t border-neutro-200 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={toggleMutation.isPending}
          >
            {es.sedes.cancelar}
          </Button>
          <Button
            type="button"
            variant={willActivate ? 'primary' : 'danger'}
            onClick={handleConfirm}
            isLoading={toggleMutation.isPending}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
