import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6">
      <div className="text-center max-w-md w-full space-y-5">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cream-100 border border-gold-300 text-bronze-700 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900">404</h1>
          <h2 className="text-base sm:text-lg font-semibold text-charcoal-700">Página no encontrada</h2>
          <p className="text-xs sm:text-sm text-charcoal-400 max-w-sm mx-auto leading-relaxed">
            La ruta solicitada no existe o no se encuentra disponible temporalmente.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/" className="inline-block w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto gap-2 justify-center">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Inicio</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
