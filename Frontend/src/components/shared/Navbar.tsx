import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, User } from 'lucide-react';
import { Brand } from '@/components/shared/Brand';
import { useAuth } from '@/features/auth/AuthContext';
import { canAccessPanel } from '@/features/auth/permissions';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { CARRITO_ROUTES } from '@/features/carrito';
import { ShoppingCart } from 'lucide-react';

const actionClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-transparent px-3 text-sm font-semibold transition-colors';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { status, user, logout } = useAuth();
  const hasPanel = user ? canAccessPanel(user.rol) : false;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="rounded-md" aria-label={`${es.marca.nombre} — ${es.navegacion.inicio}`}>
          <Brand />
        </Link>

        <nav aria-label={es.navegacion.principal} className="hidden items-center gap-6 md:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'inline-flex min-h-11 items-center text-sm font-medium hover:text-bronce-700',
                isActive ? 'text-bronce-700' : 'text-neutro-700',
              )
            }
          >
            {es.navegacion.inicio}
          </NavLink>
          {(!hasPanel || user?.rol === 'cliente') && (
            <>
              <NavLink
                to={RESERVAS_ROUTES.NUEVA}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-11 items-center text-sm font-medium hover:text-bronce-700',
                    isActive ? 'text-bronce-700' : 'text-neutro-700',
                  )
                }
              >
                {es.navegacion.reservar}
              </NavLink>
              {status === 'authenticated' && user?.rol === 'cliente' && (
                <>
                  <NavLink
                    to={RESERVAS_ROUTES.MIS_RESERVAS}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex min-h-11 items-center text-sm font-medium hover:text-bronce-700',
                        isActive ? 'text-bronce-700' : 'text-neutro-700',
                      )
                    }
                  >
                    {es.navegacion.misReservas}
                  </NavLink>
                  <NavLink
                    to={CARRITO_ROUTES.CARRITO}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex min-h-11 items-center gap-1.5 text-sm font-medium hover:text-bronce-700',
                        isActive ? 'text-bronce-700' : 'text-neutro-700',
                      )
                    }
                  >
                    <ShoppingCart className="size-4" aria-hidden="true" />
                    <span>{es.navegacion.carrito}</span>
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {status === 'authenticated' && user ? (
            <>
              <span className="hidden max-w-[10rem] truncate text-xs font-medium text-neutro-600 lg:inline">
                {user.nombre}
              </span>
              <Link
                to={hasPanel ? '/admin' : '/cuenta'}
                aria-label={hasPanel ? es.navegacion.panel : es.navegacion.miCuenta}
                className={cn(actionClass, 'bg-bronce-600 text-white hover:bg-bronce-700')}
              >
                {hasPanel ? (
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                ) : (
                  <User className="size-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {hasPanel ? es.navegacion.panel : es.navegacion.miCuenta}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label={es.navegacion.cerrarSesion}
                className={cn(actionClass, 'border-neutro-300 text-neutro-700 hover:bg-neutro-100')}
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{es.navegacion.cerrarSesion}</span>
              </button>
            </>
          ) : status === 'loading' ? (
            <span className="h-11 w-24 rounded-md bg-neutro-200 motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <>
              <Link
                to="/registro"
                className={cn(actionClass, 'hidden border-neutro-300 text-neutro-700 hover:bg-neutro-100 sm:inline-flex')}
              >
                {es.navegacion.crearCuenta}
              </Link>
              <Link to="/login" className={cn(actionClass, 'bg-bronce-600 text-white hover:bg-bronce-700')}>
                <User className="size-4" aria-hidden="true" />
                {es.navegacion.ingresar}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
