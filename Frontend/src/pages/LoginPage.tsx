import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-charcoal-700 hover:text-bronze-700 transition-colors mb-1 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la página principal</span>
          </Link>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-bronze-700 text-white flex items-center justify-center mx-auto shadow-md">
            <Hotel className="w-5 h-5 sm:w-6 sm:h-6 text-gold-100" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-charcoal-900 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-xs text-charcoal-700 px-2 leading-relaxed">
            Ingrese sus credenciales para gestionar sus reservas y servicios.
          </p>
        </div>

        <Card className="p-5 sm:p-8 shadow-md border-charcoal-200/80">
          <LoginForm />
        </Card>

        <p className="text-center text-xs text-charcoal-400 px-2">
          ¿Aún no tiene cuenta?{' '}
          <span className="text-bronze-700 font-semibold cursor-pointer hover:underline">
            Registrarse como cliente
          </span>
        </p>
      </div>
    </div>
  );
};
