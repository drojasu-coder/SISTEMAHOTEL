import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { quetzales } from "../../lib/format";
import { Spinner } from "../../components/ui";
import { Link } from "react-router-dom";

type Fila = Record<string, any>;

/**
 * Indicadores calculados en el navegador con los listados existentes.
 * (No hay endpoints de métricas todavía; cuando existan se reemplaza esto por una sola llamada.)
 */
export default function Dashboard() {
  const { data, loading } = useFetch(async () => {
    const pedir = (p: string) => api.get<Fila[]>(p).catch(() => null);
    const [reservas, habs, pagos, eventos, boletos] = await Promise.all([
      pedir("/reservas-habitacion"), pedir("/habitaciones"), pedir("/pagos"), pedir("/reservas-evento"), pedir("/boletos-parque"),
    ]);
    return { reservas, habs, pagos, eventos, boletos };
  });
  if (loading || !data) return <Spinner />;
  const { reservas, habs, pagos, eventos, boletos } = data;
  const aprobado = pagos?.filter((p) => p.estado === "aprobado").reduce((s, p) => s + Number(p.monto), 0);
  const ocupadas = habs?.filter((h) => h.estado === "ocupada").length;
  const kpis: [string, string, string][] = [
    ["Reservas de habitación", reservas ? String(reservas.length) : "—", `${reservas?.filter((r) => r.estado === "pendiente").length ?? 0} pendientes`],
    ["Ingresos aprobados", pagos ? quetzales(aprobado) : "—", `${pagos?.length ?? 0} pagos registrados`],
    ["Ocupación", habs ? `${habs.length ? Math.round(((ocupadas ?? 0) / habs.length) * 100) : 0}%` : "—", `${ocupadas ?? 0} de ${habs?.length ?? 0} habitaciones`],
    ["Eventos", eventos ? String(eventos.length) : "—", `${eventos?.filter((e) => e.estado === "confirmada").length ?? 0} confirmados`],
    ["Boletos del parque", boletos ? String(boletos.length) : "—", `${boletos?.filter((b) => b.estado === "valido").length ?? 0} válidos`],
  ];
  return (
    <div>
      <h1 className="font-serif text-4xl">Dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(([t, v, s]) => (
          <div key={t} className="tarjeta p-5"><p className="text-xs text-tinta-500">{t}</p><p className="mt-2 font-serif text-3xl">{v}</p><p className="mt-1 text-xs text-tinta-500">{s}</p></div>
        ))}
      </div>
      <p className="mt-8 max-w-xl text-sm text-tinta-500">Las gráficas de reservas por semana, ingresos mensuales y ocupación por tipo del mockup necesitan endpoints de reportes que el backend todavía no tiene. Mientras tanto puedes revisar y gestionar cada sección desde el menú lateral, por ejemplo <Link className="text-bronce-700 underline" to="/admin/pagos">Pagos</Link>.</p>
    </div>
  );
}
