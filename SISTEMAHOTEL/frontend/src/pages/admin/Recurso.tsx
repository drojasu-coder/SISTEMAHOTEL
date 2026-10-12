import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, errorMessage } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { capitalizar, fechaCorta, quetzales } from "../../lib/format";
import { Alert, Insignia, Spinner, tonoEstado, Vacio } from "../../components/ui";
import { RECURSOS } from "./recursos";

type Fila = Record<string, any>;
const OCULTAS = new Set(["password_hash", "createdAt", "updatedAt", "creado_en", "id_transaccion_externo", "idempotency_key", "client_secret"]);
const DINERO = /^(monto|total|subtotal|iva|precio|tarifa|anticipo)/;

function celda(k: string, v: any) {
  if (v === null || v === undefined || v === "") return <span className="text-tinta-400">—</span>;
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (k === "estado") return <Insignia tono={tonoEstado(v)}>{capitalizar(String(v))}</Insignia>;
  if (DINERO.test(k) && !isNaN(Number(v))) return quetzales(v);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) && v.length >= 10) return k.includes("hora") || v.length > 10 ? new Date(v).toLocaleString("es-GT") : fechaCorta(v);
  return String(v);
}

export default function Recurso() {
  const { recurso } = useParams();
  const def = RECURSOS.find((r) => r.slug === recurso);
  const { data, loading, error, reload } = useFetch(
    () => (def?.endpoint ? api.get<Fila[]>(def.endpoint) : Promise.resolve([] as Fila[])),
    [def?.endpoint],
  );
  const [q, setQ] = useState("");
  const [accionError, setAccionError] = useState<string | null>(null);

  const columnas = useMemo(() => {
    const f = data?.[0];
    if (!f) return [];
    return Object.keys(f).filter((k) => !OCULTAS.has(k) && (f[k] === null || typeof f[k] !== "object")).slice(0, 9);
  }, [data]);

  const filas = useMemo(() => (data ?? []).filter((f) => !q || JSON.stringify(f).toLowerCase().includes(q.toLowerCase())), [data, q]);

  if (!def) return <Vacio titulo="Sección no encontrada" />;
  if (def.nota) return <div><h1 className="font-serif text-4xl">{def.titulo}</h1><div className="mt-6 max-w-xl"><Alert tipo="info">{def.nota}</Alert></div></div>;

  async function cambiarEstado(id: number, estado: string) {
    setAccionError(null);
    try { await api.patch(`${def!.endpoint}/${id}/${def!.estados!.ruta}`, { estado }); await reload(); } catch (e) { setAccionError(errorMessage(e)); }
  }
  async function aprobar(id: number) {
    setAccionError(null);
    try { await api.post(`/pagos/${id}/aprobar-transferencia`); await reload(); } catch (e) { setAccionError(errorMessage(e)); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl">{def.titulo}</h1>
        <input className="input max-w-xs" type="search" placeholder="Buscar…" aria-label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {accionError && <div className="mt-4"><Alert>{accionError}</Alert></div>}
      {loading ? <Spinner /> : error ? <div className="mt-6"><Alert>{error}</Alert></div> : !filas.length ? (
        <div className="mt-6"><Vacio titulo="Sin registros" texto={q ? "Ningún registro coincide con la búsqueda." : "Todavía no hay datos en esta sección."} /></div>
      ) : (
        <div className="tarjeta mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-linea text-xs text-tinta-500">
              <tr>{columnas.map((c) => <th key={c} className="whitespace-nowrap p-3 font-medium">{capitalizar(c)}</th>)}{(def.estados || def.pagos) && <th className="p-3">Acciones</th>}</tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className="border-b border-linea last:border-0">
                  {columnas.map((c) => <td key={c} className="whitespace-nowrap p-3">{celda(c, f[c])}</td>)}
                  {def.estados && (
                    <td className="p-3">
                      <select aria-label="Cambiar estado" className="input py-1.5 text-xs" value="" onChange={(e) => e.target.value && cambiarEstado(f.id, e.target.value)}>
                        <option value="">Cambiar estado…</option>
                        {def.estados.opciones.filter((o) => o !== f.estado).map((o) => <option key={o} value={o}>{capitalizar(o)}</option>)}
                      </select>
                    </td>
                  )}
                  {def.pagos && (
                    <td className="p-3">{f.metodo === "transferencia" && f.estado === "pendiente" && <button className="btn-contorno px-3 py-1.5 text-xs" onClick={() => aprobar(f.id)}>Aprobar transferencia</button>}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
