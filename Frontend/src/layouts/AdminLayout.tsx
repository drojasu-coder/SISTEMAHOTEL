import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Hotel,
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  CreditCard,
  Car,
  Users,
  ArrowLeft,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Habitaciones', path: '/admin/habitaciones', icon: BedDouble, disabled: true },
    { label: 'Reservas', path: '/admin/reservas', icon: CalendarCheck, disabled: true },
    { label: 'Pagos', path: '/admin/pagos', icon: CreditCard, disabled: true },
    { label: 'Parqueos', path: '/admin/parqueos', icon: Car, disabled: true },
    { label: 'Usuarios / Personal', path: '/admin/usuarios', icon: Users, disabled: true },
  ];

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;

        if (item.disabled) {
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-charcoal-400/50 cursor-not-allowed select-none"
              title="Módulo planificado para fases siguientes"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              <span className="ml-auto text-[9px] uppercase tracking-wider bg-charcoal-700/60 px-1.5 py-0.5 rounded text-charcoal-400 shrink-0">
                Pronto
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.label}
            to={item.path}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
              active
                ? 'bg-bronze-700 text-white shadow-xs'
                : 'text-charcoal-200 hover:bg-charcoal-700/40 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 text-gold-300 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-cream-50 text-charcoal-900">
      {/* Mobile Drawer Overlay (< lg) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            className="relative flex-1 flex flex-col max-w-xs w-full bg-charcoal-900 text-charcoal-200 shadow-2xl z-50 focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación administrativo"
          >
            {/* Drawer Header */}
            <div className="h-16 sm:h-20 px-4 sm:px-6 flex items-center justify-between border-b border-charcoal-700/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bronze-500 text-white flex items-center justify-center font-bold shrink-0">
                  <Hotel className="w-4 h-4 text-cream-50" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white text-sm tracking-tight leading-none">
                    Hunapú Admin
                  </span>
                  <span className="text-[10px] text-gold-300 font-medium uppercase tracking-wider mt-1">
                    Panel de Control
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-bronze-500"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Branch indicator */}
            <div className="px-4 sm:px-6 py-2.5 bg-charcoal-700/30 border-b border-charcoal-700/60 flex items-center justify-between text-xs shrink-0">
              <span className="text-charcoal-400">Sede activa:</span>
              <span className="font-medium text-gold-100">Todas las sedes</span>
            </div>

            {/* Navigation links */}
            {renderNavLinks(() => setIsMobileMenuOpen(false))}

            {/* Return to public site */}
            <div className="p-4 border-t border-charcoal-700/60 shrink-0">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-medium text-charcoal-400 hover:text-white transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Volver al sitio público</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (visible on lg+ viewports) */}
      <aside className="hidden lg:flex w-64 bg-charcoal-900 text-charcoal-200 flex-col shrink-0 border-r border-charcoal-700/60 min-h-screen sticky top-0 h-screen">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-charcoal-700/60 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-bronze-500 text-white flex items-center justify-center font-bold">
            <Hotel className="w-5 h-5 text-cream-50" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm tracking-tight leading-none">
              Hunapú Admin
            </span>
            <span className="text-[10px] text-gold-300 font-medium uppercase tracking-wider mt-1">
              Panel de Control
            </span>
          </div>
        </div>

        {/* Branch indicator */}
        <div className="px-6 py-3 bg-charcoal-700/30 border-b border-charcoal-700/60 flex items-center justify-between text-xs shrink-0">
          <span className="text-charcoal-400">Sede activa:</span>
          <span className="font-medium text-gold-100">Todas las sedes</span>
        </div>

        {/* Navigation list */}
        {renderNavLinks()}

        {/* Return to public site */}
        <div className="p-4 border-t border-charcoal-700/60 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-medium text-charcoal-400 hover:text-white transition-colors py-1.5"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Volver al sitio público</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 sm:h-20 bg-white border-b border-charcoal-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-charcoal-700 hover:text-charcoal-900 hover:bg-cream-100 transition-colors focus:outline-none focus:ring-2 focus:ring-bronze-500"
              aria-label="Abrir menú de navegación administrativo"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-charcoal-700 font-medium truncate">
              <span>Admin</span>
              <span>/</span>
              <span className="text-charcoal-900 font-semibold truncate">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success-bg text-status-success text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Rol: </span>
              <span>Admin</span>
              <span className="hidden md:inline"> (Demo)</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
