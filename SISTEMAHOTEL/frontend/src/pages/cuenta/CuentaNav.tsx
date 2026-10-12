import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const tabs = [["/cuenta", "Mi cuenta", true], ["/cuenta/reservas", "Mis reservas", false], ["/cuenta/pagos", "Mis pagos", false]] as const;

export default function CuentaLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <>
      <header className="border-b border-linea px-6 py-10 text-center">
        <h1 className="font-serif text-4xl">Hola, {user?.nombre.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-tinta-500">{user?.nombre} · {user?.email}</p>
      </header>
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-[200px_1fr]">
        <nav aria-label="Cuenta" className="tarjeta h-fit">
          {tabs.map(([to, t, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `block border-l-2 px-4 py-3 text-sm ${isActive ? "border-bronce bg-crema-200" : "border-transparent hover:bg-crema-200"}`}>{t}</NavLink>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </>
  );
}
