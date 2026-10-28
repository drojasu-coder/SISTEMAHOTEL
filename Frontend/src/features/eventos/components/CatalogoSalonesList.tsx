import { useServiceSelection } from '@/features/preferencias/useServiceSelection';
import { MissingServiceSelection } from '@/components/shared/ServiceReservationPanel';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { CatalogFilters, CatalogLinkContext, CatalogPagination } from '@/components/shared/CatalogFilters';
import { CatalogState } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceMedia, ServiceGrid } from '@/components/shared/ServiceCard';
import { Button } from '@/components/ui/Button';
import { useCatalogUrl, useCatalogPage } from '@/features/preferencias/useCatalogUrl';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { CatalogSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { useSalonesQuery } from '../hooks/useEventos';
import { ReservaEventoModal } from './ReservaEventoModal';
import { publicEventCopy, publicVenueSite, normalizeVenueSearch } from '../publicEventExperience';

export function CatalogoSalonesList() {
  const t = usePublicTexts('eventos');
  const { p, locale } = usePublicInterface();
  const copy = publicEventCopy[locale];
  const scope = usePublicPreferences();
  const query = useSalonesQuery(scope.selected === 'all' ? undefined : { sucursal_id: scope.selected });
  const all = (query.data ?? []).filter((item) => scope.status === 'ready' && (scope.selected === 'all' || item.sucursal_id === scope.selected));
  const capacities = [...new Set(all.flatMap((item) => Number.isSafeInteger(item.capacidad_maxima) && item.capacidad_maxima! > 0 ? [item.capacidad_maxima!] : []))].sort((a, b) => a - b).map(String);
  const catalog = useCatalogUrl({ capacidad: query.isSuccess && scope.status === 'ready' ? capacities : undefined });
  const q = normalizeVenueSearch(catalog.q);
  const selection = useServiceSelection(query.data ?? [], query.isSuccess);
  const selected = selection.selected;
  const filtered = all.filter((item) => normalizeVenueSearch(`${item.nombre ?? ''} ${item.descripcion ?? ''} ${publicVenueSite(item, scope.sites) ?? ''}`).includes(q) && (!catalog.values.capacidad || (item.capacidad_maxima != null && item.capacidad_maxima >= Number(catalog.values.capacidad))));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess && scope.status === 'ready');
  return <PageContainer>
    <PageHeader eyebrow={t.catalogoEyebrow} title={t.catalogoTitulo} description={copy.introduction} context={<CatalogSiteNotice />} />
    <CatalogLinkContext catalog={catalog} />
    {selection.missing && <MissingServiceSelection onClose={selection.close} />}
    <CatalogFilters catalog={catalog} searchLabel={copy.search} filters={capacities.length > 1 ? [{ key: 'capacidad', label: copy.capacityFilter, all: copy.anyCapacity, options: capacities, labels: Object.fromEntries(capacities.map((n) => [n, copy.capacityPeople.replace('{n}', n)])), lang: locale }] : []} count={query.isSuccess && !catalog.siteConflict && scope.status === 'ready' ? filtered.length : undefined} />
    {!catalog.siteConflict && <CatalogState scopedOnly loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={all.length} siteCount={all.filter((item) => scope.selected === 'all' || item.sucursal_id === scope.selected).length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q || catalog.values.capacidad)} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={p('venueLoadTitle')} emptyTitle={p('serviceEmptyVenues')} emptyDescription={p('serviceEmptyCatalogHelp')}>
      <ServiceGrid>{paging.items.map((item) => <ServiceCard key={item.id} name={<span lang="es">{item.nombre}</span>}
        site={scope.selected === 'all' ? publicVenueSite(item, scope.sites) || copy.siteUnknown : undefined}
        media={<ServiceMedia src={item.imagen_url} alt={item.nombre} credits={item.imagen_creditos} />}
        facts={<>{item.descripcion && <p lang="es" className="line-clamp-3">{item.descripcion}</p>}<p>{item.capacidad_maxima != null ? t.capacidadPersonas(item.capacidad_maxima) : copy.capacityUnknown}</p></>}
        price={<>{t.tarifaBaseLabel}: <MoneyReference amount={item.tarifa_base} /></>}
        action={<div className="flex flex-col gap-2"><Link to={`/eventos/salones/${item.id}${catalog.shareHref.includes('?') ? catalog.shareHref.slice(catalog.shareHref.indexOf('?')) : ''}`} className={buttonStyles({ variant: 'secondary' })}>{p('serviceViewVenue')}</Link><Button variant="text" onClick={() => selection.select(item)}>{p('serviceQuote')}</Button></div>} />)}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>}
    {selected && <ReservaEventoModal key={selected.id} salon={selected} isOpen onClose={selection.close} />}
  </PageContainer>;
}
