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
import { MoneyReference } from '@/components/ui/MoneyReference';
import { useRecursosActividadQuery } from '../hooks/useActividades';
import { ReservaActividadModal } from './ReservaActividadModal';
import { formatDuration, useExperienceCopy } from '../experienceCopy';

const MODALIDADES = ['experiencia', 'por_hora'] as const;
const modalidadDe = (item: { modalidad?: string }) => (item.modalidad === 'experiencia' ? 'experiencia' : 'por_hora');

export function CatalogoActividadesCliente() {
  const t = usePublicTexts('actividades');
  const { p } = usePublicInterface();
  const xp = useExperienceCopy();
  const scope = usePublicPreferences();
  const query = useRecursosActividadQuery();
  const all = query.data ?? [];
  const types = [...new Set(all.map((item) => item.tipo).filter((value): value is string => typeof value === 'string' && Boolean(value)))].sort();
  const catalog = useCatalogUrl({ tipo: query.isSuccess ? types : undefined, modalidad: MODALIDADES });
  const q = catalog.q.trim().toLowerCase();
  const selection = useServiceSelection(query.data ?? [], query.isSuccess);
  const selected = selection.selected;
  const filtered = all.filter((item) => scope.status === 'ready' && (scope.selected === 'all' || item.sucursal_id === scope.selected) && (!catalog.values.tipo || item.tipo === catalog.values.tipo) && (!catalog.values.modalidad || modalidadDe(item) === catalog.values.modalidad) && (item.nombre?.toLowerCase().includes(q) || item.tipo?.toLowerCase().includes(q)));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess && scope.status === 'ready');
  return <PageContainer>
    <PageHeader eyebrow={t.subtitulo} title={t.catalogoTitulo} description={t.catalogoDescripcion} context={<CatalogSiteNotice />} />
    <CatalogLinkContext catalog={catalog} />
    {selection.missing && <MissingServiceSelection onClose={selection.close} />}
    <CatalogFilters catalog={catalog} searchLabel={t.buscarActividad} filters={[{ key: 'tipo', label: t.filtrarPorTipo, all: t.todosLosTipos, options: types }]} count={query.isSuccess && !catalog.siteConflict && scope.status === 'ready' ? filtered.length : undefined} />
    <div role="group" aria-label={xp('modeFilter')} className="flex flex-wrap gap-2">
      {(['', ...MODALIDADES] as const).map((mode) => <Button key={mode || 'all'} size="sm" variant={catalog.values.modalidad === mode || (!mode && !catalog.values.modalidad) ? 'primary' : 'secondary'} aria-pressed={catalog.values.modalidad === mode || (!mode && !catalog.values.modalidad)} onClick={() => catalog.setFilter('modalidad', mode)}>
        {mode ? xp(mode) : xp('allModes')}
      </Button>)}
    </div>
    {!catalog.siteConflict && <CatalogState loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={all.length} siteCount={all.filter((item) => scope.selected === 'all' || item.sucursal_id === scope.selected).length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q || catalog.values.tipo || catalog.values.modalidad)} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={p('activitiesLoadTitle')} emptyTitle={p('noActivities')} emptyDescription={p('noActivitiesDescription')}>
      <ServiceGrid>{paging.items.map((item) => <ServiceCard key={item.id} name={<span lang="es">{item.nombre}</span>}
        site={scope.selected === 'all' ? scope.sites.find((site) => site.id === item.sucursal_id)?.nombre || item.Sucursal?.nombre || (item.sucursal_id ? `#${item.sucursal_id}` : undefined) : undefined}
        media={<ServiceMedia src={item.imagen_url} alt={item.nombre} credits={item.imagen_creditos} />}
        facts={modalidadDe(item) === 'experiencia'
          ? <><p className="font-medium text-bronce-700">{xp('guidedExperience')}</p><p className="text-xs text-neutro-600">{xp('guidedIncludes')}</p>
              {item.duracion_minutos ? <p>{xp('duration')}: {formatDuration(item.duracion_minutos)}</p> : null}
              {item.cupo_maximo ? <p>{xp('capacityPerDeparture')}: {xp('people', { n: item.cupo_maximo })}</p> : null}</>
          : <><p className="font-medium text-neutro-700">{xp('hourlyRental')}</p><p className="text-xs text-neutro-600">{xp('hourlyIncludes')}</p></>}
        price={modalidadDe(item) === 'experiencia'
          ? <p><MoneyReference amount={item.precio_persona} /> <span className="text-sm text-neutro-600">{xp('perPerson')}</span></p>
          // El backend cobra precio_hora × horas: instructor y equipo no suman al total, por eso no se muestran como cargos.
          : <p><MoneyReference amount={item.precio_hora} /> <span className="text-sm text-neutro-600">{xp('perHour')}</span></p>}
        action={<Button variant="secondary" className="w-full" onClick={() => selection.select(item)}>{p('serviceViewReserve')}</Button>} />)}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>}
    <ReservaActividadModal key={selected?.id} recurso={selected} isOpen={Boolean(selected)} onClose={selection.close} />
  </PageContainer>;
}
