import React from "react";
import { Edit2, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { textosParqueos } from "../textos";
import type { EstadoParqueo, Parqueo } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface ParqueosListProps {
  parqueos: Parqueo[];
  sedesMap: Map<number, Sucursal>;
  canEdit: boolean;
  onEdit: (parqueo: Parqueo) => void;
}

const estadoBadges: Record<EstadoParqueo, { badge: string; label: string }> = {
  disponible: {
    badge: "border-exito-600/20 bg-exito-50 text-exito-700",
    label: textosParqueos.estados.disponible,
  },
  ocupado: {
    badge: "border-info-600/20 bg-info-50 text-info-700",
    label: textosParqueos.estados.ocupado,
  },
  mantenimiento: {
    badge: "border-advertencia-600/20 bg-advertencia-50 text-advertencia-700",
    label: textosParqueos.estados.mantenimiento,
  },
};

/**
 * Listado de espacios de parqueo: tabla en escritorio (md y superior) y
 * tarjetas en móvil, siguiendo el patrón de los módulos existentes.
 */
/** Un estado no reconocido se muestra como tal; nunca se asume «Disponible». */
const estadoDesconocido = {
  badge: "border-neutro-300 bg-neutro-100 text-neutro-700",
  label: "Desconocido",
};

export const ParqueosList: React.FC<ParqueosListProps> = ({
  parqueos,
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
                  {textosParqueos.numeroAbrev}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosParqueos.sede}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosParqueos.estadoAbrev}
                </th>
                {canEdit && (
                  <th scope="col" className="px-5 py-3.5 text-right">
                    {textosParqueos.acciones}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-200">
              {parqueos.map((parqueo) => {
                const sede = parqueo.Sucursal ?? sedesMap.get(parqueo.sucursal_id);
                const estadoConfig =
                  estadoBadges[parqueo.estado] ?? estadoDesconocido;

                return (
                  <tr
                    key={parqueo.id}
                    className="transition-colors hover:bg-neutro-50/70"
                  >
                    <td className="px-5 py-4 font-mono font-semibold text-neutro-900">
                      {parqueo.numero}
                    </td>
                    <td className="px-5 py-4 text-neutro-600">
                      {sede?.nombre ?? textosParqueos.sedeNoEspecificada}
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
                          onClick={() => onEdit(parqueo)}
                          aria-label={`${textosParqueos.editar} espacio de parqueo ${parqueo.numero}`}
                        >
                          <Edit2 className="size-4" aria-hidden="true" />
                          <span>{textosParqueos.editar}</span>
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
        {parqueos.map((parqueo) => {
          const sede = parqueo.Sucursal ?? sedesMap.get(parqueo.sucursal_id);
          const estadoConfig =
            estadoBadges[parqueo.estado] ?? estadoDesconocido;

          return (
            <Card key={parqueo.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-mono text-lg font-semibold leading-snug text-neutro-900">
                  {parqueo.numero}
                </h3>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoConfig.badge}`}
                >
                  {estadoConfig.label}
                </span>
              </div>

              <p className="flex items-start gap-2 text-xs text-neutro-600">
                <Building2 className="mt-0.5 size-4 shrink-0 text-neutro-500" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  {sede?.nombre ?? textosParqueos.sedeNoEspecificada}
                </span>
              </p>

              {canEdit && (
                <div className="border-t border-neutro-200 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(parqueo)}
                    className="w-full"
                  >
                    <Edit2 className="size-4" aria-hidden="true" />
                    {textosParqueos.editar}
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
