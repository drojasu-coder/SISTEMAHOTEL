import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/api/client/http';
import { TranslatedError } from '@/i18n/public';
import { RESERVAS_ROUTES } from '@/features/reservas/constants/routes';

import type { DisponibilidadHabitacionQuery } from '../types';
import type { HabitacionDisponiblePublico } from '@/features/habitaciones/types';
import { DraftSiteNotice } from '@/features/preferencias/SiteContextNotice';

export interface ResumenReservaModalProps {
  open: boolean;
  onClose: () => void;
  habitacion: HabitacionDisponiblePublico | null;
  criterios: DisponibilidadHabitacionQuery | null;
  sedeNombre?: string;
  isSubmitting: boolean;
  invalidated?: boolean;
  error: unknown;
  onConfirm: () => void;
  onActualizarDisponibilidad: () => void;
}

export const ResumenReservaModal: React.FC<ResumenReservaModalProps> = ({
  open,
  onClose,
  habitacion,
  criterios,
  sedeNombre,
  isSubmitting,
  invalidated = false,
  error,
  onConfirm,
  onActualizarDisponibilidad,
}) => {
  const textosCrearReserva = usePublicTexts('crearReserva');
  const { p, date: calendarDate } = usePublicInterface();
  if (!habitacion || !criterios) return null;

  const isConflict409 =
    error instanceof ApiError && error.status === 409;
  const isNetworkError =
    Boolean(error && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500 || error.code === 'NETWORK_ERROR'));

  const tipoNombre = habitacion.tipo?.nombre ?? p('room');
  const sedeFinal =
    sedeNombre ?? habitacion.sucursal?.nombre ?? p('siteName');

  return (
    <Modal
      busy={isSubmitting}
      busyLabel={p('processingRequest')}
      open={open}
      onClose={onClose}
      closeLabel={p('closeModal')}
      title={textosCrearReserva.resumenTitulo}
      description={textosCrearReserva.resumenDesc}
    >
      <div className="flex flex-col gap-5">
        <DraftSiteNotice blocked={invalidated} />
        {/* Manejo de Error 409: Conflicto */}
        {isConflict409 && (
          <Alert tone="error" title={textosCrearReserva.error409Titulo}>
            <div className="flex flex-col gap-2">
              <p>{textosCrearReserva.error409Mensaje}</p>
              <div className="mt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onActualizarDisponibilidad}
                  className="bg-white text-error-700 hover:bg-error-100"
                >
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  {textosCrearReserva.botonActualizarDisponibilidad}
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {/* Manejo de Error de Red / Resultado Incierto */}
        {isNetworkError && (
          <Alert tone="warning" title={textosCrearReserva.errorRedTitulo}>
            <div className="flex flex-col gap-2">
              <p>{textosCrearReserva.errorRedMensaje}</p>
              <div className="mt-1">
                <Link
                  to={RESERVAS_ROUTES.MIS_RESERVAS}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-advertencia-800 underline hover:text-advertencia-900"
                >
                  {textosCrearReserva.botonMisReservas}
                </Link>
              </div>
            </div>
          </Alert>
        )}

        {/* Otros errores de la API (400, 422, 500) */}
        {Boolean(error) && !isConflict409 && !isNetworkError && (
          <Alert tone="error">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span><TranslatedError error={{ api: error }} /></span>
            </div>
          </Alert>
        )}

        {/* Desglose de la reserva */}
        <div className="rounded-lg border border-neutro-200 bg-neutro-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="text-xs text-neutro-500">
                {textosCrearReserva.resumenSede}
              </span>
              <p className="font-semibold text-neutro-800">{sedeFinal}</p>
            </div>

            <div>
              <span className="text-xs text-neutro-500">
                {textosCrearReserva.resumenHabitacion}
              </span>
              <p className="font-semibold text-neutro-800">
                {tipoNombre}
              </p>
            </div>

            <div>
              <span className="text-xs text-neutro-500">
                {textosCrearReserva.resumenFechas}
              </span>
              <p className="text-xs font-medium text-neutro-800">
                {calendarDate(criterios.fecha_entrada)} {' '}{p('until')}{' '}{calendarDate(criterios.fecha_salida)}
              </p>
            </div>

            <div>
              <span className="text-xs text-neutro-500">
                {textosCrearReserva.resumenHuespedes}
              </span>
              <p className="text-xs font-medium text-neutro-800">
                {criterios.numero_huespedes}{' '}
                {criterios.numero_huespedes === 1 ? p('guest') : p('guests')}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-neutro-200 pt-3">
            <div className="flex items-center justify-between text-xs text-neutro-600">
              <span>{textosCrearReserva.resumenNoches}</span>
              <span className="font-medium text-neutro-800">
                {textosCrearReserva.nochesCalculadas(habitacion.noches)}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs text-neutro-600">
              <span>{textosCrearReserva.resumenTarifaNoche}</span>
              <span className="font-medium text-neutro-800">
                <MoneyReference amount={habitacion.tarifa_noche} />
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between border-t border-neutro-300 pt-2">
              <span className="text-sm font-bold text-neutro-900">
                {textosCrearReserva.resumenTotal}
              </span>
              <span className="font-serif text-xl font-bold text-selva-700">
                <MoneyReference amount={habitacion.total_estimado} />
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {textosCrearReserva.botonCancelar}
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || isConflict409 || isNetworkError || invalidated}
            onClick={onConfirm}
          >
            {isSubmitting
              ? textosCrearReserva.creandoReserva
              : textosCrearReserva.botonConfirmarReserva}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
