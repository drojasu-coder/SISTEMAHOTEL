import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RefreshCw, Palette } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useBranding, BRANDING_QUERY_KEY } from '../hooks/useBranding';
import { uploadBrandingAsset, type BrandingVariant } from '../api/mediaApi';

interface VariantConfig {
  key: BrandingVariant;
  title: string;
  description: string;
  darkBg?: boolean;
}

const VARIANTS: VariantConfig[] = [
  {
    key: 'logoHorizontalColor',
    title: 'Logo Horizontal Principal (Color)',
    description: 'Versión oficial a color sobre fondo claro para encabezados, documentos y pantallas principales.',
    darkBg: false,
  },
  {
    key: 'logoHorizontalBlanco',
    title: 'Logo Horizontal en Negativo (Blanco)',
    description: 'Versión blanca para contrastar sobre fondos oscuros, fotografías o encabezados en modo noche.',
    darkBg: true,
  },
  {
    key: 'isotipoColor',
    title: 'Isotipo Oficial (Símbolo Color)',
    description: 'Símbolo gráfico compacto para avatares, barra lateral contraída e ícono distintivo.',
    darkBg: false,
  },
];

export const BrandingManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: branding, isLoading, isError, error, refetch } = useBranding();

  // Estados por variante
  const [selectedFiles, setSelectedFiles] = useState<Record<BrandingVariant, File | null>>({
    logoHorizontalColor: null,
    logoHorizontalBlanco: null,
    isotipoColor: null,
  });

  const [uploadProgress, setUploadProgress] = useState<Record<BrandingVariant, number>>({
    logoHorizontalColor: 0,
    logoHorizontalBlanco: 0,
    isotipoColor: 0,
  });

  const [isUploading, setIsUploading] = useState<Record<BrandingVariant, boolean>>({
    logoHorizontalColor: false,
    logoHorizontalBlanco: false,
    isotipoColor: false,
  });

  const [errors, setErrors] = useState<Record<BrandingVariant, string | null>>({
    logoHorizontalColor: null,
    logoHorizontalBlanco: null,
    isotipoColor: null,
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileSelect = (variant: BrandingVariant, file: File | null) => {
    setSelectedFiles((prev) => ({ ...prev, [variant]: file }));
    setErrors((prev) => ({ ...prev, [variant]: null }));
    setSuccessMessage(null);
  };

  const handleSave = async (variant: BrandingVariant) => {
    const file = selectedFiles[variant];
    if (!file) return;

    setIsUploading((prev) => ({ ...prev, [variant]: true }));
    setUploadProgress((prev) => ({ ...prev, [variant]: 10 }));
    setErrors((prev) => ({ ...prev, [variant]: null }));

    try {
      await uploadBrandingAsset(variant, file, (progress) => {
        setUploadProgress((prev) => ({ ...prev, [variant]: progress }));
      });

      await queryClient.invalidateQueries({ queryKey: BRANDING_QUERY_KEY });
      setSelectedFiles((prev) => ({ ...prev, [variant]: null }));
      setSuccessMessage(`Recurso "${variant}" actualizado exitosamente en AWS S3.`);
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [variant]: err?.response?.data?.message || err?.message || 'Error al actualizar el logotipo',
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, [variant]: false }));
      setUploadProgress((prev) => ({ ...prev, [variant]: 0 }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bronce-700">
          <Palette className="size-5" aria-hidden="true" />
          <h2 className="font-serif text-xl font-bold text-neutro-900">
            Identidad Visual y Logotipos Oficiales
          </h2>
        </div>
        <p className="text-xs text-neutro-600 max-w-3xl">
          Administre los activos vectoriales y de imagen oficiales de HOTEL HUNAHPÚ alojados en AWS S3. 
          Los cambios se sincronizan inmediatamente con toda la aplicación y componentes de marca. Formatos permitidos: SVG (sanitizado), WebP, PNG, JPEG (hasta 2MB).
        </p>
      </div>

      {successMessage && (
        <Alert tone="success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-selva-600" />
            <span className="text-xs">{successMessage}</span>
          </div>
        </Alert>
      )}

      {isError && (
        <Alert tone="error">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs">
              Error al consultar la vigencia de los logos de marca: {(error as any)?.message || 'Error de conexión'}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3 mr-1" />
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutro-200" />
              <div className="h-32 w-full animate-pulse rounded bg-neutro-200" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VARIANTS.map((v) => {
            const currentUrl = branding ? (branding as any)[v.key] : null;
            const hasSelectedFile = Boolean(selectedFiles[v.key]);

            return (
              <Card key={v.key} className="flex flex-col justify-between p-5 space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-neutro-900">{v.title}</h3>
                    <p className="mt-1 text-xs text-neutro-500 leading-relaxed">{v.description}</p>
                  </div>

                  <div className={v.darkBg ? 'rounded-lg bg-neutro-900 p-3' : ''}>
                    <ImageUploader
                      label="Archivo de marca"
                      helpText="Seleccione archivo para reemplazar"
                      currentImageUrl={currentUrl}
                      selectedFile={selectedFiles[v.key]}
                      removeMarked={false}
                      onFileSelect={(file) => handleFileSelect(v.key, file)}
                      onRemoveCurrent={() => {}}
                      allowSvg={true}
                      uploadProgress={uploadProgress[v.key]}
                      isUploading={isUploading[v.key]}
                      error={errors[v.key]}
                    />
                  </div>
                </div>

                {hasSelectedFile && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="w-full justify-center"
                      disabled={isUploading[v.key]}
                      onClick={() => handleSave(v.key)}
                    >
                      {isUploading[v.key] ? 'Publicando en S3...' : 'Guardar y Publicar Logo'}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
