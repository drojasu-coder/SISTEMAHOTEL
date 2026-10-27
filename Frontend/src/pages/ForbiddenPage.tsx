import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { getHomeRouteForUser } from '@/features/auth/routing';
import { es } from '@/i18n/es';

export const ForbiddenPage: React.FC = () => {
  const { status, user } = useAuth();
  const signedIn = status === 'authenticated' && user !== null;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-14 text-center">
      <span className="rounded-full bg-error-50 p-4 text-error-600">
        <ShieldAlert className="size-8" aria-hidden="true" />
      </span>

      <div className="flex flex-col gap-2">
        <p className="eyebrow text-error-600">{es.acceso.codigo}</p>
        <h1 className="text-[2rem] leading-[2.375rem]">{es.acceso.titulo}</h1>
        <p className="text-sm text-neutro-600">{es.acceso.descripcion}</p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/" className={buttonStyles({ variant: 'ghost', className: 'w-full sm:w-auto' })}>
          {es.navegacion.inicio}
        </Link>
        {signedIn ? (
          <Link to={getHomeRouteForUser(user)} className={buttonStyles({ className: 'w-full sm:w-auto' })}>
            {es.navegacion.miEspacio}
          </Link>
        ) : (
          <Link to="/login" className={buttonStyles({ className: 'w-full sm:w-auto' })}>
            {es.auth.loginBoton}
          </Link>
        )}
      </div>
    </div>
  );
};
