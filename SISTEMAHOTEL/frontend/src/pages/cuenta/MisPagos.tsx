import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { capitalizar, fechaCorta, quetzales } from "../../lib/format";
import type { Pago } from "../../lib/types";
import { Alert, Insignia, Spinner, tonoEstado, Vacio } from "../../components/ui";
import CuentaLayout from "./CuentaNav";

export default function MisPagos() {
  const { data, loading, error } = useFetch(() => api.get<Pago[]>("/pagos"));
  return (
    <CuentaLayout>
      {loading ? <Spinner /> : error ? <Alert>{error}</Alert> : !data?.length ? (
        <Vacio titulo="Todavía no tienes pagos" texto="Tus pagos con tarjeta o transferencia aparecerán aquí." />
      ) : (
        <div className="tarjeta overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-linea text-xs text-tinta-500"><tr><th className="p-4">Fecha</th><th className="p-4">Método</th><th className="p-4">Tipo</th><th className="p-4">Monto</th><th className="p-4">Estado</th></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-linea last:border-0">
                  <td className="p-4">{fechaCorta(p.creado_en)}</td>
                  <td className="p-4 capitalize">{p.metodo}</td>
                  <td className="p-4 capitalize">{p.tipo_pago}</td>
                  <td className="p-4">{quetzales(p.monto)}</td>
                  <td className="p-4"><Insignia tono={tonoEstado(p.estado)}>{capitalizar(p.estado)}</Insignia></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CuentaLayout>
  );
}
