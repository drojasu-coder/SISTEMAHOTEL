import React from 'react';
import { BrandingManager } from '@/features/media/components/BrandingManager';
import { useTextosMarca } from '@/features/media/textos';

export const BrandingPage: React.FC = () => {
  const t = useTextosMarca();
  return (
    <div className="space-y-5">
      <header><p className="text-xs font-medium text-neutro-500">{t.categoria}</p>
        <h1 className="font-sans text-2xl font-semibold text-neutro-900">{t.titulo}</h1>
        <p className="text-sm text-neutro-500">{t.intro}</p></header>
      <BrandingManager />
    </div>
  );
};
