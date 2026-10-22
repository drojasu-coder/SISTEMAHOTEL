import React from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/Feedback';
import { es } from '@/i18n/es';
import type { PanelModule } from '@/features/auth/permissions';

/**
 * Pantalla mínima de un módulo habilitado para el rol pero aún no construido.
 * Sin operaciones ni datos: solo confirma el destino y su permiso.
 */
export const ModulePlaceholderPage: React.FC<{ module: PanelModule }> = ({ module }) => (
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem]">
      {module.label}
    </h1>
    <Alert tone="info" title={es.panel.moduloEnPreparacion}>
      {es.panel.moduloDescripcion}
    </Alert>
    <Link
      to="/admin"
      className="inline-flex min-h-11 items-center text-xs font-semibold text-bronce-700 hover:underline"
    >
      {es.panel.volverPanel}
    </Link>
  </div>
);
