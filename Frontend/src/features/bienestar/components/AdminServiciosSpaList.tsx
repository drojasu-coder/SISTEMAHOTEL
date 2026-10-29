import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, ImageOff, Pencil, Plus, Search, X } from 'lucide-react';
import { api } from '@/api/client/http';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { useSedesQuery } from '@/features/sedes/hooks/useSedes';
import { cn } from '@/lib/cn';
import { useTerapeutasQuery } from '../hooks/useBienestar';
import { bienestarQueryKeys } from '../constants/queryKeys';
import { BIENESTAR_ROUTES } from '../constants/routes';
import { formatearGTQ } from '../textos';
import { useTextosGestionBienestar } from '../gestionTextos';
import { ServicioSpaFormModal } from './ServicioSpaFormModal';
import { BienestarAdminNav } from './BienestarAdminNav';
import type { ServicioBienestar, ServiciosBienestarResponse } from '../types';
import { HorarioBadge } from '@/components/ui/HorarioBadge';

/** El administrador ve también los servicios inactivos (el catálogo público solo los activos). */
export function useServiciosAdminQuery() {
  return useQuery({
    queryKey: [...bienestarQueryKeys.servicios, 'admin', 'incluir_inactivos'],
    queryFn: async () => (await api.get<ServiciosBienestarResponse>('/servicios-spa', { params: { incluir_inactivos: true } })).data,
  });
}

/**
 * Servicios de bienestar: catálogo filtrable por la sede global, nombre,
 * duración y estado. «Terapeutas disponibles» aplica la regla del servidor: un
 * servicio de sede lo atienden los terapeutas activos de esa sede.
 */
export const AdminServiciosSpaList: React.FC = () => {
  const t = useTextosGestionBienestar();
  const { selectedSedeId } = useAdminScope();
  const serviciosQuery = useServiciosAdminQuery();
  const terapeutasQuery = useTerapeutasQuery();
  const sedesQuery = useSedesQuery();
  const [servicioEnEdicion, setServicioEnEdicion] = useState<ServicioBienestar | null | undefined>(undefined);
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const sedesMap = useMemo(() => new Map((sedesQuery.data ?? []).map((sede) => [sede.id, sede.nombre])), [sedesQuery.data]);
  // Con una sede elegida se muestran sus servicios y los generales (sin sede).
  const enSede = useMemo(() => (serviciosQuery.data ?? []).filter((s) => selectedSedeId === 'all' || s.sucursal_id == null || s.sucursal_id === selectedSedeId), [serviciosQuery.data, selectedSedeId]);
  const terapeutasActivos = (terapeutasQuery.data ?? []).filter((x) => x.activo);
  const terapeutasPara = (s: ServicioBienestar) => terapeutasActivos.filter((x) => s.sucursal_id == null
    ? selectedSedeId === 'all' || x.sucursal_id === selectedSedeId
    : x.sucursal_id === s.sucursal_id).length;
  const duraciones = useMemo(() => [...new Set(enSede.map((s) => s.duracion_minutos).filter((n): n is number => typeof n === 'number'))].sort((a, b) => a - b), [enSede]);

  const q = params.get('q') ?? '';
  const duracion = duraciones.map(String).includes(params.get('duracion') ?? '') ? params.get('duracion')! : '';
  const estado = ['activo', 'inactivo'].includes(params.get('estado') ?? '') ? params.get('estado')! : '';
  const hasFilters = Boolean(q || duracion || estado);
  const term = q.trim().toLowerCase();
  const filtrados = enSede.filter((s) =>
    (!term || (s.nombre ?? '').toLowerCase().includes(term)) &&
    (!duracion || s.duracion_minutos === Number(duracion)) &&
    (!estado || (estado === 'activo') === (s.activo !== false)));
  const activos = enSede.filter((s) => s.activo !== false).length;
  const hayGenerales = filtrados.some((s) => s.sucursal_id == null);
  const sede = (s: ServicioBienestar) => s.sucursal_id == null ? t.general : sedesMap.get(s.sucursal_id) ?? `#${s.sucursal_id}`;
  const estadoBadge = (s: ServicioBienestar) => <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', s.activo !== false ? 'border-exito-600/20 bg-exito-50 text-exito-700' : 'border-neutro-300 bg-neutro-100 text-neutro-600')}>{s.activo !== false ? t.activo : t.inactivo}</span>;
  const thumb = (s: ServicioBienestar, size: string) => s.imagen_url
    ? <img src={s.imagen_url} alt="" loading="lazy" className={cn(size, 'shrink-0 rounded-md border border-neutro-200 object-cover')} />
    : <span title={t.sinFoto} className={cn(size, 'flex shrink-0 items-center justify-center rounded-md border border-dashed border-neutro-300 bg-neutro-50 text-neutro-400')}><ImageOff className="size-4" aria-hidden="true" /><span className="sr-only">{t.sinFoto}</span></span>;
  const terapeutasCell = (s: ServicioBienestar) => {
    const n = terapeutasPara(s);
    return terapeutasQuery.isSuccess ? <span title={n === 0 && s.activo !== false ? t.sinTerapeutas : undefined} className={cn(n === 0 && s.activo !== false && 'font-medium text-advertencia-700')}>{t.terapeutasN(n)}</span> : '—';
  };
  const acciones = (s: ServicioBienestar, compact = false) => <div className={cn('flex items-center gap-1', !compact && 'justify-end')}>
    <Link to={`${BIENESTAR_ROUTES.ADMIN_CITAS}?vista=historial&servicio=${s.id}`} aria-label={t.citasDe(s.nombre ?? '')} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <CalendarCheck className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.citas}</span></Link>
    <button type="button" onClick={() => setServicioEnEdicion(s)} aria-label={t.editarDe(s.nombre ?? '')} className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}>
      <Pencil className="size-4" aria-hidden="true" /><span className={compact ? 'sr-only' : 'hidden 2xl:inline'}>{t.editar}</span></button>
  </div>;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.servicios}</h1>
          {serviciosQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.serviciosResumen(enSede.length, activos)}</p>}
        </div>
        <Button type="button" onClick={() => setServicioEnEdicion(null)}><Plus className="size-4" aria-hidden="true" />{t.nuevoServicio}</Button>
      </header>
      <BienestarAdminNav />

      {serviciosQuery.isPending && <LoadingNotice label={t.cargando} />}
      {serviciosQuery.isError && <Alert tone="error"><Button variant="secondary" onClick={() => void serviciosQuery.refetch()}>{t.reintentar}</Button></Alert>}

      {serviciosQuery.isSuccess && enSede.length === 0 && <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinServicios}</p>}
      {serviciosQuery.isSuccess && enSede.length > 0 && <>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="relative min-w-0"><span className="sr-only">{t.buscarServicio}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscarServicio} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.duracion}</span>
            <select value={duracion} onChange={(event) => update({ duracion: event.target.value || null })} className="field-control">
              <option value="">{t.todasDuraciones}</option>
              {duraciones.map((n) => <option key={n} value={String(n)}>{t.minutos(n)}</option>)}
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.estado}</span>
            <select value={estado} onChange={(event) => update({ estado: event.target.value || null })} className="field-control">
              <option value="">{t.todosEstados}</option>
              <option value="activo">{t.activos}</option>
              <option value="inactivo">{t.inactivos}</option>
            </select></label>
        </div>
        {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, duracion: null, estado: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}

        {filtrados.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinResultados}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
            <table className="w-full text-left text-sm text-neutro-800">
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-3 py-3">{t.colS.servicio}</th>
                  <th scope="col" className="px-3 py-3">{t.colS.sede}</th>
                  <th scope="col" className="px-3 py-3">{t.colS.duracion}</th>
                  <th scope="col" className="px-3 py-3 text-right">{t.colS.tarifa}</th>
                  <th scope="col" className="px-3 py-3">{t.colS.estado}</th>
                  <th scope="col" className="px-3 py-3">{t.colS.terapeutas}</th>
                  <th scope="col" className="px-3 py-3 text-right"><span className="sr-only">{t.colS.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtrados.map((s) => <tr key={s.id} className={cn('hover:bg-bronce-50/40', s.activo === false && 'text-neutro-500')}>
                  <td className="px-3 py-2.5"><span className="flex items-center gap-3">{thumb(s, 'size-10')}<span className="flex flex-col items-start gap-1"><span className="font-semibold text-neutro-900" lang="es">{s.nombre}</span><HorarioBadge registro={s} /></span></span></td>
                  <td className="px-3 py-2.5" lang="es">{sede(s)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{s.duracion_minutos ? t.minutos(s.duracion_minutos) : '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{formatearGTQ(s.precio)}</td>
                  <td className="px-3 py-2.5">{estadoBadge(s)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{terapeutasCell(s)}</td>
                  <td className="px-3 py-1.5">{acciones(s)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
            {filtrados.map((s) => <li key={s.id} className="flex items-center gap-3 px-3 py-3">
              {thumb(s, 'size-12')}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900" lang="es">{s.nombre}</span>{estadoBadge(s)}<HorarioBadge registro={s} /></span>
                <span className="block truncate text-xs text-neutro-600"><span lang="es">{sede(s)}</span> · {s.duracion_minutos ? t.minutos(s.duracion_minutos) : '—'} · {formatearGTQ(s.precio)}</span>
                <span className="block truncate text-xs text-neutro-600">{t.colS.terapeutas}: {terapeutasCell(s)}</span>
              </span>
              {acciones(s, true)}
            </li>)}
          </ul>
          {hayGenerales && <p className="text-xs text-neutro-500">{t.general}: {t.generalNota}</p>}
        </>}
      </>}

      {servicioEnEdicion !== undefined && <ServicioSpaFormModal servicio={servicioEnEdicion} onClose={() => setServicioEnEdicion(undefined)} onSuccess={() => void serviciosQuery.refetch()} />}
    </div>
  );
};
