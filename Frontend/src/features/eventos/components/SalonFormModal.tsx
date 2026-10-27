import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
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
  const sedesQuery = useSedesQuery();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<SalonFormData>({
    resolver: zodResolver(salonFormSchema),
    defaultValues: {
      sucursal_id: salon?.sucursal_id,
      nombre: salon?.nombre ?? '',
      capacidad_maxima: salon?.capacidad_maxima ?? 100,
      tarifa_base: Number(salon?.tarifa_base ?? 2000),
      descripcion: salon?.descripcion ?? '',
    },
  });

  useEffect(() => {
    if (salon) {
      reset({
        sucursal_id: salon.sucursal_id,
        nombre: salon.nombre ?? '',
        capacidad_maxima: salon.capacidad_maxima ?? 100,
        tarifa_base: Number(salon.tarifa_base ?? 2000),
        descripcion: salon.descripcion ?? '',
      });
    } else {
      reset({
        sucursal_id: undefined,
        nombre: '',
        capacidad_maxima: 100,
        tarifa_base: 2000,
        descripcion: '',
      });
    }
    setErrorMessage(null);
  }, [salon, reset]);

  useEffect(() => {
    if (
      salon?.sucursal_id !== undefined
      && sedesQuery.data?.some((sede) => sede.id === salon.sucursal_id)
    ) {
      setValue('sucursal_id', salon.sucursal_id);
    }
  }, [salon?.sucursal_id, sedesQuery.data, setValue]);

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
  const sedes = sedesQuery.data ?? [];
  const sedesNoDisponibles = sedesQuery.isError || (!sedesQuery.isPending && sedes.length === 0);
  const submitDisabled = isPending || sedesQuery.isPending || sedesNoDisponibles;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Salón' : 'Nuevo Salón de Eventos'}
      description="Configure la sede, capacidad y tarifa base del salón en quetzales."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-sm">
        {errorMessage && (
          <Alert tone="error" title="Error al guardar salón">
            {errorMessage}
          </Alert>
        )}

        {sedesQuery.isError && (
          <Alert tone="error" title="Catálogo de sedes no disponible">
            {getApiErrorMessage(sedesQuery.error)}
          </Alert>
        )}

        {!sedesQuery.isPending && !sedesQuery.isError && sedes.length === 0 && (
          <Alert tone="warning" title="No hay sedes disponibles">
            No es posible guardar un salón hasta que exista una sede disponible.
          </Alert>
        )}

        <Select
          label="Sede / Sucursal"
          error={errors.sucursal_id?.message}
          loading={sedesQuery.isPending}
          disabled={isPending || sedesNoDisponibles}
          {...register('sucursal_id', { valueAsNumber: true })}
        >
          <option value="">Seleccione una sede</option>
          {sedes.map((sede) => (
            <option key={sede.id} value={String(sede.id)}>
              {sede.nombre}
            </option>
          ))}
        </Select>

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
          <Button type="submit" variant="primary" disabled={submitDisabled}>
            {isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear salón'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
