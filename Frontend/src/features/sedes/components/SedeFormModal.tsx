import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/api/client/http';
import { getApiErrorMessage, getFieldErrors } from '@/api/errors';
import { es } from '@/i18n/es';
import {
  sedeFormSchema,
  sanitizeSedePayload,
  type SedeFormData,
} from '../schemas/sedeSchema';
import { useCreateSedeMutation, useUpdateSedeMutation } from '../hooks/useSedes';
import type { Sucursal } from '../types';

interface SedeFormModalProps {
  open: boolean;
  onClose: () => void;
  sede: Sucursal | null;
  onSuccess: (message: string) => void;
}

export const SedeFormModal: React.FC<SedeFormModalProps> = ({
  open,
  onClose,
  sede,
  onSuccess,
}) => {
  const isEditing = Boolean(sede);
  const title = isEditing ? es.sedes.editarTitulo : es.sedes.crearTitulo;
  const description = isEditing ? es.sedes.editarDescripcion : es.sedes.crearDescripcion;

  const createMutation = useCreateSedeMutation();
  const updateMutation = useUpdateSedeMutation();

  const activeMutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SedeFormData>({
    resolver: zodResolver(sedeFormSchema),
    defaultValues: {
      nombre: '',
      ciudad: '',
      direccion: '',
      telefono: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (sede) {
        reset({
          nombre: sede.nombre ?? '',
          ciudad: sede.ciudad ?? '',
          direccion: sede.direccion ?? '',
          telefono: sede.telefono ?? '',
        });
      } else {
        reset({
          nombre: '',
          ciudad: '',
          direccion: '',
          telefono: '',
        });
      }
      createMutation.reset();
      updateMutation.reset();
    }
  }, [open, sede, reset]);

  const onSubmit = async (data: SedeFormData) => {
    const payload = sanitizeSedePayload(data);
    try {
      if (isEditing && sede) {
        await updateMutation.mutateAsync({
          id: sede.id,
          data: payload,
        });
        onSuccess(es.sedes.actualizadaExito);
      } else {
        await createMutation.mutateAsync(payload);
        onSuccess(es.sedes.creadaExito);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        const fieldErrors = getFieldErrors(err);
        for (const [field, msg] of Object.entries(fieldErrors)) {
          if (field in sedeFormSchema.shape) {
            setError(field as keyof SedeFormData, { message: msg });
          }
        }
      }
    }
  };

  const isPending = activeMutation.isPending || isSubmitting;

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {activeMutation.isError && (
          <Alert tone="error">
            {getApiErrorMessage(activeMutation.error)}
          </Alert>
        )}

        <Input
          label={es.sedes.nombre}
          type="text"
          placeholder={es.sedes.nombrePlaceholder}
          error={errors.nombre?.message}
          disabled={isPending}
          {...register('nombre')}
        />

        <Input
          label={es.sedes.ciudad}
          labelSuffix={es.comunes.opcional}
          type="text"
          placeholder={es.sedes.ciudadPlaceholder}
          error={errors.ciudad?.message}
          disabled={isPending}
          {...register('ciudad')}
        />

        <Input
          label={es.sedes.direccion}
          labelSuffix={es.comunes.opcional}
          type="text"
          placeholder={es.sedes.direccionPlaceholder}
          error={errors.direccion?.message}
          disabled={isPending}
          {...register('direccion')}
        />

        <Input
          label={es.sedes.telefono}
          labelSuffix={es.comunes.opcional}
          type="tel"
          placeholder={es.sedes.telefonoPlaceholder}
          error={errors.telefono?.message}
          disabled={isPending}
          {...register('telefono')}
        />

        <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutro-200 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            {es.sedes.cancelar}
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isPending ? es.sedes.guardando : es.sedes.guardar}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
