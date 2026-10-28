import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { stripeService } from "../../src/services/stripe.service";
import { processStripeWebhook } from "../../src/services/pago.service";
import { createAuthenticatedUser } from "../helpers/auth";
import { createHotelFixture } from "../fixtures/hotel";
import { ROLES } from "../../src/constants/roles";

const { ReservaHabitacion, Carrito, CarritoItem, Pago } = require("../../src/models");

async function setup() {
  const user = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
  const hotel = await createHotelFixture({ tarifa: 100 });
  const reservation = await ReservaHabitacion.create({ usuario_id: user.usuario.id, habitacion_id: hotel.habitacion.id, fecha_entrada: "2030-08-10", fecha_salida: "2030-08-12", numero_huespedes: 2, estado: "pendiente", total: 200 });
  const cart = await Carrito.create({ usuario_id: user.usuario.id, estado: "activo", expira_en: new Date(Date.now() + 900000) });
  await CarritoItem.create({ carrito_id: cart.id, tipo_item: "habitacion", referencia_id: reservation.id, precio: 200, cantidad: 1 });
  const payment = await Pago.create({ carrito_id: cart.id, monto: 200, moneda: "GTQ", metodo: "tarjeta", pasarela: "stripe", tipo_pago: "total", estado: "procesando", id_transaccion_externo: "pi_verified_qa" });
  const intent = { id: "pi_verified_qa", status: "succeeded", amount: 20000, amount_received: 20000, currency: "gtq", livemode: false, metadata: { pago_id: String(payment.id), carrito_id: String(cart.id), tipo_pago: "total" } };
  const retrieve = vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValue(intent as any);
  const create = vi.spyOn(stripeService, "createPaymentIntent");
  const verify = (body: object = {}) => request(app).post(`/api/pagos/${payment.id}/verificar`).set("Authorization", `Bearer ${user.token}`).send(body);
  return { user, reservation, cart, payment, intent, retrieve, create, verify };
}

describe("POST /api/pagos/:id/verificar: confirmación desde Stripe", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("persiste la aprobación real y confirma reserva y carrito sin crear otro pago", async () => {
    const { verify, payment, reservation, cart, retrieve, create } = await setup();
    const response = await verify();
    expect(response.status).toBe(200);
    expect(response.body.data.estado).toBe("aprobado");
    await Promise.all([payment.reload(), reservation.reload(), cart.reload()]);
    expect(payment.estado).toBe("aprobado"); expect(payment.fecha_pago).not.toBeNull();
    expect(reservation.estado).toBe("confirmada"); expect(cart.estado).toBe("pagado");
    expect(await Pago.count({ where: { carrito_id: cart.id } })).toBe(1);
    expect(retrieve).toHaveBeenCalledWith("pi_verified_qa"); expect(create).not.toHaveBeenCalled();
  });

  it("rechaza estado/importes del navegador antes de consultar Stripe", async () => {
    const { verify, retrieve, payment } = await setup();
    const response = await verify({ estado: "aprobado", monto: 1 });
    expect(response.status).toBe(400); expect(retrieve).not.toHaveBeenCalled();
    await payment.reload(); expect(payment.estado).toBe("procesando");
  });

  it("exige JWT, ID válido y propiedad antes de llamar a Stripe", async () => {
    const { payment, retrieve } = await setup();
    expect((await request(app).post(`/api/pagos/${payment.id}/verificar`).send({})).status).toBe(401);
    const other = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    for (const id of [String(payment.id), "99999999", "incorrecto"]) {
      const response = await request(app).post(`/api/pagos/${id}/verificar`).set("Authorization", `Bearer ${other.token}`).send({});
      expect(response.status).toBe(id === "incorrecto" ? 400 : 404);
    }
    expect(retrieve).not.toHaveBeenCalled();
  });

  it.each(["processing", "requires_payment_method", "requires_action"])("no aprueba un intento %s", async (status) => {
    const { verify, intent, payment, reservation } = await setup();
    intent.status = status;
    expect((await verify()).status).toBe(200);
    await Promise.all([payment.reload(), reservation.reload()]);
    expect(payment.estado).toBe("procesando"); expect(reservation.estado).toBe("pendiente");
  });

  it.each(["amount", "currency", "metadata", "id", "amount_received", "livemode"])("no acepta discrepancias en %s", async (field) => {
    const { verify, intent, payment, reservation } = await setup();
    Object.assign(intent, { [field]: ({ amount: 100, currency: "usd", metadata: { pago_id: "99999" }, id: "pi_other", amount_received: 0, livemode: true } as Record<string, unknown>)[field] });
    expect((await verify()).status).toBe(409);
    await Promise.all([payment.reload(), reservation.reload()]);
    expect(payment.estado).toBe("procesando"); expect(reservation.estado).toBe("pendiente");
  });

  it("conserva el resultado incierto si Stripe falla", async () => {
    const { verify, retrieve, payment } = await setup();
    retrieve.mockRejectedValue(new Error("network"));
    const response = await verify();
    expect(response.status).toBe(502); expect(response.body.code).toBe("STRIPE_RETRIEVAL_FAILED");
    await payment.reload(); expect(payment.estado).toBe("procesando");
  });

  it("20 verificaciones y el webhook concurrentes persisten una sola aprobación", async () => {
    const { verify, intent, payment, reservation, cart, create } = await setup();
    const results = await Promise.all([...Array.from({ length: 20 }, () => verify()), processStripeWebhook(intent, "payment_intent.succeeded")]);
    for (const response of results.slice(0, 20)) expect(response.status).toBe(200);
    await Promise.all([payment.reload(), reservation.reload(), cart.reload()]);
    expect(payment.estado).toBe("aprobado"); expect(reservation.estado).toBe("confirmada"); expect(cart.estado).toBe("pagado");
    expect(await Pago.count({ where: { carrito_id: cart.id } })).toBe(1); expect(create).not.toHaveBeenCalled();
  });
});
