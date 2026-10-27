import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Calendar, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useTerapeutasQuery, useCreateCitaMutation } from '../hooks/useBienestar';
import { reservaCitaSchema, type ReservaCitaFormValues } from '../schemas/bienestar.schemas';
import { textosBienestar, formatearGTQ } from '../textos';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { ApiError } from '@/api/client/http';
import type { ServicioBienestar, CitaBienestar } from '../types';

interface ReservaCitaModalProps {
  servicio: ServicioBienestar;
  onClose: () => void;
  onSuccess?: (cita: CitaBienestar) => void;
}

export const ReservaCitaModal: React.FC<ReservaCitaModalProps> = ({
  servicio,
  onClose,
  onSuccess,
}) => {
  const { user, status } = useAuth();
  const isAuthenticated = status === 'authenticated' && user?.rol === 'cliente';
  const terapeutasQuery = useTerapeutasQuery();
  const createCitaMutation = useCreateCitaMutation();

  const [createdCita, setCreatedCita] = useState<CitaBienestar | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const terapeutasActivos = (terapeutasQuery.data ?? []).filter((t) => t.activo !== false);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReservaCitaFormValues>({
    resolver: zodResolver(reservaCitaSchema),
    defaultValues: {
      servicio_bienestar_id: servicio.id,
      terapeuta_id: undefined,
      fecha: todayStr,
      hora_inicio: '10:00',
    },
  });

  const onSubmit = async (values: ReservaCitaFormValues) => {
    setErrorMessage(null);
    try {
      const cita = await createCitaMutation.mutateAsync({
        servicio_bienestar_id: Number(values.servicio_bienestar_id),
        terapeuta_id: Number(values.terapeuta_id),
        fecha: values.fecha,
        hora_inicio: values.hora_inicio,
      });
      setCreatedCita(cita);
      onSuccess?.(cita);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'THERAPIST_BUSY_OR_BUFFER' || err.status === 409) {
          setErrorMessage(textosBienestar.errorTerapeutaOcupado);
        } else if (err.code === 'THERAPIST_INACTIVE' || err.status === 422) {
          setErrorMessage(textosBienestar.errorTerapeutaInactivo);
        } else if (err.code === 'WELLNESS_SERVICE_NOT_FOUND' || err.status === 404) {
          setErrorMessage(textosBienestar.errorServicioNoEncontrado);
        } else {
          setErrorMessage(err.message || textosBienestar.errorGenericoCreacion);
        }
      } else {
        setErrorMessage(textosBienestar.errorInciertoRed);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutro-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reserva-titulo"
    >
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-neutro-400 hover:bg-neutro-100 hover:text-neutro-700 transition-colors"
          aria-label={textosBienestar.cancelar}
        >
          <X className="size-5" />
        </button>

        {/* Pantalla de éxito */}
        {createdCita ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-selva-100 text-selva-700">
              <CheckCircle className="size-8" aria-hidden="true" />
            </div>
            <h2 id="modal-reserva-titulo" className="font-serif text-2xl font-bold text-neutro-900 mb-2">
              {textosBienestar.citaExitosaTitulo}
            </h2>
            <p className="text-sm text-neutro-600 mb-6 max-w-md">
              {textosBienestar.citaExitosaDesc}
            </p>

            <div className="w-full rounded-lg bg-neutro-50 p-4 text-left border border-neutro-200 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutro-500 font-medium">{textosBienestar.citaNumero(createdCita.id ?? '')}</span>
                <span className="rounded-full bg-selva-100 px-2 py-0.5 text-xs font-semibold text-selva-800 uppercase">
                  {createdCita.estado}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.servicioContratado}</span>
                <span className="font-medium text-neutro-900">{servicio.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.terapeutaAsignado}</span>
                <span className="font-medium text-neutro-900">
                  {createdCita.Terapeuta?.nombre ?? 'Terapeuta asignado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.fechaCita}</span>
                <span className="font-medium text-neutro-900">{createdCita.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.horarioCita}</span>
                <span className="font-medium text-neutro-900">
                  {createdCita.hora_inicio} - {createdCita.hora_fin}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutro-200">
                <span className="font-semibold text-neutro-700">{textosBienestar.tarifaServicio}</span>
                <span className="font-bold text-bronce-700">{formatearGTQ(servicio.precio)}</span>
              </div>
            </div>

            <div className="flex w-full flex-col sm:flex-row gap-3">
              <Link
                to={BIENESTAR_ROUTES.MIS_RESERVAS}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-bronce-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-bronce-700 transition-colors"
              >
                <span>{textosBienestar.volverAMisCitas}</span>
              </Link>
              <Button type="button" variant="secondary" onClick={onClose} className="w-full">
                {textosBienestar.cancelar}
              </Button>
            </div>
          </div>
        ) : !isAuthenticated ? (
          /* Aviso de autenticación requerida */
          <div className="flex flex-col items-center text-center py-4">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-oro-100 text-oro-700">
              <AlertCircle className="size-6" aria-hidden="true" />
            </div>
            <h2 id="modal-reserva-titulo" className="font-serif text-xl font-bold text-neutro-900 mb-2">
              Autenticación requerida
            </h2>
            <p className="text-sm text-neutro-600 mb-6">
              {textosBienestar.iniciarSesionParaReservar}
            </p>
            <div className="flex w-full gap-3">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center rounded-md bg-bronce-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-bronce-700 transition-colors"
              >
                {textosBienestar.irAlLogin}
              </Link>
              <Button type="button" variant="secondary" onClick={onClose} className="w-full">
                {textosBienestar.cancelar}
              </Button>
            </div>
          </div>
        ) : (
          /* Formulario de Reserva */
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <p className="eyebrow">{textosBienestar.subtitulo}</p>
              <h2 id="modal-reserva-titulo" className="font-serif text-xl font-bold text-neutro-900">
                {textosBienestar.modalReservaTitulo}
              </h2>
              <p className="text-xs text-neutro-500 mt-1">
                {textosBienestar.modalReservaDesc}
              </p>
            </div>

            {/* Resumen del Servicio */}
            <div className="rounded-lg bg-selva-50/60 p-3.5 border border-selva-200 text-xs flex justify-between items-center">
              <div>
                <p className="font-semibold text-selva-900">{servicio.nombre}</p>
                <p className="text-selva-700">
                  {textosBienestar.duracionCalculada} {servicio.duracion_minutos} {textosBienestar.minutos}
                </p>
              </div>
              <p className="font-bold text-sm text-selva-900">{formatearGTQ(servicio.precio)}</p>
            </div>

            {errorMessage && (
              <div className="rounded-md bg-rojo-50 p-3 border border-rojo-200 flex items-start gap-2.5 text-xs text-rojo-700">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Campo Terapeuta */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="terapeuta_id" className="text-xs font-semibold text-neutro-700 flex items-center gap-1.5">
                <User className="size-3.5 text-neutro-500" />
                {textosBienestar.seleccionarTerapeuta}
              </label>
              <select
                id="terapeuta_id"
                {...register('terapeuta_id', { valueAsNumber: true })}
                className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                disabled={terapeutasQuery.isPending}
              >
                <option value="">{textosBienestar.seleccioneTerapeutaOpcion}</option>
                {terapeutasActivos.map((terapeuta) => (
                  <option key={terapeuta.id} value={terapeuta.id}>
                    {terapeuta.nombre}
                  </option>
                ))}
              </select>
              {errors.terapeuta_id && (
                <p className="text-xs text-rojo-600">{errors.terapeuta_id.message}</p>
              )}
            </div>

            {/* Campo Fecha */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fecha" className="text-xs font-semibold text-neutro-700 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-neutro-500" />
                {textosBienestar.fecha}
              </label>
              <input
                type="date"
                id="fecha"
                min={todayStr}
                {...register('fecha')}
                className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
              />
              {errors.fecha && (
                <p className="text-xs text-rojo-600">{errors.fecha.message}</p>
              )}
            </div>

            {/* Campo Hora de Inicio */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hora_inicio" className="text-xs font-semibold text-neutro-700 flex items-center gap-1.5">
                <Clock className="size-3.5 text-neutro-500" />
                {textosBienestar.horaInicio}
              </label>
              <input
                type="time"
                id="hora_inicio"
                {...register('hora_inicio')}
                className="w-full rounded-md border border-neutro-300 bg-white px-3 py-2 text-sm text-neutro-900 shadow-sm focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
              />
              {errors.hora_inicio && (
                <p className="text-xs text-rojo-600">{errors.hora_inicio.message}</p>
              )}
            </div>

            {/* Nota de negocio */}
            <p className="text-[0.6875rem] text-neutro-500 italic">
              {textosBienestar.notaDisponibilidad}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                {textosBienestar.cancelar}
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {isSubmitting ? textosBienestar.procesandoCita : textosBienestar.confirmarCita}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
