import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Table, type Column } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { useAuth } from '@/features/auth/AuthContext';
import { hasPermission } from '@/features/auth/permissions';
import { useLocale } from '@/i18n/LocaleContext';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { useAdminDashboard, type DashboardPeriodo, type DashboardReservaReciente } from '@/features/admin-core/hooks/useAdminDashboard';
import { ChartPanel, MonthlyReservations, OccupancyForecast, RoomStatus, Segmented } from '@/features/admin-core/DashboardCharts';
import { dashboardText } from '@/features/admin-core/dashboardText';
import { RecepcionInicio } from '@/features/admin-core/RecepcionInicio';
import { GerenteHoy } from '@/features/admin-core/GerenteHoy';
import { HabitacionesPage } from './HabitacionesPage';

type Row = Omit<DashboardReservaReciente, 'id'> & { id: string };

export function AdminPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const text = dashboardText(locale);
  const scope = useAdminScope();
  const canReadRooms = Boolean(user && hasPermission(user.rol, 'reservas.gestionar'));
  const noSites = !scope.isLoadingSedes && !scope.isErrorSedes && !scope.isGlobalScope && scope.sedes.length === 0;
  const [periodo, setPeriodo] = useState<DashboardPeriodo>({ dias: 30, meses: 6 });
  const query = useAdminDashboard(scope.selectedSedeId, canReadRooms && !scope.isLoadingSedes && !scope.isErrorSedes && !noSites, periodo);
  const [tab, setTab] = useState('arrivals');
  if (!user) return null;
  if (user.rol === 'gerente_restaurante') return <Navigate to="/admin/restaurante" replace />;
  if (user.rol === 'empleado_operativo') return <HabitacionesPage />;
  if (user.rol === 'recepcionista') return <RecepcionInicio />;
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

  const lang = locale === 'en' ? 'en' : 'es';
  const pct = (value: number | null) => value === null ? '—' : new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-GT', { maximumFractionDigits: 1 }).format(value) + '%';
  const kpis = resumen ? [
    { label: text.kpiOccupancy, value: pct(resumen.porcentaje_ocupacion), sub: resumen.total_habitaciones ? text.kpiRoomsOf(resumen.reservas_activas, resumen.total_habitaciones) : text.noInventory },
    { label: text.kpiArrivals, value: resumen.llegadas_hoy, sub: text.kpiReservations },
    { label: text.kpiDepartures, value: resumen.salidas_hoy, sub: text.kpiReservations },
    { label: text.kpiPending, value: resumen.reservas_pendientes, sub: text.kpiReservations, attention: resumen.reservas_pendientes > 0 },
    { label: text.kpiOutOfService, value: resumen.habitaciones_limpieza + resumen.habitaciones_mantenimiento, sub: text.kpiRoomsOf(resumen.habitaciones_limpieza + resumen.habitaciones_mantenimiento, resumen.total_habitaciones) },
  ] : [];
  const roomStatus = resumen ? [
    { label: text.available, value: resumen.habitaciones_disponibles, color: '#2E7D32' },
    { label: text.occupied, value: resumen.habitaciones_ocupadas, color: '#906438' },
    { label: text.cleaning, value: resumen.habitaciones_limpieza, color: '#1F5F9E' },
    { label: text.maintenance, value: resumen.habitaciones_mantenimiento, color: '#B06E00' },
    ...(resumen.habitaciones_otro_estado ? [{ label: text.other, value: resumen.habitaciones_otro_estado, color: '#a8a29a' }] : []),
  ] : [];

  return <div className="mx-auto w-full max-w-7xl space-y-5 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-neutro-600">{text.welcome}, {user.nombre}</p>
        <h1 className="mt-0.5 font-sans text-2xl font-semibold tracking-tight text-neutro-900">{text.operations}</h1>
        <p className="mt-1 text-sm text-neutro-600"><strong className="font-semibold text-neutro-800">{siteName}</strong>{data && <> · {text.today} {date(data.fecha_consulta)}</>}</p>
      </div>
      {canReadRooms && <div className="flex items-center gap-3">
        {data && !query.isError && <span className="text-xs text-neutro-500">{text.updated}: {time(data.consultado_en)}</span>}
        <Button variant="secondary" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching || scope.isLoadingSedes || scope.isErrorSedes}>
          <RefreshCw className={'size-4 ' + (query.isFetching ? 'animate-spin' : '')} aria-hidden="true" />{text.refresh}
        </Button>
      </div>}
    </header>
    {user.rol === 'gerente_habitaciones' && !noSites && !scope.isErrorSedes && <GerenteHoy />}
    {!canReadRooms && <Alert tone="info">{text.noRoomAccess}</Alert>}
    {canReadRooms && scope.isErrorSedes && <Alert tone="error" title={text.siteError}><Button variant="secondary" onClick={scope.refetchSedes}>{text.retry}</Button></Alert>}
    {canReadRooms && noSites && <Alert tone="info">{locale === 'en' ? 'Your user has no site assigned. Ask an administrator to assign one.' : 'Su usuario no tiene ninguna sede asignada. Solicite a un administrador que se la asigne.'}</Alert>}
    {canReadRooms && (scope.isLoadingSedes || query.isLoading) && <LoadingNotice label={text.loading} />}
    {canReadRooms && !noSites && !scope.isErrorSedes && query.isError && <Alert tone="error" title={text.error}>
      <Button className="mt-2" variant="secondary" onClick={() => void query.refetch()}>{text.retry}</Button>
    </Alert>}
    {canReadRooms && !noSites && !scope.isErrorSedes && !query.isError && data && resumen && <div className="space-y-5" aria-busy={query.isFetching}>
      {/* Indicadores del día, en una sola franja. */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutro-200 bg-neutro-200 sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi, index) => <div key={kpi.label} className={'min-w-0 bg-white p-4' + (index === kpis.length - 1 ? ' col-span-2 xl:col-span-1' : '')}>
          <dt className="flex items-center gap-1.5 text-xs font-medium text-neutro-600">{kpi.attention && <AlertTriangle className="size-3.5 text-advertencia-600" aria-hidden="true" />}{kpi.label}</dt>
          <dd className="mt-1.5 text-2xl font-semibold text-neutro-900">{kpi.value}</dd>
          <dd className="mt-0.5 truncate text-xs text-neutro-500">{kpi.sub}</dd>
        </div>)}
      </dl>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartPanel className="lg:col-span-2" title={text.forecastTitle} subtitle={text.forecastSub(periodo.dias)}
          control={<Segmented label={text.period} value={periodo.dias} onChange={(dias) => setPeriodo((current) => ({ ...current, dias }))} options={[{ value: 30, label: text.days(30) }, { value: 90, label: text.days(90) }]} />}>
          <OccupancyForecast data={data.tendencias.ocupacion_prevista} total={resumen.total_habitaciones} locale={lang} text={text} />
        </ChartPanel>
        <ChartPanel title={text.roomStatusTitle} subtitle={text.roomStatusSub(resumen.total_habitaciones)}>
          <RoomStatus items={roomStatus} total={resumen.total_habitaciones} locale={lang} />
        </ChartPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartPanel className="lg:col-span-2" title={text.monthlyTitle} subtitle={text.monthlySub(periodo.meses)}
          control={<Segmented label={text.period} value={periodo.meses} onChange={(meses) => setPeriodo((current) => ({ ...current, meses }))} options={[{ value: 6, label: text.months(6) }, { value: 12, label: text.months(12) }]} />}>
          <MonthlyReservations data={data.tendencias.reservas_por_mes} locale={lang} text={text} />
        </ChartPanel>
        <ChartPanel title={text.attention} subtitle={`${resumen.reservas_pendientes} ${text.kpiReservations}`}
          control={resumen.reservas_pendientes > 0 ? <Link to="/admin/reservas" className="inline-flex min-h-9 items-center text-xs font-semibold text-bronce-700 hover:underline">{text.viewAll}</Link> : undefined}>
          {!data.pendientes_atencion.length ? <p role="status" className="py-6 text-center text-sm text-neutro-600">{text.noPending}</p> :
            <ul className="-mx-2 divide-y divide-neutro-100">{data.pendientes_atencion.map(item => <li key={item.id}>
              <Link to={'/admin/reservas/' + item.id} className="flex min-h-12 items-center justify-between gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-bronce-50">
                <span className="min-w-0"><span className="font-semibold text-neutro-900">#{item.id} · {text.room} {item.habitacion_numero}</span>
                  <span className="mt-0.5 block truncate text-xs text-neutro-600">{text.arrival} {date(item.fecha)} · {item.sucursal_nombre}</span></span>
                <ChevronRight className="size-4 shrink-0 text-neutro-400" aria-hidden="true" />
              </Link>
            </li>)}</ul>}
        </ChartPanel>
      </div>

      <section aria-labelledby="actividad-titulo" className="rounded-xl border border-neutro-200 bg-white p-4 sm:p-5">
        <h2 id="actividad-titulo" className="mb-3 font-sans text-sm font-semibold text-neutro-900">{text.activity}</h2>
        <Tabs label={text.activity} value={tab} onChange={setTab} items={[
          { id: 'arrivals', label: text.kpiArrivals, content: table(data.llegadas, text.noArrivals) },
          { id: 'departures', label: text.kpiDepartures, content: table(data.salidas, text.noDepartures) },
          { id: 'recent', label: text.recent, content: table(data.reservas_recientes, text.noRecent) },
        ]} />
      </section>
    </div>}
  </div>;
}
