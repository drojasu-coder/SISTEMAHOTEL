import { usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Sparkles, Waves, CalendarCheck2, ArrowRight } from 'lucide-react';
import type { InicioData } from '../types';

interface ExperienciasSectionProps {
  data: InicioData;
}

export const ExperienciasSection: React.FC<ExperienciasSectionProps> = ({ data }) => {
  const { p } = usePublicInterface();
const EXPERIENCIAS = [
  {
    titulo: p('diningTitle'),
    descripcion:
      p('diningDescription'),
    enlace: '/restaurante',
    icono: UtensilsCrossed,
    etiqueta: p('diningAction'),
  },
  {
    titulo: p('wellnessTitle'),
    descripcion:
      p('wellnessDescription'),
    enlace: '/bienestar',
    icono: Sparkles,
    etiqueta: p('wellnessAction'),
  },
  {
    titulo: p('amenitiesTitle'),
    descripcion:
      p('amenitiesDescription'),
    enlace: '/amenidades',
    icono: Waves,
    etiqueta: p('amenitiesAction'),
  },
  {
    titulo: p('venuesTitle'),
    descripcion:
      p('venuesDescription'),
    enlace: '/eventos',
    icono: CalendarCheck2,
    etiqueta: p('venuesAction'),
  },
];


  if (!data.experiencias_visible) return null;

  return (
    <section
      aria-label={p('experiencesTitle')}
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      {/* Encabezado */}
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-bronce-700">
          {' '}{p('comprehensiveServices')}{' '}</p>
        <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-neutro-900 sm:text-4xl">
          <span lang="es">{data.experiencias_titulo}</span>
        </h2>
        <p className="mt-3 text-base text-neutro-600 sm:text-lg">
          <span lang="es">{data.experiencias_subtitulo}</span>
        </p>
      </div>

      {/* Grid de Servicios con Fotografía Destacada */}
      <div className="mt-12 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Imagen destacada de experiencias */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutro-200 bg-neutro-100 shadow-md lg:col-span-5 min-h-[300px] lg:min-h-full">
          {data.experiencias_imagen_url ? (
            <img lang="es"
              src={data.experiencias_imagen_url}
              alt={data.experiencias_imagen_alt || p('experiencesAlt')}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutro-200 text-neutro-400">
              <span>{p('diningWellness')}</span>
            </div>
          )}

          {data.experiencias_imagen_creditos && (
            <div className="absolute bottom-2 right-2 z-10 text-[10px] text-white">
              <a
                href={data.experiencias_imagen_creditos.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/60 px-2 py-0.5 rounded text-[10px] backdrop-blur-sm hover:underline"
              >
                {' '}{p('photo')}{' '}{data.experiencias_imagen_creditos.texto}
              </a>
            </div>
          )}
        </div>

        {/* Tarjetas de servicios disponibles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
          {EXPERIENCIAS.map((exp, idx) => {
            const Icon = exp.icono;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-neutro-200 bg-white p-6 shadow-sm transition-all hover:border-bronce-300 hover:shadow-md"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-lg bg-bronce-50 text-bronce-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold text-neutro-900">
                    {exp.titulo}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutro-600">
                    <span lang="es">{exp.descripcion}</span>
                  </p>
                </div>

                <div className="mt-5 border-t border-neutro-100 pt-3">
                  <Link
                    to={exp.enlace}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-bronce-700 hover:text-bronce-900 transition-colors"
                  >
                    <span>{exp.etiqueta}</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
