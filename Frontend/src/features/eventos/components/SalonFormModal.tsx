import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ImageUploader } from '@/components/ui/ImageUploader';
import {
  useCreateSalonMutation,
  useUpdateSalonMutation,
  useUploadSalonImageMutation,
  useRemoveSalonImageMutation,
} from '../hooks/useEventos';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import type { Salon } from '../types';
import { getApiErrorMessage } from '@/api/errors';

const salonSchema = z.object({
  sucursal_id: z.string().min(1, 'Debe seleccionar una sede'),
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  capacidad_maxima: z
    .string()
    .min(1, 'Ingrese la capacidad')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'La capacidad debe ser un número mayor a 0',
    }),
  tarifa_base: z
    .string()
    .min(1, 'Ingrese la tarifa base')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'La tarifa base debe ser un valor mayor o igual a 0',
    }),
  descripcion: z.string().optional(),
});

type SalonFormData = z.infer<typeof salonSchema>;

interface SalonFormModalProps {
  salon?: Salon | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SalonFormModal: React.FC<SalonFormModalProps> = ({ salon, isOpen, onClose }) => {
  const isEditing = Boolean(salon?.id);
  const sedesQuery = useSedesQuery();
  const sedes = sedesQuery.data ?? [];

  const createMutation = useCreateSalonMutation();
  const updateMutation = useUpdateSalonMutation();
  const uploadImageMutation = useUploadSalonImageMutation();
  const removeImageMutation = useRemoveSalonImageMutation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeMarked, setRemoveMarked] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [persistedId, setPersistedId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalonFormData>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      sucursal_id: salon?.sucursal_id ? String(salon.sucursal_id) : '',
      nombre: salon?.nombre ?? '',
      capacidad_maxima: salon?.capacidad_maxima ? String(salon.capacidad_maxima) : '',
      tarifa_base: salon?.tarifa_base !== undefined ? String(salon.tarifa_base) : '',
      descripcion: salon?.descripcion ?? '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setImageError(null);
      setSelectedFile(null);
      setRemoveMarked(false);
      setUploadProgress(0);
      setIsUploading(false);
      setPersistedId(salon?.id ?? null);
      reset({
        sucursal_id: salon?.sucursal_id ? String(salon.sucursal_id) : '',
        nombre: salon?.nombre ?? '',
        capacidad_maxima: salon?.capacidad_maxima ? String(salon.capacidad_maxima) : '',
        tarifa_base: salon?.tarifa_base !== undefined ? String(salon.tarifa_base) : '',
        descripcion: salon?.descripcion ?? '',
      });
    }
  }, [isOpen, salon, reset]);

  const onSubmit = async (data: SalonFormData) => {
    setErrorMessage(null);
    setImageError(null);

    let targetId: number;
    try {
      if (isEditing && salon?.id) {
        targetId = salon.id;
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
      } else if (persistedId) {
        targetId = persistedId;
        await updateMutation.mutateAsync({
          id: persistedId,
          data: {
            sucursal_id: Number(data.sucursal_id),
            nombre: data.nombre,
            capacidad_maxima: Number(data.capacidad_maxima),
            tarifa_base: Number(data.tarifa_base),
            descripcion: data.descripcion,
          },
        });
      } else {
        const created = await createMutation.mutateAsync({
          sucursal_id: Number(data.sucursal_id),
          nombre: data.nombre,
          capacidad_maxima: Number(data.capacidad_maxima),
          tarifa_base: Number(data.tarifa_base),
          descripcion: data.descripcion,
        });
        targetId = Number(created.id);
        setPersistedId(Number(created.id));
      }
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
      return;
    }

    if (removeMarked && (salon?.id || persistedId)) {
      try {
        await removeImageMutation.mutateAsync(targetId);
      } catch (_err: any) {
        setImageError('Se guardó el salón pero falló el retiro de la imagen.');
        return;
      }
    }

    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(10);
      try {
        await uploadImageMutation.mutateAsync({
          id: targetId,
          file: selectedFile,
          onProgress: (pct) => setUploadProgress(pct),
        });
      } catch (uploadErr: any) {
        setImageError(
          uploadErr?.message ||
            'Se guardaron los datos del salón, pero ocurrió un error al subir la fotografía a S3.',
        );
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Salón' : 'Nuevo Salón de Eventos'}
      closeLabel="Cerrar modal"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert tone="error">
            <span className="text-xs">{errorMessage}</span>
          </Alert>
        )}

        {imageError && (
          <Alert tone="warning">
            <span className="text-xs">{imageError}</span>
          </Alert>
        )}

        {/* Sede */}
        <div>
          <label htmlFor="salon-sucursal" className="field-label">
            Sede del hotel *
          </label>
          <select
            id="salon-sucursal"
            {...register('sucursal_id')}
            disabled={isSubmitting || isUploading}
            className="field-control"
          >
            <option value="">Seleccione una sede...</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          {errors.sucursal_id && (
            <p className="mt-1 text-xs text-rojo-600">{errors.sucursal_id.message}</p>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="salon-nombre" className="field-label">
            Nombre del salón *
          </label>
          <input
            id="salon-nombre"
            type="text"
            placeholder="Ej. Salón Atitlán Real"
            {...register('nombre')}
            disabled={isSubmitting || isUploading}
            className="field-control"
          />
          {errors.nombre && (
            <p className="mt-1 text-xs text-rojo-600">{errors.nombre.message}</p>
          )}
        </div>

        {/* Capacidad y Tarifa Base */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="salon-capacidad" className="field-label">
              Capacidad máxima *
            </label>
            <input
              id="salon-capacidad"
              type="number"
              min="1"
              placeholder="Ej. 150"
              {...register('capacidad_maxima')}
              disabled={isSubmitting || isUploading}
              className="field-control"
            />
            {errors.capacidad_maxima && (
              <p className="mt-1 text-xs text-rojo-600">{errors.capacidad_maxima.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="salon-tarifa" className="field-label">
              Tarifa base (GTQ) *
            </label>
            <input
              id="salon-tarifa"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 1500.00"
              {...register('tarifa_base')}
              disabled={isSubmitting || isUploading}
              className="field-control"
            />
            {errors.tarifa_base && (
              <p className="mt-1 text-xs text-rojo-600">{errors.tarifa_base.message}</p>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="salon-descripcion" className="field-label">
            Descripción y especificaciones (opcional)
          </label>
          <textarea
            id="salon-descripcion"
            rows={3}
            placeholder="Acondicionamiento, iluminación, áreas anexas..."
            {...register('descripcion')}
            disabled={isSubmitting || isUploading}
            className="field-control resize-none"
          />
        </div>

        {/* Fotografía principal en AWS S3 */}
        <div className="border-t border-neutro-200 pt-4">
          <ImageUploader
            label="Fotografía del salón"
            helpText="Formatos WebP, JPEG o PNG (hasta 5MB)"
            currentImageUrl={salon?.imagen_url}
            selectedFile={selectedFile}
            removeMarked={removeMarked}
            onFileSelect={(file) => {
              setSelectedFile(file);
              if (file) setRemoveMarked(false);
            }}
            onRemoveCurrent={() => {
              setRemoveMarked(true);
              setSelectedFile(null);
            }}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            error={imageError}
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutro-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting || isUploading
              ? isUploading
                ? 'Subiendo imagen a S3...'
                : 'Guardando datos...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear salón'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
