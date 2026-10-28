import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { createHotelFixture } from "../fixtures/hotel";

const db = require("../../src/models");
const { Pago } = db;

/**
 * Exposición de pagos: un cliente nunca puede consultar pagos, resúmenes ni
 * intentos de pago de reservas que no le pertenecen, aunque conozca los IDs.
 */
describe("Pagos ajenos · acceso HTTP directo", () => {
  it("cliente B no ve ni verifica pagos de cliente A; A y el administrador sí", async () => {
    const hotel = await createHotelFixture();
    const clienteA = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const clienteB = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });

    const reserva = await request(app)
      .post("/api/reservas-habitacion")
      .set("Authorization", `Bearer ${clienteA.token}`)
      .send({ habitacion_id: hotel.habitacion.id, fecha_entrada: "2027-11-10", fecha_salida: "2027-11-12", numero_huespedes: 1 });
    expect(reserva.status, JSON.stringify(reserva.body)).toBe(201);
    const reservaId = reserva.body.data.id;
    const pago = await Pago.create({ reserva_habitacion_id: reservaId, monto: "50.00", metodo: "transferencia", estado: "pendiente" });

    const get = (token: string | null, url: string) => {
      const r = request(app).get(url);
      return token ? r.set("Authorization", `Bearer ${token}`) : r;
    };

    // Cliente ajeno
    const lista = await get(clienteB.token, "/api/pagos");
    expect(lista.status).toBe(200);
    expect(lista.body.data).toEqual([]);
    const filtrada = await get(clienteB.token, `/api/pagos?reserva_habitacion_id=${reservaId}`);
    expect(filtrada.body.data).toEqual([]);
    // El detalle ajeno responde 404 a propósito (no revela si el pago existe).
    const detalle = await get(clienteB.token, `/api/pagos/${pago.id}`);
    expect(detalle.status).toBe(404);
    expect(detalle.body.data).toBeUndefined();
    expect((await get(clienteB.token, `/api/pagos/resumen?reserva_habitacion_id=${reservaId}`)).status).toBe(403);
    expect((await get(clienteB.token, `/api/pagos/intento-activo?reserva_habitacion_id=${reservaId}`)).status).toBe(403);
    const verificar = await request(app).post(`/api/pagos/${pago.id}/verificar`).set("Authorization", `Bearer ${clienteB.token}`).send({});
    expect(verificar.status).toBe(404);
    expect((await Pago.findByPk(pago.id)).estado).toBe("pendiente");

    // Propietario y administrador
    expect((await get(clienteA.token, "/api/pagos")).body.data.map((p: any) => p.id)).toEqual([pago.id]);
    expect((await get(clienteA.token, `/api/pagos/${pago.id}`)).status).toBe(200);
    expect((await get(admin.token, `/api/pagos/${pago.id}`)).status).toBe(200);

    // Anónimo
    expect((await get(null, "/api/pagos")).status).toBe(401);
    expect((await get(null, `/api/pagos/${pago.id}`)).status).toBe(401);
  });
});
