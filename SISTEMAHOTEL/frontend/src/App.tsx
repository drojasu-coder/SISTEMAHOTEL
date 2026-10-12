import { createBrowserRouter, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/Layout";
import Guard from "./components/Guard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Habitaciones from "./pages/Habitaciones";
import Eventos from "./pages/Eventos";
import Restaurante from "./pages/Restaurante";
import Actividades from "./pages/Actividades";
import Amenidades from "./pages/Amenidades";
import Spa from "./pages/Spa";
import Parque from "./pages/Parque";
import Carrito from "./pages/Carrito";
import Checkout from "./pages/Checkout";
import Cuenta from "./pages/cuenta/Cuenta";
import MisReservas from "./pages/cuenta/MisReservas";
import MisPagos from "./pages/cuenta/MisPagos";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRecurso from "./pages/admin/Recurso";
import NoEncontrada from "./pages/NoEncontrada";

/** Los proveedores envuelven todo el árbol de rutas (los hooks de contexto lo necesitan). */
function Raiz() {
  return (
    <AuthProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/login", element: <Login /> },
          { path: "/registro", element: <Registro /> },
          { path: "/habitaciones", element: <Habitaciones /> },
          { path: "/eventos", element: <Eventos /> },
          { path: "/restaurante", element: <Restaurante /> },
          { path: "/actividades", element: <Actividades /> },
          { path: "/amenidades", element: <Amenidades /> },
          { path: "/spa", element: <Spa /> },
          { path: "/parque", element: <Parque /> },
          { path: "/carrito", element: <Guard solo="cliente"><Carrito /></Guard> },
          { path: "/checkout", element: <Guard solo="cliente"><Checkout /></Guard> },
          { path: "/cuenta", element: <Guard solo="cliente"><Cuenta /></Guard> },
          { path: "/cuenta/reservas", element: <Guard solo="cliente"><MisReservas /></Guard> },
          { path: "/cuenta/pagos", element: <Guard solo="cliente"><MisPagos /></Guard> },
          { path: "*", element: <NoEncontrada /> },
        ],
      },
      {
        path: "/admin",
        element: <Guard solo="staff"><AdminLayout /></Guard>,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: ":recurso", element: <AdminRecurso /> },
        ],
      },
    ],
  },
]);
