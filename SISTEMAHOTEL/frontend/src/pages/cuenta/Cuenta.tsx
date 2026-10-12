import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/ui";
import CuentaLayout from "./CuentaNav";

export default function Cuenta() {
  const { user } = useAuth();
  if (!user) return null;
  const filas: [string, string][] = [["Nombre", user.nombre], ["Correo electrónico", user.email], ["Teléfono", user.telefono || "Sin registrar"]];
  return (
    <CuentaLayout>
      <section className="tarjeta p-6">
        <h2 className="font-serif text-2xl">Datos personales</h2>
        <dl className="mt-5 grid gap-5 md:grid-cols-2">
          {filas.map(([k, v]) => (
            <div key={k}><dt className="etiqueta">{k}</dt><dd className="border border-linea bg-crema-200 px-4 py-3 text-sm">{v}</dd></div>
          ))}
        </dl>
      </section>
      <div className="mt-6">
        <Alert tipo="info">Por ahora los datos personales y fiscales (NIT) son de solo lectura: el backend aún no tiene un endpoint para que el cliente los edite.</Alert>
      </div>
    </CuentaLayout>
  );
}
