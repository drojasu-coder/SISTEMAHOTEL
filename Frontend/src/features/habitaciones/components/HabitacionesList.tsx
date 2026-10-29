import React from "react";
import { Link } from "react-router-dom";
import { Bed, CalendarCheck, Pencil, RefreshCw } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatGTQ } from "../textos";
import { useTextosInventario } from "../inventarioTextos";
import type { Habitacion, TipoHabitacion, EstadoHabitacion } from "../types";
import type { Sucursal } from "@/features/sedes/types";

interface HabitacionesListProps {
  habitaciones: Habitacion[];
  sedesMap: Map<number, Sucursal>;
  tiposMap: Map<number, TipoHabitacion>;
  /** Acción principal de la fila: edición completa o solo estado físico, según el rol. */
  action?: "editar" | "estado";
  onEdit: (habitacion: Habitacion) => void;
  /** Enlace a las reservas de la habitación (solo roles que gestionan reservas). */
  showReservas?: boolean;
  /** La columna de sede solo aporta cuando se ven varias sedes. */
  showSite?: boolean;
  /** La tarifa es información comercial: se oculta al rol que solo cambia el estado físico. */
  showTarifa?: boolean;
}

export const estadoBadge: Record<EstadoHabitacion, string> = {
  disponible: "border-exito-600/20 bg-exito-50 text-exito-700",
  ocupada: "border-info-600/20 bg-info-50 text-info-700",
  mantenimiento: "border-advertencia-600/20 bg-advertencia-50 text-advertencia-700",
  limpieza: "border-bronce-600/20 bg-bronce-50 text-bronce-800",
};

/** Inventario en tabla compacta (escritorio) o filas (móvil); un estado no reconocido nunca se muestra como «Disponible». */
export const HabitacionesList: React.FC<HabitacionesListProps> = ({ habitaciones, sedesMap, tiposMap, action, onEdit, showReservas = false, showSite = true, showTarifa = true }) => {
  const t = useTextosInventario();
  const rows = habitaciones.map((hab) => {
    const tipo = hab.TipoHabitacion ?? tiposMap.get(hab.tipo_habitacion_id);
    return {
      hab, tipo,
      sede: (hab.Sucursal ?? sedesMap.get(hab.sucursal_id))?.nombre ?? t.sinSede,
      tarifa: tipo?.tarifa_noche != null && tipo.tarifa_noche !== "" ? formatGTQ(tipo.tarifa_noche) : t.sinTarifa,
      badge: estadoBadge[hab.estado] ?? "border-neutro-300 bg-neutro-100 text-neutro-700",
      estado: t.estados[hab.estado] ?? t.estadoDesconocido,
    };
  });
  const thumb = (hab: Habitacion, size: string) => hab.imagen_url
    ? <img src={hab.imagen_url} alt="" loading="lazy" className={cn(size, "shrink-0 rounded-md border border-neutro-200 object-cover")} />
    : <span className={cn(size, "flex shrink-0 items-center justify-center rounded-md border border-neutro-200 bg-neutro-100 text-neutro-400")}><Bed className="size-4" aria-hidden="true" /></span>;
  const actions = (hab: Habitacion, compact = false) => <div className={cn("flex items-center gap-1", compact ? "" : "justify-end")}>
    {showReservas && <Link to={`/admin/reservas?vista=todas&q=${encodeURIComponent(hab.numero)}`} aria-label={t.reservasDe(hab.numero)}
      className={buttonStyles({ variant: "ghost", size: "sm", className: "gap-1.5" })}><CalendarCheck className="size-4" aria-hidden="true" /><span className={compact ? "sr-only" : "hidden xl:inline"}>{t.reservas}</span></Link>}
    {action && <button type="button" onClick={() => onEdit(hab)} aria-label={action === "estado" ? t.estadoDe(hab.numero) : t.editarDe(hab.numero)}
      className={buttonStyles({ variant: "ghost", size: "sm", className: "gap-1.5" })}>
      {action === "estado" ? <RefreshCw className="size-4" aria-hidden="true" /> : <Pencil className="size-4" aria-hidden="true" />}
      <span className={compact && action !== "estado" ? "sr-only" : action === "estado" ? "" : "hidden xl:inline"}>{action === "estado" ? t.cambiarEstado : t.editar}</span>
    </button>}
  </div>;

  return <>
    <div className="relative hidden overflow-x-auto rounded-xl border border-neutro-200 bg-white md:block">
      <table className="w-full text-left text-sm text-neutro-800">
        <thead className="border-b border-neutro-200 bg-neutro-50 text-xs font-semibold text-neutro-600">
          <tr>
            <th scope="col" className="px-4 py-3">{t.col.habitacion}</th>
            <th scope="col" className="px-4 py-3">{t.col.tipo}</th>
            {showSite && <th scope="col" className="px-4 py-3">{t.col.sede}</th>}
            {showTarifa && <th scope="col" className="px-4 py-3 text-right">{t.col.tarifa}</th>}
            <th scope="col" className="px-4 py-3">{t.col.estado}</th>
            {(action || showReservas) && <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">{t.col.acciones}</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutro-100">
          {rows.map(({ hab, tipo, sede, tarifa, badge, estado }) => <tr key={hab.id} className="hover:bg-bronce-50/40">
            <td className="px-4 py-2.5"><span className="flex items-center gap-3">{thumb(hab, "size-9")}<span className="font-semibold text-neutro-900">{t.habitacion(hab.numero)}</span></span></td>
            <td className="px-4 py-2.5"><span className="block font-medium">{tipo?.nombre ?? t.sinTipo}</span>
              {tipo?.capacidad_maxima !== undefined && <span className="block text-xs text-neutro-500">{t.personas(tipo.capacidad_maxima)}</span>}</td>
            {showSite && <td className="px-4 py-2.5 text-neutro-700">{sede}</td>}
            {showTarifa && <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{tarifa}</td>}
            <td className="px-4 py-2.5"><span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", badge)}>{estado}</span></td>
            {(action || showReservas) && <td className="px-4 py-1.5">{actions(hab)}</td>}
          </tr>)}
        </tbody>
      </table>
    </div>

    <ul className="divide-y divide-neutro-200 overflow-hidden rounded-xl border border-neutro-200 bg-white md:hidden">
      {rows.map(({ hab, tipo, sede, tarifa, badge, estado }) => <li key={hab.id} className="flex items-center gap-3 px-3 py-2.5">
        {thumb(hab, "size-11")}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-neutro-900">{t.habitacion(hab.numero)}</span>
            <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", badge)}>{estado}</span></span>
          <span className="block truncate text-xs text-neutro-600">{tipo?.nombre ?? t.sinTipo}{tipo?.capacidad_maxima !== undefined && ` · ${t.personas(tipo.capacidad_maxima)}`}</span>
          {(showTarifa || showSite) && <span className="block truncate text-xs text-neutro-600">{[showTarifa && tarifa, showSite && sede].filter(Boolean).join(" · ")}</span>}
        </span>
        {(action || showReservas) && actions(hab, true)}
      </li>)}
    </ul>
  </>;
};
