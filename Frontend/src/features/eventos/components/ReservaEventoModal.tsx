import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { useCreateReservaEventoMutation } from '../hooks/useEventos';
import {
  createReservaEventoFormSchema,
  type CreateReservaEventoFormData,
} from '../schemas/evento.schemas';
import {
  textosEventos,
  etiquetasTipoEvento,
  formatearGTQ,
} from '../textos';
import type { Salon, ReservaEvento, TipoEvento } from '../types';
import { getApiErrorMessage } from '@/api/errors';

interface ReservaEventoModalProps {
  salon: Salon;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reserva: ReservaEvento) => void;
}

export const ReservaEventoModal: React.FC<ReservaEventoModalProps> = ({
  salon,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateReservaEventoMutation();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateReservaEventoFormData>({
    resolver: zodResolver(createReservaEventoFormSchema),
    defaultValues: {
      salon_id: salon.id ?? 0,
      tipo_evento: 'ejecutivo',
      fecha: defaultDate,
      hora_inicio: '10:00',
      hora_fin: '14:00',
      numero_invitados: Math.min(50, salon.capacidad_maxima ?? 50),
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: CreateReservaEventoFormData) => {
    if (status !== 'authenticated' || !user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    setErrorMessage(null);
    try {
      const nuevaReserva = await createMutation.mutateAsync({
        salon_id: salon.id!,
        tipo_evento: data.tipo_evento,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        numero_invitados: Number(data.numero_invitados),
      });

      reset();
      if (onSuccess) {
        onSuccess(nuevaReserva);
      } else {
        navigate(`/mis-reservas/eventos/${nuevaReserva.id}`);
      }
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-950/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reserva-titulo"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-neutro-400 hover:bg-neutro-100 hover:text-neutro-700 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="flex flex-col gap-2">
          <p className="eyebrow text-selva-700">{salon.nombre}</p>
          <h2 id="modal-reserva-titulo" className="text-xl font-serif font-bold text-neutro-900 sm:text-2xl">
            {textosEventos.modalReservaTitulo}
          </h2>
          <p className="text-xs text-neutro-600 sm:text-sm">
            {textosEventos.modalReservaSubtitulo}
          </p>
        </div>

        {/* Resumen del Salón */}
        <div className="my-4 rounded-lg bg-neutro-50 p-4 border border-neutro-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-neutro-500 block">Capacidad máxima:</span>
            <span className="font-semibold text-neutro-800">{salon.capacidad_maxima} personas</span>
          </div>
          <div>
            <span className="text-neutro-500 block">Tarifa base de salón:</span>
            <span className="font-semibold text-bronce-700">{formatearGTQ(salon.tarifa_base)}</span>
          </div>
          {salon.sucursal?.nombre && (
            <div>
              <span className="text-neutro-500 block">Sede:</span>
              <span className="font-semibold text-neutro-800">{salon.sucursal.nombre}</span>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4">
            <Alert tone="error" title="No se pudo registrar la cotización">
              {errorMessage}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-sm">
          {/* Tipo de evento */}
          <div>
            <label htmlFor="tipo_evento" className="block text-xs font-semibold text-neutro-700 mb-1">
              {textosEventos.campoTipoEvento}
            </label>
            <select
              id="tipo_evento"
              {...register('tipo_evento')}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            >
              {(Object.keys(etiquetasTipoEvento) as TipoEvento[]).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {etiquetasTipoEvento[tipo]}
                </option>
              ))}
            </select>
            {errors.tipo_evento && (
              <p className="mt-1 text-xs text-error-600">{errors.tipo_evento.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="fecha" className="block text-xs font-semibold text-neutro-700 mb-1">
              {textosEventos.campoFecha}
            </label>
            <input
              type="date"
              id="fecha"
              {...register('fecha')}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            />
            {errors.fecha && (
              <p className="mt-1 text-xs text-error-600">{errors.fecha.message}</p>
            )}
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="hora_inicio" className="block text-xs font-semibold text-neutro-700 mb-1">
                {textosEventos.campoHoraInicio}
              </label>
              <input
                type="time"
                id="hora_inicio"
                {...register('hora_inicio')}
                className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
              />
              {errors.hora_inicio && (
                <p className="mt-1 text-xs text-error-600">{errors.hora_inicio.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="hora_fin" className="block text-xs font-semibold text-neutro-700 mb-1">
                {textosEventos.campoHoraFin}
              </label>
              <input
                type="time"
                id="hora_fin"
                {...register('hora_fin')}
                className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
              />
              {errors.hora_fin && (
                <p className="mt-1 text-xs text-error-600">{errors.hora_fin.message}</p>
              )}
            </div>
          </div>

          {/* Número de invitados */}
          <div>
            <label htmlFor="numero_invitados" className="block text-xs font-semibold text-neutro-700 mb-1">
              {textosEventos.campoInvitados} (máx. {salon.capacidad_maxima})
            </label>
            <input
              type="number"
              id="numero_invitados"
              {...register('numero_invitados', { valueAsNumber: true })}
              min={1}
              max={salon.capacidad_maxima ?? 500}
              className="w-full rounded-lg border border-neutro-300 bg-white px-3 py-2 text-neutro-900 shadow-sm focus:border-selva-500 focus:outline-none focus:ring-1 focus:ring-selva-500"
            />
            {errors.numero_invitados && (
              <p className="mt-1 text-xs text-error-600">{errors.numero_invitados.message}</p>
            )}
          </div>

          <div className="rounded-lg bg-selva-50 border border-selva-200 p-3 text-xs text-selva-800">
            {textosEventos.avisoDisponibilidad}
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting || createMutation.isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || createMutation.isPending}
            >
              {isSubmitting || createMutation.isPending
                ? textosEventos.creandoCotizacion
                : textosEventos.botonCrearCotizacion}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
