import { FormEvent, useMemo, useState } from "react";
import { api, errorMessage } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fechaCorta, franjas, hoyISO, sumarDias } from "../lib/format";
import type { Mesa } from "../lib/types";
import { Alert, Campo, Foto, PageHero, Spinner } from "../components/ui";
import RequiereCliente from "../components/RequiereCliente";

const ZONAS = [["interior", "Interior"], ["terraza", "Terraza"], ["bar", "Bar"]] as const;
const HORAS = franjas("12:00", "21:30", 30);

export default function Restaurante() {
  const { data: mesas, loading, error: errCarga } = useFetch(() => api.get<Mesa[]>("/mesas", undefined, false));
  const [zona, setZona] = useState<string>("interior");
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 1));
  const [hora, setHora] = useState("19:00");
  const [comensales, setComensales] = useState(2);
  const [mesaId, setMesaId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const candidatas = useMemo(
    () => (mesas ?? []).filter((m) => m.zona === zona && m.capacidad >= comensales && m.estado === "disponible").sort((a, b) => a.capacidad - b.capacidad),
    [mesas, zona, comensales],
  );

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const id = mesaId || candidatas[0]?.id;
    if (!id) { setError("No hay mesas disponibles en esta zona para ese número de comensales."); return; }
    setEnviando(true);
    try {
      await api.post("/reservas-mesa", { mesa_id: Number(id), fecha, hora, numero_comensales: comensales });
      setOk(`Mesa reservada para el ${fechaCorta(fecha)} a las ${hora}, ${comensales} ${comensales === 1 ? "persona" : "personas"}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHero titulo="Restaurante y Bar" texto="Cocina de autor en interior, terraza y bar." />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {ZONAS.map(([v, t]) => (
            <button key={v} onClick={() => { setZona(v); setMesaId(""); }} aria-pressed={zona === v} className={`tarjeta overflow-hidden text-left ${zona === v ? "border-bronce ring-1 ring-bronce" : ""}`}>
              <Foto src={`/img/restaurante-${v}.jpg`} alt={t} className="h-36 w-full" />
              <p className="px-4 py-3 font-serif text-xl">{t}</p>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <RequiereCliente accion="reservar tu mesa">
            <form onSubmit={enviar} className="tarjeta space-y-6 p-6">
              <h2 className="font-serif text-3xl">Reserva tu mesa</h2>
              {error && <Alert>{error}</Alert>}
              {ok && <Alert tipo="ok">{ok}</Alert>}
              {errCarga && <Alert>{errCarga}</Alert>}
              <div className="grid gap-5 md:grid-cols-3">
                <Campo etiqueta="Fecha"><input type="date" className="input" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} /></Campo>
                <Campo etiqueta="Comensales"><input type="number" min={1} max={20} className="input" value={comensales} onChange={(e) => { setComensales(Number(e.target.value)); setMesaId(""); }} /></Campo>
                <Campo etiqueta="Mesa">
                  <select className="input" value={mesaId} onChange={(e) => setMesaId(e.target.value ? Number(e.target.value) : "")} disabled={loading}>
                    <option value="">Asignar la mejor disponible</option>
                    {candidatas.map((m) => <option key={m.id} value={m.id}>Mesa {m.id} · para {m.capacidad}</option>)}
                  </select>
                </Campo>
              </div>
              <fieldset>
                <legend className="etiqueta">Hora</legend>
                <div className="flex flex-wrap gap-2">
                  {HORAS.map((h) => (
                    <button type="button" key={h} aria-pressed={hora === h} onClick={() => setHora(h)}
                      className={`border px-4 py-2 text-sm ${hora === h ? "border-bronce bg-bronce text-white" : "border-linea bg-crema-50 hover:border-bronce"}`}>{h}</button>
                  ))}
                </div>
              </fieldset>
              {loading && <Spinner />}
              <button className="btn-primario" disabled={enviando}>{enviando ? "Reservando…" : "Reservar mesa"}</button>
              <p className="text-xs text-tinta-500">La reserva se cancela automáticamente si no te presentas pasado el tiempo de tolerancia.</p>
            </form>
          </RequiereCliente>
        </div>
      </div>
    </>
  );
}
