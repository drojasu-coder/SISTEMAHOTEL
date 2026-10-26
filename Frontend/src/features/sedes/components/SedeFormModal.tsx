import React, { useEffect, useState } from 'react';
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
import {
  useCreateSedeMutation,
  useUpdateSedeMutation,
  useUploadSedeImageMutation,
  useRemoveSedeImageMutation,
} from '../hooks/useSedes';
import { SedeImageUploader } from './SedeImageUploader';
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
  const uploadImageMutation = useUploadSedeImageMutation();
  const removeImageMutation = useRemoveSedeImageMutation();

  const activeMutation = isEditing ? updateMutation : createMutation;

  // Estado para la fotografía de portada
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeMarked, setRemoveMarked] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const [persistedSedeId, setPersistedSedeId] = useState<number | null>(null);

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
      setSelectedFile(null);
      setRemoveMarked(false);
      setIsUploadingImage(false);
      setUploadProgress(0);
      setImageError(null);
      setPersistedSedeId(null);

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
      uploadImageMutation.reset();
      removeImageMutation.reset();
    }
  }, [open, sede, reset]);

  const onSubmit = async (data: SedeFormData) => {
    setImageError(null);
    const payload = sanitizeSedePayload(data);

    let targetSedeId: number;
    try {
      if (isEditing && sede) {
        targetSedeId = sede.id;
        await updateMutation.mutateAsync({
          id: sede.id,
          data: payload,
        });
      } else if (persistedSedeId) {
        // La sede ya fue creada previamente en este mismo formulario (reintento de imagen)
        targetSedeId = persistedSedeId;
        await updateMutation.mutateAsync({
          id: persistedSedeId,
          data: payload,
        });
      } else {
        // Primera creación: obtener el ID antes de subir la imagen
        const created = await createMutation.mutateAsync(payload);
        targetSedeId = created.id;
        setPersistedSedeId(created.id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        const fieldErrors = getFieldErrors(err);
        for (const [field, msg] of Object.entries(fieldErrors)) {
          if (field in sedeFormSchema.shape) {
            setError(field as keyof SedeFormData, { message: msg });
          }
        }
      }
      return;
    }

    // 2. Si se marcó quitar la imagen existente
    if (removeMarked && (sede?.id || persistedSedeId)) {
      try {
        await removeImageMutation.mutateAsync(targetSedeId);
      } catch (err: any) {
        setImageError('No fue posible retirar la imagen actual.');
        return;
      }
    }

    // 3. Si hay un nuevo archivo seleccionado, subirlo
    if (selectedFile) {
      setIsUploadingImage(true);
      setUploadProgress(10);
      try {
        await uploadImageMutation.mutateAsync({
          id: targetSedeId,
          file: selectedFile,
          onProgress: (pct) => setUploadProgress(pct),
        });
      } catch (err: any) {
        setIsUploadingImage(false);
        setImageError(
          err?.message ||
            'Error al subir la fotografía. La información de la sede fue guardada; puede reintentar la subida.',
        );
        return; // Permite reintentar la imagen sin duplicar la sede
      } finally {
        setIsUploadingImage(false);
      }
    }

    onSuccess(isEditing ? es.sedes.actualizadaExito : es.sedes.creadaExito);
    onClose();
  };

  const isPending =
    activeMutation.isPending ||
    uploadImageMutation.isPending ||
    removeImageMutation.isPending ||
    isUploadingImage ||
    isSubmitting;

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

        {/* Componente de carga y gestión de fotografía principal */}
        <SedeImageUploader
          currentImageUrl={sede?.imagen_url}
          onFileSelect={(file) => {
            setSelectedFile(file);
            setRemoveMarked(false);
          }}
          onRemoveCurrent={() => setRemoveMarked((prev) => !prev)}
          selectedFile={selectedFile}
          removeMarked={removeMarked}
          disabled={isPending}
          isUploading={isUploadingImage}
          uploadProgress={uploadProgress}
          error={imageError}
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
