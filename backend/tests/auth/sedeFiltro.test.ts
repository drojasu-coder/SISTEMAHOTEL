import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { assignEmpleadoSede, createHabitacion, createSucursal, createTipoHabitacion } from "../fixtures/hotel";
import { createReservaMesaFixture } from "../fixtures/restaurante";

const db = require("../../src/models");
const { Mesa } = db;

/**
 * El filtro `?sucursal_id=` de los listados administrativos se aplica en el
 * servidor, no se ignora en silencio y nunca amplía el alcance autorizado.
 */
describe("Filtro de sede en listados administrativos", () => {
  let sedeA: any, sedeB: any, cliente: any, rA: number, rB: number;

  const get = (token: string | null, url: string) => {
    const r = request(app).get(url);
    return token ? r.set("Authorization", `Bearer ${token}`) : r;
  };
  const ids = (res: request.Response) => res.body.data.map((x: any) => x.id).sort((a: number, b: number) => a - b);

  beforeEach(async () => {
    [sedeA, sedeB] = [await createSucursal(), await createSucursal()];
    const tipo = await createTipoHabitacion();
    const habA = await createHabitacion({ sucursal_id: sedeA.id, tipo_habitacion_id: tipo.id });
    const habB = await createHabitacion({ sucursal_id: sedeB.id, tipo_habitacion_id: tipo.id });
    cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const reservar = async (habitacion_id: number) => {
      const res = await request(app).post("/api/reservas-habitacion").set("Authorization", `Bearer ${cliente.token}`)
        .send({ habitacion_id, fecha_entrada: "2027-10-01", fecha_salida: "2027-10-03", numero_huespedes: 1 });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      return res.body.data.id;
    };
    rA = await reservar(habA.id);
    rB = await reservar(habB.id);
  });

  describe("GET /api/reservas-habitacion", () => {
    it("administrador: todas las sedes o una concreta", async () => {
      const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
      expect(ids(await get(admin.token, "/api/reservas-habitacion"))).toEqual([rA, rB].sort((a, b) => a - b));
      expect(ids(await get(admin.token, `/api/reservas-habitacion?sucursal_id=${sedeA.id}`))).toEqual([rA]);
      expect(ids(await get(admin.token, `/api/reservas-habitacion?sucursal_id=${sedeB.id}`))).toEqual([rB]);
    });

    it("empleado: su sede sí, otra sede → 403; valor inválido → 400", async () => {
      const emp = await createAuthenticatedUser({ rol: ROLES.RECEPCIONISTA });
      await assignEmpleadoSede(emp.usuario.id, sedeA.id);
      expect(ids(await get(emp.token, `/api/reservas-habitacion?sucursal_id=${sedeA.id}`))).toEqual([rA]);
      const ajena = await get(emp.token, `/api/reservas-habitacion?sucursal_id=${sedeB.id}`);
      expect(ajena.status).toBe(403);
      expect(ajena.body.code).toBe("SEDE_NOT_AUTHORIZED");
      for (const valor of ["abc", "0", "-1", "1.5"]) {
        const res = await get(emp.token, `/api/reservas-habitacion?sucursal_id=${valor}`);
        expect(res.status, valor).toBe(400);
      }
    });

    it("cliente: el filtro solo acota sus propias reservas; anónimo → 401", async () => {
      expect(ids(await get(cliente.token, `/api/reservas-habitacion?sucursal_id=${sedeB.id}`))).toEqual([rB]);
      const otro = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      expect((await get(otro.token, `/api/reservas-habitacion?sucursal_id=${sedeA.id}`)).body.data).toEqual([]);
      expect((await get(null, `/api/reservas-habitacion?sucursal_id=${sedeA.id}`)).status).toBe(401);
    });
  });

  describe("GET /api/reservas-mesa (administrador)", () => {
    it("filtra por la sede de la mesa, rechaza valores inválidos y no lo permite a clientes", async () => {
      const mesaA = await Mesa.create({ sucursal_id: sedeA.id, zona: "A", capacidad: 4, estado: "disponible" });
      const mesaB = await Mesa.create({ sucursal_id: sedeB.id, zona: "B", capacidad: 4, estado: "disponible" });
      const mA = await createReservaMesaFixture({ usuario_id: cliente.usuario.id, mesa_id: mesaA.id });
      const mB = await createReservaMesaFixture({ usuario_id: cliente.usuario.id, mesa_id: mesaB.id });
      const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });

      expect(ids(await get(admin.token, "/api/reservas-mesa"))).toEqual([mA.id, mB.id].sort((a, b) => a - b));
      expect(ids(await get(admin.token, `/api/reservas-mesa?sucursal_id=${sedeA.id}`))).toEqual([mA.id]);
      expect(ids(await get(admin.token, `/api/reservas-mesa?sucursal_id=${sedeB.id}`))).toEqual([mB.id]);
      expect((await get(admin.token, "/api/reservas-mesa?sucursal_id=x")).status).toBe(400);
      expect((await get(cliente.token, `/api/reservas-mesa?sucursal_id=${sedeA.id}`)).status).toBe(403);
      expect((await get(null, "/api/reservas-mesa")).status).toBe(401);
    });
  });

  it("habitaciones y parqueos: sucursal_id inválido ya no se ignora (400)", async () => {
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    for (const url of ["/api/habitaciones?sucursal_id=abc", "/api/parqueos?sucursal_id=0", "/api/tipos-habitacion?sucursal_id=-2"]) {
      expect((await get(admin.token, url)).status, url).toBe(400);
    }
    const filtradas = await get(admin.token, `/api/habitaciones?sucursal_id=${sedeA.id}`);
    expect(filtradas.body.data.every((h: any) => h.sucursal_id === sedeA.id)).toBe(true);
  });
});
