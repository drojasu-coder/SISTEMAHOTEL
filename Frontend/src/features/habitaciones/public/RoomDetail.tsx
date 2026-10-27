import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { Alert } from '@/components/ui/Feedback';
import { MoneyReference } from '@/components/ui/MoneyReference';
import { useAuth } from '@/features/auth/AuthContext';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { ResourceSiteNotice } from '@/features/preferencias/SiteContextNotice';
import { useCatalogUrl } from '@/features/preferencias/useCatalogUrl';
import { usePublicInterface, usePublicTexts } from '@/i18n/public';
import { useCreateReservaMutation } from '@/features/crear-reserva/hooks/useCrearReserva';
import { ResumenReservaModal } from '@/features/crear-reserva/components/ResumenReservaModal';
import { ReservaConfirmadaCard } from '@/features/crear-reserva/components/ReservaConfirmadaCard';
import type { ReservaHabitacion } from '@/features/reservas/types';
import { RoomSearchPanel } from './RoomSearchPanel';
import { RoomAccessNotice } from './RoomCatalog';
import { readRoomCriteria, roomCriteriaErrors, toRoomQuery } from './roomSearch';
import { useRoomAvailability, useRoomDetail } from './useRoomData';

export function RoomDetail() {
  const { id: rawId } = useParams();
  const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : 0;
  const validId = Number.isSafeInteger(id) && id > 0;
  const { p, date } = usePublicInterface();
  const t = usePublicTexts('crearReserva');
  const { status, user } = useAuth();
  const client = status === 'authenticated' && user?.rol === 'cliente';
  const { sites } = usePublicPreferences();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const url = useCatalogUrl({}, false);
  const criteria = readRoomCriteria(params);
  const valid = Object.keys(roomCriteriaErrors(criteria)).length === 0;
  const query = useRoomDetail(id);
  const room = query.data;
  const search = Boolean(valid && params.get('buscar') !== '0' && room);
  const available = useRoomAvailability(criteria, room ? [room.sucursal_id] : [], search);
  const quote = search && !available.isFetching ? available.data?.rooms.find((item) => item.id === id) : undefined;
  const canReserve = Boolean(client && quote && available.isSuccess && !available.isFetching);
  const [imageOpen, setImageOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [created, setCreated] = useState<{ owner: number; reservation: ReservaHabitacion } | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const mutation = useCreateReservaMutation();
  const submitLock = useRef(false);
  const resultOwner = useRef<number | null>(null);
  const siteName = sites.find((site) => site.id === room?.sucursal_id)?.nombre || room?.Sucursal?.nombre;
  const back = `/habitaciones${location.search}`;
  const update = (changes: Partial<typeof criteria>) => { setSummaryOpen(false); url.updateParams({ ...changes, buscar: '0', page: null }, true); };
  const confirm = async () => {
    if (!canReserve || !room || !user || submitLock.current || created || uncertain || mutation.isPending) return;
    submitLock.current = true; resultOwner.current = user.id;
    try {
      const reservation = await mutation.mutateAsync({ habitacion_id: id, fecha_entrada: criteria.fecha_entrada, fecha_salida: criteria.fecha_salida, numero_huespedes: Number(criteria.numero_huespedes) });
      setCreated({ owner: resultOwner.current!, reservation }); setSummaryOpen(false);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status === 0 || error.status >= 500) setUncertain(true);
    } finally { submitLock.current = false; }
  };
  if (!validId) return <PageContainer><PageHeader title={p('roomMissing')} /><Link to="/habitaciones" className={buttonStyles({ variant: 'secondary' })}>{p('roomBack')}</Link></PageContainer>;
  if (!client) return <PageContainer><PageHeader title={p('roomDetails')} /><RoomSearchPanel criteria={criteria} onChange={update} onSearch={() => url.updateParams({ buscar: '1' })} /><RoomAccessNotice /><Link to={back}>{p('roomBack')}</Link></PageContainer>;
  if (created) return <PageContainer>{created.owner === user?.id ? <><Alert tone="success">{p('roomCreatedAdd')}</Alert><ReservaConfirmadaCard reserva={created.reservation} onReset={() => navigate(back)} /></> : <Alert tone="info">{p('roomCreatedAccountChanged')}</Alert>}</PageContainer>;
  const notFound = query.error instanceof ApiError && query.error.status === 404;
  return <PageContainer className="room-detail pb-[calc(12rem+env(safe-area-inset-bottom))] lg:pb-10">
    <DataState status={query.isPending ? 'loading' : notFound ? 'empty' : query.isError || !room ? 'error' : 'success'} loadingLabel={p('loadingDetails')} loadingContent={<Skeleton height="h-64" />} emptyContent={<EmptyState title={p('roomMissing')} description={p('roomChangeCriteria')} action={<Link to={back}>{p('roomBack')}</Link>} />} errorContent={<ErrorState message={p('roomLoadError')} description={p('errorHelp')} retryLabel={p('retry')} onRetry={() => { void query.refetch(); }} />}>
      {room && <>
        <PageHeader eyebrow={p('roomDetails')} title={<>{p('room')} {room.numero} · <span lang="es">{room.TipoHabitacion?.nombre}</span></>}
          breadcrumbs={<nav aria-label={p('breadcrumbs')}><Link to={back} className={buttonStyles({ variant: 'text', size: 'sm' })}>{p('roomBack')}</Link></nav>}
          context={<><p className="text-sm text-bronce-700" lang="es">{siteName}</p><ResourceSiteNotice siteId={room.sucursal_id} name={siteName} /></>} />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="surface overflow-hidden"><ServiceMedia src={room.imagen_url} alt={`${room.TipoHabitacion?.nombre ?? p('room')} ${room.numero}`} credits={room.imagen_creditos} />{room.imagen_url && <div className="p-3"><Button variant="ghost" className="w-full" onClick={() => setImageOpen(true)}>{p('roomExpandImage')}</Button></div>}</div>
            <Card><h2 className="mb-3 font-serif text-xl font-semibold">{p('roomDescription')}</h2><p lang={room.TipoHabitacion?.descripcion ? 'es' : undefined}>{room.TipoHabitacion?.descripcion || p('roomNoDescription')}</p><p className="mt-4">{typeof room.TipoHabitacion?.capacidad_maxima === 'number' && t.capacidadPersonas(room.TipoHabitacion.capacidad_maxima)}</p></Card>
            <RoomSearchPanel criteria={criteria} onChange={update} onSearch={() => url.updateParams({ buscar: '1' })} loading={available.isFetching} />
            {search && available.isFetching && <p role="status">{p('catalogLoading')}</p>}
            {search && (available.isError || Boolean(available.data?.failures.length)) && <ErrorState message={p('roomLoadError')} description={p('errorHelp')} retryLabel={p('retry')} onRetry={() => { void available.refetch(); }} />}
            {search && available.isSuccess && !available.isFetching && !available.data.failures.length && !quote && <Alert tone="info">{p('roomNotAvailable')}</Alert>}
            {uncertain && <Alert tone="warning"><p>{p('roomUncertain')}</p><Link to="/mis-reservas" className={buttonStyles({ variant: 'secondary', className: 'mt-3' })}>{t.botonMisReservas}</Link></Alert>}
          </div>
          <aside className="hidden lg:block"><Card className="sticky top-28 space-y-4"><h2 className="font-serif text-xl font-semibold">{t.resumenTitulo}</h2><p>{p('nightlyRate')}: <MoneyReference amount={quote?.tarifa_noche ?? room.TipoHabitacion?.tarifa_noche} /></p>{quote ? <><p>{date(criteria.fecha_entrada)} — {date(criteria.fecha_salida)}</p><p>{t.nochesCalculadas(quote.noches)}</p><p>{p('estimatedTotal')}: <MoneyReference amount={quote.total_estimado} /></p></> : <p className="text-sm text-neutro-600">{p('roomCatalogueOnly')}</p>}<Button className="w-full" disabled={!canReserve || uncertain} onClick={() => setSummaryOpen(true)}>{p('roomReserve')}</Button><p className="text-xs text-neutro-600">{t.avisoDisponibilidadNoAparta}</p></Card></aside>
        </div>
        <div className="room-reserve-bar fixed inset-x-0 bottom-0 z-30 border-t bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-soft lg:hidden"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div className="min-w-0 text-sm"><p>{quote ? p('estimatedTotal') : p('nightlyRate')}</p><MoneyReference amount={quote?.total_estimado ?? room.TipoHabitacion?.tarifa_noche} /></div><Button disabled={!canReserve || uncertain} onClick={() => setSummaryOpen(true)}>{p('roomReserve')}</Button></div></div>
        <Modal open={imageOpen} title={p('roomOneImage')} closeLabel={p('closeModal')} onClose={() => setImageOpen(false)} className="!max-w-5xl"><ServiceMedia src={room.imagen_url} alt={`${room.TipoHabitacion?.nombre ?? p('room')} ${room.numero}`} credits={room.imagen_creditos} priority /></Modal>
        <ResumenReservaModal open={summaryOpen} onClose={() => setSummaryOpen(false)} habitacion={quote ?? null} criterios={toRoomQuery(criteria, room.sucursal_id)} sedeNombre={siteName} isSubmitting={mutation.isPending} invalidated={!canReserve || uncertain} error={mutation.error} onConfirm={() => { void confirm(); }} onActualizarDisponibilidad={() => { mutation.reset(); void available.refetch(); }} />
      </>}
    </DataState>
  </PageContainer>;
}
