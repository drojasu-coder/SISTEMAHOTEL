import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUpdateCitaEstadoMutation } from '../hooks/useBienestar';
import { citaEstadoSchema, type CitaEstadoFormValues } from '../schemas/bienestar.schemas';
import { textosBienestar } from '../textos';
import { ApiError } from '@/api/client/http';
import type { CitaBienestar } from '../types';

interface AdminCitaEstadoModalProps {
  cita: CitaBienestar;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminCitaEstadoModal: React.FC<AdminCitaEstadoModalProps> = ({
  cita,
  onClose,
  onSuccess,
}) => {
  const updateEstadoMutation = useUpdateCitaEstadoMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<CitaEstadoFormValues>({
    resolver: zodResolver(citaEstadoSchema),
    defaultValues: {
      estado: (cita.estado as 'confirmada' | 'cancelada' | 'completada') ?? 'confirmada',
    },
  });

  const nuevoEstado = watch('estado');
  const esReactivacion = nuevoEstado === 'confirmada' && cita.estado !== 'confirmada';

  const onSubmit = async (values: CitaEstadoFormValues) => {
    if (!cita.id) return;
    setErrorMessage(null);

    try {
      await updateEstadoMutation.mutateAsync({
        id: cita.id,
        data: { estado: values.estado },
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'THERAPIST_BUSY_OR_BUFFER' || err.status === 409) {
          setErrorMessage(textosBienestar.errorTerapeutaOcupado);
        } else if (err.code === 'THERAPIST_INACTIVE' || err.status === 422) {
          setErrorMessage(textosBienestar.errorTerapeutaInactivo);
        } else {
          setErrorMessage(err.message || 'Error al actualizar el estado de la cita.');
        }
      } else {
        setErrorMessage('Ocurrió un error inesperado al actualizar el estado.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cambiar-estado-titulo"
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-neutro-400 hover:bg-neutro-100 hover:text-neutro-700 transition-colors"
          aria-label={textosBienestar.cancelar}
        >
          <X className="size-5" />
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">{textosBienestar.adminCitasSubtitulo}</p>
            <h2 id="modal-cambiar-estado-titulo" className="font-serif text-xl font-bold text-neutro-900">
              {textosBienestar.cambiarEstado}
            </h2>
            <p className="text-xs text-neutro-500 mt-1">
              Actualización operativa para la cita #{cita.id}
            </p>
          </div>

          <div className="rounded-lg bg-neutro-50 p-3.5 border border-neutro-200 text-xs space-y-1">
            <p className="font-semibold text-neutro-900">
              {cita.ServicioBienestar?.nombre ?? 'Tratamiento de spa'}
            </p>
            <p className="text-neutro-600">
              Huésped: {cita.Usuario?.nombre ?? 'Cliente'} ({cita.Usuario?.email ?? ''})
            </p>
            <p className="text-neutro-600">
              Fecha: {cita.fecha} · Horario: {cita.hora_inicio} a {cita.hora_fin}
            </p>
            <p className="text-neutro-600">
              Terapeuta: {cita.Terapeuta?.nombre ?? 'No asignado'}
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-md bg-rojo-50 p-3 border border-rojo-200 flex items-start gap-2.5 text-xs text-rojo-700">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nuevo-estado" className="text-xs font-semibold text-neutro-700">
              {textosBienestar.nuevoEstado}
            </label>
            <select
              id="nuevo-estado"
              {...register('estado')}
              className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            >
              <option value="confirmada">{textosBienestar.estados.confirmada}</option>
              <option value="completada">{textosBienestar.estados.completada}</option>
              <option value="cancelada">{textosBienestar.estados.cancelada}</option>
            </select>
          </div>

          {esReactivacion && (
            <div className="rounded-md bg-oro-50 p-3 border border-oro-200 flex items-start gap-2.5 text-xs text-oro-800">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-oro-600" />
              <span>{textosBienestar.advertenciaReactivar}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              {textosBienestar.cancelar}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isSubmitting ? textosBienestar.actualizandoEstado : textosBienestar.guardar}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
