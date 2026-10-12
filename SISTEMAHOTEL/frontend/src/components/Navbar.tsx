import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const links = [
  ["/habitaciones", "Habitaciones"],
  ["/eventos", "Eventos"],
  ["/restaurante", "Restaurante y Bar"],
  ["/actividades", "Actividades"],
  ["/amenidades", "Amenidades"],
  ["/spa", "Spa"],
  ["/parque", "Parque Temático"],
] as const;

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const { items } = useCart();
  const nav = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [menu, setMenu] = useState(false);
  const iniciales = user?.nombre.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-crema/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link to="/" className="font-serif text-lg leading-none tracking-wide">
          Hotel Hunahpú
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
          {links.map(([to, txt]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `text-[13px] transition-colors hover:text-bronce ${isActive ? "text-bronce" : "text-tinta-700"}`}>
              {txt}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {!user ? (
            <>
              <Link to="/login" className="text-[13px] text-tinta-700 hover:text-bronce">Iniciar sesión</Link>
              <Link to="/habitaciones" className="btn-primario">Reservar ahora</Link>
            </>
          ) : (
            <>
              {!isStaff && <Link to="/habitaciones" className="btn-primario">Reservar ahora</Link>}
              <div className="relative">
                <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2" aria-haspopup="menu" aria-expanded={menu}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tinta text-xs font-medium text-crema">{iniciales}</span>
                  <span className="text-[13px]">{user.nombre.split(" ")[0]}</span>
                </button>
                {menu && (
                  <div role="menu" className="absolute right-0 mt-2 w-52 border border-linea bg-crema-50 py-1 text-sm shadow-lg" onClick={() => setMenu(false)}>
                    {isStaff ? (
                      <Link role="menuitem" to="/admin" className="block px-4 py-2 hover:bg-crema-200">Panel de administración</Link>
                    ) : (
                      <>
                        <Link role="menuitem" to="/cuenta" className="block px-4 py-2 hover:bg-crema-200">Mi cuenta</Link>
                        <Link role="menuitem" to="/cuenta/reservas" className="block px-4 py-2 hover:bg-crema-200">Mis reservas</Link>
                        <Link role="menuitem" to="/cuenta/pagos" className="block px-4 py-2 hover:bg-crema-200">Mis pagos</Link>
                      </>
                    )}
                    <button role="menuitem" className="block w-full px-4 py-2 text-left text-error hover:bg-crema-200" onClick={() => { logout(); nav("/"); }}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
              {!isStaff && (
                <Link to="/carrito" aria-label={`Carrito, ${items.length} elementos`} className="relative p-1">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></svg>
                  {items.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bronce px-1 text-[10px] text-white">{items.length}</span>}
                </Link>
              )}
            </>
          )}
        </div>

        <button className="lg:hidden" aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>

      {abierto && (
        <div className="border-t border-linea bg-crema px-6 py-4 lg:hidden" onClick={() => setAbierto(false)}>
          <nav className="flex flex-col gap-3 text-sm">
            {links.map(([to, txt]) => <NavLink key={to} to={to}>{txt}</NavLink>)}
            <hr className="border-linea" />
            {!user ? <Link to="/login">Iniciar sesión</Link> : (
              <>
                {isStaff ? <Link to="/admin">Panel de administración</Link> : (
                  <>
                    <Link to="/carrito">Carrito ({items.length})</Link>
                    <Link to="/cuenta">Mi cuenta</Link>
                    <Link to="/cuenta/reservas">Mis reservas</Link>
                  </>
                )}
                <button className="text-left text-error" onClick={() => { logout(); nav("/"); }}>Cerrar sesión</button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
