import React from 'react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { es } from '@/i18n/es';

export const NotFoundPage: React.FC = () => (
  <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-14 text-center">
    <div className="flex flex-col gap-2">
      <p className="eyebrow">404</p>
      <h1 className="text-[2rem] leading-[2.375rem]">{es.acceso.noEncontradoTitulo}</h1>
      <p className="text-sm text-neutro-600">{es.acceso.noEncontradoDescripcion}</p>
    </div>
    <Link to="/" className={buttonStyles()}>
      {es.navegacion.inicio}
    </Link>
  </div>
);
