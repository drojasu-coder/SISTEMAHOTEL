import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Trash2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ImageUploaderProps {
  label?: string;
  optionalLabel?: string;
  helpText?: string;
  allowSvg?: boolean;
  currentImageUrl?: string | null;
  selectedFile: File | null;
  removeMarked: boolean;
  onFileSelect: (file: File | null) => void;
  onRemoveCurrent: () => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  currentImageLabel?: string;
  currentImageStatus?: string;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MiB
const RASTER_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const SVG_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = 'Fotografía',
  optionalLabel = '(opcional)',
  helpText,
  allowSvg = false,
  currentImageUrl,
  selectedFile,
  removeMarked,
  onFileSelect,
  onRemoveCurrent,
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
  error,
  currentImageLabel = 'Fotografía actual',
  currentImageStatus = 'Asociada en almacenamiento seguro',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const allowedTypes = allowSvg ? SVG_ALLOWED_TYPES : RASTER_ALLOWED_TYPES;
  const acceptAttr = allowSvg
    ? 'image/jpeg,image/png,image/webp,image/svg+xml'
    : 'image/jpeg,image/png,image/webp';
  const defaultHelp = allowSvg
    ? 'Archivos SVG, JPEG, PNG o WebP de hasta 5 MiB'
    : 'Archivos JPEG, PNG o WebP de hasta 5 MiB';

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

    if (!allowedTypes.includes(file.type)) {
      setLocalError(
        allowSvg
          ? 'Formato no admitido. Utilice archivos SVG, JPEG, PNG o WebP.'
          : 'Formato no admitido. Utilice archivos JPEG, PNG o WebP.',
      );
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setLocalError(
        `El archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MiB y supera el límite de 5 MiB.`,
      );
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
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-neutro-700">
          {label}
          {optionalLabel && (
            <span className="ml-1 text-xs font-normal text-neutro-500">{optionalLabel}</span>
          )}
        </label>
      )}

      {/* 1. Previsualización de nuevo archivo local seleccionado */}
      {previewUrl && selectedFile && (
        <div className="flex items-center gap-3 rounded-lg border border-neutro-300 bg-white p-3 shadow-xs">
          <img
            src={previewUrl}
            alt={selectedFile.name}
            className="size-16 rounded-md object-cover border border-neutro-200 bg-neutro-50"
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-neutro-900">{selectedFile.name}</p>
            <p className="text-[11px] text-neutro-500">
              {(selectedFile.size / 1024).toFixed(0)} KB · Nuevo archivo seleccionado
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

      {/* 2. Imagen existente en el servidor (sin selección local nueva) */}
      {!previewUrl && currentImageUrl && !removeMarked && (
        <div className="flex items-center gap-3 rounded-lg border border-neutro-300 bg-white p-3 shadow-xs">
          <img
            src={currentImageUrl}
            alt={currentImageLabel}
            className="size-16 rounded-md object-cover border border-neutro-200 bg-neutro-50"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutro-900">{currentImageLabel}</p>
            <p className="text-[11px] text-exito-700 font-medium">{currentImageStatus}</p>
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
              <span className="text-xs">Cambiar</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveCurrent}
              disabled={disabled || isUploading}
              className="text-error-700 hover:bg-error-50"
              aria-label="Quitar imagen"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 3. Indicador de imagen previa marcada para retirar */}
      {!previewUrl && currentImageUrl && removeMarked && (
        <div className="flex items-center justify-between rounded-lg border border-error-200 bg-error-50 p-3 text-xs text-error-800">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 shrink-0 text-error-600" />
            <span>La imagen actual será retirada al guardar los cambios.</span>
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

      {/* 4. Dropzone / selector para elegir imagen */}
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
            <span className="text-xs font-semibold text-neutro-800">
              {currentImageUrl && removeMarked ? 'Seleccionar nueva imagen' : 'Subir archivo'}
            </span>
            <span className="text-[11px] text-neutro-500">{helpText || defaultHelp}</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
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
