import React from 'react';
import { Edit2, MapPin, Tag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { RecursoActividad } from '../types';
import { formatearGTQ, textosActividades } from '../textos';

interface RecursosActividadListProps {
  recursos: RecursoActividad[];
  onEdit: (recurso: RecursoActividad) => void;
}

export const RecursosActividadList: React.FC<RecursosActividadListProps> = ({
  recursos,
  onEdit,
}) => {
  if (recursos.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="font-serif text-lg font-bold text-neutro-800">
          {textosActividades.sinRecursosTitulo}
        </h3>
        <p className="mt-1 text-xs text-neutro-500">
          {textosActividades.sinRecursosDesc}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recursos.map((recurso) => (
        <Card
          key={recurso.id}
          className="flex flex-col justify-between gap-4 p-5 transition-all hover:border-bronce-300"
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-selva-50 px-2.5 py-0.5 text-[11px] font-semibold text-selva-800 uppercase tracking-wide">
                <Tag className="size-3" aria-hidden="true" />
                {recurso.tipo}
              </span>
              <span className="text-[11px] font-mono text-neutro-400">
                #{recurso.id}
              </span>
            </div>

            <h3 className="font-serif text-base font-bold text-neutro-900">
              {recurso.nombre}
            </h3>

            {recurso.Sucursal && (
              <p className="flex items-center gap-1.5 text-xs text-neutro-600">
                <MapPin className="size-3.5 text-neutro-400 shrink-0" aria-hidden="true" />
                <span>{recurso.Sucursal.nombre}</span>
              </p>
            )}

            {/* Tarifas configuradas */}
            <div className="mt-2 rounded-lg bg-neutro-50 p-3 border border-neutro-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutro-600">Tarifa horaria:</span>
                <span className="font-semibold text-neutro-900">
                  {formatearGTQ(recurso.precio_hora)} / h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">Equipamiento:</span>
                <span className="font-medium text-neutro-800">
                  {formatearGTQ(recurso.precio_equipo)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-600">Instructor:</span>
                <span className="font-medium text-neutro-800">
                  {formatearGTQ(recurso.precio_instructor_hora)} / h
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutro-100 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEdit(recurso)}
              className="inline-flex items-center gap-1.5"
            >
              <Edit2 className="size-3.5" aria-hidden="true" />
              <span>{textosActividades.editarRecurso}</span>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
