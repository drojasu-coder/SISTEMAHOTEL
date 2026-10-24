import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from "@/test/renderWithProviders";
import { tokenStorage } from "@/api/session";
import { MisReservasAmenidadesPage } from "@/pages/MisReservasAmenidadesPage";
import { DetalleReservaAmenidadPage } from "@/pages/DetalleReservaAmenidadPage";
import type { ReservaAmenidad } from "./types";

const mockReservas: ReservaAmenidad[] = [
  {
    id: 101,
    usuario_id: 1,
    amenidad_id: 10,
    fecha: "2027-06-15",
    franja_horaria: "10:00 - 12:00",
    mobiliario: "Toalla extra",
    codigo_qr: "AMENITY-TEST-CODE-101",
    estado: "confirmada",
    createdAt: "2026-10-24T12:00:00.000Z",
    updatedAt: "2026-10-24T12:00:00.000Z",
    Amenidad: {
      id: 10,
      sucursal_id: 1,
      nombre: "Piscina Climatizada",
      aforo_maximo: 25,
      Sucursal: { id: 1, nombre: "Hotel Hunapú Antigua" },
    },
  },
  {
    id: 102,
    usuario_id: 1,
    amenidad_id: 20,
    fecha: "2027-06-16",
    franja_horaria: "14:00 - 15:00",
    mobiliario: "ninguno",
    codigo_qr: "AMENITY-TEST-CODE-102",
    estado: "usada",
    createdAt: "2026-10-24T12:00:00.000Z",
    updatedAt: "2026-10-24T12:00:00.000Z",
    Amenidad: {
      id: 20,
      sucursal_id: 2,
      nombre: "Sauna Finlandés",
      aforo_maximo: 8,
      Sucursal: { id: 2, nombre: "Hotel Hunapú Atitlán" },
    },
  },
];

describe("Mis Reservas de Amenidades (MisReservasAmenidadesPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (reservas = mockReservas) => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(meResponse("cliente"));
      }
      if (url.endsWith("/reservas-amenidad")) {
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: reservas,
          })
        );
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });
  };

  it("renderiza el listado de reservas propias con datos reales", async () => {
    tokenStorage.set("jwt-cliente");
    setupFetchMock();

    renderWithProviders(<MisReservasAmenidadesPage />);

    expect(await screen.findByText("Piscina Climatizada")).toBeInTheDocument();
    expect(screen.getByText("Hotel Hunapú Antigua")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 12:00")).toBeInTheDocument();
    expect(screen.getByText(/Toalla extra/i)).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();

    expect(screen.getByText("Sauna Finlandés")).toBeInTheDocument();
    expect(screen.getByText("Completada / Usada")).toBeInTheDocument();

    // Enlaces funcionales hacia detalle
    const detalleLinks = screen.getAllByRole("link", { name: /Ver pase y código de acceso/i });
    expect(detalleLinks.length).toBe(2);
    expect(detalleLinks[0]).toHaveAttribute("href", "/mis-reservas/amenidades/101");
  });

  it("muestra estado vacío cuando el cliente no tiene reservas", async () => {
    tokenStorage.set("jwt-cliente");
    setupFetchMock([]);

    renderWithProviders(<MisReservasAmenidadesPage />);

    expect(await screen.findByText(/No posee reservas de amenidades/i)).toBeInTheDocument();
    const exploreLinks = screen.getAllByRole("link", { name: /Explorar catálogo de amenidades/i });
    expect(exploreLinks.length).toBeGreaterThan(0);
    expect(exploreLinks[0]).toHaveAttribute("href", "/amenidades");
  });
});

describe("Detalle de Reserva de Amenidad (DetalleReservaAmenidadPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  it("muestra detalle completo con QR SVG y código textual", async () => {
    tokenStorage.set("jwt-cliente");
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(meResponse("cliente"));
      }
      if (url.endsWith("/reservas-amenidad/101")) {
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: mockReservas[0],
          })
        );
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });

    renderWithProviders(
      <Routes>
        <Route path="/mis-reservas/amenidades/:id" element={<DetalleReservaAmenidadPage />} />
      </Routes>,
      {
        route: "/mis-reservas/amenidades/101",
      }
    );

    expect(await screen.findByText("Comprobante de Reserva")).toBeInTheDocument();
    expect(screen.getByText("Piscina Climatizada")).toBeInTheDocument();
    expect(screen.getByText("Código QR de Acceso")).toBeInTheDocument();
    expect(screen.getByText("AMENITY-TEST-CODE-101")).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();

    // Debe contener el SVG del QR
    const qrSvg = document.querySelector("svg");
    expect(qrSvg).toBeInTheDocument();

    // No debe mostrar precios ficticios
    expect(screen.queryByText(/GTQ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$/i)).not.toBeInTheDocument();
  });

  it("muestra error adecuado cuando la reserva es ajena o inexistente", async () => {
    tokenStorage.set("jwt-cliente");
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(meResponse("cliente"));
      }
      if (url.endsWith("/reservas-amenidad/999")) {
        return Promise.resolve(
          errorResponse(403, "INSUFFICIENT_PERMISSIONS", "No tiene permisos para acceder a esta reserva de amenidad")
        );
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });

    renderWithProviders(
      <Routes>
        <Route path="/mis-reservas/amenidades/:id" element={<DetalleReservaAmenidadPage />} />
      </Routes>,
      {
        route: "/mis-reservas/amenidades/999",
      }
    );

    expect(
      await screen.findByText("La reserva de amenidad solicitada no fue encontrada o no pertenece a su cuenta.")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Volver a Mis Reservas/i }).length).toBeGreaterThan(0);
  });
});
