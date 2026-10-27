import { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { CatalogFilters, CatalogPagination } from '@/components/shared/CatalogFilters';
import { CatalogState } from '@/components/shared/CatalogState';
import { ServiceCard, ServiceMedia, ServiceGrid } from '@/components/shared/ServiceCard';
import { Button } from '@/components/ui/Button';
import { useCatalogUrl, useCatalogPage } from '@/features/preferencias/useCatalogUrl';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { useServiciosSpaQuery } from '../hooks/useBienestar';
import { ReservaCitaModal } from './ReservaCitaModal';
import type { ServicioBienestar } from '../types';

export function CatalogoBienestarList() {
  const t = usePublicTexts('bienestar');
  const { p } = usePublicInterface();
  const query = useServiciosSpaQuery();
  // El contrato de bienestar no tiene sucursal: no se añade una relación ficticia.
  const catalog = useCatalogUrl({}, false);
  const [selected, setSelected] = useState<ServicioBienestar | null>(null);
  const all = query.data ?? [];
  const filtered = all.filter((item) => item.nombre?.toLowerCase().includes(catalog.q.trim().toLowerCase()));
  const paging = useCatalogPage(filtered, catalog, query.isSuccess);
  return <PageContainer>
    <PageHeader eyebrow={t.subtitulo} title={t.catalogoTitulo} description={t.catalogoDescripcion} />
    <CatalogFilters catalog={catalog} searchLabel={t.buscar} count={query.isSuccess ? filtered.length : undefined} />
    <CatalogState loading={query.isPending} error={query.isError} total={all.length} filteredCount={filtered.length} hasFilters={Boolean(catalog.q)} onClear={catalog.clear} onRetry={() => { void query.refetch(); }} errorTitle={p('wellnessLoadTitle')} emptyTitle={t.sinServiciosTitulo} emptyDescription={t.sinServiciosDesc}>
      <ServiceGrid>{paging.items.map((item) => <ServiceCard key={item.id} name={<span lang="es">{item.nombre}</span>}
        media={<ServiceMedia src={item.imagen_url} alt={item.nombre} credits={item.imagen_creditos} />}
        facts={<p>{item.duracion_minutos} {t.minutos} {p('session')}</p>}
        price={<MoneyReference amount={item.precio} />}
        action={<Button variant="secondary" className="w-full" onClick={() => setSelected(item)}>{t.reservarCita}</Button>} />)}</ServiceGrid>
      <CatalogPagination catalog={catalog} {...paging} />
    </CatalogState>
    {selected && <ReservaCitaModal servicio={selected} onClose={() => setSelected(null)} />}
  </PageContainer>;
}
