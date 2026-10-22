import React from "react";
import { Edit2, Users, BedDouble } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { textosTiposHabitacion, formatGTQ } from "../textos";
import type { TipoHabitacion } from "../types";

interface TiposHabitacionListProps {
  tipos: TipoHabitacion[];
  canEdit: boolean;
  onEdit: (tipo: TipoHabitacion) => void;
}

export const TiposHabitacionList: React.FC<TiposHabitacionListProps> = ({
  tipos,
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
                  {textosTiposHabitacion.nombre}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosTiposHabitacion.capacidadMaxima}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosTiposHabitacion.tarifaNoche}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosTiposHabitacion.descripcionLabel}
                </th>
                {canEdit && (
                  <th scope="col" className="px-5 py-3.5 text-right">
                    {textosTiposHabitacion.acciones}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-200">
              {tipos.map((tipo) => (
                <tr
                  key={tipo.id}
                  className="transition-colors hover:bg-neutro-50/70"
                >
                  <td className="px-5 py-4 font-semibold text-neutro-900">
                    <div className="flex items-center gap-2.5">
                      <BedDouble
                        className="size-4 shrink-0 text-selva-700"
                        aria-hidden="true"
                      />
                      <span>{tipo.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-neutro-700">
                    <div className="flex items-center gap-1.5">
                      <Users
                        className="size-3.5 shrink-0 text-neutro-400"
                        aria-hidden="true"
                      />
                      <span>
                        {tipo.capacidad_maxima}{" "}
                        {tipo.capacidad_maxima === 1 ? "persona" : "personas"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-neutro-900">
                    {formatGTQ(tipo.tarifa_noche)}
                  </td>
                  <td className="px-5 py-4 text-xs text-neutro-600 max-w-xs break-words">
                    {tipo.descripcion || "Sin descripción"}
                  </td>
                  {canEdit && (
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(tipo)}
                        aria-label={`${textosTiposHabitacion.editar} ${tipo.nombre}`}
                      >
                        <Edit2 className="size-4" aria-hidden="true" />
                        <span>{textosTiposHabitacion.editar}</span>
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista móvil (< md): tarjetas adaptables */}
      <div className="flex flex-col gap-4 md:hidden">
        {tipos.map((tipo) => (
          <Card key={tipo.id} className="flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <BedDouble
                  className="size-4 shrink-0 text-selva-700"
                  aria-hidden="true"
                />
                <span className="font-serif text-base font-bold text-neutro-900">
                  {tipo.nombre}
                </span>
              </div>
              <span className="font-semibold text-neutro-900">
                {formatGTQ(tipo.tarifa_noche)} / noche
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-neutro-600">
              <div className="flex items-center gap-1.5">
                <Users
                  className="size-3.5 shrink-0 text-neutro-400"
                  aria-hidden="true"
                />
                <span>
                  Capacidad: {tipo.capacidad_maxima}{" "}
                  {tipo.capacidad_maxima === 1 ? "persona" : "personas"}
                </span>
              </div>

              {tipo.descripcion && (
                <p className="mt-1 text-neutro-600 break-words">
                  {tipo.descripcion}
                </p>
              )}
            </div>

            {canEdit && (
              <div className="flex items-center border-t border-neutro-200 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(tipo)}
                  className="w-full"
                  aria-label={`${textosTiposHabitacion.editar} ${tipo.nombre}`}
                >
                  <Edit2 className="size-4" aria-hidden="true" />
                  {textosTiposHabitacion.editar}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
