import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Spinner } from "./ui";

/** Muestra su contenido solo a clientes con sesión; si no, explica qué hacer. */
export default function RequiereCliente({ children, accion = "reservar" }: { children: ReactNode; accion?: string }) {
  const { user, loading, isStaff } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) {
    return (
      <div className="tarjeta p-6">
        <p className="font-serif text-xl">Inicia sesión para {accion}</p>
        <p className="mt-1 text-sm text-tinta-500">Tu cuenta guarda tus reservas y tu carrito.</p>
        <div className="mt-4 flex gap-3">
          <Link to="/login" state={{ from: loc.pathname }} className="btn-primario">Iniciar sesión</Link>
          <Link to="/registro" className="btn-contorno">Crear cuenta</Link>
        </div>
      </div>
    );
  }
  if (isStaff) return <Alert tipo="info">Estás con una cuenta de personal. Las reservas se hacen con una cuenta de cliente; usa el panel de administración para gestionarlas.</Alert>;
  return <>{children}</>;
}
