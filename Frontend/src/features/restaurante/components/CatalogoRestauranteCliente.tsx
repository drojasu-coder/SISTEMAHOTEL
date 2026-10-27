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
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { useMesasQuery } from '../hooks/useReservasMesa';
import { ReservaMesaModal } from './ReservaMesaModal';
import { RESTAURANTE_ROUTES } from '../constants/routes';
import type { MesaConSucursal } from '../types';

export function CatalogoRestauranteCliente() {
  const t = usePublicTexts('restaurante');
  const { p, locale } = usePublicInterface();
  const { user, status } = useAuth();
  const scope = usePublicPreferences();
  const query = useMesasQuery();
  const all = query.data ?? [];
  const zones = [...new Set(all.map((item) => item.zona).filter(Boolean))].sort();
  const catalog = useCatalogUrl({ zona: query.isSuccess ? zones : undefined });
  const [selected, setSelected] = useState<MesaConSucursal | null>(null);
  const q = catalog.q.trim().toLowerCase();
  const siteName = (item: MesaConSucursal) => scope.sites.find((site) => site.id === item.sucursal_id)?.nombre || item.Sucursal?.nombre;
  const filtered = all.filter((item) => scope.status === 'ready' && (scope.selected === 'all' || item.sucursal_id === scope.selected) && (!catalog.values.zona || item.zona === catalog.values.zona) && `${item.zona ?? ''} ${siteName(item) ?? ''}`.toLowerCase().includes(q));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess && scope.status === 'ready');
  const currentSite = scope.sites.find((site) => site.id === scope.selected);
  return <PageContainer>
    <PageHeader eyebrow={t.subtitulo} title={t.titulo} description={t.mesasDescripcion} context={<CatalogSiteNotice />}
      action={status === 'authenticated' && user?.rol === 'cliente' ? <Link to={RESTAURANTE_ROUTES.MIS_RESERVAS} className={buttonStyles({ variant: 'ghost' })}>{t.cliente.misReservasTitulo}</Link> : undefined} />
    <CatalogLinkContext catalog={catalog} />
    <CatalogFilters catalog={catalog} searchLabel={p('searchTables')} filters={[{ key: 'zona', label: t.zona, all: t.todasLasZonas, options: zones }]} count={query.isSuccess && !catalog.siteConflict && scope.status === 'ready' ? filtered.length : undefined} resultLabel={t.mesasMostradas(filtered.length)} />
    {!catalog.siteConflict && currentSite?.restaurante_imagen_url && <div className="surface overflow-hidden"><ServiceMedia ratio="panorama" src={currentSite.restaurante_imagen_url} alt={`${p('restaurant')} ${currentSite.nombre}`} altLang={locale} credits={currentSite.restaurante_imagen_creditos} /></div>}
    {!catalog.siteConflict && <CatalogState loading={query.isPending || scope.status === 'loading'} error={query.isError || scope.status === 'error'} total={all.length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q || catalog.values.zona)} onClear={catalog.clear} onRetry={() => { void query.refetch(); if (scope.status === 'error') scope.retry(); }} errorTitle={t.errorCargar} emptyTitle={t.sinMesasTitulo} emptyDescription={t.sinMesasDesc}>
      <ServiceGrid>{paging.items.map((item) => {
        const site = scope.sites.find((s) => s.id === item.sucursal_id);
        const maintenance = item.estado === 'mantenimiento';
        return <ServiceCard key={item.id} name={`${p('table')} · ${item.zona ?? ''}`} site={scope.selected === 'all' ? siteName(item) : undefined}
          media={<ServiceMedia src={site?.restaurante_imagen_url} alt={`${p('restaurant')} ${siteName(item) ?? ''}`} altLang={locale} credits={site?.restaurante_imagen_creditos} />}
          status={<StatusBadge domain="table" value={item.estado} />}
          facts={<><p>{t.zona}: <span lang="es">{item.zona}</span></p><p>{t.capacidad}: {t.capacidadPersonas(item.capacidad)}</p></>}
          action={<Button variant="secondary" className="w-full" disabled={maintenance} onClick={() => setSelected(item)}>{maintenance ? t.estadosMesa.mantenimiento : t.reservarMesa}</Button>} />;
      })}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>}
    <ReservaMesaModal mesa={selected} isOpen={Boolean(selected)} onClose={() => setSelected(null)} />
  </PageContainer>;
}
