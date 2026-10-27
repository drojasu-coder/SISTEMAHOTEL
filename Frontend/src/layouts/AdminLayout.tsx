import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, LogOut, Menu, User } from 'lucide-react';
import { Brand } from '@/components/shared/Brand';
import { Drawer } from '@/components/ui/Drawer';
import { useAuth } from '@/features/auth/AuthContext';
import { getPanelModules } from '@/features/auth/permissions';
import { getRoleLabel } from '@/features/auth/types';
import { cn } from '@/lib/cn';
import { es } from '@/i18n/es';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-xs font-medium transition-colors',
    isActive
      ? 'bg-bronce-50 text-bronce-700'
      : 'text-neutro-600 hover:bg-bronce-50 hover:text-bronce-700',
  );

export const AdminLayout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const modules = getPanelModules(user.rol);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const nav = (
    <nav aria-label={es.navegacion.panelAdmin} className="flex flex-col gap-1">
      <NavLink to="/admin" end className={itemClass}>
        <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />
        {es.navegacion.inicio}
      </NavLink>
      {modules.map((module) => (
        <NavLink key={module.id} to={module.path} className={itemClass}>
          <span className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">{module.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const backToSite = (
    <Link
      to="/"
      className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-neutro-600 hover:text-bronce-700"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {es.navegacion.volverAlSitio}
    </Link>
  );

  return (
    <div lang="es" className="flex min-h-screen bg-neutro-50 text-neutro-900">
      <a href="#contenido" className="skip-link">
        {es.comunes.saltarAlContenido}
      </a>

      {/* Barra lateral (lg y superior) */}
      <aside className="sticky top-0 hidden h-screen w-sidebar shrink-0 flex-col gap-6 border-r bg-white p-4 lg:flex">
        <div className="px-3 pt-2">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t pt-2">{backToSite}</div>
      </aside>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={es.navegacion.menuAdmin} closeLabel={es.navegacion.cerrarMenuAdmin}>
        <div className="flex h-full flex-col gap-6">
          <div className="px-3">
            <Brand />
          </div>
          <div className="flex-1">{nav}</div>
          <div className="border-t pt-2">{backToSite}</div>
        </div>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={es.navegacion.abrirMenuAdmin}
              aria-expanded={menuOpen}
              className="flex size-11 items-center justify-center rounded-md border border-neutro-300 text-neutro-700 hover:bg-neutro-100 lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <p className="min-w-0 truncate text-xs text-neutro-600">
              <span className="hidden font-semibold text-neutro-900 md:inline">{user.nombre} · </span>
              <span>{getRoleLabel(user.rol)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/cuenta"
              aria-label={es.navegacion.miCuenta}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-semibold text-neutro-700 hover:bg-neutro-100"
            >
              <User className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{es.navegacion.miCuenta}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={es.navegacion.cerrarSesion}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-semibold text-neutro-700 hover:bg-neutro-100"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{es.navegacion.cerrarSesion}</span>
            </button>
          </div>
        </header>

        <main
          id="contenido"
          tabIndex={-1}
          className="min-w-0 flex-1 p-4 focus:outline-none sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
