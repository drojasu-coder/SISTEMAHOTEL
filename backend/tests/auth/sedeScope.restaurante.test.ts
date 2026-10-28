import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { assignEmpleadoSede, createSucursal } from "../fixtures/hotel";

const db = require("../../src/models");
const { Mesa, ProductoMenu, Restaurante } = db;

/**
 * Autorización por sede en la gestión del restaurante (mesas y menú), único
 * módulo comercial con sede donde opera personal no administrador
 * (gerente_restaurante). Las consultas públicas no cambian.
 */
describe("Autorización por sede · mesas y menú del restaurante", () => {
  let sedeA: any, sedeB: any, restA: any, restB: any, mesaA: any, mesaB: any, prodA: any, prodB: any;

  const as = (token?: string) => {
    const withAuth = (r: request.Test) => (token ? r.set("Authorization", `Bearer ${token}`) : r);
    return {
      get: (url: string) => withAuth(request(app).get(url)),
      post: (url: string, body: object) => withAuth(request(app).post(url)).send(body),
      patch: (url: string, body: object) => withAuth(request(app).patch(url)).send(body),
      delete: (url: string) => withAuth(request(app).delete(url)),
    };
  };

  const gerente = async (principal?: number, adicionales: number[] = []) => {
    const auth = await createAuthenticatedUser({ rol: ROLES.GERENTE_RESTAURANTE });
    if (principal) await assignEmpleadoSede(auth.usuario.id, principal, adicionales);
    return as(auth.token);
  };

  const producto = { categoria: "postre", nombre: "Flan QA", precio: 25 };

  beforeEach(async () => {
    [sedeA, sedeB] = [await createSucursal(), await createSucursal()];
    restA = await Restaurante.create({ sucursal_id: sedeA.id, nombre: "Rest A" });
    restB = await Restaurante.create({ sucursal_id: sedeB.id, nombre: "Rest B" });
    mesaA = await Mesa.create({ sucursal_id: sedeA.id, restaurante_id: restA.id, zona: "Terraza", capacidad: 4, estado: "disponible" });
    mesaB = await Mesa.create({ sucursal_id: sedeB.id, restaurante_id: restB.id, zona: "Salón", capacidad: 4, estado: "disponible" });
    prodA = await ProductoMenu.create({ restaurante_id: restA.id, categoria: "bebida", nombre: "Café A", precio: 10 });
    prodB = await ProductoMenu.create({ restaurante_id: restB.id, categoria: "bebida", nombre: "Café B", precio: 10 });
  });

  it("gerente de una sede: no gestiona mesas ni menú de otra sede por ID directo", async () => {
    const api = await gerente(sedeA.id);
    for (const res of [
      await api.post("/api/mesas", { sucursal_id: sedeB.id, zona: "X", capacidad: 2 }),
      await api.patch(`/api/mesas/${mesaB.id}`, { capacidad: 8 }),
      await api.delete(`/api/mesas/${mesaB.id}`),
      await api.get(`/api/restaurantes/${restB.id}/productos`),
      await api.post(`/api/restaurantes/${restB.id}/productos`, producto),
      await api.patch(`/api/restaurantes/productos/${prodB.id}`, { precio: 1 }),
    ]) {
      expect(res.status, JSON.stringify(res.body)).toBe(403);
      expect(res.body.code).toBe("SEDE_NOT_AUTHORIZED");
    }
    expect((await Mesa.findByPk(mesaB.id)).capacidad).toBe(4);
    expect(Number((await ProductoMenu.findByPk(prodB.id)).precio)).toBe(10);
    expect(await ProductoMenu.count({ where: { nombre: "Flan QA" } })).toBe(0);

    // En su sede opera con normalidad
    expect((await api.post("/api/mesas", { sucursal_id: sedeA.id, zona: "Jardín", capacidad: 2 })).status).toBe(201);
    expect((await api.patch(`/api/mesas/${mesaA.id}`, { capacidad: 6 })).status).toBe(200);
    expect((await api.get(`/api/restaurantes/${restA.id}/productos`)).status).toBe(200);
    expect((await api.post(`/api/restaurantes/${restA.id}/productos`, producto)).status).toBe(201);
    expect((await api.patch(`/api/restaurantes/productos/${prodA.id}`, { precio: 12 })).status).toBe(200);
  });

  it("gerente con varias sedes, sin sede, administrador, cliente y anónimo", async () => {
    const multi = await gerente(sedeA.id, [sedeB.id]);
    expect((await multi.patch(`/api/restaurantes/productos/${prodB.id}`, { precio: 11 })).status).toBe(200);
    expect((await multi.patch(`/api/mesas/${mesaB.id}`, { capacidad: 5 })).status).toBe(200);

    const sinSede = await gerente();
    const denegado = await sinSede.patch(`/api/mesas/${mesaA.id}`, { capacidad: 2 });
    expect(denegado.status).toBe(403);
    expect(denegado.body.code).toBe("SEDE_NOT_ASSIGNED");
    expect((await sinSede.get(`/api/restaurantes/${restA.id}/productos`)).body.code).toBe("SEDE_NOT_ASSIGNED");

    const admin = as((await createAuthenticatedUser({ rol: ROLES.ADMIN })).token);
    expect((await admin.patch(`/api/mesas/${mesaB.id}`, { capacidad: 3 })).status).toBe(200);
    expect((await admin.post(`/api/restaurantes/${restB.id}/productos`, producto)).status).toBe(201);

    const cliente = as((await createAuthenticatedUser({ rol: ROLES.CLIENTE })).token);
    expect((await cliente.patch(`/api/mesas/${mesaA.id}`, { capacidad: 2 })).status).toBe(403);
    expect((await cliente.get(`/api/restaurantes/${restA.id}/productos`)).status).toBe(403);

    expect((await as().patch(`/api/mesas/${mesaA.id}`, { capacidad: 2 })).status).toBe(401);
    // Consultas públicas sin cambios
    expect((await as().get("/api/mesas")).status).toBe(200);
    expect((await as().get(`/api/restaurantes/${restA.id}/menu`)).status).toBe(200);
  });

  it("alcance del panel: el gerente obtiene solo sus sedes y no accede al dashboard", async () => {
    const auth = await createAuthenticatedUser({ rol: ROLES.GERENTE_RESTAURANTE });
    await assignEmpleadoSede(auth.usuario.id, sedeA.id);
    const api = as(auth.token);

    const alcance = await api.get("/api/admin/alcance");
    expect(alcance.status).toBe(200);
    expect(alcance.body.data).toEqual({ global: false, sedes: [{ id: sedeA.id, nombre: sedeA.nombre, activa: true }] });
    // Sin métricas ni inventario: el resumen del dashboard sigue reservado a gestión de habitaciones.
    expect((await api.get("/api/admin/dashboard")).status).toBe(403);
    expect((await api.get("/api/admin/dashboard?vista=alcance")).status).toBe(403);

    // Lo que sí gestiona queda limitado a su sede; las consultas públicas siguen abiertas.
    expect((await api.get(`/api/restaurantes/${restA.id}/productos`)).status).toBe(200);
    expect((await api.get(`/api/restaurantes/${restB.id}/productos`)).status).toBe(403);
    expect((await api.patch(`/api/mesas/${mesaB.id}`, { capacidad: 2 })).status).toBe(403);
    expect((await api.get("/api/reservas-mesa")).status).toBe(403); // sigue siendo exclusivo del administrador
    expect((await as().get(`/api/restaurantes/${restB.id}/menu`)).status).toBe(200);

    const admin = as((await createAuthenticatedUser({ rol: ROLES.ADMIN })).token);
    const global = await admin.get("/api/admin/alcance");
    expect(global.body.data.global).toBe(true);
    expect(global.body.data.sedes.map((x: any) => x.id)).toEqual(expect.arrayContaining([sedeA.id, sedeB.id]));

    const sinSede = await createAuthenticatedUser({ rol: ROLES.GERENTE_RESTAURANTE });
    expect((await as(sinSede.token).get("/api/admin/alcance")).body.code).toBe("SEDE_NOT_ASSIGNED");
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    expect((await as(cliente.token).get("/api/admin/alcance")).status).toBe(403);
    expect((await as().get("/api/admin/alcance")).status).toBe(401);
  });
});
