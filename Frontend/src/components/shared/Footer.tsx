import React from 'react';
import { Brand } from '@/components/shared/Brand';
import { es } from '@/i18n/es';

/**
 * Pie provisional: sin direcciones ni datos de contacto hasta contar con los oficiales
 * (y con las sedes reales desde el backend).
 */
export const Footer: React.FC = () => (
  <footer className="mt-auto bg-neutro-900 text-neutro-300">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
      <Brand inverse />
      <p className="text-xs text-neutro-400">
        © {new Date().getFullYear()} {es.marca.copyright}
      </p>
    </div>
  </footer>
);
