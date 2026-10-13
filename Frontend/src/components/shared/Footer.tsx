import React from 'react';
import { MapPin, Phone, Mail, Hotel } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal-900 text-charcoal-200 border-t-2 border-gold-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1: Identidad */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-bronze-500 text-white flex items-center justify-center font-bold">
                <Hotel className="w-4 h-4 text-cream-50" />
              </div>
              <span className="font-semibold text-lg text-white tracking-tight">
                Hotel Hunapú
              </span>
            </div>
            <p className="text-xs text-charcoal-400 leading-relaxed">
              Hospitalidad, confort y tradición guatemalteca. Experiencias únicas de hospedaje, eventos y bienestar.
            </p>
            <div className="text-[11px] text-gold-100 font-medium tracking-wide">
              Documento académico sin validez tributaria.
            </div>
          </div>

          {/* Columna 2: Sedes */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-300">
              Nuestras Sedes
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-bronze-500 shrink-0 mt-0.5" />
                <span>Hunapú Antigua: 5ta Avenida Norte #12, Antigua Guatemala</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-bronze-500 shrink-0 mt-0.5" />
                <span>Hunapú Atitlán: Calle Santander #8, Panajachel</span>
              </div>
            </div>
          </div>

          {/* Columna 3: Servicios */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-300">
              Servicios
            </h4>
            <ul className="space-y-1.5 text-xs text-charcoal-400">
              <li>Habitaciones y Suites</li>
              <li>Salones para Eventos</li>
              <li>Restaurante Típico y Gourmet</li>
              <li>Spa y Terapias de Bienestar</li>
              <li>Parque Temático y Transporte</li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-300">
              Contacto y Soporte
            </h4>
            <div className="space-y-2 text-xs text-charcoal-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-bronze-500" />
                <span>+502 7832-0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-bronze-500" />
                <span>info@hotelhunapu.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-charcoal-700/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal-400 gap-4">
          <p>© {new Date().getFullYear()} Hotel Hunapú. Todos los derechos reservados.</p>
          <p className="text-[11px] text-charcoal-400/80">
            Fase 6A — Arquitectura Frontend Base
          </p>
        </div>
      </div>
    </footer>
  );
};
