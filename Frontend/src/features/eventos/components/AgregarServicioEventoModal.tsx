import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import {
  useServiciosEventoQuery,
  useAddServicioToReservaMutation,
} from '../hooks/useEventos';
import {
  addReservaEventoServicioFormSchema,
  type AddReservaEventoServicioFormData,
} from '../schemas/evento.schemas';
import { textosEventos, formatearGTQ } from '../textos';
import { getApiErrorMessage } from '@/api/errors';

interface AgregarServicioEventoModalProps {
  reservaId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const AgregarServicioEventoModal: React.FC<AgregarServicioEventoModalProps> = ({
  reservaId,
  isOpen,
  onClose,
}) => {
  const serviciosQuery = useServiciosEventoQuery();
  const addMutation = useAddServicioToReservaMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const servicios = serviciosQuery.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddReservaEventoServicioFormData>({
    resolver: zodResolver(addReservaEventoServicioFormSchema),
    defaultValues: {
      servicio_evento_id: servicios[0]?.id ?? 0,
      cantidad: 1,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: AddReservaEventoServicioFormData) => {
    setErrorMessage(null);
    try {
      await addMutation.mutateAsync({
        reservaId,
        data: {
          servicio_evento_id: Number(data.servicio_evento_id),
          cantidad: Number(data.cantidad),
        },
      });
      reset();
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
      aria-labelledby="modal-agregar-servicio-titulo"
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
          <h2 id="modal-agregar-servicio-titulo" className="text-xl font-serif font-bold text-neutro-900">
            {textosEventos.modalAgregarServicioTitulo}
          </h2>
          <p className="text-xs text-neutro-600">
            {textosEventos.modalAgregarServicioDesc}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4">
            <Alert tone="error" title="Error al agregar servicio">
              {errorMessage}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-sm">
          <div>
            <label htmlFor="servicio_evento_id" className="block text-xs font-semibold text-neutro-700 mb-1">
              {textosEventos.campoServicio}
            </label>
            <select
              id="servicio_evento_id"
              {...register('servicio_evento_id', { valueAsNumber: true })}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {formatearGTQ(s.precio)}
                </option>
              ))}
            </select>
            {errors.servicio_evento_id && (
              <p className="mt-1 text-xs text-error-600">{errors.servicio_evento_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="cantidad" className="block text-xs font-semibold text-neutro-700 mb-1">
              {textosEventos.campoCantidad}
            </label>
            <input
              type="number"
              id="cantidad"
              min={1}
              {...register('cantidad', { valueAsNumber: true })}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            />
            {errors.cantidad && (
              <p className="mt-1 text-xs text-error-600">{errors.cantidad.message}</p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting || addMutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || addMutation.isPending || servicios.length === 0}
            >
              {isSubmitting || addMutation.isPending
                ? textosEventos.agregandoServicio
                : textosEventos.botonAgregarServicio}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
