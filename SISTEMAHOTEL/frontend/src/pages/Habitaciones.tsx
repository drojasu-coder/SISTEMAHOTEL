import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { useFetch } from "../lib/useFetch";
import { fechaCorta, hoyISO, noches, quetzales, sumarDias } from "../lib/format";
import type { Habitacion, ReservaHabitacion, TipoHabitacion } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Alert, Campo, Foto, Insignia, Spinner, Vacio } from "../components/ui";
import RequiereCliente from "../components/RequiereCliente";

const FOTO: Record<string, string> = { sencilla: "habitacion-sencilla.jpg", doble: "habitacion-doble.jpg", suite: "habitacion-suite.jpg", familiar: "habitacion-familiar.jpg" };

export default function Habitaciones() {
  const { user, isStaff } = useAuth();
  const { addItem } = useCart();
  const nav = useNavigate();
  const [entrada, setEntrada] = useState(sumarDias(hoyISO(), 1));
  const [salida, setSalida] = useState(sumarDias(hoyISO(), 3));
  const [huespedes, setHuespedes] = useState(2);
  const [filtro, setFiltro] = useState("todas");
  const [reservando, setReservando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estos endpoints exigen sesión en el backend.
  const { data, loading, error: errCarga } = useFetch(async () => {
    if (!user) return null;
    const [habs, tipos] = await Promise.all([
      api.get<Habitacion[]>("/habitaciones"),
      api.get<TipoHabitacion[]>("/tipos-habitacion"),
    ]);
    return { habs, tipos };
  }, [user?.id]);

  const n = noches(entrada, salida);
  const fechasOk = n > 0 && entrada >= hoyISO();

  const tipoDe = (h: Habitacion) => data?.tipos.find((t) => t.id === h.tipo_habitacion_id);
  const nombresTipo = useMemo(() => Array.from(new Set(data?.tipos.map((t) => t.nombre) ?? [])), [data]);

  const lista = useMemo(() => {
    if (!data) return [];
    return data.habs
      .filter((h) => h.estado === "disponible")
      .map((h) => ({ h, t: tipoDe(h) }))
      .filter(({ t }) => t && t.capacidad_maxima >= huespedes)
      .filter(({ t }) => filtro === "todas" || t!.nombre === filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, huespedes, filtro]);

  async function reservar(h: Habitacion) {
    setError(null);
    if (!fechasOk) { setError("Elige una fecha de salida posterior a la de entrada."); return; }
    setReservando(h.id);
    try {
      const r = await api.post<ReservaHabitacion>("/reservas-habitacion", {
        habitacion_id: h.id, fecha_entrada: entrada, fecha_salida: salida, numero_huespedes: huespedes,
      });
      await addItem("habitacion", r.id);
      nav("/carrito");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setReservando(null);
    }
  }

  return (
    <>
      <header className="bg-tinta px-6 py-14 text-center">
        <h1 className="font-serif text-4xl text-crema md:text-5xl">Busca y reserva tu habitación</h1>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <form onSubmit={(e: FormEvent) => e.preventDefault()} className="tarjeta grid gap-5 p-6 md:grid-cols-4 md:items-end">
          <Campo etiqueta="Fecha de entrada"><input type="date" className="input" min={hoyISO()} value={entrada} onChange={(e) => setEntrada(e.target.value)} /></Campo>
          <Campo etiqueta="Fecha de salida"><input type="date" className="input" min={sumarDias(entrada, 1)} value={salida} onChange={(e) => setSalida(e.target.value)} /></Campo>
          <Campo etiqueta="Huéspedes">
            <select className="input" value={huespedes} onChange={(e) => setHuespedes(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((x) => <option key={x} value={x}>{x} {x === 1 ? "huésped" : "huéspedes"}</option>)}
            </select>
          </Campo>
          <p className="pb-3 text-sm text-tinta-500">{fechasOk ? `${n} ${n === 1 ? "noche" : "noches"} · ${fechaCorta(entrada)} al ${fechaCorta(salida)}` : "Revisa las fechas"}</p>
        </form>

        {!user ? (
          <div className="mt-8"><RequiereCliente accion="ver y reservar habitaciones"><span /></RequiereCliente></div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por tipo">
              <span className="mr-2 text-xs text-tinta-500">Filtrar:</span>
              {["todas", ...nombresTipo].map((t) => (
                <button key={t} onClick={() => setFiltro(t)} aria-pressed={filtro === t}
                  className={`border px-4 py-2 text-sm capitalize ${filtro === t ? "border-bronce bg-bronce text-white" : "border-linea bg-crema-50 hover:border-bronce"}`}>{t}</button>
              ))}
            </div>

            {error && <div className="mt-6"><Alert>{error}</Alert></div>}
            {errCarga && <div className="mt-6"><Alert>{errCarga}</Alert></div>}
            {isStaff && <div className="mt-6"><Alert tipo="info">Con una cuenta de personal solo puedes consultar. Para reservar usa una cuenta de cliente.</Alert></div>}

            {loading ? <Spinner /> : (
              <>
                <p className="mt-8 text-xs text-tinta-500">{lista.length} {lista.length === 1 ? "habitación encontrada" : "habitaciones encontradas"}</p>
                {lista.length === 0 ? (
                  <div className="mt-4"><Vacio titulo="No hay habitaciones para esa búsqueda" texto="Prueba con menos huéspedes o con otro tipo de habitación." /></div>
                ) : (
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    {lista.map(({ h, t }) => (
                      <article key={h.id} className="tarjeta overflow-hidden">
                        <Foto src={`/img/${FOTO[t!.nombre.toLowerCase()] ?? "habitacion-doble.jpg"}`} alt={`Habitación ${t!.nombre}`} className="h-48 w-full" />
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h2 className="font-serif text-2xl">{t!.nombre} · Hab. {h.numero}</h2>
                              <p className="mt-1 text-xs text-tinta-500">Máx. {t!.capacidad_maxima} {t!.capacidad_maxima === 1 ? "huésped" : "huéspedes"}</p>
                            </div>
                            <Insignia tono="ok">Disponible</Insignia>
                          </div>
                          {t!.descripcion && <p className="mt-3 text-sm text-tinta-500">{t!.descripcion}</p>}
                          <div className="mt-5 flex items-end justify-between border-t border-linea pt-4">
                            <div>
                              <p className="font-serif text-xl">{quetzales(t!.tarifa_noche)} <span className="text-sm text-tinta-500">/ noche</span></p>
                              {fechasOk && <p className="text-xs text-tinta-500">{n} {n === 1 ? "noche" : "noches"} · {quetzales(Number(t!.tarifa_noche) * n)} total</p>}
                            </div>
                            {!isStaff && (
                              <button className="btn-primario" disabled={reservando !== null || !fechasOk} onClick={() => reservar(h)}>
                                {reservando === h.id ? "Reservando…" : "Reservar"}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <p className="mt-6 text-xs text-tinta-400">La disponibilidad por fechas se confirma al reservar: si la habitación ya está tomada en esas noches, te lo indicaremos.</p>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
