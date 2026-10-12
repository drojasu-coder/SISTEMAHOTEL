import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fechaCorta, franjas, hoyISO, quetzales, sumarDias } from "../lib/format";
import type { ServicioSpa, Terapeuta } from "../lib/types";
import { useCart } from "../context/CartContext";
import { Alert, Campo, Foto, PageHero, Spinner } from "../components/ui";
import RequiereCliente from "../components/RequiereCliente";

const HORAS = franjas("09:00", "17:30", 30);

export default function Spa() {
  const { addItem } = useCart();
  const nav = useNavigate();
  const { data, loading, error: errCarga } = useFetch(async () => {
    const [servicios, terapeutas] = await Promise.all([api.get<ServicioSpa[]>("/servicios-spa", undefined, false), api.get<Terapeuta[]>("/terapeutas", undefined, false)]);
    return { servicios, terapeutas: terapeutas.filter((t) => t.activo) };
  });
  const [servId, setServId] = useState<number | null>(null);
  const [terId, setTerId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 1));
  const [hora, setHora] = useState("10:30");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const servicio = data?.servicios.find((s) => s.id === (servId ?? data.servicios[0]?.id));
  const terapeutaId = terId ?? data?.terapeutas[0]?.id ?? null;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!servicio || !terapeutaId) { setError("Elige un servicio y un terapeuta."); return; }
    setError(null); setEnviando(true);
    try {
      const cita = await api.post<{ id: number }>("/citas-spa", { servicio_bienestar_id: servicio.id, terapeuta_id: terapeutaId, fecha, hora_inicio: hora });
      await addItem("bienestar", cita.id);
      nav("/carrito");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHero titulo="Spa y bienestar" texto="Masajes, sauna, jacuzzi y circuitos de bienestar." />
      <div className="mx-auto max-w-5xl px-6 py-12">
        {loading ? <Spinner /> : errCarga ? <Alert>{errCarga}</Alert> : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {data!.servicios.map((s) => (
                <button key={s.id} aria-pressed={servicio?.id === s.id} onClick={() => setServId(s.id)} className={`tarjeta overflow-hidden text-left ${servicio?.id === s.id ? "border-bronce ring-1 ring-bronce" : ""}`}>
                  <Foto src={`/img/spa-${s.id}.jpg`} alt={s.nombre} className="h-28 w-full" />
                  <div className="p-4">
                    <p className="font-serif text-xl capitalize">{s.nombre}</p>
                    <p className="mt-1 text-xs text-tinta-500">{s.duracion_minutos} minutos</p>
                    <p className="mt-2 text-sm">{quetzales(s.precio)}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-10">
              <RequiereCliente accion="agendar tu cita">
                <form onSubmit={enviar} className="tarjeta space-y-6 p-6">
                  <h2 className="font-serif text-3xl">Agenda tu cita</h2>
                  {error && <Alert>{error}</Alert>}
                  <fieldset>
                    <legend className="etiqueta">Terapeuta</legend>
                    <div className="flex flex-wrap gap-2">
                      {data!.terapeutas.map((t) => <button type="button" key={t.id} aria-pressed={terapeutaId === t.id} onClick={() => setTerId(t.id)} className={`border px-4 py-2 text-sm ${terapeutaId === t.id ? "border-bronce bg-bronce text-white" : "border-linea bg-crema-50 hover:border-bronce"}`}>{t.nombre}</button>)}
                    </div>
                  </fieldset>
                  <Campo etiqueta="Fecha"><input type="date" className="input md:max-w-xs" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} /></Campo>
                  <fieldset>
                    <legend className="etiqueta">Horario</legend>
                    <div className="flex flex-wrap gap-2">{HORAS.map((h) => <button type="button" key={h} aria-pressed={hora === h} onClick={() => setHora(h)} className={`border px-4 py-2 text-sm ${hora === h ? "border-bronce bg-bronce text-white" : "border-linea bg-crema-50 hover:border-bronce"}`}>{h}</button>)}</div>
                  </fieldset>
                  {servicio && <p className="border-t border-linea pt-4 text-sm">Resumen: <strong className="capitalize">{servicio.nombre}</strong> · {fechaCorta(fecha)} · {hora} · <strong>{quetzales(servicio.precio)}</strong></p>}
                  <button className="btn-primario" disabled={enviando}>{enviando ? "Agendando…" : "Agendar y agregar al carrito"}</button>
                  <p className="text-xs text-tinta-500">Entre cita y cita el terapeuta necesita 15 minutos de descanso; si el horario no está libre, te lo indicaremos.</p>
                </form>
              </RequiereCliente>
            </div>
          </>
        )}
      </div>
    </>
  );
}
