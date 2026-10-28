import { Link, useSearchParams } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { CatalogLinkContext, CatalogPagination } from '@/components/shared/CatalogFilters';
import { CatalogState } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceGrid, ServiceMedia } from '@/components/shared/ServiceCard';
import { buttonStyles } from '@/components/ui/Button';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { CatalogSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { useCatalogUrl, useCatalogPage } from '@/features/preferencias/useCatalogUrl';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { parseAmount } from '@/lib/money';
import { RoomCatalogFilters } from './RoomCatalogFilters';
import { readRoomCriteria, roomReservationHref } from './roomSearch';
import { calendarNights } from '@/lib/dates';
import { useRoomCatalog } from './useRoomData';
import { groupByCategory } from './roomCategories';
import type { HabitacionPublico } from '../types';

export function RoomCatalog() {
  const { p, date } = usePublicInterface();
  const t = usePublicTexts('crearReserva');
  const scope = usePublicPreferences();
  const [params] = useSearchParams();
  const query = useRoomCatalog();
  const all: HabitacionPublico[] = Array.isArray(query.data) ? query.data : [];
  // Los filtros de categoría solo incluyen las de la sede elegida (por id de sede, no por nombre).
  const siteRooms = typeof scope.selected === 'number' ? all.filter((room) => room.sucursal?.id === scope.selected) : [];
  const types = Object.fromEntries(
    siteRooms.filter((room) => Boolean(room.tipo)).map((room) => [String(room.tipo!.id), room.tipo!.nombre])
  );
  const capacities = [...new Set((typeof scope.selected === 'number' ? siteRooms : all).map((room) => room.tipo?.capacidad_maxima).filter((capacity): capacity is number => Number.isSafeInteger(capacity) && Number(capacity) > 0))].sort((a, b) => a - b);
  const catalog = useCatalogUrl(
    { tipo_habitacion_id: query.isSuccess ? Object.keys(types) : undefined, capacidad: query.isSuccess ? capacities.map(String) : undefined, orden: ['precio_asc', 'precio_desc', 'capacidad'] },
    true,
    'sucursal_id'
  );
  const priceValue = (room: HabitacionPublico) => parseAmount(room.tipo?.tarifa_noche ?? '0');
  const q = catalog.q.trim().toLowerCase();

  const filtered = all.filter((room) => {
    const sitioOk =
      scope.status === 'ready' &&
      (scope.selected === 'all' || room.sucursal?.id === scope.selected);
    const tipoOk =
      !catalog.values.tipo_habitacion_id || room.tipo?.id === Number(catalog.values.tipo_habitacion_id);
    const textoOk = `${room.tipo?.nombre ?? ''}`.toLowerCase().includes(q);
    return sitioOk && tipoOk && textoOk && (!catalog.values.capacidad || (room.tipo?.capacidad_maxima ?? 0) >= Number(catalog.values.capacidad));
  });
  // Una tarjeta por categoría comercial: las unidades físicas idénticas no se repiten.
  const categories = groupByCategory(filtered).map((group) => group.representative).sort((a, b) => {
    if (catalog.values.orden === 'capacidad') {
      return (b.tipo?.capacidad_maxima ?? 0) - (a.tipo?.capacidad_maxima ?? 0);
    }
    if (catalog.values.orden) {
      const aPrice = priceValue(a);
      const bPrice = priceValue(b);
      return aPrice === null ? 1 : bPrice === null ? -1 : (aPrice - bPrice) * (catalog.values.orden === 'precio_desc' ? -1 : 1);
    }
    // Orden comercial por defecto: tarifa ascendente y, a igual tarifa, capacidad.
    const aPrice = priceValue(a) ?? 0;
    const bPrice = priceValue(b) ?? 0;
    return aPrice - bPrice || (a.tipo?.capacidad_maxima ?? 0) - (b.tipo?.capacidad_maxima ?? 0) || (a.tipo?.id ?? 0) - (b.tipo?.id ?? 0);
  });

  const settled = scope.status === 'ready' && query.isSuccess;
  const paging = useCatalogPage(categories, catalog, settled);
  const canShow = !catalog.siteConflict;
  const reserveHref = roomReservationHref(params, typeof scope.selected === 'number' ? scope.selected : undefined);
  const stay = readRoomCriteria(new URLSearchParams(reserveHref.split('?')[1] ?? ''));
  const nights = calendarNights(stay.fecha_entrada, stay.fecha_salida);

  return (
    <PageContainer>
      <PageHeader title={p('roomsCatalog')} description={p('roomsIntro')} context={<CatalogSiteNotice />} />
      {nights && <p className="text-sm text-neutro-600">{p('staySelected')}: {date(stay.fecha_entrada)} — {date(stay.fecha_salida)} · {stay.numero_huespedes} {p(Number(stay.numero_huespedes) === 1 ? 'guest' : 'guests')} · {t.nochesCalculadas(nights)}</p>}
      <CatalogLinkContext catalog={catalog} />
      <>
        <RoomCatalogFilters catalog={catalog} types={types} capacities={capacities} count={canShow && settled ? categories.length : undefined} />
        <p className="text-sm text-neutro-600">{p('roomCatalogueOnly')}</p>
        {canShow && (
          <CatalogState
            loading={query.isPending || scope.status === 'loading'}
            error={
              scope.status === 'error' ||
              query.isError
            }
            total={all.length}
            filteredCount={categories.length}
            hasFilters={Boolean(
              catalog.q ||
                Object.values(catalog.values).some(Boolean)
            )}
            onClear={catalog.clear}
            onRetry={() => {
              if (scope.status === 'error') scope.retry();
              else void query.refetch();
            }}
            errorTitle={p('roomLoadError')}
            emptyTitle={p('roomNoMatches')}
            emptyDescription={p('roomChangeCriteria')}
          >
            <ServiceGrid>
              {paging.items.map((room) => {
                const next = new URLSearchParams(params);
                next.set('sede', String(room.sucursal?.id ?? ''));
                const sitio = room.sucursal?.nombre;
                const tipo = room.tipo;
                const reservaHref = roomReservationHref(params, room.sucursal?.id, room);

                return (
                  <ServiceCard
                    key={room.id}
                    name={
                      <>
                        {p('room')} {tipo?.nombre ?? p('room')}
                      </>
                    }
                    site={scope.selected === 'all' ? sitio : undefined}
                    media={
                      <ServiceMedia
                        src={room.imagen_url}
                        alt={`${tipo?.nombre ?? p('room')} ${room.id}`}
                        credits={room.imagen_creditos}
                      />
                    }
                    facts={
                      typeof tipo?.capacidad_maxima === 'number'
                        ? <p>{t.capacidadPersonas(tipo.capacidad_maxima)}</p>
                        : undefined
                    }
                    price={
                      <div className="space-y-2">
                        <p>
                          {p('nightlyRate')}{' '}
                          <MoneyReference amount={priceValue(room)} />
                        </p>
                      </div>
                    }
                    action={
                      <div className="flex flex-col gap-2">
                        <Link to={`/habitaciones/${room.id}?${next}`} className={buttonStyles({ variant: 'secondary', className: 'w-full' })}>
                          {p('roomView')}
                        </Link>
                        <Link to={reservaHref} className={buttonStyles({ variant: 'primary', className: 'w-full' })}>
                          {p('roomReserve')}
                        </Link>
                      </div>
                    }
                  />
                );
              })}
            </ServiceGrid>
            <CatalogPagination catalog={catalog} {...paging} />
          </CatalogState>
        )}
      </>
    </PageContainer>
  );
}
