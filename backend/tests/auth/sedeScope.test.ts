import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES, Role } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { createHabitacion, createSucursal, createTipoHabitacion } from "../fixtures/hotel";

const db = require("../../src/models");
const { Empleado, EmpleadoSede, Habitacion, ReservaHabitacion } = db;

/**
 * Autorización real por sede (habitaciones y reservas de habitación).
 *
 * Sede principal = empleados.sucursal_id; sedes adicionales = empleado_sedes.
 * El administrador es global; el personal sin ficha de empleado no tiene sede;
 * el cliente solo ve lo propio. Todo se prueba con HTTP directo por ID.
 */
describe("Autorización por sede · habitaciones y reservas de habitación", () => {
  let sedeA: any, sedeB: any, sedeC: any;
  let habA: any, habB: any, habC: any;
  let tipoId: number;

  const futuro = (dias: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  };

  const personal = async (rol: Role, principal?: number, adicionales: number[] = []) => {
    const auth = await createAuthenticatedUser({ rol });
    if (principal) {
      const empleado = await Empleado.create({ usuario_id: auth.usuario.id, sucursal_id: principal, area: "QA" });
      for (const sucursal_id of adicionales) await EmpleadoSede.create({ empleado_id: empleado.id, sucursal_id });
    }
    return auth;
  };

  const as = (token?: string) => {
    const withAuth = (r: request.Test) => (token ? r.set("Authorization", `Bearer ${token}`) : r);
    return {
      get: (url: string) => withAuth(request(app).get(url)),
      post: (url: string, body: object) => withAuth(request(app).post(url)).send(body),
      patch: (url: string, body: object) => withAuth(request(app).patch(url)).send(body),
      delete: (url: string) => withAuth(request(app).delete(url)),
    };
  };

  const reservaEn = async (habitacion_id: number, dias = 30) => {
    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const res = await as(cliente.token).post("/api/reservas-habitacion", {
      habitacion_id,
      fecha_entrada: futuro(dias),
      fecha_salida: futuro(dias + 2),
      numero_huespedes: 1,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return { reserva: res.body.data, cliente };
  };

  beforeEach(async () => {
    [sedeA, sedeB, sedeC] = [await createSucursal(), await createSucursal(), await createSucursal()];
    tipoId = (await createTipoHabitacion()).id;
    habA = await createHabitacion({ sucursal_id: sedeA.id, tipo_habitacion_id: tipoId });
    habB = await createHabitacion({ sucursal_id: sedeB.id, tipo_habitacion_id: tipoId });
    habC = await createHabitacion({ sucursal_id: sedeC.id, tipo_habitacion_id: tipoId });
  });

  describe("Habitaciones", () => {
    it("empleado de una sede: el listado solo trae su sede y no puede pedir otra por filtro", async () => {
      const emp = await personal(ROLES.RECEPCIONISTA, sedeA.id);
      const lista = await as(emp.token).get("/api/habitaciones");
      expect(lista.status).toBe(200);
      expect(lista.body.data.map((h: any) => h.id)).toEqual([habA.id]);

      const otra = await as(emp.token).get(`/api/habitaciones?sucursal_id=${sedeB.id}`);
      expect(otra.status).toBe(403);
      expect(otra.body.code).toBe("SEDE_NOT_AUTHORIZED");
    });

    it("empleado de una sede: detalle, edición, borrado e imagen de otra sede por ID directo → 403", async () => {
      const emp = await personal(ROLES.GERENTE_HABITACIONES, sedeA.id);
      const api = as(emp.token);
      expect((await api.get(`/api/habitaciones/${habA.id}`)).status).toBe(200);

      for (const res of [
        await api.get(`/api/habitaciones/${habB.id}`),
        await api.patch(`/api/habitaciones/${habB.id}`, { estado: "mantenimiento" }),
        await api.delete(`/api/habitaciones/${habB.id}`),
        await api.post(`/api/habitaciones/${habB.id}/imagen-presign`, { contentType: "image/jpeg" }),
        await api.delete(`/api/habitaciones/${habB.id}/imagen`),
      ]) {
        expect(res.status, JSON.stringify(res.body)).toBe(403);
        expect(res.body.code).toBe("SEDE_NOT_AUTHORIZED");
      }
      const intacta = await Habitacion.findByPk(habB.id);
      expect(intacta.estado).toBe("disponible");
    });

    it("no puede crear en otra sede ni mover una habitación propia a otra sede (ni sacar una ajena)", async () => {
      const emp = await personal(ROLES.GERENTE_HABITACIONES, sedeA.id);
      const api = as(emp.token);

      const crear = await api.post("/api/habitaciones", { sucursal_id: sedeB.id, tipo_habitacion_id: tipoId, numero: "X-1" });
      expect(crear.status).toBe(403);
      expect(await Habitacion.count({ where: { numero: "X-1" } })).toBe(0);

      const mover = await api.patch(`/api/habitaciones/${habA.id}`, { sucursal_id: sedeB.id });
      expect(mover.status).toBe(403);
      expect((await Habitacion.findByPk(habA.id)).sucursal_id).toBe(sedeA.id);

      const traer = await api.patch(`/api/habitaciones/${habB.id}`, { sucursal_id: sedeA.id });
      expect(traer.status).toBe(403);
      expect((await Habitacion.findByPk(habB.id)).sucursal_id).toBe(sedeB.id);

      const propia = await api.post("/api/habitaciones", { sucursal_id: sedeA.id, tipo_habitacion_id: tipoId, numero: "A-9" });
      expect(propia.status, JSON.stringify(propia.body)).toBe(201);
    });

    it("empleado con varias sedes ve y gestiona sus sedes, no las demás", async () => {
      const emp = await personal(ROLES.RECEPCIONISTA, sedeA.id, [sedeB.id]);
      const api = as(emp.token);
      const lista = await api.get("/api/habitaciones");
      expect(lista.body.data.map((h: any) => h.id).sort()).toEqual([habA.id, habB.id].sort());
      expect((await api.get(`/api/habitaciones?sucursal_id=${sedeB.id}`)).body.data.map((h: any) => h.id)).toEqual([habB.id]);
      expect((await api.get(`/api/habitaciones/${habB.id}`)).status).toBe(200);
      expect((await api.get(`/api/habitaciones/${habC.id}`)).status).toBe(403);
      // Puede mover entre sus propias sedes
      expect((await api.patch(`/api/habitaciones/${habA.id}`, { sucursal_id: sedeB.id })).status).toBe(200);
    });

    it("personal sin ficha de empleado no obtiene acceso global: 403 SEDE_NOT_ASSIGNED", async () => {
      const emp = await personal(ROLES.RECEPCIONISTA);
      const api = as(emp.token);
      for (const res of [
        await api.get("/api/habitaciones"),
        await api.get(`/api/habitaciones/${habA.id}`),
        await api.post("/api/habitaciones", { sucursal_id: sedeA.id, tipo_habitacion_id: tipoId, numero: "Z-1" }),
      ]) {
        expect(res.status).toBe(403);
        expect(res.body.code).toBe("SEDE_NOT_ASSIGNED");
      }
    });

    it("el administrador es global", async () => {
      const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
      const api = as(admin.token);
      expect((await api.get("/api/habitaciones")).body.data).toHaveLength(3);
      expect((await api.get(`/api/habitaciones?sucursal_id=${sedeC.id}`)).body.data.map((h: any) => h.id)).toEqual([habC.id]);
      expect((await api.patch(`/api/habitaciones/${habC.id}`, { estado: "limpieza" })).status).toBe(200);
    });

    it("cliente → 403 y sin sesión → 401", async () => {
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      expect((await as(cliente.token).get(`/api/habitaciones/${habA.id}`)).status).toBe(403);
      expect((await as().get("/api/habitaciones")).status).toBe(401);
      expect((await as().get(`/api/habitaciones/${habA.id}`)).status).toBe(401);
    });

    it("el catálogo público no cambia", async () => {
      const res = await request(app).get("/api/public/habitaciones");
      expect(res.status).toBe(200);
    });
  });

  describe("Reservas de habitación", () => {
    it("listado filtrado por sede y detalle ajeno por ID → 403", async () => {
      const { reserva: rA } = await reservaEn(habA.id);
      const { reserva: rB } = await reservaEn(habB.id);
      const emp = await personal(ROLES.RECEPCIONISTA, sedeA.id);
      const api = as(emp.token);

      const lista = await api.get("/api/reservas-habitacion");
      expect(lista.status).toBe(200);
      expect(lista.body.data.map((r: any) => r.id)).toEqual([rA.id]);

      expect((await api.get(`/api/reservas-habitacion/${rA.id}`)).status).toBe(200);
      const ajena = await api.get(`/api/reservas-habitacion/${rB.id}`);
      expect(ajena.status).toBe(403);
      expect(ajena.body.code).toBe("SEDE_NOT_AUTHORIZED");
    });

    it("no puede crear, modificar, mover ni cancelar reservas fuera de su sede", async () => {
      const { reserva: rA, cliente } = await reservaEn(habA.id);
      const { reserva: rB } = await reservaEn(habB.id);
      const emp = await personal(ROLES.RECEPCIONISTA, sedeA.id);
      const api = as(emp.token);

      const crear = await api.post("/api/reservas-habitacion", {
        usuario_id: cliente.usuario.id, habitacion_id: habB.id,
        fecha_entrada: futuro(60), fecha_salida: futuro(61), numero_huespedes: 1,
      });
      expect(crear.status).toBe(403);
      expect(await ReservaHabitacion.count({ where: { habitacion_id: habB.id } })).toBe(1);

      expect((await api.patch(`/api/reservas-habitacion/${rB.id}`, { numero_huespedes: 2 })).status).toBe(403);
      expect((await api.delete(`/api/reservas-habitacion/${rB.id}`)).status).toBe(403);
      expect((await ReservaHabitacion.findByPk(rB.id)).estado).toBe(rB.estado);

      // Mover una reserva propia a una habitación de otra sede
      const mover = await api.patch(`/api/reservas-habitacion/${rA.id}`, { habitacion_id: habB.id });
      expect(mover.status).toBe(403);
      expect((await ReservaHabitacion.findByPk(rA.id)).habitacion_id).toBe(habA.id);

      // En su sede sí puede operar
      const propia = await api.post("/api/reservas-habitacion", {
        usuario_id: cliente.usuario.id, habitacion_id: habA.id,
        fecha_entrada: futuro(90), fecha_salida: futuro(91), numero_huespedes: 1,
      });
      expect(propia.status, JSON.stringify(propia.body)).toBe(201);
    });

    it("varias sedes, administrador global, personal sin sede, cliente y anónimo", async () => {
      const { reserva: rA, cliente } = await reservaEn(habA.id);
      const { reserva: rB } = await reservaEn(habB.id);
      const { reserva: rC } = await reservaEn(habC.id);

      const multi = as((await personal(ROLES.GERENTE_HABITACIONES, sedeA.id, [sedeB.id])).token);
      expect((await multi.get("/api/reservas-habitacion")).body.data.map((r: any) => r.id).sort()).toEqual([rA.id, rB.id].sort());
      expect((await multi.get(`/api/reservas-habitacion/${rC.id}`)).status).toBe(403);

      const admin = as((await createAuthenticatedUser({ rol: ROLES.ADMIN })).token);
      expect((await admin.get("/api/reservas-habitacion")).body.data).toHaveLength(3);
      expect((await admin.get(`/api/reservas-habitacion/${rC.id}`)).status).toBe(200);

      const sinSede = as((await personal(ROLES.RECEPCIONISTA)).token);
      const lista = await sinSede.get("/api/reservas-habitacion");
      expect(lista.status).toBe(403);
      expect(lista.body.code).toBe("SEDE_NOT_ASSIGNED");
      expect((await sinSede.get(`/api/reservas-habitacion/${rA.id}`)).status).toBe(403);

      // El cliente sigue viendo y creando lo suyo, sin restricción de sede
      const propio = as(cliente.token);
      expect((await propio.get("/api/reservas-habitacion")).body.data.map((r: any) => r.id)).toEqual([rA.id]);
      expect((await propio.get(`/api/reservas-habitacion/${rB.id}`)).status).toBe(403);

      expect((await as().get("/api/reservas-habitacion")).status).toBe(401);
      expect((await as().get(`/api/reservas-habitacion/${rA.id}`)).status).toBe(401);
    });
  });
});
