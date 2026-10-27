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
import { MoneyReference } from '@/components/ui/MoneyReference';
import { useRecursosActividadQuery } from '../hooks/useActividades';
import { ReservaActividadModal } from './ReservaActividadModal';
import type { RecursoActividad } from '../types';

export function CatalogoActividadesCliente() {
  const t = usePublicTexts('actividades');
  const { p } = usePublicInterface();
  const scope = usePublicPreferences();
  const query = useRecursosActividadQuery();
  const all = query.data ?? [];
  const types = [...new Set(all.map((item) => item.tipo).filter((value): value is string => typeof value === 'string' && Boolean(value)))].sort();
  const catalog = useCatalogUrl({ tipo: query.isSuccess ? types : undefined });
  const [selected, setSelected] = useState<RecursoActividad | null>(null);
  const q = catalog.q.trim().toLowerCase();
  const filtered = all.filter((item) => scope.status === 'ready' && (scope.selected === 'all' || item.sucursal_id === scope.selected) && (!catalog.values.tipo || item.tipo === catalog.values.tipo) && (item.nombre?.toLowerCase().includes(q) || item.tipo?.toLowerCase().includes(q)));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess && scope.status === 'ready');
  return <PageContainer>
    <PageHeader eyebrow={t.subtitulo} title={t.catalogoTitulo} description={t.catalogoDescripcion} context={<CatalogSiteNotice />} />
    <CatalogLinkContext catalog={catalog} />
    <CatalogFilters catalog={catalog} searchLabel={t.buscarActividad} filters={[{ key: 'tipo', label: t.filtrarPorTipo, all: t.todosLosTipos, options: types }]} count={query.isSuccess && !catalog.siteConflict && scope.status === 'ready' ? filtered.length : undefined} />
    {!catalog.siteConflict && <CatalogState loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={all.length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q || catalog.values.tipo)} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={p('activitiesLoadTitle')} emptyTitle={p('noActivities')} emptyDescription={p('noActivitiesDescription')}>
      <ServiceGrid>{paging.items.map((item) => <ServiceCard key={item.id} name={<span lang="es">{item.nombre}</span>}
        site={scope.selected === 'all' ? scope.sites.find((site) => site.id === item.sucursal_id)?.nombre || item.Sucursal?.nombre : undefined}
        media={<ServiceMedia src={item.imagen_url} alt={item.nombre} credits={item.imagen_creditos} />}
        facts={<p lang="es">{item.tipo}</p>}
        price={<div className="space-y-2"><p>{t.precioPorHora} <MoneyReference amount={item.precio_hora} /></p>
          {Number(item.precio_instructor_hora) > 0 && <p>{p('instructor')} +<MoneyReference amount={item.precio_instructor_hora} /> {p('perHour')}</p>}
          {Number(item.precio_equipo) > 0 && <p>{p('equipment')} +<MoneyReference amount={item.precio_equipo} /></p>}</div>}
        action={<Button variant="secondary" className="w-full" onClick={() => setSelected(item)}>{t.reservarActividad}</Button>} />)}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>}
    <ReservaActividadModal recurso={selected} isOpen={Boolean(selected)} onClose={() => setSelected(null)} />
  </PageContainer>;
}
