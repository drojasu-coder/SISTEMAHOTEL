import { useRevalidateErrors, usePublicInterface, usePublicTexts } from '@/i18n/public';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ChevronDown, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import {
  createBusquedaReservaSchema,
  toDisponibilidadQuery,
  type BusquedaReservaFormData,
} from '../schemas/busquedaReservaSchema';
import type { DisponibilidadHabitacionQuery } from '../types';
import { StayDateRange } from '@/features/habitaciones/public/StayDateRange';
import { GuestCount } from '@/features/habitaciones/public/GuestCount';
import { readStayDraft, saveStayDraft } from '@/features/habitaciones/public/stayDraft';
import type { PublicSite } from '@/features/preferencias/storage';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { useLocale } from '@/i18n/LocaleContext';

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
  publicSite?: PublicSite;
  onSiteChange?: (site: PublicSite) => void;
}

export const CriteriosBusquedaForm: React.FC<CriteriosBusquedaFormProps> = ({
  sedes,
  tiposHabitacion,
  isSearching,
  onSubmitSearch,
  onCriteriaChange,
  initialValues,
  publicSite,
  onSiteChange,
}) => {
  const { p, locale } = usePublicInterface();
  const textosCrearReserva = usePublicTexts('crearReserva');
  const [saved] = React.useState(readStayDraft);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BusquedaReservaFormData>({
    resolver: zodResolver(createBusquedaReservaSchema(p), { errorMap: () => ({ message: p('invalidField') }) }),
    defaultValues: {
      sucursal_id: initialValues?.sucursal_id ?? '',
      fecha_entrada: initialValues?.fecha_entrada ?? saved.fecha_entrada ?? '',
      fecha_salida: initialValues?.fecha_salida ?? saved.fecha_salida ?? '',
      numero_huespedes: initialValues?.numero_huespedes ?? saved.numero_huespedes ?? '2',
      tipo_habitacion_id: initialValues?.tipo_habitacion_id ?? '',
    },
  });

  useEffect(() => {
    if (publicSite !== undefined) setValue('sucursal_id', publicSite === 'all' ? '' : String(publicSite));
  }, [publicSite, setValue]);

  // Sede activa (selector global del encabezado) para el indicador del sitio público.
  const { openSelection, selectionOpen } = usePublicPreferences();
  const { t } = useLocale();
  const changeSiteLabel = t('changeSite');
  const sedeActual = sedes.find((sede) => String(sede.id) === watch('sucursal_id'));

  // Notificar cuando cualquier criterio cambie para invalidar selecciones previas
  useEffect(() => {
    const subscription = watch((_values, { type }) => {
      // setValue sincroniza la sede del enlace; solo la edición del usuario cambia criterios.
      if (type === 'change') onCriteriaChange();
    });
    return () => subscription.unsubscribe();
  }, [watch, onCriteriaChange]);

  useRevalidateErrors(locale, () => trigger(), Object.keys(errors).length > 0);

  useEffect(() => {
    const { fecha_entrada, fecha_salida, numero_huespedes } = getValues();
    saveStayDraft({ fecha_entrada, fecha_salida, numero_huespedes });
  }, [getValues]);

  const onFormSubmit = (data: BusquedaReservaFormData) => {
    saveStayDraft(data);
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
        {/* En el sitio público la sede es la del encabezado: se muestra y se cambia con el selector global.
            Fuera de ese contexto (sin selector global) se conserva el campo de selección. */}
        {publicSite !== undefined ? (
          <div className="flex min-w-0 flex-col gap-2" data-invalid={errors.sucursal_id ? true : undefined}>
            <span id="criterios-sede-label" className="text-xs font-semibold text-neutro-700">{textosCrearReserva.sedeLabel}</span>
            <input type="hidden" {...register('sucursal_id')} />
            <button type="button" id="criterios-sede" disabled={isSearching} aria-haspopup="dialog" aria-expanded={selectionOpen}
              aria-label={`${textosCrearReserva.sedeLabel}: ${sedeActual?.nombre ?? textosCrearReserva.sedePlaceholder}. ${changeSiteLabel}`}
              aria-invalid={Boolean(errors.sucursal_id)} aria-describedby={errors.sucursal_id ? 'criterios-sede-help' : undefined}
              onClick={(event) => openSelection(event.currentTarget)}
              className="field-control flex items-center gap-2 text-left">
              <MapPin className="size-4 shrink-0 text-bronce-700" aria-hidden="true" />
              <span lang={sedeActual ? 'es' : undefined} className="min-w-0 flex-1 truncate">{sedeActual?.nombre ?? textosCrearReserva.sedePlaceholder}</span>
              <ChevronDown className="size-4 shrink-0 text-bronce-700" aria-hidden="true" />
            </button>
            {errors.sucursal_id && (
              <p id="criterios-sede-help" role="alert" className="flex items-start gap-2 text-xs text-error-600">
                <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
                {errors.sucursal_id.message}
              </p>
            )}
          </div>
        ) : (
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
            {...register('sucursal_id', { onChange: (event) => onSiteChange?.(Number(event.target.value)) })}
            value={watch('sucursal_id')}
          >
            <option value="" disabled>
              {textosCrearReserva.sedePlaceholder}
            </option>
            {sedes.map((sede) => (
              <option lang="es" key={sede.id} value={String(sede.id)}>
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

        )}

        <div className="sm:col-span-2">
          <StayDateRange value={{ fecha_entrada: watch('fecha_entrada'), fecha_salida: watch('fecha_salida') }} disabled={isSearching}
            arrivalError={errors.fecha_entrada?.message} departureError={errors.fecha_salida?.message}
            onChange={(range) => {
              setValue('fecha_entrada', range.fecha_entrada, { shouldDirty: true, shouldValidate: true });
              setValue('fecha_salida', range.fecha_salida, { shouldDirty: true, shouldValidate: true });
              saveStayDraft({ ...range, numero_huespedes: getValues('numero_huespedes') });
              onCriteriaChange();
            }} />
        </div>
        <GuestCount label={textosCrearReserva.huespedesLabel} value={watch('numero_huespedes')} disabled={isSearching}
          error={errors.numero_huespedes?.message} onChange={(value) => {
            setValue('numero_huespedes', value, { shouldDirty: true, shouldValidate: true });
            const { fecha_entrada, fecha_salida } = getValues();
            saveStayDraft({ fecha_entrada, fecha_salida, numero_huespedes: value });
            onCriteriaChange();
          }} />

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
            value={watch('tipo_habitacion_id')}
          >
            <option value="">{textosCrearReserva.tipoHabitacionTodos}</option>
            {tiposHabitacion.map((tipo) => (
              <option lang="es" key={tipo.id} value={String(tipo.id)}>
                {tipo.nombre} ({textosCrearReserva.capacidadPersonas(tipo.capacidad_maxima)})
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
