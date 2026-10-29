import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Package, RefreshCw, Search, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { formatAdminCalendarDate, formatAdminTimeOfDay } from '@/features/admin-core/adminDates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { usePublicTexts } from '@/i18n/public';
import { useLocale } from '@/i18n/LocaleContext';
import { cn } from '@/lib/cn';
import { ACTIVIDADES_ROUTES } from '../constants/routes';
import { formatearGTQ } from '../textos';
import { useInstructoresQuery, useRecursosActividadQuery } from '../hooks/useActividades';
import { useAdminReservasActividadQuery, useUpdateEstadoReservaActividadMutation } from '../hooks/useReservasActividad';
import { useTextosGestionActividades } from '../gestionTextos';
import { ActividadesAdminNav } from './ActividadesAdminNav';
import type { ReservaActividad } from '../types';

const VISTAS = ['hoy', 'proximas', 'todas'] as const;
type Vista = typeof VISTAS[number];
const ESTADOS = ['confirmada', 'completada', 'cancelada'] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reservas de actividades: hoy, próximas y registro completo, filtrables por la
 * sede global, recurso, instructor, fecha y estado (en la URL). Las transiciones
 * (completar, cancelar, reactivar) son las existentes y se confirman en un diálogo.
 */
export const AdminReservasActividadesList: React.FC = () => {
  const textosActividades = usePublicTexts('actividades');
  const t = useTextosGestionActividades();
  const { locale } = useLocale();
  const { selectedSedeId } = useAdminScope();
  const recursosQuery = useRecursosActividadQuery();
  const instructoresQuery = useInstructoresQuery();
  const reservasQuery = useAdminReservasActividadQuery();
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const [modalAction, setModalAction] = useState<{ reserva: ReservaActividad; nuevoEstado: 'confirmada' | 'cancelada' | 'completada' } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const updateMutation = useUpdateEstadoReservaActividadMutation(modalAction?.reserva.id || 0);

  // La sede la decide el selector global: se aplica por la sede del recurso reservado.
  const recursos = useMemo(() => (recursosQuery.data ?? []).filter((r) => selectedSedeId === 'all' || r.sucursal_id === selectedSedeId), [recursosQuery.data, selectedSedeId]);
  const recursoIds = new Set(recursos.map((r) => r.id));
  const reservas = useMemo(() => (reservasQuery.data ?? []).filter((r) => selectedSedeId === 'all' || r.RecursoActividad?.sucursal_id === selectedSedeId || recursoIds.has(r.recurso_id)), [reservasQuery.data, selectedSedeId, recursos]);
  const instructores = instructoresQuery.data ?? [];

  const vista: Vista = (VISTAS as readonly string[]).includes(params.get('vista') ?? '') ? params.get('vista') as Vista : 'hoy';
  const q = params.get('q') ?? '';
  const fecha = ISO_DATE.test(params.get('fecha') ?? '') ? params.get('fecha')! : '';
  const estadoFiltro = (ESTADOS as readonly string[]).includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const recursoFiltro = /^[1-9]\d*$/.test(params.get('recurso') ?? '') ? Number(params.get('recurso')) : null;
  const instructorParam = params.get('instructor') ?? '';
  const instructorFiltro = instructorParam === 'ninguno' || /^[1-9]\d*$/.test(instructorParam) ? instructorParam : '';

  const today = getTodayInGuatemala();
  const porVista = useMemo(() => {
    const key = (r: ReservaActividad) => `${r.fecha} ${r.hora_inicio}`;
    const asc = (a: ReservaActividad, b: ReservaActividad) => key(a).localeCompare(key(b)) || (a.id ?? 0) - (b.id ?? 0);
    return {
      hoy: reservas.filter((r) => r.fecha === today).sort(asc),
      proximas: reservas.filter((r) => r.estado === 'confirmada' && (r.fecha ?? '') > today).sort(asc),
      todas: [...reservas].sort((a, b) => asc(b, a)),
    } satisfies Record<Vista, ReservaActividad[]>;
  }, [reservas, today]);

  const term = q.trim().toLowerCase().replace(/^#/, '');
  const filtradas = porVista[vista].filter((r) =>
    (!term || [String(r.id), r.Usuario?.nombre, r.Usuario?.email, r.RecursoActividad?.nombre].some((v) => v?.toLowerCase().includes(term))) &&
    (!fecha || r.fecha === fecha) &&
    (vista !== 'todas' || !estadoFiltro || r.estado === estadoFiltro) &&
    (recursoFiltro === null || r.recurso_id === recursoFiltro) &&
    (!instructorFiltro || (instructorFiltro === 'ninguno' ? !r.instructor_id : r.instructor_id === Number(instructorFiltro))));
  const hasFilters = Boolean(q || fecha || estadoFiltro || recursoFiltro || instructorFiltro);
  const recursoNombre = recursoFiltro !== null ? (recursosQuery.data ?? []).find((r) => r.id === recursoFiltro)?.nombre ?? `#${recursoFiltro}` : '';
  const date = (value?: string | null) => value ? formatAdminCalendarDate(value, locale) : '—';
  const time = (value?: string | null) => value ? formatAdminTimeOfDay(value, locale) : '';

  const handleConfirmAction = async () => {
    if (!modalAction) return;
    setActionError(null);

    try {
      await updateMutation.mutateAsync({
        estado: modalAction.nuevoEstado,
      });
      setModalAction(null);
    } catch (err: any) {
      const code = err?.code || err?.response?.data?.code;
      const msg = err?.message || err?.response?.data?.message;

      if (code === 'RESERVATION_NOT_FINISHED') {
        setActionError(textosActividades.errorNoFinalizada);
      } else if (code === 'RESOURCE_OVERLAP') {
        setActionError(textosActividades.errorRecursoOcupado);
      } else if (code === 'INSTRUCTOR_OVERLAP') {
        setActionError(textosActividades.errorInstructorOcupado);
      } else if (code === 'INSTRUCTOR_INACTIVE') {
        setActionError(textosActividades.errorInstructorInactivo);
      } else if (code === 'ACTIVITY_DATE_IN_PAST') {
        setActionError(textosActividades.errorFechaPasada);
      } else {
        setActionError(msg || 'No fue posible actualizar el estado de la reserva.');
      }
    }
  };

  const estadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return 'border-exito-600/20 bg-exito-50 text-exito-700';
      case 'completada':
        return 'border-info-600/20 bg-info-50 text-info-700';
      case 'cancelada':
        return 'border-neutro-300 bg-neutro-100 text-neutro-600';
      default:
        return 'border-neutro-200 bg-neutro-50 text-neutro-700';
    }
  };

  const acciones = (reserva: ReservaActividad) => {
    const estado = reserva.estado;
    return <div className="flex flex-wrap items-center justify-end gap-1">
      {estado === 'confirmada' && <>
        <Button type="button" variant="ghost" size="sm" aria-label={t.completarDe(reserva.id!)} onClick={() => setModalAction({ reserva, nuevoEstado: 'completada' })}><CheckCircle2 className="size-4" aria-hidden="true" /><span className="hidden 2xl:inline">{t.completar}</span></Button>
        <Button type="button" variant="ghost" size="sm" className="text-error-700 hover:bg-error-50" aria-label={t.cancelarDe(reserva.id!)} onClick={() => setModalAction({ reserva, nuevoEstado: 'cancelada' })}><XCircle className="size-4" aria-hidden="true" /><span className="hidden 2xl:inline">{t.cancelar}</span></Button>
      </>}
      {(estado === 'cancelada' || estado === 'completada') && <Button type="button" variant="ghost" size="sm" aria-label={t.reactivarDe(reserva.id!)} onClick={() => setModalAction({ reserva, nuevoEstado: 'confirmada' })}><RefreshCw className="size-4" aria-hidden="true" /><span className="hidden 2xl:inline">{t.reactivar}</span></Button>}
    </div>;
  };
  const estadoLabel = (estado?: string | null) => (estado && textosActividades.estados[estado as keyof typeof textosActividades.estados]) || estado || '—';

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header>
        <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.reservas}</h1>
        {reservasQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.reservasResumen(reservas.length)} · {t.hoy} {date(today)}</p>}
      </header>
      <ActividadesAdminNav />

      {reservasQuery.isPending && <LoadingNotice label={t.cargando} />}
      {reservasQuery.isError && <Alert tone="error" title={t.errorReservas}><Button className="mt-2" variant="secondary" onClick={() => void reservasQuery.refetch()}>{t.reintentar}</Button></Alert>}

      {reservasQuery.isSuccess && <>
        <div role="group" aria-label={t.vistasLabel} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
          {VISTAS.map((key) => <button key={key} type="button" aria-pressed={vista === key} onClick={() => update({ vista: key === 'hoy' ? null : key, estado: null })}
            className={cn('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors', vista === key ? 'bg-bronce-50 text-bronce-800' : 'text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900')}>
            {t.vistas[key]}
            <span className={cn('rounded-full px-1.5 text-xs tabular-nums', vista === key ? 'bg-bronce-600 text-white' : 'bg-neutro-100 text-neutro-700')}>{porVista[key].length}</span>
          </button>)}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <label className="relative min-w-0 sm:col-span-2 xl:col-span-1"><span className="sr-only">{t.buscarReserva}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscarReserva} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.recurso}</span>
            <select value={recursoFiltro ?? ''} onChange={(event) => update({ recurso: event.target.value || null })} className="field-control">
              <option value="">{t.todosRecursos}</option>
              {recursos.map((r) => <option key={r.id} value={r.id} lang="es">{r.nombre}</option>)}
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.instructor}</span>
            <select value={instructorFiltro} onChange={(event) => update({ instructor: event.target.value || null })} className="field-control">
              <option value="">{t.todosInstructores}</option>
              <option value="ninguno">{t.sinInstructorFiltro}</option>
              {instructores.map((i) => <option key={i.id} value={i.id} lang="es">{i.nombre}</option>)}
            </select></label>
          {vista !== 'hoy' && <label className="min-w-0"><span className="sr-only">{t.fecha}</span>
            <input type="date" value={fecha} aria-label={t.fecha} onChange={(event) => update({ fecha: event.target.value || null })} className="field-control" /></label>}
          {vista === 'todas' && <label className="min-w-0"><span className="sr-only">{t.estado}</span>
            <select value={estadoFiltro} onChange={(event) => update({ estado: event.target.value || null })} className="field-control">
              <option value="">{t.todosEstados}</option>
              {ESTADOS.map((value) => <option key={value} value={value}>{estadoLabel(value)}</option>)}
            </select></label>}
        </div>
        {hasFilters && <div className="flex flex-wrap items-center gap-2">
          {recursoFiltro !== null && <button type="button" onClick={() => update({ recurso: null })} aria-label={t.quitarRecurso} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bronce-200 bg-bronce-50 px-3 text-xs font-medium text-bronce-800 hover:border-bronce-400"><span lang="es">{t.filtroRecurso(recursoNombre)}</span><X className="size-3.5" aria-hidden="true" /></button>}
          <Button variant="text" size="sm" onClick={() => update({ q: null, fecha: null, estado: null, recurso: null, instructor: null })}>{t.limpiar}</Button>
        </div>}

        {filtradas.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{hasFilters ? t.vacioR.filtros : t.vacioR[vista]}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t.vistas[vista]}</caption>
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-4 py-3">{t.colR.reserva}</th>
                  <th scope="col" className="px-4 py-3">{t.colR.fechaHora}</th>
                  <th scope="col" className="px-4 py-3">{t.colR.recurso}</th>
                  <th scope="col" className="px-4 py-3">{t.colR.cliente}</th>
                  <th scope="col" className="px-4 py-3">{t.colR.instructor}</th>
                  <th scope="col" className="px-4 py-3 text-right">{t.colR.total}</th>
                  <th scope="col" className="px-4 py-3">{t.colR.estado}</th>
                  <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">{t.colR.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtradas.map((r) => <tr key={r.id} className="hover:bg-bronce-50/40">
                  <td className="whitespace-nowrap px-4 py-2.5"><Link to={ACTIVIDADES_ROUTES.ADMIN_DETALLE_RESERVA(r.id!)} aria-label={t.verReserva(r.id!)} className="inline-flex min-h-9 items-center gap-1 font-semibold text-bronce-700 hover:underline">#{r.id}<ChevronRight className="size-3.5" aria-hidden="true" /></Link></td>
                  <td className="whitespace-nowrap px-4 py-2.5"><span className={cn('font-medium', r.fecha === today ? 'text-bronce-800' : 'text-neutro-900')}>{date(r.fecha)}</span><span className="block text-xs text-neutro-600">{time(r.hora_inicio)}{r.hora_fin && ` – ${time(r.hora_fin)}`}</span></td>
                  <td className="px-4 py-2.5"><span className="block font-medium text-neutro-900" lang="es">{r.RecursoActividad?.nombre ?? `#${r.recurso_id}`}</span>
                    <span className="block text-xs text-neutro-500">{t.personas(r.numero_participantes ?? 1)}</span></td>
                  <td className="px-4 py-2.5"><span className="block text-neutro-900">{r.Usuario?.nombre ?? '—'}</span><span className="hidden max-w-[14rem] truncate text-xs text-neutro-500 2xl:block">{r.Usuario?.email}</span></td>
                  <td className="px-4 py-2.5 text-neutro-700"><span className="block" lang="es">{r.Instructor?.nombre ?? <span className="text-neutro-400">{t.sinInstructor}</span>}</span>
                    {r.con_equipo && <span className="inline-flex items-center gap-1 text-xs text-neutro-600"><Package className="size-3.5" aria-hidden="true" />{t.conEquipo}</span>}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{formatearGTQ(r.total)}</td>
                  <td className="px-4 py-2.5"><span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', estadoBadgeClass(r.estado ?? ''))}>{estadoLabel(r.estado)}</span></td>
                  <td className="px-4 py-1.5">{acciones(r)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
            {filtradas.map((r) => <li key={r.id} className="flex flex-col gap-2 px-4 py-3">
              <Link to={ACTIVIDADES_ROUTES.ADMIN_DETALLE_RESERVA(r.id!)} aria-label={t.verReserva(r.id!)} className="flex items-start justify-between gap-3">
                <span className="min-w-0 space-y-0.5">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900">#{r.id}</span><span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold', estadoBadgeClass(r.estado ?? ''))}>{estadoLabel(r.estado)}</span></span>
                  <span className="block text-sm text-neutro-800">{date(r.fecha)} · {time(r.hora_inicio)}{r.hora_fin && ` – ${time(r.hora_fin)}`}</span>
                  <span className="block truncate text-xs text-neutro-600" lang="es">{r.RecursoActividad?.nombre ?? `#${r.recurso_id}`} · {t.personas(r.numero_participantes ?? 1)}</span>
                  <span className="block truncate text-xs text-neutro-600">{r.Usuario?.nombre ?? '—'} · {r.Instructor?.nombre ?? t.sinInstructor}{r.con_equipo && ` · ${t.conEquipo}`} · {formatearGTQ(r.total)}</span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
              </Link>
              {acciones(r)}
            </li>)}
          </ul>
        </>}
      </>}

      {/* Modal de confirmación de cambio de estado */}
      {modalAction && (
        <Modal
          open={Boolean(modalAction)}
          onClose={() => {
            setModalAction(null);
            setActionError(null);
          }}
          title={textosActividades.confirmarCambioEstado}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutro-700">
              ¿Está seguro de cambiar el estado de la reserva recreativa{' '}
              <strong>#{modalAction.reserva.id}</strong> ({modalAction.reserva.RecursoActividad?.nombre}) al estado{' '}
              <strong className="uppercase text-bronce-700">{modalAction.nuevoEstado}</strong>?
            </p>

            {modalAction.nuevoEstado === 'completada' && (
              <p className="text-xs text-neutro-500 bg-neutro-50 p-2 rounded border border-neutro-200">
                {textosActividades.advertenciaCompletar}
              </p>
            )}

            {modalAction.nuevoEstado === 'confirmada' && (
              <p className="text-xs text-neutro-500 bg-neutro-50 p-2 rounded border border-neutro-200">
                {textosActividades.advertenciaReactivar}
              </p>
            )}

            {actionError && (
              <Alert tone="error">
                <p>{actionError}</p>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-neutro-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setModalAction(null);
                  setActionError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant={modalAction.nuevoEstado === 'cancelada' ? 'danger' : 'primary'}
                onClick={handleConfirmAction}
                isLoading={updateMutation.isPending}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Actualizando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
