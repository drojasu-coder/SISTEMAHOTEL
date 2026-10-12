import { FormEvent, useMemo, useState } from "react";
import { api, errorMessage } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { capitalizar, fechaCorta, franjas, hoyISO, sumarDias, sumarMinutos } from "../lib/format";
import type { Instructor, RecursoActividad } from "../lib/types";
import { Alert, Campo, Foto, PageHero, Spinner } from "../components/ui";
import RequiereCliente from "../components/RequiereCliente";

const HORAS = franjas("08:00", "18:00", 60);
const DURACIONES = [[60, "1 hora"], [120, "2 horas"]] as const;
const TEXTO: Record<string, string> = {
  golf: "Recorrido privado entre jardines y vistas al volcán.",
  tenis: "Cancha al aire libre con opción de clase personalizada.",
  billar: "Sala clásica para una partida tranquila en pareja o grupo.",
};

export default function Actividades() {
  const { data, loading, error: errCarga } = useFetch(async () => {
    const [recursos, instructores] = await Promise.all([api.get<RecursoActividad[]>("/recursos-actividad", undefined, false), api.get<Instructor[]>("/instructores", undefined, false)]);
    return { recursos, instructores };
  });
  const tipos = useMemo(() => Array.from(new Set(data?.recursos.map((r) => r.tipo) ?? [])), [data]);
  const [tipo, setTipo] = useState<string>("");
  const tipoSel = tipo || tipos[0] || "";
  const recursos = (data?.recursos ?? []).filter((r) => r.tipo === tipoSel);
  const instructores = (data?.instructores ?? []).filter((i) => i.activo && (!i.especialidad || i.especialidad === tipoSel));

  const [recursoId, setRecursoId] = useState<number | "">("");
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 1));
  const [inicio, setInicio] = useState("10:00");
  const [dur, setDur] = useState(60);
  const [instructorId, setInstructorId] = useState<number | "">("");
  const [equipo, setEquipo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const id = recursoId || recursos[0]?.id;
    if (!id) { setError("Elige un recurso."); return; }
    setEnviando(true);
    try {
      await api.post("/reservas-actividad", {
        recurso_id: Number(id), fecha, hora_inicio: inicio, hora_fin: sumarMinutos(inicio, dur),
        instructor_id: instructorId || null, con_equipo: equipo,
      });
      setOk(`Reserva confirmada: ${capitalizar(tipoSel)} el ${fechaCorta(fecha)} de ${inicio} a ${sumarMinutos(inicio, dur)}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHero titulo="Actividades recreativas" texto="Golf, tenis y billar con instructor y equipo opcionales." />
      <div className="mx-auto max-w-5xl px-6 py-12">
        {loading ? <Spinner /> : errCarga ? <Alert>{errCarga}</Alert> : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {tipos.map((t) => (
                <button key={t} aria-pressed={tipoSel === t} onClick={() => { setTipo(t); setRecursoId(""); setInstructorId(""); }} className={`tarjeta overflow-hidden text-left ${tipoSel === t ? "border-bronce ring-1 ring-bronce" : ""}`}>
                  <Foto src={`/img/actividad-${t}.jpg`} alt={capitalizar(t)} className="h-32 w-full" />
                  <div className="p-4"><p className="font-serif text-2xl">{capitalizar(t)}</p><p className="mt-1 text-xs text-tinta-500">{TEXTO[t] ?? ""}</p></div>
                </button>
              ))}
            </div>

            <div className="mt-10">
              <RequiereCliente accion="reservar una actividad">
                <form onSubmit={enviar} className="tarjeta space-y-6 p-6">
                  <h2 className="font-serif text-3xl">Reserva {capitalizar(tipoSel)}</h2>
                  {error && <Alert>{error}</Alert>}
                  {ok && <Alert tipo="ok">{ok}</Alert>}
                  <div className="grid gap-5 md:grid-cols-2">
                    <Campo etiqueta="Lugar">
                      <select className="input" value={recursoId} onChange={(e) => setRecursoId(e.target.value ? Number(e.target.value) : "")}>
                        {recursos.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                    </Campo>
                    <Campo etiqueta="Fecha"><input type="date" className="input" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} /></Campo>
                  </div>
                  <fieldset>
                    <legend className="etiqueta">Duración</legend>
                    <div className="flex gap-2">{DURACIONES.map(([m, t]) => <button type="button" key={m} aria-pressed={dur === m} onClick={() => setDur(m)} className={`border px-4 py-2 text-sm ${dur === m ? "border-bronce bg-bronce text-white" : "border-linea bg-crema-50"}`}>{t}</button>)}</div>
                  </fieldset>
                  <fieldset>
                    <legend className="etiqueta">Horario de inicio</legend>
                    <div className="flex flex-wrap gap-2">{HORAS.map((h) => <button type="button" key={h} aria-pressed={inicio === h} onClick={() => setInicio(h)} className={`border px-4 py-2 text-sm ${inicio === h ? "border-bronce bg-bronce text-white" : "border-linea bg-crema-50 hover:border-bronce"}`}>{h}</button>)}</div>
                  </fieldset>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Campo etiqueta="Instructor (opcional)">
                      <select className="input" value={instructorId} onChange={(e) => setInstructorId(e.target.value ? Number(e.target.value) : "")}>
                        <option value="">Sin instructor</option>
                        {instructores.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                      </select>
                    </Campo>
                    <label className="flex items-center gap-3 pt-6 text-sm"><input type="checkbox" className="h-4 w-4 accent-bronce" checked={equipo} onChange={(e) => setEquipo(e.target.checked)} /> Renta de equipo</label>
                  </div>
                  <button className="btn-primario" disabled={enviando}>{enviando ? "Reservando…" : "Reservar actividad"}</button>
                  <p className="text-xs text-tinta-500">Si el horario ya está ocupado, te sugeriremos elegir otro. El costo de la actividad se confirma en recepción.</p>
                </form>
              </RequiereCliente>
            </div>
          </>
        )}
      </div>
    </>
  );
}
