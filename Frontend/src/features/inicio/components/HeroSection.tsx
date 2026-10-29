import { usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import type { InicioData } from '../types';

interface HeroSectionProps {
  data: InicioData;
  /** Ciudad de la sede cuya portada se muestra. */
  place?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ data, place }) => {
  const { p } = usePublicInterface();
  return (
    <section
      aria-label={p('mainCover')}
      className="relative flex min-h-[520px] w-full items-center justify-center overflow-hidden bg-neutro-900 text-white sm:min-h-[580px] lg:min-h-[640px]"
    >
      {/* Fotografía de fondo optimizada desde AWS S3 */}
      {data.hero_imagen_url ? (
        <img lang="es"
          src={data.hero_imagen_url}
          alt={data.hero_imagen_alt || 'HOTEL HUNAHPÚ'}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutro-900 via-bronce-950 to-neutro-900" />
      )}

      {/* Degradado oscuro para asegurar contraste AAA con tipografía clara */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35"
        aria-hidden="true"
      />

      {/* Contenido principal del Hero */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-bronce-300 sm:text-sm">
          HOTEL HUNAHPÚ · <span lang="es">{place ?? 'GUATEMALA'}</span>
        </p>

        <h1 className="font-serif text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white drop-shadow-sm">
          <span lang="es">{data.hero_titulo || "HOTEL HUNAHPÚ"}</span>
        </h1>

        <p className="mt-4 max-w-2xl text-base font-normal text-neutro-100 sm:text-lg md:text-xl drop-shadow">
          <span lang="es">{data.hero_subtitulo}</span>
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/reservar"
            className={buttonStyles({
              size: 'lg',
              variant: 'primary',
              className:
                'shadow-lg shadow-bronce-900/30 font-semibold px-8 py-3.5 text-base hover:scale-[1.02] transition-transform',
            })}
          >
            <span>{p('reserveStay')}</span>
            <ArrowRight className="size-4 ml-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};
