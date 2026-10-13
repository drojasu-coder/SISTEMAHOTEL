import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createIsolatedTestDatabase, TestDatabase } from "./testDatabase";
import { ROLES } from "../../src/constants/roles";

describe("isolated PostgreSQL cart and payment baseline", () => {
  let database: TestDatabase;
  let paymentService: typeof import("../../src/services/pago.service");
  let ownerId: number;
  let otherUserId: number;
  let paymentId: number;

  beforeAll(async () => {
    database = await createIsolatedTestDatabase();
    paymentService = await import("../../src/services/pago.service");

    const owner = await database.Usuario.create({
      nombre: "Dueño carrito",
      email: `owner-${Date.now()}@example.com`,
      password_hash: "not-used",
      rol: ROLES.CLIENTE,
      activo: true,
    });
    const other = await database.Usuario.create({
      nombre: "Otro usuario",
      email: `other-${Date.now()}@example.com`,
      password_hash: "not-used",
      rol: ROLES.CLIENTE,
      activo: true,
    });
    ownerId = owner.id;
    otherUserId = other.id;

    const cart = await database.Carrito.create({
      usuario_id: ownerId,
      estado: "activo",
      expira_en: new Date(Date.now() + 60 * 60 * 1000),
    });
    const payment = await database.Pago.create({
      carrito_id: cart.id,
      reserva_habitacion_id: null,
      monto: 100,
      metodo: "efectivo",
      estado: "aprobado",
      moneda: "GTQ",
      tipo_pago: "total",
      idempotency_key: `payment-${Date.now()}`,
    });
    paymentId = payment.id;
  });

  afterAll(async () => {
    if (paymentId) {
      await database.Pago.destroy({ where: { id: paymentId }, force: true });
    }
    if (ownerId) {
      const cart = await database.Carrito.findOne({ where: { usuario_id: ownerId } });
      if (cart) await database.Carrito.destroy({ where: { id: cart.id }, force: true });
      await database.Usuario.destroy({ where: { id: ownerId }, force: true });
    }
    if (otherUserId) {
      await database.Usuario.destroy({ where: { id: otherUserId }, force: true });
    }
    await database.sequelize.close();
  });

  it("persists a cart-linked payment and enforces ownership", async () => {
    const ownPayment = await paymentService.getPagoById(paymentId, {
      id: ownerId,
      rol: ROLES.CLIENTE,
    });
    expect(ownPayment.id).toBe(paymentId);

    await expect(paymentService.getPagoById(paymentId, {
      id: otherUserId,
      rol: ROLES.CLIENTE,
    })).rejects.toMatchObject({
      statusCode: 404,
      code: "PAYMENT_NOT_FOUND",
    });
  });

  it("enforces the database idempotency index", async () => {
    const payment = await database.Pago.findByPk(paymentId);
    await expect(database.Pago.create({
      carrito_id: payment.carrito_id,
      reserva_habitacion_id: null,
      monto: 50,
      metodo: "efectivo",
      estado: "pendiente",
      moneda: "GTQ",
      tipo_pago: "total",
      idempotency_key: payment.idempotency_key,
    })).rejects.toThrow();
  });
});
