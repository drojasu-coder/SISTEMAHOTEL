import { useServiceSelection } from '@/features/preferencias/useServiceSelection';
import { MissingServiceSelection } from '@/components/shared/ServiceReservationPanel';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { CatalogFilters, CatalogLinkContext, CatalogPagination } from '@/components/shared/CatalogFilters';
import { CatalogState } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceMedia, ServiceGrid } from '@/components/shared/ServiceCard';
import { Link } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { AMENIDADES_ROUTES } from '../constants/routes';
import { useCatalogUrl, useCatalogPage } from '@/features/preferencias/useCatalogUrl';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { CatalogSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { useAmenidadesQuery } from '../hooks/useAmenidades';
import { ReservaAmenidadFormModal } from './ReservaAmenidadFormModal';
import { Badge } from '@/components/ui/Badge';
import { useAccessCopy } from '../accessCopy';

const ACCESOS = ['reservable', 'compartida'] as const;
// Sin el campo (respuestas anteriores) se conserva el comportamiento previo: reservable.
const accesoDe = (item: { reservable?: boolean }) => (item.reservable === false ? 'compartida' : 'reservable');

export function CatalogoAmenidadesCliente() {
  const t = usePublicTexts('amenidades');
  const tc = t.cliente;
  const { p } = usePublicInterface();
  const access = useAccessCopy();
  const scope = usePublicPreferences();
  const { user, status } = useAuth();
  const catalog = useCatalogUrl({ acceso: ACCESOS });
  const query = useAmenidadesQuery();
  const all = query.data ?? [];
  const selection = useServiceSelection(query.data ?? [], query.isSuccess);
  const selected = selection.selected;
  const filtered = all.filter((item) => scope.status === 'ready' && (scope.selected === 'all' || item.sucursal_id === scope.selected) && (!catalog.values.acceso || accesoDe(item) === catalog.values.acceso) && item.nombre.toLowerCase().includes(catalog.q.trim().toLowerCase()));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess && scope.status === 'ready');
  return <PageContainer>
    <PageHeader eyebrow={tc.catalogoSubtitulo} title={tc.catalogoTitulo} description={tc.catalogoDescripcion} context={<CatalogSiteNotice />}
      action={status === 'authenticated' && user?.rol === 'cliente' ? <Link to={AMENIDADES_ROUTES.MIS_RESERVAS} className={buttonStyles({ variant: 'secondary' })}>{tc.misReservasTitulo}</Link> : undefined} />
    <CatalogLinkContext catalog={catalog} />
    {selection.missing && <MissingServiceSelection onClose={selection.close} />}
    <CatalogFilters catalog={catalog} searchLabel={t.buscarLabel} placeholder={t.buscarPlaceholder} count={query.isSuccess && !catalog.siteConflict && scope.status === 'ready' ? filtered.length : undefined} resultLabel={t.amenidadesMostradas(filtered.length)} />
    <div role="group" aria-label={access('accessFilter')} className="flex flex-wrap gap-2">
      {(['', ...ACCESOS] as const).map((acceso) => <Button key={acceso || 'all'} size="sm" variant={catalog.values.acceso === acceso || (!acceso && !catalog.values.acceso) ? 'primary' : 'secondary'} aria-pressed={catalog.values.acceso === acceso || (!acceso && !catalog.values.acceso)} onClick={() => catalog.setFilter('acceso', acceso)}>
        {acceso ? access(acceso) : access('allAccess')}
      </Button>)}
    </div>
    {!catalog.siteConflict && <CatalogState loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={all.length} siteCount={all.filter((item) => scope.selected === 'all' || item.sucursal_id === scope.selected).length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q || catalog.values.acceso)} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={t.errorCargar} emptyTitle={t.sinAmenidadesTitulo} emptyDescription={t.sinAmenidadesDescLectura}>
      <ServiceGrid>{paging.items.map((item) => <ServiceCard key={item.id} name={<span lang="es">{item.nombre}</span>}
        site={scope.selected === 'all' ? scope.sites.find((site) => site.id === item.sucursal_id)?.nombre || item.Sucursal?.nombre || (item.sucursal_id ? `#${item.sucursal_id}` : undefined) : undefined}
        media={<ServiceMedia src={item.imagen_url} alt={item.nombre} credits={item.imagen_creditos} />}
        status={<Badge tone={accesoDe(item) === 'reservable' ? 'info' : 'neutro'}>{access(accesoDe(item))}</Badge>}
        facts={accesoDe(item) === 'reservable'
          ? <><p>{p('maxCapacity')} <strong>{t.aforoPersonas(item.aforo_maximo)}</strong></p><p className="text-xs text-neutro-600">{access('reservableDescription')}</p></>
          : <p className="text-sm text-neutro-600">{access('sharedDescription')}</p>}
        action={accesoDe(item) === 'reservable' ? <Button variant="secondary" className="w-full" onClick={() => selection.select(item)}>{p('serviceViewReserve')}</Button> : undefined} />)}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>}
    <ReservaAmenidadFormModal key={selected?.id} amenidad={selected} isOpen={Boolean(selected)} onClose={selection.close} />
  </PageContainer>;
}
