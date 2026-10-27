import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ApiError } from "@/api/client/http";
import { getApiErrorMessage, getFieldErrors } from "@/api/errors";
import { textosAmenidades } from "../textos";
import {
  amenidadFormSchema,
  sanitizeCreateAmenidad,
  sanitizeUpdateAmenidad,
  CAMPOS_AMENIDAD,
  type AmenidadFormData,
} from "../schemas/amenidadSchema";
import {
  useCreateAmenidadMutation,
  useUpdateAmenidadMutation,
  useUploadAmenidadImageMutation,
  useRemoveAmenidadImageMutation,
} from "../hooks/useAmenidades";
import type { Amenidad } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface AmenidadFormModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  amenidad?: Amenidad | null;
  initialData?: Amenidad | null;
  sedes: Sucursal[];
  onSuccess: (message: string) => void;
}

export const AmenidadFormModal: React.FC<AmenidadFormModalProps> = ({
  open: propOpen,
  isOpen,
  onClose,
  amenidad: propAmenidad,
  initialData,
  sedes,
  onSuccess,
}) => {
  const open = propOpen ?? isOpen ?? false;
  const amenidad = propAmenidad ?? initialData ?? null;

  const isEditing = Boolean(amenidad);
  const title = isEditing
    ? textosAmenidades.editarTitulo
    : textosAmenidades.crearTitulo;
  const description = isEditing
    ? textosAmenidades.editarDescripcion
    : textosAmenidades.crearDescripcion;

  const createMutation = useCreateAmenidadMutation();
  const updateMutation = useUpdateAmenidadMutation();
  const uploadImageMutation = useUploadAmenidadImageMutation();
  const removeImageMutation = useRemoveAmenidadImageMutation();
  const activeMutation = isEditing ? updateMutation : createMutation;

  // Manejo de imagen de la amenidad
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeMarked, setRemoveMarked] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const [persistedId, setPersistedId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AmenidadFormData>({
    resolver: zodResolver(amenidadFormSchema),
    defaultValues: {
      sucursal_id: "",
      nombre: "",
      aforo_maximo: "",
    },
  });

  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setRemoveMarked(false);
      setIsUploadingImage(false);
      setUploadProgress(0);
      setImageError(null);
      setPersistedId(null);

      if (amenidad) {
        reset({
          sucursal_id: String(amenidad.sucursal_id),
          nombre: amenidad.nombre ?? "",
          aforo_maximo:
            amenidad.aforo_maximo !== undefined && amenidad.aforo_maximo !== null
              ? String(amenidad.aforo_maximo)
              : "",
        });
      } else {
        reset({
          sucursal_id: sedes.length > 0 ? String(sedes[0].id) : "",
          nombre: "",
          aforo_maximo: "",
        });
      }
      createMutation.reset();
      updateMutation.reset();
      uploadImageMutation.reset();
      removeImageMutation.reset();
    }
  }, [open, amenidad, sedes, reset]);

  const onSubmit = async (data: AmenidadFormData) => {
    setImageError(null);
    let targetId: number;

    try {
      if (isEditing && amenidad) {
        targetId = amenidad.id;
        const payload = sanitizeUpdateAmenidad(data);
        await updateMutation.mutateAsync({
          id: amenidad.id,
          data: payload,
        });
      } else if (persistedId) {
        targetId = persistedId;
        const payload = sanitizeUpdateAmenidad(data);
        await updateMutation.mutateAsync({
          id: persistedId,
          data: payload,
        });
      } else {
        const payload = sanitizeCreateAmenidad(data);
        const created = await createMutation.mutateAsync(payload);
        targetId = created.id;
        setPersistedId(created.id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        const fieldErrors = getFieldErrors(err);
        for (const [field, msg] of Object.entries(fieldErrors)) {
          if (CAMPOS_AMENIDAD.includes(field as any)) {
            setError(field as keyof AmenidadFormData, { message: msg });
          }
        }
      }
      return;
    }

    if (removeMarked && (amenidad?.id || persistedId)) {
      try {
        await removeImageMutation.mutateAsync(targetId);
      } catch (err: any) {
        setImageError("No fue posible retirar la imagen actual.");
        return;
      }
    }

    if (selectedFile) {
      setIsUploadingImage(true);
      setUploadProgress(10);
      try {
        await uploadImageMutation.mutateAsync({
          id: targetId,
          file: selectedFile,
          onProgress: (pct) => setUploadProgress(pct),
        });
      } catch (err: any) {
        setIsUploadingImage(false);
        setImageError(
          err?.message ||
            "Error al subir la imagen de la amenidad. Los datos fueron guardados; puede reintentar.",
        );
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    onSuccess(
      isEditing
        ? textosAmenidades.actualizadaExito
        : textosAmenidades.creadaExito
    );
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

        {/* Selector de Sede */}
        <div className="flex min-w-0 flex-col gap-2" data-invalid={errors.sucursal_id ? true : undefined}>
          <label htmlFor="amenidad-sucursal" className="text-xs font-semibold text-neutro-700">
            {textosAmenidades.sede}
          </label>
          <select
            id="amenidad-sucursal"
            aria-label={textosAmenidades.sede}
            aria-invalid={Boolean(errors.sucursal_id)}
            aria-describedby={errors.sucursal_id ? "amenidad-sucursal-help" : undefined}
            disabled={isPending || isEditing}
            className="field-control"
            {...register("sucursal_id")}
          >
            <option value="" disabled>
              {textosAmenidades.sedePlaceholder}
            </option>
            {sedes.map((sede) => (
              <option key={sede.id} value={String(sede.id)}>
                {sede.nombre} {sede.ciudad ? `(${sede.ciudad})` : ""}
              </option>
            ))}
          </select>
          {errors.sucursal_id && (
            <p id="amenidad-sucursal-help" role="alert" className="flex items-start gap-2 text-xs text-error-600">
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.sucursal_id.message}
            </p>
          )}
        </div>

        {/* Nombre de la Amenidad */}
        <Input
          label={textosAmenidades.nombre}
          id="amenidad-nombre"
          type="text"
          placeholder={textosAmenidades.nombrePlaceholder}
          maxLength={100}
          error={errors.nombre?.message}
          disabled={isPending}
          {...register("nombre")}
        />

        {/* Aforo Máximo */}
        <Input
          label={textosAmenidades.aforoMaximoLabel}
          id="amenidad-aforo"
          type="text"
          inputMode="numeric"
          placeholder={textosAmenidades.aforoPlaceholder}
          error={errors.aforo_maximo?.message}
          disabled={isPending}
          {...register("aforo_maximo")}
        />

        {/* Fotografía de la amenidad */}
        <ImageUploader
          label="Fotografía de la amenidad"
          helpText="Archivos JPEG, PNG o WebP de hasta 5 MiB"
          currentImageUrl={amenidad?.imagen_url}
          currentImageLabel="Fotografía de la amenidad"
          selectedFile={selectedFile}
          removeMarked={removeMarked}
          onFileSelect={setSelectedFile}
          onRemoveCurrent={() => setRemoveMarked((prev) => !prev)}
          disabled={isPending}
          isUploading={isUploadingImage}
          uploadProgress={uploadProgress}
          error={imageError}
        />

        {/* Botones de acción */}
        <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutro-200 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            {textosAmenidades.cancelar}
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isPending ? textosAmenidades.guardando : textosAmenidades.guardar}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
