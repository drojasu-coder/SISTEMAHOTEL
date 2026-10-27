import { usePublicTexts } from '@/i18n/public';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, ShieldAlert, UserRound } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { LoadingNotice } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { getHomeRouteForUser } from '@/features/auth/routing';
import type { AuthUser } from '@/features/auth/types';


interface AccessLayoutProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}

const AccessLayout: React.FC<AccessLayoutProps> = ({
  icon,
  title,
  description,
  children,
}) => { const textosCarrito = usePublicTexts('carrito'); return (
  <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-6 px-4 py-14 text-center">
    <span className="rounded-full bg-bronce-50 p-4 text-bronce-700">
      {icon}
    </span>
    <div className="flex flex-col gap-2">
      <h1 className="text-[2rem] leading-[2.375rem]">
        {textosCarrito.titulo}
      </h1>
      <h2 className="text-lg font-serif font-semibold text-neutro-800">
        {title}
      </h2>
      <p className="text-sm text-neutro-600">{description}</p>
    </div>
    {children}
  </section>
); };

interface ClienteCarritoGateProps {
  children: (user: AuthUser) => React.ReactNode;
}

/**
 * Puerta de acceso de la pantalla del carrito.
 *
 * No consulta el carrito mientras la sesión se restaura, ni sin sesión, ni con
 * un rol distinto de cliente. La autorización definitiva sigue siendo del
 * backend: esta comprobación solo decide qué puede mostrarse en la interfaz.
 */
export const ClienteCarritoGate: React.FC<ClienteCarritoGateProps> = ({
  children,
}) => {
  const textosCarrito = usePublicTexts('carrito');
  const { status, user, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-14">
        <LoadingNotice label={textosCarrito.acceso.verificandoSesion} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <AccessLayout
        icon={<UserRound className="size-8" aria-hidden="true" />}
        title={textosCarrito.acceso.errorSesionTitulo}
        description={textosCarrito.acceso.errorSesionDescripcion}
      >
        <Button type="button" variant="primary" onClick={retry}>
          {textosCarrito.acceso.reintentar}
        </Button>
      </AccessLayout>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <AccessLayout
        icon={<LogIn className="size-8" aria-hidden="true" />}
        title={textosCarrito.acceso.sinSesionTitulo}
        description={textosCarrito.acceso.sinSesionDescripcion}
      >
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/login"
            state={{ from: `${location.pathname}${location.search}` }}
            className={buttonStyles({ className: 'w-full sm:w-auto' })}
          >
            {textosCarrito.acceso.iniciarSesion}
          </Link>
          <Link
            to="/"
            className={buttonStyles({
              variant: 'ghost',
              className: 'w-full sm:w-auto',
            })}
          >
            {textosCarrito.acceso.irInicio}
          </Link>
        </div>
      </AccessLayout>
    );
  }

  if (user.rol !== 'cliente') {
    return (
      <AccessLayout
        icon={<ShieldAlert className="size-8" aria-hidden="true" />}
        title={textosCarrito.acceso.rolTitulo}
        description={textosCarrito.acceso.rolDescripcion}
      >
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={getHomeRouteForUser(user)}
            className={buttonStyles({ className: 'w-full sm:w-auto' })}
          >
            {textosCarrito.acceso.irMiEspacio}
          </Link>
          <Link
            to="/"
            className={buttonStyles({
              variant: 'ghost',
              className: 'w-full sm:w-auto',
            })}
          >
            {textosCarrito.acceso.irInicio}
          </Link>
        </div>
      </AccessLayout>
    );
  }

  return <>{children(user)}</>;
};
