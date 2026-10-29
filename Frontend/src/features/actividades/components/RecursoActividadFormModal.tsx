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
import { TimeField } from '@/components/ui/TimeField';
import { Input } from '@/components/ui/Input';
import { useTextosHorarioAdmin } from '@/i18n/horariosAdmin';

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
  // Modalidad: por hora (uso exclusivo) o experiencia (salidas de duración fija con cupo y precio por persona).
  const [modalidad, setModalidad] = useState<'por_hora' | 'experiencia'>('por_hora');
  const [duracion, setDuracion] = useState<string>('');
  const [cupo, setCupo] = useState<string>('');
  const [precioPersona, setPrecioPersona] = useState<string>('');
  const [horaApertura, setHoraApertura] = useState<string>('');
  const [horaCierre, setHoraCierre] = useState<string>('');
  const th = useTextosHorarioAdmin();

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
      setModalidad(recurso.modalidad === 'experiencia' ? 'experiencia' : 'por_hora');
      setDuracion(recurso.duracion_minutos ? String(recurso.duracion_minutos) : '');
      setCupo(recurso.cupo_maximo ? String(recurso.cupo_maximo) : '');
      setPrecioPersona(recurso.precio_persona != null ? String(recurso.precio_persona) : '');
      setHoraApertura(recurso.hora_apertura?.slice(0, 5) ?? '');
      setHoraCierre(recurso.hora_cierre?.slice(0, 5) ?? '');
    } else {
      setSucursalId(sedes.length > 0 ? String(sedes[0].id) : '');
      setTipo('');
      setNombre('');
      setPrecioHora('0');
      setPrecioEquipo('0');
      setPrecioInstructorHora('0');
      setModalidad('por_hora');
      setDuracion('');
      setCupo('');
      setPrecioPersona('');
      setHoraApertura('');
      setHoraCierre('');
    }
    setErrorLocal(null);
    setImageError(null);
    setSelectedFile(null);
    setRemoveMarked(false);
    setUploadProgress(0);
    setIsUploading(false);
  }, [recurso, sedes, isOpen]);

  // Escape cierra el diálogo, salvo mientras se guarda (igual que el botón Cancelar).
  const busy = createMutation.isPending || updateMutation.isPending || isUploading;
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, busy, onClose]);

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

    // Horario: ambos valores o ninguno; el servidor comprueba además que quepa una reserva.
    if (Boolean(horaApertura) !== Boolean(horaCierre)) {
      setErrorLocal(th.errorHorarioIncompleto);
      return;
    }
    if (horaApertura && horaCierre && horaApertura >= horaCierre) {
      setErrorLocal(th.errorCierre);
      return;
    }
    const horario = { hora_apertura: horaApertura || null, hora_cierre: horaCierre || null };

    // Una experiencia necesita duración (30 a 720 min), cupo y precio por persona; el servidor lo vuelve a exigir.
    const numDuracion = Number(duracion);
    const numCupo = Number(cupo);
    const numPrecioPersona = Number(precioPersona);
    if (modalidad === 'experiencia' && (!Number.isInteger(numDuracion) || numDuracion < 30 || numDuracion > 720 || !Number.isInteger(numCupo) || numCupo < 1 || numCupo > 500 || precioPersona.trim() === '' || !(numPrecioPersona >= 0))) {
      setErrorLocal(th.errorExperiencia);
      return;
    }
    const modalidadPayload = modalidad === 'experiencia'
      ? { modalidad, duracion_minutos: numDuracion, cupo_maximo: numCupo, precio_persona: numPrecioPersona }
      : { modalidad };
    let fueraDeHorario = 0;

    let targetId: number;

    try {
      if (isEditing && recurso?.id) {
        targetId = recurso.id;
        const actualizado = await updateMutation.mutateAsync({
          id: recurso.id,
          data: {
            tipo: tipoTrim,
            nombre: nombreTrim,
            precio_hora: numHora,
            precio_equipo: numEquipo,
            precio_instructor_hora: numInst,
            ...modalidadPayload,
            ...horario,
          },
        });
        fueraDeHorario = Number((actualizado as { reservas_fuera_de_horario?: number }).reservas_fuera_de_horario) || 0;
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
          ...modalidadPayload,
          ...horario,
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

    // Las reservas futuras no se modifican al cambiar el horario: solo se informa cuántas quedan fuera.
    onSuccess(fueraDeHorario > 0
      ? `${textosActividades.recursoGuardadoExito} ${th.fueraDeHorario(fueraDeHorario)}`
      : textosActividades.recursoGuardadoExito);
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

          {/* Modalidad: define cómo se reserva el recurso */}
          <fieldset className="flex flex-col gap-2 border-t border-neutro-200 pt-3">
            <legend className="text-xs font-semibold text-neutro-700">{th.modalidad}</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={th.modalidad}>
              {(['por_hora', 'experiencia'] as const).map((opcion) => (
                <label key={opcion} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs ${modalidad === opcion ? 'border-bronce-600 bg-bronce-50 font-semibold text-bronce-800' : 'border-neutro-300 text-neutro-700'}`}>
                  <input type="radio" name="modalidad" value={opcion} checked={modalidad === opcion} onChange={() => setModalidad(opcion)} disabled={isPending} />
                  {opcion === 'por_hora' ? th.porHora : th.experiencia}
                </label>
              ))}
            </div>
            {modalidad === 'experiencia' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input label={th.duracionMin} id="recurso-duracion" type="number" min={30} max={720} step={30} value={duracion} onChange={(e) => setDuracion(e.target.value)} disabled={isPending} />
                <Input label={th.cupoSalida} id="recurso-cupo" type="number" min={1} max={500} value={cupo} onChange={(e) => setCupo(e.target.value)} disabled={isPending} />
                <Input label={th.precioPersona} id="recurso-precio-persona" type="number" min={0} step="0.01" value={precioPersona} onChange={(e) => setPrecioPersona(e.target.value)} disabled={isPending} />
              </div>
            ) : (
              <p className="text-[11px] text-neutro-500 leading-tight">{th.ayudaPorHora}</p>
            )}
          </fieldset>

          {/* Horario: define las franjas (o salidas, en experiencias) que el cliente puede reservar */}
          <fieldset className="flex flex-col gap-2 border-t border-neutro-200 pt-3">
            <legend className="text-xs font-semibold text-neutro-700">{th.horarioReserva}</legend>
            <div className="grid grid-cols-2 gap-3">
              <TimeField label={th.apertura} id="recurso-apertura" step={1800} value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} disabled={isPending} />
              <TimeField label={th.cierre} id="recurso-cierre" step={1800} value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} disabled={isPending} />
            </div>
            <p className="text-[11px] text-neutro-500 leading-tight">{th.ayudaRecurso}</p>
          </fieldset>

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
