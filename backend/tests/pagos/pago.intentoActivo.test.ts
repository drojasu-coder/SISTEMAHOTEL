import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { stripeService } from "../../src/services/stripe.service";
import { createAuthenticatedUser } from "../helpers/auth";
import { createRecursoActividad } from "../fixtures/actividades";
import { ROLES } from "../../src/constants/roles";

const db = require("../../src/models");
const { Carrito, Pago, CarritoItem, ReservaActividad } = db;

describe("GET /api/pagos/intento-activo y recuperación de pagos (BE-014)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  let sequence = 0;
  const setupCartWithItem = async () => {
    sequence += 1;
    const clientEmail = `qa-intento-activo-${sequence}-${Date.now()}@hotel.test`;
    const user = await createAuthenticatedUser({
      rol: ROLES.CLIENTE,
      email: clientEmail,
    });
    const recurso = await createRecursoActividad({
      nombre: `Recurso QA Intento Activo ${sequence}`,
      precio_hora: "300.00",
    });
    const reserva = await ReservaActividad.create({
      usuario_id: user.usuario.id,
      recurso_id: recurso.id,
      fecha: "2027-08-10",
      hora_inicio: "10:00:00",
      hora_fin: "11:00:00",
      total: "300.00",
      estado: "confirmada",
    });
    const carrito = await Carrito.create({
      usuario_id: user.usuario.id,
      estado: "activo",
      expira_en: new Date(Date.now() + 30 * 60 * 1000),
    });
    await CarritoItem.create({
      carrito_id: carrito.id,
      tipo_item: "actividad",
      referencia_id: reserva.id,
      precio: "300.00",
      cantidad: 1,
    });
    return { user, carrito, reserva };
  };

  it("1. enrutamiento estricto: /intento-activo se evalúa antes de /:id sin error numérico 400", async () => {
    const { user, carrito } = await setupCartWithItem();

    const response = await request(app)
      .get("/api/pagos/intento-activo")
      .set("Authorization", `Bearer ${user.token}`)
      .query({ carrito_id: carrito.id });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeNull();
  });

  it("2. devuelve null cuando no existe ningún intento en proceso para el carrito", async () => {
    const { user, carrito } = await setupCartWithItem();

    const response = await request(app)
      .get("/api/pagos/intento-activo")
      .set("Authorization", `Bearer ${user.token}`)
      .query({ carrito_id: carrito.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
  });

  it("3. recupera un intento activo en Stripe (requires_payment_method) y devuelve client_secret", async () => {
    const { user, carrito } = await setupCartWithItem();

    await Pago.create({
      carrito_id: carrito.id,
      monto: 300,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "procesando",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_recovery_001",
    });

    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_recovery_001",
      status: "requires_payment_method",
      client_secret: "pi_test_recovery_001_secret_abc",
    } as any);

    const response = await request(app)
      .get("/api/pagos/intento-activo")
      .set("Authorization", `Bearer ${user.token}`)
      .query({ carrito_id: carrito.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      pago_id: expect.any(Number),
      payment_intent_id: "pi_test_recovery_001",
      client_secret: "pi_test_recovery_001_secret_abc",
      estado_local: "procesando",
      estado_pasarela: "requires_payment_method",
      estado_intento: "requiere_confirmacion",
      monto: 300,
      moneda: "GTQ",
      puede_confirmar: true,
    });
  });

  it("4. recupera el intento si el estado local es rechazado pero en Stripe aún requiere confirmación", async () => {
    const { user, carrito } = await setupCartWithItem();

    await Pago.create({
      carrito_id: carrito.id,
      monto: 300,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "rechazado",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_declined_retry",
    });

    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_declined_retry",
      status: "requires_payment_method",
      client_secret: "pi_test_secret_fresh",
    } as any);

    const response = await request(app)
      .get("/api/pagos/intento-activo")
      .set("Authorization", `Bearer ${user.token}`)
      .query({ carrito_id: carrito.id });

    expect(response.status).toBe(200);
    expect(response.body.data.estado_local).toBe("rechazado");
    expect(response.body.data.estado_pasarela).toBe("requires_payment_method");
    expect(response.body.data.estado_intento).toBe("requiere_confirmacion");
    expect(response.body.data.puede_confirmar).toBe(true);
    expect(response.body.data.client_secret).toBe("pi_test_secret_fresh");
  });

  it("5. distingue pagos sin identificador externo sin reportar ausencia de intento (data no es null)", async () => {
    const { user, carrito } = await setupCartWithItem();

    await Pago.create({
      carrito_id: carrito.id,
      monto: 300,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "procesando",
      pasarela: "stripe",
      id_transaccion_externo: null,
    });

    const response = await request(app)
      .get("/api/pagos/intento-activo")
      .set("Authorization", `Bearer ${user.token}`)
      .query({ carrito_id: carrito.id });

    expect(response.status).toBe(200);
    expect(response.body.data).not.toBeNull();
    expect(response.body.data).toEqual({
      pago_id: expect.any(Number),
      payment_intent_id: null,
      client_secret: null,
      estado_local: "procesando",
      estado_pasarela: "sin_identificador",
      estado_intento: "procesando",
      monto: 300,
      moneda: "GTQ",
      puede_confirmar: false,
    });
  });

  it("6. maneja estados externos no previstos asignando procesando y sin client_secret", async () => {
    const { user, carrito } = await setupCartWithItem();

    await Pago.create({
      carrito_id: carrito.id,
      monto: 300,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "procesando",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_custom_state",
    });

    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_custom_state",
      status: "requires_capture",
      client_secret: "pi_secret_capture",
    } as any);

    const response = await request(app)
      .get("/api/pagos/intento-activo")
      .set("Authorization", `Bearer ${user.token}`)
      .query({ carrito_id: carrito.id });

    expect(response.status).toBe(200);
    expect(response.body.data.estado_pasarela).toBe("requires_capture");
    expect(response.body.data.estado_intento).toBe("procesando");
    expect(response.body.data.puede_confirmar).toBe(false);
    expect(response.body.data.client_secret).toBeNull();
  });

  it("7. reconciliación en POST: si Stripe informa canceled pero local sigue en procesando, libera el bloqueo y permite nuevo pago", async () => {
    const { user, carrito } = await setupCartWithItem();

    const pagoViejo = await Pago.create({
      carrito_id: carrito.id,
      monto: 300,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "procesando",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_canceled_stripe",
    });

    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_canceled_stripe",
      status: "canceled",
    } as any);

    vi.spyOn(stripeService, "createPaymentIntent").mockImplementation(async (amount, currency, metadata) => ({
      id: "pi_test_new_successful",
      client_secret: "pi_test_new_secret",
      status: "requires_payment_method",
      amount: Math.round(Number(amount) * 100),
      currency: String(currency).toLowerCase(),
      metadata: { ...metadata },
    } as any));

    const postResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 300,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: "key-fresh-after-cancel",
      });

    expect(postResponse.status).toBe(201);
    expect(postResponse.body.data.payment_intent_id).toBe("pi_test_new_successful");

    await pagoViejo.reload();
    expect(pagoViejo.estado).toBe("cancelado");
  });

  it("8. concurrencia con claves distintas: 20 peticiones concurrentes para el mismo carrito no crean cobros duplicados incompatibles", async () => {
    const { user, carrito } = await setupCartWithItem();

    let createCallCount = 0;
    vi.spyOn(stripeService, "createPaymentIntent").mockImplementation(async (amount, currency, metadata) => {
      createCallCount++;
      return {
        id: `pi_distinct_${createCallCount}`,
        client_secret: `secret_distinct_${createCallCount}`,
        status: "requires_payment_method",
        amount: Math.round(Number(amount) * 100),
        currency: String(currency).toLowerCase(),
        metadata: { ...metadata },
      } as any;
    });

    const responses = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post("/api/pagos")
          .set("Authorization", `Bearer ${user.token}`)
          .send({
            carrito_id: carrito.id,
            monto: 300,
            metodo: "tarjeta",
            tipo_pago: "total",
            moneda: "GTQ",
            idempotency_key: `key-distinct-${i}`,
          })
      )
    );

    const successful = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    expect(successful).toHaveLength(1);
    expect(conflicts).toHaveLength(19);

    for (const conflict of conflicts) {
      expect(conflict.body.code).toBe("PAYMENT_EXCEEDS_BALANCE");
    }

    const createdPayments = await Pago.findAll({
      where: { carrito_id: carrito.id, estado: "procesando" },
    });
    expect(createdPayments).toHaveLength(1);
    expect(createCallCount).toBe(1);
  });
  it("9. un intento recuperable rechazado no permite crear otro cobro incompatible en POST /api/pagos", async () => {
    const { user, carrito } = await setupCartWithItem();

    await Pago.create({
      carrito_id: carrito.id,
      monto: 300,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "rechazado",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_declined_still_active",
    });

    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_declined_still_active",
      status: "requires_payment_method",
      client_secret: "pi_secret_fresh",
    } as any);

    const postResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 300,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: "key-attempting-duplicate",
      });

    expect(postResponse.status).toBe(409);
    expect(postResponse.body.code).toBe("PAYMENT_EXCEEDS_BALANCE");
  });

  it("10. la reconciliación de cancelaciones conserva las aprobaciones concurrentes", async () => {
    const { user, carrito } = await setupCartWithItem();

    const pagoAprobadoConcurrente = await Pago.create({
      carrito_id: carrito.id,
      monto: 150,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "aprobado",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_concurrent_approved",
    });

    const pagoCancelado = await Pago.create({
      carrito_id: carrito.id,
      monto: 150,
      metodo: "tarjeta",
      tipo_pago: "total",
      moneda: "GTQ",
      estado: "procesando",
      pasarela: "stripe",
      id_transaccion_externo: "pi_test_to_cancel",
    });

    vi.spyOn(stripeService, "retrievePaymentIntent").mockResolvedValueOnce({
      id: "pi_test_to_cancel",
      status: "canceled",
    } as any);

    vi.spyOn(stripeService, "createPaymentIntent").mockImplementation(async (amount, currency, metadata) => ({
      id: "pi_test_new_intent",
      client_secret: "pi_test_new_secret",
      status: "requires_payment_method",
      amount: Math.round(Number(amount) * 100),
      currency: String(currency).toLowerCase(),
      metadata: { ...metadata },
    } as any));

    const postResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        carrito_id: carrito.id,
        monto: 150,
        metodo: "tarjeta",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: "key-preserving-concurrent-approval",
      });

    expect(postResponse.status).toBe(201);
    await pagoAprobadoConcurrente.reload();
    expect(pagoAprobadoConcurrente.estado).toBe("aprobado");
    await pagoCancelado.reload();
    expect(pagoCancelado.estado).toBe("cancelado");
  });
});
