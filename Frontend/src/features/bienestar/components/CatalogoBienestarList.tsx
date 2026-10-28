import { useServiceSelection } from '@/features/preferencias/useServiceSelection';
import { MissingServiceSelection } from '@/components/shared/ServiceReservationPanel';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { CatalogFilters, CatalogLinkContext, CatalogPagination } from '@/components/shared/CatalogFilters';
import { CatalogState } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceMedia, ServiceGrid } from '@/components/shared/ServiceCard';
import { Button } from '@/components/ui/Button';
import { useCatalogUrl, useCatalogPage } from '@/features/preferencias/useCatalogUrl';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { Alert } from '@/components/ui/Feedback';
import { useServiciosSpaQuery, useTerapeutasQuery } from '../hooks/useBienestar';
import { useWellnessCopy } from '../wellnessCopy';
import { ReservaCitaModal } from './ReservaCitaModal';
import { Link } from 'react-router-dom';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { CatalogSiteNotice } from '@/features/preferencias/SiteContextNotice';

export function CatalogoBienestarList() {
  const t = usePublicTexts('bienestar');
  const { p, locale } = usePublicInterface();
  const copy = useWellnessCopy();
  const scope = usePublicPreferences();
  const query = useServiciosSpaQuery();
  // Cada servicio pertenece a una sede (sucursal_id); los generales (null) se muestran en todas.
  const all = (Array.isArray(query.data) ? query.data : []).filter((item) => scope.selected === 'all' || item.sucursal_id == null || item.sucursal_id === scope.selected);
  const durations = [...new Set(all.flatMap((item) => Number.isInteger(item.duracion_minutos) && item.duracion_minutos! > 0 ? [item.duracion_minutos!] : []))].sort((a, b) => a - b).map(String);
  const catalog = useCatalogUrl({ duracion: query.isSuccess ? durations : undefined });
  const selection = useServiceSelection(query.data ?? [], query.isSuccess);
  const selected = selection.selected;
  // Con el panel abierto, la consulta y sus errores pertenecen al formulario; el catálogo reutiliza la caché.
  const terapeutasQuery = useTerapeutasQuery(query.isSuccess && !selected);
  // Solo una lectura correcta sin terapeutas activos demuestra que hoy no se pueden asignar citas.
  const sinTerapeutas = terapeutasQuery.isSuccess && all.length > 0 && !all.some((service) =>
    terapeutasQuery.data?.some((therapist) => therapist.activo === true && (service.sucursal_id == null || therapist.sucursal_id === service.sucursal_id)));
  const filtered = all.filter((item) => item.nombre?.toLowerCase().includes(catalog.q.trim().toLowerCase()) && (!catalog.values.duracion || String(item.duracion_minutos) === catalog.values.duracion));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess);
  return <PageContainer>
    <PageHeader eyebrow={t.subtitulo} title={t.catalogoTitulo} description={p('serviceWellnessDescription')} context={<CatalogSiteNotice />} />
    <CatalogLinkContext catalog={catalog} />
    {selection.missing && <MissingServiceSelection onClose={selection.close} />}
    <CatalogFilters catalog={catalog} searchLabel={t.buscar} filters={durations.length > 1 ? [{ key: 'duracion', label: p('wellnessDurationFilter'), all: p('wellnessAllDurations'), options: durations, labels: Object.fromEntries(durations.map((n) => [n, p('sessionDuration', { n })])), lang: locale }] : []} count={query.isSuccess ? filtered.length : undefined} />
    <p className="text-sm text-neutro-600">{p('wellnessContactConditions')} <Link to="/sedes" className="inline-flex min-h-11 items-center text-bronce-700 underline">{p('wellnessContact')}</Link></p>
    {!catalog.siteConflict && sinTerapeutas && <Alert tone="info" title={copy('onlineUnavailableTitle')}><p>{copy('onlineUnavailableDesc')}</p></Alert>}
    {!catalog.siteConflict && <CatalogState loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={query.data?.length ?? 0} siteCount={all.length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q || catalog.values.duracion)} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={p('wellnessLoadTitle')} emptyTitle={t.sinServiciosTitulo} emptyDescription={t.sinServiciosDesc}>
      <ServiceGrid>{paging.items.map((item) => <ServiceCard key={item.id} name={<span lang="es">{item.nombre}</span>}
        site={scope.selected === 'all' ? scope.sites.find((site) => site.id === item.sucursal_id)?.nombre : undefined}
        media={<ServiceMedia src={item.imagen_url} alt={item.nombre} credits={item.imagen_creditos} />}
        facts={<p>{item.duracion_minutos ? p('sessionDuration', { n: item.duracion_minutos }) : p('wellnessDurationMissing')}</p>}
        price={<MoneyReference amount={item.precio} />}
        action={<Button variant="secondary" className="w-full" onClick={() => selection.select(item)}>{p('serviceViewReserve')}</Button>} />)}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>}
    {selected && <ReservaCitaModal key={selected.id} servicio={selected} onClose={selection.close} />}
  </PageContainer>;
}
