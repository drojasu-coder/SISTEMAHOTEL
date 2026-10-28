import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES, Role } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import {
  assignEmpleadoSede,
  createHabitacion,
  createParqueo,
  createSucursal,
  createTipoHabitacion,
} from "../fixtures/hotel";

const db = require("../../src/models");
const { Habitacion, Parqueo, ReservaParqueo, TipoHabitacion } = db;

/**
 * Fase 3A · autorización por sede en tipos de habitación, parqueos y reservas
 * de parqueo, con HTTP directo por ID para cada perfil.
 */
describe("Autorización por sede · tipos de habitación, parqueos y reservas de parqueo", () => {
  let sedeA: any, sedeB: any, sedeC: any;
  let tipoA: any, tipoB: any, tipoGeneral: any;
  let parqueoA: any, parqueoB: any, parqueoC: any;

  const futuro = (dias: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  };

  const personal = async (rol: Role, principal?: number, adicionales: number[] = []) => {
    const auth = await createAuthenticatedUser({ rol });
    if (principal) await assignEmpleadoSede(auth.usuario.id, principal, adicionales);
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

  const tipoEn = async (sucursal_id: number | null) => {
    const tipo = await createTipoHabitacion();
    await tipo.update({ sucursal_id });
    return tipo;
  };

  const reservaParqueoEn = (parqueo_id: number, dias = 20) =>
    ReservaParqueo.create({ parqueo_id, fecha_entrada: futuro(dias), fecha_salida: futuro(dias + 1) });

  const ids = (res: request.Response) => res.body.data.map((x: any) => x.id).sort((a: number, b: number) => a - b);

  beforeEach(async () => {
    [sedeA, sedeB, sedeC] = [await createSucursal(), await createSucursal(), await createSucursal()];
    [tipoA, tipoB, tipoGeneral] = [await tipoEn(sedeA.id), await tipoEn(sedeB.id), await tipoEn(null)];
    parqueoA = await createParqueo({ sucursal_id: sedeA.id });
    parqueoB = await createParqueo({ sucursal_id: sedeB.id });
    parqueoC = await createParqueo({ sucursal_id: sedeC.id });
  });

  describe("Tipos de habitación", () => {
    it("empleado de una sede ve los tipos de su sede y los generales; los ajenos por ID → 403", async () => {
      const api = as((await personal(ROLES.GERENTE_HABITACIONES, sedeA.id)).token);
      const lista = await api.get("/api/tipos-habitacion");
      expect(lista.status).toBe(200);
      expect(ids(lista)).toEqual([tipoA.id, tipoGeneral.id].sort((a, b) => a - b));
      expect((await api.get(`/api/tipos-habitacion/${tipoGeneral.id}`)).status).toBe(200);

      const ajeno = await api.get(`/api/tipos-habitacion/${tipoB.id}`);
      expect(ajeno.status).toBe(403);
      expect(ajeno.body.code).toBe("SEDE_NOT_AUTHORIZED");
      expect((await api.get(`/api/tipos-habitacion?sucursal_id=${sedeB.id}`)).status).toBe(403);
    });

    it("no puede crear, editar, borrar ni cambiar imagen de tipos ajenos o generales, ni mover de sede", async () => {
      const api = as((await personal(ROLES.GERENTE_HABITACIONES, sedeA.id)).token);
      const base = { nombre: "Suite QA", capacidad_maxima: 2, tarifa_noche: 300 };
      for (const res of [
        await api.post("/api/tipos-habitacion", { ...base, sucursal_id: sedeB.id }),
        await api.post("/api/tipos-habitacion", base),
        await api.patch(`/api/tipos-habitacion/${tipoB.id}`, { tarifa_noche: 1 }),
        await api.patch(`/api/tipos-habitacion/${tipoGeneral.id}`, { tarifa_noche: 1 }),
        await api.patch(`/api/tipos-habitacion/${tipoA.id}`, { sucursal_id: sedeB.id }),
        await api.patch(`/api/tipos-habitacion/${tipoB.id}`, { sucursal_id: sedeA.id }),
        await api.delete(`/api/tipos-habitacion/${tipoB.id}`),
        await api.post(`/api/tipos-habitacion/${tipoB.id}/imagen-presign`, { contentType: "image/jpeg" }),
        await api.delete(`/api/tipos-habitacion/${tipoGeneral.id}/imagen`),
      ]) {
        expect(res.status, JSON.stringify(res.body)).toBe(403);
      }
      expect(await TipoHabitacion.count({ where: { nombre: "Suite QA" } })).toBe(0);
      expect((await TipoHabitacion.findByPk(tipoA.id)).sucursal_id).toBe(sedeA.id);
      expect((await TipoHabitacion.findByPk(tipoB.id)).sucursal_id).toBe(sedeB.id);

      const propio = await api.post("/api/tipos-habitacion", { ...base, sucursal_id: sedeA.id });
      expect(propio.status, JSON.stringify(propio.body)).toBe(201);
      expect(propio.body.data.sucursal_id).toBe(sedeA.id);
      expect((await api.patch(`/api/tipos-habitacion/${tipoA.id}`, { tarifa_noche: 250 })).status).toBe(200);
    });

    it("una habitación no puede usar un tipo de otra sede (ni al crear ni al editar)", async () => {
      const admin = as((await createAuthenticatedUser({ rol: ROLES.ADMIN })).token);
      const crear = await admin.post("/api/habitaciones", { sucursal_id: sedeA.id, tipo_habitacion_id: tipoB.id, numero: "M-1" });
      expect(crear.status).toBe(409);
      expect(crear.body.code).toBe("TIPO_HABITACION_SEDE_MISMATCH");

      const hab = await createHabitacion({ sucursal_id: sedeA.id, tipo_habitacion_id: tipoA.id });
      expect((await admin.patch(`/api/habitaciones/${hab.id}`, { tipo_habitacion_id: tipoB.id })).status).toBe(409);
      expect((await admin.patch(`/api/habitaciones/${hab.id}`, { sucursal_id: sedeB.id })).status).toBe(409);
      expect((await admin.patch(`/api/habitaciones/${hab.id}`, { tipo_habitacion_id: tipoGeneral.id })).status).toBe(200);
      expect((await Habitacion.findByPk(hab.id)).sucursal_id).toBe(sedeA.id);

      // Mover de sede un tipo que usan habitaciones de otra sede
      const enUso = await admin.patch(`/api/tipos-habitacion/${tipoA.id}`, { sucursal_id: sedeB.id });
      expect(enUso.status).toBe(200); // ya no la usa ninguna habitación
      await Habitacion.update({ tipo_habitacion_id: tipoB.id }, { where: { id: hab.id }, hooks: false });
      const conflicto = await admin.patch(`/api/tipos-habitacion/${tipoB.id}`, { sucursal_id: sedeC.id });
      expect(conflicto.status).toBe(409);
      expect(conflicto.body.code).toBe("TIPO_HABITACION_SEDE_CONFLICT");
    });

    it("varias sedes, administrador, sin sede, cliente y anónimo", async () => {
      const multi = as((await personal(ROLES.RECEPCIONISTA, sedeA.id, [sedeB.id])).token);
      expect(ids(await multi.get("/api/tipos-habitacion"))).toEqual([tipoA.id, tipoB.id, tipoGeneral.id].sort((a, b) => a - b));

      const admin = as((await createAuthenticatedUser({ rol: ROLES.ADMIN })).token);
      expect((await admin.get("/api/tipos-habitacion")).body.data).toHaveLength(3);
      expect((await admin.patch(`/api/tipos-habitacion/${tipoGeneral.id}`, { tarifa_noche: 120 })).status).toBe(200);
      expect((await admin.post("/api/tipos-habitacion", { nombre: "General QA", capacidad_maxima: 2, tarifa_noche: 90 })).status).toBe(201);

      const sinSede = as((await personal(ROLES.RECEPCIONISTA)).token);
      const denegado = await sinSede.get("/api/tipos-habitacion");
      expect(denegado.status).toBe(403);
      expect(denegado.body.code).toBe("SEDE_NOT_ASSIGNED");
      expect((await sinSede.get(`/api/tipos-habitacion/${tipoGeneral.id}`)).status).toBe(403);

      // El cliente conserva la consulta de solo lectura que usa al reservar, pero no puede modificar
      const cliente = as((await createAuthenticatedUser({ rol: ROLES.CLIENTE })).token);
      expect((await cliente.get("/api/tipos-habitacion")).status).toBe(200);
      expect((await cliente.get(`/api/tipos-habitacion/${tipoB.id}`)).status).toBe(200);
      expect((await cliente.patch(`/api/tipos-habitacion/${tipoB.id}`, { tarifa_noche: 1 })).status).toBe(403);

      expect((await as().get("/api/tipos-habitacion")).status).toBe(401);
      expect((await request(app).get("/api/public/tipos-habitacion")).status).toBe(200);
    });
  });

  describe("Parqueos", () => {
    it("listado, detalle y filtro limitados a la sede del empleado", async () => {
      const api = as((await personal(ROLES.RECEPCIONISTA, sedeA.id)).token);
      expect(ids(await api.get("/api/parqueos"))).toEqual([parqueoA.id]);
      expect((await api.get(`/api/parqueos/${parqueoA.id}`)).status).toBe(200);
      const ajeno = await api.get(`/api/parqueos/${parqueoB.id}`);
      expect(ajeno.status).toBe(403);
      expect(ajeno.body.code).toBe("SEDE_NOT_AUTHORIZED");
      expect((await api.get(`/api/parqueos?sucursal_id=${sedeB.id}`)).status).toBe(403);
    });

    it("no puede crear, modificar, mover ni eliminar parqueos fuera de su sede", async () => {
      const api = as((await personal(ROLES.RECEPCIONISTA, sedeA.id)).token);
      for (const res of [
        await api.post("/api/parqueos", { sucursal_id: sedeB.id, numero: "X-1" }),
        await api.patch(`/api/parqueos/${parqueoB.id}`, { estado: "mantenimiento" }),
        await api.patch(`/api/parqueos/${parqueoA.id}`, { sucursal_id: sedeB.id }),
        await api.patch(`/api/parqueos/${parqueoB.id}`, { sucursal_id: sedeA.id }),
        await api.delete(`/api/parqueos/${parqueoB.id}`),
      ]) {
        expect(res.status, JSON.stringify(res.body)).toBe(403);
      }
      expect(await Parqueo.count({ where: { numero: "X-1" } })).toBe(0);
      expect((await Parqueo.findByPk(parqueoA.id)).sucursal_id).toBe(sedeA.id);
      expect((await Parqueo.findByPk(parqueoB.id)).estado).toBe("disponible");
      expect((await api.post("/api/parqueos", { sucursal_id: sedeA.id, numero: "A-9" })).status).toBe(201);
    });

    it("varias sedes, administrador, sin sede, cliente y anónimo", async () => {
      const multi = as((await personal(ROLES.GERENTE_HABITACIONES, sedeA.id, [sedeB.id])).token);
      expect(ids(await multi.get("/api/parqueos"))).toEqual([parqueoA.id, parqueoB.id].sort((a, b) => a - b));
      expect((await multi.get(`/api/parqueos/${parqueoC.id}`)).status).toBe(403);

      const admin = as((await createAuthenticatedUser({ rol: ROLES.ADMIN })).token);
      expect((await admin.get("/api/parqueos")).body.data).toHaveLength(3);
      expect((await admin.patch(`/api/parqueos/${parqueoC.id}`, { estado: "mantenimiento" })).status).toBe(200);

      const sinSede = await as((await personal(ROLES.RECEPCIONISTA)).token).get("/api/parqueos");
      expect(sinSede.status).toBe(403);
      expect(sinSede.body.code).toBe("SEDE_NOT_ASSIGNED");

      const cliente = as((await createAuthenticatedUser({ rol: ROLES.CLIENTE })).token);
      expect((await cliente.get(`/api/parqueos/${parqueoA.id}`)).status).toBe(403);
      expect((await as().get("/api/parqueos")).status).toBe(401);
    });
  });

  describe("Reservas de parqueo", () => {
    it("listado y detalle limitados a la sede; IDs ajenos → 403", async () => {
      const rA = await reservaParqueoEn(parqueoA.id);
      const rB = await reservaParqueoEn(parqueoB.id);
      const api = as((await personal(ROLES.RECEPCIONISTA, sedeA.id)).token);
      expect(ids(await api.get("/api/reservas-parqueo"))).toEqual([rA.id]);
      expect((await api.get(`/api/reservas-parqueo/${rA.id}`)).status).toBe(200);
      const ajena = await api.get(`/api/reservas-parqueo/${rB.id}`);
      expect(ajena.status).toBe(403);
      expect(ajena.body.code).toBe("SEDE_NOT_AUTHORIZED");
    });

    it("no puede crear, modificar, mover, vincular ni eliminar fuera de su sede", async () => {
      const rA = await reservaParqueoEn(parqueoA.id);
      const rB = await reservaParqueoEn(parqueoB.id);
      const api = as((await personal(ROLES.RECEPCIONISTA, sedeA.id)).token);

      // Reserva de habitación de otra sede para probar la referencia cruzada
      const habB = await createHabitacion({ sucursal_id: sedeB.id, tipo_habitacion_id: tipoB.id });
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const reservaHabB = await as(cliente.token).post("/api/reservas-habitacion", {
        habitacion_id: habB.id, fecha_entrada: futuro(40), fecha_salida: futuro(42), numero_huespedes: 1,
      });
      expect(reservaHabB.status, JSON.stringify(reservaHabB.body)).toBe(201);

      for (const res of [
        await api.post("/api/reservas-parqueo", { parqueo_id: parqueoB.id, fecha_entrada: futuro(50), fecha_salida: futuro(51) }),
        await api.post("/api/reservas-parqueo", { parqueo_id: parqueoA.id, reserva_habitacion_id: reservaHabB.body.data.id, fecha_entrada: futuro(50), fecha_salida: futuro(51) }),
        await api.patch(`/api/reservas-parqueo/${rB.id}`, { fecha_salida: futuro(25) }),
        await api.patch(`/api/reservas-parqueo/${rA.id}`, { parqueo_id: parqueoB.id }),
        await api.patch(`/api/reservas-parqueo/${rA.id}`, { reserva_habitacion_id: reservaHabB.body.data.id }),
        await api.delete(`/api/reservas-parqueo/${rB.id}`),
      ]) {
        expect(res.status, JSON.stringify(res.body)).toBe(403);
      }
      expect(await ReservaParqueo.count({ where: { parqueo_id: parqueoB.id } })).toBe(1);
      const intacta = await ReservaParqueo.findByPk(rA.id);
      expect(intacta.parqueo_id).toBe(parqueoA.id);
      expect(intacta.reserva_habitacion_id).toBeNull();

      const propia = await api.post("/api/reservas-parqueo", { parqueo_id: parqueoA.id, fecha_entrada: futuro(60), fecha_salida: futuro(61) });
      expect(propia.status, JSON.stringify(propia.body)).toBe(201);
    });

    it("varias sedes, administrador, sin sede, cliente y anónimo", async () => {
      const rA = await reservaParqueoEn(parqueoA.id);
      const rB = await reservaParqueoEn(parqueoB.id, 30);
      const rC = await reservaParqueoEn(parqueoC.id);

      const multi = as((await personal(ROLES.RECEPCIONISTA, sedeA.id, [sedeB.id])).token);
      expect(ids(await multi.get("/api/reservas-parqueo"))).toEqual([rA.id, rB.id].sort((a, b) => a - b));
      expect((await multi.get(`/api/reservas-parqueo/${rC.id}`)).status).toBe(403);
      expect((await multi.patch(`/api/reservas-parqueo/${rA.id}`, { parqueo_id: parqueoB.id })).status).toBe(200);

      const admin = as((await createAuthenticatedUser({ rol: ROLES.ADMIN })).token);
      expect((await admin.get("/api/reservas-parqueo")).body.data).toHaveLength(3);
      expect((await admin.get(`/api/reservas-parqueo/${rC.id}`)).status).toBe(200);

      const sinSede = as((await personal(ROLES.GERENTE_HABITACIONES)).token);
      expect((await sinSede.get("/api/reservas-parqueo")).body.code).toBe("SEDE_NOT_ASSIGNED");
      expect((await sinSede.get(`/api/reservas-parqueo/${rA.id}`)).status).toBe(403);

      const cliente = as((await createAuthenticatedUser({ rol: ROLES.CLIENTE })).token);
      expect((await cliente.get("/api/reservas-parqueo")).status).toBe(403);
      expect((await as().get(`/api/reservas-parqueo/${rA.id}`)).status).toBe(401);
    });
  });

  describe("Coherencia parqueo ↔ reserva de habitación", () => {
    it("ni siquiera el administrador puede vincular un parqueo con una estancia de otra sede", async () => {
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const habA = await createHabitacion({ sucursal_id: sedeA.id, tipo_habitacion_id: tipoA.id });
      const habB = await createHabitacion({ sucursal_id: sedeB.id, tipo_habitacion_id: tipoB.id });
      const reservar = async (habitacion_id: number) => {
        const res = await as(cliente.token).post("/api/reservas-habitacion", {
          habitacion_id, fecha_entrada: futuro(70), fecha_salida: futuro(72), numero_huespedes: 1,
        });
        expect(res.status, JSON.stringify(res.body)).toBe(201);
        return res.body.data.id;
      };
      const estanciaA = await reservar(habA.id);
      const estanciaB = await reservar(habB.id);
      const admin = as((await createAuthenticatedUser({ rol: ROLES.ADMIN })).token);
      const fechas = { fecha_entrada: futuro(70), fecha_salida: futuro(72) };

      const cruzada = await admin.post("/api/reservas-parqueo", { parqueo_id: parqueoA.id, reserva_habitacion_id: estanciaB, ...fechas });
      expect(cruzada.status).toBe(409);
      expect(cruzada.body.code).toBe("PARQUEO_SEDE_MISMATCH");
      expect(await ReservaParqueo.count()).toBe(0);

      const valida = await admin.post("/api/reservas-parqueo", { parqueo_id: parqueoA.id, reserva_habitacion_id: estanciaA, ...fechas });
      expect(valida.status, JSON.stringify(valida.body)).toBe(201);
      const id = valida.body.data.id;

      // Modificación: cambiar la estancia o el parqueo rompiendo la coherencia
      expect((await admin.patch(`/api/reservas-parqueo/${id}`, { reserva_habitacion_id: estanciaB })).body.code).toBe("PARQUEO_SEDE_MISMATCH");
      expect((await admin.patch(`/api/reservas-parqueo/${id}`, { parqueo_id: parqueoB.id })).body.code).toBe("PARQUEO_SEDE_MISMATCH");
      // Cambiar ambos de forma coherente sí se permite, y desvincular también
      expect((await admin.patch(`/api/reservas-parqueo/${id}`, { parqueo_id: parqueoB.id, reserva_habitacion_id: estanciaB })).status).toBe(200);
      expect((await admin.patch(`/api/reservas-parqueo/${id}`, { reserva_habitacion_id: null })).status).toBe(200);
    });
  });
});
