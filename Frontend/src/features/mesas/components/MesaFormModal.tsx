import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/api/client/http';
import { getApiErrorMessage, getFieldErrors } from '@/api/errors';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import {
  CAMPOS_MESA,
  createMesaFormSchema,
  mensajesMesa,
  mensajesMesaEn,
  sanitizeCreateMesa,
  sanitizeUpdateMesa,
  type MesaFormValues,
} from '../schemas/mesaSchema';
import { useCreateMesaMutation, useUpdateMesaMutation } from '../hooks/useMesas';
import { SelectField } from './SelectField';
import type { Mesa } from '../types';
import { useTextosMesas } from '../texts';
import { useLocale } from '@/i18n/LocaleContext';

interface MesaFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Mesa a editar; `null` registra una mesa nueva. */
  mesa: Mesa | null;
  onSuccess: (message: string) => void;
}

/**
 * Alta y edición de mesas contra la API real.
 * En edición la sede no se ofrece: el PATCH del backend no admite `sucursal_id`.
 */
export const MesaFormModal: React.FC<MesaFormModalProps> = ({
  open,
  onClose,
  mesa,
  onSuccess,
}) => {
  const textosMesas = useTextosMesas();
  const { locale } = useLocale();
  const schema = React.useMemo(() => createMesaFormSchema(locale === 'en' ? mensajesMesaEn : mensajesMesa), [locale]);
  const isEditing = Boolean(mesa);
  const title = isEditing ? textosMesas.editarTitulo : textosMesas.crearTitulo;
  const description = isEditing ? textosMesas.editarDescripcion : textosMesas.crearDescripcion;

  const createMutation = useCreateMesaMutation();
  const updateMutation = useUpdateMesaMutation();
  const activeMutation = isEditing ? updateMutation : createMutation;

  const {
    data: sucursales,
    isLoading: isLoadingSucursales,
    isError: isErrorSucursales,
  } = useSedesQuery();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MesaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sucursal_id: '',
      zona: '',
      capacidad: '',
      estado: '',
      originalEstado: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mesa) {
      reset({
        sucursal_id: String(mesa.sucursal_id),
        zona: mesa.zona ?? '',
        capacidad: String(mesa.capacidad ?? ''),
        estado: mesa.estado ?? '',
        originalEstado: mesa.estado ?? '',
      });
    } else {
      reset({
        sucursal_id: '',
        zona: '',
        capacidad: '',
        estado: '',
        originalEstado: '',
      });
    }
    createMutation.reset();
    updateMutation.reset();
  }, [open, mesa, reset]);

  const nombreSedeSeleccionada = (() => {
    if (!mesa) return '';
    const desdeInclusion = mesa.Sucursal?.nombre?.trim();
    if (desdeInclusion) return desdeInclusion;
    return sucursales?.find((sede) => sede.id === mesa.sucursal_id)?.nombre ?? '';
  })();

  const onSubmit = async (data: MesaFormValues) => {
    try {
      if (isEditing && mesa) {
        await updateMutation.mutateAsync({
          id: mesa.id,
          data: sanitizeUpdateMesa(data),
        });
        onSuccess(textosMesas.actualizadaExito);
      } else {
        await createMutation.mutateAsync(sanitizeCreateMesa(data));
        onSuccess(textosMesas.creadaExito);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        const fieldErrors = getFieldErrors(err);
        for (const [field, message] of Object.entries(fieldErrors)) {
          if ((CAMPOS_MESA as readonly string[]).includes(field)) {
            setError(field as keyof MesaFormValues, { message });
          }
        }
      }
      // Los valores del formulario se conservan: el modal permanece abierto.
    }
  };

  const isPending = activeMutation.isPending || isSubmitting;
  const sedesNoDisponibles = !isEditing && isErrorSucursales;

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {activeMutation.isError && (
          <Alert tone="error" title={textosMesas.errorGuardar}>
            {getApiErrorMessage(activeMutation.error)}
          </Alert>
        )}

        {sedesNoDisponibles && (
          <Alert tone="error">
            {textosMesas.errorSedes}
          </Alert>
        )}

        {isEditing ? (
          <>
            <input type="hidden" {...register('sucursal_id')} />
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-xs font-semibold text-neutro-700">{textosMesas.sede}</span>
              <p className="rounded-md border border-neutro-200 bg-neutro-100 px-3 py-2 text-sm text-neutro-800">
                {nombreSedeSeleccionada || textosMesas.sedeNoRegistrada}
              </p>
              <p className="text-xs text-neutro-600">{textosMesas.sedeNoModificable}</p>
            </div>
          </>
        ) : (
          <SelectField
            label={textosMesas.sede}
            error={errors.sucursal_id?.message}
            disabled={isPending || sedesNoDisponibles}
            {...register('sucursal_id')}
          >
            <option value="">{textosMesas.sedePlaceholder}</option>
            {sucursales?.map((sede) => (
              <option key={sede.id} value={String(sede.id)}>
                {sede.nombre}
              </option>
            ))}
          </SelectField>
        )}

        <Input
          label={textosMesas.zonasTitulo}
          type="text"
          placeholder={textosMesas.zonasPlaceholder}
          error={errors.zona?.message}
          disabled={isPending}
          {...register('zona')}
        />

        <Input
          label={textosMesas.capacidad}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder={textosMesas.capacidadPlaceholder}
          error={errors.capacidad?.message}
          disabled={isPending}
          {...register('capacidad')}
        />

        <Input
          label={textosMesas.estado}
          labelSuffix={textosMesas.opcional}
          type="text"
          placeholder={textosMesas.estadoPlaceholder}
          hint={isEditing ? textosMesas.estadoAyudaEdicion : textosMesas.estadoAyuda}
          error={errors.estado?.message}
          disabled={isPending}
          {...register('estado')}
        />

        <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutro-200 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            {textosMesas.cancelar}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            disabled={sedesNoDisponibles || isLoadingSucursales}
          >
            {isPending ? textosMesas.guardando : textosMesas.guardar}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
