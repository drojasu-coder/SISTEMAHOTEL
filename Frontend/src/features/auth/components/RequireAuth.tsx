import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LoadingNotice, StatusScreen } from '@/components/ui/Feedback';
import { es } from '@/i18n/es';
import { useAuth } from '../AuthContext';
import { canAccessPanel, hasPermission, type Permission } from '../permissions';
import { isKnownRole } from '../types';

interface RequireAuthProps {
  /** Exige al menos un módulo de panel habilitado para el rol. */
  panel?: boolean;
  /** Exige un permiso explícito derivado del backend. */
  permission?: Permission;
}

/**
 * Protege rutas en el cliente según la identidad y el rol verificados por el backend.
 * No muestra contenido protegido hasta terminar de restaurar la sesión, y no sustituye
 * la autorización del servidor: cada petición sigue validándose allí.
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ panel = false, permission }) => {
  const { status, user, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <StatusScreen>
        <LoadingNotice label={es.auth.verificandoSesion} />
      </StatusScreen>
    );
  }

  if (status === 'error') {
    return (
      <StatusScreen>
        <p role="alert" className="text-sm text-neutro-700">
          {es.auth.sesionNoVerificada}
        </p>
        <Button variant="primary" onClick={retry}>
          {es.comunes.reintentar}
        </Button>
      </StatusScreen>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  const allowed =
    isKnownRole(user.rol) &&
    (!panel || canAccessPanel(user.rol)) &&
    (!permission || hasPermission(user.rol, permission));

  if (!allowed) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
