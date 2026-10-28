import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Calendar, Hotel, User, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { buttonStyles } from '@/components/ui/Button';
import type { ReservaHabitacion } from '../../types';
import { ReservaEstadoBadge } from '@/features/mis-reservas/components/ReservaEstadoBadge';
import {
  calcularNoches,
  formatGTQ,
  resolverNombreSede,
} from '@/features/mis-reservas/formato';
import { useTextosAdminReservas } from '../textos';
import { useLocale } from '@/i18n/LocaleContext';
import { formatAdminCalendarDate, formatAdminTimestamp } from '@/features/admin-core/adminDates';

interface AdminReservasListProps {
  reservas: ReservaHabitacion[];
  sedesPorId: ReadonlyMap<number, string>;
}

export const AdminReservasList: React.FC<AdminReservasListProps> = ({
  reservas,
  sedesPorId,
}) => {
  const textosAdminReservas = useTextosAdminReservas();
  const { locale } = useLocale();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {reservas.map((reserva) => {
        const habitacion = reserva.Habitacion;
        const tipo = habitacion?.TipoHabitacion;
        const cliente = reserva.Usuario;
        const noches = calcularNoches(
          reserva.fecha_entrada,
          reserva.fecha_salida,
        );
        const importe = formatGTQ(reserva.total);
        const nombreSede = resolverNombreSede(reserva, sedesPorId);

        return (
          <Card
            key={reserva.id}
            className="flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
          >
            {/* Cabecera de la tarjeta: ID y Estado */}
            <div className="flex items-start justify-between gap-3 border-b border-neutro-200/80 pb-3">
              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold text-bronce-700">
                  {textosAdminReservas.detalle.reservaId(reserva.id)}
                </span>
                <span className="text-xs text-neutro-500">
                  {formatAdminTimestamp(reserva.createdAt, locale)}
                </span>
              </div>
              <ReservaEstadoBadge estado={reserva.estado} />
            </div>

            {/* Datos principales en cuadrícula */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              {/* Cliente */}
              <div className="flex items-start gap-2">
                <User className="mt-0.5 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
                <div className="flex flex-col min-w-0">
                  <span className="eyebrow">{textosAdminReservas.columnas.cliente}</span>
                  <span className="font-medium text-neutro-900 truncate">
                    {cliente?.nombre ?? textosAdminReservas.detalle.valores.clienteNoRegistrado}
                  </span>
                  {cliente?.email && (
                    <span className="text-neutro-500 truncate">{cliente.email}</span>
                  )}
                </div>
              </div>

              {/* Sede */}
              <div className="flex items-start gap-2">
                <Hotel className="mt-0.5 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
                <div className="flex flex-col min-w-0">
                  <span className="eyebrow">{textosAdminReservas.columnas.sede}</span>
                  <span className="font-medium text-neutro-900 truncate">
                    {nombreSede}
                  </span>
                </div>
              </div>

              {/* Habitación y Tipo */}
              <div className="flex items-start gap-2">
                <BedDouble className="mt-0.5 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
                <div className="flex flex-col min-w-0">
                  <span className="eyebrow">{textosAdminReservas.columnas.habitacion}</span>
                  <span className="font-medium text-neutro-900">
                    {habitacion ? textosAdminReservas.detalle.valores.habitacion(habitacion.numero) : textosAdminReservas.detalle.valores.sinHabitacion}
                  </span>
                  {tipo?.nombre && (
                    <span className="text-neutro-500 truncate">{tipo.nombre}</span>
                  )}
                </div>
              </div>

              {/* Huéspedes */}
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
                <div className="flex flex-col min-w-0">
                  <span className="eyebrow">{textosAdminReservas.columnas.huespedes}</span>
                  <span className="font-medium text-neutro-900">
                    {textosAdminReservas.detalle.valores.formatoHuespedes(reserva.numero_huespedes)}
                  </span>
                </div>
              </div>
            </div>

            {/* Fechas de estancia */}
            <div className="flex items-center gap-2 rounded-lg bg-neutro-50 p-2.5 text-xs text-neutro-700">
              <Calendar className="size-4 shrink-0 text-neutro-400" aria-hidden="true" />
              <span className="font-medium">
                {formatAdminCalendarDate(reserva.fecha_entrada, locale)} — {formatAdminCalendarDate(reserva.fecha_salida, locale)}
              </span>
              {noches !== null && (
                <span className="text-neutro-500">
                  ({textosAdminReservas.detalle.valores.formatoNoches(noches)})
                </span>
              )}
            </div>

            {/* Pie de tarjeta: Importe y enlace al Detalle */}
            <div className="flex items-center justify-between gap-4 border-t border-neutro-200/80 pt-3">
              <div className="flex flex-col">
                <span className="eyebrow">{textosAdminReservas.columnas.importe}</span>
                <span className="font-serif text-lg font-semibold text-neutro-900">
                  {importe ?? textosAdminReservas.detalle.campos.importeNoDisponible}
                </span>
              </div>

              <Link
                to={`/admin/reservas/${reserva.id}`}
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                aria-label={`${textosAdminReservas.columnas.verDetalle} reserva #${reserva.id}`}
              >
                <span>{textosAdminReservas.columnas.verDetalle}</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
