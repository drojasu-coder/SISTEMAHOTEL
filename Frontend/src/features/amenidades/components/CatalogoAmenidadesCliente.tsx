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
import { useAmenidadesQuery } from '../hooks/useAmenidades';
import { ReservaAmenidadFormModal } from './ReservaAmenidadFormModal';
import type { Amenidad } from '../types';

export function CatalogoAmenidadesCliente() {
  const t = usePublicTexts('amenidades');
  const tc = t.cliente;
  const { p } = usePublicInterface();
  const scope = usePublicPreferences();
  const catalog = useCatalogUrl();
  const [selected, setSelected] = useState<Amenidad | null>(null);
  const query = useAmenidadesQuery();
  const all = query.data ?? [];
  const filtered = all.filter((item) => scope.status === 'ready' && (scope.selected === 'all' || item.sucursal_id === scope.selected) && item.nombre.toLowerCase().includes(catalog.q.trim().toLowerCase()));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess && scope.status === 'ready');
  return <PageContainer>
    <PageHeader eyebrow={tc.catalogoSubtitulo} title={tc.catalogoTitulo} description={tc.catalogoDescripcion} context={<CatalogSiteNotice />} />
    <CatalogLinkContext catalog={catalog} />
    <CatalogFilters catalog={catalog} searchLabel={t.buscarLabel} placeholder={t.buscarPlaceholder} count={query.isSuccess && !catalog.siteConflict && scope.status === 'ready' ? filtered.length : undefined} resultLabel={t.amenidadesMostradas(filtered.length)} />
    {!catalog.siteConflict && <CatalogState loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={all.length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q)} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={t.errorCargar} emptyTitle={t.sinAmenidadesTitulo} emptyDescription={t.sinAmenidadesDescLectura}>
      <ServiceGrid>{paging.items.map((item) => <ServiceCard key={item.id} name={<span lang="es">{item.nombre}</span>}
        site={scope.selected === 'all' ? scope.sites.find((site) => site.id === item.sucursal_id)?.nombre || item.Sucursal?.nombre : undefined}
        media={<ServiceMedia src={item.imagen_url} alt={item.nombre} credits={item.imagen_creditos} />}
        facts={<p>{p('maxCapacity')} <strong>{t.aforoPersonas(item.aforo_maximo)}</strong></p>}
        action={<Button variant="secondary" className="w-full" onClick={() => setSelected(item)}>{tc.reservarAcceso}</Button>} />)}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>}
    <ReservaAmenidadFormModal amenidad={selected} isOpen={Boolean(selected)} onClose={() => setSelected(null)} />
  </PageContainer>;
}
