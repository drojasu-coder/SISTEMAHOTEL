import React, { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Alert, LoadingNotice } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/AuthContext";
import { useAdminScope } from "@/features/admin-core/AdminScopeContext";
import { estadoReservaMesa } from "../estadoReservaMesa";
import { useTextosAdminRestaurante } from "../adminTextos";
import { useLocale } from "@/i18n/LocaleContext";
import { formatAdminCalendarDate, formatAdminTimeOfDay } from "@/features/admin-core/adminDates";
import { getTodayInGuatemala } from "@/features/crear-reserva/schemas/busquedaReservaSchema";
import { useTextosGestionMesas } from "@/features/mesas/gestionTextos";
import {
  useAdminReservasMesaQuery,
  useUpdateEstadoReservaMesaMutation,
} from "../hooks/useReservasMesa";
import { RESTAURANTE_ROUTES } from "../constants/routes";
import type { ReservaMesa } from "../types";
import { ApiError } from "@/api/client/http";
import { ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

const VISTAS = ["hoy", "proximas", "canceladas", "todas"] as const;
type Vista = typeof VISTAS[number];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reservas de restaurante como herramienta de trabajo: hoy, próximas,
 * canceladas y el registro completo, con búsqueda, fecha, estado y mesa en la
 * URL. Los únicos estados son confirmada y cancelada; las acciones (cancelar o
 * reactivar con confirmación) son las existentes.
 */
export const AdminReservasRestauranteList: React.FC = () => {
  const { status, user } = useAuth();
  const t = useTextosAdminRestaurante();
  const g = useTextosGestionMesas();
  const { locale } = useLocale();
  const isAdmin = status === "authenticated" && (user?.rol === "admin" || user?.rol === "gerente_habitaciones" || user?.rol === "gerente_restaurante");
  // La sede del selector global del panel se aplica en el servidor.
  const { selectedSedeId } = useAdminScope();
  const { data: reservas = [], isLoading, isError, refetch } = useAdminReservasMesaQuery(user?.id, isAdmin, selectedSedeId);
  const updateMutation = useUpdateEstadoReservaMesaMutation();
  const [params, setParams] = useSearchParams();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const vista: Vista = (VISTAS as readonly string[]).includes(params.get("vista") ?? "") ? params.get("vista") as Vista : "hoy";
  const q = params.get("q") ?? "";
  const fecha = ISO_DATE.test(params.get("fecha") ?? "") ? params.get("fecha")! : "";
  const estadoFiltro = ["confirmada", "cancelada"].includes(params.get("estado") ?? "") ? params.get("estado")! : "";
  const mesaFiltro = /^[1-9]\d*$/.test(params.get("mesa") ?? "") ? Number(params.get("mesa")) : null;

  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [modalAction, setModalAction] = useState<{ reserva: ReservaMesa; nuevoEstado: "confirmada" | "cancelada" } | null>(null);

  const today = getTodayInGuatemala();
  const porVista = useMemo(() => {
    const asc = (a: ReservaMesa, b: ReservaMesa) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`) || a.id - b.id;
    return {
      hoy: reservas.filter((r) => r.fecha === today).sort(asc),
      proximas: reservas.filter((r) => r.estado === "confirmada" && r.fecha > today).sort(asc),
      canceladas: reservas.filter((r) => r.estado === "cancelada").sort((a, b) => asc(b, a)),
      todas: [...reservas].sort((a, b) => asc(b, a)),
    } satisfies Record<Vista, ReservaMesa[]>;
  }, [reservas, today]);

  const term = q.trim().toLowerCase().replace(/^#/, "");
  const filtradas = porVista[vista].filter((r) =>
    (!term || [String(r.id), String(r.mesa_id), r.Usuario?.nombre, r.Usuario?.email, r.Mesa?.zona].some((v) => v?.toLowerCase().includes(term))) &&
    (!fecha || r.fecha === fecha) &&
    (vista !== "todas" || !estadoFiltro || r.estado === estadoFiltro) &&
    (mesaFiltro === null || r.mesa_id === mesaFiltro));
  const hasFilters = Boolean(q || fecha || estadoFiltro || mesaFiltro);
  const showSite = selectedSedeId === "all";
  const date = (value: string) => formatAdminCalendarDate(value, locale);
  const time = (value: string) => formatAdminTimeOfDay(value, locale);

  const handleOpenActionModal = (
    reserva: ReservaMesa,
    nuevoEstado: "confirmada" | "cancelada"
  ) => {
    setFeedback(null);
    setModalAction({ reserva, nuevoEstado });
  };

  const handleConfirmAction = async () => {
    if (!modalAction) return;

    try {
      await updateMutation.mutateAsync({
        id: modalAction.reserva.id,
        data: { estado: modalAction.nuevoEstado },
      });

      setFeedback({
        tone: "success",
        message: t.estadoActualizadoExito,
      });
      setModalAction(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === "TABLE_UNAVAILABLE" || err.code === "TABLE_IN_MAINTENANCE") {
          setFeedback({
            tone: "error",
            message: t.errorConflictoReactivacion,
          });
        } else {
          setFeedback({
            tone: "error",
            message: err.message || t.errorActualizarEstado,
          });
        }
      } else {
        setFeedback({
          tone: "error",
          message: t.errorActualizarEstado,
        });
      }
      setModalAction(null);
    }
  };

  const acciones = (r: ReservaMesa) => r.estado === "cancelada"
    ? <Button variant="ghost" size="sm" aria-label={t.reactivarAria(r.id)} onClick={() => handleOpenActionModal(r, "confirmada")}>{t.reactivarReserva}</Button>
    : r.estado === "confirmada"
      ? <Button variant="ghost" size="sm" className="text-error-700 hover:bg-error-50" aria-label={t.cancelarAria(r.id)} onClick={() => handleOpenActionModal(r, "cancelada")}>{t.cancelarReserva}</Button>
      : null;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-5 pb-12">
      <header>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{g.reservasTitulo}</h1>
        {!isLoading && !isError && <p className="mt-1 text-sm text-neutro-600">{g.reservasResumen(reservas.length)} · {g.hoy} {date(today)}</p>}
      </header>

      {feedback && <Alert tone={feedback.tone}>
        <div className="flex items-center justify-between gap-4"><span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} aria-label={t.cerrarBoton} className="rounded p-1 hover:bg-black/5"><X className="size-4" aria-hidden="true" /></button></div>
      </Alert>}

      {isLoading && <LoadingNotice label={t.cargando} />}
      {isError && <Alert tone="error" title={t.errorCargar}><Button className="mt-2" variant="secondary" onClick={() => void refetch()}>{t.reintentar}</Button></Alert>}

      {!isLoading && !isError && <>
        <div role="group" aria-label={g.vistasLabel} className="flex gap-1 overflow-x-auto rounded-xl border border-neutro-200 bg-white p-1">
          {VISTAS.map((key) => <button key={key} type="button" aria-pressed={vista === key} onClick={() => update({ vista: key === "hoy" ? null : key, estado: null })}
            className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors", vista === key ? "bg-bronce-50 text-bronce-800" : "text-neutro-600 hover:bg-neutro-50 hover:text-neutro-900")}>
            {g.vistas[key]}
            <span className={cn("rounded-full px-1.5 text-xs tabular-nums", vista === key ? "bg-bronce-600 text-white" : "bg-neutro-100 text-neutro-700")}>{porVista[key].length}</span>
          </button>)}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
          <label className="relative min-w-0 sm:col-span-2 lg:col-span-1"><span className="sr-only">{g.buscarReserva}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-500" aria-hidden="true" />
            <input type="search" value={q} placeholder={g.buscarReserva} onChange={(event) => update({ q: event.target.value || null })} className="field-control !pl-9" /></label>
          {vista !== "hoy" && <label className="min-w-0"><span className="sr-only">{g.fechaFiltro}</span>
            <input type="date" value={fecha} aria-label={g.fechaFiltro} onChange={(event) => update({ fecha: event.target.value || null })} className="field-control" /></label>}
          {vista === "todas" && <label className="min-w-0"><span className="sr-only">{g.estadoReserva}</span>
            <select value={estadoFiltro} onChange={(event) => update({ estado: event.target.value || null })} className="field-control">
              <option value="">{g.todosEstadosReserva}</option>
              <option value="confirmada">{t.estados.confirmada}</option>
              <option value="cancelada">{t.estados.cancelada}</option>
            </select></label>}
        </div>
        {hasFilters && <div className="flex flex-wrap items-center gap-2">
          {mesaFiltro !== null && <button type="button" onClick={() => update({ mesa: null })} aria-label={g.quitarMesa} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-bronce-200 bg-bronce-50 px-3 text-xs font-medium text-bronce-800 hover:border-bronce-400">{g.filtroMesa(mesaFiltro)}<X className="size-3.5" aria-hidden="true" /></button>}
          <Button variant="text" size="sm" onClick={() => update({ q: null, fecha: null, estado: null, mesa: null })}>{g.limpiar}</Button>
        </div>}

        {filtradas.length === 0 ? <p role="status" className="rounded-xl border border-dashed border-neutro-300 bg-white px-4 py-10 text-center text-sm text-neutro-600">{hasFilters ? g.vacioR.filtros : g.vacioR[vista]}</p> : <>
          <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white xl:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{g.vistas[vista]}</caption>
              <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
                <tr>
                  <th scope="col" className="px-4 py-3">{g.colR.reserva}</th>
                  <th scope="col" className="px-4 py-3">{g.colR.fechaHora}</th>
                  <th scope="col" className="px-4 py-3">{g.colR.mesa}</th>
                  <th scope="col" className="px-4 py-3">{g.colR.cliente}</th>
                  <th scope="col" className="px-4 py-3">{g.colR.comensales}</th>
                  <th scope="col" className="px-4 py-3">{g.colR.estado}</th>
                  <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">{g.colR.acciones}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {filtradas.map((r) => {
                  const estado = estadoReservaMesa(r.estado, t.estados);
                  return <tr key={r.id} className="hover:bg-bronce-50/40">
                    <td className="whitespace-nowrap px-4 py-2.5"><Link to={RESTAURANTE_ROUTES.ADMIN_DETALLE_RESERVA(r.id)} aria-label={g.verReserva(r.id)} className="inline-flex min-h-9 items-center gap-1 font-semibold text-bronce-700 hover:underline">#{r.id}<ChevronRight className="size-3.5" aria-hidden="true" /></Link></td>
                    <td className="whitespace-nowrap px-4 py-2.5"><span className={cn("font-medium", r.fecha === today ? "text-bronce-800" : "text-neutro-900")}>{date(r.fecha)}</span><span className="block text-xs text-neutro-600">{time(r.hora)}</span></td>
                    <td className="px-4 py-2.5"><span className="block font-medium text-neutro-900">{t.mesa(r.mesa_id)}</span>
                      <span className="block text-xs text-neutro-600" lang="es">{r.Mesa?.zona}{showSite && ` · ${r.Mesa?.Sucursal?.nombre ?? t.sedeId(r.Mesa?.sucursal_id ?? "")}`}</span></td>
                    <td className="px-4 py-2.5"><span className="block text-neutro-900">{r.Usuario?.nombre || t.clienteSinNombre}</span>
                      <span className="hidden max-w-[14rem] truncate text-xs text-neutro-500 2xl:block">{r.Usuario?.email || t.usuarioId(r.usuario_id)}</span></td>
                    <td className="whitespace-nowrap px-4 py-2.5">{t.personas(r.numero_comensales)}</td>
                    <td className="px-4 py-2.5"><span title={estado.conocido ? undefined : t.estadoRegistrado(r.estado)} className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", estado.className)}>{estado.label}</span></td>
                    <td className="px-4 py-1.5 text-right">{acciones(r)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white xl:hidden">
            {filtradas.map((r) => {
              const estado = estadoReservaMesa(r.estado, t.estados);
              return <li key={r.id} className="flex flex-col gap-2 px-4 py-3">
                <Link to={RESTAURANTE_ROUTES.ADMIN_DETALLE_RESERVA(r.id)} aria-label={g.verReserva(r.id)} className="flex items-start justify-between gap-3">
                  <span className="min-w-0 space-y-0.5">
                    <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900">#{r.id}</span><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", estado.className)}>{estado.label}</span></span>
                    <span className="block text-sm text-neutro-800">{date(r.fecha)} · {time(r.hora)}</span>
                    <span className="block truncate text-xs text-neutro-600">{t.mesa(r.mesa_id)} · <span lang="es">{r.Mesa?.zona}</span>{showSite && ` · ${r.Mesa?.Sucursal?.nombre ?? ""}`}</span>
                    <span className="block truncate text-xs text-neutro-600">{r.Usuario?.nombre || t.clienteSinNombre} · {t.personas(r.numero_comensales)}</span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-neutro-400" aria-hidden="true" />
                </Link>
                {acciones(r) && <div className="-ml-2">{acciones(r)}</div>}
              </li>;
            })}
          </ul>
        </>}
      </>}

      {/* Modal de Confirmación de Cambio de Estado */}
      <Modal
        open={!!modalAction}
        onClose={() => setModalAction(null)}
        title={
          modalAction?.nuevoEstado === "cancelada"
            ? t.confirmarCancelarTitulo
            : t.confirmarReactivarTitulo
        }
        description={
          modalAction?.nuevoEstado === "cancelada"
            ? t.confirmarCancelarDesc
            : t.confirmarReactivarDesc
        }
      >
        <div className="space-y-4 pt-2">
          {modalAction && (
            <div className="rounded-md bg-neutro-50 p-4 border border-neutro-200 text-sm space-y-1">
              <p>
                <span className="font-semibold">{t.colId}:</span> #{modalAction.reserva.id}
              </p>
              <p>
                <span className="font-semibold">{t.colCliente}:</span>{" "}
                {modalAction.reserva.Usuario?.nombre} ({modalAction.reserva.Usuario?.email})
              </p>
              <p>
                <span className="font-semibold">{t.colMesa}:</span> {t.mesa(modalAction.reserva.mesa_id)}
              </p>
              <p>
                <span className="font-semibold">{t.fechaYHorario}:</span>{" "}
                {t.fechaHora(formatAdminCalendarDate(modalAction.reserva.fecha, locale), formatAdminTimeOfDay(modalAction.reserva.hora, locale))}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-neutro-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalAction(null)}
              disabled={updateMutation.isPending}
            >
              {t.cerrarBoton}
            </Button>
            <Button
              type="button"
              variant={modalAction?.nuevoEstado === "cancelada" ? "danger" : "primary"}
              onClick={handleConfirmAction}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t.procesando : t.confirmarBoton}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
