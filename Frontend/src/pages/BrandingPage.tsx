import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandingManager } from '@/features/media/components/BrandingManager';
import { es } from '@/i18n/es';

export const BrandingPage: React.FC = () => {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      <Link
        to="/admin/sedes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutro-600 hover:text-bronce-700 transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Volver a Sedes</span>
      </Link>

      <div className="flex flex-col gap-1.5">
        <p className="eyebrow">{es.modulos.configuracion}</p>
        <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem] text-neutro-900 font-serif font-semibold">
          Identidad Visual y Marca
        </h1>
        <p className="text-sm text-neutro-600 max-w-2xl">
          Gestión centralizada de logotipos y recursos vectoriales de HOTEL HUNAHPÚ alojados en AWS S3.
        </p>
      </div>

      <BrandingManager />
    </div>
  );
};
