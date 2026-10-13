import React from 'react';
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
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Habitaciones', path: '/admin/habitaciones', icon: BedDouble, disabled: true },
    { label: 'Reservas', path: '/admin/reservas', icon: CalendarCheck, disabled: true },
    { label: 'Pagos', path: '/admin/pagos', icon: CreditCard, disabled: true },
    { label: 'Parqueos', path: '/admin/parqueos', icon: Car, disabled: true },
    { label: 'Usuarios / Personal', path: '/admin/usuarios', icon: Users, disabled: true },
  ];

  return (
    <div className="min-h-screen flex bg-cream-50 text-charcoal-900">
      {/* Sidebar (264px según guía de diseño) */}
      <aside className="w-64 bg-charcoal-900 text-charcoal-200 flex flex-col shrink-0 border-r border-charcoal-700/60">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-charcoal-700/60">
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
        <div className="px-6 py-3 bg-charcoal-700/30 border-b border-charcoal-700/60 flex items-center justify-between text-xs">
          <span className="text-charcoal-400">Sede activa:</span>
          <span className="font-medium text-gold-100">Todas las sedes</span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-charcoal-400/50 cursor-not-allowed"
                  title="Módulo planificado para fases siguientes"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[9px] uppercase tracking-wider bg-charcoal-700/60 px-1.5 py-0.5 rounded text-charcoal-400">
                    Pronto
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-bronze-700 text-white shadow-xs'
                    : 'text-charcoal-200 hover:bg-charcoal-700/40 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 text-gold-300" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Return to public site */}
        <div className="p-4 border-t border-charcoal-700/60">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-medium text-charcoal-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al sitio público</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-charcoal-200/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-charcoal-700 font-medium">
            <span>Admin</span>
            <span>/</span>
            <span className="text-charcoal-900 font-semibold">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success-bg text-status-success text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Rol: Administrador (Demo)</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
