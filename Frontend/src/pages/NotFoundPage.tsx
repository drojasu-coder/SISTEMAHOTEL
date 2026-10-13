import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-md space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-cream-100 border border-gold-300 text-bronze-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-charcoal-900">404</h1>
          <h2 className="text-lg font-semibold text-charcoal-700">Página no encontrada</h2>
          <p className="text-xs text-charcoal-400">
            La ruta solicitada no existe o no se encuentra disponible temporalmente.
          </p>
        </div>
        <Link to="/">
          <Button variant="primary" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Inicio</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
