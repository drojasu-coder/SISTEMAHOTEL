import React from "react";
import { Edit2, Sparkles, Building2, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { textosAmenidades } from "../textos";
import type { Amenidad } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface AmenidadesListProps {
  amenidades: Amenidad[];
  sedesMap: Map<number, Sucursal>;
  canEdit: boolean;
  onEdit: (amenidad: Amenidad) => void;
}

export const AmenidadesList: React.FC<AmenidadesListProps> = ({
  amenidades,
  sedesMap,
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
                  {textosAmenidades.nombre}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosAmenidades.sede}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosAmenidades.aforoMaximo}
                </th>
                {canEdit && (
                  <th scope="col" className="px-5 py-3.5 text-right">
                    {textosAmenidades.acciones}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-200">
              {amenidades.map((amenidad) => {
                const sedeNombre =
                  amenidad.Sucursal?.nombre ??
                  sedesMap.get(amenidad.sucursal_id)?.nombre ??
                  textosAmenidades.sedeNoEspecificada;

                return (
                  <tr
                    key={amenidad.id}
                    className="transition-colors hover:bg-neutro-50/70"
                  >
                    <td className="px-5 py-4 font-semibold text-neutro-900">
                      <div className="flex items-center gap-2.5">
                        <Sparkles
                          className="size-4 shrink-0 text-selva-700"
                          aria-hidden="true"
                        />
                        <span>{amenidad.nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-neutro-600">
                      <div className="flex items-center gap-1.5">
                        <Building2
                          className="size-3.5 shrink-0 text-neutro-400"
                          aria-hidden="true"
                        />
                        <span>{sedeNombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-neutro-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users
                          className="size-3.5 shrink-0 text-neutro-400"
                          aria-hidden="true"
                        />
                        <span>
                          {textosAmenidades.aforoPersonas(amenidad.aforo_maximo)}
                        </span>
                      </div>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(amenidad)}
                          aria-label={`${textosAmenidades.editar} ${amenidad.nombre}`}
                        >
                          <Edit2 className="size-4" aria-hidden="true" />
                          <span>{textosAmenidades.editar}</span>
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

      {/* Vista móvil (< md): tarjetas adaptables */}
      <div className="flex flex-col gap-4 md:hidden">
        {amenidades.map((amenidad) => {
          const sedeNombre =
            amenidad.Sucursal?.nombre ??
            sedesMap.get(amenidad.sucursal_id)?.nombre ??
            textosAmenidades.sedeNoEspecificada;

          return (
            <Card key={amenidad.id} className="flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="size-4 shrink-0 text-selva-700"
                    aria-hidden="true"
                  />
                  <span className="font-serif text-base font-bold text-neutro-900">
                    {amenidad.nombre}
                  </span>
                </div>
                <span className="inline-flex items-center rounded-full border border-neutro-200 bg-neutro-100 px-2.5 py-0.5 text-xs font-semibold text-neutro-700">
                  {textosAmenidades.aforoPersonas(amenidad.aforo_maximo)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutro-600">
                <Building2
                  className="size-3.5 shrink-0 text-neutro-400"
                  aria-hidden="true"
                />
                <span>{sedeNombre}</span>
              </div>

              {canEdit && (
                <div className="flex items-center border-t border-neutro-200 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(amenidad)}
                    className="w-full"
                    aria-label={`${textosAmenidades.editar} ${amenidad.nombre}`}
                  >
                    <Edit2 className="size-4" aria-hidden="true" />
                    {textosAmenidades.editar}
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
