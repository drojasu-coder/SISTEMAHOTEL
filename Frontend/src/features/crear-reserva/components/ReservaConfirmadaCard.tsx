import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import React from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { RESERVAS_ROUTES } from '@/features/reservas/constants/routes';
import { BotonAnadirAlCarrito } from '@/features/carrito';

import type { ReservaHabitacion } from '../types';
import type { ReservaHabitacionConCarrito } from '@/features/reservas/types';
import { Countdown } from '@/components/ui/Countdown';
import { CARRITO_ROUTES } from '@/features/carrito/constants/routes';

export interface ReservaConfirmadaCardProps {
  reserva: ReservaHabitacionConCarrito;
  onReset: () => void;
}

export const ReservaConfirmadaCard: React.FC<ReservaConfirmadaCardProps> = ({
  reserva,
  onReset,
}) => {
  const textosCrearReserva = usePublicTexts('crearReserva');
  const { p, date: calendarDate } = usePublicInterface();
  const isPendiente = reserva.estado === 'pendiente';
  // El backend incluye el tipo completo, incluido su nombre comercial cuando existe.
  const tipo = reserva.Habitacion?.TipoHabitacion as (NonNullable<NonNullable<ReservaHabitacion['Habitacion']>['TipoHabitacion']> & { nombre_comercial?: string | null }) | undefined;
  const nombreComercial = tipo?.nombre_comercial?.trim() || tipo?.nombre;
  const sede = reserva.Habitacion?.Sucursal?.nombre;

  return (
    <Card className="flex flex-col gap-6 border-selva-600/30 bg-selva-50/10 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-exito-100 text-exito-700">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-serif text-2xl font-bold text-neutro-900">
          {textosCrearReserva.exitoTitulo}
        </h2>
        <p className="mt-1 text-sm text-neutro-600">
          {textosCrearReserva.exitoDesc}
        </p>
      </div>

      {isPendiente && (
        <Alert tone="warning" title={p('pendingReservation')}>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-advertencia-700" aria-hidden="true" />
            <p className="text-xs text-advertencia-800">
              {textosCrearReserva.estadoPendienteAviso}
            </p>
          </div>
        </Alert>
      )}

      {/* Datos persistidos de la reserva */}
      <div className="rounded-lg border border-neutro-200 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sede && <div>
            <span className="text-xs text-neutro-500">{textosCrearReserva.resumenSede}</span>
            <p lang="es" className="text-sm font-semibold text-neutro-800">{sede}</p>
          </div>}
          {nombreComercial && (
            <div>
              <span className="text-xs text-neutro-500">{textosCrearReserva.resumenHabitacion}</span>
              <p lang="es" className="text-sm font-semibold text-neutro-800">{nombreComercial}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-neutro-500">
              {textosCrearReserva.exitoId}
            </span>
            <p className="font-mono text-base font-bold text-selva-800">
              #{reserva.id}
            </p>
          </div>

          <div>
            <span className="text-xs text-neutro-500">
              {textosCrearReserva.exitoEstado}
            </span>
            <p className="text-sm font-semibold capitalize text-neutro-800">
              <StatusBadge domain="reservation" value={reserva.estado} />
            </p>
          </div>

          <div>
            <span className="text-xs text-neutro-500">
              {textosCrearReserva.exitoTotal}
            </span>
            <p className="font-serif text-lg font-bold text-selva-700">
              <MoneyReference amount={reserva.total} />
            </p>
          </div>

          <div>
            <span className="text-xs text-neutro-500">{p('stay')}</span>
            <p className="text-xs font-medium text-neutro-800">
              {calendarDate(reserva.fecha_entrada)} {' '}{p('until')}{' '}{calendarDate(reserva.fecha_salida)}
            </p>
          </div>

          <div>
            <span className="text-xs text-neutro-500">{p('guestsLabel')}</span>
            <p className="text-xs font-medium text-neutro-800">
              {reserva.numero_huespedes}{' '}
              {reserva.numero_huespedes === 1 ? p('guest') : p('guests')}
            </p>
          </div>


        </div>
      </div>

      {/* La reserva ya queda preparada en el carrito; el pago solo comienza cuando el cliente lo decide. */}
      {isPendiente && reserva.carrito?.vinculada ? (
        <div className="flex flex-col gap-3 rounded-lg border border-bronce-200 bg-bronce-50/50 p-4">
          <p className="text-sm font-medium text-neutro-800">
            {reserva.reutilizada ? p('reservedExisting') : p('reservedInCart')}
          </p>
          {reserva.carrito.expira_en && <p className="text-xs font-semibold text-neutro-700">{p('payWithin')}</p>}
          {reserva.carrito.expira_en && (
            <Countdown expiresAt={reserva.carrito.expira_en} label={p('payWithin')} warningText={p('purchaseSoon')} expiredText={p('purchaseExpired')} />
          )}
          <p className="text-xs text-neutro-600">{p('paymentNotCharged')}</p>
          <div>
            <Link
              to={CARRITO_ROUTES.CARRITO}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-selva-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-selva-700"
            >
              {p('continueToPayment')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : isPendiente ? (
        <div className="rounded-lg border border-bronce-200 bg-bronce-50/50 p-4">
          <p className="mb-3 text-xs font-medium text-neutro-700">{p('cartLinkFailed')}</p>
          <BotonAnadirAlCarrito
            publicInterface
            reservaId={reserva.id}
            reservaEstado={reserva.estado}
            variant="secondary"
            size="sm"
          />
        </div>
      ) : null}

      {/* Acciones y Enlaces usando RESERVAS_ROUTES */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {textosCrearReserva.botonNuevaBusqueda}
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={RESERVAS_ROUTES.DETALLE(reserva.id)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-selva-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-selva-700"
          >
            {textosCrearReserva.botonVerDetalle}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
