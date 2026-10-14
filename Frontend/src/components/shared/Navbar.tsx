import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, User, Shield, Hotel, Menu, X } from 'lucide-react';
import logoPrincipal from '@/assets/branding/logo-principal.jpg';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-charcoal-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <img
            src={logoPrincipal}
            alt="Hotel Hunapú"
            className="h-8 sm:h-10 w-auto object-contain hidden sm:block"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-bronze-700 text-white flex items-center justify-center font-bold shrink-0">
              <Hotel className="w-4 h-4 sm:w-5 sm:h-5 text-gold-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-charcoal-900 leading-none">
                Hotel Hunapú
              </span>
              <span className="text-[10px] sm:text-[11px] tracking-widest uppercase text-bronze-500 font-medium mt-0.5">
                Guatemala
              </span>
            </div>
          </div>
        </Link>

        {/* Center navigation links (desktop) */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-charcoal-700">
          <Link
            to="/"
            className={`transition-colors hover:text-bronze-700 ${
              isActive('/') ? 'text-bronze-700 font-semibold' : ''
            }`}
          >
            Inicio
          </Link>
          <span className="text-charcoal-400/60 cursor-not-allowed hover:text-charcoal-400 select-none" title="Próximamente">
            Habitaciones
          </span>
          <span className="text-charcoal-400/60 cursor-not-allowed hover:text-charcoal-400 select-none" title="Próximamente">
            Eventos
          </span>
          <span className="text-charcoal-400/60 cursor-not-allowed hover:text-charcoal-400 select-none" title="Próximamente">
            Restaurante
          </span>
          <span className="text-charcoal-400/60 cursor-not-allowed hover:text-charcoal-400 select-none" title="Próximamente">
            Bienestar
          </span>
        </nav>

        {/* Right action area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Branch chip (visible on lg+) */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-100 border border-gold-300/60 text-xs font-medium text-charcoal-700">
            <MapPin className="w-3.5 h-3.5 text-bronze-700" />
            <span>Hunapú Antigua</span>
          </div>

          {/* Admin link */}
          <Link
            to="/admin"
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive('/admin')
                ? 'bg-charcoal-900 text-white'
                : 'text-charcoal-700 hover:bg-cream-100'
            }`}
            title="Área administrativa"
          >
            <Shield className="w-4 h-4 text-bronze-500" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          {/* Login button */}
          <Link
            to="/login"
            className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              isActive('/login')
                ? 'bg-bronze-500 text-white'
                : 'bg-bronze-700 text-white hover:bg-bronze-500'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ingresar</span>
          </Link>

          {/* Mobile hamburger menu button (< md) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-charcoal-700 hover:text-charcoal-900 hover:bg-cream-100 transition-colors focus:outline-none focus:ring-2 focus:ring-bronze-500"
            aria-label={isMobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation dropdown (< md) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-charcoal-200/80 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${
                isActive('/') ? 'bg-cream-100 text-bronze-700 font-semibold' : 'text-charcoal-700 hover:bg-cream-50'
              }`}
            >
              <span>Inicio</span>
            </Link>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-charcoal-400 min-h-[44px]">
              <span>Habitaciones</span>
              <span className="text-[10px] uppercase tracking-wider bg-cream-100 text-bronze-700 px-2 py-0.5 rounded font-semibold">
                Pronto
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-charcoal-400 min-h-[44px]">
              <span>Eventos</span>
              <span className="text-[10px] uppercase tracking-wider bg-cream-100 text-bronze-700 px-2 py-0.5 rounded font-semibold">
                Pronto
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-charcoal-400 min-h-[44px]">
              <span>Restaurante</span>
              <span className="text-[10px] uppercase tracking-wider bg-cream-100 text-bronze-700 px-2 py-0.5 rounded font-semibold">
                Pronto
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-charcoal-400 min-h-[44px]">
              <span>Bienestar</span>
              <span className="text-[10px] uppercase tracking-wider bg-cream-100 text-bronze-700 px-2 py-0.5 rounded font-semibold">
                Pronto
              </span>
            </div>

            <div className="pt-2 border-t border-charcoal-200/60 mt-2 space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-charcoal-700 bg-cream-50 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-bronze-700 shrink-0" />
                <span>Sede actual: <strong>Hunapú Antigua</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
