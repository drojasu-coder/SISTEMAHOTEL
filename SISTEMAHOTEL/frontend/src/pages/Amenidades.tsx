import { FormEvent, useState } from "react";
import { api, errorMessage } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fechaCorta, hoyISO, sumarDias } from "../lib/format";
import type { Amenidad } from "../lib/types";
import { Alert, Campo, Foto, PageHero, Spinner } from "../components/ui";
import RequiereCliente from "../components/RequiereCliente";

const FRANJAS = ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00"];
const MOBILIARIO = [["", "Sin comodidad adicional"], ["camastro", "Camastro"], ["cabana", "Cabaña"]] as const;

export default function Amenidades() {
  const { data, loading, error: errCarga } = useFetch(() => api.get<Amenidad[]>("/amenidades", undefined, false));
  const [sel, setSel] = useState<Amenidad | null>(null);
  const actual = sel ?? data?.[0] ?? null;
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 1));
  const [franja, setFranja] = useState(FRANJAS[0]);
  const [mob, setMob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!actual) return;
    setError(null); setOk(null); setEnviando(true);
    try {
      await api.post("/reservas-amenidad", { amenidad_id: actual.id, fecha, franja_horaria: franja, ...(mob ? { mobiliario: mob } : {}) });
      setOk(`Acceso reservado a ${actual.nombre} el ${fechaCorta(fecha)}, ${franja}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHero titulo="Amenidades" texto="Piscina, toboganes y áreas comunes con control de aforo por franja." />
      <div className="mx-auto max-w-5xl px-6 py-12">
        {loading ? <Spinner /> : errCarga ? <Alert>{errCarga}</Alert> : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {data!.map((a) => (
                <button key={a.id} aria-pressed={actual?.id === a.id} onClick={() => setSel(a)} className={`tarjeta overflow-hidden text-left ${actual?.id === a.id ? "border-bronce ring-1 ring-bronce" : ""}`}>
                  <Foto src={`/img/amenidad-${a.id}.jpg`} alt={a.nombre} className="h-32 w-full" />
                  <div className="p-4"><p className="font-serif text-xl capitalize">{a.nombre}</p><p className="mt-1 text-xs text-tinta-500">Aforo: {a.aforo_maximo} personas por franja</p></div>
                </button>
              ))}
            </div>
            <div className="mt-10">
              <RequiereCliente accion="reservar tu acceso">
                <form onSubmit={enviar} className="tarjeta space-y-6 p-6">
                  <h2 className="font-serif text-3xl">Reserva tu acceso{actual ? ` · ${actual.nombre}` : ""}</h2>
                  {error && <Alert>{error}</Alert>}
                  {ok && <Alert tipo="ok">{ok}</Alert>}
                  <Campo etiqueta="Fecha"><input type="date" className="input md:max-w-xs" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} /></Campo>
                  <fieldset>
                    <legend className="etiqueta">Franja horaria</legend>
                    <div className="flex flex-wrap gap-2">{FRANJAS.map((f) => <button type="button" key={f} aria-pressed={franja === f} onClick={() => setFranja(f)} className={`border px-4 py-2 text-sm ${franja === f ? "border-bronce bg-bronce text-white" : "border-linea bg-crema-50 hover:border-bronce"}`}>{f}</button>)}</div>
                  </fieldset>
                  <fieldset>
                    <legend className="etiqueta">Comodidad adicional</legend>
                    <div className="flex flex-wrap gap-2">{MOBILIARIO.map(([v, t]) => <button type="button" key={v} aria-pressed={mob === v} onClick={() => setMob(v)} className={`border px-4 py-2 text-sm ${mob === v ? "border-bronce bg-bronce text-white" : "border-linea bg-crema-50 hover:border-bronce"}`}>{t}</button>)}</div>
                  </fieldset>
                  <button className="btn-primario" disabled={enviando || !actual}>{enviando ? "Reservando…" : "Reservar acceso"}</button>
                  <p className="text-xs text-tinta-500">Si el aforo de la franja está completo, el sistema te lo indicará para que elijas otra.</p>
                </form>
              </RequiereCliente>
            </div>
          </>
        )}
      </div>
    </>
  );
}
