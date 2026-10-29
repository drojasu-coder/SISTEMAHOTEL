import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarCheck, ImageOff, Pencil, Plus, Search, X } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { useAuth } from "@/features/auth/AuthContext";
import { hasPermission } from "@/features/auth/permissions";
import { useAdminScope } from "@/features/admin-core/AdminScopeContext";
import { getTodayInGuatemala } from "@/features/crear-reserva/schemas/busquedaReservaSchema";
import { useSedesQuery } from "@/features/sedes/hooks/useSedes";
import { useAmenidadesQuery } from "@/features/amenidades/hooks/useAmenidades";
import { useAdminReservasAmenidadQuery } from "@/features/amenidades/hooks/useReservasAmenidad";
import { AmenidadFormModal } from "@/features/amenidades/components/AmenidadFormModal";
import { AmenidadesAdminNav } from "@/features/amenidades/components/AmenidadesAdminNav";
import { AMENIDADES_ROUTES } from "@/features/amenidades/constants/routes";
import { useTextosGestionAmenidades } from "@/features/amenidades/gestionTextos";
import type { Amenidad } from "@/features/amenidades/types";
import { getApiErrorMessage } from "@/api/errors";
import { cn } from "@/lib/cn";
import { HorarioBadge } from '@/components/ui/HorarioBadge';

/**
 * Amenidades e instalaciones: cada amenidad es la instalación física (no hay
 * un registro de instalación aparte). Filtros por la sede global, nombre,
 * acceso (con reserva o libre), aforo y fotografía; próximas reservas reales.
 */
export const AmenidadesPage: React.FC = () => {
  const t = useTextosGestionAmenidades();
  const { user } = useAuth();
  const canManage = user ? hasPermission(user.rol, "servicios.administrar") : false;
  const { selectedSedeId } = useAdminScope();
  const amenidadesQuery = useAmenidadesQuery();
  const sedesQuery = useSedesQuery();
  const reservasQuery = useAdminReservasAmenidadQuery(user?.id);
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Amenidad | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sedes = sedesQuery.data ?? [];
  const sedesMap = useMemo(() => new Map(sedes.map((sede) => [sede.id, sede.nombre])), [sedes]);
  const enSede = useMemo(() => (amenidadesQuery.data ?? []).filter((a) => selectedSedeId === "all" || a.sucursal_id === selectedSedeId), [amenidadesQuery.data, selectedSedeId]);
  const aforos = useMemo(() => [...new Set(enSede.map((a) => a.aforo_maximo).filter((n): n is number => typeof n === "number" && n > 0))].sort((a, b) => a - b), [enSede]);
  const today = getTodayInGuatemala();
  const proximas = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of reservasQuery.data ?? []) if (r.estado === "confirmada" && (r.fecha ?? "") >= today && r.amenidad_id) counts.set(r.amenidad_id, (counts.get(r.amenidad_id) ?? 0) + 1);
    return counts;
  }, [reservasQuery.data, today]);

  const q = params.get("q") ?? "";
  const acceso = ["reservable", "libre"].includes(params.get("acceso") ?? "") ? params.get("acceso")! : "";
  const aforo = aforos.map(String).includes(params.get("aforo") ?? "") ? params.get("aforo")! : "";
  const imagen = ["con", "sin"].includes(params.get("imagen") ?? "") ? params.get("imagen")! : "";
  const hasFilters = Boolean(q || acceso || aforo || imagen);
  const term = q.trim().toLowerCase();
  const esReservable = (a: Amenidad) => a.reservable !== false;
  const filtradas = enSede.filter((a) =>
    (!term || (a.nombre ?? "").toLowerCase().includes(term)) &&
    (!acceso || (acceso === "reservable") === esReservable(a)) &&
    (!aforo || (a.aforo_maximo ?? 0) >= Number(aforo)) &&
    (!imagen || (imagen === "con") === Boolean(a.imagen_url)));

  const openCreate = () => { setSelected(null); setModalOpen(true); };
  const openEdit = (a: Amenidad) => { setSelected(a); setModalOpen(true); };
  const sede = (a: Amenidad) => (a.sucursal_id != null && sedesMap.get(a.sucursal_id)) || `#${a.sucursal_id}`;
  const thumb = (a: Amenidad, size: string) => a.imagen_url
    ? <img src={a.imagen_url} alt="" loading="lazy" className={cn(size, "shrink-0 rounded-md border border-neutro-200 object-cover")} />
    : <span title={t.sinFoto} className={cn(size, "flex shrink-0 items-center justify-center rounded-md border border-dashed border-neutro-300 bg-neutro-50 text-neutro-400")}><ImageOff className="size-4" aria-hidden="true" /><span className="sr-only">{t.sinFoto}</span></span>;
  const accesoBadge = (a: Amenidad) => <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", esReservable(a) ? "border-bronce-600/20 bg-bronce-50 text-bronce-800" : "border-neutro-300 bg-neutro-100 text-neutro-600")}>{esReservable(a) ? t.reservable : t.informativa}</span>;
  const proximasCell = (a: Amenidad) => !esReservable(a) ? <span className="text-neutro-400">{t.noAplica}</span> : reservasQuery.isSuccess ? proximas.get(a.id ?? 0) ?? 0 : "—";
  const acciones = (a: Amenidad, compact = false) => <div className={cn("flex items-center gap-1", !compact && "justify-end")}>
    {esReservable(a) && <Link to={`${AMENIDADES_ROUTES.ADMIN_RESERVAS}?vista=proximas&amenidad=${a.id}`} aria-label={t.reservasDe(a.nombre ?? "")} className={buttonStyles({ variant: "ghost", size: "sm", className: "gap-1.5" })}>
      <CalendarCheck className="size-4" aria-hidden="true" /><span className={compact ? "sr-only" : "hidden 2xl:inline"}>{t.reservas}</span></Link>}
    {canManage && <button type="button" onClick={() => openEdit(a)} aria-label={t.editarDe(a.nombre ?? "")} className={buttonStyles({ variant: "ghost", size: "sm", className: "gap-1.5" })}>
      <Pencil className="size-4" aria-hidden="true" /><span className={compact ? "sr-only" : "hidden 2xl:inline"}>{t.editar}</span></button>}
  </div>;
  const isLoading = amenidadesQuery.isLoading || sedesQuery.isLoading;
  const isError = amenidadesQuery.isError || sedesQuery.isError;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutro-500">{t.modulo}</p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.nav.amenidades}</h1>
          {amenidadesQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.resumen(enSede.length, enSede.filter(esReservable).length)}</p>}
        </div>
        {canManage && <Button type="button" onClick={openCreate}><Plus className="size-4" aria-hidden="true" />{t.nueva}</Button>}
      </header>
      <AmenidadesAdminNav />

      {feedback && <Alert tone="success">
        <div className="flex items-center justify-between gap-4"><span>{feedback}</span>
          <button type="button" onClick={() => setFeedback(null)} aria-label={t.cerrar} className="rounded p-1 hover:bg-exito-100"><X className="size-4" aria-hidden="true" /></button></div>
      </Alert>}
      {isLoading && <LoadingNotice label={t.cargando} />}
      {isError && <Alert tone="error">
        <p>{getApiErrorMessage(amenidadesQuery.error || sedesQuery.error)}</p>
        <Button className="mt-3" variant="secondary" onClick={() => { void amenidadesQuery.refetch(); void sedesQuery.refetch(); }}>{t.reintentar}</Button>
      </Alert>}

      {!isLoading && !isError && enSede.length === 0 && <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.vacio}</p>}
      {!isLoading && !isError && enSede.length > 0 && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative min-w-0 sm:col-span-2 xl:col-span-1"><span className="sr-only">{t.buscar}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={t.buscar} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          <label className="min-w-0"><span className="sr-only">{t.acceso}</span>
            <select value={acceso} onChange={(event) => update({ acceso: event.target.value || null })} className="field-control">
              <option value="">{t.todosAccesos}</option>
              <option value="reservable">{t.reservable}</option>
              <option value="libre">{t.informativa}</option>
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.aforo}</span>
            <select value={aforo} onChange={(event) => update({ aforo: event.target.value || null })} className="field-control">
              <option value="">{t.cualquierAforo}</option>
              {aforos.map((n) => <option key={n} value={String(n)}>{t.aforoMin(n)}</option>)}
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.imagen}</span>
            <select value={imagen} onChange={(event) => update({ imagen: event.target.value || null })} className="field-control">
              <option value="">{t.todasImagenes}</option>
              <option value="con">{t.conImagen}</option>
              <option value="sin">{t.sinImagen}</option>
            </select></label>
        </div>
        {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, acceso: null, aforo: null, imagen: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}

        {filtradas.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinResultados}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white lg:block">
            <table className="w-full text-left text-sm text-neutro-800">
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-3 py-3">{t.col.amenidad}</th>
                  {selectedSedeId === "all" && <th scope="col" className="px-3 py-3">{t.col.sede}</th>}
                  <th scope="col" className="px-3 py-3">{t.col.acceso}</th>
                  <th scope="col" className="px-3 py-3">{t.col.aforo}</th>
                  <th scope="col" className="px-3 py-3">{t.col.proximas}</th>
                  <th scope="col" className="px-3 py-3 text-right"><span className="sr-only">{t.col.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtradas.map((a) => <tr key={a.id} className="hover:bg-bronce-50/40">
                  <td className="px-3 py-2.5"><span className="flex items-center gap-3">{thumb(a, "size-10")}<span className="flex flex-col items-start gap-1"><span className="font-semibold text-neutro-900" lang="es">{a.nombre}</span>{a.reservable !== false && <HorarioBadge registro={a} requiereDuracion />}</span></span></td>
                  {selectedSedeId === "all" && <td className="px-3 py-2.5" lang="es">{sede(a)}</td>}
                  <td className="px-3 py-2.5">{accesoBadge(a)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{a.aforo_maximo ? t.personas(a.aforo_maximo) : "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{proximasCell(a)}</td>
                  <td className="px-3 py-1.5">{acciones(a)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white lg:hidden">
            {filtradas.map((a) => <li key={a.id} className="flex items-center gap-3 px-3 py-3">
              {thumb(a, "size-12")}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900" lang="es">{a.nombre}</span>{accesoBadge(a)}{a.reservable !== false && <HorarioBadge registro={a} requiereDuracion />}</span>
                <span className="block truncate text-xs text-neutro-600">{selectedSedeId === "all" && <><span lang="es">{sede(a)}</span> · </>}{a.aforo_maximo ? t.personas(a.aforo_maximo) : "—"}{esReservable(a) && reservasQuery.isSuccess && ` · ${t.col.proximas}: ${proximas.get(a.id ?? 0) ?? 0}`}</span>
              </span>
              {acciones(a, true)}
            </li>)}
          </ul>
          <p className="text-xs text-neutro-500">{t.accesoNota}</p>
        </>}
      </>}

      {canManage && modalOpen && <AmenidadFormModal isOpen={modalOpen} initialData={selected} sedes={sedes} onClose={() => setModalOpen(false)} onSuccess={setFeedback} />}
    </div>
  );
};
