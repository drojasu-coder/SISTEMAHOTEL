/**
 * MisReservasLayout
 *
 * Envuelve todas las páginas de "Mis reservas" con:
 *  - Barra horizontal de categorías (desplazable en pantallas angostas)
 *
 * Conserva todas las rutas existentes y el título de página.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Compass,
  Heart,
  Building2,
  ChevronRight,
  Route,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { RESERVAS_ROUTES } from '@/features/reservas';
import { RESTAURANTE_ROUTES } from '@/features/restaurante';
import { AMENIDADES_ROUTES } from '@/features/amenidades';
import { ACTIVIDADES_ROUTES } from '@/features/actividades';
import { BIENESTAR_ROUTES } from '@/features/bienestar';
import { EVENTOS_ROUTES } from '@/features/eventos';
import { usePublicInterface } from '@/i18n/public';
import { useLocale } from '@/i18n/LocaleContext';
import { MI_VIAJE_ROUTE } from '@/features/mi-viaje/routes';

interface NavItem {
  ruta: string;
  etiqueta: string;
  icon: React.ReactNode;
}

interface MisReservasLayoutProps {
  children: React.ReactNode;
}

export const MisReservasLayout: React.FC<MisReservasLayoutProps> = ({
  children,
}) => {
  const { p } = usePublicInterface();
  const { t } = useLocale();
  const location = useLocation();

  const items: NavItem[] = [
    {
      ruta: RESERVAS_ROUTES.MIS_RESERVAS,
      etiqueta: p('resTabRooms'),
      icon: <BedDouble className="size-4 shrink-0" aria-hidden="true" />,
    },
    {
      ruta: RESTAURANTE_ROUTES.MIS_RESERVAS,
      etiqueta: p('resTabRestaurant'),
      icon: <UtensilsCrossed className="size-4 shrink-0" aria-hidden="true" />,
    },
    {
      ruta: AMENIDADES_ROUTES.MIS_RESERVAS,
      etiqueta: p('resTabAmenities'),
      icon: <Sparkles className="size-4 shrink-0" aria-hidden="true" />,
    },
    {
      ruta: ACTIVIDADES_ROUTES.MIS_RESERVAS,
      etiqueta: p('resTabActivities'),
      icon: <Compass className="size-4 shrink-0" aria-hidden="true" />,
    },
    {
      ruta: BIENESTAR_ROUTES.MIS_RESERVAS,
      etiqueta: p('resTabWellness'),
      icon: <Heart className="size-4 shrink-0" aria-hidden="true" />,
    },
    {
      ruta: EVENTOS_ROUTES.MIS_RESERVAS,
      etiqueta: p('resTabEvents'),
      icon: <Building2 className="size-4 shrink-0" aria-hidden="true" />,
    },
  ];

  // Determina la pestaña activa comparando pathname exacto o con prefijo
  const rutaActiva = items.find((item) => {
    // Habitaciones: sólo /mis-reservas exacto
    if (item.ruta === RESERVAS_ROUTES.MIS_RESERVAS) {
      return location.pathname === item.ruta;
    }
    return location.pathname.startsWith(item.ruta);
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Seis categorías siempre visibles: 3 columnas en móvil/tablet, una sola fila de seis desde lg. Sin desplazamiento. */}
      <nav aria-label={p('resCategories')}>
        <ul className="grid grid-cols-3 gap-1 rounded-xl border border-neutro-200 bg-white p-1 lg:grid-cols-6">
          {items.map((item) => {
            const activo = rutaActiva?.ruta === item.ruta;
            return (
              <li key={item.ruta} className="min-w-0">
                <Link
                  to={item.ruta}
                  aria-current={activo ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 flex-col items-center !no-underline justify-center gap-1 rounded-lg px-1 py-2 text-center text-xs transition-colors sm:text-sm lg:min-h-11 lg:flex-row lg:gap-2 lg:px-3',
                    activo
                      ? 'bg-bronce-600 font-semibold text-white shadow-sm'
                      : 'font-medium text-neutro-700 hover:bg-bronce-50 hover:text-bronce-800',
                  )}
                >
                  {item.icon}
                  <span className="min-w-0 break-words !no-underline">{item.etiqueta}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Acceso a la vista cronológica que complementa estas listas. */}
      <Link
        to={MI_VIAJE_ROUTE}
        className="-mt-3 flex min-h-11 items-center gap-2 self-start rounded-lg px-2 text-sm font-medium text-bronce-700 !no-underline hover:bg-bronce-50 hover:text-bronce-800"
      >
        <Route className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0">{t('myTripShortcut')}</span>
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
      </Link>
      <div className="min-w-0">{children}</div>
    </div>
  );
};
