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
import { textosHabitaciones } from "../textos";
import {
  habitacionFormSchema,
  sanitizeHabitacionPayload,
  type HabitacionFormData,
} from "../schemas/habitacionSchema";
import {
  useCreateHabitacionMutation,
  useUpdateHabitacionMutation,
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
  const activeMutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    setError,
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

  useEffect(() => {
    if (open) {
      if (habitacion) {
        reset({
          sucursal_id: habitacion.sucursal_id,
          tipo_habitacion_id: habitacion.tipo_habitacion_id,
          numero: habitacion.numero ?? "",
          estado: habitacion.estado ?? "disponible",
        });
      } else {
        reset({
          sucursal_id: sedes.length > 0 ? sedes[0].id : undefined,
          tipo_habitacion_id:
            tiposHabitacion.length > 0 ? tiposHabitacion[0].id : undefined,
          numero: "",
          estado: "disponible",
        });
      }
      createMutation.reset();
      updateMutation.reset();
    }
  }, [open, habitacion, sedes, tiposHabitacion, reset]);

  const onSubmit = async (data: HabitacionFormData) => {
    const payload = sanitizeHabitacionPayload(data);
    try {
      if (isEditing && habitacion) {
        await updateMutation.mutateAsync({
          id: habitacion.id,
          data: payload,
        });
        onSuccess(textosHabitaciones.actualizadaExito);
      } else {
        await createMutation.mutateAsync(payload);
        onSuccess(textosHabitaciones.creadaExito);
      }
      onClose();
    } catch (err: unknown) {
      // Manejo de errores específicos del backend conservando valores en el formulario
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const fieldErrors = getFieldErrors(err);
          for (const [field, msg] of Object.entries(fieldErrors)) {
            if (field in habitacionFormSchema.shape) {
              setError(field as keyof HabitacionFormData, { message: msg });
            }
          }
        } else if (err.status === 409) {
          setError("numero", { message: err.message });
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
            {tiposHabitacion.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre} · Cap. {tipo.capacidad_maxima}
              </option>
            ))}
          </select>
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
          <Button type="submit" variant="primary" isLoading={isPending}>
            {isPending ? textosHabitaciones.guardando : textosHabitaciones.guardar}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
