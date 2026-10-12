import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";
import { Alert, Campo } from "../components/ui";

export default function Registro() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await register({ nombre: f.nombre, email: f.email, password: f.password, telefono: f.telefono || undefined });
      nav("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-4xl">Crear cuenta</h1>
      <p className="mt-2 text-sm text-tinta-500">Con tu cuenta puedes reservar y ver tus compras.</p>
      <form onSubmit={enviar} className="tarjeta mt-8 space-y-5 p-6">
        {error && <Alert>{error}</Alert>}
        <Campo etiqueta="Nombre completo"><input className="input" required minLength={2} autoComplete="name" value={f.nombre} onChange={set("nombre")} /></Campo>
        <Campo etiqueta="Correo electrónico"><input className="input" type="email" required autoComplete="email" value={f.email} onChange={set("email")} /></Campo>
        <Campo etiqueta="Teléfono (opcional)"><input className="input" type="tel" autoComplete="tel" placeholder="+502 5555 0184" value={f.telefono} onChange={set("telefono")} /></Campo>
        <Campo etiqueta="Contraseña">
          <input className="input" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set("password")} />
          <span className="mt-1 block text-xs text-tinta-500">Mínimo 8 caracteres, con mayúscula, minúscula y número.</span>
        </Campo>
        <button className="btn-primario w-full" disabled={enviando}>{enviando ? "Creando cuenta…" : "Crear cuenta"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-tinta-500">
        ¿Ya tienes cuenta? <Link to="/login" className="text-bronce-700 underline">Iniciar sesión</Link>
      </p>
    </div>
  );
}
