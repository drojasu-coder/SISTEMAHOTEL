import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Sparkles,
  Phone,
  Layout,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { ImageUploader } from '@/components/ui/ImageUploader';
import {
  useInicioQuery,
  useUpdateInicioMutation,
  useUploadInicioImageMutation,
  useRemoveInicioImageMutation,
} from '@/features/inicio/hooks/useInicio';
import type { InicioData, UpdateInicioInput } from '@/features/inicio/types';
import { HeroSection } from '@/features/inicio/components/HeroSection';
import { BuscadorDisponibilidad } from '@/features/inicio/components/BuscadorDisponibilidad';
import { PresentacionSection } from '@/features/inicio/components/PresentacionSection';
import { SedesSection } from '@/features/inicio/components/SedesSection';
import { ExperienciasSection } from '@/features/inicio/components/ExperienciasSection';
import { ContactoSection } from '@/features/inicio/components/ContactoSection';

type TabKey = 'hero' | 'presentacion' | 'sedes' | 'experiencias' | 'contacto';

export const AdminInicioPage: React.FC = () => {
  const { data: serverData, isLoading, isError, error, refetch } = useInicioQuery();

  const updateMutation = useUpdateInicioMutation();
  const uploadImageMutation = useUploadInicioImageMutation();
  const removeImageMutation = useRemoveInicioImageMutation();

  const [activeTab, setActiveTab] = useState<TabKey>('hero');
  const [formData, setFormData] = useState<UpdateInicioInput>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Estados locales para subida de imágenes
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [presentacionFile, setPresentacionFile] = useState<File | null>(null);
  const [experienciasFile, setExperienciasFile] = useState<File | null>(null);

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (serverData) {
      setFormData({
        hero_titulo: serverData.hero_titulo,
        hero_subtitulo: serverData.hero_subtitulo,
        hero_imagen_alt: serverData.hero_imagen_alt,
        hero_cta_texto: serverData.hero_cta_texto,
        hero_cta_enlace: serverData.hero_cta_enlace,

        presentacion_titulo: serverData.presentacion_titulo,
        presentacion_texto: serverData.presentacion_texto,
        presentacion_imagen_alt: serverData.presentacion_imagen_alt,
        presentacion_visible: serverData.presentacion_visible,

        sedes_titulo: serverData.sedes_titulo,
        sedes_subtitulo: serverData.sedes_subtitulo,
        sedes_visible: serverData.sedes_visible,

        experiencias_titulo: serverData.experiencias_titulo,
        experiencias_subtitulo: serverData.experiencias_subtitulo,
        experiencias_imagen_alt: serverData.experiencias_imagen_alt,
        experiencias_visible: serverData.experiencias_visible,

        contacto_titulo: serverData.contacto_titulo,
        contacto_texto: serverData.contacto_texto,
        contacto_telefono: serverData.contacto_telefono,
        contacto_email: serverData.contacto_email,
        contacto_direccion: serverData.contacto_direccion,
        contacto_visible: serverData.contacto_visible,
      });
    }
  }, [serverData]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center p-12">
        <LoadingNotice label="Cargando configuración de la página de inicio..." />
      </div>
    );
  }

  if (isError || !serverData) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
        <Alert tone="error">
          <p>Error al cargar el contenido de inicio: {String(error || 'Desconocido')}</p>
        </Alert>
        <Button onClick={() => refetch()} variant="secondary">
          Reintentar
        </Button>
      </div>
    );
  }

  const handleFieldChange = (field: keyof UpdateInicioInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFeedback(null);
  };

  const handleSaveTextChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await updateMutation.mutateAsync(formData);
      setFeedback({
        type: 'success',
        message: 'Contenido editorial guardado y publicado exitosamente.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error al guardar los cambios editoriales.',
      });
    }
  };

  const handleUploadImage = async (section: 'hero' | 'presentacion' | 'experiencias', file: File) => {
    setIsUploading((prev) => ({ ...prev, [section]: true }));
    setUploadProgress((prev) => ({ ...prev, [section]: 10 }));
    setFeedback(null);

    try {
      await uploadImageMutation.mutateAsync({
        section,
        file,
        onProgress: (pct) => setUploadProgress((prev) => ({ ...prev, [section]: pct })),
      });

      if (section === 'hero') setHeroFile(null);
      if (section === 'presentacion') setPresentacionFile(null);
      if (section === 'experiencias') setExperienciasFile(null);

      setFeedback({
        type: 'success',
        message: `Fotografía de sección ${section} actualizada y publicada correctamente.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || `Error al subir la imagen para la sección ${section}.`,
      });
    } finally {
      setIsUploading((prev) => ({ ...prev, [section]: false }));
      setUploadProgress((prev) => ({ ...prev, [section]: 0 }));
    }
  };

  const handleRemoveImage = async (section: 'hero' | 'presentacion' | 'experiencias') => {
    if (!window.confirm(`¿Está seguro de desvincular la fotografía de la sección ${section}?`)) {
      return;
    }
    setFeedback(null);
    try {
      await removeImageMutation.mutateAsync(section);
      setFeedback({
        type: 'success',
        message: `Fotografía de sección ${section} desvinculada correctamente.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || `Error al desvincular la imagen de la sección ${section}.`,
      });
    }
  };

  // Objeto combinado para previsualización en vivo
  const previewData: InicioData = {
    ...serverData,
    hero_titulo: formData.hero_titulo ?? serverData.hero_titulo,
    hero_subtitulo: formData.hero_subtitulo ?? serverData.hero_subtitulo,
    hero_imagen_alt: formData.hero_imagen_alt ?? serverData.hero_imagen_alt,
    hero_cta_texto: formData.hero_cta_texto ?? serverData.hero_cta_texto,
    hero_cta_enlace: formData.hero_cta_enlace ?? serverData.hero_cta_enlace,

    presentacion_titulo: formData.presentacion_titulo ?? serverData.presentacion_titulo,
    presentacion_texto: formData.presentacion_texto ?? serverData.presentacion_texto,
    presentacion_imagen_alt: formData.presentacion_imagen_alt ?? serverData.presentacion_imagen_alt,
    presentacion_visible: formData.presentacion_visible ?? serverData.presentacion_visible,

    sedes_titulo: formData.sedes_titulo ?? serverData.sedes_titulo,
    sedes_subtitulo: formData.sedes_subtitulo ?? serverData.sedes_subtitulo,
    sedes_visible: formData.sedes_visible ?? serverData.sedes_visible,

    experiencias_titulo: formData.experiencias_titulo ?? serverData.experiencias_titulo,
    experiencias_subtitulo: formData.experiencias_subtitulo ?? serverData.experiencias_subtitulo,
    experiencias_imagen_alt: formData.experiencias_imagen_alt ?? serverData.experiencias_imagen_alt,
    experiencias_visible: formData.experiencias_visible ?? serverData.experiencias_visible,

    contacto_titulo: formData.contacto_titulo ?? serverData.contacto_titulo,
    contacto_texto: formData.contacto_texto ?? serverData.contacto_texto,
    contacto_telefono: formData.contacto_telefono ?? serverData.contacto_telefono,
    contacto_email: formData.contacto_email ?? serverData.contacto_email,
    contacto_direccion: formData.contacto_direccion ?? serverData.contacto_direccion,
    contacto_visible: formData.contacto_visible ?? serverData.contacto_visible,
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-16">
      {/* Encabezado y Navegación superior */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/sedes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutro-500 hover:text-bronce-700"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Configuración</span>
            </Link>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-neutro-900">
            Administración de Página de Inicio
          </h1>
          <p className="mt-1 text-sm text-neutro-600">
            Gestione textos editoriales, fotografías oficiales de portada y visibilidad de secciones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Eye className="size-4" aria-hidden="true" />
            <span>Previsualizar</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSaveTextChanges}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 shadow"
          >
            <Save className="size-4" aria-hidden="true" />
            <span>{updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}</span>
          </Button>
        </div>
      </div>

      {/* Alerta de confirmación / error */}
      {feedback && (
        <Alert tone={feedback.type === 'success' ? 'success' : 'error'}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline"
            >
              Cerrar
            </button>
          </div>
        </Alert>
      )}

      {/* Pestañas de secciones */}
      <div className="flex flex-wrap gap-2 border-b border-neutro-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'hero'
              ? 'bg-bronce-700 text-white shadow-sm'
              : 'text-neutro-700 hover:bg-neutro-100'
          }`}
        >
          <Layout className="size-4" aria-hidden="true" />
          <span>Portada (Hero)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presentacion')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'presentacion'
              ? 'bg-bronce-700 text-white shadow-sm'
              : 'text-neutro-700 hover:bg-neutro-100'
          }`}
        >
          <FileText className="size-4" aria-hidden="true" />
          <span>Presentación</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sedes')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'sedes'
              ? 'bg-bronce-700 text-white shadow-sm'
              : 'text-neutro-700 hover:bg-neutro-100'
          }`}
        >
          <Building2 className="size-4" aria-hidden="true" />
          <span>Sedes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('experiencias')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'experiencias'
              ? 'bg-bronce-700 text-white shadow-sm'
              : 'text-neutro-700 hover:bg-neutro-100'
          }`}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          <span>Experiencias</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contacto')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'contacto'
              ? 'bg-bronce-700 text-white shadow-sm'
              : 'text-neutro-700 hover:bg-neutro-100'
          }`}
        >
          <Phone className="size-4" aria-hidden="true" />
          <span>Contacto</span>
        </button>
      </div>

      {/* Contenido según pestaña activa */}
      <Card className="p-6 md:p-8">
        {/* PESTAÑA: PORTADA (HERO) */}
        {activeTab === 'hero' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-neutro-900">
                Banner Principal de Portada
              </h2>
              <p className="text-xs text-neutro-600">
                La primera impresión visual que recibe el visitante de HOTEL HUNAHPÚ.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hero_titulo" className="text-xs font-semibold text-neutro-800">
                    Título Principal (H1)
                  </label>
                  <input
                    type="text"
                    id="hero_titulo"
                    value={formData.hero_titulo ?? ''}
                    onChange={(e) => handleFieldChange('hero_titulo', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hero_subtitulo" className="text-xs font-semibold text-neutro-800">
                    Subtítulo / Mensaje de Bienvenida
                  </label>
                  <textarea
                    id="hero_subtitulo"
                    rows={3}
                    value={formData.hero_subtitulo ?? ''}
                    onChange={(e) => handleFieldChange('hero_subtitulo', e.target.value)}
                    className="rounded-md border border-neutro-300 p-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="hero_cta_texto" className="text-xs font-semibold text-neutro-800">
                      Texto del Botón CTA
                    </label>
                    <input
                      type="text"
                      id="hero_cta_texto"
                      value={formData.hero_cta_texto ?? ''}
                      onChange={(e) => handleFieldChange('hero_cta_texto', e.target.value)}
                      className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="hero_cta_enlace" className="text-xs font-semibold text-neutro-800">
                      Enlace de Destino
                    </label>
                    <input
                      type="text"
                      id="hero_cta_enlace"
                      value={formData.hero_cta_enlace ?? ''}
                      onChange={(e) => handleFieldChange('hero_cta_enlace', e.target.value)}
                      className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hero_imagen_alt" className="text-xs font-semibold text-neutro-800">
                    Texto alternativo de la imagen (Accesibilidad)
                  </label>
                  <input
                    type="text"
                    id="hero_imagen_alt"
                    value={formData.hero_imagen_alt ?? ''}
                    onChange={(e) => handleFieldChange('hero_imagen_alt', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Uploader para la fotografía de portada */}
              <div className="flex flex-col gap-2 rounded-xl border border-neutro-200 bg-neutro-50 p-4">
                <p className="text-xs font-semibold text-neutro-800">Fotografía de Portada (Hero)</p>
                <ImageUploader
                  label="Fotografía del Banner"
                  currentImageUrl={serverData.hero_imagen_url}
                  selectedFile={heroFile}
                  removeMarked={false}
                  onFileSelect={(file) => {
                    setHeroFile(file);
                    if (file) handleUploadImage('hero', file);
                  }}
                  onRemoveCurrent={() => handleRemoveImage('hero')}
                  isUploading={isUploading['hero']}
                  uploadProgress={uploadProgress['hero']}
                  helpText="Se recomienda una imagen panorámica de alta resolución (1920x1080 WebP/JPG)."
                />
                {serverData.hero_imagen_creditos && (
                  <p className="text-[11px] text-neutro-500 mt-2">
                    Crédito oficial asociado: {serverData.hero_imagen_creditos.texto}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: PRESENTACIÓN */}
        {activeTab === 'presentacion' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutro-900">
                  Sección de Presentación
                </h2>
                <p className="text-xs text-neutro-600">
                  Narrativa sobre la identidad y arquitectura colonial y moderna del hotel.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.presentacion_visible)}
                  onChange={(e) => handleFieldChange('presentacion_visible', e.target.checked)}
                  className="size-4 rounded text-bronce-600 focus:ring-bronce-500"
                />
                <span className="text-xs font-semibold text-neutro-800">Mostrar sección</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pres_titulo" className="text-xs font-semibold text-neutro-800">
                    Título
                  </label>
                  <input
                    type="text"
                    id="pres_titulo"
                    value={formData.presentacion_titulo ?? ''}
                    onChange={(e) => handleFieldChange('presentacion_titulo', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pres_texto" className="text-xs font-semibold text-neutro-800">
                    Cuerpo del Texto
                  </label>
                  <textarea
                    id="pres_texto"
                    rows={6}
                    value={formData.presentacion_texto ?? ''}
                    onChange={(e) => handleFieldChange('presentacion_texto', e.target.value)}
                    className="rounded-md border border-neutro-300 p-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pres_alt" className="text-xs font-semibold text-neutro-800">
                    Texto alternativo de la imagen
                  </label>
                  <input
                    type="text"
                    id="pres_alt"
                    value={formData.presentacion_imagen_alt ?? ''}
                    onChange={(e) => handleFieldChange('presentacion_imagen_alt', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Uploader para la fotografía de presentación */}
              <div className="flex flex-col gap-2 rounded-xl border border-neutro-200 bg-neutro-50 p-4">
                <p className="text-xs font-semibold text-neutro-800">Fotografía Representativa</p>
                <ImageUploader
                  label="Fotografía Colonial/Hotel"
                  currentImageUrl={serverData.presentacion_imagen_url}
                  selectedFile={presentacionFile}
                  removeMarked={false}
                  onFileSelect={(file) => {
                    setPresentacionFile(file);
                    if (file) handleUploadImage('presentacion', file);
                  }}
                  onRemoveCurrent={() => handleRemoveImage('presentacion')}
                  isUploading={isUploading['presentacion']}
                  uploadProgress={uploadProgress['presentacion']}
                  helpText="Se recomienda formato horizontal o 4:3 con buena iluminación."
                />
                {serverData.presentacion_imagen_creditos && (
                  <p className="text-[11px] text-neutro-500 mt-2">
                    Crédito oficial asociado: {serverData.presentacion_imagen_creditos.texto}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: SEDES */}
        {activeTab === 'sedes' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutro-900">
                  Sección de Sedes Oficiales
                </h2>
                <p className="text-xs text-neutro-600">
                  Presentación de las 4 sedes de HOTEL HUNAHPÚ con enlace directo a sus reservas.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.sedes_visible)}
                  onChange={(e) => handleFieldChange('sedes_visible', e.target.checked)}
                  className="size-4 rounded text-bronce-600 focus:ring-bronce-500"
                />
                <span className="text-xs font-semibold text-neutro-800">Mostrar sección</span>
              </label>
            </div>

            <div className="flex flex-col gap-4 max-w-xl">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sedes_titulo" className="text-xs font-semibold text-neutro-800">
                  Título de la Sección
                </label>
                <input
                  type="text"
                  id="sedes_titulo"
                  value={formData.sedes_titulo ?? ''}
                  onChange={(e) => handleFieldChange('sedes_titulo', e.target.value)}
                  className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="sedes_subtitulo" className="text-xs font-semibold text-neutro-800">
                  Subtítulo Descriptivo
                </label>
                <textarea
                  id="sedes_subtitulo"
                  rows={3}
                  value={formData.sedes_subtitulo ?? ''}
                  onChange={(e) => handleFieldChange('sedes_subtitulo', e.target.value)}
                  className="rounded-md border border-neutro-300 p-3 text-sm focus:border-bronce-600 focus:outline-none"
                />
              </div>

              <div className="rounded-lg border border-bronce-200 bg-bronce-50/70 p-4 text-xs text-bronce-900">
                <p className="font-semibold">Integración automática con Sedes:</p>
                <p className="mt-1">
                  Las tarjetas de sedes leen en tiempo real los nombres, ciudades, direcciones,
                  teléfonos y portadas de S3 administradas desde{' '}
                  <Link to="/admin/sedes" className="font-bold underline hover:no-underline">
                    Configuración de Sedes
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: EXPERIENCIAS */}
        {activeTab === 'experiencias' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutro-900">
                  Sección de Servicios y Experiencias
                </h2>
                <p className="text-xs text-neutro-600">
                  Muestra la oferta de gastronomía, spa/bienestar, amenidades y salones de eventos.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.experiencias_visible)}
                  onChange={(e) => handleFieldChange('experiencias_visible', e.target.checked)}
                  className="size-4 rounded text-bronce-600 focus:ring-bronce-500"
                />
                <span className="text-xs font-semibold text-neutro-800">Mostrar sección</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exp_titulo" className="text-xs font-semibold text-neutro-800">
                    Título
                  </label>
                  <input
                    type="text"
                    id="exp_titulo"
                    value={formData.experiencias_titulo ?? ''}
                    onChange={(e) => handleFieldChange('experiencias_titulo', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exp_subtitulo" className="text-xs font-semibold text-neutro-800">
                    Subtítulo
                  </label>
                  <textarea
                    id="exp_subtitulo"
                    rows={3}
                    value={formData.experiencias_subtitulo ?? ''}
                    onChange={(e) => handleFieldChange('experiencias_subtitulo', e.target.value)}
                    className="rounded-md border border-neutro-300 p-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="exp_alt" className="text-xs font-semibold text-neutro-800">
                    Texto alternativo de la imagen
                  </label>
                  <input
                    type="text"
                    id="exp_alt"
                    value={formData.experiencias_imagen_alt ?? ''}
                    onChange={(e) => handleFieldChange('experiencias_imagen_alt', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Uploader para la fotografía de experiencias */}
              <div className="flex flex-col gap-2 rounded-xl border border-neutro-200 bg-neutro-50 p-4">
                <p className="text-xs font-semibold text-neutro-800">Fotografía Destacada de Experiencias</p>
                <ImageUploader
                  label="Fotografía Gastronomía/Bienestar"
                  currentImageUrl={serverData.experiencias_imagen_url}
                  selectedFile={experienciasFile}
                  removeMarked={false}
                  onFileSelect={(file) => {
                    setExperienciasFile(file);
                    if (file) handleUploadImage('experiencias', file);
                  }}
                  onRemoveCurrent={() => handleRemoveImage('experiencias')}
                  isUploading={isUploading['experiencias']}
                  uploadProgress={uploadProgress['experiencias']}
                  helpText="Se recomienda una imagen ambientada de alta calidad."
                />
                {serverData.experiencias_imagen_creditos && (
                  <p className="text-[11px] text-neutro-500 mt-2">
                    Crédito oficial asociado: {serverData.experiencias_imagen_creditos.texto}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: CONTACTO */}
        {activeTab === 'contacto' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutro-900">
                  Información de Contacto y Asistencia
                </h2>
                <p className="text-xs text-neutro-600">
                  Canales de contacto y reservaciones visibles para los huéspedes.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.contacto_visible)}
                  onChange={(e) => handleFieldChange('contacto_visible', e.target.checked)}
                  className="size-4 rounded text-bronce-600 focus:ring-bronce-500"
                />
                <span className="text-xs font-semibold text-neutro-800">Mostrar sección</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cont_titulo" className="text-xs font-semibold text-neutro-800">
                    Título
                  </label>
                  <input
                    type="text"
                    id="cont_titulo"
                    value={formData.contacto_titulo ?? ''}
                    onChange={(e) => handleFieldChange('contacto_titulo', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cont_texto" className="text-xs font-semibold text-neutro-800">
                    Texto Descriptivo
                  </label>
                  <textarea
                    id="cont_texto"
                    rows={3}
                    value={formData.contacto_texto ?? ''}
                    onChange={(e) => handleFieldChange('contacto_texto', e.target.value)}
                    className="rounded-md border border-neutro-300 p-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cont_tel" className="text-xs font-semibold text-neutro-800">
                    Teléfono Central
                  </label>
                  <input
                    type="text"
                    id="cont_tel"
                    value={formData.contacto_telefono ?? ''}
                    onChange={(e) => handleFieldChange('contacto_telefono', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cont_email" className="text-xs font-semibold text-neutro-800">
                    Correo Electrónico Oficial
                  </label>
                  <input
                    type="email"
                    id="cont_email"
                    value={formData.contacto_email ?? ''}
                    onChange={(e) => handleFieldChange('contacto_email', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cont_dir" className="text-xs font-semibold text-neutro-800">
                    Dirección General
                  </label>
                  <input
                    type="text"
                    id="cont_dir"
                    value={formData.contacto_direccion ?? ''}
                    onChange={(e) => handleFieldChange('contacto_direccion', e.target.value)}
                    className="h-10 rounded-md border border-neutro-300 px-3 text-sm focus:border-bronce-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Previsualización en Vivo */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
          <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-neutro-900 px-6 py-4 text-white shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="font-serif text-lg font-bold">
                Modo Previsualización — HOTEL HUNAHPÚ
              </p>
              <span className="text-xs text-neutro-400">
                (Visualizando borrador con cambios actuales sin guardar)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={async (e) => {
                  await handleSaveTextChanges(e);
                  setIsPreviewOpen(false);
                }}
                disabled={updateMutation.isPending}
              >
                <Save className="size-4 mr-1.5" />
                <span>Guardar y Cerrar</span>
              </Button>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg bg-neutro-800 text-neutro-300 hover:bg-neutro-700 hover:text-white transition-colors"
                aria-label="Cerrar vista previa"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full bg-neutro-50">
            <HeroSection data={previewData} />
            <BuscadorDisponibilidad />
            <PresentacionSection data={previewData} />
            <SedesSection data={previewData} />
            <ExperienciasSection data={previewData} />
            <ContactoSection data={previewData} />
          </div>
        </div>
      )}
    </div>
  );
};
