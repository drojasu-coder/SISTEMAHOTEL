import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { textosCrearReserva } from '../textos';
import {
  busquedaReservaFormSchema,
  getTodayInGuatemala,
  toDisponibilidadQuery,
  type BusquedaReservaFormData,
} from '../schemas/busquedaReservaSchema';
import type { DisponibilidadHabitacionQuery } from '../types';

interface SedeOption {
  id: number;
  nombre: string;
  ciudad?: string | null;
  activa?: boolean;
}

interface TipoOption {
  id: number;
  nombre: string;
  capacidad_maxima: number;
}

export interface CriteriosBusquedaFormProps {
  sedes: SedeOption[];
  tiposHabitacion: TipoOption[];
  isSearching: boolean;
  onSubmitSearch: (query: DisponibilidadHabitacionQuery) => void;
  onCriteriaChange: () => void;
  initialValues?: Partial<BusquedaReservaFormData>;
}

export const CriteriosBusquedaForm: React.FC<CriteriosBusquedaFormProps> = ({
  sedes,
  tiposHabitacion,
  isSearching,
  onSubmitSearch,
  onCriteriaChange,
  initialValues,
}) => {
  const today = getTodayInGuatemala();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BusquedaReservaFormData>({
    resolver: zodResolver(busquedaReservaFormSchema),
    defaultValues: {
      sucursal_id: initialValues?.sucursal_id ?? '',
      fecha_entrada: initialValues?.fecha_entrada ?? '',
      fecha_salida: initialValues?.fecha_salida ?? '',
      numero_huespedes: initialValues?.numero_huespedes ?? '',
      tipo_habitacion_id: initialValues?.tipo_habitacion_id ?? '',
    },
  });

  // Notificar cuando cualquier criterio cambie para invalidar selecciones previas
  useEffect(() => {
    const subscription = watch(() => {
      onCriteriaChange();
    });
    return () => subscription.unsubscribe();
  }, [watch, onCriteriaChange]);

  const onFormSubmit = (data: BusquedaReservaFormData) => {
    const query = toDisponibilidadQuery(data);
    onSubmitSearch(query);
  };

  return (
    <Card className="flex flex-col gap-5">
      <div className="border-b border-neutro-200 pb-3">
        <h2 className="font-serif text-lg font-semibold text-neutro-900">
          {textosCrearReserva.seccionBusqueda}
        </h2>
        <p className="mt-1 text-xs text-neutro-600">
          {textosCrearReserva.avisoDisponibilidadNoAparta}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        noValidate
      >
        {/* Selector de Sede */}
        <div
          className="flex min-w-0 flex-col gap-2"
          data-invalid={errors.sucursal_id ? true : undefined}
        >
          <label
            htmlFor="criterios-sede"
            className="text-xs font-semibold text-neutro-700"
          >
            {textosCrearReserva.sedeLabel}
          </label>
          <select
            id="criterios-sede"
            aria-label={textosCrearReserva.sedeLabel}
            aria-invalid={Boolean(errors.sucursal_id)}
            aria-describedby={
              errors.sucursal_id ? 'criterios-sede-help' : undefined
            }
            disabled={isSearching}
            className="field-control"
            {...register('sucursal_id')}
          >
            <option value="" disabled>
              {textosCrearReserva.sedePlaceholder}
            </option>
            {sedes.map((sede) => (
              <option key={sede.id} value={String(sede.id)}>
                {sede.nombre} {sede.ciudad ? `(${sede.ciudad})` : ''}
              </option>
            ))}
          </select>
          {errors.sucursal_id && (
            <p
              id="criterios-sede-help"
              role="alert"
              className="flex items-start gap-2 text-xs text-error-600"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.sucursal_id.message}
            </p>
          )}
        </div>

        {/* Fecha de Entrada */}
        <div
          className="flex min-w-0 flex-col gap-2"
          data-invalid={errors.fecha_entrada ? true : undefined}
        >
          <label
            htmlFor="criterios-fecha-entrada"
            className="text-xs font-semibold text-neutro-700"
          >
            {textosCrearReserva.fechaEntradaLabel}
          </label>
          <input
            id="criterios-fecha-entrada"
            type="date"
            min={today}
            aria-label={textosCrearReserva.fechaEntradaLabel}
            aria-invalid={Boolean(errors.fecha_entrada)}
            aria-describedby={
              errors.fecha_entrada ? 'criterios-fecha-entrada-help' : undefined
            }
            disabled={isSearching}
            className="field-control"
            {...register('fecha_entrada')}
          />
          {errors.fecha_entrada && (
            <p
              id="criterios-fecha-entrada-help"
              role="alert"
              className="flex items-start gap-2 text-xs text-error-600"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.fecha_entrada.message}
            </p>
          )}
        </div>

        {/* Fecha de Salida */}
        <div
          className="flex min-w-0 flex-col gap-2"
          data-invalid={errors.fecha_salida ? true : undefined}
        >
          <label
            htmlFor="criterios-fecha-salida"
            className="text-xs font-semibold text-neutro-700"
          >
            {textosCrearReserva.fechaSalidaLabel}
          </label>
          <input
            id="criterios-fecha-salida"
            type="date"
            min={today}
            aria-label={textosCrearReserva.fechaSalidaLabel}
            aria-invalid={Boolean(errors.fecha_salida)}
            aria-describedby={
              errors.fecha_salida ? 'criterios-fecha-salida-help' : undefined
            }
            disabled={isSearching}
            className="field-control"
            {...register('fecha_salida')}
          />
          {errors.fecha_salida && (
            <p
              id="criterios-fecha-salida-help"
              role="alert"
              className="flex items-start gap-2 text-xs text-error-600"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.fecha_salida.message}
            </p>
          )}
        </div>

        {/* Número de Huéspedes */}
        <div
          className="flex min-w-0 flex-col gap-2"
          data-invalid={errors.numero_huespedes ? true : undefined}
        >
          <label
            htmlFor="criterios-huespedes"
            className="text-xs font-semibold text-neutro-700"
          >
            {textosCrearReserva.huespedesLabel}
          </label>
          <input
            id="criterios-huespedes"
            type="number"
            min="1"
            step="1"
            placeholder={textosCrearReserva.huespedesPlaceholder}
            aria-label={textosCrearReserva.huespedesLabel}
            aria-invalid={Boolean(errors.numero_huespedes)}
            aria-describedby={
              errors.numero_huespedes ? 'criterios-huespedes-help' : undefined
            }
            disabled={isSearching}
            className="field-control"
            {...register('numero_huespedes')}
          />
          {errors.numero_huespedes && (
            <p
              id="criterios-huespedes-help"
              role="alert"
              className="flex items-start gap-2 text-xs text-error-600"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.numero_huespedes.message}
            </p>
          )}
        </div>

        {/* Tipo de Habitación (Opcional) */}
        <div
          className="flex min-w-0 flex-col gap-2"
          data-invalid={errors.tipo_habitacion_id ? true : undefined}
        >
          <label
            htmlFor="criterios-tipo"
            className="text-xs font-semibold text-neutro-700"
          >
            {textosCrearReserva.tipoHabitacionLabel}
          </label>
          <select
            id="criterios-tipo"
            aria-label={textosCrearReserva.tipoHabitacionLabel}
            aria-invalid={Boolean(errors.tipo_habitacion_id)}
            aria-describedby={
              errors.tipo_habitacion_id ? 'criterios-tipo-help' : undefined
            }
            disabled={isSearching}
            className="field-control"
            {...register('tipo_habitacion_id')}
          >
            <option value="">{textosCrearReserva.tipoHabitacionTodos}</option>
            {tiposHabitacion.map((tipo) => (
              <option key={tipo.id} value={String(tipo.id)}>
                {tipo.nombre} (hasta {tipo.capacidad_maxima} personas)
              </option>
            ))}
          </select>
          {errors.tipo_habitacion_id && (
            <p
              id="criterios-tipo-help"
              role="alert"
              className="flex items-start gap-2 text-xs text-error-600"
            >
              <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
              {errors.tipo_habitacion_id.message}
            </p>
          )}
        </div>

        {/* Botón de Envío */}
        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSearching}
            className="w-full"
          >
            <Search className="size-4" aria-hidden="true" />
            {isSearching
              ? textosCrearReserva.buscando
              : textosCrearReserva.botonBuscar}
          </Button>
        </div>
      </form>
    </Card>
  );
};
