import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { CatalogFilters, CatalogLinkContext, CatalogPagination } from '@/components/shared/CatalogFilters';
import { CatalogState } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceGrid, ServiceMedia } from '@/components/shared/ServiceCard';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Input';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { useAuth } from '@/features/auth/AuthContext';
import { getHomeRouteForUser } from '@/features/auth/routing';
import { useLocale } from '@/i18n/LocaleContext';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { CatalogSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { useCatalogUrl, useCatalogPage } from '@/features/preferencias/useCatalogUrl';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { parseAmount } from '@/lib/money';
import { RoomSearchPanel } from './RoomSearchPanel';
import { readRoomCriteria, roomCriteriaErrors, roomLoginState } from './roomSearch';
import { useRoomCatalog, useRoomAvailability } from './useRoomData';
import type { HabitacionDisponible } from '@/features/reservas/types';
import type { Habitacion } from '../types';

export function RoomAccessNotice() {
  const { status, user, retry } = useAuth();
  const location = useLocation();
  const { p } = usePublicInterface();
  const { t } = useLocale();
  if (status === 'authenticated' && user?.rol === 'cliente') return null;
  if (status === 'loading') return <LoadingNotice label={p('sessionChecking')} />;
  if (status === 'error') return <Alert tone="error"><p>{p('requestError')}</p><Button variant="secondary" onClick={retry}>{p('retry')}</Button></Alert>;
  if (status === 'authenticated' && user) return <Alert tone="info"><p>{p('roomAuthRequired')}</p><Link to={getHomeRouteForUser(user)} className={buttonStyles({ variant: 'secondary', className: 'mt-3' })}>{t('mySpace')}</Link></Alert>;
  return <Alert tone="info"><p>{p('roomAuthRequired')}</p><Link to="/login" state={roomLoginState(`${location.pathname}${location.search}`)} className={buttonStyles({ variant: 'secondary', className: 'mt-3' })}>{p('roomAccessContinue')}</Link></Alert>;
}

export function RoomCatalog() {
  const { p, locale } = usePublicInterface();
  const t = usePublicTexts('crearReserva');
  const { status, user } = useAuth();
  const client = status === 'authenticated' && user?.rol === 'cliente';
  const scope = usePublicPreferences();
  const [params] = useSearchParams();
  const query = useRoomCatalog();
  const all = Array.isArray(query.data) ? query.data : [];
  const types = Object.fromEntries(all.filter((room) => room.TipoHabitacion).map((room) => [String(room.tipo_habitacion_id), room.TipoHabitacion!.nombre]));
  const catalog = useCatalogUrl({ tipo_habitacion_id: query.isSuccess ? Object.keys(types) : undefined, orden: ['precio_asc', 'precio_desc', 'capacidad'], min: undefined, max: undefined }, true, 'sucursal_id');
  const criteria = readRoomCriteria(params);
  const hasDates = Boolean(criteria.fecha_entrada || criteria.fecha_salida);
  const valid = Object.keys(roomCriteriaErrors(criteria)).length === 0;
  const search = hasDates && valid && params.get('buscar') !== '0' && !catalog.siteConflict;
  const sites = scope.selected === 'all' ? scope.sites.map((site) => site.id) : [scope.selected];
  const available = useRoomAvailability(criteria, sites, search && scope.status === 'ready');
  const source: (Habitacion | HabitacionDisponible)[] = hasDates ? search ? available.data?.rooms ?? [] : [] : all;
  const priceValue = (room: Habitacion | HabitacionDisponible) => parseAmount('tarifa_noche' in room ? room.tarifa_noche : room.TipoHabitacion?.tarifa_noche);
  const min = catalog.values.min ? parseAmount(catalog.values.min) : null;
  const max = catalog.values.max ? parseAmount(catalog.values.max) : null;
  const priceError = Boolean((catalog.values.min && (min === null || min < 0)) || (catalog.values.max && (max === null || max < 0)) || (min !== null && max !== null && min > max));
  const q = catalog.q.trim().toLowerCase();
  const filtered = source.filter((room) => {
    const price = priceValue(room);
    return scope.status === 'ready' && (scope.selected === 'all' || room.sucursal_id === scope.selected) && (!criteria.tipo_habitacion_id || room.tipo_habitacion_id === Number(criteria.tipo_habitacion_id)) && `${room.numero} ${room.TipoHabitacion?.nombre ?? ''}`.toLowerCase().includes(q) && (min === null || (price !== null && price >= min)) && (max === null || (price !== null && price <= max));
  }).sort((a, b) => {
    if (catalog.values.orden === 'capacidad') return (b.TipoHabitacion?.capacidad_maxima ?? 0) - (a.TipoHabitacion?.capacidad_maxima ?? 0);
    if (catalog.values.orden) { const aPrice = priceValue(a); const bPrice = priceValue(b); return aPrice === null ? 1 : bPrice === null ? -1 : (aPrice - bPrice) * (catalog.values.orden === 'precio_desc' ? -1 : 1); }
    return a.numero.localeCompare(b.numero, undefined, { numeric: true });
  });
  const settled = scope.status === 'ready' && (hasDates ? search && available.isSuccess : query.isSuccess);
  const paging = useCatalogPage(filtered, catalog, settled);
  const completeFailure = Boolean(available.data && available.data.failures.length === sites.length);
  const loading = hasDates ? search && available.isPending : query.isPending;
  const update = (changes: Partial<typeof criteria>) => catalog.updateParams({ ...changes, buscar: '0', page: null }, true);
  const canShow = client && !catalog.siteConflict && !priceError && (!hasDates || search);
  return <PageContainer>
    <PageHeader title={p('roomsCatalog')} description={p('roomsIntro')} context={<CatalogSiteNotice />} />
    <RoomSearchPanel criteria={criteria} onChange={update} onSearch={() => catalog.updateParams({ buscar: '1', page: null })} loading={loading && client} />
    <CatalogLinkContext catalog={catalog} /><RoomAccessNotice />
    {client && <>
      <CatalogFilters catalog={catalog} searchLabel={p('roomKeyword')} activeFilterLabels={{ min: p('roomNightlyMin'), max: p('roomNightlyMax') }} count={canShow && settled ? filtered.length : undefined} filters={[
        { key: 'tipo_habitacion_id', label: t.tipoHabitacionLabel, all: t.tipoHabitacionTodos, options: Object.keys(types), labels: types },
        { key: 'orden', label: p('roomOrder'), all: p('roomOrderDefault'), options: ['precio_asc', 'precio_desc', 'capacidad'], labels: { precio_asc: p('roomPriceAsc'), precio_desc: p('roomPriceDesc'), capacidad: p('roomCapacityOrder') }, lang: locale },
      ]} extraFilters={<><Input label={p('roomNightlyMin')} type="number" min={0} step="0.01" value={catalog.values.min} onChange={(event) => catalog.updateParams({ min: event.target.value, page: null }, true)} /><Input label={p('roomNightlyMax')} type="number" min={0} step="0.01" value={catalog.values.max} onChange={(event) => catalog.updateParams({ max: event.target.value, page: null }, true)} /></>} />
      {priceError && <Alert tone="error">{p('roomPriceInvalid')}</Alert>}
      {!hasDates && <p className="text-sm text-neutro-600">{p('roomCatalogueOnly')}</p>}
      {hasDates && !search && !catalog.siteConflict && <Alert tone="info">{p('roomSearchFirst')}</Alert>}
      {available.data && available.data.failures.length > 0 && search && <Alert tone="warning"><p>{p('roomPartial', { count: available.data.failures.length })}</p><Button variant="text" onClick={() => { void available.refetch(); }}>{p('roomRetrySearch')}</Button></Alert>}
      {canShow && <CatalogState loading={loading || scope.status === 'loading'} error={scope.status === 'error' || (hasDates ? available.isError || completeFailure : query.isError)} total={source.length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q || Object.values(catalog.values).some(Boolean))} onClear={catalog.clear} onRetry={() => { if (scope.status === 'error') scope.retry(); else if (hasDates) void available.refetch(); else void query.refetch(); }} errorTitle={p('roomLoadError')} emptyTitle={p('roomNoMatches')} emptyDescription={p('roomChangeCriteria')}>
        <ServiceGrid>{paging.items.map((room) => { const next = new URLSearchParams(params); next.set('sede', String(room.sucursal_id)); const quote = 'total_estimado' in room ? room : undefined; return <ServiceCard key={room.id} name={<>{p('room')} {room.numero} · <span lang="es">{room.TipoHabitacion?.nombre}</span></>} site={scope.selected === 'all' ? scope.sites.find((site) => site.id === room.sucursal_id)?.nombre || room.Sucursal?.nombre : undefined}
          media={<ServiceMedia src={room.imagen_url} alt={`${room.TipoHabitacion?.nombre ?? p('room')} ${room.numero}`} credits={room.imagen_creditos} />}
          facts={typeof room.TipoHabitacion?.capacidad_maxima === 'number' ? <p>{t.capacidadPersonas(room.TipoHabitacion.capacidad_maxima)}</p> : undefined}
          price={<div className="space-y-2"><p>{p('nightlyRate')}: <MoneyReference amount={priceValue(room)} /></p>{quote && <p>{t.nochesCalculadas(quote.noches)} · {p('estimatedTotal')}: <MoneyReference amount={quote.total_estimado} /></p>}</div>}
          action={<Link to={`/habitaciones/${room.id}?${next}`} className={buttonStyles({ variant: 'secondary', className: 'w-full' })}>{p('roomView')}</Link>} />; })}</ServiceGrid>
        <CatalogPagination catalog={catalog} {...paging} />
      </CatalogState>}
    </>}
  </PageContainer>;
}
