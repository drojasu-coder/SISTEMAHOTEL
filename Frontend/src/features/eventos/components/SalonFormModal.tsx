import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useCreateSalonMutation, useUpdateSalonMutation } from '../hooks/useEventos';
import { salonFormSchema, type SalonFormData } from '../schemas/evento.schemas';
import type { Salon } from '../types';
import { getApiErrorMessage } from '@/api/errors';

interface SalonFormModalProps {
  salon?: Salon | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SalonFormModal: React.FC<SalonFormModalProps> = ({
  salon,
  isOpen,
  onClose,
}) => {
  const isEditing = Boolean(salon?.id);
  const createMutation = useCreateSalonMutation();
  const updateMutation = useUpdateSalonMutation();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SalonFormData>({
    resolver: zodResolver(salonFormSchema),
    defaultValues: {
      sucursal_id: salon?.sucursal_id ?? 1,
      nombre: salon?.nombre ?? '',
      capacidad_maxima: salon?.capacidad_maxima ?? 100,
      tarifa_base: Number(salon?.tarifa_base ?? 2000),
      descripcion: salon?.descripcion ?? '',
    },
  });

  useEffect(() => {
    if (salon) {
      reset({
        sucursal_id: salon.sucursal_id ?? 1,
        nombre: salon.nombre ?? '',
        capacidad_maxima: salon.capacidad_maxima ?? 100,
        tarifa_base: Number(salon.tarifa_base ?? 2000),
        descripcion: salon.descripcion ?? '',
      });
    } else {
      reset({
        sucursal_id: 1,
        nombre: '',
        capacidad_maxima: 100,
        tarifa_base: 2000,
        descripcion: '',
      });
    }
    setErrorMessage(null);
  }, [salon, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: SalonFormData) => {
    setErrorMessage(null);
    try {
      if (isEditing && salon?.id) {
        await updateMutation.mutateAsync({
          id: salon.id,
          data: {
            sucursal_id: Number(data.sucursal_id),
            nombre: data.nombre,
            capacidad_maxima: Number(data.capacidad_maxima),
            tarifa_base: Number(data.tarifa_base),
            descripcion: data.descripcion,
          },
        });
      } else {
        await createMutation.mutateAsync({
          sucursal_id: Number(data.sucursal_id),
          nombre: data.nombre,
          capacidad_maxima: Number(data.capacidad_maxima),
          tarifa_base: Number(data.tarifa_base),
          descripcion: data.descripcion,
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
      aria-labelledby="modal-salon-titulo"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-neutro-400 hover:bg-neutro-100 hover:text-neutro-700 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="flex flex-col gap-1.5 mb-4">
          <h2 id="modal-salon-titulo" className="text-xl font-serif font-bold text-neutro-900">
            {isEditing ? 'Editar Salón' : 'Nuevo Salón de Eventos'}
          </h2>
          <p className="text-xs text-neutro-600">
            Configure los datos de capacidad y tarifa base del salón en quetzales.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4">
            <Alert tone="error" title="Error al guardar salón">
              {errorMessage}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-sm">
          <div>
            <label htmlFor="sucursal_id" className="block text-xs font-semibold text-neutro-700 mb-1">
              ID Sede / Sucursal
            </label>
            <input
              type="number"
              id="sucursal_id"
              min={1}
              {...register('sucursal_id', { valueAsNumber: true })}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            />
            {errors.sucursal_id && (
              <p className="mt-1 text-xs text-error-600">{errors.sucursal_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="nombre" className="block text-xs font-semibold text-neutro-700 mb-1">
              Nombre del salón
            </label>
            <input
              type="text"
              id="nombre"
              {...register('nombre')}
              placeholder="Ej. Gran Salón Ceiba"
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-error-600">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="capacidad_maxima" className="block text-xs font-semibold text-neutro-700 mb-1">
                Capacidad máxima
              </label>
              <input
                type="number"
                id="capacidad_maxima"
                min={1}
                {...register('capacidad_maxima', { valueAsNumber: true })}
                className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
              />
              {errors.capacidad_maxima && (
                <p className="mt-1 text-xs text-error-600">{errors.capacidad_maxima.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="tarifa_base" className="block text-xs font-semibold text-neutro-700 mb-1">
                Tarifa base (GTQ)
              </label>
              <input
                type="number"
                id="tarifa_base"
                step="0.01"
                min={0}
                {...register('tarifa_base', { valueAsNumber: true })}
                className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
              />
              {errors.tarifa_base && (
                <p className="mt-1 text-xs text-error-600">{errors.tarifa_base.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-xs font-semibold text-neutro-700 mb-1">
              Descripción detallada
            </label>
            <textarea
              id="descripcion"
              rows={3}
              {...register('descripcion')}
              placeholder="Características, vistas, equipamiento..."
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            />
            {errors.descripcion && (
              <p className="mt-1 text-xs text-error-600">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear salón'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
