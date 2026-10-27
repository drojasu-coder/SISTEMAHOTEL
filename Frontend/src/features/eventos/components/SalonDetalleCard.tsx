import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { ServiceMedia } from '@/components/shared/ServiceCard';
import { Card } from '@/components/ui/Card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { DataState } from '@/components/ui/DataState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { ResourceSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { useSalonQuery } from '../hooks/useEventos';
import { ReservaEventoModal } from './ReservaEventoModal';

export function SalonDetalleCard({ id }: { id: number }) {
  const t = usePublicTexts('eventos');
  const { p } = usePublicInterface();
  const { sites } = usePublicPreferences();
  const [open, setOpen] = useState(false);
  const query = useSalonQuery(id);
  const salon = query.data;
  const siteName = sites.find((site) => site.id === salon?.sucursal_id)?.nombre || salon?.sucursal?.nombre;
  return <PageContainer>
    <DataState status={query.isPending ? 'loading' : query.isError || !salon ? 'error' : 'success'} loadingLabel={p('loadingVenue')}
      loadingContent={<div className="space-y-6"><Skeleton height="h-12" /><Skeleton height="aspect-[16/9]" /></div>}
      errorContent={<ErrorState message={p('venueDetailError')} description={p('venueNotFound')} retryLabel={p('retry')} onRetry={() => { void query.refetch(); }} />}>
      {salon && <>
        <PageHeader eyebrow={t.detalleEyebrow} title={<span lang="es">{salon.nombre}</span>}
          breadcrumbs={<nav aria-label={p('breadcrumbs')}><Link to="/eventos" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>{t.volverAlCatalogo}</Link></nav>}
          context={<><p className="text-sm text-bronce-700" lang="es">{siteName}</p><ResourceSiteNotice siteId={salon.sucursal_id} name={salon.sucursal?.nombre} /></>} />
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="surface overflow-hidden"><ServiceMedia src={salon.imagen_url} alt={salon.nombre} credits={salon.imagen_creditos} /></div>
            <Card><h2 className="mb-3 font-serif text-xl font-semibold">{p('venueDescription')}</h2><p className="whitespace-pre-line text-sm text-neutro-600">{salon.descripcion ? <span lang="es">{salon.descripcion}</span> : p('venueDescriptionFallback')}</p></Card>
            <Card><h2 className="mb-4 font-serif text-xl font-semibold">{t.caracteristicasSalon}</h2><dl className="space-y-3 text-sm"><div><dt>{t.capacidadMaximaLabel}</dt><dd>{t.capacidadPersonas(salon.capacidad_maxima ?? 0)}</dd></div><div><dt>{t.tarifaBaseLabel}</dt><dd><MoneyReference amount={salon.tarifa_base} /></dd></div></dl></Card>
            <Card><h2 className="mb-3 font-serif text-xl font-semibold">{t.condicionesAlquiler}</h2><p className="text-sm text-neutro-600">{t.condicionesTexto}</p></Card>
          </div>
          <div><Card className="space-y-4 md:sticky md:top-28"><p className="text-sm">{p('estimatedInvestment')}</p><p className="font-semibold"><MoneyReference amount={salon.tarifa_base} /> {p('baseRate')}</p><p className="text-sm text-neutro-600">{p('venueIncludedDescription')}</p><Button className="w-full" onClick={() => setOpen(true)}>{t.solicitarCotizacion}</Button></Card></div>
        </div>
        {open && <ReservaEventoModal salon={salon} isOpen onClose={() => setOpen(false)} />}
      </>}
    </DataState>
  </PageContainer>;
}
