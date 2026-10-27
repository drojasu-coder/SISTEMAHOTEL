import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from "@/test/renderWithProviders";
import { tokenStorage } from "@/api/session";
import { CatalogoRestaurantePage } from "@/pages/CatalogoRestaurantePage";
import type { MesaConSucursal } from "./types";
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

const mockMesas: MesaConSucursal[] = [
  {
    id: 101,
    sucursal_id: 1,
    zona: "Terraza",
    capacidad: 4,
    estado: "disponible",
    Sucursal: { id: 1, nombre: "Hotel Hunapú Antigua" },
  },
  {
    id: 102,
    sucursal_id: 1,
    zona: "Salón Principal",
    capacidad: 2,
    estado: "disponible",
    Sucursal: { id: 1, nombre: "Hotel Hunapú Antigua" },
  },
  {
    id: 201,
    sucursal_id: 2,
    zona: "Jardín",
    capacidad: 6,
    estado: "disponible",
    Sucursal: { id: 2, nombre: "Hotel Hunapú Atitlán" },
  },
  {
    id: 202,
    sucursal_id: 2,
    zona: "Bar",
    capacidad: 2,
    estado: "mantenimiento",
    Sucursal: { id: 2, nombre: "Hotel Hunapú Atitlán" },
  },
];

describe("Catálogo de Restaurante para Clientes (CatalogoRestaurantePage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (role?: "cliente" | "admin", postResponse?: any) => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      const urlStr = String(url);

      if (urlStr.endsWith("/auth/me")) {
        if (!role) {
          return Promise.resolve(errorResponse(401, "UNAUTHORIZED", "No autenticado"));
        }
        return Promise.resolve(meResponse(role));
      }

      if (urlStr.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }

      if (urlStr.endsWith("/mesas") && (!config || config.method === "GET")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockMesas }));
      }

      if (urlStr.endsWith("/reservas-mesa") && config && config.method === "POST") {
        if (postResponse) {
          return Promise.resolve(postResponse);
        }
        const body = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse(
            {
              status: "success",
              data: {
                id: 88,
                usuario_id: 99,
                mesa_id: body.mesa_id,
                fecha: body.fecha,
                hora: body.hora,
                numero_comensales: body.numero_comensales,
                estado: "confirmada",
                Mesa: mockMesas.find((m) => m.id === body.mesa_id),
              },
            },
            201
          )
        );
      }

      return Promise.reject(new Error(`Unhandled request to ${urlStr}`));
    });
  };

  it("renderiza catálogo de mesas disponibles del restaurante con zonas y sedes", async () => {
    setupFetchMock();
    renderWithProviders(<CatalogoRestaurantePage />);

    expect(await screen.findByText(/Restaurante/i)).toBeInTheDocument();
    expect(await screen.findByText(/Mesa #101/i)).toBeInTheDocument();
    expect(screen.getByText(/Mesa #102/i)).toBeInTheDocument();
    expect(screen.getByText(/Mesa #201/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Terraza/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Salón Principal/i).length).toBeGreaterThanOrEqual(1);
  });

  it("filtra mesas por sede y por zona", async () => {
    const user = userEvent.setup();
    setupFetchMock();
    renderWithProviders(<CatalogoRestaurantePage />);

    await screen.findByText(/Mesa #101/i);

    const sedeSelect = screen.getByLabelText(/Sede del hotel/i);
    await user.selectOptions(sedeSelect, "1");

    expect(screen.getByText(/Mesa #101/i)).toBeInTheDocument();
    expect(screen.getByText(/Mesa #102/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mesa #201/i)).not.toBeInTheDocument();

    const zonaSelect = screen.getByLabelText(/Zona/i);
    await user.selectOptions(zonaSelect, "Terraza");

    expect(screen.getByText(/Mesa #101/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mesa #102/i)).not.toBeInTheDocument();
  });

  it("muestra estado sin resultados cuando no hay mesas para un filtro", async () => {
    const user = userEvent.setup();
    setupFetchMock();
    renderWithProviders(<CatalogoRestaurantePage />);

    await screen.findByText(/Mesa #101/i);

    const sedeSelect = screen.getByLabelText(/Sede del hotel/i);
    await user.selectOptions(sedeSelect, "2");

    const zonaSelect = screen.getByLabelText(/Zona/i);
    await user.selectOptions(zonaSelect, "Terraza");

    expect(await screen.findByText(/No se encontraron mesas/i)).toBeInTheDocument();
  });

  it("si no está autenticado, el modal solicita iniciar sesión con cuenta de cliente", async () => {
    const user = userEvent.setup();
    setupFetchMock();
    renderWithProviders(<CatalogoRestaurantePage />);

    const reserveBtns = await screen.findAllByRole("button", { name: /Reservar mesa/i });
    await user.click(reserveBtns[0]);

    expect(await screen.findByText(/Debe iniciar sesión con una cuenta de cliente/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inicie sesión para reservar/i })).toBeInTheDocument();
  });

  it("cliente autenticado puede reservar una mesa y recibe confirmación con ID real", async () => {
    tokenStorage.set("valid-token");
    const user = userEvent.setup();
    setupFetchMock("cliente");
    renderWithProviders(<CatalogoRestaurantePage />);

    const reserveBtns = await screen.findAllByRole("button", { name: /Reservar mesa/i });
    await user.click(reserveBtns[0]);

    expect(await screen.findByText(/Reservar mesa en el restaurante/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Confirmar reserva/i });
    await user.click(submitBtn);

    const confirmationElements = await screen.findAllByText(/¡Reserva de mesa confirmada!/i);
    expect(confirmationElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/#88/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ver detalle de la reserva/i })).toBeInTheDocument();
  });

  it("muestra error claro cuando el servidor responde 409 TABLE_UNAVAILABLE", async () => {
    tokenStorage.set("valid-token");
    const user = userEvent.setup();
    const conflictResponse = errorResponse(
      409,
      "TABLE_UNAVAILABLE",
      "La mesa ya se encuentra reservada para esa fecha y hora"
    );
    setupFetchMock("cliente", conflictResponse);

    renderWithProviders(<CatalogoRestaurantePage />);

    const reserveBtns = await screen.findAllByRole("button", { name: /Reservar mesa/i });
    await user.click(reserveBtns[0]);

    const submitBtn = await screen.findByRole("button", { name: /Confirmar reserva/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/La mesa ya se encuentra reservada para esa fecha y hora/i)
    ).toBeInTheDocument();
  });
});
