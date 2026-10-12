import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";
import { Alert, Campo } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = await login(email, password);
      nav(u.rol === "cliente" ? from ?? "/" : "/admin", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-4xl">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-tinta-500">Entra para reservar y pagar tus servicios.</p>
      <form onSubmit={enviar} className="tarjeta mt-8 space-y-5 p-6">
        {error && <Alert>{error}</Alert>}
        <Campo etiqueta="Correo electrónico">
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        <Campo etiqueta="Contraseña">
          <input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Campo>
        <button className="btn-primario w-full" disabled={enviando}>{enviando ? "Entrando…" : "Iniciar sesión"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-tinta-500">
        ¿Aún no tienes cuenta? <Link to="/registro" className="text-bronce-700 underline">Crear cuenta</Link>
      </p>
    </div>
  );
}
