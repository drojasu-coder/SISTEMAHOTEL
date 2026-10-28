import { usePublicInterface } from '@/i18n/public';
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ArrowRight, Building } from 'lucide-react';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { useLocale } from '@/i18n/LocaleContext';
import { buttonStyles } from '@/components/ui/Button';
import type { InicioData } from '../types';
import { publicContactPhone } from '@/lib/contact';

interface SedesSectionProps {
  data: InicioData;
}

export const SedesSection: React.FC<SedesSectionProps> = ({ data }) => {
  const { p } = usePublicInterface();
  const { sites: sedesList, choose, status } = usePublicPreferences();
  const isLoading = status === 'loading';
  const { t, locale } = useLocale();

  if (!data.sedes_visible) return null;

  return (
    <section
      id="sedes"
      aria-label={p('ourLocations')}
      className="bg-neutro-100/60 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la sección */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-bronce-700">
            {' '}{p('exclusiveDestinations')}{' '}</p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-neutro-900 sm:text-4xl">
            <span lang="es">{data.sedes_titulo}</span>
          </h2>
          <p className="mt-3 text-base text-neutro-600 sm:text-lg">
            <span lang="es">{data.sedes_subtitulo}</span>
          </p>
        </div>

        {/* Listado de tarjetas de sedes */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-neutro-200 animate-pulse border border-neutro-300"
              />
            ))
          ) : (
            sedesList.map((sede) => (
              <article
                key={sede.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-neutro-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Fotografía de portada de la sede desde S3 */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutro-200">
                  {sede.imagen_url ? (
                    <img lang="es"
                      src={sede.imagen_url}
                      alt={`${sede.nombre}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutro-200 text-neutro-400">
                      <Building className="size-8" aria-hidden="true" />
                    </div>
                  )}

                  {/* Ciudad / Ubicación Badge */}
                  {sede.ciudad && (
                    <div className="absolute top-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      <span lang="es">{sede.ciudad}</span>
                    </div>
                  )}

                  {/* Crédito fotográfico de la portada de la sede */}
                  {sede.imagen_creditos && (
                    <div className="absolute bottom-2 right-2 z-10 text-[10px] text-white/90">
                      <span
                        className="bg-black/60 px-1.5 py-0.5 rounded text-[9px] backdrop-blur-sm"
                        title={`${p('photo')} ${sede.imagen_creditos.texto}`}
                      >
                        {' '}{p('photo')}{' '}{sede.imagen_creditos.texto}
                      </span>
                    </div>
                  )}
                </div>

                {/* Información de la sede */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-serif text-lg font-bold text-neutro-900 group-hover:text-bronce-700 transition-colors">
                      <span lang="es">{sede.nombre}</span>
                    </h3>

                    {sede.direccion && (
                      <p className="flex items-start gap-1.5 text-xs text-neutro-600">
                        <MapPin className="size-3.5 shrink-0 text-bronce-600 mt-0.5" aria-hidden="true" />
                        <span className="line-clamp-2"><span lang="es">{sede.direccion}</span></span>
                      </p>
                    )}

                    {publicContactPhone(sede.telefono) && (
                      <p className="flex items-center gap-1.5 text-xs text-neutro-600">
                        <Phone className="size-3.5 shrink-0 text-bronce-600" aria-hidden="true" />
                        <a className="inline-flex min-h-11 items-center underline" href={publicContactPhone(sede.telefono)!.href}>{publicContactPhone(sede.telefono)!.display}</a>
                      </p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-neutro-100 pt-4">
                    <Link
                      to={`/reservar?sucursal_id=${sede.id}`}
                      onClick={() => choose(sede.id)}
                      className={buttonStyles({
                        variant: 'primary',
                        size: 'sm',
                        className: 'w-full font-semibold flex items-center justify-center gap-1.5',
                      })}
                    >
                      <span lang={locale}>{t('reserveSite')}</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
