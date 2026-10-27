import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCreateServicioSpaMutation, useUpdateServicioSpaMutation } from '../hooks/useBienestar';
import { servicioSpaSchema, type ServicioSpaFormValues } from '../schemas/bienestar.schemas';
import { textosBienestar } from '../textos';
import { ApiError } from '@/api/client/http';
import type { ServicioBienestar } from '../types';

interface ServicioSpaFormModalProps {
  servicio?: ServicioBienestar | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ServicioSpaFormModal: React.FC<ServicioSpaFormModalProps> = ({
  servicio,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(servicio);
  const createMutation = useCreateServicioSpaMutation();
  const updateMutation = useUpdateServicioSpaMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServicioSpaFormValues>({
    resolver: zodResolver(servicioSpaSchema),
    defaultValues: {
      nombre: servicio?.nombre ?? '',
      duracion_minutos: servicio?.duracion_minutos ?? 60,
      precio: servicio?.precio !== undefined ? Number(servicio.precio) : 350,
    },
  });

  const onSubmit = async (values: ServicioSpaFormValues) => {
    setErrorMessage(null);
    try {
      if (isEditing && servicio?.id) {
        await updateMutation.mutateAsync({
          id: servicio.id,
          data: {
            nombre: values.nombre,
            duracion_minutos: values.duracion_minutos,
            precio: values.precio,
          },
        });
      } else {
        await createMutation.mutateAsync({
          nombre: values.nombre,
          duracion_minutos: values.duracion_minutos,
          precio: values.precio,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Error al guardar el servicio de bienestar.');
      } else {
        setErrorMessage('Ocurrió un error inesperado al guardar el servicio.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-servicio-spa-titulo"
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
            <h2 id="modal-servicio-spa-titulo" className="font-serif text-xl font-bold text-neutro-900">
              {isEditing ? textosBienestar.editarServicioTitulo : textosBienestar.crearServicioTitulo}
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
            <label htmlFor="nombre-servicio" className="text-xs font-semibold text-neutro-700">
              {textosBienestar.campoNombreServicio}
            </label>
            <input
              id="nombre-servicio"
              type="text"
              placeholder="Ej. Masaje con piedras calientes"
              {...register('nombre')}
              className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            />
            {errors.nombre && (
              <p className="text-xs text-rojo-600">{errors.nombre.message}</p>
            )}
          </div>

          {/* Duración */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="duracion-servicio" className="text-xs font-semibold text-neutro-700">
              {textosBienestar.campoDuracionMinutos}
            </label>
            <input
              id="duracion-servicio"
              type="number"
              min={1}
              step={1}
              {...register('duracion_minutos', { valueAsNumber: true })}
              className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            />
            {errors.duracion_minutos && (
              <p className="text-xs text-rojo-600">{errors.duracion_minutos.message}</p>
            )}
          </div>

          {/* Precio */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="precio-servicio" className="text-xs font-semibold text-neutro-700">
              {textosBienestar.campoPrecio}
            </label>
            <input
              id="precio-servicio"
              type="number"
              min={0}
              step="0.01"
              {...register('precio', { valueAsNumber: true })}
              className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            />
            {errors.precio && (
              <p className="text-xs text-rojo-600">{errors.precio.message}</p>
            )}
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
