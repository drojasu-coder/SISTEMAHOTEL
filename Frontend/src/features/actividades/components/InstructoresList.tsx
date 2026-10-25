import React, { useState } from 'react';
import { Edit2, User, UserCheck, UserX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import type { Instructor } from '../types';
import { useUpdateInstructorMutation } from '../hooks/useActividades';
import { textosActividades } from '../textos';

interface InstructoresListProps {
  instructores: Instructor[];
  onEdit: (instructor: Instructor) => void;
  onSuccess: (mensaje: string) => void;
}

export const InstructoresList: React.FC<InstructoresListProps> = ({
  instructores,
  onEdit,
  onSuccess,
}) => {
  const [errorAccion, setErrorAccion] = useState<{ id: number; message: string } | null>(null);
  const updateMutation = useUpdateInstructorMutation();

  const handleToggleActivo = async (instructor: Instructor) => {
    if (!instructor.id) return;
    setErrorAccion(null);

    const nuevoEstado = !instructor.activo;

    try {
      await updateMutation.mutateAsync({
        id: instructor.id,
        data: { activo: nuevoEstado },
      });
      onSuccess(
        nuevoEstado
          ? `El instructor ${instructor.nombre} ha sido activado.`
          : `El instructor ${instructor.nombre} ha sido desactivado.`
      );
    } catch (err: unknown) {
      setErrorAccion({
        id: instructor.id,
        message: getApiErrorMessage(err),
      });
    }
  };

  if (instructores.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="font-serif text-lg font-bold text-neutro-800">
          {textosActividades.sinInstructoresTitulo}
        </h3>
        <p className="mt-1 text-xs text-neutro-500">
          {textosActividades.sinInstructoresDesc}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {instructores.map((instructor) => {
        const isPending =
          updateMutation.isPending &&
          updateMutation.variables?.id === instructor.id;
        const tieneError = errorAccion?.id === instructor.id;

        return (
          <Card
            key={instructor.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-all hover:border-bronce-300"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  instructor.activo
                    ? 'bg-selva-50 text-selva-700'
                    : 'bg-neutro-100 text-neutro-500'
                }`}
              >
                <User className="size-5" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-base font-bold text-neutro-900">
                    {instructor.nombre}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      instructor.activo
                        ? 'border border-selva-200 bg-selva-50 text-selva-800'
                        : 'border border-neutro-200 bg-neutro-100 text-neutro-600'
                    }`}
                  >
                    {instructor.activo ? (
                      <>
                        <UserCheck className="size-3" aria-hidden="true" />
                        {textosActividades.instructorActivo}
                      </>
                    ) : (
                      <>
                        <UserX className="size-3" aria-hidden="true" />
                        {textosActividades.instructorInactivo}
                      </>
                    )}
                  </span>
                  <span className="text-[11px] font-mono text-neutro-400">
                    #{instructor.id}
                  </span>
                </div>

                <p className="text-xs text-neutro-600">
                  {instructor.especialidad
                    ? `Especialidad: ${instructor.especialidad}`
                    : 'Sin especialidad registrada'}
                </p>

                {tieneError && (
                  <div className="mt-2">
                    <Alert tone="error">
                      <p className="text-xs">{errorAccion?.message}</p>
                    </Alert>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onEdit(instructor)}
                disabled={isPending}
                className="inline-flex items-center gap-1"
              >
                <Edit2 className="size-3.5" aria-hidden="true" />
                <span>{textosActividades.editarInstructor}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleToggleActivo(instructor)}
                disabled={isPending}
                isLoading={isPending}
                className={`text-xs ${
                  instructor.activo
                    ? 'text-neutro-600 hover:text-rojo-700 hover:bg-rojo-50'
                    : 'text-selva-700 hover:bg-selva-50'
                }`}
              >
                {instructor.activo
                  ? textosActividades.desactivarInstructor
                  : textosActividades.activarInstructor}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
