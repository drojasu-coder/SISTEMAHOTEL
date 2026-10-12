import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

/** Protege rutas: exige sesión y, opcionalmente, un tipo de usuario. */
export default function Guard({ children, solo }: { children: ReactNode; solo?: "cliente" | "staff" }) {
  const { user, loading, isStaff } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  if (solo === "cliente" && isStaff) return <Navigate to="/admin" replace />;
  if (solo === "staff" && !isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}
