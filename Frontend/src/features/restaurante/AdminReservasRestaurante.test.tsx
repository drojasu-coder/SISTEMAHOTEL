import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from "@/test/renderWithProviders";
import { tokenStorage } from "@/api/session";
import { AdminReservasRestaurantePage } from "@/pages/AdminReservasRestaurantePage";
import { AdminScopeProvider } from "@/features/admin-core/AdminScopeContext";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { AdminDetalleReservaRestaurantePage } from "@/pages/AdminDetalleReservaRestaurantePage";
import type { ReservaMesa } from "./types";

const mockAdminReservas: ReservaMesa[] = [
  {
    id: 501,
    usuario_id: 10,
    mesa_id: 101,
    fecha: "2027-09-01",
    hora: "12:00",
    numero_comensales: 4,
    estado: "confirmada",
    Usuario: { id: 10, nombre: "Carlos Méndez", email: "carlos@example.com" },
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
    id: 502,
    usuario_id: 20,
    mesa_id: 201,
    fecha: "2027-09-02",
    hora: "20:00",
    numero_comensales: 2,
    estado: "cancelada",
    Usuario: { id: 20, nombre: "Elena Gómez", email: "elena@example.com" },
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

describe("Atención Administrativa de Reservas de Restaurante", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (patchResponse?: any) => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);

      if (urlStr.endsWith("/auth/me")) {
        return Promise.resolve(meResponse("admin"));
      }

      if (urlStr.endsWith("/sucursales")) {
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: [
              { id: 1, nombre: "Hotel Hunapú Antigua" },
              { id: 2, nombre: "Hotel Hunapú Atitlán" },
            ],
          })
        );
      }

      if (urlStr.endsWith("/reservas-mesa") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({ status: "success", data: mockAdminReservas })
        );
      }

      const patchMatch = urlStr.match(/\/reservas-mesa\/(\d+)\/estado$/);
      if (patchMatch && config && config.method === "PATCH") {
        if (patchResponse) return Promise.resolve(patchResponse);
        const id = parseInt(patchMatch[1], 10);
        const body = JSON.parse(config.body);
        const updated = {
          ...mockAdminReservas.find((r) => r.id === id),
          estado: body.estado,
        };
        return Promise.resolve(jsonResponse({ status: "success", data: updated }));
      }

      const singleMatch = urlStr.match(/\/reservas-mesa\/(\d+)$/);
      if (singleMatch) {
        const id = parseInt(singleMatch[1], 10);
        const item = mockAdminReservas.find((r) => r.id === id);
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

  it("administrador visualiza todas las reservas de restaurante con datos de cliente, mesa y sede", async () => {
    tokenStorage.set("admin-token");
    setupFetchMock();

    renderWithProviders(<AdminReservasRestaurantePage />);

    expect(await screen.findByText(/Reservas de Restaurante/i)).toBeInTheDocument();
    expect(await screen.findByText(/Carlos Méndez/i)).toBeInTheDocument();
    expect(screen.getByText(/Elena Gómez/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Hotel Hunapú Antigua/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Hotel Hunapú Atitlán/i).length).toBeGreaterThanOrEqual(1);

    const detalleLinks = screen.getAllByRole("link", { name: /Ver detalle/i });
    expect(detalleLinks[0]).toHaveAttribute("href", "/admin/reservas-restaurante/501");
  });

  it("usa la sede del selector global en el servidor y no inventa estados", async () => {
    tokenStorage.set("admin-token");
    sessionStorage.setItem("hunahpu.admin.scope.sede.v1:3", "1");
    setupFetchMock();
    const baseFetch = global.fetch as ReturnType<typeof vi.fn>;
    const deSede1 = mockAdminReservas.filter((r) => r.Mesa?.sucursal_id === 1);
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/admin/alcance")) {
        return Promise.resolve(jsonResponse({ success: true, data: { global: true, sedes: [
          { id: 1, nombre: "Hotel Hunapú Antigua", activa: true },
          { id: 2, nombre: "Hotel Hunapú Atitlán", activa: true },
        ] } }));
      }
      if (urlStr.includes("/reservas-mesa?sucursal_id=1")) {
        // Un estado no reconocido debe mostrarse como desconocido, nunca como confirmado.
        return Promise.resolve(jsonResponse({ status: "success", data: [{ ...deSede1[0], estado: "en_revision" }] }));
      }
      return baseFetch(url, config);
    });

    renderWithProviders(<AdminScopeProvider><AdminReservasRestaurantePage /></AdminScopeProvider>);

    expect(await screen.findByText("Desconocido")).toBeInTheDocument();
    expect(screen.queryByText("Confirmada", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancelar reserva/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Todas las sedes/i)).not.toBeInTheDocument();
    const urls = vi.mocked(global.fetch).mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes("/reservas-mesa?sucursal_id=1"))).toBe(true);
    sessionStorage.removeItem("hunahpu.admin.scope.sede.v1:3");
  });

  it("en inglés traduce la pantalla y presenta fecha y hora legibles", async () => {
    tokenStorage.set("admin-token");
    localStorage.setItem("hunahpu.language.v1", "en");
    setupFetchMock();

    renderWithProviders(<LocaleProvider><AdminReservasRestaurantePage /></LocaleProvider>);

    expect(await screen.findByRole("heading", { name: "Restaurant reservations" })).toBeInTheDocument();
    expect(await screen.findByRole("columnheader", { name: "Guest" })).toBeInTheDocument();
    expect(screen.getAllByText("Confirmed").length).toBeGreaterThan(0);
    expect(screen.getByText("Sep 1, 2027")).toBeInTheDocument();
    expect(screen.getByText("12:00 PM")).toBeInTheDocument();
    expect(screen.queryByText("2027-09-01")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Cancel reservation #/ }).length).toBeGreaterThan(0);
    localStorage.removeItem("hunahpu.language.v1");
  });

  it("cancela una reserva confirmada tras confirmación en modal", async () => {
    tokenStorage.set("admin-token");
    const user = userEvent.setup();
    setupFetchMock();

    renderWithProviders(<AdminReservasRestaurantePage />);

    const cancelBtn = await screen.findByRole("button", { name: /Cancelar reserva/i });
    await user.click(cancelBtn);

    expect(await screen.findByText(/¿Cancelar reserva de mesa\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirmar/i });
    await user.click(confirmBtn);

    expect(
      await screen.findByText(/El estado de la reserva ha sido actualizado correctamente/i)
    ).toBeInTheDocument();
  });

  it("apertura directa de detalle administrativo por URL /admin/reservas-restaurante/:id", async () => {
    tokenStorage.set("admin-token");
    setupFetchMock();

    renderWithProviders(
      <Routes>
        <Route
          path="/admin/reservas-restaurante/:id"
          element={<AdminDetalleReservaRestaurantePage />}
        />
      </Routes>,
      { route: "/admin/reservas-restaurante/501" }
    );

    expect(
      await screen.findByText(/Detalle de Reserva de Restaurante #501/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Carlos Méndez/i)).toBeInTheDocument();
    expect(screen.getByText(/carlos@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Hotel Hunapú Antigua/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancelar reserva/i })).toBeInTheDocument();
  });

  it("gestiona conflicto 409 al reactivar si la mesa ya fue reservada para esa hora", async () => {
    tokenStorage.set("admin-token");
    const user = userEvent.setup();
    const conflictResponse = errorResponse(
      409,
      "TABLE_UNAVAILABLE",
      "La mesa ya se encuentra reservada para esa fecha y hora"
    );
    setupFetchMock(conflictResponse);

    renderWithProviders(<AdminReservasRestaurantePage />);

    const reactivarBtn = await screen.findByRole("button", { name: /Reactivar reserva/i });
    await user.click(reactivarBtn);

    expect(await screen.findByText(/¿Reactivar reserva de mesa\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirmar/i });
    await user.click(confirmBtn);

    expect(
      await screen.findByText(/No es posible reactivar la reserva: la mesa ya se encuentra reservada/i)
    ).toBeInTheDocument();
  });
});
