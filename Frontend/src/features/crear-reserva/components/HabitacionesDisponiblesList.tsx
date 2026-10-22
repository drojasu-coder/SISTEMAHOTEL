import React from 'react';
import { Bed, Users, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { textosCrearReserva, formatGTQ } from '../textos';
import type { HabitacionDisponible } from '../types';

export interface HabitacionesDisponiblesListProps {
  habitaciones: HabitacionDisponible[];
  isLoading: boolean;
  criteriaChanged: boolean;
  selectedHabitacionId?: number | null;
  onSelectHabitacion: (habitacion: HabitacionDisponible) => void;
}

export const HabitacionesDisponiblesList: React.FC<
  HabitacionesDisponiblesListProps
> = ({
  habitaciones,
  isLoading,
  criteriaChanged,
  selectedHabitacionId,
  onSelectHabitacion,
}) => {
  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <LoadingNotice label={textosCrearReserva.buscando} />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {criteriaChanged && (
        <Alert tone="warning">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            <p className="font-semibold">
              {textosCrearReserva.avisoCriteriosModificados}
            </p>
          </div>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-neutro-900">
          {textosCrearReserva.seccionResultados}
        </h2>
        <span className="text-xs font-medium text-neutro-600">
          {textosCrearReserva.resultadosEncontrados(habitaciones.length)}
        </span>
      </div>

      {habitaciones.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-neutro-100 text-neutro-500">
            <Bed className="size-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-serif text-base font-semibold text-neutro-800">
            {textosCrearReserva.sinResultadosTitulo}
          </h3>
          <p className="mt-1 max-w-md text-xs text-neutro-600">
            {textosCrearReserva.sinResultadosDesc}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {habitaciones.map((habitacion) => {
            const isSelected = selectedHabitacionId === habitacion.id;
            const tipoNombre =
              habitacion.TipoHabitacion?.nombre ?? 'Habitación';
            const capacidad =
              habitacion.TipoHabitacion?.capacidad_maxima ?? 0;
            const sedeNombre = habitacion.Sucursal?.nombre;

            return (
              <Card
                key={habitacion.id}
                className={`flex flex-col justify-between transition-shadow hover:shadow-md ${
                  isSelected ? 'border-selva-600 ring-2 ring-selva-600' : ''
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2 border-b border-neutro-100 pb-3">
                    <div>
                      <span className="inline-block rounded bg-selva-50 px-2 py-0.5 text-xs font-semibold text-selva-700">
                        {tipoNombre}
                      </span>
                      <h3 className="mt-1 font-serif text-lg font-bold text-neutro-900">
                        {textosCrearReserva.habitacionNumero(habitacion.numero)}
                      </h3>
                      {sedeNombre && (
                        <p className="text-xs text-neutro-500">{sedeNombre}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-neutro-600">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 shrink-0 text-neutro-400" />
                      <span>{textosCrearReserva.capacidadPersonas(capacidad)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 shrink-0 text-neutro-400" />
                      <span>
                        {textosCrearReserva.nochesCalculadas(habitacion.noches)} de estancia
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 rounded-md bg-neutro-50 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-neutro-500">Tarifa por noche:</span>
                      <span className="text-xs font-medium text-neutro-800">
                        {formatGTQ(habitacion.tarifa_noche)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between border-t border-neutro-200 pt-1">
                      <span className="text-xs font-semibold text-neutro-700">
                        Total estimado:
                      </span>
                      <span className="font-serif text-base font-bold text-selva-700">
                        {formatGTQ(habitacion.total_estimado)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <Button
                    type="button"
                    variant={isSelected ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full"
                    disabled={criteriaChanged}
                    onClick={() => onSelectHabitacion(habitacion)}
                  >
                    <span>
                      {isSelected
                        ? 'Habitación seleccionada'
                        : textosCrearReserva.botonSeleccionar}
                    </span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
