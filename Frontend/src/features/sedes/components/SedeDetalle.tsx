import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Power } from 'lucide-react';
import { api } from '@/api/client/http';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { hotelDate } from '@/features/finanzas/common';
import { useLocale } from '@/i18n/LocaleContext';
import { useTextosSedes } from '../textos';
import type { Sucursal } from '../types';
import { EstadoSede } from './SedesList';

/** Cada recurso con su listado administrativo, que ya se filtra por el selector global de sede. */
const RUTAS: Record<string, string> = {
  habitaciones: '/admin/habitaciones', tipos_habitacion: '/admin/tipos-habitacion', mesas: '/admin/restaurante', actividades: '/admin/recursos-actividad',
  servicios_bienestar: '/admin/servicios-spa', terapeutas: '/admin/terapeutas', amenidades: '/admin/amenidades', salones: '/admin/salones', empleados: '/admin/personal',
};
type Resumen = { sucursal_id: number } & Record<string, number>;

export const SedeDetalle: React.FC<{ sede: Sucursal | null; canEdit: boolean; onClose: () => void; onEdit: (s: Sucursal) => void; onToggleStatus: (s: Sucursal) => void }> = ({ sede, canEdit, onClose, onEdit, onToggleStatus }) => {
  const t = useTextosSedes();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { setSelectedSedeId } = useAdminScope();
  const resumen = useQuery({
    queryKey: ['sedes-recursos-resumen'], enabled: Boolean(sede) && canEdit, staleTime: 30000, retry: false,
    queryFn: async () => (await api.get<{ data: Resumen[] }>('/sucursales/recursos-resumen')).data,
  });
  if (!sede) return null;
  const counts = resumen.data?.find(r => r.sucursal_id === sede.id);
  const open = (key: string) => { setSelectedSedeId(sede.id); navigate(RUTAS[key]); };
  const dt = (label: string, value: React.ReactNode) => <div><dt className="text-xs text-neutro-500">{label}</dt><dd className="mt-0.5 break-words text-sm font-medium text-neutro-900">{value || <span className="text-neutro-400">{t.noRegistrado}</span>}</dd></div>;
  const credito = (c: Sucursal['imagen_creditos']) => !c ? null : typeof c === 'string' ? c : [c.autor, c.licencia].filter(Boolean).join(' · ') || null;
  const imagen = (label: string, url?: string | null, credits?: Sucursal['imagen_creditos']) => <figure className="min-w-0">
    {url ? <img src={url} alt={`${label} · ${sede.nombre}`} loading="lazy" className="h-32 w-full rounded-lg border border-neutro-200 object-cover" />
      : <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-neutro-300 text-xs text-neutro-500">{t.sinImagen}</div>}
    <figcaption className="mt-1 text-xs text-neutro-600">{label}{url && credito(credits) ? <span className="text-neutro-400"> · {t.foto(credito(credits)!)}</span> : null}</figcaption></figure>;
  const date = (v?: string) => v ? hotelDate(v, locale) : '';
  return (
    <Modal open onClose={onClose} title={sede.nombre} description={t.detalleDesc} closeLabel={t.cerrar} className="max-w-3xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><EstadoSede activa={sede.activa} />
          {canEdit && <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => onEdit(sede)}><Pencil className="size-4" aria-hidden />{t.editar}</Button>
            <Button variant="ghost" size="sm" onClick={() => onToggleStatus(sede)} className={sede.activa ? 'text-error-700 hover:bg-error-50' : 'text-exito-700 hover:bg-exito-50'}><Power className="size-4" aria-hidden />{sede.activa ? t.desactivar : t.activar}</Button></div>}</div>
        <section aria-label={t.gUbicacion}><h3 className="mb-2 font-sans text-sm font-semibold">{t.gUbicacion}</h3>
          <dl className="grid gap-3 sm:grid-cols-3">{dt(t.ciudad, sede.ciudad)}{dt(t.direccion, sede.direccion)}{dt(t.telefono, sede.telefono)}</dl></section>
        <section aria-label={t.gImagenes}><h3 className="mb-2 font-sans text-sm font-semibold">{t.gImagenes}</h3>
          <div className="grid gap-3 sm:grid-cols-2">{imagen(t.portada, sede.imagen_url, sede.imagen_creditos)}{imagen(t.restaurante, sede.restaurante_imagen_url, sede.restaurante_imagen_creditos)}</div></section>
        {canEdit && <section aria-label={t.gRecursos}><h3 className="font-sans text-sm font-semibold">{t.gRecursos}</h3><p className="mb-2 text-xs text-neutro-500">{t.recursosAyuda}</p>
          {resumen.isError ? <p role="alert" className="text-sm text-error-700">{t.recursosError}</p>
            : <ul className="grid gap-2 sm:grid-cols-2">{Object.keys(RUTAS).map(key => <li key={key} className="flex items-center justify-between gap-2 rounded-lg border border-neutro-200 px-3 py-2 text-sm">
              <span className="min-w-0"><span className="font-semibold tabular-nums">{counts ? counts[key] : '—'}</span> <span className="text-neutro-700">{t.recursos[key]}</span></span>
              <Button variant="ghost" size="sm" aria-label={t.verRecurso(t.recursos[key], sede.nombre)} onClick={() => open(key)}>{t.ver2}</Button></li>)}</ul>}</section>}
        <p className="text-xs text-neutro-500">{t.creada}: {date(sede.createdAt) || '—'} · {t.actualizada}: {date(sede.updatedAt) || '—'}</p>
      </div>
    </Modal>
  );
};
