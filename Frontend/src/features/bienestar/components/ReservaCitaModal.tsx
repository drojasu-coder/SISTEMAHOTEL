import { DateField } from '@/components/ui/DateField';
import { TimeField } from '@/components/ui/TimeField';
import { Select } from '@/components/ui/Select';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { Modal } from '@/components/ui/Modal';
import { TranslatedError, type LocalizedError } from '@/i18n/public';
import { useRevalidateErrors, usePublicTexts, usePublicInterface } from '@/i18n/public';
import React, { useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useTerapeutasQuery, useCreateCitaMutation } from '../hooks/useBienestar';
import { createReservaCitaSchema, type ReservaCitaFormValues } from '../schemas/bienestar.schemas';

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
  const textosBienestar = usePublicTexts('bienestar');
  const { p, locale, date: calendarDate } = usePublicInterface();
  const { user, status } = useAuth();
  const isAuthenticated = status === 'authenticated' && user?.rol === 'cliente';
  const terapeutasQuery = useTerapeutasQuery();
  const createCitaMutation = useCreateCitaMutation();

  const [createdCita, setCreatedCita] = useState<CitaBienestar | null>(null);
  const [errorMessage, setErrorMessage] = useState<LocalizedError | null>(null);

  const terapeutasActivos = (terapeutasQuery.data ?? []).filter((t) => t.activo !== false);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ReservaCitaFormValues>({
    resolver: zodResolver(createReservaCitaSchema(p), { errorMap: () => ({ message: p('invalidField') }) }),
    defaultValues: {
      servicio_bienestar_id: servicio.id,
      terapeuta_id: undefined,
      fecha: todayStr,
      hora_inicio: '10:00',
    },
  });

  const onSubmit = async (values: ReservaCitaFormValues) => {
    if (createCitaMutation.isPending) return;
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
          setErrorMessage({ section: 'bienestar', key: 'errorTerapeutaOcupado' });
        } else if (err.code === 'THERAPIST_INACTIVE' || err.status === 422) {
          setErrorMessage({ section: 'bienestar', key: 'errorTerapeutaInactivo' });
        } else if (err.code === 'WELLNESS_SERVICE_NOT_FOUND' || err.status === 404) {
          setErrorMessage({ section: 'bienestar', key: 'errorServicioNoEncontrado' });
        } else {
          setErrorMessage({ api: err });
        }
      } else {
        setErrorMessage({ section: 'bienestar', key: 'errorInciertoRed' });
      }
    }
  };

  useRevalidateErrors(locale, () => trigger(), Object.keys(errors).length > 0);

  return (
    <Modal open onClose={onClose} closeLabel={p('closeModal')} title={createdCita ? textosBienestar.citaExitosaTitulo : textosBienestar.modalReservaTitulo} busy={createCitaMutation.isPending || isSubmitting} busyLabel={p('processingRequest')}>
        {/* Pantalla de éxito */}
        {createdCita ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-selva-100 text-selva-700">
              <CheckCircle className="size-8" aria-hidden="true" />
            </div>

            <p className="text-sm text-neutro-600 mb-6 max-w-md">
              {textosBienestar.citaExitosaDesc}
            </p>

            <div className="w-full rounded-lg bg-neutro-50 p-4 text-left border border-neutro-200 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutro-500 font-medium">{textosBienestar.citaNumero(createdCita.id ?? '')}</span>
                <StatusBadge domain="reservation" value={createdCita.estado} />
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.servicioContratado}</span>
                <span className="font-medium text-neutro-900"><span lang="es">{servicio.nombre}</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.terapeutaAsignado}</span>
                <span className="font-medium text-neutro-900">
                  {createdCita.Terapeuta?.nombre ?? p('assignedTherapist')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.fechaCita}</span>
                <span className="font-medium text-neutro-900">{calendarDate(createdCita.fecha)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">{textosBienestar.horarioCita}</span>
                <span className="font-medium text-neutro-900">
                  {createdCita.hora_inicio} - {createdCita.hora_fin}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutro-200">
                <span className="font-semibold text-neutro-700">{textosBienestar.tarifaServicio}</span>
                <span className="font-bold text-bronce-700"><MoneyReference amount={servicio.precio} /></span>
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

              <p className="text-xs text-neutro-500 mt-1">
                {textosBienestar.modalReservaDesc}
              </p>
            </div>

            {/* Resumen del Servicio */}
            <div className="rounded-lg bg-selva-50/60 p-3.5 border border-selva-200 text-xs flex justify-between items-center">
              <div>
                <p className="font-semibold text-selva-900"><span lang="es">{servicio.nombre}</span></p>
                <p className="text-selva-700">
                  {textosBienestar.duracionCalculada} {servicio.duracion_minutos} {textosBienestar.minutos}
                </p>
              </div>
              <p className="font-bold text-sm text-selva-900"><MoneyReference amount={servicio.precio} /></p>
            </div>

            {errorMessage && (
              <div className="rounded-md bg-rojo-50 p-3 border border-rojo-200 flex items-start gap-2.5 text-xs text-rojo-700">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span><TranslatedError error={errorMessage} /></span>
              </div>
            )}

            <Select label={textosBienestar.seleccionarTerapeuta} id="terapeuta_id" {...register('terapeuta_id', { valueAsNumber: true })} error={errors.terapeuta_id?.message} disabled={terapeutasQuery.isPending || isSubmitting}>
              <option value="">{textosBienestar.seleccioneTerapeutaOpcion}</option>
              {terapeutasActivos.map((terapeuta) => <option key={terapeuta.id} value={terapeuta.id} lang="es">{terapeuta.nombre}</option>)}
            </Select>
            <DateField label={textosBienestar.fecha} id="fecha" min={todayStr} {...register('fecha')} error={errors.fecha?.message} disabled={isSubmitting} />
            <TimeField label={textosBienestar.horaInicio} id="hora_inicio" {...register('hora_inicio')} error={errors.hora_inicio?.message} disabled={isSubmitting} />

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
    </Modal>
  );
};
