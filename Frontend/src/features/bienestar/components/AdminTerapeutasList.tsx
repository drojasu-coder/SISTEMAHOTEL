import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, Pencil, Plus, Search, X } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { cn } from '@/lib/cn';
import { useAdminCitasSpaQuery, useServiciosSpaQuery, useTerapeutasQuery } from '../hooks/useBienestar';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { useTextosGestionBienestar } from '../gestionTextos';
import { TerapeutaFormModal } from './TerapeutaFormModal';
import { BienestarAdminNav } from './BienestarAdminNav';
import type { Terapeuta } from '../types';

/**
 * Terapeutas por la sede global, con los servicios que pueden atender según la
 * regla del servidor (servicios activos de su sede) y sus próximas citas.
 * El backend no registra especialidad ni horario propio del terapeuta.
 */
export const AdminTerapeutasList: React.FC = () => {
  const t = useTextosGestionBienestar();
  const { selectedSedeId } = useAdminScope();
  const terapeutasQuery = useTerapeutasQuery();
  const serviciosQuery = useServiciosSpaQuery();
  const citasQuery = useAdminCitasSpaQuery();
  const sedesQuery = useSedesQuery();
  const [terapeutaEnEdicion, setTerapeutaEnEdicion] = useState<Terapeuta | null | undefined>(undefined);
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const sedesMap = useMemo(() => new Map((sedesQuery.data ?? []).map((sede) => [sede.id, sede.nombre])), [sedesQuery.data]);
  const enSede = useMemo(() => (terapeutasQuery.data ?? []).filter((x) => selectedSedeId === 'all' || x.sucursal_id === selectedSedeId), [terapeutasQuery.data, selectedSedeId]);
  const today = getTodayInGuatemala();
  const proximas = useMemo(() => {
    const counts = new Map<number, number>();
    for (const c of citasQuery.data ?? []) if (c.estado === 'confirmada' && c.terapeuta_id && (c.fecha ?? '') >= today) counts.set(c.terapeuta_id, (counts.get(c.terapeuta_id) ?? 0) + 1);
    return counts;
  }, [citasQuery.data, today]);
  const serviciosDe = (x: Terapeuta) => (serviciosQuery.data ?? []).filter((s) => s.activo !== false && s.sucursal_id != null && s.sucursal_id === x.sucursal_id).length;

  const q = params.get('q') ?? '';
  const estado = ['activo', 'inactivo'].includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const hasFilters = Boolean(q || estado);
  const term = q.trim().toLowerCase();
  const filtrados = enSede.filter((x) => (!term || (x.nombre ?? '').toLowerCase().includes(term)) && (!estado || (estado === 'activo') === Boolean(x.activo)));
  const sede = (x: Terapeuta) => x.sucursal_id == null ? t.general : sedesMap.get(x.sucursal_id) ?? `#${x.sucursal_id}`;
  const estadoBadge = (x: Terapeuta) => <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', x.activo ? 'border-exito-600/20 bg-exito-50 text-exito-700' : 'border-neutro-300 bg-neutro-100 text-neutro-600')}>{x.activo ? t.activo : t.inactivo}</span>;
  const acciones = (x: Terapeuta, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <Link to={`${BIENESTAR_ROUTES.ADMIN_CITAS}?vista=proximas&terapeuta=${x.id}`} aria-label={t.citasDe(x.nombre ?? '')} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <CalendarCheck className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.citas}</span></Link>
    <button type="button" onClick={() => setTerapeutaEnEdicion(x)} aria-label={t.editarDe(x.nombre ?? '')} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.editar}</span></button>
  </div>;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.terapeutas}</h1>
          {terapeutasQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.terapeutasResumen(enSede.length, enSede.filter((x) => x.activo).length)}</p>}
        </div>
        <Button type="button" onClick={() => setTerapeutaEnEdicion(null)}><Plus className="size-4" aria-hidden="true" />{t.nuevoTerapeuta}</Button>
      </header>
      <BienestarAdminNav />
      <p className="text-xs text-neutro-500">{t.terapeutasNota}</p>

      {terapeutasQuery.isPending && <LoadingNotice label={t.cargando} />}
      {terapeutasQuery.isError && <Alert tone="error"><Button variant="secondary" onClick={() => void terapeutasQuery.refetch()}>{t.reintentar}</Button></Alert>}
      {terapeutasQuery.isSuccess && enSede.length === 0 && <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinTerapeutasRegistrados}</p>}
      {terapeutasQuery.isSuccess && enSede.length > 0 && <>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="relative min-w-0"><span className="sr-only">{t.buscarTerapeuta}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscarTerapeuta} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.estado}</span>
            <select value={estado} onChange={(event) => update({ estado: event.target.value || null })} className="field-control">
              <option value="">{t.todosEstados}</option>
              <option value="activo">{t.activos}</option>
              <option value="inactivo">{t.inactivos}</option>
            </select></label>
        </div>
        {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, estado: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}
        {filtrados.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinResultados}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white lg:block">
            <table className="w-full text-left text-sm text-neutro-800">
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-3 py-3">{t.colT.terapeuta}</th>
                  <th scope="col" className="px-3 py-3">{t.colT.sede}</th>
                  <th scope="col" className="px-3 py-3">{t.colT.estado}</th>
                  <th scope="col" className="px-3 py-3">{t.colT.servicios}</th>
                  <th scope="col" className="px-3 py-3">{t.colT.proximas}</th>
                  <th scope="col" className="px-3 py-3 text-right"><span className="sr-only">{t.colT.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtrados.map((x) => <tr key={x.id} className="hover:bg-bronce-50/40">
                  <td className="px-3 py-2.5 font-semibold text-neutro-900" lang="es">{x.nombre}</td>
                  <td className="px-3 py-2.5" lang="es">{sede(x)}</td>
                  <td className="px-3 py-2.5">{estadoBadge(x)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{serviciosQuery.isSuccess ? t.serviciosN(serviciosDe(x)) : '—'}</td>
                  <td className="px-3 py-2.5 tabular-nums">{citasQuery.isSuccess ? proximas.get(x.id ?? 0) ?? 0 : '—'}</td>
                  <td className="px-3 py-1.5">{acciones(x)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white lg:hidden">
            {filtrados.map((x) => <li key={x.id} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900" lang="es">{x.nombre}</span>{estadoBadge(x)}</span>
                <span className="block truncate text-xs text-neutro-600"><span lang="es">{sede(x)}</span>{serviciosQuery.isSuccess && ` · ${t.serviciosN(serviciosDe(x))}`}{citasQuery.isSuccess && ` · ${t.colT.proximas}: ${proximas.get(x.id ?? 0) ?? 0}`}</span>
              </span>
              {acciones(x, true)}
            </li>)}
          </ul>
        </>}
      </>}

      {terapeutaEnEdicion !== undefined && <TerapeutaFormModal terapeuta={terapeutaEnEdicion} onClose={() => setTerapeutaEnEdicion(undefined)} onSuccess={() => void terapeutasQuery.refetch()} />}
    </div>
  );
};
