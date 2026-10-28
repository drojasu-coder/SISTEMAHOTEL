import { useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '@/api/client/http';
import { PageContainer, PageHeader } from '@/components/shared/PageContainer';
import { ServiceMedia } from '@/components/shared/ServiceCard';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataState } from '@/components/ui/DataState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { ResourceSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { roomReservationHref } from './roomSearch';
import { useRoomDetail } from './useRoomData';
import type { HabitacionPublico } from '../types';

export function RoomDetail() {
  const { id: rawId } = useParams();
  const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : 0;
  const validId = Number.isSafeInteger(id) && id > 0;
  const { p } = usePublicInterface();
  const t = usePublicTexts('crearReserva');
  const { sites } = usePublicPreferences();
  const [params] = useSearchParams();
  const location = useLocation();
  const query = useRoomDetail(id);
  const room: HabitacionPublico | undefined = query.data;
  const [imageOpen, setImageOpen] = useState(false);
  const siteName = sites.find((site) => site.id === room?.sucursal?.id)?.nombre || room?.sucursal?.nombre;
  const back = `/habitaciones${location.search}`;
  const reserveHref = roomReservationHref(params, room?.sucursal?.id, room);
  if (!validId) {
    return (
      <PageContainer>
        <PageHeader title={p('roomMissing')} />
        <Link to="/habitaciones" className={buttonStyles({ variant: 'secondary' })}>
          {p('roomBack')}
        </Link>
      </PageContainer>
    );
  }
  const notFound = query.error instanceof ApiError && query.error.status === 404;
  const tipo = room?.tipo;
  return (
    <PageContainer className="room-detail pb-[calc(12rem+env(safe-area-inset-bottom))] lg:pb-10">
      <DataState
        status={query.isPending ? 'loading' : notFound ? 'empty' : query.isError || !room ? 'error' : 'success'}
        loadingLabel={p('loadingDetails')}
        loadingContent={<Skeleton height="h-64" />}
        emptyContent={
          <EmptyState
            title={p('roomMissing')}
            description={p('roomChangeCriteria')}
            action={<Link to={back}>{p('roomBack')}</Link>}
          />
        }
        errorContent={
          <ErrorState
            message={p('roomLoadError')}
            description={p('errorHelp')}
            retryLabel={p('retry')}
            onRetry={() => { void query.refetch(); }}
          />
        }
      >
        {room && (
          <>
            <PageHeader
              eyebrow={p('roomDetails')}
              title={<>{p('room')} {tipo?.nombre ?? p('room')}</>}
              breadcrumbs={
                <nav aria-label={p('breadcrumbs')}>
                  <Link to={back} className={buttonStyles({ variant: 'text', size: 'sm' })}>
                    {p('roomBack')}
                  </Link>
                </nav>
              }
              context={
                <>
                  <p className="text-sm text-bronce-700" lang="es">{siteName}</p>
                  <ResourceSiteNotice siteId={room.sucursal?.id ?? 0} name={siteName} />
                </>
              }
            />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="surface overflow-hidden">
                  <ServiceMedia
                    src={room.imagen_url}
                    alt={`${tipo?.nombre ?? p('room')} ${room.id}`}
                    credits={room.imagen_creditos}
                  />
                  {room.imagen_url && (
                    <div className="p-3">
                      <Button variant="ghost" className="w-full" onClick={() => setImageOpen(true)}>
                        {p('roomExpandImage')}
                      </Button>
                    </div>
                  )}
                </div>
                <Card>
                  <h2 className="mb-3 font-serif text-xl font-semibold">{p('roomDescription')}</h2>
                  <p lang={tipo?.descripcion ? 'es' : undefined}>
                    {tipo?.descripcion || p('roomNoDescription')}
                  </p>
                  <p className="mt-4">
                    {typeof tipo?.capacidad_maxima === 'number' && t.capacidadPersonas(tipo.capacidad_maxima)}
                  </p>
                </Card>
              </div>
              <aside className="hidden lg:block">
                <Card className="sticky top-28 space-y-4">
                  <h2 className="font-serif text-xl font-semibold">{t.resumenTitulo}</h2>
                  <p>
                    {p('nightlyRate')}{' '}
                    <MoneyReference amount={tipo?.tarifa_noche ?? '0'} />
                  </p>
                  <p className="text-sm text-neutro-600">{p('roomCatalogueOnly')}</p>
                  <Link to={reserveHref} className={buttonStyles({ variant: 'primary', className: 'w-full' })}>
                    {p('roomReserve')}
                  </Link>
                  <p className="text-xs text-neutro-600">{t.avisoDisponibilidadNoAparta}</p>
                </Card>
              </aside>
            </div>
            <div className="room-reserve-bar fixed inset-x-0 bottom-0 z-30 border-t bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-soft lg:hidden">
              <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <p>{p('nightlyRate')}</p>
                  <MoneyReference amount={tipo?.tarifa_noche ?? '0'} />
                </div>
                <Link to={reserveHref} className={buttonStyles({ variant: 'primary' })}>
                  {p('roomReserve')}
                </Link>
              </div>
            </div>
            <Modal
              open={imageOpen}
              title={p('roomOneImage')}
              closeLabel={p('closeModal')}
              onClose={() => setImageOpen(false)}
              className="!max-w-5xl"
            >
              <ServiceMedia
                src={room.imagen_url}
                alt={`${tipo?.nombre ?? p('room')} ${room.id}`}
                credits={room.imagen_creditos}
                priority
              />
            </Modal>
          </>
        )}
      </DataState>
    </PageContainer>
  );
}
