import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import {
  RESERVAS_ROUTES,
  type ReservaHabitacion,
} from '@/features/reservas';
import {
  calcularNoches,
  formatFechaCalendario,
  formatGTQ,
  resolverNombreSede,
} from '../formato';
import { textosMisReservas } from '../textos';
import { ReservaEstadoBadge } from './ReservaEstadoBadge';

interface ReservaCardProps {
  reserva: ReservaHabitacion;
  sedesPorId: ReadonlyMap<number, string>;
}

export const ReservaCard: React.FC<ReservaCardProps> = ({
  reserva,
  sedesPorId,
}) => {
  const habitacion = reserva.Habitacion;
  const tipo = habitacion?.TipoHabitacion;
  const noches = calcularNoches(
    reserva.fecha_entrada,
    reserva.fecha_salida,
  );
  const importe = formatGTQ(reserva.total);

  return (
    <article className="surface flex h-full flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="eyebrow">
            {textosMisReservas.reservaNumero(reserva.id)}
          </p>
          <h2 className="text-lg font-serif font-semibold text-neutro-900">
            {habitacion
              ? textosMisReservas.habitacionNumero(habitacion.numero)
              : textosMisReservas.sinHabitacion}
          </h2>
          <p className="text-xs text-neutro-600">
            {tipo?.nombre ?? textosMisReservas.sinTipo}
          </p>
        </div>
        <ReservaEstadoBadge estado={reserva.estado} />
      </div>

      <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="eyebrow">{textosMisReservas.campos.sede}</dt>
          <dd className="text-neutro-800">
            {resolverNombreSede(reserva, sedesPorId)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="eyebrow">{textosMisReservas.campos.huespedes}</dt>
          <dd className="text-neutro-800">
            {textosMisReservas.huespedes(reserva.numero_huespedes)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="eyebrow">{textosMisReservas.campos.entrada}</dt>
          <dd className="text-neutro-800">
            {formatFechaCalendario(reserva.fecha_entrada)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="eyebrow">{textosMisReservas.campos.salida}</dt>
          <dd className="text-neutro-800">
            {formatFechaCalendario(reserva.fecha_salida)}
          </dd>
        </div>
        {noches !== null && (
          <div className="flex flex-col gap-1">
            <dt className="eyebrow">{textosMisReservas.campos.noches}</dt>
            <dd className="text-neutro-800">
              {textosMisReservas.noches(noches)}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-neutro-200 pt-3">
        <div className="flex flex-col gap-1">
          <p className="eyebrow">{textosMisReservas.campos.importe}</p>
          <p className="text-lg font-semibold text-neutro-900">
            {importe ?? textosMisReservas.noDisponible}
          </p>
        </div>
        <Link
          to={RESERVAS_ROUTES.DETALLE(reserva.id)}
          aria-label={textosMisReservas.verDetalleReserva(reserva.id)}
          className={buttonStyles({ variant: 'ghost', size: 'sm' })}
        >
          <span>{textosMisReservas.verDetalle}</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};
