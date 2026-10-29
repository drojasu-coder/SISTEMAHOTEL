import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, ImageOff, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { getApiErrorMessage } from '@/api/errors';
import { cn } from '@/lib/cn';
import { useAdminReservasEventosQuery, useDeleteSalonMutation, useSalonesQuery } from '../hooks/useEventos';
import { EVENTOS_ROUTES } from '../constants/routes';
import { formatearGTQ } from '../textos';
import { useTextosGestionEventos } from '../gestionTextos';
import { SalonFormModal } from './SalonFormModal';
import { EventosAdminNav } from './EventosAdminNav';
import type { Salon } from '../types';
import { HorarioBadge } from '@/components/ui/HorarioBadge';

/**
 * Salones: inventario filtrable por la sede global, nombre, capacidad y
 * fotografía, con sus próximos eventos reales. El backend no ofrece una
 * consulta de disponibilidad por salón: la disponibilidad se valida solo al
 * reservar, por eso aquí se muestran reservas existentes y no «libre/ocupado».
 */
export const AdminSalonesList: React.FC = () => {
  const t = useTextosGestionEventos();
  const { selectedSedeId } = useAdminScope();
  const salonesQuery = useSalonesQuery();
  const reservasQuery = useAdminReservasEventosQuery();
  const sedesQuery = useSedesQuery();
  const deleteMutation = useDeleteSalonMutation();
  const [salonEnEdicion, setSalonEnEdicion] = useState<Salon | null | undefined>(undefined);
  const [salonAEliminar, setSalonAEliminar] = useState<Salon | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const sedesMap = useMemo(() => new Map((sedesQuery.data ?? []).map((sede) => [sede.id, sede.nombre])), [sedesQuery.data]);
  const enSede = useMemo(() => (salonesQuery.data ?? []).filter((s) => selectedSedeId === 'all' || s.sucursal_id === selectedSedeId), [salonesQuery.data, selectedSedeId]);
  const capacidades = useMemo(() => [...new Set(enSede.map((s) => s.capacidad_maxima).filter((n): n is number => typeof n === 'number' && n > 0))].sort((a, b) => a - b), [enSede]);
  const today = getTodayInGuatemala();
  const proximos = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of reservasQuery.data ?? []) if ((r.estado === 'confirmada' || r.estado === 'cotizacion') && r.fecha >= today) counts.set(r.salon_id, (counts.get(r.salon_id) ?? 0) + 1);
    return counts;
  }, [reservasQuery.data, today]);

  const q = params.get('q') ?? '';
  const capacidad = capacidades.map(String).includes(params.get('capacidad') ?? '') ? params.get('capacidad')! : '';
  const imagen = ['con', 'sin'].includes(params.get('imagen') ?? '') ? params.get('imagen')! : '';
  const hasFilters = Boolean(q || capacidad || imagen);
  const term = q.trim().toLowerCase();
  const filtrados = enSede.filter((s) =>
    (!term || (s.nombre ?? '').toLowerCase().includes(term)) &&
    (!capacidad || (s.capacidad_maxima ?? 0) >= Number(capacidad)) &&
    (!imagen || (imagen === 'con') === Boolean(s.imagen_url)));
  const plazas = enSede.reduce((sum, s) => sum + (s.capacidad_maxima ?? 0), 0);
  const sede = (s: Salon) => (s.sucursal_id != null && sedesMap.get(s.sucursal_id)) || s.sucursal?.nombre || `#${s.sucursal_id}`;

  const confirmarEliminar = async () => {
    if (!salonAEliminar?.id) return;
    setErrorAccion(null);
    try {
      await deleteMutation.mutateAsync(salonAEliminar.id);
      setSalonAEliminar(null);
    } catch (err: unknown) {
      setErrorAccion(getApiErrorMessage(err));
      setSalonAEliminar(null);
    }
  };
  const thumb = (s: Salon, size: string) => s.imagen_url
    ? <img src={s.imagen_url} alt="" loading="lazy" className={cn(size, 'shrink-0 rounded-md border border-neutro-200 object-cover')} />
    : <span title={t.sinFoto} className={cn(size, 'flex shrink-0 items-center justify-center rounded-md border border-dashed border-neutro-300 bg-neutro-50 text-neutro-400')}><ImageOff className="size-4" aria-hidden="true" /><span className="sr-only">{t.sinFoto}</span></span>;
  const acciones = (s: Salon, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <Link to={`${EVENTOS_ROUTES.ADMIN_RESERVAS}?vista=proximos&salon=${s.id}`} aria-label={t.reservasDe(s.nombre ?? '')} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <CalendarCheck className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.reservas}</span></Link>
    <button type="button" onClick={() => setSalonEnEdicion(s)} aria-label={t.editarDe(s.nombre ?? '')} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.editar}</span></button>
    <button type="button" onClick={() => setSalonAEliminar(s)} aria-label={t.eliminarDe(s.nombre ?? '')} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5 text-error-700 hover:bg-error-50' })}>
      <Trash2 className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.eliminar}</span></button>
  </div>;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.salones}</h1>
          {salonesQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.salonesResumen(enSede.length, plazas)}</p>}
        </div>
        <Button type="button" onClick={() => setSalonEnEdicion(null)}><Plus className="size-4" aria-hidden="true" />{t.nuevoSalon}</Button>
      </header>
      <EventosAdminNav />

      {errorAccion && <Alert tone="error"><div className="flex items-center justify-between gap-4"><span>{errorAccion}</span>
        <button type="button" onClick={() => setErrorAccion(null)} aria-label={t.cerrar} className="rounded p-1 hover:bg-black/5"><X className="size-4" aria-hidden="true" /></button></div></Alert>}
      {(salonesQuery.isPending || sedesQuery.isPending) && <LoadingNotice label={t.cargando} />}
      {salonesQuery.isError && <Alert tone="error"><p>{getApiErrorMessage(salonesQuery.error)}</p><Button className="mt-3" variant="secondary" onClick={() => void salonesQuery.refetch()}>{t.reintentar}</Button></Alert>}
      {salonesQuery.isSuccess && enSede.length === 0 && <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.vacio}</p>}

      {salonesQuery.isSuccess && enSede.length > 0 && <>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="relative min-w-0"><span className="sr-only">{t.buscar}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscar} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.capacidad}</span>
            <select value={capacidad} onChange={(event) => update({ capacidad: event.target.value || null })} className="field-control">
              <option value="">{t.cualquierCapacidad}</option>
              {capacidades.map((n) => <option key={n} value={String(n)}>{t.capacidadMin(n)}</option>)}
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.imagen}</span>
            <select value={imagen} onChange={(event) => update({ imagen: event.target.value || null })} className="field-control">
              <option value="">{t.todasImagenes}</option>
              <option value="con">{t.conImagen}</option>
              <option value="sin">{t.sinImagen}</option>
            </select></label>
        </div>
        {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, capacidad: null, imagen: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}

        {filtrados.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinResultados}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
            <table className="w-full text-left text-sm text-neutro-800">
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-3 py-3">{t.col.salon}</th>
                  {selectedSedeId === 'all' && <th scope="col" className="px-3 py-3">{t.col.sede}</th>}
                  <th scope="col" className="px-3 py-3">{t.col.capacidad}</th>
                  <th scope="col" className="px-3 py-3 text-right">{t.col.tarifa}</th>
                  <th scope="col" className="px-3 py-3">{t.col.proximos}</th>
                  <th scope="col" className="px-3 py-3 text-right"><span className="sr-only">{t.col.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtrados.map((s) => <tr key={s.id} className="hover:bg-bronce-50/40">
                  <td className="px-3 py-2.5"><span className="flex items-center gap-3">{thumb(s, 'size-10')}<span className="flex flex-col items-start gap-1"><span className="font-semibold text-neutro-900" lang="es">{s.nombre}</span><HorarioBadge registro={s} /></span></span></td>
                  {selectedSedeId === 'all' && <td className="px-3 py-2.5" lang="es">{sede(s)}</td>}
                  <td className="whitespace-nowrap px-3 py-2.5">{s.capacidad_maxima ? t.personas(s.capacidad_maxima) : '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{formatearGTQ(s.tarifa_base)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{reservasQuery.isSuccess ? proximos.get(s.id ?? 0) ?? 0 : '—'}</td>
                  <td className="px-3 py-1.5">{acciones(s)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
            {filtrados.map((s) => <li key={s.id} className="flex items-center gap-3 px-3 py-3">
              {thumb(s, 'size-12')}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-neutro-900" lang="es">{s.nombre}</span>
                <span className="mt-1 block"><HorarioBadge registro={s} /></span>
                <span className="block truncate text-xs text-neutro-600">{selectedSedeId === 'all' && <><span lang="es">{sede(s)}</span> · </>}{s.capacidad_maxima ? t.personas(s.capacidad_maxima) : '—'} · {formatearGTQ(s.tarifa_base)}{reservasQuery.isSuccess && ` · ${t.col.proximos}: ${proximos.get(s.id ?? 0) ?? 0}`}</span>
              </span>
              {acciones(s, true)}
            </li>)}
          </ul>
        </>}
      </>}

      {salonEnEdicion !== undefined && <SalonFormModal salon={salonEnEdicion} isOpen onClose={() => setSalonEnEdicion(undefined)} />}

      <Modal open={Boolean(salonAEliminar)} onClose={() => { if (!deleteMutation.isPending) setSalonAEliminar(null); }} title={t.eliminarTitulo}
        description={salonAEliminar ? t.eliminarDesc(salonAEliminar.nombre ?? '') : undefined}>
        <div className="flex justify-end gap-3 border-t border-neutro-200 pt-4">
          <Button type="button" variant="ghost" disabled={deleteMutation.isPending} onClick={() => setSalonAEliminar(null)}>{t.cancelar}</Button>
          <Button type="button" variant="danger" disabled={deleteMutation.isPending} onClick={() => void confirmarEliminar()}>{deleteMutation.isPending ? t.eliminando : t.eliminar}</Button>
        </div>
      </Modal>
    </div>
  );
};
