import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Feedback";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ApiError } from "@/api/client/http";
import { getFieldErrors } from "@/api/errors";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminScope } from "@/features/admin-core/AdminScopeContext";
import { useAdminSedes } from "@/features/admin-core/hooks/useAdminSedes";
import { useRevalidateErrors, TranslatedError } from "@/i18n/public";
import { useTiposHabitacionTexts } from "../textos";
import {
  createTipoHabitacionFormSchema,
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
  const textosTiposHabitacion = useTiposHabitacionTexts();
  const { locale } = useLocale();
  const { user } = useAuth();
  const { selectedSedeId } = useAdminScope();
  const authorized = useAdminSedes(open);
  const formSchema = useMemo(() => createTipoHabitacionFormSchema(locale), [locale]);
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

  // Estado para la imagen del tipo de habitación
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeMarked, setRemoveMarked] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const [persistedId, setPersistedId] = useState<number | null>(null);
  const activeMutation = isEditing || persistedId !== null ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    getValues,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<TipoHabitacionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sucursal_id: "",
      nombre: "",
      capacidad_maxima: "",
      tarifa_noche: "",
      descripcion: "",
    },
  });
  useRevalidateErrors(locale, () => trigger(), Object.keys(errors).length > 0);
  useEffect(() => {
    if (open && !tipo && user?.rol !== 'admin' && authorized.data?.sedes.length === 1 && !getValues('sucursal_id')) {
      setValue('sucursal_id', String(authorized.data.sedes[0].id));
    }
  }, [open, tipo, authorized.data, user?.rol, getValues, setValue]);

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
          sucursal_id: tipo.sucursal_id === null ? "general" : tipo.sucursal_id === undefined ? "" : String(tipo.sucursal_id),
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
          sucursal_id: typeof selectedSedeId === 'number' ? String(selectedSedeId)
            : user?.rol !== 'admin' && authorized.data?.sedes.length === 1 ? String(authorized.data.sedes[0].id) : "",
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
    const permitted = data.sucursal_id === 'general'
      ? user?.rol === 'admin' && authorized.data?.global
      : authorized.data?.sedes.some(site => site.id === Number(data.sucursal_id));
    if (!permitted) { setError('sucursal_id', { message: textosTiposHabitacion.scopeError }); return; }
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
            if (field in formSchema.shape) {
              setError(field as keyof TipoHabitacionFormData, { message: msg });
            }
          }
        } else if (err.status === 409 && err.code?.includes('CAPACITY')) {
          setError("capacidad_maxima", { message: err.message });
        }
      }
      return;
    }

    if (removeMarked && (tipo?.id || persistedId)) {
      try {
        await removeImageMutation.mutateAsync(targetId);
      } catch (err: any) {
        setImageError(textosTiposHabitacion.fotoError);
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
        setImageError(textosTiposHabitacion.fotoError);
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

  if (tipo?.sucursal_id === null && user?.rol !== 'admin') return <Modal open={open} onClose={onClose} title={title} closeLabel={textosTiposHabitacion.cerrar} className="font-sans [&_h2]:font-sans">
    <Alert tone="info">{textosTiposHabitacion.readonly}</Alert>
  </Modal>;

  return (
    <Modal open={open} onClose={() => { if (!isPending) onClose(); }} busy={isPending} title={title} description={description} closeLabel={textosTiposHabitacion.cerrar} className="font-sans [&_h2]:font-sans">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {activeMutation.isError && (
          <Alert tone="error">
            <TranslatedError error={{ api: activeMutation.error }} />
          </Alert>
        )}

        {authorized.isError && <Alert tone="error">{textosTiposHabitacion.scopeError}
          <Button variant="text" onClick={() => void authorized.refetch()}>{textosTiposHabitacion.retry}</Button>
        </Alert>}
        <Select label={textosTiposHabitacion.sede} error={errors.sucursal_id?.message}
          loading={authorized.isLoading} disabled={isPending || authorized.isError} {...register('sucursal_id')}>
          <option value="">{textosTiposHabitacion.selectSede}</option>
          {user?.rol === 'admin' && authorized.data?.global && <option value="general">{textosTiposHabitacion.general}</option>}
          {authorized.data?.sedes.map(site => <option key={site.id} value={site.id}>{site.nombre}</option>)}
        </Select>

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
            {textosTiposHabitacion.capacidadAyuda}
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
            <span className="ml-1 font-normal text-neutro-500">({textosTiposHabitacion.opcional})</span>
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
          label={textosTiposHabitacion.fotografia}
          helpText={textosTiposHabitacion.fotoAyuda}
          currentImageUrl={tipo?.imagen_url}
          currentImageLabel={textosTiposHabitacion.fotoActual}
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
          <Button type="submit" variant="primary" isLoading={isPending} disabled={authorized.isLoading || authorized.isError}>
            {isPending ? textosTiposHabitacion.guardando : textosTiposHabitacion.guardar}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
