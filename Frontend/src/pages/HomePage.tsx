import React from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  TreePine,
  Shield,
  ArrowRight,
  CheckCircle2,
  Layers,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const HomePage: React.FC = () => {
  const services = [
    {
      title: 'Habitaciones & Suites',
      desc: 'Hospedaje de lujo con vistas a los volcanes y arquitectura colonial.',
      icon: BedDouble,
      tag: 'Desde Q650',
    },
    {
      title: 'Restaurante & Gastronomía',
      desc: 'Platillos tradicionales guatemaltecos y cocina internacional de autor.',
      icon: UtensilsCrossed,
      tag: 'Desayuno incluido',
    },
    {
      title: 'Spa & Terapias',
      desc: 'Masajes relajantes, sauna y tratamientos de bienestar holístico.',
      icon: Sparkles,
      tag: 'Citas disponibles',
    },
    {
      title: 'Parque & Actividades',
      desc: 'Senderismo, canchas deportivas y atracciones para toda la familia.',
      icon: TreePine,
      tag: 'Exclusivo Atitlán',
    },
  ];

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-charcoal-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl border border-gold-300/30">
          {/* Decorative textile line on top */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-bronze-700 via-gold-300 to-bronze-500" />

          <div className="max-w-2xl relative z-10 space-y-6">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bronze-700/60 border border-gold-300/40 text-xs text-gold-100 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-gold-300" />
              <span>Aplicación Frontend Hotel Hunapú · Activa</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-cream-50 leading-tight">
              Hospitalidad y encanto en el corazón de Guatemala
            </h1>

            <p className="text-charcoal-200 text-base sm:text-lg leading-relaxed">
              Bienvenido al sistema integral de reservas de Hotel Hunapú. Disfrute de estancias inolvidables en nuestras sedes de Antigua Guatemala y Lago de Atitlán.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 justify-center">
                  <span>Acceso de Huéspedes</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/admin" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto border-gold-300 text-gold-100 hover:bg-charcoal-700 justify-center">
                  <Shield className="w-4 h-4 mr-2 text-gold-300" />
                  <span>Área Administrativa</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sedes Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal-900">
            Nuestras Sedes
          </h2>
          <p className="text-sm text-charcoal-700">
            Dos destinos mágicos diseñados para el descanso y la conexión con la naturaleza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:border-bronze-500 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cream-100 border border-gold-100 flex items-center justify-center shrink-0 text-bronze-700">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-charcoal-900">
                    Hunapú Antigua
                  </h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-status-success-bg text-status-success">
                    Abierta
                  </span>
                </div>
                <p className="text-xs text-charcoal-700 leading-relaxed">
                  5ta Avenida Norte #12, Antigua Guatemala. Habitaciones coloniales, salones para bodas, restaurante gourmet y spa.
                </p>
                <div className="pt-2 text-xs font-semibold text-bronze-700 flex items-center gap-1">
                  <span>Reservar en Antigua</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:border-bronze-500 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-cream-100 border border-gold-100 flex items-center justify-center shrink-0 text-bronze-700">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-charcoal-900">
                    Hunapú Atitlán
                  </h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-status-success-bg text-status-success">
                    Abierta
                  </span>
                </div>
                <p className="text-xs text-charcoal-700 leading-relaxed">
                  Calle Santander #8, Panajachel. Vistas al lago, parque temático ecológico, paseos en lancha y bienestar holístico.
                </p>
                <div className="pt-2 text-xs font-semibold text-bronze-700 flex items-center gap-1">
                  <span>Reservar en Atitlán</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Servicios Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold text-charcoal-900">
            Servicios y Experiencias
          </h2>
          <p className="text-sm text-charcoal-700">
            Un ecosistema hotelero completo diseñado para cada momento de su estancia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-bronze-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-base text-charcoal-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-charcoal-700 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-charcoal-200/50 flex items-center justify-between text-xs">
                  <span className="font-medium text-bronze-700">{item.tag}</span>
                  <span className="text-charcoal-400">Ver más</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Arquitectura Base Estado */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl p-6 bg-cream-100 border border-gold-300/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-bronze-700 text-white flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal-900">
                Fase 6A — Scaffold y Arquitectura Frontend Completados
              </p>
              <p className="text-xs text-charcoal-700">
                React + TypeScript + Vite + Tailwind CSS + TanStack Query + React Router + Zod + Vitest
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-status-success-bg text-status-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>93 paths OpenAPI tipados</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
