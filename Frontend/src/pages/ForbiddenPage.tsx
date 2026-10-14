import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6">
      <div className="text-center max-w-md w-full space-y-5 sm:space-y-6">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-status-danger-bg border border-status-danger/30 text-status-danger flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-status-danger bg-status-danger-bg px-2.5 py-1 rounded-full">
            Error 403
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 mt-2">
            Acceso No Autorizado
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-700 max-w-sm mx-auto leading-relaxed">
            No dispone de los permisos o del rol requerido para acceder a este módulo del sistema.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto gap-2 justify-center">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Inicio</span>
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto gap-2 justify-center">
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
