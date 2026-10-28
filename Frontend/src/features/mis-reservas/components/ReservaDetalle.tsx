import { MoneyReference } from '@/components/ui/MoneyReference';
import { commercialRoomName } from '@/features/habitaciones/public/roomCategories';
import React from 'react';
import { Alert } from '@/components/ui/Feedback';
import { Card } from '@/components/ui/Card';
import type { ReservaHabitacion } from '@/features/reservas';
import { BotonAnadirAlCarrito } from '@/features/carrito';
import {
  calcularNoches,
  resolverNombreSede,
} from '../formato';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';

interface DatoProps {
  etiqueta: string;
  children: React.ReactNode;
}

const Dato: React.FC<DatoProps> = ({ etiqueta, children }) => (
  <div className="flex flex-col gap-1">
    <dt className="eyebrow">{etiqueta}</dt>
    <dd className="break-words text-sm text-neutro-900">{children}</dd>
  </div>
);

interface ReservaDetalleProps {
  reserva: ReservaHabitacion;
  sedesPorId: ReadonlyMap<number, string>;
  avisoSedes: boolean;
}

export const ReservaDetalle: React.FC<ReservaDetalleProps> = ({
  reserva,
  sedesPorId,
  avisoSedes,
}) => {
  const textosMisReservas = usePublicTexts('misReservas');
  const { date } = usePublicInterface();
  const habitacion = reserva.Habitacion;
  const tipo = habitacion?.TipoHabitacion;
  const noches = calcularNoches(
    reserva.fecha_entrada,
    reserva.fecha_salida,
  );

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="text-lg font-serif font-semibold text-neutro-900">
          {textosMisReservas.estanciaTitulo}
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dato etiqueta={textosMisReservas.campos.habitacion}>
            {habitacion?.numero ?? textosMisReservas.sinHabitacion}
          </Dato>
          <Dato etiqueta={textosMisReservas.campos.tipo}>
            {tipo ? commercialRoomName(tipo) : textosMisReservas.sinTipo}
          </Dato>
          <Dato etiqueta={textosMisReservas.campos.sede}>
            {resolverNombreSede(reserva, sedesPorId, textosMisReservas)}
          </Dato>
          <Dato etiqueta={textosMisReservas.campos.huespedes}>
            {textosMisReservas.huespedes(reserva.numero_huespedes)}
          </Dato>
          <Dato etiqueta={textosMisReservas.campos.entrada}>
            {date(reserva.fecha_entrada)}
          </Dato>
          <Dato etiqueta={textosMisReservas.campos.salida}>
            {date(reserva.fecha_salida)}
          </Dato>
          {noches !== null && (
            <Dato etiqueta={textosMisReservas.campos.noches}>
              {textosMisReservas.noches(noches)}
            </Dato>
          )}
        </dl>
      </Card>

      <Card className="flex flex-col gap-4 bg-bronce-50">
        <div className="flex flex-col gap-1">
          <p className="eyebrow">{textosMisReservas.campos.importe}</p>
          <p className="font-serif text-[2rem] font-semibold leading-tight text-neutro-900">
            <MoneyReference amount={reserva.total} />
          </p>
          <p className="text-xs text-neutro-600">
            {textosMisReservas.importeNota}
          </p>
        </div>

        <div className="border-t border-bronce-200/80 pt-3">
          <BotonAnadirAlCarrito
            reservaId={reserva.id}
            reservaEstado={reserva.estado}
            variant="primary"
            size="sm"
          />
        </div>
      </Card>

      {avisoSedes && (
        <Alert tone="info">{textosMisReservas.avisoSedes}</Alert>
      )}
    </div>
  );
};
