import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, BedDouble, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Table, type Column } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { useLocale } from '@/i18n/LocaleContext';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { useAdminDashboard, type DashboardReservaReciente } from '@/features/admin-core/hooks/useAdminDashboard';
import { dashboardText } from '@/features/admin-core/dashboardText';
import { HabitacionesPage } from './HabitacionesPage';

type Row = Omit<DashboardReservaReciente, 'id'> & { id: string };

export function AdminPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const text = dashboardText(locale);
  const scope = useAdminScope();
  const canReadRooms = Boolean(user && hasPermission(user.rol, 'reservas.gestionar'));
  const query = useAdminDashboard(scope.selectedSedeId, canReadRooms && !scope.isLoadingSedes && !scope.isErrorSedes);
  const [tab, setTab] = useState('arrivals');
  if (!user) return null;
  if (user.rol === 'empleado_operativo') return <HabitacionesPage />;
  const data = query.data;
  const resumen = data?.resumen;
  const date = (value: string) => new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', { timeZone: 'America/Guatemala' }).format(new Date(value + 'T12:00:00Z'));
  const time = (value: string) => new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', {
    timeZone: 'America/Guatemala', dateStyle: 'short', timeStyle: 'short',
  }).format(new Date(value));
  const siteName = scope.selectedSede?.nombre ?? text.all;
  const stateLabel = (state: string) => text[state as 'pendiente'] ?? state;
  const columns: Column<Row>[] = [
    { key: 'id', label: text.reservation, render: row => '#' + row.id },
    { key: 'room', label: text.room, render: row => <div><span className="font-semibold">{row.habitacion_numero}</span><p className="mt-1 text-xs text-neutro-600">{row.tipo_habitacion}</p></div> },
    { key: 'site', label: text.site, render: row => row.sucursal_nombre },
    { key: 'arrival', label: text.arrival, render: row => date(row.fecha_entrada) },
    { key: 'departure', label: text.departure, render: row => date(row.fecha_salida) },
    { key: 'guests', label: text.guests, render: row => row.numero_huespedes },
    { key: 'status', label: text.state, render: row => <span className={'inline-flex rounded-full px-2 py-1 text-xs font-medium ' + (
      row.estado === 'confirmada' ? 'bg-exito-50 text-exito-700' :
      row.estado === 'pendiente' ? 'bg-advertencia-50 text-advertencia-800' :
      row.estado === 'cancelada' || row.estado === 'expirada' ? 'bg-error-50 text-error-700' : 'bg-neutro-100 text-neutro-700'
    )}>{stateLabel(row.estado)}</span> },
    ...(tab === 'recent' ? [{ key: 'updated', label: text.updated, render: (row: Row) => time(row.updatedAt) }] : []),
    { key: 'action', label: text.action, render: row => <Link to={'/admin/reservas/' + row.id} aria-label={text.view + ' #' + row.id} className="inline-flex min-h-11 items-center font-semibold text-bronce-700 underline">{text.view}</Link> },
  ];
  const table = (records: DashboardReservaReciente[], empty: string) => records.length
    ? <Table rows={records.map(row => ({ ...row, id: String(row.id) }))} columns={columns} caption={text.activity} />
    : <p role="status" className="py-8 text-center text-sm text-neutro-600">{empty}</p>;

  return <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutro-200 pb-5">
      <div><p className="eyebrow">HOTEL HUNAHPÚ</p>
        <h1 className="mt-1 font-sans text-2xl font-semibold tracking-tight text-neutro-900 sm:text-3xl">{text.welcome}, {user.nombre}</h1>
        <p className="mt-2 text-sm text-neutro-600">{text.operations} · <strong>{siteName}</strong></p>
        {data && !query.isError && <p className="mt-1 text-xs text-neutro-500">{text.snapshot} {time(data.consultado_en)} (Guatemala)</p>}
      </div>
      {canReadRooms && <Button variant="ghost" onClick={() => void query.refetch()} disabled={query.isFetching || scope.isLoadingSedes || scope.isErrorSedes}>
        <RefreshCw className={'size-4 ' + (query.isFetching ? 'animate-spin' : '')} aria-hidden="true" />{text.refresh}
      </Button>}
    </header>
    {!canReadRooms && <Alert tone="info">{text.noRoomAccess}</Alert>}
    {canReadRooms && scope.isErrorSedes && <Alert tone="error" title={text.siteError}><Button variant="secondary" onClick={scope.refetchSedes}>{text.retry}</Button></Alert>}
    {canReadRooms && (scope.isLoadingSedes || query.isLoading) && <LoadingNotice label={text.loading} />}
    {canReadRooms && !scope.isErrorSedes && query.isError && <Alert tone="error" title={text.error}>
      <p>{text.errorHelp}</p><Button className="mt-3" variant="secondary" onClick={() => void query.refetch()}>{text.retry}</Button>
    </Alert>}
    {canReadRooms && !scope.isErrorSedes && !query.isError && data && resumen && <section className="space-y-6" aria-busy={query.isFetching}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><div className="flex items-center justify-between gap-3"><h2 className="font-sans text-sm font-semibold">{text.occupancy}</h2><BedDouble className="size-5 text-bronce-700" aria-hidden="true" /></div>
          <p className="mt-3 text-3xl font-bold tabular-nums">{resumen.porcentaje_ocupacion === null ? '—' : resumen.porcentaje_ocupacion + '%'}</p>
          <p className="mt-2 text-xs text-neutro-600">{resumen.total_habitaciones ? resumen.reservas_activas + ' / ' + resumen.total_habitaciones + ' · ' + text.confirmed : text.noInventory}</p>
          <p className="mt-3 text-xs leading-relaxed text-neutro-600">{text.occupancyHelp}</p>
        </Card>
        <Card><div className="flex items-center justify-between gap-3"><h2 className="font-sans text-sm font-semibold">{text.arrivals}</h2><LogIn className="size-5 text-bronce-700" aria-hidden="true" /></div>
          <p className="mt-3 text-3xl font-bold tabular-nums">{resumen.llegadas_hoy}</p><p className="mt-2 text-xs text-neutro-600">{text.reservationCount} · {date(data.fecha_consulta)}</p>
        </Card>
        <Card><div className="flex items-center justify-between gap-3"><h2 className="font-sans text-sm font-semibold">{text.departures}</h2><LogOut className="size-5 text-bronce-700" aria-hidden="true" /></div>
          <p className="mt-3 text-3xl font-bold tabular-nums">{resumen.salidas_hoy}</p><p className="mt-2 text-xs text-neutro-600">{text.reservationCount} · {date(data.fecha_consulta)}</p>
        </Card>
      </div>
      <Card><h2 className="font-sans text-base font-semibold">{text.inventory}</h2><p className="mt-2 text-xs text-neutro-600">{text.operationalHelp}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[[text.available, resumen.habitaciones_disponibles], [text.occupied, resumen.habitaciones_ocupadas], [text.maintenance, resumen.habitaciones_mantenimiento], [text.cleaning, resumen.habitaciones_limpieza],
            ...(resumen.habitaciones_otro_estado ? [[text.other, resumen.habitaciones_otro_estado]] : [])].map(([label, value]) =>
            <div key={label}><dt className="text-xs text-neutro-600">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd></div>)}
        </dl>
      </Card>
      <Card><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-bronce-700" aria-hidden="true" /><h2 className="font-sans text-base font-semibold">{text.attention}</h2>
        <span className="rounded-full bg-neutro-100 px-2 py-1 text-xs font-semibold">{resumen.reservas_pendientes}</span></div>
        <p className="mt-2 text-xs text-neutro-600">{text.pendingHelp}</p>
        {!data.pendientes_atencion.length ? <p className="mt-4 text-sm text-neutro-600">{text.noPending}</p> :
          <ul className="mt-3 divide-y divide-neutro-200">{data.pendientes_atencion.map(item => <li key={item.id}>
            <Link to={'/admin/reservas/' + item.id} className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-bronce-800">
              <span><strong>{text.pendingReservation} #{item.id}</strong><span className="mt-1 block text-xs text-neutro-600">{item.sucursal_nombre} · {text.room} {item.habitacion_numero} · {text.arrival}: {date(item.fecha)}</span></span>
              <span className="font-semibold text-bronce-700">{text.view}</span>
            </Link>
          </li>)}</ul>}
      </Card>
      <Card><h2 className="mb-3 font-sans text-base font-semibold">{text.activity}</h2>
        <Tabs label={text.activity} value={tab} onChange={setTab} items={[
          { id: 'arrivals', label: text.arrivals, content: table(data.llegadas, text.noArrivals) },
          { id: 'departures', label: text.departures, content: table(data.salidas, text.noDepartures) },
          { id: 'recent', label: text.recent, content: table(data.reservas_recientes, text.noRecent) },
        ]} />
        <p className="mt-4 text-xs text-neutro-600">{text.listsHelp}</p>
      </Card>
    </section>}
  </div>;
}
