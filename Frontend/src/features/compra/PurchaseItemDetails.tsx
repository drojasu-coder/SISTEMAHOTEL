import { roomCalendar } from './calendar';
import { commercialRoomName } from '@/features/habitaciones/public/roomCategories';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { actividadesApi } from '@/features/actividades/api/actividadesApi';
import { bienestarApi } from '@/features/bienestar/api/bienestarApi';
import { eventosApi } from '@/features/eventos/api/eventosApi';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { ServiceMedia } from '@/components/shared/ServiceCard';
import { calendarNights } from '@/lib/dates';
import { publicPhone } from '@/lib/contact';
import { usePublicInterface } from '@/i18n/public';
import type { CarritoItem } from '@/features/carrito/types';

export const reservationPath = (type: string, id: number) => ({ habitacion: `/mis-reservas/${id}`, evento: `/mis-reservas/eventos/${id}`, actividad: `/mis-reservas/actividades/${id}`, bienestar: `/mis-reservas/bienestar/${id}` }[type]);
const loaders = { habitacion: (id: number) => reservasApi.getById(id), evento: (id: number) => eventosApi.getReservaById(id), actividad: (id: number) => actividadesApi.getMyReservaById(id), bienestar: (id: number) => bienestarApi.getMiCitaById(id) };
type Source = Awaited<ReturnType<(typeof loaders)[keyof typeof loaders]>>;
// Dos lecturas simultáneas como máximo; el resto espera y comprueba cancelación antes de empezar.
let active = 0; const waiting: (() => void)[] = [];
async function limited<T>(signal: AbortSignal, load: () => Promise<T>): Promise<T> {
  await new Promise<void>((resolve) => { waiting.push(resolve); if (active < 2) { active++; waiting.shift()!(); } });
  try {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const result = await load();
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    return result;
  } finally { if (waiting.length) waiting.shift()!(); else active--; }
}
export function PurchaseItemDetails({ item, allowNewSearch = false, showLink = true, compact = false }: { item: Pick<CarritoItem, 'tipo_item' | 'referencia_id'>; allowNewSearch?: boolean; showLink?: boolean; compact?: boolean }) {
  const { user, status } = useAuth(); const { p, date, stateLabel } = usePublicInterface(); const { sites } = usePublicPreferences();
  const load = loaders[item.tipo_item as keyof typeof loaders];
  // El loader se define por referencia para no consultar catálogos ni disponibilidad pública.
  const detail = useQuery<Source>({ queryKey: ['purchase-detail', user?.id, item.tipo_item, item.referencia_id], queryFn: ({ signal }) => limited(signal, async () => {
    const record = await load(item.referencia_id);
    if (record.id !== item.referencia_id || record.usuario_id !== user?.id) throw new Error('Reservation identity mismatch');
    return record;
  }), enabled: status === 'authenticated' && user?.rol === 'cliente' && Boolean(load) && Number.isSafeInteger(item.referencia_id) && item.referencia_id > 0, retry: false, staleTime: 0, refetchOnWindowFocus: true });
  const data = detail.data;
  const route = reservationPath(item.tipo_item, item.referencia_id);
  if (!load) return null;
  if (detail.isPending) return <p className="text-xs text-neutro-600">{p('purchaseDetailsLoading')}</p>;
  if (detail.isError || !data) return <div className="text-xs text-neutro-600"><p>{p('purchaseDetailsError')}</p>{showLink && route && <Link className="inline-flex min-h-11 items-center underline" to={route}>{p('purchaseOperational')}</Link>}</div>;
  const room = 'Habitacion' in data ? data.Habitacion : undefined;
  const activity = 'RecursoActividad' in data ? data.RecursoActividad : undefined;
  const venue = 'Salon' in data ? data.Salon : undefined;
  const wellness = 'ServicioBienestar' in data ? data.ServicioBienestar : undefined;
  const siteId = room?.sucursal_id ?? activity?.sucursal_id ?? venue?.sucursal_id;
  const site = sites.find((entry) => entry.id === siteId);
  const siteName = room?.Sucursal?.nombre ?? site?.nombre;
  const title = (room?.TipoHabitacion ? commercialRoomName(room.TipoHabitacion) : undefined) ?? activity?.nombre ?? venue?.nombre ?? wellness?.nombre;
  const image = activity?.imagen_url ?? venue?.imagen_url ?? wellness?.imagen_url;
  const credits = activity?.imagen_creditos ?? venue?.imagen_creditos ?? wellness?.imagen_creditos;
  const phone = publicPhone(site?.telefono ?? '');
  const arrival = 'fecha_entrada' in data ? data.fecha_entrada : undefined;
  const departure = 'fecha_salida' in data ? data.fecha_salida : undefined;
  const guests = 'numero_huespedes' in data ? data.numero_huespedes : undefined;
  const day = 'fecha' in data ? data.fecha : undefined;
  const start = 'hora_inicio' in data ? data.hora_inicio : undefined;
  const end = 'hora_fin' in data ? data.hora_fin : undefined;
  const nights = arrival && departure ? calendarNights(arrival, departure) : null;
  const calendar = arrival && departure && data.id && data.estado ? roomCalendar({ id: data.id, arrival, departure, title: `${p('purchaseRoom')} #${item.referencia_id}${title ? ` · ${title}` : ''}`, state: data.estado }) : null;
  const params = new URLSearchParams({ ...(arrival ? { fecha_entrada: arrival } : {}), ...(departure ? { fecha_salida: departure } : {}), ...(guests ? { numero_huespedes: String(guests) } : {}), ...(siteId ? { sucursal_id: String(siteId) } : {}) });
  if (compact) {
    // Vista compacta de compra: lo esencial a la vista; teléfono, estado y accesos secundarios a demanda. Sin calendario antes de pagar.
    const when = arrival && departure ? `${date(arrival)} — ${date(departure)}${nights !== null ? ` · ${nights} ${p('purchaseNights').toLowerCase()}` : ''}` : day ? `${date(day)}${start ? ` · ${start.slice(0, 5)}` : ''}${end ? ` — ${end.slice(0, 5)}` : ''}` : null;
    const more = Boolean(phone || data.estado || (showLink && route) || (allowNewSearch && arrival && departure));
    return <div className="flex min-w-0 flex-col gap-1 text-sm">
      {title && <p lang="es" className="break-words font-serif text-base font-semibold text-neutro-900">{title}{room?.numero ? ` · ${room.numero}` : ''}</p>}
      {siteName && <p className="text-neutro-700" lang="es">{siteName}</p>}
      {when && <p className="text-neutro-800">{when}{guests !== undefined && ` · ${guests} ${guests === 1 ? p('guest') : p('guests')}`}</p>}
      {more && <details className="text-xs text-neutro-700">
        <summary className="inline-flex min-h-9 cursor-pointer items-center font-semibold text-bronce-700 hover:underline">{p('purchaseMoreDetails')}</summary>
        <div className="mt-1 flex flex-col gap-1">
          {data.estado && <p>{p('purchaseOperational')}: {stateLabel(data.estado)}</p>}
          {phone && <a className="inline-flex min-h-9 items-center underline" href={phone.href}>{phone.display}</a>}
          {showLink && route && <Link to={route} className="inline-flex min-h-9 items-center font-semibold text-bronce-700 underline">{p('purchaseView')} #{item.referencia_id}</Link>}
          {allowNewSearch && arrival && departure && <Link to={`/reservar?${params}`} className="inline-flex min-h-9 items-center underline">{p('purchaseNewSearch')}</Link>}
        </div>
      </details>}
    </div>;
  }
  return <div className="flex flex-col gap-2 text-sm">
    {image && <div className="max-w-xs overflow-hidden rounded-lg"><ServiceMedia src={image} alt={title} credits={credits} /></div>}
    {title && <p lang="es" className="font-semibold">{title}{room?.numero ? ` · ${room.numero}` : ''}</p>}
    {siteName && <p>{p('purchaseLocation')}: <span lang="es">{siteName}</span></p>}
    {phone && <a className="inline-flex min-h-11 items-center underline" href={phone.href}>{phone.display}</a>}
    {arrival && departure && <p>{date(arrival)} — {date(departure)}{nights !== null && ` · ${p('purchaseNights')}: ${nights}`}</p>}
    {guests !== undefined && <p>{p('purchaseGuests')}: {guests}</p>}
    {day && <p>{date(day)}{start && ` · ${start}`}{end && ` — ${end}`} · America/Guatemala</p>}
    {data.estado && <p>{p('purchaseOperational')}: {stateLabel(data.estado)}</p>}
    {showLink && route && <Link to={route} className="inline-flex min-h-11 items-center font-semibold text-bronce-700 underline">{p('purchaseView')} #{item.referencia_id}</Link>}
    {calendar && <Button variant="ghost" className="w-fit" onClick={() => {
      const href = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
      const link = document.createElement('a'); link.href = href; link.download = `reserva-habitacion-${item.referencia_id}.ics`; link.click(); URL.revokeObjectURL(href);
    }}>{p('purchaseCalendar')}</Button>}
    {allowNewSearch && arrival && departure && <div><Link to={`/reservar?${params}`} className="inline-flex min-h-11 items-center underline">{p('purchaseNewSearch')}</Link><p className="text-xs text-neutro-600">{p('purchaseNewSearchNote')}</p></div>}
  </div>;
}
