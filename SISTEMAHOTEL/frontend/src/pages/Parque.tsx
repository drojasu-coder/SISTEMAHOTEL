import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { hoyISO, quetzales, sumarDias } from "../lib/format";
import { PRECIOS_PARQUE } from "../lib/config";
import { useCart } from "../context/CartContext";
import { Alert, Campo, Contador, PageHero } from "../components/ui";
import RequiereCliente from "../components/RequiereCliente";

const TIPOS = [
  { id: "adulto", nombre: "Adulto", texto: "13 años en adelante" },
  { id: "nino", nombre: "Niño", texto: "De 3 a 12 años" },
  { id: "familiar", nombre: "Familiar", texto: "2 adultos y 2 niños" },
] as const;
type Tipo = (typeof TIPOS)[number]["id"];

export default function Parque() {
  const { addItem } = useCart();
  const nav = useNavigate();
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 1));
  const [cant, setCant] = useState<Record<Tipo, number>>({ adulto: 2, nino: 0, familiar: 0 });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const total = TIPOS.reduce((s, t) => s + cant[t.id] * PRECIOS_PARQUE[t.id], 0);
  const cuantos = TIPOS.reduce((s, t) => s + cant[t.id], 0);

  async function agregar() {
    setError(null);
    if (cuantos === 0) { setError("Elige al menos un boleto."); return; }
    setEnviando(true);
    let creados = 0;
    try {
      // El backend crea un boleto por solicitud; cada uno se agrega al carrito.
      for (const t of TIPOS) {
        for (let i = 0; i < cant[t.id]; i++) {
          const b = await api.post<{ id: number }>("/boletos-parque", { tipo_boleto: t.id, fecha_visita: fecha });
          await addItem("boleto_parque", b.id);
          creados++;
        }
      }
      nav("/carrito");
    } catch (err) {
      setError(`${errorMessage(err)}${creados ? ` (se agregaron ${creados} de ${cuantos} boletos; revisa tu carrito)` : ""}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHero titulo="Parque temático" texto="Un día de juegos, naturaleza y experiencias para compartir, con acceso digital por código QR." />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <RequiereCliente accion="comprar boletos">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              <section className="tarjeta p-6">
                <h2 className="font-serif text-3xl">Elige tu fecha</h2>
                <div className="mt-4"><Campo etiqueta="Fecha de visita"><input type="date" className="input md:max-w-xs" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} /></Campo></div>
              </section>
              <section>
                <h2 className="font-serif text-3xl">Tipos de boleto</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {TIPOS.map((t) => (
                    <div key={t.id} className="tarjeta p-5">
                      <h3 className="font-serif text-xl">{t.nombre}</h3>
                      <p className="mt-1 text-xs text-tinta-500">{t.texto}</p>
                      <p className="mt-3 text-sm">{quetzales(PRECIOS_PARQUE[t.id])}</p>
                      <div className="mt-4"><Contador etiqueta={`boleto ${t.nombre.toLowerCase()}`} valor={cant[t.id]} onChange={(n) => setCant({ ...cant, [t.id]: n })} max={10} /></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <aside className="tarjeta h-fit space-y-4 p-6">
              <h2 className="font-serif text-2xl">Boletos digitales</h2>
              <ul className="space-y-2 text-sm">
                {TIPOS.filter((t) => cant[t.id] > 0).map((t) => <li key={t.id} className="flex justify-between"><span>{t.nombre} × {cant[t.id]}</span><span>{quetzales(cant[t.id] * PRECIOS_PARQUE[t.id])}</span></li>)}
                {cuantos === 0 && <li className="text-tinta-500">Aún no has elegido boletos.</li>}
              </ul>
              <p className="flex justify-between border-t border-linea pt-3 font-medium"><span>Total</span><span>{quetzales(total)}</span></p>
              {error && <Alert>{error}</Alert>}
              <button className="btn-primario w-full" onClick={agregar} disabled={enviando || cuantos === 0}>{enviando ? "Agregando…" : "Agregar al carrito"}</button>
              <p className="text-xs text-tinta-500">Recibirás tu boleto digital con código QR después de pagar. El precio final lo confirma el carrito.</p>
            </aside>
          </div>
        </RequiereCliente>
      </div>
    </>
  );
}
