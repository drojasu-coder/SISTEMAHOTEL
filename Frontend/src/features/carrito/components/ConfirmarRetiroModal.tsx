import React from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Feedback';
import type { CarritoItem } from '../types';
import {
  descripcionItem,
  esItemHabitacion,
  textosCarrito,
} from '../textos';

interface ConfirmarRetiroModalProps {
  item: CarritoItem | null;
  pendiente: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}

/**
 * Confirmación explícita antes de retirar un artículo.
 *
 * Para habitaciones recuerda que la reserva no se cancela: esta pantalla solo
 * elimina el artículo del carrito.
 */
export const ConfirmarRetiroModal: React.FC<ConfirmarRetiroModalProps> = ({
  item,
  pendiente,
  onCancelar,
  onConfirmar,
}) => (
  <Modal
    open={item !== null}
    onClose={onCancelar}
    title={textosCarrito.confirmarTitulo}
    description={
      item
        ? textosCarrito.confirmarDescripcion(descripcionItem(item))
        : undefined
    }
  >
    <div className="flex flex-col gap-5">
      <Alert tone="warning">
        {item && esItemHabitacion(item)
          ? textosCarrito.confirmarHabitacion
          : textosCarrito.confirmarOtro}
      </Alert>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancelar}
          disabled={pendiente}
        >
          {textosCarrito.cancelar}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirmar}
          isLoading={pendiente}
          disabled={pendiente}
        >
          {textosCarrito.confirmarRetirar}
        </Button>
      </div>
    </div>
  </Modal>
);
