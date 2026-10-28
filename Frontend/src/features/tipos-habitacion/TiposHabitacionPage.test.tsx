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
import { TiposHabitacionPage } from "@/pages/TiposHabitacionPage";
import { TIPOS_HABITACION_QUERY_KEY } from "@/features/habitaciones/hooks/useHabitaciones";
import type { TipoHabitacion } from "./types";

const mockTipos: TipoHabitacion[] = [
  {
    id: 1,
    sucursal_id: 5,
    nombre: "Suite Presidencial",
    capacidad_maxima: 2,
    tarifa_noche: "1250.00",
    descripcion: "Vista panorámica a los volcanes",
  },
  {
    id: 2,
    sucursal_id: 5,
    nombre: "Doble Deluxe",
    capacidad_maxima: 4,
    tarifa_noche: "750.00",
    descripcion: "Dos camas matrimoniales con balcón",
  },
  {
    id: 3,
    sucursal_id: null,
    nombre: "Habitación Económica",
    capacidad_maxima: 1,
    tarifa_noche: "0.00",
    descripcion: "Alojamiento de cortesía para personal o promociones especiales",
  },
];

function renderTypes(role = 'admin') {
  const original = global.fetch;
  global.fetch = vi.fn((input, init) => String(input).includes('/admin/dashboard')
    ? Promise.resolve(jsonResponse({ data: { global: role === 'admin', sedes: [{ id: 5, nombre: 'Sede QA', activa: true }] } }))
    : original(input, init));
  return renderWithProviders(<TiposHabitacionPage />);
}

describe("Gestión de Tipos de Habitación (TiposHabitacionPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.restoreAllMocks();
  });

  const setupFetchMock = (customTipos = mockTipos, role = "admin") => {
    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse(role));
      if (url.endsWith("/tipos-habitacion") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos obtenidos correctamente",
            data: customTipos,
          })
        );
      }
      return Promise.reject(new Error(`Ruta no manejada: ${url}`));
    });
  };

  it("reutiliza la clave de consulta existente del catálogo de tipos de habitación", () => {
    expect(TIPOS_HABITACION_QUERY_KEY).toEqual(["tipos-habitacion"]);
  });

  it("renderiza el listado con nombre, capacidad, tarifa en GTQ y descripción", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    renderTypes();

    expect((await screen.findAllByText("Suite Presidencial")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Doble Deluxe").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Habitación Económica").length).toBeGreaterThan(0);

    // Tarifas formateadas en GTQ
    expect(screen.getAllByText("Q1,250.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Q750.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Q0.00").length).toBeGreaterThan(0);

    // Capacidades
    expect(screen.getAllByText(/2 personas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4 personas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1 persona/i).length).toBeGreaterThan(0);
  });

  it("filtra tipos de habitación por nombre en tiempo real", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderTypes();

    await screen.findAllByText("Suite Presidencial");

    const searchInput = screen.getByLabelText(/Buscar tipo de habitación por nombre/i);
    await user.type(searchInput, "Presidencial");

    expect(screen.getAllByText("Suite Presidencial").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Doble Deluxe")).toHaveLength(0);
    expect(screen.queryAllByText("Habitación Económica")).toHaveLength(0);

    // Limpiar búsqueda
    const clearBtn = screen.getByLabelText(/Limpiar búsqueda/i);
    await user.click(clearBtn);

    expect(screen.getAllByText("Doble Deluxe").length).toBeGreaterThan(0);
  });

  it("valida que una tarifa vacía NO se convierta automáticamente a 0 y exija valor", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();
    const user = userEvent.setup();

    renderTypes();

    await screen.findAllByText("Suite Presidencial");

    const newBtn = screen.getByRole("button", { name: /Nuevo tipo de habitación/i });
    await user.click(newBtn);
    await user.selectOptions(await screen.findByLabelText("Sede del tipo de habitación"), "general");

    expect(
      screen.getByRole("heading", { name: /Registrar nuevo tipo de habitación/i })
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/^Nombre del tipo de habitación$/i);
    const capInput = screen.getByLabelText(/Capacidad máxima/i);
    const tarifaInput = screen.getByLabelText(/Tarifa por noche/i);

    await user.type(nameInput, "Suite Nupcial");
    await user.type(capInput, "2");
    // Se deja tarifaInput COMPLETAMENTE VACÍO
    expect(tarifaInput).toHaveValue("");

    const submitBtn = screen.getByRole("button", { name: /Guardar tipo de habitación/i });
    await user.click(submitBtn);

    // Debe mostrar error de que la tarifa es obligatoria y no enviar 0
    expect(
      await screen.findByText(/La tarifa por noche es obligatoria/i)
    ).toBeInTheDocument();
  });

  it("acepta explícitamente el valor 0 en la tarifa según el contrato y lo envía al backend", async () => {
    tokenStorage.set("jwt-admin");
    let createdPayload: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
      if (url.endsWith("/tipos-habitacion") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos obtenidos",
            data: mockTipos,
          })
        );
      }
      if (url.endsWith("/tipos-habitacion") && config?.method === "POST") {
        createdPayload = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse(
            {
              success: true,
              statusCode: 201,
              message: "Tipo de habitación creado correctamente",
              data: {
                id: 4,
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
    renderTypes();

    await screen.findAllByText("Suite Presidencial");

    const newBtn = screen.getByRole("button", { name: /Nuevo tipo de habitación/i });
    await user.click(newBtn);
    await user.selectOptions(await screen.findByLabelText("Sede del tipo de habitación"), "general");

    const nameInput = screen.getByLabelText(/^Nombre del tipo de habitación$/i);
    const capInput = screen.getByLabelText(/Capacidad máxima/i);
    const tarifaInput = screen.getByLabelText(/Tarifa por noche/i);

    await user.type(nameInput, "Cabaña de Cortesía");
    await user.type(capInput, "3");
    // Se ingresa explícitamente 0
    await user.type(tarifaInput, "0");

    const submitBtn = screen.getByRole("button", { name: /Guardar tipo de habitación/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createdPayload).toEqual({
        nombre: "Cabaña de Cortesía",
        sucursal_id: null,
        capacidad_maxima: 3,
        tarifa_noche: 0,
        descripcion: null,
      });
    });

    expect(
      await screen.findByText(/El tipo de habitación ha sido registrado correctamente/i)
    ).toBeInTheDocument();
  });

  it("edita un tipo de habitación existente con datos precargados y actualiza mediante PATCH", async () => {
    tokenStorage.set("jwt-admin");
    let patchedBody: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, config: any) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
      if (url.endsWith("/tipos-habitacion") && (!config || config.method === "GET")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos obtenidos",
            data: mockTipos,
          })
        );
      }
      if (url.match(/\/tipos-habitacion\/1$/) && config?.method === "PATCH") {
        patchedBody = JSON.parse(config.body);
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipo actualizado",
            data: { ...mockTipos[0], ...patchedBody },
          })
        );
      }
      return Promise.reject(new Error(`Unhandled: ${url}`));
    });

    const user = userEvent.setup();
    renderTypes();

    await screen.findAllByText("Suite Presidencial");

    const editButtons = screen.getAllByRole("button", {
      name: /Editar Suite Presidencial/i,
    });
    await user.click(editButtons[0]);

    expect(
      screen.getByRole("heading", { name: /Editar tipo de habitación/i })
    ).toBeInTheDocument();

    const tarifaInput = screen.getByLabelText(/Tarifa por noche/i);
    expect(tarifaInput).toHaveValue("1250.00");

    await user.clear(tarifaInput);
    await user.type(tarifaInput, "1350.50");

    const submitBtn = screen.getByRole("button", { name: /Guardar tipo de habitación/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(patchedBody).toMatchObject({
        tarifa_noche: 1350.5,
      });
    });

    expect(
      await screen.findByText(/El tipo de habitación ha sido actualizado correctamente/i)
    ).toBeInTheDocument();
  });

  it("muestra estado de error con opción de reintento funcional", async () => {
    tokenStorage.set("jwt-admin");
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/auth/me")) return Promise.resolve(meResponse("admin"));
      if (url.endsWith("/tipos-habitacion")) {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(
            errorResponse(500, "INTERNAL_SERVER_ERROR", "Error de base de datos")
          );
        }
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Tipos",
            data: mockTipos,
          })
        );
      }
      return Promise.reject(new Error(`Ruta: ${url}`));
    });

    const user = userEvent.setup();
    renderTypes();

    expect(
      await screen.findByText(/No fue posible cargar los tipos de habitación/i)
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Reintentar/i });
    await user.click(retryBtn);

    expect((await screen.findAllByText("Suite Presidencial")).length).toBeGreaterThan(0);
  });

  it("muestra estado de catálogo vacío cuando no hay tipos registrados", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock([]);

    renderTypes();

    expect(
      await screen.findByText(/No hay tipos de habitación registrados/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Comience registrando el primer tipo de habitación del hotel/i)
    ).toBeInTheDocument();
  });

  it("permite gestionar tipos a recepcionista y gerente_habitaciones", async () => {
    tokenStorage.set("jwt-recepcion");
    setupFetchMock(mockTipos, "recepcionista");

    renderTypes("recepcionista");

    await screen.findAllByText("Suite Presidencial");

    expect(
      screen.getByRole("button", { name: /Nuevo tipo de habitación/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Editar Suite Presidencial/i }).length
    ).toBeGreaterThan(0);
  });

  it("muestra modo de solo lectura para cliente o rol operativo", async () => {
    tokenStorage.set("jwt-cliente");
    setupFetchMock(mockTipos, "cliente");

    renderTypes();

    await screen.findAllByText("Suite Presidencial");

    expect(
      screen.queryByRole("button", { name: /Nuevo tipo de habitación/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Editar Suite Presidencial/i })
    ).not.toBeInTheDocument();
  });
});
