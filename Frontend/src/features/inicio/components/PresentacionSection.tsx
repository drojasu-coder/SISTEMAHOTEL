import { usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import type { InicioData } from '../types';

interface PresentacionSectionProps {
  data: InicioData;
}

export const PresentacionSection: React.FC<PresentacionSectionProps> = ({ data }) => {
  const { p } = usePublicInterface();
  if (!data.presentacion_visible) return null;

  return (
    <section
      aria-label={p('presentation')}
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Fotografía de Presentación */}
        <div className="relative lg:col-span-6">
          <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-neutro-200 bg-neutro-100 shadow-xl lg:max-w-none">
            {data.presentacion_imagen_url ? (
              <img lang="es"
                src={data.presentacion_imagen_url}
                alt={data.presentacion_imagen_alt || p('hospitality')}
                className="h-full w-full object-cover aspect-[4/3] lg:aspect-auto"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-neutro-200 text-neutro-400">
                <span>{p('representativePhoto')}</span>
              </div>
            )}
          </div>

          {/* Crédito fotográfico si existe */}
          {data.presentacion_imagen_creditos && (
            <div className="mt-2 text-right">
              <a
                href={data.presentacion_imagen_creditos.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-neutro-500 hover:text-neutro-800"
              >
                <Info className="size-3" aria-hidden="true" />
                <span>{p('photo')}{' '}{data.presentacion_imagen_creditos.texto}</span>
              </a>
            </div>
          )}
        </div>

        {/* Narrativa y propuesta de valor */}
        <div className="flex flex-col justify-center lg:col-span-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-bronce-700">
            <Sparkles className="size-4" aria-hidden="true" />
            <span>{p('excellence')}</span>
          </div>

          <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-neutro-900 sm:text-3xl lg:text-4xl">
            <span lang="es">{data.presentacion_titulo}</span>
          </h2>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-neutro-600 sm:text-lg">
            <p><span lang="es">{data.presentacion_texto}</span></p>
          </div>

          <div className="mt-8 border-t border-neutro-200 pt-6">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <p className="font-serif text-2xl font-bold text-bronce-800">4</p>
                <p className="text-xs font-medium text-neutro-500">{p('mainLocations')}</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-bronce-800">100%</p>
                <p className="text-xs font-medium text-neutro-500">{p('warmth')}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="font-serif text-2xl font-bold text-bronce-800">24/7</p>
                <p className="text-xs font-medium text-neutro-500">{p('personalAttention')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
