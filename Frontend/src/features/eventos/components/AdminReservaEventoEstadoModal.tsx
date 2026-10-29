import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useUpdateReservaEventoEstadoMutation } from '../hooks/useEventos';
import { textosEventos, etiquetasEstadoReserva } from '../textos';
import type { ReservaEvento } from '../types';
import { getApiErrorMessage } from '@/api/errors';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

interface AdminReservaEventoEstadoModalProps {
  reserva: ReservaEvento;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminReservaEventoEstadoModal: React.FC<AdminReservaEventoEstadoModalProps> = ({
  reserva,
  isOpen,
  onClose,
}) => {
  const [nuevoEstado, setNuevoEstado] = useState<'confirmada' | 'cancelada' | 'finalizada'>('confirmada');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateEstadoMutation = useUpdateReservaEventoEstadoMutation();
  useEscapeToClose(onClose, updateEstadoMutation.isPending, isOpen);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await updateEstadoMutation.mutateAsync({
        id: reserva.id,
        data: { estado: nuevoEstado },
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cambiar-estado-titulo"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-neutro-400 hover:bg-neutro-100 hover:text-neutro-700 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="flex flex-col gap-1.5 mb-4">
          <p className="eyebrow">Reserva #{reserva.id}</p>
          <h2 id="modal-cambiar-estado-titulo" className="text-xl font-serif font-bold text-neutro-900">
            {textosEventos.modalCambiarEstadoTitulo}
          </h2>
          <p className="text-xs text-neutro-600">
            {textosEventos.modalCambiarEstadoDesc}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4">
            <Alert tone="error" title="No se pudo actualizar el estado">
              {errorMessage}
            </Alert>
          </div>
        )}

        <div className="mb-4 rounded-lg bg-neutro-50 p-3 text-xs border border-neutro-200">
          <span className="text-neutro-500 block">Estado actual:</span>
          <span className="font-semibold text-neutro-900">
            {etiquetasEstadoReserva[reserva.estado]?.label ?? reserva.estado}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          <div>
            <label htmlFor="nuevo_estado" className="block text-xs font-semibold text-neutro-700 mb-1">
              {textosEventos.nuevoEstadoLabel}
            </label>
            <select
              id="nuevo_estado"
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value as any)}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            >
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={updateEstadoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updateEstadoMutation.isPending}
            >
              {updateEstadoMutation.isPending
                ? textosEventos.actualizandoEstado
                : textosEventos.botonActualizarEstado}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
