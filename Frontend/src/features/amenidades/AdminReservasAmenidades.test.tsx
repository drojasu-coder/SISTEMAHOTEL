import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from "@/test/renderWithProviders";
import { tokenStorage } from "@/api/session";
import { AdminReservasAmenidadesPage } from "@/pages/AdminReservasAmenidadesPage";
import { AdminDetalleReservaAmenidadPage } from "@/pages/AdminDetalleReservaAmenidadPage";
import type { ReservaAmenidad, Amenidad } from "./types";
import type { Sucursal } from "@/features/sedes/types";

const mockSedes: Sucursal[] = [
  {
    id: 1,
    nombre: "Hotel Hunapú Antigua",
    direccion: "Antigua Guatemala",
    ciudad: "Antigua Guatemala",
    telefono: "78320000",
    activa: true,
  },
  {
    id: 2,
    nombre: "Hotel Hunahpú Atitlán",
    direccion: "Panajachel",
    ciudad: "Panajachel",
    telefono: "77620000",
    activa: true,
  },
];

const mockAmenidades: Amenidad[] = [
  {
    id: 10,
    sucursal_id: 1,
    nombre: "Piscina Climatizada",
    aforo_maximo: 25,
    createdAt: "2026-10-24T12:00:00.000Z",
    updatedAt: "2026-10-24T12:00:00.000Z",
  },
  {
    id: 20,
    sucursal_id: 2,
    nombre: "Sauna Finlandés",
    aforo_maximo: 8,
    createdAt: "2026-10-24T12:00:00.000Z",
    updatedAt: "2026-10-24T12:00:00.000Z",
  },
];

const mockAdminReservas: ReservaAmenidad[] = [
  {
    id: 501,
    usuario_id: 2,
    amenidad_id: 10,
    fecha: "2027-07-10",
    franja_horaria: "10:00 - 12:00",
    mobiliario: "2 reposeras",
    codigo_qr: "QR-ADMIN-TEST-501",
    estado: "confirmada",
    createdAt: "2026-10-24T12:00:00.000Z",
    updatedAt: "2026-10-24T12:00:00.000Z",
    Usuario: {
      id: 2,
      nombre: "Carlos Gómez",
      email: "carlos.gomez@example.com",
      telefono: "55551234",
    },
    Amenidad: {
      id: 10,
      sucursal_id: 1,
      nombre: "Piscina Climatizada",
      aforo_maximo: 25,
      Sucursal: { id: 1, nombre: "Hotel Hunapú Antigua" },
    },
  },
  {
    id: 502,
    usuario_id: 3,
    amenidad_id: 20,
    fecha: "2027-07-11",
    franja_horaria: "15:00 - 16:00",
    mobiliario: "ninguno",
    codigo_qr: "QR-ADMIN-TEST-502",
    estado: "usada",
    createdAt: "2026-10-24T12:00:00.000Z",
    updatedAt: "2026-10-24T12:00:00.000Z",
    Usuario: {
      id: 3,
      nombre: "María Morales",
      email: "maria.morales@example.com",
      telefono: "55559876",
    },
    Amenidad: {
      id: 20,
      sucursal_id: 2,
      nombre: "Sauna Finlandés",
      aforo_maximo: 8,
      Sucursal: { id: 2, nombre: "Hotel Hunahpú Atitlán" },
    },
  },
];

describe("Gestión Administrativa de Reservas de Amenidades (AdminReservasAmenidadesPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (reservas = mockAdminReservas) => {
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url, "http://localhost:4000");

      if (parsedUrl.pathname.endsWith("/auth/me")) {
        return Promise.resolve(meResponse("admin"));
      }
      if (parsedUrl.pathname.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (parsedUrl.pathname.endsWith("/amenidades")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockAmenidades }));
      }
      if (parsedUrl.pathname.match(/\/reservas-amenidad\/\d+\/estado/) && init?.method === "PATCH") {
        const body = JSON.parse(init.body as string);
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: {
              ...mockAdminReservas[0],
              estado: body.estado,
            },
          })
        );
      }
      if (parsedUrl.pathname.endsWith("/reservas-amenidad") && init?.method !== "POST") {
        return Promise.resolve(jsonResponse({ status: "success", data: reservas }));
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });
  };

  it("renderiza el listado con datos autorizados: cliente, amenidad, sede, horario y estado", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    renderWithProviders(<AdminReservasAmenidadesPage />);

    expect(await screen.findByText(/Reservas de Amenidades/i)).toBeInTheDocument();
    await screen.findAllByText("Carlos Gómez");
    expect(screen.getAllByText("Carlos Gómez")[0]).toBeInTheDocument();
    expect(screen.getAllByText("carlos.gomez@example.com")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Piscina Climatizada")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Hotel Hunapú Antigua")[0]).toBeInTheDocument();
    expect(screen.getAllByText("10:00 - 12:00")[0]).toBeInTheDocument();

    expect(screen.getAllByText("María Morales")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Sauna Finlandés")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Hotel Hunahpú Atitlán")[0]).toBeInTheDocument();

    // Enlace al detalle administrativo
    const detalleLinks = screen.getAllByRole("link", { name: /Detalle/i });
    expect(detalleLinks.length).toBeGreaterThan(0);
    expect(detalleLinks[0]).toHaveAttribute("href", "/admin/reservas-amenidades/501");
  });

  it("filtra reservas en tiempo real por búsqueda de cliente y sede", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    renderWithProviders(<AdminReservasAmenidadesPage />);

    await screen.findAllByText("Carlos Gómez");
    expect(screen.getAllByText("Carlos Gómez")[0]).toBeInTheDocument();
    expect(screen.getAllByText("María Morales")[0]).toBeInTheDocument();

    // Filtro por búsqueda
    const searchInput = screen.getByPlaceholderText(/Buscar por ID, cliente o correo/i);
    fireEvent.change(searchInput, { target: { value: "Carlos" } });

    expect(screen.getAllByText("Carlos Gómez")[0]).toBeInTheDocument();
    expect(screen.queryAllByText("María Morales").length).toBe(0);

    // Limpiar búsqueda
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getAllByText("María Morales")[0]).toBeInTheDocument();

    // Filtro por sede
    const selectSede = screen.getByLabelText(/Todas las sedes/i);
    fireEvent.change(selectSede, { target: { value: "2" } }); // Atitlán

    expect(screen.queryAllByText("Carlos Gómez").length).toBe(0);
    expect(screen.getAllByText("María Morales")[0]).toBeInTheDocument();
  });

  it("permite ejecutar cambio de estado a 'usada' con confirmación modal", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    renderWithProviders(<AdminReservasAmenidadesPage />);

    await screen.findAllByText("Carlos Gómez");

    // Reserva 501 está confirmada -> Botones "Marcar como usada"
    const marcarUsadaBtns = screen.getAllByRole("button", { name: /Marcar como usada/i });
    fireEvent.click(marcarUsadaBtns[0]);

    // Diálogo de confirmación
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/¿Desea registrar esta reserva como completada \/ usada\?/i)).toBeInTheDocument();

    // Confirmar
    const confirmarBtn = screen.getByRole("button", { name: /Confirmar/i });
    fireEvent.click(confirmarBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("no muestra acciones de cambio de estado en reservas con estado terminal", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock([mockAdminReservas[1]]);

    renderWithProviders(<AdminReservasAmenidadesPage />);

    await screen.findAllByText("María Morales");

    // Reserva 502 está 'usada', estado terminal: no debe haber botones de modificar estado
    expect(screen.queryByRole("button", { name: /Marcar como usada/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancelar reserva/i })).not.toBeInTheDocument();

    // Solo debe estar disponible el enlace de ver detalle
    expect(screen.getAllByRole("link", { name: /Detalle/i })[0]).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no hay reservas de amenidades en el hotel", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock([]);

    renderWithProviders(<AdminReservasAmenidadesPage />);

    expect(await screen.findByText(/No hay reservas de amenidades registradas/i)).toBeInTheDocument();
  });
});

describe("Detalle Administrativo de Reserva de Amenidad (AdminDetalleReservaAmenidadPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupDetailFetchMock = (reserva = mockAdminReservas[0]) => {
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const parsedUrl = new URL(url, "http://localhost:4000");

      if (parsedUrl.pathname.endsWith("/auth/me")) {
        return Promise.resolve(meResponse("admin"));
      }
      if (parsedUrl.pathname.match(/\/reservas-amenidad\/\d+\/estado/) && init?.method === "PATCH") {
        const body = JSON.parse(init.body as string);
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: { ...reserva, estado: body.estado },
          })
        );
      }
      if (parsedUrl.pathname.endsWith("/reservas-amenidad/999")) {
        return Promise.resolve(
          errorResponse(404, "AMENITY_RESERVATION_NOT_FOUND", "Reserva de amenidad no encontrada")
        );
      }
      if (parsedUrl.pathname.endsWith(`/reservas-amenidad/${reserva.id}`)) {
        return Promise.resolve(jsonResponse({ status: "success", data: reserva }));
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });
  };

  it("muestra datos completos del cliente, contacto, amenidad, mobiliario y pase QR", async () => {
    tokenStorage.set("jwt-admin");
    setupDetailFetchMock(mockAdminReservas[0]);

    renderWithProviders(
      <Routes>
        <Route path="/admin/reservas-amenidades/:id" element={<AdminDetalleReservaAmenidadPage />} />
      </Routes>,
      { route: "/admin/reservas-amenidades/501" }
    );

    expect(await screen.findByText("Reserva #501")).toBeInTheDocument();
    expect(screen.getByText("Carlos Gómez")).toBeInTheDocument();
    expect(screen.getByText("carlos.gomez@example.com")).toBeInTheDocument();
    expect(screen.getByText("55551234")).toBeInTheDocument();
    expect(screen.getByText("Piscina Climatizada")).toBeInTheDocument();
    expect(screen.getByText("Hotel Hunapú Antigua")).toBeInTheDocument();
    expect(screen.getByText("2 reposeras")).toBeInTheDocument();
    expect(screen.getByText("QR-ADMIN-TEST-501")).toBeInTheDocument();

    // Código QR SVG presente
    const qrSvg = document.querySelector("svg");
    expect(qrSvg).toBeInTheDocument();

    // Botón de regreso al listado
    const backBtns = screen.getAllByRole("link", { name: /Volver a la lista de reservas/i });
    expect(backBtns.length).toBeGreaterThan(0);
    expect(backBtns[0]).toHaveAttribute("href", "/admin/reservas-amenidades");
  });

  it("maneja error 404 de reserva inexistente con mensaje claro y botón de retorno", async () => {
    tokenStorage.set("jwt-admin");
    setupDetailFetchMock();

    renderWithProviders(
      <Routes>
        <Route path="/admin/reservas-amenidades/:id" element={<AdminDetalleReservaAmenidadPage />} />
      </Routes>,
      { route: "/admin/reservas-amenidades/999" }
    );

    expect(await screen.findByText(/La reserva de amenidad solicitada no existe o no se pudo cargar/i)).toBeInTheDocument();
    const backBtns = screen.getAllByRole("link", { name: /Volver a la lista de reservas/i });
    expect(backBtns.length).toBeGreaterThan(0);
    expect(backBtns[0]).toHaveAttribute("href", "/admin/reservas-amenidades");
  });
});
