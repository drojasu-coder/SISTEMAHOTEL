import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders,
  jsonResponse,
  meResponse,
  errorResponse,
} from "@/test/renderWithProviders";
import { tokenStorage } from "@/api/session";
import { ParqueosPage } from "@/pages/ParqueosPage";
import { ServiciosPage } from "@/pages/ServiciosPage";
import type { Parqueo } from "./types";
import type { Sucursal } from "@/features/sedes/types";

/**
 * Pruebas del módulo de espacios de parqueo con fetch simulado.
 * Las consultas se acotan a la tabla del listado para no confundirse con las
 * opciones de los filtros, que repiten los números de parqueo.
 */

const mockSedes: Sucursal[] = [
  {
    id: 1,
    nombre: "Hotel Hunapú Antigua",
    direccion: "5ta Avenida Norte #12",
    ciudad: "Antigua Guatemala",
    telefono: "78320011",
    activa: true,
  },
  {
    id: 2,
    nombre: "Hotel Hunapú Atitlán",
    direccion: "Calle Santander",
    ciudad: "Panajachel",
    telefono: "77620022",
    activa: true,
  },
];

const mockParqueos: Parqueo[] = [
  { id: 1, sucursal_id: 1, numero: "A-01", estado: "disponible" },
  { id: 2, sucursal_id: 1, numero: "A-02", estado: "ocupado" },
  { id: 3, sucursal_id: 2, numero: "B-01", estado: "mantenimiento" },
];

interface FetchCall {
  url: string;
  method: string;
  body: unknown;
}

interface MockOptions {
  role?: string;
  parqueos?: Parqueo[];
  listError?: { status: number; code: string; message: string };
  createStatus?: number;
  patchStatus?: number;
  calls?: FetchCall[];
}

function setupFetchMock(options: MockOptions = {}) {
  const {
    role = "admin",
    parqueos = mockParqueos,
    listError,
    createStatus,
    patchStatus,
    calls = [],
  } = options;

  let listAttempts = 0;

  global.fetch = vi.fn().mockImplementation((url: string, config?: RequestInit) => {
    const method = (config?.method ?? "GET").toUpperCase();
    const body = config?.body ? JSON.parse(String(config.body)) : undefined;
    calls.push({ url: String(url), method, body });

    if (String(url).endsWith("/auth/me")) {
      return Promise.resolve(meResponse(role));
    }
    if (String(url).endsWith("/sucursales")) {
      return Promise.resolve(jsonResponse({ status: "success", data: mockSedes }));
    }
    if (String(url).endsWith("/parqueos") && method === "GET") {
      listAttempts += 1;
      if (listError && listAttempts === 1) {
        return Promise.resolve(
          errorResponse(listError.status, listError.code, listError.message)
        );
      }
      return Promise.resolve(
        jsonResponse({
          success: true,
          statusCode: 200,
          message: "Parqueos obtenidos correctamente",
          data: parqueos,
        })
      );
    }
    if (String(url).endsWith("/parqueos") && method === "POST") {
      if (createStatus && createStatus >= 400) {
        return Promise.resolve(
          errorResponse(
            createStatus,
            createStatus === 409
              ? "PARQUEO_NUMBER_ALREADY_EXISTS"
              : "INSUFFICIENT_PERMISSIONS",
            createStatus === 409
              ? "Ya existe un parqueo con ese número en la sucursal"
              : "No tiene permisos para realizar esta operación"
          )
        );
      }
      return Promise.resolve(
        jsonResponse(
          {
            success: true,
            statusCode: 201,
            message: "Parqueo creado correctamente",
            data: { id: 9, ...(body as object) },
          },
          201
        )
      );
    }
    if (/\/parqueos\/\d+$/.test(String(url)) && method === "PATCH") {
      if (patchStatus && patchStatus >= 400) {
        return Promise.resolve(
          errorResponse(
            patchStatus,
            "PARQUEO_NUMBER_ALREADY_EXISTS",
            "Ya existe un parqueo con ese número en la sucursal"
          )
        );
      }
      return Promise.resolve(
        jsonResponse({
          success: true,
          statusCode: 200,
          message: "Parqueo actualizado correctamente",
          data: { ...(mockParqueos[0] as object), ...(body as object) },
        })
      );
    }
    return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
  });

  return calls;
}

/** Listado de la tabla (el mismo dato se repite en las tarjetas móviles). */
function listado() {
  return within(screen.getByRole("table"));
}

describe("Gestión de espacios de parqueo (ParqueosPage)", () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    tokenStorage.clear();
  });

  it("muestra el listado con número, sede y estado", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    renderWithProviders(<ParqueosPage />);

    expect(screen.getByText(/Cargando espacios de parqueo/i)).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /Espacios de parqueo/i,
      })
    ).toBeInTheDocument();

    expect(listado().getByText("A-01")).toBeInTheDocument();
    expect(listado().getByText("A-02")).toBeInTheDocument();
    expect(listado().getByText("B-01")).toBeInTheDocument();
    expect(listado().getAllByText("Hotel Hunapú Antigua")).toHaveLength(2);
    expect(listado().getByText("Hotel Hunapú Atitlán")).toBeInTheDocument();
    expect(listado().getByText("Disponible")).toBeInTheDocument();
    expect(listado().getByText("Ocupado")).toBeInTheDocument();
    expect(listado().getByText("Mantenimiento")).toBeInTheDocument();
    expect(screen.getAllByText(/3 espacios mostrados/).length).toBeGreaterThan(0);
  });

  it("filtra por número, sede y estado con los datos cargados", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    const user = userEvent.setup();
    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    // Búsqueda por número
    await user.type(screen.getByLabelText(/Buscar parqueo por número/i), "B-01");
    expect(listado().queryByText("A-01")).toBeNull();
    expect(listado().getByText("B-01")).toBeInTheDocument();

    // Limpiar búsqueda y filtrar por sede
    await user.click(screen.getByLabelText(/Limpiar búsqueda/i));
    await user.selectOptions(screen.getByLabelText("Filtrar por sede"), "2");
    expect(listado().queryByText("A-01")).toBeNull();
    expect(listado().getByText("B-01")).toBeInTheDocument();

    // Filtrar por estado
    await user.selectOptions(screen.getByLabelText("Filtrar por sede"), "all");
    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "ocupado");
    expect(listado().getByText("A-02")).toBeInTheDocument();
    expect(listado().queryByText("A-01")).toBeNull();
    expect(listado().queryByText("B-01")).toBeNull();
  });

  it("muestra aviso sin resultados y permite limpiar los filtros", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock();

    const user = userEvent.setup();
    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    await user.type(screen.getByLabelText(/Buscar parqueo por número/i), "Z-99");

    expect(
      await screen.findByText(
        /No se encontraron espacios de parqueo con los criterios/i
      )
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Limpiar filtros/i })[0]);

    await waitFor(() => {
      expect(listado().getByText("A-01")).toBeInTheDocument();
    });
  });

  it("muestra el estado vacío cuando no hay espacios registrados", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock({ parqueos: [] });

    renderWithProviders(<ParqueosPage />);

    expect(
      await screen.findByText(/No hay espacios de parqueo registrados/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Filtrar por sede")).not.toBeInTheDocument();
  });

  it("muestra error y permite reintentar ante fallo de la API", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock({
      listError: {
        status: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Error interno",
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<ParqueosPage />);

    expect(
      await screen.findByText(/No fue posible cargar los espacios de parqueo/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reintentar/i }));

    expect((await screen.findAllByText("A-01")).length).toBeGreaterThan(0);
  });

  it("valida el formulario antes de enviarlo", async () => {
    tokenStorage.set("jwt-admin");
    const calls = setupFetchMock();

    const user = userEvent.setup();
    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    await user.click(screen.getByRole("button", { name: /Nuevo espacio de parqueo/i }));
    expect(
      screen.getByRole("heading", { name: /Registrar nuevo espacio de parqueo/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Guardar espacio/i }));

    expect(
      await screen.findByText(/El número de parqueo es obligatorio/i)
    ).toBeInTheDocument();
    expect(calls.filter((call) => call.method === "POST")).toHaveLength(0);
  });

  it("registra un espacio de parqueo con los datos ingresados", async () => {
    tokenStorage.set("jwt-admin");
    const calls = setupFetchMock();

    const user = userEvent.setup();
    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    await user.click(screen.getByRole("button", { name: /Nuevo espacio de parqueo/i }));

    await user.selectOptions(screen.getByLabelText("Sede"), "2");
    await user.type(screen.getByLabelText("Número de parqueo"), "C-07");
    await user.selectOptions(screen.getByLabelText("Estado del espacio"), "mantenimiento");

    await user.click(screen.getByRole("button", { name: /Guardar espacio/i }));

    await waitFor(() => {
      const posted = calls.find((call) => call.method === "POST");
      expect(posted).toBeDefined();
      expect(posted?.body).toEqual({
        sucursal_id: 2,
        numero: "C-07",
        estado: "mantenimiento",
      });
    });

    expect(
      await screen.findByText(/El espacio de parqueo ha sido registrado correctamente/i)
    ).toBeInTheDocument();
  });

  it("edita un espacio de parqueo con los datos precargados", async () => {
    tokenStorage.set("jwt-admin");
    const calls = setupFetchMock();

    const user = userEvent.setup();
    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    await user.click(screen.getAllByRole("button", { name: /Editar espacio de parqueo/ })[0]);

    expect(
      screen.getByRole("heading", { name: /Editar espacio de parqueo/i })
    ).toBeInTheDocument();

    const numero = screen.getByLabelText("Número de parqueo");
    expect(numero).toHaveValue("A-01");
    expect(screen.getByLabelText("Sede")).toHaveValue("1");
    expect(screen.getByLabelText("Estado del espacio")).toHaveValue("disponible");

    await user.clear(numero);
    await user.type(numero, "A-09");
    await user.selectOptions(screen.getByLabelText("Estado del espacio"), "ocupado");

    await user.click(screen.getByRole("button", { name: /Guardar espacio/i }));

    await waitFor(() => {
      const patched = calls.find((call) => call.method === "PATCH");
      expect(patched).toBeDefined();
      expect(patched?.body).toEqual({
        sucursal_id: 1,
        numero: "A-09",
        estado: "ocupado",
      });
    });

    expect(
      await screen.findByText(/El espacio de parqueo ha sido actualizado correctamente/i)
    ).toBeInTheDocument();
  });

  it("muestra el error del servidor cuando el número ya existe en la sede", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock({ createStatus: 409 });

    const user = userEvent.setup();
    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    await user.click(screen.getByRole("button", { name: /Nuevo espacio de parqueo/i }));

    await user.type(screen.getByLabelText("Número de parqueo"), "A-01");
    await user.click(screen.getByRole("button", { name: /Guardar espacio/i }));

    expect(
      await screen.findByText(/Ya existe un parqueo con ese número en la sucursal/i)
    ).toBeInTheDocument();
    // El modal permanece abierto y conserva los datos.
    expect(screen.getByLabelText("Número de parqueo")).toHaveValue("A-01");
  });

  it("conserva los datos escritos cuando el catálogo de sedes llega tarde", async () => {
    tokenStorage.set("jwt-admin");
    let resolveSucursales: (value: Response) => void = () => undefined;

    global.fetch = vi.fn().mockImplementation((url: string, config?: RequestInit) => {
      const method = (config?.method ?? "GET").toUpperCase();
      if (String(url).endsWith("/auth/me")) {
        return Promise.resolve(meResponse("admin"));
      }
      if (String(url).endsWith("/sucursales")) {
        return new Promise<Response>((resolve) => {
          resolveSucursales = resolve;
        });
      }
      if (String(url).endsWith("/parqueos") && method === "GET") {
        return Promise.resolve(
          jsonResponse({
            success: true,
            statusCode: 200,
            message: "Parqueos obtenidos correctamente",
            data: mockParqueos,
          })
        );
      }
      return Promise.reject(new Error(`Ruta no manejada en mock: ${url}`));
    });

    const user = userEvent.setup();
    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    await user.click(screen.getByRole("button", { name: /Nuevo espacio de parqueo/i }));
    await user.type(screen.getByLabelText("Número de parqueo"), "Z-99");

    // El catálogo de sedes se resuelve después de escribir.
    await act(async () => {
      resolveSucursales(jsonResponse({ status: "success", data: mockSedes }));
    });

    // La llegada del catálogo se refleja en el listado...
    await waitFor(() => {
      expect(screen.getAllByText("Hotel Hunapú Antigua").length).toBeGreaterThan(0);
    });
    // ...pero no borra lo que la persona ya escribió.
    expect(screen.getByLabelText("Número de parqueo")).toHaveValue("Z-99");
  });

  it("no muestra acciones de gestión para roles sin permiso", async () => {
    tokenStorage.set("jwt-cliente");
    setupFetchMock({ role: "cliente" });

    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    expect(
      screen.queryByRole("button", { name: /Nuevo espacio de parqueo/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Editar espacio de parqueo/i })
    ).not.toBeInTheDocument();
    // La lectura solo exige sesión: el listado permanece disponible.
    expect(screen.getAllByText("A-01").length).toBeGreaterThan(0);
  });

  it("permite gestionar espacios de parqueo al gerente de habitaciones", async () => {
    tokenStorage.set("jwt-gerente");
    setupFetchMock({ role: "gerente_habitaciones" });

    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    expect(
      screen.getByRole("button", { name: /Nuevo espacio de parqueo/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Editar espacio de parqueo/i }).length
    ).toBeGreaterThan(0);
  });
  it("muestra el enlace de navegación hacia Habitaciones en el encabezado", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock({ role: "admin" });

    renderWithProviders(<ParqueosPage />);

    await screen.findByRole("heading", {
      level: 1,
      name: /Espacios de parqueo/i,
    });

    const habitacionesLink = screen.getByRole("link", { name: /Habitaciones/i });
    expect(habitacionesLink).toBeInTheDocument();
    expect(habitacionesLink).toHaveAttribute("href", "/admin/habitaciones");
  });

  it("muestra la tarjeta con enlace funcional a Parqueos en Servicios para rol con habitaciones.gestionar", async () => {
    tokenStorage.set("jwt-admin");
    setupFetchMock({ role: "admin" });

    renderWithProviders(<ServiciosPage />);

    expect(await screen.findByRole("heading", { name: /Parqueos y Estacionamiento/i })).toBeInTheDocument();
    const parqueosLink = screen.getByRole("link", { name: /Gestionar parqueos/i });
    expect(parqueosLink).toBeInTheDocument();
    expect(parqueosLink).toHaveAttribute("href", "/admin/parqueos");
  });
});
