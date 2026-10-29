import React, { useState } from 'react';
import { useEscapeToClose } from '@/lib/useEscapeToClose';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateTerapeutaMutation, useUpdateTerapeutaMutation } from '../hooks/useBienestar';
import { terapeutaSchema, type TerapeutaFormValues } from '../schemas/bienestar.schemas';
import { textosBienestar } from '../textos';
import { ApiError } from '@/api/client/http';
import type { Terapeuta } from '../types';

interface TerapeutaFormModalProps {
  terapeuta?: Terapeuta | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TerapeutaFormModal: React.FC<TerapeutaFormModalProps> = ({
  terapeuta,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(terapeuta);
  const createMutation = useCreateTerapeutaMutation();
  const updateMutation = useUpdateTerapeutaMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TerapeutaFormValues>({
    resolver: zodResolver(terapeutaSchema),
    defaultValues: {
      nombre: terapeuta?.nombre ?? '',
      activo: terapeuta?.activo !== false,
    },
  });

  const onSubmit = async (values: TerapeutaFormValues) => {
    setErrorMessage(null);
    try {
      if (isEditing && terapeuta?.id) {
        await updateMutation.mutateAsync({
          id: terapeuta.id,
          data: {
            nombre: values.nombre,
            activo: values.activo,
          },
        });
      } else {
        await createMutation.mutateAsync({
          nombre: values.nombre,
          activo: values.activo,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Error al guardar los datos del terapeuta.');
      } else {
        setErrorMessage('Ocurrió un error inesperado al guardar el terapeuta.');
      }
    }
  };

  useEscapeToClose(onClose, isSubmitting);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-terapeuta-titulo"
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-neutro-400 hover:bg-neutro-100 hover:text-neutro-700 transition-colors"
          aria-label={textosBienestar.cancelar}
        >
          <X className="size-5" />
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">{textosBienestar.adminCitasSubtitulo}</p>
            <h2 id="modal-terapeuta-titulo" className="font-serif text-xl font-bold text-neutro-900">
              {isEditing ? textosBienestar.editarTerapeutaTitulo : textosBienestar.crearTerapeutaTitulo}
            </h2>
          </div>

          {errorMessage && (
            <div className="rounded-md bg-rojo-50 p-3 border border-rojo-200 flex items-start gap-2.5 text-xs text-rojo-700">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre-terapeuta" className="text-xs font-semibold text-neutro-700">
              {textosBienestar.campoNombreTerapeuta}
            </label>
            <input
              id="nombre-terapeuta"
              type="text"
              placeholder="Ej. Ana Pérez"
              {...register('nombre')}
              className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            />
            {errors.nombre && (
              <p className="text-xs text-rojo-600">{errors.nombre.message}</p>
            )}
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="terapeuta-activo"
              type="checkbox"
              {...register('activo')}
              className="size-4 rounded border-neutro-300 text-bronce-600 focus:ring-bronce-500"
            />
            <label htmlFor="terapeuta-activo" className="text-xs font-medium text-neutro-700">
              {textosBienestar.campoActivo}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              {textosBienestar.cancelar}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {textosBienestar.guardar}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
