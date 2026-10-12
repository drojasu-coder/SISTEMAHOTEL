import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { RECURSOS } from "./recursos";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-tinta text-crema md:flex">
        <div className="px-6 py-7">
          <p className="font-serif text-xl text-crema">Hotel Hunahpú</p>
          <p className="mt-1 text-xs text-crema/60">Administración</p>
        </div>
        <nav className="flex-1 overflow-y-auto" aria-label="Administración">
          <NavLink to="/admin" end className={({ isActive }) => `block border-l-2 px-6 py-2.5 text-sm ${isActive ? "border-bronce bg-white/5" : "border-transparent text-crema/75 hover:bg-white/5"}`}>Dashboard</NavLink>
          {RECURSOS.map((r) => (
            <NavLink key={r.slug} to={`/admin/${r.slug}`} className={({ isActive }) => `block border-l-2 px-6 py-2.5 text-sm ${isActive ? "border-bronce bg-white/5" : "border-transparent text-crema/75 hover:bg-white/5"}`}>{r.titulo}</NavLink>
          ))}
        </nav>
        <button onClick={logout} className="px-6 py-4 text-left text-sm text-crema/70 hover:text-crema">Cerrar sesión</button>
      </aside>
      <div className="flex-1 overflow-x-hidden">
        <header className="flex items-center justify-between border-b border-linea px-6 py-5">
          <p className="text-xs text-tinta-500">Hotel Hunahpú · Panel</p>
          <div className="text-right"><p className="text-sm">{user?.nombre}</p><p className="text-xs capitalize text-tinta-500">{user?.rol.replaceAll("_", " ")}</p></div>
        </header>
        <div className="p-6"><Outlet /></div>
      </div>
    </div>
  );
}
