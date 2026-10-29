import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronRight as Go, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { formatAdminCalendarDate } from '@/features/admin-core/adminDates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { useAdminReservasQuery } from '@/features/reservas/admin/hooks/useAdminReservas';
import { useTextosAdminReservas } from '@/features/reservas/admin/textos';
import { useTextosRecepcion } from '@/features/reservas/admin/recepcionTextos';
import { ESTADOS_RESERVA_HABITACION, titularReserva, type ReservaHabitacion } from '@/features/reservas/types';
import { ReservaEstadoBadge } from '@/features/mis-reservas/components/ReservaEstadoBadge';
import { calcularNoches, formatGTQ, resolverNombreSede } from '@/features/mis-reservas/formato';
import { useLocale } from '@/i18n/LocaleContext';
import { cn } from '@/lib/cn';

const VISTAS = ['llegadas', 'salidas', 'pendientes', 'proximas', 'todas'] as const;
type Vista = typeof VISTAS[number];
const PAGE_SIZE = 20;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Vista de recepción: las listas de trabajo del día primero y el registro completo
 * después. "Llegan/Salen hoy" usan el mismo criterio que el resumen del panel
 * (reservas confirmadas). Filtros y vista viven en la URL para conservarse al
 * volver desde el detalle.
 */
export const AdminReservasPage: React.FC = () => {
  const t = useTextosRecepcion();
  const tr = useTextosAdminReservas();
  const { locale } = useLocale();
  const { selectedSedeId } = useAdminScope();
  const reservasQuery = useAdminReservasQuery(selectedSedeId);
  const sedesQuery = useSedesQuery();
  const [params, setParams] = useSearchParams();

  const vista: Vista = (VISTAS as readonly string[]).includes(params.get('vista') ?? '') ? params.get('vista') as Vista : 'llegadas';
  const q = params.get('q') ?? '';
  const estado = (ESTADOS_RESERVA_HABITACION as readonly string[]).includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const desde = ISO_DATE.test(params.get('desde') ?? '') ? params.get('desde')! : '';
  const hasta = ISO_DATE.test(params.get('hasta') ?? '') ? params.get('hasta')! : '';
  const rawPage = Number(params.get('pagina'));
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    if (!('pagina' in changes)) next.delete('pagina');
    setParams(next, { replace: true });
  };

  const today = getTodayInGuatemala();
  const reservas = reservasQuery.data ?? [];
  const sedesMap = useMemo(() => new Map((sedesQuery.data ?? []).map((sede) => [sede.id, sede.nombre])), [sedesQuery.data]);

  const enVista = useMemo(() => {
    const byArrival = (a: ReservaHabitacion, b: ReservaHabitacion) => a.fecha_entrada.localeCompare(b.fecha_entrada) || a.id - b.id;
    const groups: Record<Vista, ReservaHabitacion[]> = {
      llegadas: reservas.filter((r) => r.estado === 'confirmada' && r.fecha_entrada === today).sort(byArrival),
      salidas: reservas.filter((r) => r.estado === 'confirmada' && r.fecha_salida === today).sort(byArrival),
      pendientes: reservas.filter((r) => r.estado === 'pendiente').sort(byArrival),
      proximas: reservas.filter((r) => (r.estado === 'confirmada' || r.estado === 'pendiente') && r.fecha_entrada > today).sort(byArrival),
      todas: [...reservas].sort((a, b) => b.id - a.id),
    };
    return groups;
  }, [reservas, today]);

  const term = q.trim().toLowerCase();
  const filtered = enVista[vista].filter((r) => {
    const titular = titularReserva(r);
    if (term && ![String(r.id), titular?.nombre, titular?.email ?? undefined, titular?.telefono ?? undefined, r.Habitacion?.numero].some((value) => value?.toLowerCase().includes(term))) return false;
    if (vista === 'todas' && estado && r.estado !== estado) return false;
    if (desde && r.fecha_entrada < desde) return false;
    if (hasta && r.fecha_entrada > hasta) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 ? Math.min(rawPage, totalPages) : 1;
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = Boolean(q || estado || desde || hasta);
  const showSite = selectedSedeId === 'all';
  const date = (value: string) => formatAdminCalendarDate(value, locale);

  return <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.titulo}</h1>
        {reservasQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.resumen(reservas.length)} · {t.hoy} {date(today)}</p>}
      </div>
      <Link to="/admin/reservas/nueva" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-bronce-700 px-4 text-sm font-semibold text-white hover:bg-bronce-800"><Plus className="size-4" aria-hidden="true" />{locale === 'en' ? 'New reservation' : 'Nueva reserva'}</Link>
    </header>

    {reservasQuery.isLoading && <LoadingNotice label={tr.listado.cargando} />}
    {reservasQuery.isError && <Alert tone="error" title={tr.listado.errorTitulo}>
      <p>{getApiErrorMessage(reservasQuery.error)}</p>
      <Button className="mt-3" variant="secondary" onClick={() => void reservasQuery.refetch()}>{tr.listado.reintentar}</Button>
    </Alert>}

    {reservasQuery.isSuccess && <>
      {/* Listas de trabajo del día con su conteo. */}
      <div role="group" aria-label={t.vistasLabel} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
        {VISTAS.map((key) => <button key={key} type="button" aria-pressed={vista === key} onClick={() => update({ vista: key === 'llegadas' ? null : key, estado: null })}
          className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
            vista === key ? 'bg-bronce-50 text-bronce-800' : 'text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900')}>
          {t.vistas[key]}
          <span className={cn('rounded-full px-1.5 text-xs tabular-nums', vista === key ? 'bg-bronce-600 text-white' : 'bg-neutro-100 text-neutro-700')}>{enVista[key].length}</span>
        </button>)}
      </div>

      {/* Filtros del módulo; la sede se elige en la barra superior. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <label className="relative min-w-0 sm:col-span-2 lg:col-span-1">
          <span className="sr-only">{t.buscar}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
          <input type="search" value={q} placeholder={t.buscar} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" />
        </label>
        {vista === 'todas' && <label className="min-w-0">
          <span className="sr-only">{t.estado}</span>
          <select value={estado} onChange={(event) => update({ estado: event.target.value || null })} className="field-control">
            <option value="">{t.todosEstados}</option>
            {ESTADOS_RESERVA_HABITACION.map((value) => <option key={value} value={value}>{tr.estados[value]}</option>)}
          </select>
        </label>}
        {vista !== 'llegadas' && vista !== 'salidas' && <>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-neutro-600">{t.llegadaDesde}
            <input type="date" value={desde} max={hasta || undefined} onChange={(event) => update({ desde: event.target.value || null })} className="field-control" /></label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-neutro-600">{t.llegadaHasta}
            <input type="date" value={hasta} min={desde || undefined} onChange={(event) => update({ hasta: event.target.value || null })} className="field-control" /></label>
        </>}
      </div>
      {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, estado: null, desde: null, hasta: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}

      {filtered.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">
        {hasFilters ? t.vacio.filtros : t.vacio[vista]}
      </p> : <>
        {/* Escritorio: tabla compacta. */}
        <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t.vistas[vista]}</caption>
            <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
              <tr>
                <th scope="col" className="px-4 py-3">{t.col.reserva}</th>
                <th scope="col" className="px-4 py-3">{t.col.huesped}</th>
                <th scope="col" className="px-4 py-3">{t.col.habitacion}</th>
                {showSite && <th scope="col" className="px-4 py-3">{t.col.sede}</th>}
                <th scope="col" className="px-4 py-3">{t.col.estancia}</th>
                <th scope="col" className="px-4 py-3 text-right">{t.col.importe}</th>
                <th scope="col" className="px-4 py-3">{t.col.estado}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-100">
              {visible.map((r) => <tr key={r.id} className="hover:bg-bronce-50/40">
                <td className="whitespace-nowrap px-4 py-3"><Link to={`/admin/reservas/${r.id}`} aria-label={t.verReserva(r.id)} className="inline-flex min-h-9 items-center gap-1 font-semibold text-bronce-700 underline-offset-2 hover:underline">#{r.id}<Go className="size-3.5" aria-hidden="true" /></Link></td>
                <td className="px-4 py-3"><span className="block font-medium text-neutro-900">{titularReserva(r)?.nombre ?? t.sinHuesped}</span>
                  {titularReserva(r)?.email && <span className="hidden max-w-[14rem] truncate text-xs text-neutro-500 2xl:block">{titularReserva(r)!.email}</span>}</td>
                <td className="px-4 py-3"><span className="block font-medium text-neutro-900">{r.Habitacion ? t.hab(r.Habitacion.numero) : t.sinHabitacion}</span>
                  {r.Habitacion?.TipoHabitacion?.nombre && <span className="block text-xs text-neutro-500">{r.Habitacion.TipoHabitacion.nombre} · {t.noches(calcularNoches(r.fecha_entrada, r.fecha_salida) ?? 0)}</span>}</td>
                {showSite && <td className="px-4 py-3 text-neutro-700">{resolverNombreSede(r, sedesMap)}</td>}
                <td className="whitespace-nowrap px-4 py-3 text-neutro-700"><span className={cn(r.fecha_entrada === today && 'font-semibold text-bronce-800')}>{date(r.fecha_entrada)}</span>
                  <span className="text-neutro-400"> → </span><span className={cn(r.fecha_salida === today && 'font-semibold text-bronce-800')}>{date(r.fecha_salida)}</span>
                  <span className="block text-xs text-neutro-500">{tr.detalle.valores.formatoHuespedes(r.numero_huespedes)}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutro-800">{formatGTQ(r.total)}</td>
                <td className="px-4 py-3"><ReservaEstadoBadge estado={r.estado} /></td>

              </tr>)}
            </tbody>
          </table>
        </div>

        {/* Móvil: lista compacta, una reserva por fila. */}
        <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
          {visible.map((r) => <li key={r.id}>
            <Link to={`/admin/reservas/${r.id}`} aria-label={t.verReserva(r.id)} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-bronce-50/40">
              <span className="min-w-0 space-y-0.5">
                <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900">#{r.id}</span><ReservaEstadoBadge estado={r.estado} /></span>
                <span className="block truncate text-sm text-neutro-800">{titularReserva(r)?.nombre ?? t.sinHuesped}</span>
                <span className="block text-xs text-neutro-600">{r.Habitacion ? t.hab(r.Habitacion.numero) : t.sinHabitacion}{showSite && ` · ${resolverNombreSede(r, sedesMap)}`}</span>
                <span className="block text-xs text-neutro-600">{date(r.fecha_entrada)} → {date(r.fecha_salida)} · {formatGTQ(r.total)}</span>
              </span>
              <Go className="mt-1 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
            </Link>
          </li>)}
        </ul>

        {totalPages > 1 && <nav className="flex items-center justify-between gap-3 text-xs text-neutro-600" aria-label={tr.paginacion.pagina(page, totalPages)}>
          <span>{t.pagina((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, filtered.length), filtered.length)}</span>
          <span className="flex items-center gap-1">
            <Button variant="ghost" size="sm" aria-label={t.anterior} disabled={page <= 1} onClick={() => update({ pagina: page - 1 > 1 ? String(page - 1) : null })}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
            <span className="px-1 font-medium text-neutro-900">{tr.paginacion.pagina(page, totalPages)}</span>
            <Button variant="ghost" size="sm" aria-label={t.siguiente} disabled={page >= totalPages} onClick={() => update({ pagina: String(page + 1) })}><ChevronRight className="size-4" aria-hidden="true" /></Button>
          </span>
        </nav>}
      </>}
    </>}
  </div>;
};
