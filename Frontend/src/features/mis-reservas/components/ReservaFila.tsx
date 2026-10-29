import { CancelarReservaPropia } from './CancelarReservaPropia';
import { ContinuarPagoReserva } from './ContinuarPagoReserva';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { commercialRoomName } from '@/features/habitaciones/public/roomCategories';
import React from 'react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { RESERVAS_ROUTES, type ReservaHabitacion } from '@/features/reservas';
import { calcularNoches, estanciaTerminada, resolverNombreSede } from '../formato';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { ReservaEstadoBadge } from './ReservaEstadoBadge';

interface ReservaFilaProps {
  reserva: ReservaHabitacion;
  sedesPorId: ReadonlyMap<number, string>;
}

/** Fila compacta: datos a la izquierda, una acción principal a la derecha y las secundarias discretas. */
export const ReservaFila: React.FC<ReservaFilaProps> = ({ reserva, sedesPorId }) => {
  const [cancelada, setCancelada] = React.useState(false);
  const textos = usePublicTexts('misReservas');
  const { date, p } = usePublicInterface();
  const habitacion = reserva.Habitacion;
  const tipo = habitacion?.TipoHabitacion;
  const noches = calcularNoches(reserva.fecha_entrada, reserva.fecha_salida);
  const estado = cancelada ? 'cancelada' : reserva.estado;
  const pendiente = estado === 'pendiente';
  const terminada = estanciaTerminada(reserva);
  const pagable = pendiente && !terminada;

  return (
    <li className="px-4 py-5 sm:px-6">
      <div className="grid min-w-0 gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_7rem_6.5rem_18.5rem] xl:items-center">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-bronce-700">{textos.reservaNumero(reserva.id)}</p>
          <p className="text-base font-semibold leading-snug text-neutro-900">
            {habitacion ? textos.habitacionNumero(habitacion.numero) : textos.sinHabitacion}
            {tipo && <span className="font-normal text-neutro-700"> · {commercialRoomName(tipo)}</span>}
          </p>
          <p className="text-sm text-neutro-600" lang="es">{resolverNombreSede(reserva, sedesPorId, textos)}</p>
        </div>

        <p className="min-w-0 text-sm text-neutro-900">
          <span className="sr-only">{textos.campos.entrada} / {textos.campos.salida}: </span>
          <span className="font-medium">{date(reserva.fecha_entrada)} → {date(reserva.fecha_salida)}</span>
          {noches !== null && <span className="block text-neutro-600">{textos.noches(noches)}</span>}
        </p>

        <div className="flex items-center justify-between gap-3 md:col-span-2 xl:col-span-2 xl:grid xl:grid-cols-[7rem_6.5rem] xl:gap-6">
          <ReservaEstadoBadge estado={estado} />
          <p className="text-base font-semibold text-neutro-900 xl:text-right"><MoneyReference amount={reserva.total} /></p>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
          {pagable
            ? <ContinuarPagoReserva reservaId={reserva.id} />
            : <Link to={RESERVAS_ROUTES.DETALLE(reserva.id)} aria-label={textos.verDetalleReserva(reserva.id)} className={buttonStyles({ variant: 'secondary', size: 'sm', className: 'w-full justify-center' })}>{textos.verDetalle}</Link>}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 xl:flex-nowrap">
            {pagable && <Link to={RESERVAS_ROUTES.DETALLE(reserva.id)} aria-label={textos.verDetalleReserva(reserva.id)} className={buttonStyles({ variant: 'text', size: 'sm' })}>{textos.verDetalle}</Link>}
            {pendiente && <CancelarReservaPropia reservaId={reserva.id} compact onCancelled={() => setCancelada(true)} />}
          </div>
        </div>
      </div>
      {pendiente && terminada && <p className="mt-3 text-sm text-neutro-600">{p('resStayEnded')}</p>}
    </li>
  );
};
