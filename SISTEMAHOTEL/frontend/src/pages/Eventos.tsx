import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { franjas, hoyISO, quetzales, sumarDias } from "../lib/format";
import type { ReservaEvento, Salon, ServicioEvento } from "../lib/types";
import { useCart } from "../context/CartContext";
import { Alert, Campo, Foto, PageHero, Spinner } from "../components/ui";
import RequiereCliente from "../components/RequiereCliente";

const TIPOS = [["boda", "Boda"], ["cumpleanos", "Cumpleaños"], ["ejecutivo", "Evento ejecutivo"], ["convivio", "Convivio"]] as const;
const HORAS = franjas("07:00", "23:00", 30);

export default function Eventos() {
  const { addItem } = useCart();
  const nav = useNavigate();
  const { data, loading, error: errCarga } = useFetch(async () => {
    const [salones, servicios] = await Promise.all([api.get<Salon[]>("/salones", undefined, false), api.get<ServicioEvento[]>("/servicios-evento", undefined, false)]);
    return { salones, servicios };
  });
  const [salon, setSalon] = useState<Salon | null>(null);
  const [f, setF] = useState({ tipo_evento: "boda", fecha: sumarDias(hoyISO(), 30), hora_inicio: "16:00", hora_fin: "22:00", numero_invitados: 50 });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!salon) return;
    setError(null);
    if (f.hora_fin <= f.hora_inicio) { setError("La hora de fin debe ser posterior a la de inicio."); return; }
    if (f.numero_invitados > salon.capacidad_maxima) { setError(`Este salón admite hasta ${salon.capacidad_maxima} invitados.`); return; }
    setEnviando(true);
    try {
      const r = await api.post<ReservaEvento>("/reservas-evento", { salon_id: salon.id, ...f });
      await addItem("evento", r.id);
      nav("/carrito");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHero titulo="Eventos" texto="Bodas, cumpleaños, eventos ejecutivos y convivios en escenarios coloniales con atención personalizada." />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="font-serif text-3xl">Selecciona un salón</h2>
        {loading ? <Spinner /> : errCarga ? <div className="mt-6"><Alert>{errCarga}</Alert></div> : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {data!.salones.map((s, i) => (
              <article key={s.id} className={`tarjeta overflow-hidden ${salon?.id === s.id ? "border-bronce ring-1 ring-bronce" : ""}`}>
                <Foto src={`/img/salon-${i + 1}.jpg`} alt={s.nombre} className="h-44 w-full" />
                <div className="p-5">
                  <h3 className="font-serif text-2xl">{s.nombre}</h3>
                  <p className="mt-1 text-xs text-tinta-500">Hasta {s.capacidad_maxima} invitados</p>
                  {s.descripcion && <p className="mt-2 text-sm text-tinta-500">{s.descripcion}</p>}
                  <p className="mt-3 text-sm">Desde <strong>{quetzales(s.tarifa_base)}</strong></p>
                  <button className="btn-contorno mt-4" aria-pressed={salon?.id === s.id} onClick={() => setSalon(s)}>{salon?.id === s.id ? "Salón elegido" : "Seleccionar salón"}</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {salon && (
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
            <RequiereCliente accion="solicitar tu evento">
              <form onSubmit={enviar} className="tarjeta space-y-5 p-6">
                <h2 className="font-serif text-2xl">Datos del evento en {salon.nombre}</h2>
                {error && <Alert>{error}</Alert>}
                <div className="grid gap-5 md:grid-cols-2">
                  <Campo etiqueta="Tipo de evento">
                    <select className="input" value={f.tipo_evento} onChange={(e) => setF({ ...f, tipo_evento: e.target.value })}>{TIPOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
                  </Campo>
                  <Campo etiqueta="Fecha"><input type="date" className="input" min={hoyISO()} value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></Campo>
                  <Campo etiqueta="Hora de inicio"><select className="input" value={f.hora_inicio} onChange={(e) => setF({ ...f, hora_inicio: e.target.value })}>{HORAS.map((h) => <option key={h}>{h}</option>)}</select></Campo>
                  <Campo etiqueta="Hora de fin"><select className="input" value={f.hora_fin} onChange={(e) => setF({ ...f, hora_fin: e.target.value })}>{HORAS.map((h) => <option key={h}>{h}</option>)}</select></Campo>
                  <Campo etiqueta={`Invitados (máx. ${salon.capacidad_maxima})`}>
                    <input type="number" className="input" min={1} max={salon.capacidad_maxima} value={f.numero_invitados} onChange={(e) => setF({ ...f, numero_invitados: Number(e.target.value) })} />
                  </Campo>
                </div>
                <button className="btn-primario" disabled={enviando}>{enviando ? "Reservando…" : "Reservar y agregar al carrito"}</button>
                <p className="text-xs text-tinta-500">El total y el anticipo se calculan con la tarifa del salón. Pagas el anticipo en el carrito y el resto después.</p>
              </form>
            </RequiereCliente>
            <aside className="tarjeta h-fit p-6">
              <h3 className="font-serif text-xl">Servicios adicionales</h3>
              <p className="mt-1 text-xs text-tinta-500">Se agregan con tu coordinador de eventos.</p>
              <ul className="mt-4 space-y-2 text-sm">
                {data?.servicios.map((s) => <li key={s.id} className="flex justify-between gap-3 border-b border-linea pb-2"><span className="capitalize">{s.nombre}</span><span>{quetzales(s.precio)}</span></li>)}
              </ul>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
