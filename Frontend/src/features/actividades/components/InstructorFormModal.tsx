import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import type { Instructor } from '../types';
import { useCreateInstructorMutation, useUpdateInstructorMutation } from '../hooks/useActividades';
import { textosActividades } from '../textos';

interface InstructorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: Instructor | null; // null => creating, non-null => editing
  onSuccess: (mensaje: string) => void;
}

export const InstructorFormModal: React.FC<InstructorFormModalProps> = ({
  isOpen,
  onClose,
  instructor,
  onSuccess,
}) => {
  const isEditing = Boolean(instructor);

  const [nombre, setNombre] = useState<string>('');
  const [especialidad, setEspecialidad] = useState<string>('');
  const [activo, setActivo] = useState<boolean>(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const createMutation = useCreateInstructorMutation();
  const updateMutation = useUpdateInstructorMutation();

  useEffect(() => {
    if (instructor) {
      setNombre(instructor.nombre || '');
      setEspecialidad(instructor.especialidad || '');
      setActivo(instructor.activo !== undefined ? instructor.activo : true);
    } else {
      setNombre('');
      setEspecialidad('');
      setActivo(true);
    }
    setErrorLocal(null);
  }, [instructor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    const nombreTrim = nombre.trim();
    const especialidadTrim = especialidad.trim();

    if (!nombreTrim) {
      setErrorLocal('El nombre del instructor es obligatorio.');
      return;
    }

    try {
      if (isEditing && instructor?.id) {
        await updateMutation.mutateAsync({
          id: instructor.id,
          data: {
            nombre: nombreTrim,
            especialidad: especialidadTrim || null,
            activo,
          },
        });
        onSuccess(textosActividades.instructorGuardadoExito);
        onClose();
      } else {
        await createMutation.mutateAsync({
          nombre: nombreTrim,
          especialidad: especialidadTrim || undefined,
          activo,
        });
        onSuccess(textosActividades.instructorGuardadoExito);
        onClose();
      }
    } catch (err: unknown) {
      setErrorLocal(getApiErrorMessage(err));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-instructor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutro-900/50 backdrop-blur-xs"
    >
      <div className="surface flex w-full max-w-md flex-col gap-5 rounded-2xl p-6 shadow-elevated">
        <div className="flex items-center justify-between border-b border-neutro-100 pb-3">
          <h2 id="modal-instructor-title" className="font-serif text-xl font-bold text-neutro-900">
            {isEditing
              ? textosActividades.editarInstructorTitulo
              : textosActividades.crearInstructorTitulo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutro-400 hover:text-neutro-600 focus:outline-none"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {errorLocal && (
          <Alert tone="error">
            <p className="text-xs">{errorLocal}</p>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nombre */}
          <div>
            <label htmlFor="instructor-nombre" className="block text-xs font-medium text-neutro-700 mb-1">
              {textosActividades.campoNombreInstructor}
            </label>
            <input
              id="instructor-nombre"
              type="text"
              maxLength={150}
              placeholder="Ej. Carlos Méndez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isPending}
              className="w-full rounded-md border border-neutro-300 py-2 px-3 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
              required
            />
          </div>

          {/* Especialidad */}
          <div>
            <label htmlFor="instructor-especialidad" className="block text-xs font-medium text-neutro-700 mb-1">
              {textosActividades.campoEspecialidad}
            </label>
            <input
              id="instructor-especialidad"
              type="text"
              maxLength={50}
              placeholder="Ej. Tenis, Yoga, Natación"
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              disabled={isPending}
              className="w-full rounded-md border border-neutro-300 py-2 px-3 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="instructor-activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              disabled={isPending}
              className="size-4 rounded border-neutro-300 text-selva-600 focus:ring-selva-500"
            />
            <label htmlFor="instructor-activo" className="text-xs text-neutro-700 cursor-pointer">
              {textosActividades.campoActivo}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutro-100">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isPending} isLoading={isPending}>
              {isEditing ? 'Guardar cambios' : 'Registrar instructor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
