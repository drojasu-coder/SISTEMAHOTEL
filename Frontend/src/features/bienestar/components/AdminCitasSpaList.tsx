import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { formatAdminCalendarDate, formatAdminTimeOfDay } from '@/features/admin-core/adminDates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { usePublicTexts } from '@/i18n/public';
import { useLocale } from '@/i18n/LocaleContext';
import { cn } from '@/lib/cn';
import { useAdminCitasSpaQuery, useTerapeutasQuery } from '../hooks/useBienestar';
import { useServiciosAdminQuery } from './AdminServiciosSpaList';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { useTextosGestionBienestar } from '../gestionTextos';
import { AdminCitaEstadoModal } from './AdminCitaEstadoModal';
import { BienestarAdminNav } from './BienestarAdminNav';
import type { CitaBienestar } from '../types';

const VISTAS = ['hoy', 'proximas', 'historial'] as const;
type Vista = typeof VISTAS[number];
const ESTADOS = ['confirmada', 'completada', 'cancelada'] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[1-9]\d*$/;

/**
 * Citas de bienestar: hoy, próximas e historial, con filtros por la sede global,
 * servicio, terapeuta, fecha y estado (en la URL). El cambio de estado usa el
 * diálogo existente; la disponibilidad la valida siempre el servidor.
 */
export const AdminCitasSpaList: React.FC = () => {
  const t = useTextosGestionBienestar();
  const textosBienestar = usePublicTexts('bienestar');
  const { locale } = useLocale();
  const { selectedSedeId } = useAdminScope();
  const citasQuery = useAdminCitasSpaQuery();
  const terapeutasQuery = useTerapeutasQuery();
  // Incluye servicios inactivos: una cita anterior puede ser de un servicio ya retirado.
  const serviciosQuery = useServiciosAdminQuery();
  const sedesQuery = useSedesQuery();
  const [citaParaCambio, setCitaParaCambio] = useState<CitaBienestar | null>(null);
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const sedesMap = useMemo(() => new Map((sedesQuery.data ?? []).map((sede) => [sede.id, sede.nombre])), [sedesQuery.data]);
  // Sede de la cita: la del servicio o, en servicios generales, la del terapeuta.
  const sedeDe = (c: CitaBienestar) => c.ServicioBienestar?.sucursal_id ?? c.Terapeuta?.sucursal_id ?? null;
  const citas = useMemo(() => (citasQuery.data ?? []).filter((c) => selectedSedeId === 'all' || sedeDe(c) === selectedSedeId), [citasQuery.data, selectedSedeId]);
  const terapeutas = (terapeutasQuery.data ?? []).filter((x) => selectedSedeId === 'all' || x.sucursal_id === selectedSedeId);
  const servicios = (serviciosQuery.data ?? []).filter((s) => selectedSedeId === 'all' || s.sucursal_id == null || s.sucursal_id === selectedSedeId);

  const vista: Vista = (VISTAS as readonly string[]).includes(params.get('vista') ?? '') ? params.get('vista') as Vista : 'hoy';
  const q = params.get('q') ?? '';
  const fecha = ISO_DATE.test(params.get('fecha') ?? '') ? params.get('fecha')! : '';
  const estado = (ESTADOS as readonly string[]).includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const servicio = ID.test(params.get('servicio') ?? '') ? Number(params.get('servicio')) : null;
  const terapeuta = ID.test(params.get('terapeuta') ?? '') ? Number(params.get('terapeuta')) : null;

  const today = getTodayInGuatemala();
  const porVista = useMemo(() => {
    const key = (c: CitaBienestar) => `${c.fecha} ${c.hora_inicio}`;
    const asc = (a: CitaBienestar, b: CitaBienestar) => key(a).localeCompare(key(b)) || (a.id ?? 0) - (b.id ?? 0);
    return {
      hoy: citas.filter((c) => c.fecha === today).sort(asc),
      proximas: citas.filter((c) => c.estado === 'confirmada' && (c.fecha ?? '') > today).sort(asc),
      historial: citas.filter((c) => (c.fecha ?? '') < today).sort((a, b) => asc(b, a)),
    } satisfies Record<Vista, CitaBienestar[]>;
  }, [citas, today]);

  const term = q.trim().toLowerCase().replace(/^#/, '');
  const filtradas = porVista[vista].filter((c) =>
    (!term || [String(c.id), c.Usuario?.nombre, c.Usuario?.email].some((v) => v?.toLowerCase().includes(term))) &&
    (!fecha || c.fecha === fecha) && (!estado || c.estado === estado) &&
    (servicio === null || c.servicio_bienestar_id === servicio) && (terapeuta === null || c.terapeuta_id === terapeuta));
  const hasFilters = Boolean(q || fecha || estado || servicio || terapeuta);
  const date = (v?: string | null) => v ? formatAdminCalendarDate(v, locale) : '—';
  const time = (v?: string | null) => v ? formatAdminTimeOfDay(v, locale) : '';
  const estadoLabel = (e?: string | null) => (e && textosBienestar.estados[e as keyof typeof textosBienestar.estados]) || e || '—';
  const estadoClase = (e?: string | null) => e === 'confirmada' ? 'border-exito-600/20 bg-exito-50 text-exito-700' : e === 'completada' ? 'border-info-600/20 bg-info-50 text-info-700' : 'border-neutro-300 bg-neutro-100 text-neutro-600';
  const sede = (c: CitaBienestar) => { const id = sedeDe(c); return id == null ? t.general : sedesMap.get(id) ?? `#${id}`; };
  const accion = (c: CitaBienestar) => <Button type="button" variant="ghost" size="sm" aria-label={t.cambiarEstadoDe(c.id ?? 0)} onClick={() => setCitaParaCambio(c)}><RefreshCw className="size-4" aria-hidden="true" /><span className="hidden 2xl:inline">{t.cambiarEstado}</span></Button>;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header>
        <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.citas}</h1>
        {citasQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.citasResumen(citas.length)} · {t.hoy} {date(today)}</p>}
      </header>
      <BienestarAdminNav />

      {citasQuery.isPending && <LoadingNotice label={t.cargando} />}
      {citasQuery.isError && <Alert tone="error" title={t.errorCitas}><Button className="mt-2" variant="secondary" onClick={() => void citasQuery.refetch()}>{t.reintentar}</Button></Alert>}

      {citasQuery.isSuccess && <>
        <div role="group" aria-label={t.vistasLabel} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
          {VISTAS.map((key) => <button key={key} type="button" aria-pressed={vista === key} onClick={() => update({ vista: key === 'hoy' ? null : key })}
            className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors', vista === key ? 'bg-bronce-50 text-bronce-800' : 'text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900')}>
            {t.vistas[key]}<span className={cn('rounded-full px-1.5 text-xs tabular-nums', vista === key ? 'bg-bronce-600 text-white' : 'bg-neutro-100 text-neutro-700')}>{porVista[key].length}</span>
          </button>)}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <label className="relative min-w-0 sm:col-span-2 xl:col-span-1"><span className="sr-only">{t.buscarCita}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscarCita} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.servicio}</span>
            <select value={servicio ?? ''} onChange={(event) => update({ servicio: event.target.value || null })} className="field-control">
              <option value="">{t.todosServicios}</option>
              {servicios.map((s) => <option key={s.id} value={s.id} lang="es">{s.nombre}</option>)}
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.terapeuta}</span>
            <select value={terapeuta ?? ''} onChange={(event) => update({ terapeuta: event.target.value || null })} className="field-control">
              <option value="">{t.todosTerapeutas}</option>
              {terapeutas.map((x) => <option key={x.id} value={x.id} lang="es">{x.nombre}</option>)}
            </select></label>
          {vista !== 'hoy' && <label className="min-w-0"><span className="sr-only">{t.fecha}</span>
            <input type="date" value={fecha} aria-label={t.fecha} onChange={(event) => update({ fecha: event.target.value || null })} className="field-control" /></label>}
          <label className="min-w-0"><span className="sr-only">{t.estado}</span>
            <select value={estado} onChange={(event) => update({ estado: event.target.value || null })} className="field-control">
              <option value="">{t.todosEstados}</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{estadoLabel(e)}</option>)}
            </select></label>
        </div>
        {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, fecha: null, estado: null, servicio: null, terapeuta: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}

        {filtradas.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{hasFilters ? t.vacioC.filtros : t.vacioC[vista]}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t.vistas[vista]}</caption>
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-3 py-3">{t.colC.cita}</th>
                  <th scope="col" className="px-3 py-3">{t.colC.fechaHora}</th>
                  <th scope="col" className="px-3 py-3">{t.colC.servicio}</th>
                  <th scope="col" className="px-3 py-3">{t.colC.cliente}</th>
                  <th scope="col" className="px-3 py-3">{t.colC.terapeuta}</th>
                  <th scope="col" className="px-3 py-3">{t.colC.estado}</th>
                  <th scope="col" className="px-3 py-3 text-right"><span className="sr-only">{t.colC.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtradas.map((c) => <tr key={c.id} className="hover:bg-bronce-50/40">
                  <td className="whitespace-nowrap px-3 py-2.5"><Link to={BIENESTAR_ROUTES.ADMIN_CITA_DETALLE(c.id ?? '')} aria-label={t.verCita(c.id ?? 0)} className="inline-flex min-h-9 items-center gap-1 font-semibold text-bronce-700 hover:underline">#{c.id}<ChevronRight className="size-3.5" aria-hidden="true" /></Link></td>
                  <td className="whitespace-nowrap px-3 py-2.5"><span className={cn('font-medium', c.fecha === today ? 'text-bronce-800' : 'text-neutro-900')}>{date(c.fecha)}</span><span className="block text-xs text-neutro-600">{time(c.hora_inicio)}{c.hora_fin && ` – ${time(c.hora_fin)}`}</span></td>
                  <td className="px-3 py-2.5"><span className="block font-medium text-neutro-900" lang="es">{c.ServicioBienestar?.nombre ?? '—'}</span><span className="block text-xs text-neutro-500" lang="es">{sede(c)}{c.ServicioBienestar?.duracion_minutos ? ` · ${t.minutos(c.ServicioBienestar.duracion_minutos)}` : ''}</span></td>
                  <td className="px-3 py-2.5"><span className="block text-neutro-900">{c.Usuario?.nombre ?? '—'}</span><span className="hidden max-w-[14rem] truncate text-xs text-neutro-500 2xl:block">{c.Usuario?.email}</span></td>
                  <td className="px-3 py-2.5 text-neutro-700" lang="es">{c.Terapeuta?.nombre ?? '—'}</td>
                  <td className="px-3 py-2.5"><span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', estadoClase(c.estado))}>{estadoLabel(c.estado)}</span></td>
                  <td className="px-3 py-1.5 text-right">{accion(c)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
            {filtradas.map((c) => <li key={c.id} className="flex flex-col gap-2 px-4 py-3">
              <Link to={BIENESTAR_ROUTES.ADMIN_CITA_DETALLE(c.id ?? '')} aria-label={t.verCita(c.id ?? 0)} className="flex items-start justify-between gap-3">
                <span className="min-w-0 space-y-0.5">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900">#{c.id}</span><span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold', estadoClase(c.estado))}>{estadoLabel(c.estado)}</span></span>
                  <span className="block text-sm text-neutro-800">{date(c.fecha)} · {time(c.hora_inicio)}{c.hora_fin && ` – ${time(c.hora_fin)}`}</span>
                  <span className="block truncate text-xs text-neutro-600" lang="es">{c.ServicioBienestar?.nombre ?? '—'} · {sede(c)}</span>
                  <span className="block truncate text-xs text-neutro-600">{c.Usuario?.nombre ?? '—'} · {c.Terapeuta?.nombre ?? '—'}</span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
              </Link>
              <div className="-ml-2">{accion(c)}</div>
            </li>)}
          </ul>
        </>}
      </>}

      {citaParaCambio && <AdminCitaEstadoModal cita={citaParaCambio} onClose={() => setCitaParaCambio(null)} onSuccess={() => void citasQuery.refetch()} />}
    </div>
  );
};
