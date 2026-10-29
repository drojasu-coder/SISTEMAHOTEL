import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { useAuth } from "@/features/auth/AuthContext";
import { hasPermission } from "@/features/auth/permissions";
import { useAdminScope } from "@/features/admin-core/AdminScopeContext";
import { useSedesQuery } from "@/features/sedes/hooks/useSedes";
import { useHabitacionesQuery, useTiposHabitacionQuery } from "@/features/habitaciones/hooks/useHabitaciones";
import { HabitacionesList, estadoBadge } from "@/features/habitaciones/components/HabitacionesList";
import { HabitacionFormModal } from "@/features/habitaciones/components/HabitacionFormModal";
import { EstadoHabitacionModal } from "@/features/habitaciones/components/EstadoHabitacionModal";
import { textosHabitaciones } from "@/features/habitaciones/textos";
import { useTextosInventario } from "@/features/habitaciones/inventarioTextos";
import { ESTADOS_HABITACION, type Habitacion } from "@/features/habitaciones/types";
import { getApiErrorMessage } from "@/api/errors";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 25;

/**
 * Inventario de habitaciones. El estado físico (disponible, limpieza…) es la
 * condición registrada de cada habitación y se presenta separado de las
 * estancias confirmadas. Filtros en la URL para conservarlos al navegar.
 */
export const HabitacionesPage: React.FC = () => {
  const t = useTextosInventario();
  const { user } = useAuth();
  const stateOnly = user?.rol === "empleado_operativo";
  const { selectedSedeId, sedes: authorizedSedes, isGlobalScope } = useAdminScope();
  const canManage = user ? hasPermission(user.rol, "habitaciones.gestionar") : false;
  const canReservas = user ? hasPermission(user.rol, "reservas.gestionar") : false;

  // La sede del selector global se aplica en el servidor.
  const habitacionesQuery = useHabitacionesQuery(selectedSedeId);
  const tiposQuery = useTiposHabitacionQuery();
  const sedesQuery = useSedesQuery();
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    if (!("pagina" in changes)) next.delete("pagina");
    setParams(next, { replace: true });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHabitacion, setSelectedHabitacion] = useState<Habitacion | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const sedes = useMemo(() => (sedesQuery.data ?? []).filter((s) => isGlobalScope || authorizedSedes.some((allowed) => allowed.id === s.id)), [sedesQuery.data, authorizedSedes, isGlobalScope]);
  const tipos = tiposQuery.data ?? [];
  const habitaciones = habitacionesQuery.data ?? [];
  const sedesMap = useMemo(() => new Map(sedes.map((s) => [s.id, s])), [sedes]);
  const tiposMap = useMemo(() => new Map(tipos.map((tp) => [tp.id, tp])), [tipos]);
  const tipoDe = (hab: Habitacion) => hab.TipoHabitacion ?? tiposMap.get(hab.tipo_habitacion_id);

  // Opciones derivadas del inventario visible: tipos por nombre (cambian de id entre sedes) y capacidades reales.
  const tipoOptions = useMemo(() => [...new Set(habitaciones.map((hab) => tipoDe(hab)?.nombre).filter((n): n is string => Boolean(n)))].sort((a, b) => a.localeCompare(b)), [habitaciones, tiposMap]);
  const capacidades = useMemo(() => [...new Set(habitaciones.map((hab) => tipoDe(hab)?.capacidad_maxima).filter((n): n is number => typeof n === "number" && n > 0))].sort((a, b) => a - b), [habitaciones, tiposMap]);

  const search = params.get("q") ?? "";
  const estado = (ESTADOS_HABITACION as readonly string[]).includes(params.get("estado") ?? "") ? params.get("estado")! : "";
  const tipo = tipoOptions.includes(params.get("tipo") ?? "") ? params.get("tipo")! : "";
  const capacidad = capacidades.map(String).includes(params.get("capacidad") ?? "") ? params.get("capacidad")! : "";
  const hasFilters = Boolean(search || estado || tipo || capacidad);

  const base = habitaciones.filter((hab) =>
    (!search.trim() || hab.numero.toLowerCase().includes(search.trim().toLowerCase())) &&
    (!tipo || tipoDe(hab)?.nombre === tipo) &&
    (!capacidad || (tipoDe(hab)?.capacidad_maxima ?? 0) >= Number(capacidad)));
  // Los contadores por estado reflejan los demás filtros, para que sumen lo que se ve.
  const counts = Object.fromEntries(ESTADOS_HABITACION.map((key) => [key, base.filter((hab) => hab.estado === key).length])) as Record<string, number>;
  const filtered = estado ? base.filter((hab) => hab.estado === estado) : base;

  const rawPage = Number(params.get("pagina"));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 ? Math.min(rawPage, totalPages) : 1;
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setSelectedHabitacion(null); setModalOpen(true); };
  const openEdit = (hab: Habitacion) => { setSelectedHabitacion(hab); setModalOpen(true); };
  const isLoading = habitacionesQuery.isLoading || tiposQuery.isLoading || sedesQuery.isLoading;
  const isError = habitacionesQuery.isError || tiposQuery.isError || sedesQuery.isError;
  const errorObj = habitacionesQuery.error || tiposQuery.error || sedesQuery.error;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.titulo}</h1>
          {habitacionesQuery.isSuccess && <p className="mt-1 text-sm text-neutro-600">{t.resumen(habitaciones.length)}</p>}
        </div>
        {canManage && !stateOnly && <Button type="button" onClick={openCreate}><Plus className="size-4" aria-hidden="true" />{t.nueva}</Button>}
      </header>

      {feedbackMessage && <Alert tone="success">
        <div className="flex items-center justify-between gap-4"><span>{feedbackMessage}</span>
          <button type="button" onClick={() => setFeedbackMessage(null)} className="text-xs font-semibold underline hover:no-underline"><X className="size-4" aria-label="×" /></button></div>
      </Alert>}

      {isLoading && <LoadingNotice label={textosHabitaciones.cargando} />}
      {isError && <Alert tone="error" title={textosHabitaciones.errorCargar}>
        <p>{getApiErrorMessage(errorObj)}</p>
        <Button className="mt-3" variant="secondary" onClick={() => { void habitacionesQuery.refetch(); void tiposQuery.refetch(); void sedesQuery.refetch(); }}>{t.reintentar}</Button>
      </Alert>}

      {!isLoading && !isError && habitaciones.length === 0 && <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.vacio}</p>}

      {!isLoading && !isError && habitaciones.length > 0 && <>
        {/* Estado físico: filtro con conteo (no equivale a disponibilidad por fechas). */}
        <div className="space-y-1.5">
          <div role="group" aria-label={t.estadoFisico} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
            {(["", ...ESTADOS_HABITACION] as const).map((key) => <button key={key || "all"} type="button" aria-pressed={estado === key} onClick={() => update({ estado: key || null })}
              className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors", estado === key ? "bg-bronce-50 text-bronce-800" : "text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900")}>
              {key && <span aria-hidden="true" className={cn("size-2 rounded-full border", estadoBadge[key])} />}
              {key ? t.estados[key] : t.todos}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", estado === key ? "bg-bronce-600 text-white" : "bg-neutro-100 text-neutro-700")}>{key ? counts[key] : base.length}</span>
            </button>)}
          </div>
          <p className="text-xs text-neutro-500">{t.estadoFisico}: {t.estadoFisicoNota}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="relative min-w-0">
            <span className="sr-only">{t.buscar}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" inputMode="numeric" value={search} placeholder={t.buscar} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" />
          </label>
          <label className="min-w-0"><span className="sr-only">{t.tipo}</span>
            <select value={tipo} onChange={(event) => update({ tipo: event.target.value || null })} className="field-control">
              <option value="">{t.todosTipos}</option>
              {tipoOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </select></label>
          <label className="min-w-0"><span className="sr-only">{t.capacidad}</span>
            <select value={capacidad} onChange={(event) => update({ capacidad: event.target.value || null })} className="field-control">
              <option value="">{t.cualquierCapacidad}</option>
              {capacidades.map((n) => <option key={n} value={String(n)}>{t.capacidadMin(n)}</option>)}
            </select></label>
        </div>
        {hasFilters && <div><Button variant="text" size="sm" onClick={() => update({ q: null, estado: null, tipo: null, capacidad: null })}><X className="size-3.5" aria-hidden="true" />{t.limpiar}</Button></div>}

        {filtered.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{t.sinResultados}</p> : <>
          <HabitacionesList habitaciones={visible} sedesMap={sedesMap} tiposMap={tiposMap}
            action={canManage ? (stateOnly ? "estado" : "editar") : undefined} onEdit={openEdit}
            showReservas={canReservas} showSite={selectedSedeId === "all"} showTarifa={!stateOnly} />
          {totalPages > 1 && <nav className="flex items-center justify-between gap-3 text-xs text-neutro-600" aria-label={t.paginaDe(page, totalPages)}>
            <span>{t.pagina((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, filtered.length), filtered.length)}</span>
            <span className="flex items-center gap-1">
              <Button variant="ghost" size="sm" aria-label={t.anterior} disabled={page <= 1} onClick={() => update({ pagina: page - 1 > 1 ? String(page - 1) : null })}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
              <span className="px-1 font-medium text-neutro-900">{t.paginaDe(page, totalPages)}</span>
              <Button variant="ghost" size="sm" aria-label={t.siguiente} disabled={page >= totalPages} onClick={() => update({ pagina: String(page + 1) })}><ChevronRight className="size-4" aria-hidden="true" /></Button>
            </span>
          </nav>}
        </>}
      </>}

      {canManage && !stateOnly && <HabitacionFormModal open={modalOpen} onClose={() => setModalOpen(false)} habitacion={selectedHabitacion} sedes={sedes} tiposHabitacion={tipos} onSuccess={setFeedbackMessage} />}
      {stateOnly && <EstadoHabitacionModal open={modalOpen} habitacion={selectedHabitacion} onClose={() => setModalOpen(false)} onSuccess={setFeedbackMessage} />}
    </div>
  );
};
