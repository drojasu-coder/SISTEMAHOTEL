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
                    <div className="flex items-center gap-3">
                      {tipo.imagen_url ? (
                        <img
                          src={tipo.imagen_url}
                          alt={tipo.nombre}
                          className="size-12 rounded-lg object-cover border border-neutro-200 shadow-xs"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-lg bg-selva-50 text-selva-700">
                          <BedDouble
                            className="size-5 shrink-0"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-neutro-900">{tipo.nombre}</div>
                        {tipo.imagen_creditos?.autor && (
                          <span className="text-[10px] text-neutro-500 font-normal">
                            {tipo.imagen_creditos.url ? (
                              <a
                                href={tipo.imagen_creditos.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-selva-700 transition-colors"
                              >
                                Foto: {tipo.imagen_creditos.autor} ({tipo.imagen_creditos.licencia || 'CC'})
                              </a>
                            ) : (
                              `Foto: ${tipo.imagen_creditos.autor} (${tipo.imagen_creditos.licencia || 'CC'})`
                            )}
                          </span>
                        )}
                      </div>
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
          <Card key={tipo.id} className="flex flex-col gap-3.5 overflow-hidden p-0">
            {tipo.imagen_url && (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutro-100">
                <img
                  src={tipo.imagen_url}
                  alt={tipo.nombre}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {tipo.imagen_creditos?.autor && (
                  <span className="absolute bottom-1 right-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    {tipo.imagen_creditos.url ? (
                      <a
                        href={tipo.imagen_creditos.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-neutro-200 transition-colors"
                      >
                        Foto: {tipo.imagen_creditos.autor} ({tipo.imagen_creditos.licencia || 'CC'})
                      </a>
                    ) : (
                      `Foto: ${tipo.imagen_creditos.autor} (${tipo.imagen_creditos.licencia || 'CC'})`
                    )}
                  </span>
                )}
              </div>
            )}

            <div className="p-4 flex flex-col gap-3.5">
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
