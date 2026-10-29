import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, Search, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminScope } from "@/features/admin-core/AdminScopeContext";
import { formatAdminCalendarDate } from "@/features/admin-core/adminDates";
import { getTodayInGuatemala } from "@/features/crear-reserva/schemas/busquedaReservaSchema";
import { useSedesQuery } from "@/features/sedes/hooks/useSedes";
import { useAmenidadesQuery } from "@/features/amenidades/hooks/useAmenidades";
import { useAdminReservasAmenidadQuery, useUpdateEstadoReservaAmenidadMutation } from "@/features/amenidades/hooks/useReservasAmenidad";
import { AmenidadesAdminNav } from "@/features/amenidades/components/AmenidadesAdminNav";
import { AMENIDADES_ROUTES } from "@/features/amenidades/constants/routes";
import { useTextosGestionAmenidades } from "@/features/amenidades/gestionTextos";
import type { ReservaAmenidad } from "@/features/amenidades/types";
import { useLocale } from "@/i18n/LocaleContext";
import { cn } from "@/lib/cn";

const VISTAS = ["hoy", "proximas", "historial"] as const;
type Vista = typeof VISTAS[number];
const ESTADOS = ["confirmada", "usada", "cancelada"] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reservas de amenidades: hoy, próximas e historial, filtrables por la sede
 * global, amenidad, fecha y estado (en la URL). Solo una reserva confirmada
 * puede marcarse como usada o cancelarse (estados definitivos en el servidor).
 */
export const AdminReservasAmenidadesPage: React.FC = () => {
  const t = useTextosGestionAmenidades();
  const { locale } = useLocale();
  const { user } = useAuth();
  const { selectedSedeId } = useAdminScope();
  const reservasQuery = useAdminReservasAmenidadQuery(user?.id);
  const amenidadesQuery = useAmenidadesQuery();
  const sedesQuery = useSedesQuery();
  const updateMutation = useUpdateEstadoReservaAmenidadMutation();
  const [modalAction, setModalAction] = useState<{ reserva: ReservaAmenidad; nuevoEstado: "cancelada" | "usada" } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const sedesMap = useMemo(() => new Map((sedesQuery.data ?? []).map((sede) => [sede.id, sede.nombre])), [sedesQuery.data]);
  const amenidadesMap = useMemo(() => new Map((amenidadesQuery.data ?? []).map((a) => [a.id, a])), [amenidadesQuery.data]);
  const sedeDe = (r: ReservaAmenidad) => r.Amenidad?.sucursal_id ?? amenidadesMap.get(r.amenidad_id)?.sucursal_id ?? null;
  const reservas = useMemo(() => (reservasQuery.data ?? []).filter((r) => selectedSedeId === "all" || sedeDe(r) === selectedSedeId), [reservasQuery.data, selectedSedeId, amenidadesMap]);
  const amenidades = (amenidadesQuery.data ?? []).filter((a) => a.reservable !== false && (selectedSedeId === "all" || a.sucursal_id === selectedSedeId));

  const vista: Vista = (VISTAS as readonly string[]).includes(params.get("vista") ?? "") ? params.get("vista") as Vista : "hoy";
  const q = params.get("q") ?? "";
  const fecha = ISO_DATE.test(params.get("fecha") ?? "") ? params.get("fecha")! : "";
  const estado = (ESTADOS as readonly string[]).includes(params.get("estado") ?? "") ? params.get("estado")! : "";
  const amenidadFiltro = /^[1-9]\d*$/.test(params.get("amenidad") ?? "") ? Number(params.get("amenidad")) : null;

  const today = getTodayInGuatemala();
  const porVista = useMemo(() => {
    const key = (r: ReservaAmenidad) => `${r.fecha} ${r.franja_horaria}`;
    const asc = (a: ReservaAmenidad, b: ReservaAmenidad) => key(a).localeCompare(key(b)) || a.id - b.id;
    return {
      hoy: reservas.filter((r) => r.fecha === today).sort(asc),
      proximas: reservas.filter((r) => r.estado === "confirmada" && r.fecha > today).sort(asc),
      historial: reservas.filter((r) => r.fecha < today).sort((a, b) => asc(b, a)),
    } satisfies Record<Vista, ReservaAmenidad[]>;
  }, [reservas, today]);

  const term = q.trim().toLowerCase().replace(/^#/, "");
  const filtradas = porVista[vista].filter((r) =>
    (!term || [String(r.id), r.Usuario?.nombre, r.Usuario?.email].some((v) => v?.toLowerCase().includes(term))) &&
    (!fecha || r.fecha === fecha) && (!estado || r.estado === estado) && (amenidadFiltro === null || r.amenidad_id === amenidadFiltro));
  const hasFilters = Boolean(q || fecha || estado || amenidadFiltro);
  const amenidadNombre = amenidadFiltro !== null ? amenidadesMap.get(amenidadFiltro)?.nombre ?? `#${amenidadFiltro}` : "";
  const date = (v: string) => formatAdminCalendarDate(v, locale);
  const estadoClase = (e: string) => e === "confirmada" ? "border-exito-600/20 bg-exito-50 text-exito-700" : e === "usada" ? "border-info-600/20 bg-info-50 text-info-700" : "border-neutro-300 bg-neutro-100 text-neutro-600";
  const estadoLabel = (e: string) => t.estados[e as keyof typeof t.estados] ?? e;
  const mobiliario = (m?: string | null) => !m ? "—" : t.mobiliario[m] ?? m;
  const sede = (r: ReservaAmenidad) => { const id = sedeDe(r); return id == null ? "—" : sedesMap.get(id) ?? `#${id}`; };

  const confirmarAccion = async () => {
    if (!modalAction) return;
    setActionError(null);
    try {
      await updateMutation.mutateAsync({ id: modalAction.reserva.id, estado: modalAction.nuevoEstado });
      setModalAction(null);
    } catch (err: any) {
      const code = err?.code || err?.response?.data?.code;
      setActionError(code === "AMENITY_RESERVATION_STATUS_FINAL" ? t.estadoFinal : err?.message || t.errorActualizar);
    }
  };
  const acciones = (r: ReservaAmenidad) => r.estado !== "confirmada" ? null : <div className="flex items-center justify-end gap-1">
    <Button type="button" variant="ghost" size="sm" aria-label={t.usadaDe(r.id)} onClick={() => { setActionError(null); setModalAction({ reserva: r, nuevoEstado: "usada" }); }}><CheckCircle2 className="size-4" aria-hidden="true" /><span className="hidden 2xl:inline">{t.marcarUsada}</span></Button>
    <Button type="button" variant="ghost" size="sm" className="text-error-700 hover:bg-error-50" aria-label={t.cancelarDe(r.id)} onClick={() => { setActionError(null); setModalAction({ reserva: r, nuevoEstado: "cancelada" }); }}><XCircle className="size-4" aria-hidden="true" /><span className="hidden 2xl:inline">{t.cancelarReserva}</span></Button>
  </div>;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header>
        <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.reservas}</h1>
        {reservasQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.reservasResumen(reservas.length)} · {t.hoy} {date(today)}</p>}
      </header>
      <AmenidadesAdminNav />

      {reservasQuery.isPending && <LoadingNotice label={t.cargando} />}
      {reservasQuery.isError && <Alert tone="error" title={t.errorReservas}><Button className="mt-2" variant="secondary" onClick={() => void reservasQuery.refetch()}>{t.reintentar}</Button></Alert>}

      {reservasQuery.isSuccess && <>
        <div role="group" aria-label={t.vistasLabel} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
          {VISTAS.map((key) => <button key={key} type="button" aria-pressed={vista === key} onClick={() => update({ vista: key === "hoy" ? null : key })}
            className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors", vista === key ? "bg-bronce-50 text-bronce-800" : "text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900")}>
            {t.vistas[key]}<span className={cn("rounded-full px-1.5 text-xs tabular-nums", vista === key ? "bg-bronce-600 text-white" : "bg-neutro-100 text-neutro-700")}>{porVista[key].length}</span>
          </button>)}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <label className="relative min-w-0 sm:col-span-2 xl:col-span-1"><span className="sr-only">{t.buscarReserva}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscarReserva} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.amenidad}</span>
            <select value={amenidadFiltro ?? ""} onChange={(event) => update({ amenidad: event.target.value || null })} className="field-control">
              <option value="">{t.todasAmenidades}</option>
              {amenidades.map((a) => <option key={a.id} value={a.id} lang="es">{a.nombre}</option>)}
            </select></label>
          {vista !== "hoy" && <label className="min-w-0"><span className="sr-only">{t.fecha}</span>
            <input type="date" value={fecha} aria-label={t.fecha} onChange={(event) => update({ fecha: event.target.value || null })} className="field-control" /></label>}
          <label className="min-w-0"><span className="sr-only">{t.estado}</span>
            <select value={estado} onChange={(event) => update({ estado: event.target.value || null })} className="field-control">
              <option value="">{t.todosEstados}</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{estadoLabel(e)}</option>)}
            </select></label>
        </div>
        {hasFilters && <div className="flex flex-wrap items-center gap-2">
          {amenidadFiltro !== null && <button type="button" onClick={() => update({ amenidad: null })} aria-label={t.quitarAmenidad} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bronce-200 bg-bronce-50 px-3 text-xs font-medium text-bronce-800 hover:border-bronce-400"><span lang="es">{t.filtroAmenidad(amenidadNombre)}</span><X className="size-3.5" aria-hidden="true" /></button>}
          <Button variant="text" size="sm" onClick={() => update({ q: null, fecha: null, estado: null, amenidad: null })}>{t.limpiar}</Button>
        </div>}

        {filtradas.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{hasFilters ? t.vacioR.filtros : t.vacioR[vista]}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t.vistas[vista]}</caption>
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-3 py-3">{t.colR.reserva}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.fechaHora}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.amenidad}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.cliente}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.mobiliario}</th>
                  <th scope="col" className="px-3 py-3">{t.colR.estado}</th>
                  <th scope="col" className="px-3 py-3 text-right"><span className="sr-only">{t.colR.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtradas.map((r) => <tr key={r.id} className="hover:bg-bronce-50/40">
                  <td className="whitespace-nowrap px-3 py-2.5"><Link to={AMENIDADES_ROUTES.ADMIN_DETALLE_RESERVA(r.id)} aria-label={t.verReserva(r.id)} className="inline-flex min-h-9 items-center gap-1 font-semibold text-bronce-700 hover:underline">#{r.id}<ChevronRight className="size-3.5" aria-hidden="true" /></Link></td>
                  <td className="whitespace-nowrap px-3 py-2.5"><span className={cn("font-medium", r.fecha === today ? "text-bronce-800" : "text-neutro-900")}>{date(r.fecha)}</span><span className="block text-xs tabular-nums text-neutro-600">{r.franja_horaria.replace("-", " – ")}</span></td>
                  <td className="px-3 py-2.5"><span className="block font-medium text-neutro-900" lang="es">{r.Amenidad?.nombre ?? amenidadesMap.get(r.amenidad_id)?.nombre ?? `#${r.amenidad_id}`}</span><span className="block text-xs text-neutro-500" lang="es">{sede(r)}</span></td>
                  <td className="px-3 py-2.5"><span className="block text-neutro-900">{r.Usuario?.nombre ?? "—"}</span><span className="hidden max-w-[14rem] truncate text-xs text-neutro-500 2xl:block">{r.Usuario?.email}</span></td>
                  <td className="px-3 py-2.5 text-neutro-700">{mobiliario(r.mobiliario)}</td>
                  <td className="px-3 py-2.5"><span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", estadoClase(r.estado))}>{estadoLabel(r.estado)}</span></td>
                  <td className="px-3 py-1.5">{acciones(r)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
            {filtradas.map((r) => <li key={r.id} className="flex flex-col gap-2 px-4 py-3">
              <Link to={AMENIDADES_ROUTES.ADMIN_DETALLE_RESERVA(r.id)} aria-label={t.verReserva(r.id)} className="flex items-start justify-between gap-3">
                <span className="min-w-0 space-y-0.5">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900">#{r.id}</span><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", estadoClase(r.estado))}>{estadoLabel(r.estado)}</span></span>
                  <span className="block text-sm text-neutro-800">{date(r.fecha)} · {r.franja_horaria.replace("-", " – ")}</span>
                  <span className="block truncate text-xs text-neutro-600" lang="es">{r.Amenidad?.nombre ?? amenidadesMap.get(r.amenidad_id)?.nombre} · {sede(r)}</span>
                  <span className="block truncate text-xs text-neutro-600">{r.Usuario?.nombre ?? "—"} · {mobiliario(r.mobiliario)}</span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
              </Link>
              {acciones(r) && <div className="-ml-2">{acciones(r)}</div>}
            </li>)}
          </ul>
        </>}
      </>}

      <Modal open={Boolean(modalAction)} onClose={() => { if (!updateMutation.isPending) { setModalAction(null); setActionError(null); } }}
        title={t.confirmarTitulo} description={modalAction ? `#${modalAction.reserva.id} · ${modalAction.reserva.Amenidad?.nombre ?? ""}` : undefined}>
        <div className="flex flex-col gap-4">
          {actionError && <Alert tone="error">{actionError}</Alert>}
          <p className="text-sm text-neutro-700">{modalAction?.nuevoEstado === "usada" ? t.confirmarUsada : t.confirmarCancelar}</p>
          <div className="flex justify-end gap-3 border-t border-neutro-200 pt-4">
            <Button type="button" variant="ghost" disabled={updateMutation.isPending} onClick={() => { setModalAction(null); setActionError(null); }}>{t.cerrar}</Button>
            <Button type="button" variant={modalAction?.nuevoEstado === "cancelada" ? "danger" : "primary"} disabled={updateMutation.isPending} onClick={() => void confirmarAccion()}>
              {updateMutation.isPending ? t.procesando : t.confirmar}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
