import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { ImageUploader } from '@/components/ui/ImageUploader';
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
  useUploadRestauranteImageMutation,
  useRemoveRestauranteImageMutation,
} from '../hooks/useSedes';
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
  const uploadRestauranteMutation = useUploadRestauranteImageMutation();
  const removeRestauranteMutation = useRemoveRestauranteImageMutation();

  const activeMutation = isEditing ? updateMutation : createMutation;

  // Estado para la fotografía de portada
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeMarked, setRemoveMarked] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);

  // Estado para la fotografía de restaurante
  const [selectedRestauranteFile, setSelectedRestauranteFile] = useState<File | null>(null);
  const [removeRestauranteMarked, setRemoveRestauranteMarked] = useState(false);
  const [isUploadingRestauranteImage, setIsUploadingRestauranteImage] = useState(false);
  const [uploadRestauranteProgress, setUploadRestauranteProgress] = useState(0);
  const [restauranteImageError, setRestauranteImageError] = useState<string | null>(null);

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

      setSelectedRestauranteFile(null);
      setRemoveRestauranteMarked(false);
      setIsUploadingRestauranteImage(false);
      setUploadRestauranteProgress(0);
      setRestauranteImageError(null);

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
      uploadRestauranteMutation.reset();
      removeRestauranteMutation.reset();
    }
  }, [open, sede, reset]);

  const onSubmit = async (data: SedeFormData) => {
    setImageError(null);
    setRestauranteImageError(null);
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
        targetSedeId = persistedSedeId;
        await updateMutation.mutateAsync({
          id: persistedSedeId,
          data: payload,
        });
      } else {
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

    // Retiro de portada si fue marcada
    if (removeMarked && (sede?.id || persistedSedeId)) {
      try {
        await removeImageMutation.mutateAsync(targetSedeId);
      } catch (err: any) {
        setImageError('No fue posible retirar la imagen de portada.');
        return;
      }
    }

    // Subida de nueva portada
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
            'Error al subir la fotografía de portada. Los datos fueron guardados; puede reintentar.',
        );
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    // Retiro de restaurante si fue marcado
    if (removeRestauranteMarked && (sede?.id || persistedSedeId)) {
      try {
        await removeRestauranteMutation.mutateAsync(targetSedeId);
      } catch (err: any) {
        setRestauranteImageError('No fue posible retirar la imagen del restaurante.');
        return;
      }
    }

    // Subida de nuevo restaurante
    if (selectedRestauranteFile) {
      setIsUploadingRestauranteImage(true);
      setUploadRestauranteProgress(10);
      try {
        await uploadRestauranteMutation.mutateAsync({
          id: targetSedeId,
          file: selectedRestauranteFile,
          onProgress: (pct) => setUploadRestauranteProgress(pct),
        });
      } catch (err: any) {
        setIsUploadingRestauranteImage(false);
        setRestauranteImageError(
          err?.message ||
            'Error al subir la fotografía del restaurante. Los datos fueron guardados; puede reintentar.',
        );
        return;
      } finally {
        setIsUploadingRestauranteImage(false);
      }
    }

    onSuccess(isEditing ? es.sedes.actualizadaExito : es.sedes.creadaExito);
    onClose();
  };

  const isPending =
    activeMutation.isPending ||
    uploadImageMutation.isPending ||
    removeImageMutation.isPending ||
    uploadRestauranteMutation.isPending ||
    removeRestauranteMutation.isPending ||
    isUploadingImage ||
    isUploadingRestauranteImage ||
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

        {/* Fotografía de portada */}
        <ImageUploader
          label={es.sedes.fotografia}
          currentImageUrl={sede?.imagen_url}
          currentImageLabel={es.sedes.fotografiaActual}
          selectedFile={selectedFile}
          removeMarked={removeMarked}
          onFileSelect={setSelectedFile}
          onRemoveCurrent={() => setRemoveMarked((prev) => !prev)}
          disabled={isPending}
          isUploading={isUploadingImage}
          uploadProgress={uploadProgress}
          error={imageError}
        />

        {/* Fotografía de restaurante */}
        <ImageUploader
          label="Fotografía del restaurante de la sede"
          currentImageUrl={sede?.restaurante_imagen_url}
          currentImageLabel="Fotografía actual del restaurante"
          selectedFile={selectedRestauranteFile}
          removeMarked={removeRestauranteMarked}
          onFileSelect={setSelectedRestauranteFile}
          onRemoveCurrent={() => setRemoveRestauranteMarked((prev) => !prev)}
          disabled={isPending}
          isUploading={isUploadingRestauranteImage}
          uploadProgress={uploadRestauranteProgress}
          error={restauranteImageError}
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
