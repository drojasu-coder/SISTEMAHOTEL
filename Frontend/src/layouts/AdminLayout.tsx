import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  BedDouble,
  Layers,
  CalendarCheck,
  CalendarPlus,
  UtensilsCrossed,
  Sparkles,
  Dumbbell,
  Heart,
  PartyPopper,
  Receipt,
  CreditCard,
  Users,
  Building2,
  Sliders,
  Settings2,
  ChevronDown,
  ChevronRight,
  MapPin,
  BarChart3,
} from 'lucide-react';
import { Brand } from '@/components/shared/Brand';
import { Drawer } from '@/components/ui/Drawer';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission, type Permission } from '@/features/auth/permissions';
import { getRoleLabel } from '@/features/auth/types';
import { cn } from '@/lib/cn';
import { useAdminI18n } from '@/features/admin-core/i18n';
import { AdminScopeProvider, useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { LanguageSelector } from '@/i18n/LocaleContext';
import { es } from '@/i18n/es';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  /** Pantallas reservadas al administrador general (p. ej. reportes, solo admin en el servidor). */
  adminOnly?: boolean;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: Permission;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    id: 'operaciones',
    title: 'Operación hotelera',
    icon: BedDouble,
    requiredPermission: 'habitaciones.gestionar',
    items: [
      { id: 'habitaciones', label: 'Habitaciones', path: '/admin/habitaciones', icon: BedDouble },
      { id: 'tipos-habitacion', label: 'Tipos de habitación', path: '/admin/tipos-habitacion', icon: Layers, permission: 'habitaciones.configurar' },
      { id: 'reservas', label: 'Reservas', path: '/admin/reservas', icon: CalendarCheck, permission: 'reservas.gestionar' },
      { id: 'nueva-reserva', label: 'Nueva reserva', path: '/admin/reservas/nueva', icon: CalendarPlus, permission: 'reservas.gestionar' },
    ],
  },
  {
    id: 'restaurante',
    title: 'Restaurante',
    icon: UtensilsCrossed,
    requiredPermission: 'restaurante.gestionar',
    items: [
      { id: 'mesas', label: 'Mesas y zonas', path: '/admin/restaurante', icon: UtensilsCrossed },
      { id: 'reservas-restaurante', label: 'Reservas de restaurante', path: '/admin/reservas-restaurante', icon: CalendarCheck },
    ],
  },
  {
    id: 'servicios',
    title: 'Experiencias y servicios',
    icon: Sparkles,
    requiredPermission: 'servicios.administrar',
    items: [
      { id: 'actividades', label: 'Actividades', path: '/admin/recursos-actividad', icon: Dumbbell },
      { id: 'bienestar', label: 'Bienestar y spa', path: '/admin/servicios-spa', icon: Heart },
      { id: 'amenidades', label: 'Amenidades', path: '/admin/amenidades', icon: Sparkles },
      { id: 'eventos', label: 'Eventos y salones', path: '/admin/salones', icon: PartyPopper },
    ],
  },
  {
    id: 'administracion',
    title: 'Administración',
    icon: Receipt,
    items: [
      { id: 'reportes', label: 'Reportes y análisis', path: '/admin/reportes', icon: BarChart3, adminOnly: true },
      { id: 'facturacion', label: 'Facturación', path: '/admin/facturacion', icon: Receipt, permission: 'facturas.gestionar' },
      { id: 'pagos', label: 'Pagos y reembolsos', path: '/admin/pagos', icon: CreditCard, permission: 'pagos.administrar' },
    ],
  },
  {
    id: 'personal', title: 'Personal', icon: Users, requiredPermission: 'personal.administrar',
    items: [
      { id: 'personal', label: 'Personal', path: '/admin/personal?seccion=empleados', icon: Users },
      { id: 'clientes', label: 'Clientes', path: '/admin/personal?seccion=clientes', icon: Users, adminOnly: true },
    ],
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    icon: Sliders,
    requiredPermission: 'configuracion.administrar',
    items: [
      { id: 'parametros', label: 'Parámetros generales', path: '/admin/configuracion', icon: Settings2 },
      { id: 'sedes', label: 'Sedes', path: '/admin/sedes', icon: Building2 },
      { id: 'inicio', label: 'Contenido del sitio', path: '/admin/inicio', icon: Sliders },
      { id: 'branding', label: 'Identidad visual', path: '/admin/branding', icon: Sparkles },
    ],
  },
];

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'group flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-150',
    isActive
      ? 'bg-bronce-50 font-semibold text-bronce-800 shadow-xs border-l-2 border-bronce-700 pl-2'
      : 'text-neutro-600 hover:bg-neutro-100/80 hover:text-neutro-900',
  );

export const AdminLayoutContent: React.FC = () => {
  const { locale, t } = useAdminI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  // Only list screens that actually consume this context present a site filter.
  const supportsSedeFilter = ['/admin', '/admin/habitaciones', '/admin/tipos-habitacion', '/admin/reservas', '/admin/parqueos', '/admin/restaurante', '/admin/reservas-restaurante', '/admin/recursos-actividad', '/admin/reservas-actividades', '/admin/servicios-spa', '/admin/terapeutas', '/admin/citas-spa', '/admin/amenidades', '/admin/reservas-amenidades', '/admin/salones', '/admin/reservas-evento', '/admin/personal', '/admin/reportes'].includes(location.pathname);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedSedeId, setSelectedSedeId, sedes, selectedSede, isLoadingSedes, isErrorSedes, isGlobalScope, refetchSedes } = useAdminScope();
  const allSitesLabel = isGlobalScope ? t('Todas las sedes') : locale === 'en' ? 'All authorized sites' : 'Todas las sedes autorizadas';

  // Expanded sections state in sidebar
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    return {
      operaciones: true,
      restaurante: true,
      servicios: true,
      administracion: true,
      configuracion: true,
      personal: true,
    };
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Filter sections and items by user role
  const visibleSections = navSections
    .filter((sec) => !sec.requiredPermission || hasPermission(user.rol, sec.requiredPermission))
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => (!item.adminOnly || user.rol === 'admin') && (!item.permission || hasPermission(user.rol, item.permission))),
    }))
    .filter((sec) => sec.items.length > 0);

  const nav = (
    <nav aria-label={t(es.navegacion.panelAdmin)} className="flex flex-col gap-4">
      {/* Inicio / Dashboard Direct Link */}
      <div className="flex flex-col gap-1">
        <NavLink to="/admin" end className={itemClass}>
          <LayoutDashboard className="size-4 shrink-0 text-bronce-700" aria-hidden="true" />
          <span className="min-w-0 truncate">{t(es.navegacion.inicio)}</span>
        </NavLink>
      </div>

      {/* Grouped Sections */}
      {visibleSections.map((sec) => {
        const isExpanded = expandedSections[sec.id] !== false;
        const SectionIcon = sec.icon;

        return (
          <div key={sec.id} className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => toggleSection(sec.id)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wider text-neutro-600 hover:text-neutro-900 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <SectionIcon className="size-3.5 text-neutro-600 shrink-0" aria-hidden="true" />
                <span className="min-w-0 text-left leading-relaxed">{t(sec.title)}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="size-3 text-neutro-600 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRight className="size-3 text-neutro-600 shrink-0" aria-hidden="true" />
              )}
            </button>

            {isExpanded && (
              <div className="flex flex-col gap-0.5 pl-1.5">
                {sec.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <NavLink key={item.id} to={item.path} className={({ isActive }) => {
                      const section = new URLSearchParams(location.search).get('seccion') ?? 'empleados';
                      const esClientes = ['clientes', 'usuarios'].includes(section);
                      const matchesSection = item.id === 'clientes' ? esClientes : !esClientes;
                      const otraRutaReservas = item.id === 'reservas' && location.pathname === '/admin/reservas/nueva';
                      return itemClass({ isActive: isActive && !otraRutaReservas && (!item.path.startsWith('/admin/personal') || matchesSection) });
                    }}>
                      <ItemIcon className="size-4 shrink-0 text-neutro-500 group-hover:text-bronce-700 transition-colors" aria-hidden="true" />
                      <span className="min-w-0 truncate">{t(item.label)}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const backToSite = (
    <Link
      to="/"
      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-medium text-neutro-600 hover:bg-bronce-50 hover:text-bronce-800 transition-colors w-full"
    >
      <ArrowLeft className="size-4 text-bronce-700" aria-hidden="true" />
      <span>{t(es.navegacion.volverAlSitio)}</span>
    </Link>
  );

  return (
    <div lang={locale} className="flex min-h-screen bg-neutro-50 font-sans text-neutro-900">
      <a href="#contenido" className="skip-link">
        {t(es.comunes.saltarAlContenido)}
      </a>

      {/* Barra lateral desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-neutro-200 bg-white p-4 shadow-xs lg:flex">
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
          <div className="px-2 pt-1 border-b border-neutro-100 pb-3">
            <Brand />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">{nav}</div>
        </div>
        <div className="border-t border-neutro-200 pt-3">{backToSite}</div>
      </aside>

      {/* Drawer móvil */}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t(es.navegacion.menuAdmin)}
        closeLabel={t(es.navegacion.cerrarMenuAdmin)}
      >
        <div className="flex h-full flex-col justify-between gap-6">
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
            <div className="px-2 pb-2 border-b border-neutro-100">
              <Brand />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
          </div>
          <div className="border-t border-neutro-200 pt-3">{backToSite}</div>
        </div>
      </Drawer>

      {/* Contenido principal y barra superior */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-neutro-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6 lg:px-8 shadow-2xs">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t(es.navegacion.abrirMenuAdmin)}
              aria-expanded={menuOpen}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-neutro-300 text-neutro-700 hover:bg-neutro-100 lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>

            {supportsSedeFilter && <>
            <div className="flex min-w-0 max-w-sm flex-1 items-center gap-1.5 rounded-lg bg-neutro-100/80 px-2 py-1 text-xs">
              <MapPin className="hidden size-3.5 shrink-0 text-bronce-700 sm:block" aria-hidden="true" />
              <label htmlFor="admin-global-sede-selector" className="sr-only">
                {t('Filtrar por sede')}
              </label>
              <select
                id="admin-global-sede-selector"
                aria-label={t('Filtrar por sede')}
                value={selectedSedeId}
                disabled={isLoadingSedes || isErrorSedes || sedes.length <= 1 && !isGlobalScope}
                title={selectedSede?.nombre ?? allSitesLabel}
                onChange={(e) =>
                  setSelectedSedeId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="min-w-0 w-full cursor-pointer truncate bg-transparent pr-1 font-medium text-neutro-800 focus:outline-none disabled:cursor-wait"
              >
                {!isLoadingSedes && !isErrorSedes && !isGlobalScope && sedes.length === 0 && <option value="all">{locale === 'en' ? 'No sites assigned' : 'Sin sedes asignadas'}</option>}
                {(isGlobalScope || isLoadingSedes || isErrorSedes) && <option value="all">{isLoadingSedes ? (locale === 'en' ? 'Loading sites...' : 'Cargando sedes...') : isErrorSedes ? (locale === 'en' ? 'Sites unavailable' : 'Sedes no disponibles') : allSitesLabel}</option>}
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            {isErrorSedes && <button type="button" onClick={refetchSedes} className="shrink-0 rounded-md px-1 py-2 text-xs font-semibold text-bronce-700"
              aria-label={locale === 'en' ? 'Reload authorized sites' : 'Actualizar sedes autorizadas'}>↻</button>}
            </>}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-neutro-900 leading-tight">{user.nombre}</span>
              <span className="inline-flex items-center rounded-full bg-bronce-50 px-2 py-0.2 text-[10px] font-semibold text-bronce-800 border border-bronce-200">
                {t(getRoleLabel(user.rol))}
              </span>
            </div>

            <LanguageSelector compact />

            <Link
              to="/cuenta"
              aria-label={t(es.navegacion.miCuenta)}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-neutro-200 text-neutro-700 hover:bg-neutro-100 transition-colors"
              title={t(es.navegacion.miCuenta)}
            >
              <User className="size-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              aria-label={t(es.navegacion.cerrarSesion)}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-neutro-200 text-neutro-600 hover:bg-error-50 hover:text-error-700 hover:border-error-200 transition-colors"
              title={t(es.navegacion.cerrarSesion)}
            >
              <LogOut className="size-4" aria-hidden="true" />
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

export const AdminLayout: React.FC = () => {
  return (
    <AdminScopeProvider>
      <AdminLayoutContent />
    </AdminScopeProvider>
  );
};
