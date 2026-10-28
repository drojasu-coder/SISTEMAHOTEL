import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";

/**
 * Autorización real del backend (no depende de ocultar botones en el frontend):
 * sin credenciales → 401; cliente u operativo en recursos administrativos → 403;
 * administrador → 200; catálogos públicos accesibles sin sesión.
 */
const ADMIN_ONLY = [
  "/api/usuarios", "/api/empleados", "/api/turnos", "/api/choferes", "/api/vehiculos",
  "/api/proveedores", "/api/proveedor-productos", "/api/cuentas-por-pagar",
  "/api/reservas-parqueo", "/api/reservas-actividad", "/api/reservas-mesa", "/api/citas-spa",
  "/api/boletos-parque", "/api/admin/dashboard", "/api/habitaciones", "/api/parqueos",
];
// Listados con sesión que el servicio limita a los registros propios del usuario.
const OWNER_SCOPED = [
  "/api/facturas", "/api/factura-items", "/api/pagos", "/api/reservas-habitacion",
  "/api/reservas-evento", "/api/reservas-transporte", "/api/reservas-amenidad", "/api/carritos",
];
const PUBLIC = [
  "/api/sucursales", "/api/public/habitaciones", "/api/public/tipos-habitacion", "/api/salones",
  "/api/mesas", "/api/restaurantes", "/api/recursos-actividad", "/api/amenidades",
  "/api/terapeutas", "/api/servicios-spa", "/api/servicios-evento", "/api/inicio",
];

describe("Matriz de autorización de la API", () => {
  let cliente: string;
  let operativo: string;
  let admin: string;
  beforeEach(async () => {
    cliente = (await createAuthenticatedUser({ rol: ROLES.CLIENTE })).token;
    operativo = (await createAuthenticatedUser({ rol: ROLES.EMPLEADO_OPERATIVO })).token;
    admin = (await createAuthenticatedUser({ rol: ROLES.ADMIN })).token;
  });

  it.each([...ADMIN_ONLY, ...OWNER_SCOPED])("%s exige credenciales (401)", async (path) => {
    expect((await request(app).get(path)).status).toBe(401);
  });

  it("rechaza un token manipulado o inventado", async () => {
    const res = await request(app).get("/api/usuarios").set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.e30.firma-falsa");
    expect(res.status).toBe(401);
  });

  it.each(ADMIN_ONLY)("%s rechaza al cliente y al empleado operativo (403) y admite al administrador", async (path) => {
    expect((await request(app).get(path).set("Authorization", `Bearer ${cliente}`)).status).toBe(403);
    expect((await request(app).get(path).set("Authorization", `Bearer ${operativo}`)).status).toBe(403);
    expect((await request(app).get(path).set("Authorization", `Bearer ${admin}`)).status).toBe(200);
  });

  it.each(PUBLIC)("%s es público (200 sin sesión)", async (path) => {
    expect((await request(app).get(path)).status).toBe(200);
  });
});
