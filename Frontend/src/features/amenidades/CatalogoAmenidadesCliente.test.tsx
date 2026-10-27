import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from "@/test/renderWithProviders";
import { tokenStorage } from "@/api/session";
import { CatalogoAmenidadesPage } from "@/pages/CatalogoAmenidadesPage";
import type { Amenidad } from "./types";
import type { Sucursal } from "@/features/sedes/types";

const mockSedes: Sucursal[] = [
  {
    id: 1,
    nombre: "Hotel Hunapú Antigua",
    ciudad: "Antigua Guatemala",
    direccion: "5ta Avenida Norte #12",
    telefono: "78320011",
    activa: true,
  },
  {
    id: 2,
    nombre: "Hotel Hunapú Atitlán",
    ciudad: "Panajachel",
    direccion: "Calle Santander",
    telefono: "77620022",
    activa: true,
  },
];

const mockAmenidades: Amenidad[] = [
  {
    id: 10,
    sucursal_id: 1,
    nombre: "Piscina Climatizada",
    aforo_maximo: 25,
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    Sucursal: { id: 1, nombre: "Hotel Hunapú Antigua" },
  },
  {
    id: 20,
    sucursal_id: 2,
    nombre: "Sauna Finlandés",
    aforo_maximo: 8,
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    Sucursal: { id: 2, nombre: "Hotel Hunapú Atitlán" },
  },
];

describe("Catálogo de Amenidades para Clientes (CatalogoAmenidadesPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (role?: "cliente" | "admin", postResponse?: any) => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) {
        if (!role) {
          return Promise.resolve(errorResponse(401, "UNAUTHORIZED", "No autenticado"));
        }
        return Promise.resolve(meResponse(role));
      }
      if (url.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (url.endsWith("/amenidades") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: mockAmenidades,
          })
        );
      }
      if (url.endsWith("/reservas-amenidad") && config?.method === "POST") {
        if (postResponse) {
          return Promise.resolve(postResponse);
        }
        const body = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: {
              id: 99,
              usuario_id: 1,
              amenidad_id: body.amenidad_id,
              fecha: body.fecha,
              franja_horaria: body.franja_horaria,
              mobiliario: body.mobiliario || "ninguno",
              codigo_qr: "AMENITY-TEST-UUID-99",
              estado: "confirmada",
              Amenidad: mockAmenidades.find((a) => a.id === body.amenidad_id),
            },
          }, 201)
        );
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });
  };

  it("renderiza catálogo público sin sesión y abre modal requiriendo inicio de sesión", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<CatalogoAmenidadesPage />);

    expect(await screen.findByText("Piscina Climatizada")).toBeInTheDocument();
    expect(screen.getByText("Sauna Finlandés")).toBeInTheDocument();
    expect(screen.getByText(/25 personas/i)).toBeInTheDocument();

    // No debe mostrar precios, carritos ni badges ficticios de gratuidad
    expect(screen.queryByText(/gratis/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/GTQ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$/i)).not.toBeInTheDocument();

    // Al pulsar 'Reservar acceso' sin sesión, el modal solicita inicio de sesión
    const reservarBtns = screen.getAllByRole("button", { name: /Reservar acceso/i });
    await user.click(reservarBtns[0]);

    expect(await screen.findByRole("dialog", { name: /Reservar acceso a amenidad/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Inicie sesión para reservar/i })).toHaveAttribute("href", "/login");
  });

  it("filtra amenidades por nombre y por sede", async () => {
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<CatalogoAmenidadesPage />);

    await screen.findByText("Piscina Climatizada");

    const searchInput = screen.getByLabelText(/Buscar amenidad por nombre/i);
    await user.type(searchInput, "Sauna");

    expect(screen.getByText("Sauna Finlandés")).toBeInTheDocument();
    expect(screen.queryByText("Piscina Climatizada")).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(screen.getByText("Piscina Climatizada")).toBeInTheDocument();

    const sedeSelect = screen.getByLabelText(/Filtrar por sede/i);
    await user.selectOptions(sedeSelect, "1");

    expect(screen.getByText("Piscina Climatizada")).toBeInTheDocument();
    expect(screen.queryByText("Sauna Finlandés")).not.toBeInTheDocument();
  });

  it("permite a un cliente autenticado abrir modal y crear una reserva válida", async () => {
    tokenStorage.set("jwt-cliente");
    setupFetchMock("cliente");
    const user = userEvent.setup();

    renderWithProviders(<CatalogoAmenidadesPage />);

    const reservarBtns = await screen.findAllByRole("button", { name: /Reservar acceso/i });
    await user.click(reservarBtns[0]);

    // Modal abierto con formulario de reserva
    expect(await screen.findByRole("dialog", { name: /Reservar acceso a amenidad/i })).toBeInTheDocument();
    expect(screen.getByText(/Piscina Climatizada • Aforo máximo: 25 personas/i)).toBeInTheDocument();

    // Llenar formulario
    const fechaInput = screen.getByLabelText(/Fecha de reserva/i);
    await user.clear(fechaInput);
    await user.type(fechaInput, "2027-06-15");

    const horaInicio = screen.getByLabelText(/Hora de inicio/i);
    await user.clear(horaInicio);
    await user.type(horaInicio, "10:00");

    const horaFin = screen.getByLabelText(/Hora de fin/i);
    await user.clear(horaFin);
    await user.type(horaFin, "12:00");

    const mobiliarioInput = screen.getByLabelText(/Mobiliario adicional/i);
    await user.type(mobiliarioInput, "Toalla y silla");

    const submitBtn = screen.getByRole("button", { name: /Confirmar reserva/i });
    await user.click(submitBtn);

    // Confirmación exitosa
    await waitFor(() => {
      expect(screen.getByText(/¡Reserva confirmada con éxito!/i)).toBeInTheDocument();
    });
    expect(screen.getByText("AMENITY-TEST-UUID-99")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ver pase y código de acceso/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir a Mis Reservas de Amenidades/i })).toBeInTheDocument();
  });

  it("maneja error de aforo completo mostrando mensaje claro", async () => {
    tokenStorage.set("jwt-cliente");
    setupFetchMock("cliente", errorResponse(409, "AMENITY_CAPACITY_FULL", "Aforo máximo excedido para la franja"));
    const user = userEvent.setup();

    renderWithProviders(<CatalogoAmenidadesPage />);

    const reservarBtns = await screen.findAllByRole("button", { name: /Reservar acceso/i });
    await user.click(reservarBtns[0]);

    expect(await screen.findByRole("dialog", { name: /Reservar acceso a amenidad/i })).toBeInTheDocument();

    const fechaInput = screen.getByLabelText(/Fecha de reserva/i);
    await user.clear(fechaInput);
    await user.type(fechaInput, "2027-06-15");

    const horaInicio = screen.getByLabelText(/Hora de inicio/i);
    await user.clear(horaInicio);
    await user.type(horaInicio, "10:00");

    const horaFin = screen.getByLabelText(/Hora de fin/i);
    await user.clear(horaFin);
    await user.type(horaFin, "12:00");

    const submitBtn = screen.getByRole("button", { name: /Confirmar reserva/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/El aforo máximo sería excedido durante esa franja horaria/i)).toBeInTheDocument();
    });
  });
});
