import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Trash2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { es } from '@/i18n/es';

interface SedeImageUploaderProps {
  currentImageUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onRemoveCurrent: () => void;
  selectedFile: File | null;
  removeMarked: boolean;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MiB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SedeImageUploader: React.FC<SedeImageUploaderProps> = ({
  currentImageUrl,
  onFileSelect,
  onRemoveCurrent,
  selectedFile,
  removeMarked,
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError('Formato no admitido. Utilice archivos JPEG, PNG o WebP.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setLocalError(`El archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MiB y supera el límite de 5 MiB.`);
      e.target.value = '';
      return;
    }

    onFileSelect(file);
  };

  const handleClearSelection = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayError = error || localError;

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-xs font-semibold text-neutro-700">
        {es.sedes.fotografia}
        <span className="ml-1 text-xs font-normal text-neutro-500">({es.comunes.opcional})</span>
      </label>

      {/* 1. Vista si hay un nuevo archivo seleccionado localmente */}
      {previewUrl && selectedFile && (
        <div className="flex items-center gap-3 rounded-lg border border-neutro-300 bg-white p-3 shadow-xs">
          <img
            src={previewUrl}
            alt={selectedFile.name}
            className="size-16 rounded-md object-cover border border-neutro-200"
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-neutro-900">{selectedFile.name}</p>
            <p className="text-[11px] text-neutro-500">
              {(selectedFile.size / 1024).toFixed(0)} KB · Nueva fotografía
            </p>
            {isUploading && (
              <div className="mt-2 w-full">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutro-200">
                  <div
                    className="h-full bg-bronce-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutro-500 font-medium">{uploadProgress}%</span>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            disabled={disabled || isUploading}
            aria-label="Cancelar selección"
          >
            <X className="size-4 text-neutro-600" />
          </Button>
        </div>
      )}

      {/* 2. Vista si existe imagen previa en el servidor y no hay nueva seleccionada */}
      {!previewUrl && currentImageUrl && !removeMarked && (
        <div className="flex items-center gap-3 rounded-lg border border-neutro-300 bg-white p-3 shadow-xs">
          <img
            src={currentImageUrl}
            alt={es.sedes.fotografiaActual}
            className="size-16 rounded-md object-cover border border-neutro-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutro-900">{es.sedes.fotografiaActual}</p>
            <p className="text-[11px] text-exito-700 font-medium">Asociada en almacenamiento seguro</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <RotateCw className="size-3.5 mr-1" />
              <span className="text-xs">{es.sedes.cambiarFotografia}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveCurrent}
              disabled={disabled || isUploading}
              className="text-error-700 hover:bg-error-50"
              aria-label={es.sedes.quitarFotografia}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 3. Indicador de imagen marcada para retirar */}
      {!previewUrl && currentImageUrl && removeMarked && (
        <div className="flex items-center justify-between rounded-lg border border-error-200 bg-error-50 p-3 text-xs text-error-800">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 shrink-0 text-error-600" />
            <span>La fotografía actual será retirada al guardar los cambios.</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveCurrent}
            disabled={disabled || isUploading}
            className="text-xs font-semibold underline"
          >
            Deshacer
          </Button>
        </div>
      )}

      {/* 4. Selector / Dropzone cuando no hay previsualización ni imagen activa (o se eligió cambiar) */}
      {!previewUrl && (!currentImageUrl || removeMarked) && (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutro-300 bg-neutro-50 p-6 text-center cursor-pointer transition-colors hover:border-bronce-500 hover:bg-bronce-50/20 ${
            disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-neutro-200/70 text-neutro-600">
            <Upload className="size-5 text-bronce-600" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-neutro-800">{es.sedes.subirFotografia}</span>
            <span className="text-[11px] text-neutro-500">{es.sedes.fotografiaAyuda}</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {displayError && (
        <p className="text-xs text-error-600 font-medium flex items-center gap-1 mt-1">
          <X className="size-3.5 shrink-0" />
          <span>{displayError}</span>
        </p>
      )}
    </div>
  );
};
