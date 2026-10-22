import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";
import { ApiError } from "@/api/client/http";
import { getApiErrorMessage, getFieldErrors } from "@/api/errors";
import { textosParqueos } from "../textos";
import {
  parqueoFormSchema,
  sanitizeParqueoPayload,
  type ParqueoFormData,
} from "../schemas/parqueoSchema";
import {
  useCreateParqueoMutation,
  useUpdateParqueoMutation,
} from "../hooks/useParqueos";
import type { EstadoParqueo, Parqueo } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface ParqueoFormModalProps {
  open: boolean;
  onClose: () => void;
  parqueo: Parqueo | null;
  sedes: Sucursal[];
  onSuccess: (message: string) => void;
}

/**
 * Alta y edición de espacios de parqueo.
 * El backend admite los mismos campos en ambos casos, incluida la sede: al
 * cambiarla se verifica que el número no esté duplicado en la sede destino.
 */
export const ParqueoFormModal: React.FC<ParqueoFormModalProps> = ({
  open,
  onClose,
  parqueo,
  sedes,
  onSuccess,
}) => {
  const isEditing = Boolean(parqueo);
  const title = isEditing
    ? textosParqueos.editarTitulo
    : textosParqueos.crearTitulo;
  const description = isEditing
    ? textosParqueos.editarDescripcion
    : textosParqueos.crearDescripcion;

  const createMutation = useCreateParqueoMutation();
  const updateMutation = useUpdateParqueoMutation();
  const activeMutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ParqueoFormData>({
    resolver: zodResolver(parqueoFormSchema),
    defaultValues: {
      sucursal_id: undefined,
      numero: "",
      estado: "disponible",
    },
  });

  /**
   * El formulario se reinicia al abrir el modal o al cambiar el registro
   * seleccionado. `sedes` queda deliberadamente fuera de las dependencias: si el
   * catálogo llega tarde, reiniciar por su causa borraría lo que la persona ya
   * escribió. En ese caso la sede se elige a mano cuando las opciones están
   * disponibles.
   */
  useEffect(() => {
    if (!open) return;
    if (parqueo) {
      reset({
        sucursal_id: parqueo.sucursal_id,
        numero: parqueo.numero ?? "",
        estado: parqueo.estado ?? "disponible",
      });
    } else {
      reset({
        sucursal_id: sedes.length > 0 ? sedes[0].id : undefined,
        numero: "",
        estado: "disponible",
      });
    }
    createMutation.reset();
    updateMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parqueo, reset]);

  const onSubmit = async (data: ParqueoFormData) => {
    const payload = sanitizeParqueoPayload(data);
    try {
      if (isEditing && parqueo) {
        await updateMutation.mutateAsync({ id: parqueo.id, data: payload });
        onSuccess(textosParqueos.actualizadoExito);
      } else {
        await createMutation.mutateAsync(payload);
        onSuccess(textosParqueos.creadoExito);
      }
      onClose();
    } catch (err: unknown) {
      // Los valores del formulario se conservan; los errores del servidor se
      // asignan al campo correspondiente.
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const fieldErrors = getFieldErrors(err);
          for (const [field, msg] of Object.entries(fieldErrors)) {
            if (field in parqueoFormSchema.shape) {
              setError(field as keyof ParqueoFormData, { message: msg });
            }
          }
        } else if (err.status === 409) {
          // Número duplicado dentro de la sede (PARQUEO_NUMBER_ALREADY_EXISTS).
          setError("numero", { message: err.message });
        }
      }
    }
  };

  const isPending = activeMutation.isPending || isSubmitting;

  /**
   * Los errores que el backend asocia a un campo (validación 400 o duplicidad
   * 409) se muestran junto al campo; el aviso general se reserva para los
   * errores que no corresponden a un campo concreto, para no duplicar el
   * mismo texto.
   */
  const errorAsignadoACampo = (() => {
    const error = activeMutation.error;
    if (!(error instanceof ApiError)) return false;
    if (error.status === 409) return true;
    return error.status === 400 && Object.keys(getFieldErrors(error)).length > 0;
  })();

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {activeMutation.isError && !errorAsignadoACampo && (
          <Alert tone="error">
            {getApiErrorMessage(activeMutation.error)}
          </Alert>
        )}

        {/* Selector de Sede */}
        <div
          className="flex min-w-0 flex-col gap-2"
          data-invalid={errors.sucursal_id ? true : undefined}
        >
          <label htmlFor="parqueo-sucursal" className="text-xs font-semibold text-neutro-700">
            {textosParqueos.sede}
          </label>
          <select
            id="parqueo-sucursal"
            aria-label={textosParqueos.sede}
            aria-invalid={Boolean(errors.sucursal_id)}
            aria-describedby={errors.sucursal_id ? "parqueo-sucursal-help" : undefined}
            disabled={isPending}
            className="field-control"
            {...register("sucursal_id")}
          >
            <option value="" disabled>
              {textosParqueos.sedePlaceholder}
            </option>
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre} {sede.ciudad ? `(${sede.ciudad})` : ""}
              </option>
            ))}
          </select>
          {errors.sucursal_id ? (
            <p
              id="parqueo-sucursal-help"
              role="alert"
              className="flex items-start gap-2 text-xs text-error-600"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.sucursal_id.message}
            </p>
          ) : (
            sedes.length === 0 && (
              <p className="text-xs text-neutro-600">{textosParqueos.sinSedesDisponibles}</p>
            )
          )}
        </div>

        {/* Número del espacio */}
        <Input
          label={textosParqueos.numero}
          id="parqueo-numero"
          type="text"
          placeholder={textosParqueos.numeroPlaceholder}
          maxLength={10}
          error={errors.numero?.message}
          disabled={isPending}
          {...register("numero")}
        />

        {/* Estado operativo actual */}
        <div
          className="flex min-w-0 flex-col gap-2"
          data-invalid={errors.estado ? true : undefined}
        >
          <label htmlFor="parqueo-estado" className="text-xs font-semibold text-neutro-700">
            {textosParqueos.estado}
          </label>
          <select
            id="parqueo-estado"
            aria-label={textosParqueos.estado}
            aria-invalid={Boolean(errors.estado)}
            aria-describedby={
              errors.estado ? "parqueo-estado-help" : "parqueo-estado-ayuda"
            }
            disabled={isPending}
            className="field-control"
            {...register("estado")}
          >
            {(["disponible", "ocupado", "mantenimiento"] as EstadoParqueo[]).map(
              (estado) => (
                <option key={estado} value={estado}>
                  {textosParqueos.estados[estado]}
                </option>
              )
            )}
          </select>
          {errors.estado ? (
            <p
              id="parqueo-estado-help"
              role="alert"
              className="flex items-start gap-2 text-xs text-error-600"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.estado.message}
            </p>
          ) : (
            <p id="parqueo-estado-ayuda" className="text-xs text-neutro-600">
              {textosParqueos.estadoAyuda}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutro-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {textosParqueos.cancelar}
          </Button>
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isPending ? textosParqueos.guardando : textosParqueos.guardar}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
