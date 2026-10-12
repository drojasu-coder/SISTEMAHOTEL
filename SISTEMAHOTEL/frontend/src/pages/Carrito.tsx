import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { errorMessage } from "../lib/api";
import { capitalizar, quetzales } from "../lib/format";
import { Alert, PageHero, Spinner, Vacio } from "../components/ui";

const TIPO: Record<string, string> = {
  habitacion: "Habitación", evento: "Evento", mesa: "Mesa", actividad: "Actividad", amenidad: "Amenidad",
  bienestar: "Spa", boleto_parque: "Parque temático", transporte: "Transporte",
};

function useRestante(expira: string | null | undefined) {
  const [seg, setSeg] = useState<number | null>(null);
  useEffect(() => {
    if (!expira) { setSeg(null); return; }
    const tick = () => setSeg(Math.max(0, Math.floor((Date.parse(expira) - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expira]);
  return seg;
}

export default function Carrito() {
  const { carrito, items, total, loading, removeItem, refresh } = useCart();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const seg = useRestante(carrito?.expira_en);
  const vencido = seg === 0;

  async function quitar(id: number) {
    setError(null);
    try { await removeItem(id); } catch (e) { setError(errorMessage(e)); }
  }

  return (
    <>
      <PageHero titulo="Tu carrito" />
      <div className="mx-auto max-w-4xl px-6 py-12">
        {loading && !carrito ? <Spinner /> : items.length === 0 ? (
          <Vacio titulo="Tu carrito está vacío" texto="Reserva una habitación, un evento, el spa o boletos del parque y aparecerán aquí." accion={<Link to="/habitaciones" className="btn-primario">Ver habitaciones</Link>} />
        ) : (
          <>
            {error && <div className="mb-4"><Alert>{error}</Alert></div>}
            {vencido && <div className="mb-4"><Alert>Tu carrito venció. <button className="underline" onClick={() => refresh()}>Actualizar</button> y vuelve a reservar.</Alert></div>}
            {seg !== null && !vencido && <p className="mb-4 text-sm text-tinta-500">Tu carrito se reserva por {Math.floor(seg / 60)}:{String(seg % 60).padStart(2, "0")} minutos.</p>}
            <ul className="tarjeta divide-y divide-linea">
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs text-bronce-700">{TIPO[it.tipo_item] ?? capitalizar(it.tipo_item)}</p>
                    <p className="font-serif text-xl">{it.descripcion ?? `Reserva #${it.referencia_id}`}</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="font-medium">{quetzales(Number(it.precio) * it.cantidad)}</span>
                    <button onClick={() => quitar(it.id)} className="text-sm text-error underline">Quitar</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-linea pt-6">
              <p className="font-serif text-2xl">Total <span className="text-sm text-tinta-500">· IVA incluido</span></p>
              <p className="font-serif text-3xl">{quetzales(total)}</p>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Link to="/habitaciones" className="btn-contorno">Seguir reservando</Link>
              <button className="btn-primario" disabled={vencido} onClick={() => nav("/checkout")}>Continuar al pago</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
