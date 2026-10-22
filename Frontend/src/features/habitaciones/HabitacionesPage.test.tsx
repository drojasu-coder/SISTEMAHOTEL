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
import { HabitacionesPage } from "@/pages/HabitacionesPage";
import type { Habitacion, TipoHabitacion } from "./types";
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

const mockTipos: TipoHabitacion[] = [
  {
    id: 1,
    nombre: "Suite Presidencial",
    capacidad_maxima: 2,
    tarifa_noche: "1250.00",
    descripcion: "Habitación de lujo con vista panorámica",
  },
  {
    id: 2,
    nombre: "Doble Deluxe",
    capacidad_maxima: 4,
    tarifa_noche: "750.00",
    descripcion: "Dos camas matrimoniales",
  },
];

const mockHabitaciones: Habitacion[] = [
  {
    id: 101,
    sucursal_id: 1,
    tipo_habitacion_id: 1,
    numero: "101",
    estado: "disponible",
  },
  {
    id: 102,
    sucursal_id: 1,
    tipo_habitacion_id: 2,
    numero: "102",
    estado: "ocupada",
  },
  {
    id: 201,
    sucursal_id: 2,
    tipo_habitacion_id: 2,
    numero: "201",
    estado: "mantenimiento",
  },
  {
    id: 202,
    sucursal_id: 2,
    tipo_habitacion_id: 1,
    numero: "202",
    estado: "limpieza",
  },
];

describe("Gestión de habitaciones (HabitacionesPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (customHabitaciones = mockHabitaciones, role = "admin") => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse(role));
      if (url.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (url.endsWith("/tipos-habitacion")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos obtenidos",
            data: mockTipos,
          })
        );
      }
      if (url.endsWith("/habitaciones") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Habitaciones obtenidas",
            data: customHabitaciones,
          })
        );
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });
  };

  it("renderiza el listado con número, tipo, sede, estado y tarifa", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    renderWithProviders(<HabitacionesPage />);

    expect((await screen.findAllByText(/Habitación 101/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Habitación 102/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Habitación 201/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Habitación 202/i).length).toBeGreaterThan(0);

    // Verificación de sedes asociadas
    expect(screen.getAllByText("Hotel Hunapú Antigua").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hotel Hunapú Atitlán").length).toBeGreaterThan(0);

    // Verificación de tipos y tarifas
    expect(screen.getAllByText("Suite Presidencial").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Doble Deluxe").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Q1,250.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Q750.00").length).toBeGreaterThan(0);

    // Estados legibles
    expect(screen.getAllByText("Disponible").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ocupada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mantenimiento").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Limpieza").length).toBeGreaterThan(0);
  });

  it("filtra habitaciones por número en tiempo real", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    const searchInput = screen.getByLabelText(/Buscar habitación por número/i);
    await user.type(searchInput, "20");

    expect(screen.queryAllByText(/Habitación 101/i)).toHaveLength(0);
    expect(screen.queryAllByText(/Habitación 102/i)).toHaveLength(0);
    expect(screen.getAllByText(/Habitación 201/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Habitación 202/i).length).toBeGreaterThan(0);

    // Limpiar búsqueda
    const clearBtn = screen.getByLabelText(/Limpiar búsqueda/i);
    await user.click(clearBtn);

    expect(screen.getAllByText(/Habitación 101/i).length).toBeGreaterThan(0);
  });

  it("filtra habitaciones por sede", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    const sedeFilter = screen.getByLabelText(/Filtrar por sede/i);
    await user.selectOptions(sedeFilter, "2"); // Hotel Hunapú Atitlán

    expect(screen.queryAllByText(/Habitación 101/i)).toHaveLength(0);
    expect(screen.queryAllByText(/Habitación 102/i)).toHaveLength(0);
    expect(screen.getAllByText(/Habitación 201/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Habitación 202/i).length).toBeGreaterThan(0);
  });

  it("filtra habitaciones por estado operativo", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    const estadoFilter = screen.getByLabelText(/Filtrar por estado/i);
    await user.selectOptions(estadoFilter, "mantenimiento");

    expect(screen.queryAllByText(/Habitación 101/i)).toHaveLength(0);
    expect(screen.getAllByText(/Habitación 201/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Habitación 202/i)).toHaveLength(0);
  });

  it("muestra estado de error con opción de reintento funcional", async () => {
    tokenStorage.set("jwt-admin");
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
      if (url.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (url.endsWith("/tipos-habitacion")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos obtenidos",
            data: mockTipos,
          })
        );
      }
      if (url.endsWith("/habitaciones")) {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            errorResponse(500, "INTERNAL_SERVER_ERROR", "Error al consultar la base de datos")
          );
        }
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Habitaciones obtenidas",
            data: mockHabitaciones,
          })
        );
      }
      return Promise.reject(new Error(`Ruta: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<HabitacionesPage />);

    expect(
      await screen.findByText(/No fue posible cargar las habitaciones/i)
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Reintentar/i });
    await user.click(retryBtn);

    expect((await screen.findAllByText(/Habitación 101/i)).length).toBeGreaterThan(0);
  });

  it("muestra estado de catálogo vacío cuando no hay habitaciones registradas", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock([]);

    renderWithProviders(<HabitacionesPage />);

    expect(
      await screen.findByText(/No hay habitaciones registradas/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Comience registrando la primera habitación del hotel/i)
    ).toBeInTheDocument();
  });

  it("muestra aviso de sin resultados y permite limpiar filtros", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    const searchInput = screen.getByLabelText(/Buscar habitación por número/i);
    await user.type(searchInput, "999");

    expect(
      await screen.findByText(/No se encontraron habitaciones con los criterios/i)
    ).toBeInTheDocument();

    const resetBtns = screen.getAllByRole("button", { name: /Limpiar filtros/i });
    await user.click(resetBtns[0]);

    expect((await screen.findAllByText(/Habitación 101/i)).length).toBeGreaterThan(0);
  });

  it("crea una nueva habitación con validación y muestra confirmación de éxito", async () => {
    tokenStorage.set("jwt-admin");
    let createdPayload: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
      if (url.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (url.endsWith("/tipos-habitacion")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos",
            data: mockTipos,
          })
        );
      }
      if (url.endsWith("/habitaciones") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Habitaciones",
            data: mockHabitaciones,
          })
        );
      }
      if (url.endsWith("/habitaciones") && config?.method === "POST") {
        createdPayload = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse(
            {
              success: true,
              statusCode: 201,
              message: "Habitación creada correctamente",
              data: {
                id: 105,
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
    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    const newBtn = screen.getByRole("button", { name: /Nueva habitación/i });
    await user.click(newBtn);

    expect(
      screen.getByRole("heading", { name: /Registrar nueva habitación/i })
    ).toBeInTheDocument();

    // Intentar enviar sin número de habitación
    const submitBtn = screen.getByRole("button", { name: /Guardar habitación/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/El número de habitación es obligatorio/i)
    ).toBeInTheDocument();

    // Llenar datos válidos
    const sedeSelect = screen.getByLabelText(/^Sede$/i);
    const tipoSelect = screen.getByLabelText(/^Tipo de habitación$/i);
    const numInput = screen.getByLabelText(/^Número de habitación$/i);
    const estadoSelect = screen.getByLabelText(/^Estado de la habitación$/i);

    await user.selectOptions(sedeSelect, "1");
    await user.selectOptions(tipoSelect, "2");
    await user.type(numInput, "105");
    await user.selectOptions(estadoSelect, "disponible");

    await user.click(submitBtn);

    await waitFor(() => {
      expect(createdPayload).toEqual({
        sucursal_id: 1,
        tipo_habitacion_id: 2,
        numero: "105",
        estado: "disponible",
      });
    });

    expect(
      await screen.findByText(/La habitación ha sido registrada correctamente/i)
    ).toBeInTheDocument();
  });

  it("gestiona el error 409 de número duplicado sin perder los datos ingresados", async () => {
    tokenStorage.set("jwt-admin");

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
      if (url.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (url.endsWith("/tipos-habitacion")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos",
            data: mockTipos,
          })
        );
      }
      if (url.endsWith("/habitaciones") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Habitaciones",
            data: mockHabitaciones,
          })
        );
      }
      if (url.endsWith("/habitaciones") && config?.method === "POST") {
        return Promise.resolve(
          errorResponse(
            409,
            "HABITACION_NUMBER_ALREADY_EXISTS",
            "Ya existe una habitación con ese número en la sucursal"
          )
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    const newBtn = screen.getByRole("button", { name: /Nueva habitación/i });
    await user.click(newBtn);

    const numInput = screen.getByLabelText(/^Número de habitación$/i);
    await user.type(numInput, "101");

    const submitBtn = screen.getByRole("button", { name: /Guardar habitación/i });
    await user.click(submitBtn);

    expect(
      (await screen.findAllByText(/Ya existe una habitación con ese número en la sucursal/i)).length
    ).toBeGreaterThan(0);

    // El valor escrito se mantiene
    expect(numInput).toHaveValue("101");
  });

  it("edita una habitación existente con datos precargados y actualiza correctamente", async () => {
    tokenStorage.set("jwt-admin");
    let patchedBody: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
      if (url.endsWith("/sucursales")) {
        return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
      }
      if (url.endsWith("/tipos-habitacion")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos",
            data: mockTipos,
          })
        );
      }
      if (url.endsWith("/habitaciones") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Habitaciones",
            data: mockHabitaciones,
          })
        );
      }
      if (url.match(/\/habitaciones\/101$/) && config?.method === "PATCH") {
        patchedBody = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Habitación actualizada correctamente",
            data: { ...mockHabitaciones[0], ...patchedBody },
          })
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    // Clic en editar de la primera habitación
    const editButtons = screen.getAllByRole("button", {
      name: /Editar habitación 101/i,
    });
    await user.click(editButtons[0]);

    expect(
      screen.getByRole("heading", { name: /Editar habitación/i })
    ).toBeInTheDocument();

    const numInput = screen.getByLabelText(/^Número de habitación$/i);
    expect(numInput).toHaveValue("101");

    const estadoSelect = screen.getByLabelText(/^Estado de la habitación$/i);
    await user.selectOptions(estadoSelect, "limpieza");

    const submitBtn = screen.getByRole("button", { name: /Guardar habitación/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(patchedBody).toMatchObject({
        numero: "101",
        estado: "limpieza",
      });
    });

    expect(
      await screen.findByText(/La habitación ha sido actualizada correctamente/i)
    ).toBeInTheDocument();
  });

  it("permite gestionar a recepcionista y gerente_habitaciones según permiso habitaciones.gestionar", async () => {
    tokenStorage.set("jwt-gerente");
    setupFetchMock(mockHabitaciones, "gerente_habitaciones");

    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    expect(
      screen.getByRole("button", { name: /Nueva habitación/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Editar habitación/i }).length
    ).toBeGreaterThan(0);
  });

  it("muestra modo de solo lectura (sin botones de gestión) para cliente o empleado operativo", async () => {
    tokenStorage.set("jwt-cliente");
    setupFetchMock(mockHabitaciones, "cliente");

    renderWithProviders(<HabitacionesPage />);

    await screen.findAllByText(/Habitación 101/i);

    expect(
      screen.queryByRole("button", { name: /Nueva habitación/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Editar habitación/i })
    ).not.toBeInTheDocument();
  });
});
