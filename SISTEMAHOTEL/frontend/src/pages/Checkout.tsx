import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { api, errorMessage } from "../lib/api";
import { quetzales } from "../lib/format";
import { STRIPE_PK } from "../lib/config";
import type { Pago, ResumenPago } from "../lib/types";
import { useCart } from "../context/CartContext";
import { Alert, PageHero, Spinner } from "../components/ui";

type TipoPago = "total" | "anticipo" | "saldo";
interface Opcion { tipo: TipoPago; monto: number; titulo: string; texto: string }
interface IntentData { pago_id: number; client_secret: string; monto: string }

let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (stripePromise ??= STRIPE_PK ? loadStripe(STRIPE_PK) : Promise.resolve(null));

/** Calcula qué puede pagar el cliente según el resumen del backend. */
function opciones(r: ResumenPago): Opcion[] {
  if (r.saldo <= 0) return [];
  const needAnticipo = r.anticipo_requerido > 0 && r.aprobado < r.anticipo_requerido;
  if (needAnticipo) {
    return [
      { tipo: "anticipo", monto: +(r.anticipo_requerido - r.aprobado).toFixed(2), titulo: "Pagar anticipo", texto: "Aparta tu evento ahora y paga el resto después." },
      { tipo: "total", monto: r.saldo, titulo: "Pagar todo", texto: "Liquida el total de una vez." },
    ];
  }
  return r.aprobado > 0
    ? [{ tipo: "saldo", monto: r.saldo, titulo: "Pagar saldo", texto: "Completa el pago pendiente." }]
    : [{ tipo: "total", monto: r.saldo, titulo: "Pagar total", texto: "Pago completo de tu carrito." }];
}

/** Espera a que el webhook de Stripe confirme el pago en el backend. */
async function esperarEstado(pagoId: number) {
  for (let i = 0; i < 20; i++) {
    const p = await api.get<Pago>(`/pagos/${pagoId}`);
    if (p.estado !== "procesando" && p.estado !== "pendiente") return p.estado;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return "procesando";
}

function FormularioTarjeta({ pagoId, monto, onResultado }: { pagoId: number; monto: number; onResultado: (estado: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null); setEnviando(true);
    const { error: err } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/cuenta/pagos` },
    });
    if (err) { setError(err.message ?? "No se pudo procesar la tarjeta."); setEnviando(false); return; }
    try { onResultado(await esperarEstado(pagoId)); }
    catch (e2) { setError(errorMessage(e2)); }
    finally { setEnviando(false); }
  }

  return (
    <form onSubmit={pagar} className="space-y-5">
      <PaymentElement />
      {error && <Alert>{error}</Alert>}
      <button className="btn-primario w-full" disabled={!stripe || enviando}>{enviando ? "Procesando pago…" : `Pagar ${quetzales(monto)}`}</button>
    </form>
  );
}

export default function Checkout() {
  const { carrito, items, refresh, loading: cargandoCarrito } = useCart();
  const [resumen, setResumen] = useState<ResumenPago | null>(null);
  const [errCarga, setErrCarga] = useState<string | null>(null);
  const [opcion, setOpcion] = useState<Opcion | null>(null);
  const [metodo, setMetodo] = useState<"tarjeta" | "transferencia">("tarjeta");
  const [intent, setIntent] = useState<IntentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [final, setFinal] = useState<{ estado: string; metodo: string } | null>(null);
  const clave = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (!carrito) return;
    api.get<ResumenPago>("/pagos/resumen", { carrito_id: carrito.id }).then((r) => {
      setResumen(r);
      setOpcion(opciones(r)[0] ?? null);
    }).catch((e) => setErrCarga(errorMessage(e)));
  }, [carrito?.id]);

  const opts = useMemo(() => (resumen ? opciones(resumen) : []), [resumen]);

  if (cargandoCarrito && !carrito) return <Spinner />;
  if (!carrito || (items.length === 0 && !final)) return <Navigate to="/carrito" replace />;

  async function iniciar() {
    if (!opcion || !carrito) return;
    setError(null); setEnviando(true);
    try {
      clave.current = crypto.randomUUID();
      const r = await api.post<IntentData & Pago>("/pagos", {
        carrito_id: carrito.id, monto: opcion.monto, metodo, tipo_pago: opcion.tipo, moneda: "GTQ", idempotency_key: clave.current,
      });
      if (metodo === "tarjeta") setIntent({ pago_id: (r as any).pago_id, client_secret: (r as any).client_secret, monto: String(opcion.monto) });
      else { setFinal({ estado: "pendiente", metodo }); }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setEnviando(false);
    }
  }

  async function terminado(estado: string) {
    setFinal({ estado, metodo: "tarjeta" });
    await refresh();
  }

  if (final) {
    const ok = final.estado === "aprobado";
    const espera = final.estado === "pendiente" || final.estado === "procesando";
    return (
      <>
        <PageHero titulo={ok ? "Pago recibido" : espera ? "Pago en revisión" : "El pago no se completó"} />
        <div className="mx-auto max-w-xl px-6 py-12 text-center">
          <p className="text-tinta-500">
            {ok && "Gracias. Tu pago fue aprobado y tus reservas quedan confirmadas."}
            {final.estado === "pendiente" && "Registramos tu transferencia. El personal del hotel la verificará y confirmará tus reservas."}
            {final.estado === "procesando" && "Tu banco todavía está confirmando el pago. Revisa el estado en Mis pagos en unos minutos."}
            {!ok && !espera && "Tu tarjeta fue rechazada. Puedes intentar de nuevo con otra tarjeta."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/cuenta/pagos" className="btn-primario">Ver mis pagos</Link>
            {!ok && !espera && <button className="btn-contorno" onClick={() => { setFinal(null); setIntent(null); }}>Intentar de nuevo</button>}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero titulo="Pago" />
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 lg:grid-cols-[1fr_340px]">
        <section className="tarjeta space-y-6 p-6">
          {errCarga && <Alert>{errCarga}</Alert>}
          {!resumen && !errCarga && <Spinner />}
          {resumen && opts.length === 0 && <Alert tipo="ok">No tienes saldo pendiente en este carrito.</Alert>}
          {resumen && opts.length > 0 && !intent && (
            <>
              <fieldset>
                <legend className="font-serif text-2xl">¿Cuánto quieres pagar?</legend>
                <div className="mt-4 space-y-3">
                  {opts.map((o) => (
                    <label key={o.tipo} className={`flex cursor-pointer items-start justify-between gap-4 border p-4 ${opcion?.tipo === o.tipo ? "border-bronce bg-crema-50" : "border-linea"}`}>
                      <span className="flex items-start gap-3">
                        <input type="radio" name="opcion" className="mt-1 accent-bronce" checked={opcion?.tipo === o.tipo} onChange={() => setOpcion(o)} />
                        <span><span className="block font-medium">{o.titulo}</span><span className="text-xs text-tinta-500">{o.texto}</span></span>
                      </span>
                      <span className="font-serif text-lg">{quetzales(o.monto)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-serif text-2xl">Método de pago</legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {([["tarjeta", "Tarjeta de crédito o débito", "Se aprueba al instante."], ["transferencia", "Transferencia bancaria", "El hotel la verifica y confirma."]] as const).map(([v, t, d]) => (
                    <label key={v} className={`cursor-pointer border p-4 ${metodo === v ? "border-bronce bg-crema-50" : "border-linea"}`}>
                      <input type="radio" name="metodo" className="mr-2 accent-bronce" checked={metodo === v} onChange={() => setMetodo(v)} />
                      <span className="font-medium">{t}</span><span className="mt-1 block pl-6 text-xs text-tinta-500">{d}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {metodo === "tarjeta" && !STRIPE_PK && <Alert>Falta configurar VITE_STRIPE_PUBLISHABLE_KEY en el archivo .env del frontend.</Alert>}
              {error && <Alert>{error}</Alert>}
              <button className="btn-primario w-full" onClick={iniciar} disabled={enviando || !opcion || (metodo === "tarjeta" && !STRIPE_PK)}>
                {enviando ? "Preparando…" : metodo === "tarjeta" ? "Continuar con la tarjeta" : "Registrar transferencia"}
              </button>
            </>
          )}
          {intent && (
            <Elements stripe={getStripe()} options={{ clientSecret: intent.client_secret, locale: "es", appearance: { theme: "flat", variables: { colorPrimary: "#B08D57", colorBackground: "#FAF7F0", colorText: "#1E1C18", borderRadius: "0px", fontFamily: "Inter, system-ui, sans-serif" } } }}>
              <h2 className="mb-5 font-serif text-2xl">Datos de la tarjeta</h2>
              <FormularioTarjeta pagoId={intent.pago_id} monto={Number(intent.monto)} onResultado={terminado} />
            </Elements>
          )}
        </section>

        <aside className="tarjeta h-fit p-6">
          <h2 className="font-serif text-2xl">Resumen</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((it) => <li key={it.id} className="flex justify-between gap-3"><span>{it.descripcion ?? `Reserva #${it.referencia_id}`}</span><span>{quetzales(Number(it.precio) * it.cantidad)}</span></li>)}
          </ul>
          {resumen && (
            <dl className="mt-5 space-y-1 border-t border-linea pt-4 text-sm">
              <div className="flex justify-between"><dt>Total</dt><dd>{quetzales(resumen.total)}</dd></div>
              {resumen.aprobado > 0 && <div className="flex justify-between"><dt>Ya pagado</dt><dd>{quetzales(resumen.aprobado)}</dd></div>}
              <div className="flex justify-between font-medium"><dt>Saldo</dt><dd>{quetzales(resumen.saldo)}</dd></div>
            </dl>
          )}
          <p className="mt-4 text-xs text-tinta-500">Precios en quetzales (GTQ), IVA incluido. Los datos de tarjeta los procesa Stripe y no pasan por nuestros servidores.</p>
        </aside>
      </div>
    </>
  );
}
