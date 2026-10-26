import React from 'react';
import { Edit2, Power, MapPin, Phone, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { es } from '@/i18n/es';
import type { Sucursal } from '../types';

interface SedesListProps {
  sedes: Sucursal[];
  canEdit: boolean;
  onEdit: (sede: Sucursal) => void;
  onToggleStatus: (sede: Sucursal) => void;
}

export const SedesList: React.FC<SedesListProps> = ({
  sedes,
  canEdit,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <div className="w-full">
      {/* Vista de escritorio (md y superior): tabla legible */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-neutro-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutro-800">
            <thead className="border-b border-neutro-200 bg-neutro-100/60 text-xs font-semibold text-neutro-700">
              <tr>
                <th scope="col" className="w-20 px-4 py-3.5 text-center">
                  {es.sedes.fotografia}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {es.sedes.nombre}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {es.sedes.ciudad}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {es.sedes.direccion}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {es.sedes.telefono}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  {es.sedes.estado}
                </th>
                {canEdit && (
                  <th scope="col" className="px-5 py-3.5 text-right">
                    {es.sedes.acciones}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-200">
              {sedes.map((sede) => (
                <tr key={sede.id} className="transition-colors hover:bg-neutro-50/70">
                  <td className="px-4 py-3 text-center">
                    {sede.imagen_url ? (
                      <div className="inline-block relative">
                        <img
                          src={sede.imagen_url}
                          alt={`Fotografía de ${sede.nombre}`}
                          className="size-14 rounded-lg object-cover border border-neutro-200 shadow-2xs"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className="inline-flex size-14 items-center justify-center rounded-lg border border-neutro-200 bg-neutro-100 text-neutro-400"
                        title="Sin fotografía"
                      >
                        <Building2 className="size-6" aria-hidden="true" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-neutro-900">
                    <div>
                      <span>{sede.nombre}</span>
                      {sede.imagen_creditos && (
                        <span className="block text-[11px] font-normal text-neutro-500 mt-0.5">
                          Foto: {sede.imagen_creditos}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-neutro-600">
                    {sede.ciudad || es.sedes.contactoNoRegistrado}
                  </td>
                  <td className="px-5 py-4 text-neutro-600 max-w-xs break-words">
                    {sede.direccion || es.sedes.contactoNoRegistrado}
                  </td>
                  <td className="px-5 py-4 text-neutro-600">
                    {sede.telefono || es.sedes.contactoNoRegistrado}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        sede.activa
                          ? 'border border-exito-600/20 bg-exito-50 text-exito-700'
                          : 'border border-neutro-300 bg-neutro-200 text-neutro-700'
                      }`}
                    >
                      {sede.activa ? es.sedes.activa : es.sedes.inactiva}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(sede)}
                          aria-label={`${es.sedes.editar} ${sede.nombre}`}
                        >
                          <Edit2 className="size-4" aria-hidden="true" />
                          <span>{es.sedes.editar}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleStatus(sede)}
                          aria-label={`${sede.activa ? es.sedes.desactivar : es.sedes.activar} ${sede.nombre}`}
                          className={sede.activa ? 'text-error-700 hover:bg-error-50' : 'text-selva-700 hover:bg-selva-50'}
                        >
                          <Power className="size-4" aria-hidden="true" />
                          <span>{sede.activa ? es.sedes.desactivar : es.sedes.activar}</span>
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista móvil (< md): tarjetas adaptables con portada */}
      <div className="flex flex-col gap-4 md:hidden">
        {sedes.map((sede) => (
          <Card key={sede.id} className="overflow-hidden flex flex-col gap-4 p-0">
            {sede.imagen_url ? (
              <div className="relative w-full h-44 overflow-hidden bg-neutro-100">
                <img
                  src={sede.imagen_url}
                  alt={`Fotografía de ${sede.nombre}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {sede.imagen_creditos && (
                  <span className="absolute bottom-2 right-2 rounded-md bg-neutro-950/75 px-2 py-0.5 text-[10px] text-white backdrop-blur-xs">
                    {sede.imagen_creditos}
                  </span>
                )}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 p-5 pt-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold text-neutro-900 leading-snug">
                  {sede.nombre}
                </h3>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    sede.activa
                      ? 'border border-exito-600/20 bg-exito-50 text-exito-700'
                      : 'border border-neutro-300 bg-neutro-200 text-neutro-700'
                  }`}
                >
                  {sede.activa ? es.sedes.activa : es.sedes.inactiva}
                </span>
              </div>

              <div className="flex flex-col gap-2 text-xs text-neutro-600">
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 shrink-0 text-neutro-500 mt-0.5" aria-hidden="true" />
                  <span className="break-words">
                    {sede.ciudad ? `${sede.ciudad} · ` : ''}
                    {sede.direccion || es.sedes.contactoNoRegistrado}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-neutro-500" aria-hidden="true" />
                  <span>{sede.telefono || es.sedes.contactoNoRegistrado}</span>
                </div>
              </div>

              {canEdit && (
                <div className="flex flex-wrap items-center gap-2 border-t border-neutro-200 pt-3 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(sede)}
                    className="flex-1"
                  >
                    <Edit2 className="size-4" aria-hidden="true" />
                    {es.sedes.editar}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(sede)}
                    className={`flex-1 ${sede.activa ? 'text-error-700 hover:bg-error-50' : 'text-selva-700 hover:bg-selva-50'}`}
                  >
                    <Power className="size-4" aria-hidden="true" />
                    {sede.activa ? es.sedes.desactivar : es.sedes.activar}
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
