import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/AuthContext";
import { tokenStorage } from "@/api/session";
import { RESERVAS_ROUTES } from "@/features/reservas";
import { GuestLayout } from "@/layouts/GuestLayout";
import { CrearReservaPage } from "@/pages/CrearReservaPage";
import { MisReservasPage } from "@/pages/MisReservasPage";
import { DetalleReservaHabitacionPage } from "@/pages/DetalleReservaHabitacionPage";
import { textosCrearReserva } from "@/features/crear-reserva/textos";
import { textosMisReservas } from "@/features/mis-reservas/textos";
import { jsonResponse } from "@/test/renderWithProviders";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderReservasRouter(initialRoute: string) {
  const queryClient = createTestQueryClient();
  return {
    ...waitFor,
    ...screen,
    ...renderUI(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route element={<GuestLayout />}>
                <Route path={RESERVAS_ROUTES.NUEVA} element={<CrearReservaPage />} />
                <Route path={RESERVAS_ROUTES.MIS_RESERVAS} element={<MisReservasPage />} />
                <Route path="/mis-reservas/:id" element={<DetalleReservaHabitacionPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    ),
  };
}

import { render as renderUI } from "@testing-library/react";

describe("Enrutamiento del flujo de reservas (AppRouter / GuestLayout)", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it("ruta /reservar con rol cliente muestra el formulario de disponibilidad y creación", async () => {
    tokenStorage.set("jwt-cliente");
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/me")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            data: { id: 10, nombre: "Cliente QA", email: "cliente@ejemplo.test", rol: "cliente", activo: true },
          })
        );
      }
      if (url.includes("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: [] }));
      }
      if (url.includes("/tipos-habitacion")) {
        return Promise.resolve(jsonResponse({ success: true, statusCode: 200, data: [] }));
      }
      return Promise.reject(new Error("Unhandled route " + url));
    });

    renderReservasRouter(RESERVAS_ROUTES.NUEVA);

    expect(
      await screen.findByRole("heading", { name: textosCrearReserva.tituloPagina, level: 1 })
    ).toBeInTheDocument();
  });

  it("ruta /mis-reservas con rol cliente muestra el listado de reservas del usuario", async () => {
    tokenStorage.set("jwt-cliente");
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/me")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            data: { id: 10, nombre: "Cliente QA", email: "cliente@ejemplo.test", rol: "cliente", activo: true },
          })
        );
      }
      if (url.includes("/reservas-habitacion")) {
        return Promise.resolve(jsonResponse({ success: true, statusCode: 200, message: "ok", data: [] }));
      }
      return Promise.reject(new Error("Unhandled route " + url));
    });

    renderReservasRouter(RESERVAS_ROUTES.MIS_RESERVAS);

    expect(
      await screen.findByRole("heading", { name: textosMisReservas.titulo, level: 1 })
    ).toBeInTheDocument();
  });

  it("apertura directa de /mis-reservas/:id muestra el detalle de la reserva por identificador", async () => {
    tokenStorage.set("jwt-cliente");
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/me")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            data: { id: 10, nombre: "Cliente QA", email: "cliente@ejemplo.test", rol: "cliente", activo: true },
          })
        );
      }
      if (url.includes("/reservas-habitacion/42")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "ok",
            data: {
              id: 42,
              usuario_id: 10,
              habitacion_id: 5,
              fecha_entrada: "2027-08-01",
              fecha_salida: "2027-08-05",
              numero_huespedes: 2,
              estado: "confirmada",
              total: "600.00",
              createdAt: "2027-07-20T10:00:00Z",
              updatedAt: "2027-07-20T10:00:00Z",
              Habitacion: {
                id: 5,
                sucursal_id: 1,
                tipo_habitacion_id: 2,
                numero: "205",
                estado: "disponible",
                Sucursal: { id: 1, nombre: "Hotel Central", activa: true },
                TipoHabitacion: { id: 2, nombre: "Doble Deluxe", capacidad_maxima: 3, tarifa_noche: "150.00" },
              },
            },
          })
        );
      }
      return Promise.reject(new Error("Unhandled route " + url));
    });

    renderReservasRouter("/mis-reservas/42");

    expect(
      await screen.findByRole("heading", { name: textosMisReservas.reservaNumero(42), level: 1 })
    ).toBeInTheDocument();
  });

  it("ruta /reservar sin sesión muestra búsqueda pública y no exige autenticación anticipada", async () => {
    global.fetch = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ data: [] })));
    renderReservasRouter(RESERVAS_ROUTES.NUEVA);

    expect(
      await screen.findByRole("heading", { name: textosCrearReserva.tituloPagina, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: textosCrearReserva.botonBuscar })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: textosCrearReserva.accesoRestringidoTitulo })).not.toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/public/tipos-habitacion'))).toBe(true));
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).endsWith('/api/tipos-habitacion') || String(url).endsWith('/auth/me'))).toBe(false);
  });

  it("ruta /mis-reservas sin sesión muestra estado sin sesión y enlace al login", async () => {
    renderReservasRouter(RESERVAS_ROUTES.MIS_RESERVAS);

    expect(
      await screen.findByRole("heading", { name: textosMisReservas.acceso.sinSesionTitulo })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: textosMisReservas.acceso.iniciarSesion })).toHaveAttribute("href", "/login");
  });

  it("usuario administrativo en /reservar o /mis-reservas ve aviso de rol no cliente y enlace a su espacio", async () => {
    tokenStorage.set("jwt-admin");
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/me")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            data: { id: 1, nombre: "Admin QA", email: "admin@ejemplo.test", rol: "admin", activo: true },
          })
        );
      }
      return Promise.reject(new Error("Unhandled route " + url));
    });

    renderReservasRouter(RESERVAS_ROUTES.MIS_RESERVAS);

    expect(
      await screen.findByRole("heading", { name: textosMisReservas.acceso.rolTitulo })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: textosMisReservas.acceso.irMiEspacio })).toHaveAttribute("href", "/admin");
  });

  it("apertura directa con ID inválido en /mis-reservas/:id muestra aviso de identificador inválido", async () => {
    tokenStorage.set("jwt-cliente");
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/me")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            data: { id: 10, nombre: "Cliente QA", email: "cliente@ejemplo.test", rol: "cliente", activo: true },
          })
        );
      }
      return Promise.reject(new Error("Unhandled route " + url));
    });

    renderReservasRouter("/mis-reservas/invalido");

    expect(
      await screen.findByRole("heading", { name: textosMisReservas.idInvalidoTitulo })
    ).toBeInTheDocument();
  });
});
