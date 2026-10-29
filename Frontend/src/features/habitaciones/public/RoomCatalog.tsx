import { Link, useSearchParams } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { CatalogLinkContext, CatalogPagination } from '@/components/shared/CatalogFilters';
import { CatalogState } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceGrid, ServiceMedia } from '@/components/shared/ServiceCard';
import { buttonStyles } from '@/components/ui/Button';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { useCatalogUrl, useCatalogPage } from '@/features/preferencias/useCatalogUrl';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { formatDisplayMoney, parseAmount } from '@/lib/money';
import { useLocale } from '@/i18n/LocaleContext';
import { ROOM_FILTER_KEYS, RoomCatalogFilters, type FilterOption } from './RoomCatalogFilters';
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
  const { currency } = useLocale();
  const all: HabitacionPublico[] = Array.isArray(query.data) ? query.data : [];
  const priceValue = (room: HabitacionPublico) => parseAmount(room.tipo?.tarifa_noche ?? '0');
  // Habitaciones de la sede global elegida en el navbar ("Todas las sedes" = todas).
  const inScope = scope.status !== 'ready' ? [] : scope.selected === 'all' ? all : all.filter((room) => room.sucursal?.id === scope.selected);

  // Tipos por nombre: los ids de tipo cambian de una sede a otra, el nombre comercial no.
  const typeNames = [...new Map(inScope.filter((room) => room.tipo).map((room) => [room.tipo!.nombre, priceValue(room) ?? 0])).entries()]
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  const types: FilterOption[] = typeNames.map(([name]) => ({ value: name, label: name }));
  const typeIds = [...new Set(inScope.map((room) => room.tipo?.id).filter((id): id is number => Number.isSafeInteger(id)))].map(String);
  const capacities = [...new Set(inScope.map((room) => room.tipo?.capacidad_maxima).filter((capacity): capacity is number => Number.isSafeInteger(capacity) && Number(capacity) > 0))].sort((a, b) => a - b);

  // Rangos de precio a partir de las tarifas reales (GTQ); la etiqueta usa la moneda de visualización.
  const tariffs = [...new Set(inScope.map(priceValue).filter((price): price is number => price !== null && price > 0))].sort((a, b) => a - b);
  const money = (amount: number) => formatDisplayMoney(amount, currency) ?? String(amount);
  const prices: FilterOption[] = [];
  if (tariffs.length >= 2) {
    const cut1 = tariffs[Math.max(0, Math.ceil(tariffs.length / 3) - 1)];
    const cut2 = tariffs[Math.max(0, Math.ceil((2 * tariffs.length) / 3) - 1)];
    const max = tariffs[tariffs.length - 1];
    prices.push({ value: `${tariffs[0]}-${cut1}`, label: p('roomPriceUpTo', { max: money(cut1) }) });
    const mid = tariffs.find((price) => price > cut1);
    if (mid !== undefined && cut2 > cut1 && cut2 < max) prices.push({ value: `${mid}-${cut2}`, label: p('roomPriceBetween', { min: money(mid), max: money(cut2) }) });
    const top = tariffs.find((price) => price > (cut2 > cut1 && cut2 < max ? cut2 : cut1));
    if (top !== undefined) prices.push({ value: `${top}-${max}`, label: p('roomPriceFrom', { min: money(top) }) });
  }
  const orders: FilterOption[] = [
    { value: 'precio_asc', label: p('roomPriceAsc') }, { value: 'precio_desc', label: p('roomPriceDesc') }, { value: 'capacidad', label: p('roomCapacityOrder') },
  ];

  const loaded = query.isSuccess && scope.status === 'ready';
  const catalog = useCatalogUrl(
    {
      categoria: loaded ? types.map((type) => type.value) : undefined,
      // Enlaces anteriores con el id de tipo siguen funcionando.
      tipo_habitacion_id: loaded ? typeIds : undefined,
      capacidad: loaded ? capacities.map(String) : undefined,
      precio: loaded ? prices.map((price) => price.value) : undefined,
      orden: orders.map((order) => order.value),
    },
    true,
    'sucursal_id'
  );
  const [priceMin, priceMax] = catalog.values.precio ? catalog.values.precio.split('-').map(Number) : [];

  const filtered = inScope.filter((room) => {
    const price = priceValue(room);
    return (!catalog.values.categoria || room.tipo?.nombre === catalog.values.categoria) &&
      (!catalog.values.tipo_habitacion_id || room.tipo?.id === Number(catalog.values.tipo_habitacion_id)) &&
      (!catalog.values.capacidad || (room.tipo?.capacidad_maxima ?? 0) >= Number(catalog.values.capacidad)) &&
      (!catalog.values.precio || (price !== null && price >= priceMin && price <= priceMax));
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
  const currentSite = typeof scope.selected === 'number' ? scope.sites.find((site) => site.id === scope.selected) : undefined;
  const reserveHref = roomReservationHref(params, typeof scope.selected === 'number' ? scope.selected : undefined);
  const stay = readRoomCriteria(new URLSearchParams(reserveHref.split('?')[1] ?? ''));
  const nights = calendarNights(stay.fecha_entrada, stay.fecha_salida);

  return (
    <PageContainer>
      <PageHeader
        title={currentSite ? <>{p('roomsInSite', { site: '' })}<span lang="es">{currentSite.short ?? currentSite.nombre}</span></> : p('roomsCatalog')}
        description={
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span>{currentSite ? p('roomsIntro') : p('roomsAllIntro')}</span>
            {canShow && settled && <span role="status" aria-live="polite" className="font-semibold text-neutro-800">
              {p(categories.length === 1 ? 'roomCountOne' : 'roomCountMany', { count: categories.length })} · <span className="font-normal text-neutro-600">{p('roomNightlyNote')}</span>
            </span>}
          </span>
        }
      />
      {nights && <p className="text-sm text-neutro-600">{p('staySelected')}: {date(stay.fecha_entrada)} — {date(stay.fecha_salida)} · {stay.numero_huespedes} {p(Number(stay.numero_huespedes) === 1 ? 'guest' : 'guests')} · {t.nochesCalculadas(nights)}</p>}
      <CatalogLinkContext catalog={catalog} />
      <>
        {canShow && <RoomCatalogFilters catalog={catalog} types={types} capacities={capacities} prices={prices} orders={orders} count={settled ? categories.length : undefined} />}
        {canShow && (
          <CatalogState
            loading={query.isPending || scope.status === 'loading'}
            error={
              scope.status === 'error' ||
              query.isError
            }
            total={inScope.length}
            filteredCount={categories.length}
            hasFilters={Boolean(catalog.values.categoria || catalog.values.tipo_habitacion_id || catalog.values.capacidad || catalog.values.precio)}
            onClear={() => catalog.updateParams(Object.fromEntries([...ROOM_FILTER_KEYS, 'page'].map((key) => [key, null])))}
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
