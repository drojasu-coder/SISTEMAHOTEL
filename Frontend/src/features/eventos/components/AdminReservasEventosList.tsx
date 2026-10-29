import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { formatAdminCalendarDate, formatAdminTimeOfDay } from '@/features/admin-core/adminDates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { getApiErrorMessage } from '@/api/errors';
import { useLocale } from '@/i18n/LocaleContext';
import { cn } from '@/lib/cn';
import { useAdminReservasEventosQuery, useSalonesQuery } from '../hooks/useEventos';
import { EVENTOS_ROUTES } from '../constants/routes';
import { formatearGTQ } from '../textos';
import { useTextosGestionEventos } from '../gestionTextos';
import { AdminReservaEventoEstadoModal } from './AdminReservaEventoEstadoModal';
import { EventosAdminNav } from './EventosAdminNav';
import type { ReservaEvento } from '../types';

const VISTAS = ['hoy', 'proximos', 'historial'] as const;
type Vista = typeof VISTAS[number];
const ESTADOS = ['cotizacion', 'confirmada', 'finalizada', 'cancelada', 'expirada'] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[1-9]\d*$/;
/** Estados finales: el servidor no admite cambiarlos (EVENT_RESERVATION_FINAL_STATE). */
const FINALES = new Set(['cancelada', 'expirada']);

/**
 * Reservas de eventos: hoy, próximos e historial, filtrables por la sede global,
 * salón, fecha y estado (en la URL). Los estados son los del backend; el cambio
 * de estado usa el diálogo existente y el servidor valida cada transición.
 */
export const AdminReservasEventosList: React.FC = () => {
  const t = useTextosGestionEventos();
  const { locale } = useLocale();
  const { selectedSedeId } = useAdminScope();
  const reservasQuery = useAdminReservasEventosQuery();
  const salonesQuery = useSalonesQuery();
  const [reservaParaCambio, setReservaParaCambio] = useState<ReservaEvento | null>(null);
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const salonesMap = useMemo(() => new Map((salonesQuery.data ?? []).map((s) => [s.id, s])), [salonesQuery.data]);
  const sedeDe = (r: ReservaEvento) => r.Salon?.sucursal_id ?? salonesMap.get(r.salon_id)?.sucursal_id ?? null;
  const reservas = useMemo(() => (reservasQuery.data ?? []).filter((r) => selectedSedeId === 'all' || sedeDe(r) === selectedSedeId), [reservasQuery.data, selectedSedeId, salonesMap]);
  const salones = (salonesQuery.data ?? []).filter((s) => selectedSedeId === 'all' || s.sucursal_id === selectedSedeId);

  const vista: Vista = (VISTAS as readonly string[]).includes(params.get('vista') ?? '') ? params.get('vista') as Vista : 'hoy';
  const q = params.get('q') ?? '';
  const fecha = ISO_DATE.test(params.get('fecha') ?? '') ? params.get('fecha')! : '';
  const estado = (ESTADOS as readonly string[]).includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const salonFiltro = ID.test(params.get('salon') ?? '') ? Number(params.get('salon')) : null;

  const today = getTodayInGuatemala();
  const porVista = useMemo(() => {
    const key = (r: ReservaEvento) => `${r.fecha} ${r.hora_inicio}`;
    const asc = (a: ReservaEvento, b: ReservaEvento) => key(a).localeCompare(key(b)) || a.id - b.id;
    return {
      hoy: reservas.filter((r) => r.fecha === today).sort(asc),
      proximos: reservas.filter((r) => (r.estado === 'confirmada' || r.estado === 'cotizacion') && r.fecha > today).sort(asc),
      historial: reservas.filter((r) => r.fecha < today).sort((a, b) => asc(b, a)),
    } satisfies Record<Vista, ReservaEvento[]>;
  }, [reservas, today]);

  const term = q.trim().toLowerCase().replace(/^#/, '');
  const filtradas = porVista[vista].filter((r) =>
    (!term || [String(r.id), r.Usuario?.nombre, r.Usuario?.email, r.Salon?.nombre ?? salonesMap.get(r.salon_id)?.nombre].some((v) => v?.toLowerCase().includes(term))) &&
    (!fecha || r.fecha === fecha) && (!estado || r.estado === estado) && (salonFiltro === null || r.salon_id === salonFiltro));
  const hasFilters = Boolean(q || fecha || estado || salonFiltro);
  const salonNombre = salonFiltro !== null ? salonesMap.get(salonFiltro)?.nombre ?? `#${salonFiltro}` : '';
  const date = (v: string) => formatAdminCalendarDate(v, locale);
  const time = (v?: string | null) => v ? formatAdminTimeOfDay(v, locale) : '';
  const estadoLabel = (e: string) => t.estados[e as keyof typeof t.estados] ?? e;
  const estadoClase = (e: string) => e === 'confirmada' ? 'border-exito-600/20 bg-exito-50 text-exito-700' : e === 'cotizacion' ? 'border-advertencia-600/20 bg-advertencia-50 text-advertencia-700' : e === 'finalizada' ? 'border-info-600/20 bg-info-50 text-info-700' : 'border-neutro-300 bg-neutro-100 text-neutro-600';
  const tipo = (v: string) => t.tipos[v as keyof typeof t.tipos] ?? v;
  const salonDe = (r: ReservaEvento) => r.Salon?.nombre ?? salonesMap.get(r.salon_id)?.nombre ?? `#${r.salon_id}`;
  const accion = (r: ReservaEvento) => FINALES.has(r.estado) ? null : <Button type="button" variant="ghost" size="sm" aria-label={t.cambiarEstadoDe(r.id)} onClick={() => setReservaParaCambio(r)}><RefreshCw className="size-4" aria-hidden="true" /><span className="hidden 2xl:inline">{t.cambiarEstado}</span></Button>;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header>
        <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.reservas}</h1>
        {reservasQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.reservasResumen(reservas.length)} · {t.hoy} {date(today)}</p>}
      </header>
      <EventosAdminNav />

      {reservasQuery.isPending && <LoadingNotice label={t.cargando} />}
      {reservasQuery.isError && <Alert tone="error" title={t.errorReservas}><p>{getApiErrorMessage(reservasQuery.error)}</p><Button className="mt-2" variant="secondary" onClick={() => void reservasQuery.refetch()}>{t.reintentar}</Button></Alert>}

      {reservasQuery.isSuccess && <>
        <div role="group" aria-label={t.vistasLabel} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
          {VISTAS.map((key) => <button key={key} type="button" aria-pressed={vista === key} onClick={() => update({ vista: key === 'hoy' ? null : key })}
            className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors', vista === key ? 'bg-bronce-50 text-bronce-800' : 'text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900')}>
            {t.vistas[key]}<span className={cn('rounded-full px-1.5 text-xs tabular-nums', vista === key ? 'bg-bronce-600 text-white' : 'bg-neutro-100 text-neutro-700')}>{porVista[key].length}</span>
          </button>)}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <label className="relative min-w-0 sm:col-span-2 xl:col-span-1"><span className="sr-only">{t.buscarReserva}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscarReserva} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.salon}</span>
            <select value={salonFiltro ?? ''} onChange={(event) => update({ salon: event.target.value || null })} className="field-control">
              <option value="">{t.todosSalones}</option>
              {salones.map((s) => <option key={s.id} value={s.id} lang="es">{s.nombre}</option>)}
            </select></label>
          {vista !== 'hoy' && <label className="min-w-0"><span className="sr-only">{t.fecha}</span>
            <input type="date" value={fecha} aria-label={t.fecha} onChange={(event) => update({ fecha: event.target.value || null })} className="field-control" /></label>}
          <label className="min-w-0"><span className="sr-only">{t.estado}</span>
            <select value={estado} onChange={(event) => update({ estado: event.target.value || null })} className="field-control">
              <option value="">{t.todosEstados}</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{estadoLabel(e)}</option>)}
            </select></label>
        </div>
        {hasFilters && <div className="flex flex-wrap items-center gap-2">
          {salonFiltro !== null && <button type="button" onClick={() => update({ salon: null })} aria-label={t.quitarSalon} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bronce-200 bg-bronce-50 px-3 text-xs font-medium text-bronce-800 hover:border-bronce-400"><span lang="es">{t.filtroSalon(salonNombre)}</span><X className="size-3.5" aria-hidden="true" /></button>}
          <Button variant="text" size="sm" onClick={() => update({ q: null, fecha: null, estado: null, salon: null })}>{t.limpiar}</Button>
        </div>}

        {filtradas.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{hasFilters ? t.vacioR.filtros : t.vacioR[vista]}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t.vistas[vista]}</caption>
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-3 py-3">{t.colR.reserva}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.fechaHora}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.evento}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.cliente}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.invitados}</th>
                  <th scope="col" className="px-3 py-3 text-right">{t.colR.total}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.estado}</th>
                  <th scope="col" className="px-3 py-3 text-right"><span className="sr-only">{t.colR.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtradas.map((r) => <tr key={r.id} className="hover:bg-bronce-50/40">
                  <td className="whitespace-nowrap px-3 py-2.5"><Link to={EVENTOS_ROUTES.ADMIN_RESERVA_DETALLE(r.id)} aria-label={t.verReserva(r.id)} className="inline-flex min-h-9 items-center gap-1 font-semibold text-bronce-700 hover:underline">#{r.id}<ChevronRight className="size-3.5" aria-hidden="true" /></Link></td>
                  <td className="whitespace-nowrap px-3 py-2.5"><span className={cn('font-medium', r.fecha === today ? 'text-bronce-800' : 'text-neutro-900')}>{date(r.fecha)}</span><span className="block text-xs text-neutro-600">{time(r.hora_inicio)}{r.hora_fin && ` – ${time(r.hora_fin)}`}</span></td>
                  <td className="px-3 py-2.5"><span className="block font-medium text-neutro-900">{tipo(r.tipo_evento)}</span><span className="block text-xs text-neutro-500" lang="es">{salonDe(r)}</span></td>
                  <td className="px-3 py-2.5"><span className="block text-neutro-900">{r.Usuario?.nombre ?? '—'}</span><span className="hidden max-w-[14rem] truncate text-xs text-neutro-500 2xl:block">{r.Usuario?.email}</span></td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{r.numero_invitados}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums"><span className="block">{formatearGTQ(r.total)}</span><span className="block text-xs text-neutro-500">{t.anticipo(formatearGTQ(r.anticipo))}</span></td>
                  <td className="px-3 py-2.5"><span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', estadoClase(r.estado))}>{estadoLabel(r.estado)}</span></td>
                  <td className="px-3 py-1.5 text-right">{accion(r)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
            {filtradas.map((r) => <li key={r.id} className="flex flex-col gap-2 px-4 py-3">
              <Link to={EVENTOS_ROUTES.ADMIN_RESERVA_DETALLE(r.id)} aria-label={t.verReserva(r.id)} className="flex items-start justify-between gap-3">
                <span className="min-w-0 space-y-0.5">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900">#{r.id}</span><span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold', estadoClase(r.estado))}>{estadoLabel(r.estado)}</span></span>
                  <span className="block text-sm text-neutro-800">{date(r.fecha)} · {time(r.hora_inicio)}{r.hora_fin && ` – ${time(r.hora_fin)}`}</span>
                  <span className="block truncate text-xs text-neutro-600">{tipo(r.tipo_evento)} · <span lang="es">{salonDe(r)}</span></span>
                  <span className="block truncate text-xs text-neutro-600">{r.Usuario?.nombre ?? '—'} · {r.numero_invitados} · {formatearGTQ(r.total)}</span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
              </Link>
              {accion(r) && <div className="-ml-2">{accion(r)}</div>}
            </li>)}
          </ul>
        </>}
      </>}

      {reservaParaCambio && <AdminReservaEventoEstadoModal reserva={reservaParaCambio} isOpen onClose={() => setReservaParaCambio(null)} />}
    </div>
  );
};
