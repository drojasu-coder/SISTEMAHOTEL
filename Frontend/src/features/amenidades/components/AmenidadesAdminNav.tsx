import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { AMENIDADES_ROUTES } from '../constants/routes';
import { useTextosGestionAmenidades } from '../gestionTextos';

/** Secciones del módulo en una sola barra, en lugar de enlaces repetidos en cada cabecera. */
export const AmenidadesAdminNav: React.FC = () => {
  const t = useTextosGestionAmenidades();
  const items = [{ to: '/admin/amenidades', label: t.nav.amenidades }, { to: AMENIDADES_ROUTES.ADMIN_RESERVAS, label: t.nav.reservas }];
  return <nav aria-label={t.navLabel} className="flex gap-1 overflow-x-auto border-b border-neutro-200">
    {items.map((item) => <NavLink key={item.to} to={item.to}
      className={({ isActive }) => cn('-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors',
        isActive ? 'border-bronce-600 text-bronce-800' : 'border-transparent text-neutro-600 hover:text-neutro-900')}>
      {item.label}
    </NavLink>)}
  </nav>;
};
