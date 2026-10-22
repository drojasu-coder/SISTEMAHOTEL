import React from 'react';
import { Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Mesa } from '../types';
import { textosMesas } from '../texts';

interface MesasListProps {
  mesas: Mesa[];
  canEdit: boolean;
  onEdit: (mesa: Mesa) => void;
  /** Nombre de la sede por identificador, construido con el catálogo real de sedes. */
  sedeNombrePorId: Map<number, string>;
}

/**
 * Listado de mesas: tabla en escritorio (md y superior) y tarjetas en móvil,
 * siguiendo el patrón del módulo de sedes.
 */
export const MesasList: React.FC<MesasListProps> = ({
  mesas,
  canEdit,
  onEdit,
  sedeNombrePorId,
}) => {
  const nombreSede = (mesa: Mesa): string =>
    mesa.Sucursal?.nombre?.trim() ||
    sedeNombrePorId.get(mesa.sucursal_id) ||
    textosMesas.sedeNoRegistrada;

  return (
    <div className="w-full">
      {/* Vista de escritorio (md y superior): tabla legible */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-neutro-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutro-800">
            <thead className="border-b border-neutro-200 bg-neutro-100/60 text-xs font-semibold text-neutro-700">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  {textosMesas.tablasZona}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosMesas.tablasSede}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosMesas.tablasCapacidad}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {textosMesas.tablasEstado}
                </th>
                {canEdit && (
                  <th scope="col" className="px-5 py-3.5 text-right">
                    {textosMesas.tablasAcciones}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-200">
              {mesas.map((mesa) => {
                const sede = nombreSede(mesa);
                return (
                  <tr key={mesa.id} className="transition-colors hover:bg-neutro-50/70">
                    <td className="px-5 py-4 font-semibold text-neutro-900">{mesa.zona}</td>
                    <td className="px-5 py-4 text-neutro-600">{sede}</td>
                    <td className="px-5 py-4 text-neutro-600">
                      {mesa.capacidad} {textosMesas.comensales}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full border border-neutro-300 bg-neutro-100 px-2.5 py-0.5 text-xs font-semibold text-neutro-700">
                        {mesa.estado?.trim() || textosMesas.estadoNoRegistrado}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(mesa)}
                          aria-label={`${textosMesas.editar} mesa ${mesa.zona} de ${sede}`}
                        >
                          <Edit2 className="size-4" aria-hidden="true" />
                          <span>{textosMesas.editar}</span>
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
        {mesas.map((mesa) => {
          const sede = nombreSede(mesa);
          return (
            <Card key={mesa.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold leading-snug text-neutro-900">
                  {mesa.zona}
                </h3>
                <span className="inline-flex shrink-0 items-center rounded-full border border-neutro-300 bg-neutro-100 px-2.5 py-0.5 text-xs font-semibold text-neutro-700">
                  {mesa.estado?.trim() || textosMesas.estadoNoRegistrado}
                </span>
              </div>

              <dl className="flex flex-col gap-1 text-xs text-neutro-600">
                <div className="flex items-center gap-2">
                  <dt className="font-semibold text-neutro-700">{textosMesas.tablasSede}:</dt>
                  <dd className="min-w-0 break-words">{sede}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="font-semibold text-neutro-700">{textosMesas.tablasCapacidad}:</dt>
                  <dd>
                    {mesa.capacidad} {textosMesas.comensales}
                  </dd>
                </div>
              </dl>

              {canEdit && (
                <div className="border-t border-neutro-200 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(mesa)}
                    className="w-full"
                  >
                    <Edit2 className="size-4" aria-hidden="true" />
                    {textosMesas.editar}
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
