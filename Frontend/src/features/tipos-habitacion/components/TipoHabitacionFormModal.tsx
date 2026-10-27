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
import { es } from "@/i18n/es";
import { textosTiposHabitacion } from "../textos";
import {
  tipoHabitacionFormSchema,
  sanitizeCreateTipoHabitacion,
  sanitizeUpdateTipoHabitacion,
  type TipoHabitacionFormData,
} from "../schemas/tipoHabitacionSchema";
import {
  useCreateTipoHabitacionMutation,
  useUpdateTipoHabitacionMutation,
  useUploadTipoHabitacionImageMutation,
  useRemoveTipoHabitacionImageMutation,
} from "../hooks/useTiposHabitacion";
import type { TipoHabitacion } from "../types";

interface TipoHabitacionFormModalProps {
  open: boolean;
  onClose: () => void;
  tipo: TipoHabitacion | null;
  onSuccess: (message: string) => void;
}

export const TipoHabitacionFormModal: React.FC<TipoHabitacionFormModalProps> = ({
  open,
  onClose,
  tipo,
  onSuccess,
}) => {
  const isEditing = Boolean(tipo);
  const title = isEditing
    ? textosTiposHabitacion.editarTitulo
    : textosTiposHabitacion.crearTitulo;
  const description = isEditing
    ? textosTiposHabitacion.editarDescripcion
    : textosTiposHabitacion.crearDescripcion;

  const createMutation = useCreateTipoHabitacionMutation();
  const updateMutation = useUpdateTipoHabitacionMutation();
  const uploadImageMutation = useUploadTipoHabitacionImageMutation();
  const removeImageMutation = useRemoveTipoHabitacionImageMutation();
  const activeMutation = isEditing ? updateMutation : createMutation;

  // Estado para la imagen del tipo de habitación
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
  } = useForm<TipoHabitacionFormData>({
    resolver: zodResolver(tipoHabitacionFormSchema),
    defaultValues: {
      nombre: "",
      capacidad_maxima: "",
      tarifa_noche: "",
      descripcion: "",
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

      if (tipo) {
        reset({
          nombre: tipo.nombre ?? "",
          capacidad_maxima:
            tipo.capacidad_maxima !== undefined && tipo.capacidad_maxima !== null
              ? String(tipo.capacidad_maxima)
              : "",
          tarifa_noche:
            tipo.tarifa_noche !== undefined && tipo.tarifa_noche !== null
              ? String(tipo.tarifa_noche)
              : "",
          descripcion: tipo.descripcion ?? "",
        });
      } else {
        reset({
          nombre: "",
          capacidad_maxima: "",
          tarifa_noche: "",
          descripcion: "",
        });
      }
      createMutation.reset();
      updateMutation.reset();
      uploadImageMutation.reset();
      removeImageMutation.reset();
    }
  }, [open, tipo, reset]);

  const onSubmit = async (data: TipoHabitacionFormData) => {
    setImageError(null);
    let targetId: number;

    try {
      if (isEditing && tipo) {
        targetId = tipo.id;
        const payload = sanitizeUpdateTipoHabitacion(data);
        await updateMutation.mutateAsync({
          id: tipo.id,
          data: payload,
        });
      } else if (persistedId) {
        targetId = persistedId;
        const payload = sanitizeUpdateTipoHabitacion(data);
        await updateMutation.mutateAsync({
          id: persistedId,
          data: payload,
        });
      } else {
        const payload = sanitizeCreateTipoHabitacion(data);
        const created = await createMutation.mutateAsync(payload);
        targetId = created.id;
        setPersistedId(created.id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const fieldErrors = getFieldErrors(err);
          for (const [field, msg] of Object.entries(fieldErrors)) {
            if (field in tipoHabitacionFormSchema.shape) {
              setError(field as keyof TipoHabitacionFormData, { message: msg });
            }
          }
        } else if (err.status === 409) {
          setError("capacidad_maxima", { message: err.message });
        }
      }
      return;
    }

    if (removeMarked && (tipo?.id || persistedId)) {
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
            "Error al subir la imagen del tipo de habitación. Los datos fueron guardados; puede reintentar.",
        );
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    onSuccess(
      isEditing
        ? textosTiposHabitacion.actualizadoExito
        : textosTiposHabitacion.creadoExito
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

        <Input
          label={textosTiposHabitacion.nombre}
          id="tipo-nombre"
          type="text"
          placeholder={textosTiposHabitacion.nombrePlaceholder}
          maxLength={50}
          error={errors.nombre?.message}
          disabled={isPending}
          {...register("nombre")}
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label={textosTiposHabitacion.capacidadMaximaLabel}
            id="tipo-capacidad"
            type="text"
            inputMode="numeric"
            placeholder={textosTiposHabitacion.capacidadPlaceholder}
            error={errors.capacidad_maxima?.message}
            disabled={isPending}
            {...register("capacidad_maxima")}
          />
          <p className="text-[0.6875rem] text-neutro-500">
            {es.tiposHabitacion.capacidadAyuda}
          </p>
        </div>

        <Input
          label={textosTiposHabitacion.tarifaNocheLabel}
          id="tipo-tarifa"
          type="text"
          inputMode="decimal"
          placeholder={textosTiposHabitacion.tarifaPlaceholder}
          error={errors.tarifa_noche?.message}
          disabled={isPending}
          {...register("tarifa_noche")}
        />

        <div className="flex min-w-0 flex-col gap-2" data-invalid={errors.descripcion ? true : undefined}>
          <label htmlFor="tipo-descripcion" className="text-xs font-semibold text-neutro-700">
            {textosTiposHabitacion.descripcionLabel}
            <span className="ml-1 font-normal text-neutro-500">({es.comunes.opcional})</span>
          </label>
          <textarea
            id="tipo-descripcion"
            rows={3}
            placeholder={textosTiposHabitacion.descripcionPlaceholder}
            maxLength={500}
            disabled={isPending}
            className="field-control resize-none py-2"
            {...register("descripcion")}
          />
          {errors.descripcion && (
            <p id="tipo-descripcion-help" role="alert" className="flex items-start gap-2 text-xs text-error-600">
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.descripcion.message}
            </p>
          )}
        </div>

        <ImageUploader
          label="Fotografía representativa del tipo de habitación"
          helpText="Archivos JPEG, PNG o WebP de hasta 5 MiB"
          currentImageUrl={tipo?.imagen_url}
          currentImageLabel="Fotografía del tipo de habitación"
          selectedFile={selectedFile}
          removeMarked={removeMarked}
          onFileSelect={setSelectedFile}
          onRemoveCurrent={() => setRemoveMarked((prev) => !prev)}
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
            {textosTiposHabitacion.cancelar}
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isPending ? textosTiposHabitacion.guardando : textosTiposHabitacion.guardar}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
