import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { capitalizar, fechaCorta, hora, quetzales } from "../../lib/format";
import type { ReservaEvento, ReservaHabitacion, ReservaTransporte } from "../../lib/types";
import { Alert, Insignia, Spinner, tonoEstado, Vacio } from "../../components/ui";
import CuentaLayout from "./CuentaNav";

/** Solo habitaciones, eventos y transporte tienen listado para clientes en el backend actual. */
export default function MisReservas() {
  const { data, loading, reload } = useFetch(async () => {
    const [h, e, t] = await Promise.allSettled([
      api.get<ReservaHabitacion[]>("/reservas-habitacion"),
      api.get<ReservaEvento[]>("/reservas-evento"),
      api.get<ReservaTransporte[]>("/reservas-transporte"),
    ]);
    const v = <T,>(r: PromiseSettledResult<T[]>) => (r.status === "fulfilled" ? r.value : []);
    return { hab: v(h), eve: v(e), tra: v(t) };
  });
  const [error, setError] = useState<string | null>(null);

  async function cancelarEvento(id: number) {
    if (!confirm("¿Cancelar esta reserva de evento?")) return;
    setError(null);
    try { await api.patch(`/reservas-evento/${id}/cancelar`); await reload(); } catch (e) { setError(errorMessage(e)); }
  }

  const vacio = data && !data.hab.length && !data.eve.length && !data.tra.length;
  return (
    <CuentaLayout>
      {loading ? <Spinner /> : vacio ? (
        <Vacio titulo="Aún no tienes reservas" texto="Cuando reserves una habitación o un evento aparecerá aquí." accion={<Link to="/habitaciones" className="btn-primario">Reservar habitación</Link>} />
      ) : (
        <div className="space-y-10">
          {error && <Alert>{error}</Alert>}
          {!!data?.hab.length && (
            <section>
              <h2 className="font-serif text-2xl">Habitaciones</h2>
              <ul className="mt-4 space-y-3">
                {data.hab.map((r) => (
                  <li key={r.id} className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
                    <div><p className="font-medium">{fechaCorta(r.fecha_entrada)} → {fechaCorta(r.fecha_salida)}</p><p className="text-xs text-tinta-500">{r.numero_huespedes} huéspedes · {quetzales(r.total)}</p></div>
                    <Insignia tono={tonoEstado(r.estado)}>{capitalizar(r.estado)}</Insignia>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!!data?.eve.length && (
            <section>
              <h2 className="font-serif text-2xl">Eventos</h2>
              <ul className="mt-4 space-y-3">
                {data.eve.map((r) => (
                  <li key={r.id} className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
                    <div><p className="font-medium capitalize">{r.tipo_evento} · {fechaCorta(r.fecha)}</p><p className="text-xs text-tinta-500">{hora(r.hora_inicio)}–{hora(r.hora_fin)} · {r.numero_invitados} invitados · Total {quetzales(r.total)} · Anticipo {quetzales(r.anticipo)}</p></div>
                    <div className="flex items-center gap-3">
                      <Insignia tono={tonoEstado(r.estado)}>{capitalizar(r.estado)}</Insignia>
                      {["cotizacion", "confirmada"].includes(r.estado) && <button className="text-sm text-error underline" onClick={() => cancelarEvento(r.id)}>Cancelar</button>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!!data?.tra.length && (
            <section>
              <h2 className="font-serif text-2xl">Transporte</h2>
              <ul className="mt-4 space-y-3">
                {data.tra.map((r) => (
                  <li key={r.id} className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
                    <div><p className="font-medium">{r.origen} → {r.destino}</p><p className="text-xs text-tinta-500">{new Date(r.fecha_hora).toLocaleString("es-GT")} · {r.numero_pasajeros} pasajeros</p></div>
                    <Insignia tono={tonoEstado(r.estado)}>{capitalizar(r.estado)}</Insignia>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="text-xs text-tinta-400">Las reservas de restaurante, actividades, amenidades, spa y parque aún no se pueden listar desde la cuenta del cliente (pendiente en el backend).</p>
        </div>
      )}
    </CuentaLayout>
  );
}
