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
import { AmenidadesPage } from "@/pages/AmenidadesPage";
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
    Sucursal: { nombre: "Hotel Hunapú Antigua" },
  },
  {
    id: 11,
    sucursal_id: 1,
    nombre: "Gimnasio Fitness",
    aforo_maximo: 15,
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    Sucursal: { nombre: "Hotel Hunapú Antigua" },
  },
  {
    id: 20,
    sucursal_id: 2,
    nombre: "Sauna Finlandés",
    aforo_maximo: 8,
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    Sucursal: { nombre: "Hotel Hunapú Atitlán" },
  },
];

describe("Gestión de Amenidades (AmenidadesPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (customAmenidades = mockAmenidades, role = "admin") => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse(role));
      if (url.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (url.endsWith("/amenidades") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: customAmenidades,
          })
        );
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });
  };

  it("renderiza el listado con nombre, sede y aforo máximo", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    renderWithProviders(<AmenidadesPage />);

    expect((await screen.findAllByText("Piscina Climatizada")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gimnasio Fitness").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sauna Finlandés").length).toBeGreaterThan(0);

    // Sedes asociadas
    expect(screen.getAllByText("Hotel Hunapú Antigua").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hotel Hunapú Atitlán").length).toBeGreaterThan(0);

    // Aforos
    expect(screen.getAllByText(/25 personas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/15 personas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/8 personas/i).length).toBeGreaterThan(0);
  });

  it("filtra amenidades por nombre en tiempo real", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<AmenidadesPage />);

    await screen.findAllByText("Piscina Climatizada");

    const searchInput = screen.getByLabelText(/Buscar amenidad por nombre/i);
    await user.type(searchInput, "Sauna");

    expect(screen.getAllByText("Sauna Finlandés").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Piscina Climatizada")).toHaveLength(0);
    expect(screen.queryAllByText("Gimnasio Fitness")).toHaveLength(0);

    // Limpiar búsqueda
    const clearBtn = screen.getByLabelText(/Limpiar búsqueda/i);
    await user.click(clearBtn);

    expect(screen.getAllByText("Piscina Climatizada").length).toBeGreaterThan(0);
  });

  it("filtra amenidades por sede", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<AmenidadesPage />);

    await screen.findAllByText("Piscina Climatizada");

    const sedeFilter = screen.getByLabelText(/Filtrar por sede/i);
    await user.selectOptions(sedeFilter, "2"); // Hotel Hunapú Atitlán

    expect(screen.queryAllByText("Piscina Climatizada")).toHaveLength(0);
    expect(screen.queryAllByText("Gimnasio Fitness")).toHaveLength(0);
    expect(screen.getAllByText("Sauna Finlandés").length).toBeGreaterThan(0);
  });

  it("valida campos obligatorios y formato numérico de aforo", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<AmenidadesPage />);

    await screen.findAllByText("Piscina Climatizada");

    const newBtn = screen.getByRole("button", { name: /Nueva amenidad/i });
    await user.click(newBtn);

    expect(
      screen.getByRole("heading", { name: /Registrar nueva amenidad/i })
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Guardar amenidad/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/El nombre de la amenidad es obligatorio/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/El aforo máximo es obligatorio/i)
    ).toBeInTheDocument();

    // Probar aforo inválido o 0
    const aforoInput = screen.getByLabelText(/Aforo máximo/i);
    await user.type(aforoInput, "0");
    await user.click(submitBtn);

    expect(
      await screen.findByText(/El aforo máximo debe ser un número entero mayor a 0/i)
    ).toBeInTheDocument();
  });

  it("crea una nueva amenidad con datos válidos y envía payload correcto", async () => {
    tokenStorage.set("jwt-admin");
    let createdPayload: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
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
      if (url.endsWith("/amenidades") && config?.method === "POST") {
        createdPayload = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse(
            {
              status: "success",
              data: {
                id: 30,
                ...createdPayload,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
            201
          )
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<AmenidadesPage />);

    await screen.findAllByText("Piscina Climatizada");

    const newBtn = screen.getByRole("button", { name: /Nueva amenidad/i });
    await user.click(newBtn);

    const sedeSelect = screen.getByLabelText(/^Sede$/i);
    const nombreInput = screen.getByLabelText(/^Nombre de la amenidad$/i);
    const aforoInput = screen.getByLabelText(/Aforo máximo/i);

    await user.selectOptions(sedeSelect, "1");
    await user.type(nombreInput, "Cancha de Tenis");
    await user.type(aforoInput, "4");

    const submitBtn = screen.getByRole("button", { name: /Guardar amenidad/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createdPayload).toEqual({
        sucursal_id: 1,
        nombre: "Cancha de Tenis",
        aforo_maximo: 4,
      });
    });

    expect(
      await screen.findByText(/La amenidad ha sido registrada correctamente/i)
    ).toBeInTheDocument();
  });

  it("edita una amenidad existente precargada y envía PATCH sin sucursal_id", async () => {
    tokenStorage.set("jwt-admin");
    let patchedBody: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
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
      if (url.match(/\/amenidades\/10$/) && config?.method === "PATCH") {
        patchedBody = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: { ...mockAmenidades[0], ...patchedBody },
          })
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<AmenidadesPage />);

    await screen.findAllByText("Piscina Climatizada");

    const editButtons = screen.getAllByRole("button", {
      name: /Editar Piscina Climatizada/i,
    });
    await user.click(editButtons[0]);

    expect(
      screen.getByRole("heading", { name: /Editar amenidad/i })
    ).toBeInTheDocument();

    const nombreInput = screen.getByLabelText(/^Nombre de la amenidad$/i);
    const aforoInput = screen.getByLabelText(/Aforo máximo/i);
    const sedeSelect = screen.getByLabelText(/^Sede$/i);

    expect(nombreInput).toHaveValue("Piscina Climatizada");
    expect(aforoInput).toHaveValue("25");
    // Sede está deshabilitada en edición según contrato
    expect(sedeSelect).toBeDisabled();

    await user.clear(aforoInput);
    await user.type(aforoInput, "30");

    const submitBtn = screen.getByRole("button", { name: /Guardar amenidad/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(patchedBody).toEqual({
        nombre: "Piscina Climatizada",
        aforo_maximo: 30,
      });
      // Verifica que no se envíe sucursal_id en PATCH
      expect(patchedBody).not.toHaveProperty("sucursal_id");
    });

    expect(
      await screen.findByText(/La amenidad ha sido actualizada correctamente/i)
    ).toBeInTheDocument();
  });

  it("muestra estado de error con opción de reintento funcional", async () => {
    tokenStorage.set("jwt-admin");
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
      if (url.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (url.endsWith("/amenidades")) {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            errorResponse(500, "INTERNAL_SERVER_ERROR", "Error al conectar con la base de datos")
          );
        }
        return Promise.resolve(
          jsonResponse({
            status: "success",
            data: mockAmenidades,
          })
        );
      }
      return Promise.reject(new Error(`Ruta: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<AmenidadesPage />);

    expect(
      await screen.findByText(/No fue posible cargar las amenidades/i)
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Reintentar/i });
    await user.click(retryBtn);

    expect((await screen.findAllByText("Piscina Climatizada")).length).toBeGreaterThan(0);
  });

  it("muestra estado de catálogo vacío cuando no hay amenidades registradas", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock([]);

    renderWithProviders(<AmenidadesPage />);

    expect(
      await screen.findByText(/No hay amenidades registradas/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Comience registrando la primera amenidad del hotel/i)
    ).toBeInTheDocument();
  });

  it("muestra estado de sin resultados y permite limpiar filtros", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<AmenidadesPage />);

    await screen.findAllByText("Piscina Climatizada");

    const searchInput = screen.getByLabelText(/Buscar amenidad por nombre/i);
    await user.type(searchInput, "Inexistente");

    expect(
      await screen.findByText(/No se encontraron amenidades con los criterios/i)
    ).toBeInTheDocument();

    const resetBtns = screen.getAllByRole("button", { name: /Limpiar filtros/i });
    await user.click(resetBtns[0]);

    expect((await screen.findAllByText("Piscina Climatizada")).length).toBeGreaterThan(0);
  });

  it("permite administrar a rol admin y muestra modo solo lectura para otros roles", async () => {
    tokenStorage.set("jwt-cliente");
    setupFetchMock(mockAmenidades, "cliente");

    renderWithProviders(<AmenidadesPage />);

    await screen.findAllByText("Piscina Climatizada");

    expect(
      screen.queryByRole("button", { name: /Nueva amenidad/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Editar Piscina Climatizada/i })
    ).not.toBeInTheDocument();
  });
});
