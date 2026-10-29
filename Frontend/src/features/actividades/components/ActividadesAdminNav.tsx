import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { cn } from '@/lib/cn';
import { ACTIVIDADES_ROUTES } from '../constants/routes';
import { useTextosGestionActividades } from '../gestionTextos';

/**
 * Secciones del módulo (recursos, reservas, instructores) en una sola barra, en
 * lugar de botones repetidos en cada cabecera. Instructores solo para quien
 * puede gestionarlos (misma regla que su ruta).
 */
export const ActividadesAdminNav: React.FC = () => {
  const t = useTextosGestionActividades();
  const { user } = useAuth();
  const items = [
    { to: ACTIVIDADES_ROUTES.ADMIN_RECURSOS, label: t.nav.recursos },
    { to: ACTIVIDADES_ROUTES.ADMIN_RESERVAS, label: t.nav.reservas },
    ...(user && hasPermission(user.rol, 'configuracion.administrar') ? [{ to: ACTIVIDADES_ROUTES.ADMIN_INSTRUCTORES, label: t.nav.instructores }] : []),
  ];
  return <nav aria-label={t.navLabel} className="flex gap-1 overflow-x-auto border-b border-neutro-200">
    {items.map((item) => <NavLink key={item.to} to={item.to}
      className={({ isActive }) => cn('-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors',
        isActive ? 'border-bronce-600 text-bronce-800' : 'border-transparent text-neutro-600 hover:text-neutro-900')}>
      {item.label}
    </NavLink>)}
  </nav>;
};
