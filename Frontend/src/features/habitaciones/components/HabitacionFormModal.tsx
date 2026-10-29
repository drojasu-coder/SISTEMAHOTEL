import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { textosHabitaciones } from "../textos";
import {
  habitacionFormSchema,
  sanitizeHabitacionPayload,
  type HabitacionFormData,
} from "../schemas/habitacionSchema";
import {
  useCreateHabitacionMutation,
  useUpdateHabitacionMutation,
  useUploadHabitacionImageMutation,
  useRemoveHabitacionImageMutation,
} from "../hooks/useHabitaciones";
import type { Habitacion, TipoHabitacion, EstadoHabitacion } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface HabitacionFormModalProps {
  open: boolean;
  onClose: () => void;
  habitacion: Habitacion | null;
  sedes: Sucursal[];
  tiposHabitacion: TipoHabitacion[];
  onSuccess: (message: string) => void;
}

export const HabitacionFormModal: React.FC<HabitacionFormModalProps> = ({
  open,
  onClose,
  habitacion,
  sedes,
  tiposHabitacion,
  onSuccess,
}) => {
  const isEditing = Boolean(habitacion);
  const title = isEditing
    ? textosHabitaciones.editarTitulo
    : textosHabitaciones.crearTitulo;
  const description = isEditing
    ? textosHabitaciones.editarDescripcion
    : textosHabitaciones.crearDescripcion;

  const createMutation = useCreateHabitacionMutation();
  const updateMutation = useUpdateHabitacionMutation();
  const uploadImageMutation = useUploadHabitacionImageMutation();
  const removeImageMutation = useRemoveHabitacionImageMutation();
  const activeMutation = isEditing ? updateMutation : createMutation;

  // Manejo de imagen de la habitación
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
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HabitacionFormData>({
    resolver: zodResolver(habitacionFormSchema),
    defaultValues: {
      sucursal_id: undefined,
      tipo_habitacion_id: undefined,
      numero: "",
      estado: "disponible",
    },
  });

  /**
   * Solo se ofrecen los tipos de la sede elegida: el servidor rechaza tipos de otra
   * sede y el catálogo público no muestra los tipos generales (sin sede), así que una
   * habitación nueva con ellos quedaría invisible para el cliente. Al editar se
   * conserva el tipo actual aunque sea general, para no alterar habitaciones existentes.
   */
  const sedeSeleccionada = Number(watch("sucursal_id")) || undefined;
  const tiposDeSede = useMemo(
    () => tiposHabitacion.filter((tipo) =>
      (sedeSeleccionada !== undefined && tipo.sucursal_id === sedeSeleccionada) ||
      (habitacion && tipo.id === habitacion.tipo_habitacion_id && Number(habitacion.sucursal_id) === sedeSeleccionada)),
    [tiposHabitacion, sedeSeleccionada, habitacion],
  );
  const sinTiposDeSede = sedeSeleccionada !== undefined && tiposDeSede.length === 0;

  useEffect(() => {
    if (!open) return;
    const actual = Number(getValues("tipo_habitacion_id"));
    if (!tiposDeSede.some((tipo) => tipo.id === actual)) {
      setValue("tipo_habitacion_id", (tiposDeSede[0]?.id ?? "") as unknown as number, { shouldValidate: false });
    }
  }, [open, tiposDeSede, getValues, setValue]);

  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setRemoveMarked(false);
      setIsUploadingImage(false);
      setUploadProgress(0);
      setImageError(null);
      setPersistedId(null);

      if (habitacion) {
        reset({
          sucursal_id: habitacion.sucursal_id,
          tipo_habitacion_id: habitacion.tipo_habitacion_id,
          numero: habitacion.numero ?? "",
          estado: habitacion.estado ?? "disponible",
        });
      } else {
        const sedeInicial = sedes.length > 0 ? sedes[0].id : undefined;
        reset({
          sucursal_id: sedeInicial,
          tipo_habitacion_id: tiposHabitacion.find((tipo) => tipo.sucursal_id === sedeInicial)?.id,
          numero: "",
          estado: "disponible",
        });
      }
      createMutation.reset();
      updateMutation.reset();
      uploadImageMutation.reset();
      removeImageMutation.reset();
    }
  }, [open, habitacion, sedes, tiposHabitacion, reset]);

  const onSubmit = async (data: HabitacionFormData) => {
    setImageError(null);
    const payload = sanitizeHabitacionPayload(data);

    let targetId: number;
    try {
      if (isEditing && habitacion) {
        targetId = habitacion.id;
        await updateMutation.mutateAsync({
          id: habitacion.id,
          data: payload,
        });
      } else if (persistedId) {
        targetId = persistedId;
        await updateMutation.mutateAsync({
          id: persistedId,
          data: payload,
        });
      } else {
        const created = await createMutation.mutateAsync(payload);
        targetId = created.id;
        setPersistedId(created.id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const fieldErrors = getFieldErrors(err);
          for (const [field, msg] of Object.entries(fieldErrors)) {
            if (field in habitacionFormSchema.shape) {
              setError(field as keyof HabitacionFormData, { message: msg });
            }
          }
        } else if (err.status === 409) {
          if (err.code === "ROOM_TYPE_CHANGE_CAPACITY_CONFLICT") {
            setError("tipo_habitacion_id", { message: err.message });
          } else {
            setError("numero", { message: err.message });
          }
        }
      }
      return;
    }

    // Retiro de imagen si fue marcada
    if (removeMarked && (habitacion?.id || persistedId)) {
      try {
        await removeImageMutation.mutateAsync(targetId);
      } catch (err: any) {
        setImageError("No fue posible retirar la imagen actual.");
        return;
      }
    }

    // Subida de nueva imagen
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
            "Error al subir la fotografía de la habitación. Los datos fueron guardados; puede reintentar.",
        );
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    onSuccess(
      isEditing ? textosHabitaciones.actualizadaExito : textosHabitaciones.creadaExito
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
          <label htmlFor="habitacion-sucursal" className="text-xs font-semibold text-neutro-700">
            {textosHabitaciones.sede}
          </label>
          <select
            id="habitacion-sucursal"
            aria-label={textosHabitaciones.sede}
            aria-invalid={Boolean(errors.sucursal_id)}
            aria-describedby={errors.sucursal_id ? "habitacion-sucursal-help" : undefined}
            disabled={isPending}
            className="field-control"
            {...register("sucursal_id")}
          >
            <option value="" disabled>
              {textosHabitaciones.sedePlaceholder}
            </option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre} {sede.ciudad ? `(${sede.ciudad})` : ""}
              </option>
            ))}
          </select>
          {errors.sucursal_id && (
            <p id="habitacion-sucursal-help" role="alert" className="flex items-start gap-2 text-xs text-error-600">
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.sucursal_id.message}
            </p>
          )}
        </div>

        {/* Selector de Tipo de Habitación */}
        <div className="flex min-w-0 flex-col gap-2" data-invalid={errors.tipo_habitacion_id ? true : undefined}>
          <label htmlFor="habitacion-tipo" className="text-xs font-semibold text-neutro-700">
            {textosHabitaciones.tipo}
          </label>
          <select
            id="habitacion-tipo"
            aria-label={textosHabitaciones.tipo}
            aria-invalid={Boolean(errors.tipo_habitacion_id)}
            aria-describedby={errors.tipo_habitacion_id ? "habitacion-tipo-help" : undefined}
            disabled={isPending}
            className="field-control"
            {...register("tipo_habitacion_id")}
          >
            <option value="" disabled>
              {textosHabitaciones.tipoPlaceholder}
            </option>
            {tiposDeSede.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre} · Cap. {tipo.capacidad_maxima}
              </option>
            ))}
          </select>
          {sinTiposDeSede && (
            <p role="status" className="text-xs text-neutro-600">
              Esta sede todavía no tiene tipos de habitación.{" "}
              <Link to="/admin/tipos-habitacion" className="font-semibold text-bronce-700 underline">Cree primero un tipo para esta sede</Link>{" "}
              y después registre la habitación.
            </p>
          )}
          {errors.tipo_habitacion_id && (
            <p id="habitacion-tipo-help" role="alert" className="flex items-start gap-2 text-xs text-error-600">
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.tipo_habitacion_id.message}
            </p>
          )}
        </div>

        {/* Número de Habitación */}
        <Input
          label={textosHabitaciones.numero}
          id="habitacion-numero"
          type="text"
          placeholder={textosHabitaciones.numeroPlaceholder}
          maxLength={10}
          error={errors.numero?.message}
          disabled={isPending}
          {...register("numero")}
        />

        {/* Estado de la Habitación */}
        <div className="flex min-w-0 flex-col gap-2" data-invalid={errors.estado ? true : undefined}>
          <label htmlFor="habitacion-estado" className="text-xs font-semibold text-neutro-700">
            {textosHabitaciones.estado}
          </label>
          <select
            id="habitacion-estado"
            aria-label={textosHabitaciones.estado}
            aria-invalid={Boolean(errors.estado)}
            aria-describedby={errors.estado ? "habitacion-estado-help" : undefined}
            disabled={isPending}
            className="field-control"
            {...register("estado")}
          >
            {(["disponible", "ocupada", "mantenimiento", "limpieza"] as EstadoHabitacion[]).map(
              (est) => (
                <option key={est} value={est}>
                  {textosHabitaciones.estados[est]}
                </option>
              )
            )}
          </select>
          {errors.estado && (
            <p id="habitacion-estado-help" role="alert" className="flex items-start gap-2 text-xs text-error-600">
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.estado.message}
            </p>
          )}
        </div>

        {/* Fotografía específica de la habitación */}
        <ImageUploader
          label="Fotografía específica de la habitación"
          helpText="Archivos JPEG, PNG o WebP de hasta 5 MiB"
          currentImageUrl={habitacion?.imagen_url}
          currentImageLabel="Fotografía de la habitación"
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
            {textosHabitaciones.cancelar}
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending} disabled={sinTiposDeSede}>
            {isPending ? textosHabitaciones.guardando : textosHabitaciones.guardar}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
