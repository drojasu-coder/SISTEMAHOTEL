import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, RefreshCw, Search } from 'lucide-react';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import { useAdminScope } from './AdminScopeContext';
import { useAdminDashboard, type DashboardReservaReciente } from './hooks/useAdminDashboard';

const T = {
  es: { hello: 'Recepción', newRes: 'Nueva reserva', today: 'Hoy', refresh: 'Actualizar', updated: 'Actualizado', search: 'Buscar reserva por número, huésped, correo o habitación', searchBtn: 'Buscar',
    arrivals: 'Llegadas de hoy', departures: 'Salidas de hoy', pending: 'Pendientes de confirmar', upcoming: 'Próximas llegadas', seeAll: 'Ver todas', open: 'Abrir',
    noArrivals: 'No hay llegadas confirmadas para hoy.', noDepartures: 'No hay salidas confirmadas para hoy.', noPending: 'No hay reservas pendientes.', upcomingHint: 'Reservas confirmadas con entrada posterior a hoy',
    room: 'Habitación', guests: 'huéspedes', stay: 'Estancia', error: 'No fue posible consultar el resumen de recepción.', retry: 'Reintentar', loading: 'Consultando recepción…',
    noSites: 'Su usuario no tiene ninguna sede asignada. Solicite a un administrador que se la asigne.', shown: (n: number, t: number) => `Mostrando ${n} de ${t}` },
  en: { hello: 'Front desk', newRes: 'New reservation', today: 'Today', refresh: 'Refresh', updated: 'Updated', search: 'Search a reservation by number, guest, email or room', searchBtn: 'Search',
    arrivals: 'Arrivals today', departures: 'Departures today', pending: 'Awaiting confirmation', upcoming: 'Upcoming arrivals', seeAll: 'View all', open: 'Open',
    noArrivals: 'No confirmed arrivals for today.', noDepartures: 'No confirmed departures for today.', noPending: 'No pending reservations.', upcomingHint: 'Confirmed reservations arriving after today',
    room: 'Room', guests: 'guests', stay: 'Stay', error: 'The front desk summary could not be loaded.', retry: 'Retry', loading: 'Loading front desk…',
    noSites: 'Your user has no site assigned. Ask an administrator to assign one.', shown: (n: number, t: number) => `Showing ${n} of ${t}` },
} as const;

/** Inicio del recepcionista: solo las llegadas, salidas y pendientes de hoy, con acceso directo a cada reserva. */
export function RecepcionInicio() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const t = T[locale === 'en' ? 'en' : 'es'];
  const scope = useAdminScope();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const noSites = !scope.isLoadingSedes && !scope.isErrorSedes && !scope.isGlobalScope && scope.sedes.length === 0;
  const query = useAdminDashboard(scope.selectedSedeId, !scope.isLoadingSedes && !scope.isErrorSedes && !noSites);
  const data = query.data, resumen = data?.resumen;
  const fmt = (v: string) => new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { timeZone: 'America/Guatemala', day: '2-digit', month: 'short' }).format(new Date(v + 'T12:00:00Z'));
  const submit = (e: FormEvent) => { e.preventDefault(); const q = term.trim(); navigate(q ? `/admin/reservas?vista=todas&q=${encodeURIComponent(q)}` : '/admin/reservas?vista=todas'); };

  const row = (r: DashboardReservaReciente) => <li key={r.id}>
    <Link to={'/admin/reservas/' + r.id} className="flex min-h-12 items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-bronce-50">
      <span className="min-w-0"><span className="font-semibold text-neutro-900">#{r.id} · {t.room} {r.habitacion_numero}</span>
        <span className="block truncate text-xs text-neutro-500">{r.tipo_habitacion} · {fmt(r.fecha_entrada)} – {fmt(r.fecha_salida)} · {r.numero_huespedes} {t.guests}{scope.selectedSedeId === 'all' && scope.sedes.length > 1 ? ` · ${r.sucursal_nombre}` : ''}</span></span>
      <ChevronRight className="size-4 shrink-0 text-neutro-400" aria-hidden />
    </Link></li>;
  const panel = (title: string, total: number, shown: number, link: string, empty: string, items: React.ReactNode) => <section aria-label={title} className="rounded-xl border border-neutro-200 bg-white p-4">
    <div className="flex items-center justify-between gap-2"><h2 className="font-sans text-sm font-semibold text-neutro-900">{title} <span className="ml-1 rounded-full bg-neutro-100 px-2 py-0.5 text-xs tabular-nums">{total}</span></h2>
      <Link to={link} className="text-xs font-semibold text-bronce-700 hover:underline">{t.seeAll}</Link></div>
    {total === 0 ? <p role="status" className="py-5 text-center text-sm text-neutro-500">{empty}</p> : <><ul className="-mx-2 mt-2 divide-y divide-neutro-100">{items}</ul>{total > shown && <p className="mt-1 text-xs text-neutro-500">{t.shown(shown, total)}</p>}</>}
  </section>;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs text-neutro-600">{user?.nombre}</p><h1 className="font-sans text-2xl font-semibold text-neutro-900">{t.hello}</h1>
          <p className="text-sm text-neutro-600"><strong className="font-semibold text-neutro-800">{scope.selectedSede?.nombre ?? (locale === 'en' ? 'All authorized sites' : 'Todas las sedes autorizadas')}</strong>{data && <> · {t.today} {fmt(data.fecha_consulta)}</>}</p></div>
<div className="flex flex-wrap gap-2">
          {!noSites && <Link to="/admin/reservas/nueva" className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-bronce-700 px-3 text-sm font-semibold text-white hover:bg-bronce-800"><Plus className="size-4" aria-hidden />{t.newRes}</Link>}
                  <Button variant="secondary" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching || noSites}><RefreshCw className={'size-4 ' + (query.isFetching ? 'animate-spin' : '')} aria-hidden />{t.refresh}</Button></div>
      </header>
      <form role="search" onSubmit={submit} className="flex gap-2">
        <label className="relative min-w-0 flex-1"><span className="sr-only">{t.search}</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-400" aria-hidden />
          <input type="search" value={term} onChange={e => setTerm(e.target.value)} placeholder={t.search} className="field-control pl-9" /></label>
        <Button type="submit">{t.searchBtn}</Button>
      </form>
      {noSites && <Alert tone="info">{t.noSites}</Alert>}
      {(scope.isLoadingSedes || query.isLoading) && !noSites && <LoadingNotice label={t.loading} />}
      {query.isError && !noSites && <Alert tone="error" title={t.error}><Button className="mt-2" variant="secondary" size="sm" onClick={() => void query.refetch()}>{t.retry}</Button></Alert>}
      {data && resumen && !query.isError && <div className="space-y-4" aria-busy={query.isFetching}>
        <div className="grid gap-4 lg:grid-cols-2">
          {panel(t.arrivals, resumen.llegadas_hoy, data.llegadas.length, '/admin/reservas?vista=llegadas', t.noArrivals, data.llegadas.map(row))}
          {panel(t.departures, resumen.salidas_hoy, data.salidas.length, '/admin/reservas?vista=salidas', t.noDepartures, data.salidas.map(row))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {panel(t.pending, resumen.reservas_pendientes, data.pendientes_atencion.length, '/admin/reservas?vista=pendientes', t.noPending, data.pendientes_atencion.map(p => <li key={p.id}>
            <Link to={'/admin/reservas/' + p.id} className="flex min-h-12 items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-bronce-50">
              <span className="min-w-0"><span className="font-semibold text-neutro-900">#{p.id} · {t.room} {p.habitacion_numero}</span><span className="block truncate text-xs text-neutro-500">{t.stay}: {fmt(p.fecha)}{scope.selectedSedeId === 'all' && scope.sedes.length > 1 ? ` · ${p.sucursal_nombre}` : ''}</span></span>
              <ChevronRight className="size-4 shrink-0 text-neutro-400" aria-hidden /></Link></li>))}
          <section aria-label={t.upcoming} className="rounded-xl border border-neutro-200 bg-white p-4"><h2 className="font-sans text-sm font-semibold text-neutro-900">{t.upcoming}</h2>
            <p className="mt-1 text-sm text-neutro-500">{t.upcomingHint}</p>
            <Link to="/admin/reservas?vista=proximas" className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-bronce-700 hover:underline">{t.seeAll}</Link></section>
        </div>
      </div>}
    </div>
  );
}
