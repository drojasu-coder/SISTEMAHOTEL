import React from "react";
import { Edit2, Building2, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { textosHabitaciones, formatGTQ } from "../textos";
import type { Habitacion, TipoHabitacion, EstadoHabitacion } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface HabitacionesListProps {
  habitaciones: Habitacion[];
  sedesMap: Map<number, Sucursal>;
  tiposMap: Map<number, TipoHabitacion>;
  canEdit: boolean;
  onEdit: (habitacion: Habitacion) => void;
}

const estadoBadges: Record<EstadoHabitacion, { badge: string; label: string }> = {
  disponible: {
    badge: "border-exito-600/20 bg-exito-50 text-exito-700",
    label: textosHabitaciones.estados.disponible,
  },
  ocupada: {
    badge: "border-info-600/20 bg-info-50 text-info-700",
    label: textosHabitaciones.estados.ocupada,
  },
  mantenimiento: {
    badge: "border-advertencia-600/20 bg-advertencia-50 text-advertencia-700",
    label: textosHabitaciones.estados.mantenimiento,
  },
  limpieza: {
    badge: "border-bronce-600/20 bg-bronce-50 text-bronce-800",
    label: textosHabitaciones.estados.limpieza,
  },
};

export const HabitacionesList: React.FC<HabitacionesListProps> = ({
  habitaciones,
  sedesMap,
  tiposMap,
  canEdit,
  onEdit,
}) => {
  return (
    <div className="w-full">
      {/* Vista de escritorio (md y superior): tabla legible */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-neutro-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutro-800">
            <thead className="border-b border-neutro-200 bg-neutro-100/60 text-xs font-semibold text-neutro-700">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  {textosHabitaciones.numeroAbrev}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosHabitaciones.tipo}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosHabitaciones.sede}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosHabitaciones.tarifaNoche}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosHabitaciones.estadoAbrev}
                </th>
                {canEdit && (
                  <th scope="col" className="px-5 py-3.5 text-right">
                    {textosHabitaciones.acciones}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-200">
              {habitaciones.map((hab) => {
                const sede =
                  hab.Sucursal ?? sedesMap.get(hab.sucursal_id);
                const tipo =
                  hab.TipoHabitacion ?? tiposMap.get(hab.tipo_habitacion_id);
                const estadoConfig =
                  estadoBadges[hab.estado] ?? estadoBadges.disponible;

                return (
                  <tr
                    key={hab.id}
                    className="transition-colors hover:bg-neutro-50/70"
                  >
                    <td className="px-5 py-4 font-mono font-semibold text-neutro-900">
                      Habitación {hab.numero}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutro-800">
                          {tipo?.nombre ?? textosHabitaciones.tipoNoEspecificado}
                        </span>
                        {tipo?.capacidad_maxima !== undefined && (
                          <span className="text-xs text-neutro-500">
                            {textosHabitaciones.capacidadPersonas(
                              tipo.capacidad_maxima
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-neutro-600">
                      {sede?.nombre ?? textosHabitaciones.sedeNoEspecificada}
                    </td>
                    <td className="px-5 py-4 font-medium text-neutro-800">
                      {formatGTQ(tipo?.tarifa_noche)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoConfig.badge}`}
                      >
                        {estadoConfig.label}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(hab)}
                          aria-label={`${textosHabitaciones.editar} habitación ${hab.numero}`}
                        >
                          <Edit2 className="size-4" aria-hidden="true" />
                          <span>{textosHabitaciones.editar}</span>
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista móvil (< md): tarjetas adaptables sin desbordamiento */}
      <div className="flex flex-col gap-4 md:hidden">
        {habitaciones.map((hab) => {
          const sede =
            hab.Sucursal ?? sedesMap.get(hab.sucursal_id);
          const tipo =
            hab.TipoHabitacion ?? tiposMap.get(hab.tipo_habitacion_id);
          const estadoConfig =
            estadoBadges[hab.estado] ?? estadoBadges.disponible;

          return (
            <Card key={hab.id} className="flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-mono text-base font-bold text-neutro-900">
                    Habitación {hab.numero}
                  </span>
                  <span className="text-xs font-medium text-selva-700">
                    {tipo?.nombre ?? textosHabitaciones.tipoNoEspecificado}
                  </span>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoConfig.badge}`}
                >
                  {estadoConfig.label}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-neutro-600">
                <div className="flex items-center gap-2">
                  <Building2
                    className="size-4 shrink-0 text-neutro-400"
                    aria-hidden="true"
                  />
                  <span>
                    {sede?.nombre ?? textosHabitaciones.sedeNoEspecificada}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutro-100">
                  {tipo?.capacidad_maxima !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Users
                        className="size-3.5 shrink-0 text-neutro-400"
                        aria-hidden="true"
                      />
                      <span>
                        {textosHabitaciones.capacidadPersonas(
                          tipo.capacidad_maxima
                        )}
                      </span>
                    </div>
                  )}
                  <span className="font-semibold text-neutro-800 ml-auto">
                    {formatGTQ(tipo?.tarifa_noche)} / noche
                  </span>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center border-t border-neutro-200 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(hab)}
                    className="w-full"
                    aria-label={`${textosHabitaciones.editar} habitación ${hab.numero}`}
                  >
                    <Edit2 className="size-4" aria-hidden="true" />
                    {textosHabitaciones.editar}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
