import { useState } from 'react';
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
import type { Salon } from '../types';

export function CatalogoSalonesList() {
  const t = usePublicTexts('eventos');
  const { p } = usePublicInterface();
  const scope = usePublicPreferences();
  const catalog = useCatalogUrl();
  const [selected, setSelected] = useState<Salon | null>(null);
  const query = useSalonesQuery(scope.selected === 'all' ? undefined : { sucursal_id: scope.selected });
  const all = (query.data ?? []).filter((item) => scope.status === 'ready' && (scope.selected === 'all' || item.sucursal_id === scope.selected));
  const q = catalog.q.trim().toLowerCase();
  const filtered = all.filter((item) => item.nombre?.toLowerCase().includes(q) || item.descripcion?.toLowerCase().includes(q));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess && scope.status === 'ready');
  return <PageContainer>
    <PageHeader eyebrow={t.catalogoEyebrow} title={t.catalogoTitulo} description={t.catalogoDescripcion} context={<CatalogSiteNotice />} />
    <CatalogLinkContext catalog={catalog} />
    <CatalogFilters catalog={catalog} searchLabel={t.buscarSalon} count={query.isSuccess && !catalog.siteConflict && scope.status === 'ready' ? filtered.length : undefined} />
    {!catalog.siteConflict && <CatalogState loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={all.length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q)} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={p('venueLoadTitle')} emptyTitle={t.sinSalonesTitulo} emptyDescription={t.sinSalonesMensaje}>
      <ServiceGrid>{paging.items.map((item) => <ServiceCard key={item.id} name={<span lang="es">{item.nombre}</span>}
        site={scope.selected === 'all' ? scope.sites.find((site) => site.id === item.sucursal_id)?.nombre || item.sucursal?.nombre : undefined}
        media={<ServiceMedia src={item.imagen_url} alt={item.nombre} credits={item.imagen_creditos} />}
        facts={<><p lang={item.descripcion ? 'es' : undefined} className="line-clamp-3">{item.descripcion || p('venueFallback')}</p><p>{t.capacidadPersonas(item.capacidad_maxima ?? 0)}</p></>}
        price={<>{t.tarifaBaseDesde}: <MoneyReference amount={item.tarifa_base} /></>}
        action={<div className="flex flex-col gap-2"><Link to={`/eventos/salones/${item.id}`} className={buttonStyles({ variant: 'secondary' })}>{t.verDetalleSalon}</Link><Button variant="text" onClick={() => setSelected(item)}>{t.solicitarCotizacion}</Button></div>} />)}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>}
    {selected && <ReservaEventoModal salon={selected} isOpen onClose={() => setSelected(null)} />}
  </PageContainer>;
}
