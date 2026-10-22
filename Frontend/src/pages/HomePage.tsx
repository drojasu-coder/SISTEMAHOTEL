import React from 'react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { getHomeRouteForUser } from '@/features/auth/routing';
import { es } from '@/i18n/es';

/**
 * Portada provisional: no muestra precios, disponibilidad ni sedes mientras no exista
 * la integración con el catálogo real. La portada comercial se construirá en otro lote.
 */
export const HomePage: React.FC = () => {
  const { status, user } = useAuth();
  const signedIn = status === 'authenticated' && user !== null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
      <p className="eyebrow">{es.marca.pais}</p>
      <h1>{es.inicio.titulo}</h1>
      <p className="max-w-xl text-base text-neutro-600">{es.inicio.subtitulo}</p>
      <p className="max-w-xl text-sm text-neutro-600">{es.inicio.avisoCatalogo}</p>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {signedIn ? (
          <Link
            to={getHomeRouteForUser(user)}
            className={buttonStyles({ size: 'lg', className: 'w-full sm:w-auto' })}
          >
            {es.navegacion.miEspacio}
          </Link>
        ) : status === 'anonymous' ? (
          <>
            <Link to="/registro" className={buttonStyles({ size: 'lg', className: 'w-full sm:w-auto' })}>
              {es.navegacion.crearCuenta}
            </Link>
            <Link
              to="/login"
              className={buttonStyles({ size: 'lg', variant: 'ghost', className: 'w-full sm:w-auto' })}
            >
              {es.auth.loginBoton}
            </Link>
          </>
        ) : null}
      </div>
    </section>
  );
};
