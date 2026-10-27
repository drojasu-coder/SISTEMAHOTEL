import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from "@/test/renderWithProviders";
import { tokenStorage } from "@/api/session";
import { MisReservasRestaurantePage } from "@/pages/MisReservasRestaurantePage";
import { DetalleReservaRestaurantePage } from "@/pages/DetalleReservaRestaurantePage";
import type { ReservaMesa } from "./types";

const mockMisReservas: ReservaMesa[] = [
  {
    id: 10,
    usuario_id: 1,
    mesa_id: 101,
    fecha: "2027-08-20",
    hora: "13:00",
    numero_comensales: 4,
    estado: "confirmada",
    Mesa: {
      id: 101,
      zona: "Terraza",
      capacidad: 4,
      estado: "disponible",
      sucursal_id: 1,
      Sucursal: { id: 1, nombre: "Hotel Hunapú Antigua" },
    },
  },
  {
    id: 20,
    usuario_id: 1,
    mesa_id: 201,
    fecha: "2027-08-25",
    hora: "20:00",
    numero_comensales: 2,
    estado: "cancelada",
    Mesa: {
      id: 201,
      zona: "Jardín",
      capacidad: 6,
      estado: "disponible",
      sucursal_id: 2,
      Sucursal: { id: 2, nombre: "Hotel Hunapú Atitlán" },
    },
  },
];

describe("Mis Reservas de Restaurante (Cliente)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (role = "cliente", customReservas = mockMisReservas) => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = String(url);

      if (urlStr.endsWith("/auth/me")) {
        return Promise.resolve(meResponse(role));
      }

      if (urlStr.endsWith("/reservas-mesa/mis-reservas")) {
        return Promise.resolve(
          jsonResponse({ status: "success", data: customReservas })
        );
      }

      const singleMatch = urlStr.match(/\/reservas-mesa\/mis-reservas\/(\d+)$/);
      if (singleMatch) {
        const id = parseInt(singleMatch[1], 10);
        const item = customReservas.find((r) => r.id === id);
        if (item) {
          return Promise.resolve(jsonResponse({ status: "success", data: item }));
        }
        return Promise.resolve(
          errorResponse(404, "TABLE_RESERVATION_NOT_FOUND", "No encontrada")
        );
      }

      return Promise.reject(new Error(`Unhandled request to ${urlStr}`));
    });
  };

  it("cliente autenticado lista sus reservas de mesa con sede, fecha, hora y comensales", async () => {
    tokenStorage.set("cliente-token");
    setupFetchMock();

    renderWithProviders(<MisReservasRestaurantePage />);

    expect(await screen.findByText(/Mis Reservas de Restaurante/i)).toBeInTheDocument();
    expect(await screen.findByText(/Mesa #101 — Terraza/i)).toBeInTheDocument();
    expect(screen.getByText(/Mesa #201 — Jardín/i)).toBeInTheDocument();
    expect(screen.getByText(/Hotel Hunapú Antigua/i)).toBeInTheDocument();
    expect(screen.getByText(/2027-08-20/i)).toBeInTheDocument();
    expect(screen.getByText(/13:00/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmada/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancelada/i)).toBeInTheDocument();

    const detalleLinks = screen.getAllByRole("link", { name: /Ver detalle/i });
    expect(detalleLinks[0]).toHaveAttribute("href", "/mis-reservas/restaurante/10");
  });

  it("muestra estado vacío cuando el cliente no posee reservas de mesa", async () => {
    tokenStorage.set("cliente-token");
    setupFetchMock("cliente", []);

    renderWithProviders(<MisReservasRestaurantePage />);

    expect(await screen.findByText(/No posee reservas de restaurante/i)).toBeInTheDocument();
    const exploreLink = screen.getByRole("link", { name: /Explorar restaurante/i });
    expect(exploreLink).toHaveAttribute("href", "/restaurante");
  });

  it("apertura directa de detalle por URL /mis-reservas/restaurante/:id", async () => {
    tokenStorage.set("cliente-token");
    setupFetchMock();

    renderWithProviders(
      <Routes>
        <Route
          path="/mis-reservas/restaurante/:id"
          element={<DetalleReservaRestaurantePage />}
        />
      </Routes>,
      { route: "/mis-reservas/restaurante/10" }
    );

    expect(await screen.findByText(/Detalle de Reserva de Restaurante #10/i)).toBeInTheDocument();
    expect(screen.getByText(/Hotel Hunapú Antigua/i)).toBeInTheDocument();
    expect(screen.getByText(/Mesa #101/i)).toBeInTheDocument();
    expect(screen.getByText(/4 personas/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Volver a Mis Reservas/i })[0]).toHaveAttribute(
      "href",
      "/mis-reservas/restaurante"
    );
  });

  it("muestra aviso de identificador inválido ante ID no numérico", async () => {
    tokenStorage.set("cliente-token");
    setupFetchMock();

    renderWithProviders(
      <Routes>
        <Route
          path="/mis-reservas/restaurante/:id"
          element={<DetalleReservaRestaurantePage />}
        />
      </Routes>,
      { route: "/mis-reservas/restaurante/invalido" }
    );

    expect(await screen.findByText(/Identificador inválido/i)).toBeInTheDocument();
  });
});
