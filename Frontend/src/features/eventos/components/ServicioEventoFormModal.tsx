import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import {
  useCreateServicioEventoMutation,
  useUpdateServicioEventoMutation,
} from '../hooks/useEventos';
import {
  servicioEventoFormSchema,
  type ServicioEventoFormData,
} from '../schemas/evento.schemas';
import type { ServicioEvento } from '../types';
import { getApiErrorMessage } from '@/api/errors';

interface ServicioEventoFormModalProps {
  servicio?: ServicioEvento | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServicioEventoFormModal: React.FC<ServicioEventoFormModalProps> = ({
  servicio,
  isOpen,
  onClose,
}) => {
  const isEditing = Boolean(servicio?.id);
  const createMutation = useCreateServicioEventoMutation();
  const updateMutation = useUpdateServicioEventoMutation();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ServicioEventoFormData>({
    resolver: zodResolver(servicioEventoFormSchema),
    defaultValues: {
      nombre: servicio?.nombre ?? '',
      precio: Number(servicio?.precio ?? 150),
    },
  });

  useEffect(() => {
    if (servicio) {
      reset({
        nombre: servicio.nombre ?? '',
        precio: Number(servicio.precio ?? 150),
      });
    } else {
      reset({
        nombre: '',
        precio: 150,
      });
    }
    setErrorMessage(null);
  }, [servicio, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ServicioEventoFormData) => {
    setErrorMessage(null);
    try {
      if (isEditing && servicio?.id) {
        await updateMutation.mutateAsync({
          id: servicio.id,
          data: {
            nombre: data.nombre,
            precio: Number(data.precio),
          },
        });
      } else {
        await createMutation.mutateAsync({
          nombre: data.nombre,
          precio: Number(data.precio),
        });
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-servicio-evento-titulo"
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
          <h2 id="modal-servicio-evento-titulo" className="text-xl font-serif font-bold text-neutro-900">
            {isEditing ? 'Editar Servicio de Evento' : 'Nuevo Servicio de Evento'}
          </h2>
          <p className="text-xs text-neutro-600">
            Configure la opción de banquete, mobiliario o equipo para eventos.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4">
            <Alert tone="error" title="Error al guardar servicio">
              {errorMessage}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-sm">
          <div>
            <label htmlFor="nombre" className="block text-xs font-semibold text-neutro-700 mb-1">
              Nombre del servicio
            </label>
            <input
              type="text"
              id="nombre"
              {...register('nombre')}
              placeholder="Ej. Catering Gourmet 3 Tiempos"
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-error-600">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="precio" className="block text-xs font-semibold text-neutro-700 mb-1">
              Precio unitario (GTQ)
            </label>
            <input
              type="number"
              id="precio"
              step="0.01"
              min={0}
              {...register('precio', { valueAsNumber: true })}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            />
            {errors.precio && (
              <p className="mt-1 text-xs text-error-600">{errors.precio.message}</p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
