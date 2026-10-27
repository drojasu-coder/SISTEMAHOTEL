import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { getApiErrorMessage } from '@/api/errors';
import type { Sucursal } from '@/features/sedes/types';
import type { RecursoActividad } from '../types';
import {
  useCreateRecursoMutation,
  useUpdateRecursoMutation,
  useUploadRecursoActividadImageMutation,
  useRemoveRecursoActividadImageMutation,
} from '../hooks/useActividades';
import { textosActividades } from '../textos';

export interface RecursoActividadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurso: RecursoActividad | null; // null => creating, non-null => editing
  sedes?: Sucursal[];
  onSuccess: (mensaje: string) => void;
}

export const RecursoActividadFormModal: React.FC<RecursoActividadFormModalProps> = ({
  isOpen,
  onClose,
  recurso,
  sedes = [],
  onSuccess,
}) => {
  const isEditing = Boolean(recurso);

  const [sucursalId, setSucursalId] = useState<string>('');
  const [tipo, setTipo] = useState<string>('');
  const [nombre, setNombre] = useState<string>('');
  const [precioHora, setPrecioHora] = useState<string>('0');
  const [precioEquipo, setPrecioEquipo] = useState<string>('0');
  const [precioInstructorHora, setPrecioInstructorHora] = useState<string>('0');

  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeMarked, setRemoveMarked] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const createMutation = useCreateRecursoMutation();
  const updateMutation = useUpdateRecursoMutation();
  const uploadImageMutation = useUploadRecursoActividadImageMutation();
  const removeImageMutation = useRemoveRecursoActividadImageMutation();

  useEffect(() => {
    if (recurso) {
      setSucursalId(String(recurso.sucursal_id));
      setTipo(recurso.tipo || '');
      setNombre(recurso.nombre || '');
      setPrecioHora(recurso.precio_hora !== undefined ? String(recurso.precio_hora) : '0');
      setPrecioEquipo(recurso.precio_equipo !== undefined ? String(recurso.precio_equipo) : '0');
      setPrecioInstructorHora(
        recurso.precio_instructor_hora !== undefined
          ? String(recurso.precio_instructor_hora)
          : '0'
      );
    } else {
      setSucursalId(sedes.length > 0 ? String(sedes[0].id) : '');
      setTipo('');
      setNombre('');
      setPrecioHora('0');
      setPrecioEquipo('0');
      setPrecioInstructorHora('0');
    }
    setErrorLocal(null);
    setImageError(null);
    setSelectedFile(null);
    setRemoveMarked(false);
    setUploadProgress(0);
    setIsUploading(false);
  }, [recurso, sedes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setImageError(null);

    const tipoTrim = tipo.trim().toLowerCase();
    const nombreTrim = nombre.trim();
    const numHora = parseFloat(precioHora) || 0;
    const numEquipo = parseFloat(precioEquipo) || 0;
    const numInst = parseFloat(precioInstructorHora) || 0;

    if (!nombreTrim) {
      setErrorLocal('El nombre de la instalación es obligatorio.');
      return;
    }

    if (!tipoTrim) {
      setErrorLocal('El tipo de actividad es obligatorio.');
      return;
    }

    if (numHora < 0 || numEquipo < 0 || numInst < 0) {
      setErrorLocal('Las tarifas no pueden ser valores negativos.');
      return;
    }

    let targetId: number;

    try {
      if (isEditing && recurso?.id) {
        targetId = recurso.id;
        await updateMutation.mutateAsync({
          id: recurso.id,
          data: {
            tipo: tipoTrim,
            nombre: nombreTrim,
            precio_hora: numHora,
            precio_equipo: numEquipo,
            precio_instructor_hora: numInst,
          },
        });
      } else {
        const sucursalNum = parseInt(sucursalId, 10);
        if (!sucursalNum || sucursalNum <= 0) {
          setErrorLocal('Debe seleccionar una sede válida.');
          return;
        }

        const created = await createMutation.mutateAsync({
          sucursal_id: sucursalNum,
          tipo: tipoTrim,
          nombre: nombreTrim,
          precio_hora: numHora,
          precio_equipo: numEquipo,
          precio_instructor_hora: numInst,
        });
        targetId = Number(created.id);
      }
    } catch (err: unknown) {
      setErrorLocal(getApiErrorMessage(err));
      return;
    }

    if (removeMarked && targetId) {
      try {
        await removeImageMutation.mutateAsync(targetId);
      } catch (_err: any) {
        setImageError('Se guardó el recurso pero ocurrió un error al retirar la imagen.');
        return;
      }
    }

    if (selectedFile && targetId) {
      setIsUploading(true);
      setUploadProgress(10);
      try {
        await uploadImageMutation.mutateAsync({
          id: targetId,
          file: selectedFile,
          onProgress: (pct: number) => setUploadProgress(pct),
        });
      } catch (uploadErr: any) {
        setImageError(
          uploadErr?.message ||
            'Se guardó el recurso pero falló la subida de la imagen a S3.',
        );
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    onSuccess(textosActividades.recursoGuardadoExito);
    onClose();
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-recurso-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutro-900/50 backdrop-blur-xs"
    >
      <div className="surface flex w-full max-w-lg flex-col gap-5 rounded-2xl p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutro-100 pb-3">
          <h2 id="modal-recurso-title" className="font-serif text-xl font-bold text-neutro-900">
            {isEditing
              ? textosActividades.editarRecursoTitulo
              : textosActividades.crearRecursoTitulo}
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

        {imageError && (
          <Alert tone="warning">
            <p className="text-xs">{imageError}</p>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Sede (solo editable al crear) */}
          <div>
            <label htmlFor="recurso-sede" className="block text-xs font-medium text-neutro-700 mb-1">
              Sede del hotel
            </label>
            <select
              id="recurso-sede"
              value={sucursalId}
              disabled={isEditing || isPending}
              onChange={(e) => setSucursalId(e.target.value)}
              className="w-full rounded-md border border-neutro-300 py-2 px-3 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 bg-white disabled:bg-neutro-100"
              required
            >
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Tipo */}
            <div>
              <label htmlFor="recurso-tipo" className="block text-xs font-medium text-neutro-700 mb-1">
                {textosActividades.campoTipo}
              </label>
              <input
                id="recurso-tipo"
                type="text"
                maxLength={30}
                placeholder="Ej. tenis, golf, billar"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-neutro-300 py-2 px-3 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                required
              />
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="recurso-nombre" className="block text-xs font-medium text-neutro-700 mb-1">
                {textosActividades.campoNombreRecurso}
              </label>
              <input
                id="recurso-nombre"
                type="text"
                maxLength={100}
                placeholder="Ej. Cancha Central 1"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-neutro-300 py-2 px-3 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                required
              />
            </div>
          </div>

          {/* Tarifas */}
          <div className="rounded-lg bg-neutro-50 p-3.5 border border-neutro-200 space-y-3">
            <p className="text-[11px] font-semibold text-neutro-700 uppercase tracking-wider">
              Tarifas configurables
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="tarifa-hora" className="block text-[11px] font-medium text-neutro-600 mb-1">
                  {textosActividades.campoTarifaHora}
                </label>
                <input
                  id="tarifa-hora"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioHora}
                  onChange={(e) => setPrecioHora(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-md border border-neutro-300 py-1.5 px-2.5 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="tarifa-equipo" className="block text-[11px] font-medium text-neutro-600 mb-1">
                  {textosActividades.campoTarifaEquipo}
                </label>
                <input
                  id="tarifa-equipo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioEquipo}
                  onChange={(e) => setPrecioEquipo(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-md border border-neutro-300 py-1.5 px-2.5 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                />
              </div>

              <div>
                <label htmlFor="tarifa-instructor" className="block text-[11px] font-medium text-neutro-600 mb-1">
                  {textosActividades.campoTarifaInstructor}
                </label>
                <input
                  id="tarifa-instructor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioInstructorHora}
                  onChange={(e) => setPrecioInstructorHora(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-md border border-neutro-300 py-1.5 px-2.5 text-xs focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-neutro-500 leading-tight">
              {textosActividades.notaTarifasRecurso}
            </p>
          </div>

          {/* Fotografía principal en AWS S3 */}
          <div className="border-t border-neutro-200 pt-3">
            <ImageUploader
              label="Fotografía de la actividad"
              helpText="Formatos WebP, JPEG o PNG (hasta 5MB)"
              currentImageUrl={recurso?.imagen_url}
              selectedFile={selectedFile}
              removeMarked={removeMarked}
              onFileSelect={(file) => {
                setSelectedFile(file);
                if (file) setRemoveMarked(false);
              }}
              onRemoveCurrent={() => {
                setRemoveMarked(true);
                setSelectedFile(null);
              }}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
              error={imageError}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutro-100">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isPending} isLoading={isPending}>
              {isEditing ? 'Guardar cambios' : 'Registrar recurso'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
