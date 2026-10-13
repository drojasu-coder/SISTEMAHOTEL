import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, User, Shield, Hotel } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-charcoal-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo-principal.jpg"
            alt="Hotel Hunapú"
            className="h-10 w-auto object-contain hidden sm:block"
            onError={(e) => {
              // Si la imagen falla, ocultarla y mostrar el fallback tipográfico
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-bronze-700 text-white flex items-center justify-center font-bold">
              <Hotel className="w-5 h-5 text-gold-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight text-charcoal-900 leading-none">
                Hotel Hunapú
              </span>
              <span className="text-[11px] tracking-widest uppercase text-bronze-500 font-medium mt-0.5">
                Guatemala
              </span>
            </div>
          </div>
        </Link>

        {/* Center navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-charcoal-700">
          <Link
            to="/"
            className={`transition-colors hover:text-bronze-700 ${
              isActive('/') ? 'text-bronze-700 font-semibold' : ''
            }`}
          >
            Inicio
          </Link>
          <span className="text-charcoal-400/60 cursor-not-allowed hover:text-charcoal-400" title="Próximamente">
            Habitaciones
          </span>
          <span className="text-charcoal-400/60 cursor-not-allowed hover:text-charcoal-400" title="Próximamente">
            Eventos
          </span>
          <span className="text-charcoal-400/60 cursor-not-allowed hover:text-charcoal-400" title="Próximamente">
            Restaurante
          </span>
          <span className="text-charcoal-400/60 cursor-not-allowed hover:text-charcoal-400" title="Próximamente">
            Bienestar
          </span>
        </nav>

        {/* Right action area */}
        <div className="flex items-center gap-3">
          {/* Branch chip */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-100 border border-gold-300/60 text-xs font-medium text-charcoal-700">
            <MapPin className="w-3.5 h-3.5 text-bronze-700" />
            <span>Hunapú Antigua</span>
          </div>

          {/* Admin link */}
          <Link
            to="/admin"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
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
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/login')
                ? 'bg-bronze-500 text-white'
                : 'bg-bronze-700 text-white hover:bg-bronze-500'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ingresar</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
