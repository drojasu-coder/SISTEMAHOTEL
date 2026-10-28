import { useServiceSelection } from '@/features/preferencias/useServiceSelection';
import { MissingServiceSelection } from '@/components/shared/ServiceReservationPanel';
import { Link, useLocation } from 'react-router-dom';
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
import { ApiError } from '@/api/client/http';
import { Alert } from '@/components/ui/Feedback';
import { publicEventCopy, publicVenueSite } from '../publicEventExperience';

export function SalonDetalleCard({ id }: { id: number }) {
  const t = usePublicTexts('eventos');
  const { p, locale } = usePublicInterface();
  const copy = publicEventCopy[locale];
  const { sites } = usePublicPreferences();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.delete('recurso');
  const catalogHref = `/eventos${params.size ? `?${params}` : ''}`;
  const validId = Number.isSafeInteger(id) && id > 0;
  const query = useSalonQuery(validId ? id : 0);
  const salon = query.data;
  const selection = useServiceSelection(salon ? [salon] : [], query.isSuccess);
  const siteName = salon ? publicVenueSite(salon, sites) || copy.siteUnknown : undefined;
  const notFound = query.error instanceof ApiError && query.error.status === 404;
  return <PageContainer>
    <nav aria-label={p('breadcrumbs')}><Link to={catalogHref} className={buttonStyles({ variant: 'ghost', size: 'sm' })}>{t.volverAlCatalogo}</Link></nav>
    {selection.missing && <MissingServiceSelection onClose={selection.close} />}
    <DataState status={!validId ? 'error' : query.isPending ? 'loading' : query.isError || !salon ? 'error' : 'success'} loadingLabel={p('loadingVenue')}
      loadingContent={<div className="space-y-6"><Skeleton height="h-12" /><Skeleton height="aspect-[16/9]" /></div>}
      errorContent={!validId ? <Alert tone="error" title={copy.invalidId}>{copy.invalidIdHelp}</Alert> : <ErrorState message={notFound ? copy.notFound : p('venueDetailError')} description={notFound ? copy.notFoundHelp : copy.loadError} retryLabel={p('retry')} onRetry={() => { void query.refetch(); }} />}>
      {salon && <>
        <PageHeader eyebrow={t.detalleEyebrow} title={<span lang="es">{salon.nombre}</span>}
          context={<><p className="text-sm text-bronce-700" lang="es">{siteName}</p><ResourceSiteNotice siteId={salon.sucursal_id} name={salon.sucursal?.nombre} /></>} />
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="surface overflow-hidden"><ServiceMedia src={salon.imagen_url} alt={salon.nombre} credits={salon.imagen_creditos} /></div>
            <Card><h2 className="mb-3 font-serif text-xl font-semibold">{p('venueDescription')}</h2><p className="whitespace-pre-line text-sm text-neutro-600">{salon.descripcion ? <span lang="es">{salon.descripcion}</span> : copy.descriptionMissing}</p></Card>
            <Card><h2 className="mb-4 font-serif text-xl font-semibold">{t.caracteristicasSalon}</h2><dl className="space-y-3 text-sm"><div><dt>{t.capacidadMaximaLabel}</dt><dd>{salon.capacidad_maxima != null ? t.capacidadPersonas(salon.capacidad_maxima) : copy.capacityUnknown}</dd></div><div><dt>{t.tarifaBaseLabel}</dt><dd><MoneyReference amount={salon.tarifa_base} /></dd></div></dl></Card>
          </div>
          <div><Card className="space-y-4 md:sticky md:top-28"><p className="text-sm">{t.tarifaBaseLabel}</p><p className="font-semibold"><MoneyReference amount={salon.tarifa_base} /></p><p className="text-sm text-neutro-600">{copy.rateHint}</p><p className="text-sm text-neutro-600">{copy.quoteNotice}</p><Button className="w-full" onClick={() => selection.select(salon)}>{p('serviceQuote')}</Button></Card></div>
        </div>
        {selection.selected && <ReservaEventoModal key={salon.id} salon={salon} isOpen onClose={selection.close} />}
      </>}
    </DataState>
  </PageContainer>;
}
