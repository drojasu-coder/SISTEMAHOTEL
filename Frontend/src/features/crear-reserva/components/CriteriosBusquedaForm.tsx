import { useRevalidateErrors, usePublicInterface, usePublicTexts } from '@/i18n/public';
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

  const previousSite = useRef(publicSite);
  const typeIds = tiposHabitacion.map((tipo) => String(tipo.id)).join(',');
  useEffect(() => {
    if (publicSite === undefined) return;
    const siteValue = publicSite === 'all' ? '' : String(publicSite);
    if (getValues('sucursal_id') !== siteValue) setValue('sucursal_id', siteValue, { shouldValidate: true });
    if (previousSite.current !== publicSite) {
      const selectedType = getValues('tipo_habitacion_id');
      if (selectedType && (publicSite === 'all' || (typeIds && !typeIds.split(',').includes(selectedType)))) {
        setValue('tipo_habitacion_id', '');
      }
    }
    previousSite.current = publicSite;
  }, [publicSite, setValue, getValues, typeIds]);

  const { openSelection, selectionOpen } = usePublicPreferences();
  const selectedType = tiposHabitacion.find((tipo) => String(tipo.id) === watch('tipo_habitacion_id'));
  const capacities = tiposHabitacion.map((tipo) => tipo.capacidad_maxima).filter((capacity) => capacity > 0);
  const maxGuests = selectedType?.capacidad_maxima ?? (capacities.length ? Math.max(...capacities) : undefined);
  const capacityError = maxGuests && Number(watch('numero_huespedes')) > maxGuests
    ? textosCrearReserva.capacidadPersonas(maxGuests) : undefined;

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
    if (maxGuests && Number(data.numero_huespedes) > maxGuests) {
      return;
    }
    saveStayDraft(data);
    onSubmitSearch(toDisponibilidadQuery(data));
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate
      className="overflow-hidden rounded-2xl border border-bronce-200 bg-white shadow-sm">
      <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 p-3 sm:p-6 lg:p-8">
          <StayDateRange inline value={{ fecha_entrada: watch('fecha_entrada'), fecha_salida: watch('fecha_salida') }} disabled={isSearching}
            arrivalError={errors.fecha_entrada?.message} departureError={errors.fecha_salida?.message}
            onChange={(range) => {
              setValue('fecha_entrada', range.fecha_entrada, { shouldDirty: true, shouldValidate: true });
              setValue('fecha_salida', range.fecha_salida, { shouldDirty: true, shouldValidate: Boolean(range.fecha_salida) });
              saveStayDraft({ ...range, numero_huespedes: getValues('numero_huespedes') });
              onCriteriaChange();
            }} />
        </div>

        <div className="grid min-w-0 gap-6 border-t border-bronce-100 bg-bronce-50/50 p-5 sm:grid-cols-2 sm:p-6 xl:flex xl:flex-col xl:border-l xl:border-t-0 xl:p-7">
          <input type="hidden" {...register('sucursal_id')} />
          {(publicSite === 'all' || publicSite === undefined) && (
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="criterios-sede" className="text-xs font-semibold text-neutro-700">{textosCrearReserva.sedeLabel}</label>
              {publicSite === 'all' ? (
                <Button id="criterios-sede" variant="secondary" className="w-full justify-start bg-white text-left"
                  disabled={isSearching} aria-haspopup="dialog" aria-expanded={selectionOpen}
                  aria-invalid={Boolean(errors.sucursal_id)} aria-describedby={errors.sucursal_id ? 'criterios-sede-help' : undefined}
                  onClick={(event) => openSelection(event.currentTarget)}>
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />{textosCrearReserva.sedePlaceholder}
                </Button>
              ) : (
                <select id="criterios-sede" className="field-control" disabled={isSearching}
                  aria-invalid={Boolean(errors.sucursal_id)} value={watch('sucursal_id')}
                  aria-describedby={errors.sucursal_id ? 'criterios-sede-help' : undefined}
                  onChange={(event) => {
                    setValue('sucursal_id', event.target.value, { shouldValidate: true });
                    onSiteChange?.(Number(event.target.value));
                    onCriteriaChange();
                  }}>
                  <option value="" disabled>{textosCrearReserva.sedePlaceholder}</option>
                  {sedes.map((sede) => <option lang="es" key={sede.id} value={sede.id}>{sede.nombre}</option>)}
                </select>
              )}
              {errors.sucursal_id && <p id="criterios-sede-help" role="alert" className="flex gap-2 text-xs text-error-600">
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />{errors.sucursal_id.message}
              </p>}
            </div>
          )}

          <div className="space-y-3">
            <GuestCount label={textosCrearReserva.huespedesLabel} value={watch('numero_huespedes')} disabled={isSearching} max={maxGuests}
              error={capacityError ?? errors.numero_huespedes?.message} onChange={(value) => {
                setValue('numero_huespedes', value, { shouldDirty: true, shouldValidate: true });
                const { fecha_entrada, fecha_salida } = getValues();
                saveStayDraft({ fecha_entrada, fecha_salida, numero_huespedes: value });
                onCriteriaChange();
              }} />
            {maxGuests && !capacityError && <p className="text-xs text-neutro-600">{textosCrearReserva.capacidadPersonas(maxGuests)}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="criterios-tipo" className="block text-xs font-semibold text-neutro-700">{textosCrearReserva.tipoHabitacionLabel}</label>
            <select id="criterios-tipo" className="field-control !min-h-14" disabled={isSearching || !tiposHabitacion.length}
              aria-invalid={Boolean(errors.tipo_habitacion_id)} {...register('tipo_habitacion_id')} value={watch('tipo_habitacion_id')}>
              <option value="">{textosCrearReserva.tipoHabitacionTodos}</option>
              {tiposHabitacion.map((tipo) => <option lang="es" key={tipo.id} value={tipo.id}>
                {tipo.nombre} ({tipo.capacidad_maxima})
              </option>)}
            </select>
            {errors.tipo_habitacion_id && <p role="alert" className="text-xs text-error-600">{errors.tipo_habitacion_id.message}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isSearching} className="mt-auto w-full whitespace-normal sm:col-span-2">
            {!isSearching && <Search className="size-4 shrink-0" aria-hidden="true" />}
            {isSearching ? textosCrearReserva.buscando : textosCrearReserva.botonBuscar}
          </Button>
        </div>
      </div>
    </form>
  );
};
