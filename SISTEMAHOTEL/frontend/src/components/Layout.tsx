import { Link, Outlet, ScrollRestoration } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-linea bg-crema-200 px-6 py-10 text-sm text-tinta-500">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 md:flex-row">
          <div>
            <p className="font-serif text-lg text-tinta">Hotel Hunahpú</p>
            <p className="mt-1">Hotel boutique en Guatemala.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Pie de página">
            <Link to="/habitaciones">Habitaciones</Link>
            <Link to="/eventos">Eventos</Link>
            <Link to="/restaurante">Restaurante</Link>
            <Link to="/spa">Spa</Link>
            <Link to="/parque">Parque</Link>
          </nav>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
