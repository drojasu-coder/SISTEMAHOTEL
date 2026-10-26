import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const stripeGuard = vi.hoisted(() => {
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en QA-SPA-FIN-CANDIDATE-050`,
      );
    });

  return {
    toStripeAmount: forbidden("toStripeAmount"),
    createPaymentIntent: forbidden("createPaymentIntent"),
    updatePaymentIntentMetadata: forbidden("updatePaymentIntentMetadata"),
    retrievePaymentIntent: forbidden("retrievePaymentIntent"),
    cancelPaymentIntent: forbidden("cancelPaymentIntent"),
    createRefund: forbidden("createRefund"),
    constructEvent: forbidden("constructEvent"),
  };
});

/**
 * FULL FORBIDDEN MOCK: este escenario usa únicamente efectivo. Cualquier uso
 * de Stripe falla inmediatamente; no se carga el SDK ni se permite red/cargos.
 */
vi.mock("../../src/services/stripe.service", () => ({
  toStripeAmount: stripeGuard.toStripeAmount,
  stripeService: {
    createPaymentIntent: stripeGuard.createPaymentIntent,
    updatePaymentIntentMetadata: stripeGuard.updatePaymentIntentMetadata,
    retrievePaymentIntent: stripeGuard.retrievePaymentIntent,
    cancelPaymentIntent: stripeGuard.cancelPaymentIntent,
    createRefund: stripeGuard.createRefund,
    constructEvent: stripeGuard.constructEvent,
  },
}));

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { wellnessFinancialExposure } from "../../src/services/pago.service";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-SPA-FIN-CANDIDATE-050: rechaza eliminar un item que reasigna pago aprobado entre citas";

interface CartRow {
  id: number;
  usuario_id: number;
  estado: string;
}

interface ItemRow {
  id: number;
  carrito_id: number;
  tipo_item: string;
  referencia_id: number;
  descripcion: string;
  precio: string;
  cantidad: number;
}

interface PaymentRow {
  id: number;
  carrito_id: number;
  monto: string;
  metodo: string;
  tipo_pago: string;
  estado: string;
  moneda: string;
  pasarela: string | null;
  id_transaccion_externo: string | null;
}

interface CitaRow {
  id: number;
  usuario_id: number;
  terapeuta_id: number;
  servicio_bienestar_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  obligacion: string;
}

const futureHotelDate = (days: number) => {
  const timeZone = process.env.APP_TIMEZONE || "America/Guatemala";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  const date = new Date(
    Date.UTC(part("year"), part("month") - 1, part("day") + days),
  );
  return date.toISOString().slice(0, 10);
};

const persistedSnapshot = async (cartId: number, citaIds: number[]) => {
  const carts = (await sequelize.query(
    `
      SELECT id, usuario_id, estado
      FROM carritos
      WHERE id = :cartId;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as CartRow[];
  const items = (await sequelize.query(
    `
      SELECT
        id,
        carrito_id,
        tipo_item,
        referencia_id,
        descripcion,
        precio::numeric(10, 2)::text AS precio,
        cantidad
      FROM carrito_items
      WHERE carrito_id = :cartId
      ORDER BY id ASC;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as ItemRow[];
  const payments = (await sequelize.query(
    `
      SELECT
        id,
        carrito_id,
        monto::numeric(10, 2)::text AS monto,
        metodo,
        tipo_pago,
        estado,
        moneda,
        pasarela,
        id_transaccion_externo
      FROM pagos
      WHERE carrito_id = :cartId
      ORDER BY id ASC;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as PaymentRow[];
  const citas = (await sequelize.query(
    `
      SELECT
        cb.id,
        cb.usuario_id,
        cb.terapeuta_id,
        cb.servicio_bienestar_id,
        cb.fecha::text AS fecha,
        cb.hora_inicio::text AS hora_inicio,
        cb.hora_fin::text AS hora_fin,
        cb.estado,
        sb.precio::numeric(10, 2)::text AS obligacion
      FROM citas_bienestar cb
      INNER JOIN servicios_bienestar sb
        ON sb.id = cb.servicio_bienestar_id
      WHERE cb.id IN (:citaIds)
      ORDER BY cb.id ASC;
    `,
    { replacements: { citaIds }, type: QueryTypes.SELECT },
  )) as CitaRow[];
  const refundCounts = (await sequelize.query(
    `
      SELECT COUNT(*)::integer AS count
      FROM reembolsos r
      INNER JOIN pagos p ON p.id = r.pago_id
      WHERE p.carrito_id = :cartId;
    `,
    { replacements: { cartId }, type: QueryTypes.SELECT },
  )) as Array<{ count: number }>;

  return {
    cart: carts[0] ?? null,
    items,
    payments,
    citas,
    refundCount: Number(refundCounts[0]?.count ?? 0),
    cartTotal: items.reduce(
      (total, item) => total + Number(item.precio) * Number(item.cantidad),
      0,
    ),
  };
};

const readOnlyExposure = async (citaId: number) =>
  sequelize.transaction(async (transaction: any) => {
    await sequelize.query("SET TRANSACTION READ ONLY;", { transaction });
    return wellnessFinancialExposure(citaId, transaction);
  });

describe("Mutación de carrito con dinero aprobado de CitaBienestar", () => {
  it(TEST_NAME, async () => {
    const databaseRows = (await sequelize.query(
      "SELECT current_database() AS database;",
      { type: QueryTypes.SELECT },
    )) as Array<{ database: string }>;
    expect(databaseRows[0]?.database).toBe("hotel_test_db");

    const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
    const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
    const clientAuthorization = `Bearer ${cliente.token}`;
    const adminAuthorization = `Bearer ${admin.token}`;

    const createTherapist = (name: string) =>
      request(app)
        .post("/api/terapeutas")
        .set("Authorization", adminAuthorization)
        .send({ nombre: name, activo: true });
    const therapistAResponse = await createTherapist(
      "Terapeuta A QA SPA FIN 050",
    );
    const therapistBResponse = await createTherapist(
      "Terapeuta B QA SPA FIN 050",
    );
    expect(therapistAResponse.status, JSON.stringify(therapistAResponse.body)).toBe(201);
    expect(therapistBResponse.status, JSON.stringify(therapistBResponse.body)).toBe(201);
    const therapistAId = Number(therapistAResponse.body.data.id);
    const therapistBId = Number(therapistBResponse.body.data.id);

    const createService = (name: string, price: number) =>
      request(app)
        .post("/api/servicios-spa")
        .set("Authorization", adminAuthorization)
        .send({ nombre: name, duracion_minutos: 60, precio: price });
    const serviceAResponse = await createService(
      "Servicio A QA SPA FIN 050",
      100,
    );
    const serviceBResponse = await createService(
      "Servicio B QA SPA FIN 050",
      900,
    );
    expect(serviceAResponse.status, JSON.stringify(serviceAResponse.body)).toBe(201);
    expect(serviceBResponse.status, JSON.stringify(serviceBResponse.body)).toBe(201);
    expect(Number(serviceAResponse.body.data.precio)).toBe(100);
    expect(Number(serviceBResponse.body.data.precio)).toBe(900);
    const serviceAId = Number(serviceAResponse.body.data.id);
    const serviceBId = Number(serviceBResponse.body.data.id);

    const appointmentDate = futureHotelDate(30);
    const createAppointment = (
      therapistId: number,
      serviceId: number,
      start: string,
    ) =>
      request(app)
        .post("/api/citas-spa")
        .set("Authorization", clientAuthorization)
        .send({
          terapeuta_id: therapistId,
          servicio_bienestar_id: serviceId,
          fecha: appointmentDate,
          hora_inicio: start,
        });
    const citaAResponse = await createAppointment(
      therapistAId,
      serviceAId,
      "10:00",
    );
    const citaBResponse = await createAppointment(
      therapistBId,
      serviceBId,
      "12:00",
    );
    expect(citaAResponse.status, JSON.stringify(citaAResponse.body)).toBe(201);
    expect(citaBResponse.status, JSON.stringify(citaBResponse.body)).toBe(201);
    expect(citaAResponse.body.data.estado).toBe("confirmada");
    expect(citaBResponse.body.data.estado).toBe("confirmada");
    const citaAId = Number(citaAResponse.body.data.id);
    const citaBId = Number(citaBResponse.body.data.id);

    const cartResponse = await request(app)
      .post("/api/carritos")
      .set("Authorization", clientAuthorization)
      .send({});
    expect(cartResponse.status, JSON.stringify(cartResponse.body)).toBe(201);
    const cartId = Number(cartResponse.body.data.id);

    const addAResponse = await request(app)
      .post(`/api/carritos/${cartId}/items`)
      .set("Authorization", clientAuthorization)
      .send({ tipo_item: "bienestar", referencia_id: citaAId });
    const addBResponse = await request(app)
      .post(`/api/carritos/${cartId}/items`)
      .set("Authorization", clientAuthorization)
      .send({ tipo_item: "bienestar", referencia_id: citaBId });
    expect(addAResponse.status, JSON.stringify(addAResponse.body)).toBe(201);
    expect(addBResponse.status, JSON.stringify(addBResponse.body)).toBe(201);
    expect(Number(addAResponse.body.data.precio)).toBe(100);
    expect(Number(addBResponse.body.data.precio)).toBe(900);
    const itemAId = Number(addAResponse.body.data.id);
    const itemBId = Number(addBResponse.body.data.id);

    const cartItemsResponse = await request(app)
      .get(`/api/carritos/${cartId}/items`)
      .set("Authorization", clientAuthorization);
    expect(cartItemsResponse.status, JSON.stringify(cartItemsResponse.body)).toBe(200);
    expect(cartItemsResponse.body.data.items).toHaveLength(2);
    expect(Number(cartItemsResponse.body.data.total)).toBe(1000);

    const beforePayment = await persistedSnapshot(cartId, [citaAId, citaBId]);
    expect(beforePayment.cart).toMatchObject({
      id: cartId,
      usuario_id: Number(cliente.usuario.id),
      estado: "activo",
    });
    expect(beforePayment.items).toEqual([
      expect.objectContaining({
        id: itemAId,
        tipo_item: "bienestar",
        referencia_id: citaAId,
        precio: "100.00",
        cantidad: 1,
      }),
      expect.objectContaining({
        id: itemBId,
        tipo_item: "bienestar",
        referencia_id: citaBId,
        precio: "900.00",
        cantidad: 1,
      }),
    ]);
    expect(beforePayment.cartTotal).toBe(1000);
    expect(beforePayment.citas).toEqual([
      expect.objectContaining({
        id: citaAId,
        usuario_id: Number(cliente.usuario.id),
        terapeuta_id: therapistAId,
        servicio_bienestar_id: serviceAId,
        estado: "confirmada",
        obligacion: "100.00",
      }),
      expect.objectContaining({
        id: citaBId,
        usuario_id: Number(cliente.usuario.id),
        terapeuta_id: therapistBId,
        servicio_bienestar_id: serviceBId,
        estado: "confirmada",
        obligacion: "900.00",
      }),
    ]);

    const paymentResponse = await request(app)
      .post("/api/pagos")
      .set("Authorization", adminAuthorization)
      .send({
        carrito_id: cartId,
        monto: "500.00",
        metodo: "efectivo",
        tipo_pago: "total",
        moneda: "GTQ",
        idempotency_key: "qa-spa-fin-candidate-050-cash-partial",
      });

    if (paymentResponse.status >= 400 && paymentResponse.status < 500) {
      console.log(
        "[QA-SPA-FIN-CANDIDATE-050-BLOCKED]",
        JSON.stringify(
          {
            database: databaseRows[0]?.database,
            paymentHttp: paymentResponse.status,
            paymentCode: paymentResponse.body.code ?? null,
            paymentBody: paymentResponse.body,
            requestedApprovedCash: "500.00",
            cartTotal: "1000.00",
            realStripeCalls: 0,
          },
          null,
          2,
        ),
      );
      throw new Error(
        `BLOCKED: el API rechazó el pago parcial cash sin persistirlo (HTTP ${paymentResponse.status})`,
      );
    }

    expect(paymentResponse.status, JSON.stringify(paymentResponse.body)).toBe(201);
    expect(paymentResponse.body.data).toMatchObject({
      carrito_id: cartId,
      monto: "500.00",
      metodo: "efectivo",
      tipo_pago: "total",
      estado: "aprobado",
      moneda: "GTQ",
    });
    const paymentId = Number(paymentResponse.body.data.id);

    const beforeDelete = await persistedSnapshot(cartId, [citaAId, citaBId]);
    const [beforeExposureA, beforeExposureB] = await Promise.all([
      readOnlyExposure(citaAId),
      readOnlyExposure(citaBId),
    ]);
    expect(beforeDelete.cart?.estado).toBe("activo");
    expect(beforeDelete.items).toHaveLength(2);
    expect(beforeDelete.cartTotal).toBe(1000);
    expect(beforeDelete.payments).toEqual([
      expect.objectContaining({
        id: paymentId,
        carrito_id: cartId,
        monto: "500.00",
        metodo: "efectivo",
        tipo_pago: "total",
        estado: "aprobado",
        moneda: "GTQ",
        pasarela: null,
        id_transaccion_externo: null,
      }),
    ]);
    expect(beforeDelete.refundCount).toBe(0);
    expect(beforeExposureA).toEqual({ approved: 50, processing: 0, total: 50 });
    expect(beforeExposureB).toEqual({ approved: 450, processing: 0, total: 450 });

    const deleteResponse = await request(app)
      .delete(`/api/carritos/${cartId}/items/${itemBId}`)
      .set("Authorization", clientAuthorization);

    const afterDelete = await persistedSnapshot(cartId, [citaAId, citaBId]);
    const [afterExposureA, afterExposureB] = await Promise.all([
      readOnlyExposure(citaAId),
      readOnlyExposure(citaBId),
    ]);
    const afterItemA = afterDelete.items.find((item) => item.id === itemAId);
    const afterItemB = afterDelete.items.find((item) => item.id === itemBId);
    const obligationA = Number(
      afterDelete.citas.find((cita) => cita.id === citaAId)?.obligacion ?? 0,
    );
    const overexposureA = afterExposureA.approved - obligationA;
    const allocationsStable =
      JSON.stringify(afterExposureA) === JSON.stringify(beforeExposureA) &&
      JSON.stringify(afterExposureB) === JSON.stringify(beforeExposureB);
    const approvedMutationViolation =
      deleteResponse.status === 204 &&
      Boolean(afterItemA) &&
      !afterItemB &&
      afterExposureA.approved === 500 &&
      obligationA === 100 &&
      overexposureA === 400 &&
      afterExposureB.total === 0;
    const unexpected500 = [
      therapistAResponse,
      therapistBResponse,
      serviceAResponse,
      serviceBResponse,
      citaAResponse,
      citaBResponse,
      cartResponse,
      addAResponse,
      addBResponse,
      cartItemsResponse,
      paymentResponse,
      deleteResponse,
    ].some((response) => response.status === 500);
    const stripeCalls = Object.fromEntries(
      Object.entries(stripeGuard).map(([method, fn]) => [
        method,
        fn.mock.calls.length,
      ]),
    );

    const evidence = {
      qaId: "QA-SPA-FIN-CANDIDATE-050",
      result: approvedMutationViolation ? "CONFIRMED" : "NOT_REPRODUCED",
      database: databaseRows[0]?.database,
      stripeMode: "FULL_FORBIDDEN_MOCK",
      realStripeCalls: 0,
      stripeCalls,
      ids: {
        clientId: Number(cliente.usuario.id),
        adminId: Number(admin.usuario.id),
        therapistAId,
        therapistBId,
        serviceAId,
        serviceBId,
        citaAId,
        citaBId,
        cartId,
        itemAId,
        itemBId,
        paymentId,
      },
      http: {
        setup: {
          therapistA: therapistAResponse.status,
          therapistB: therapistBResponse.status,
          serviceA: serviceAResponse.status,
          serviceB: serviceBResponse.status,
          citaA: citaAResponse.status,
          citaB: citaBResponse.status,
          cart: cartResponse.status,
          addA: addAResponse.status,
          addB: addBResponse.status,
          listItems: cartItemsResponse.status,
        },
        approvedCashPayment: {
          status: paymentResponse.status,
          code: paymentResponse.body.code ?? null,
        },
        deleteItemB: {
          status: deleteResponse.status,
          code: deleteResponse.body?.code ?? null,
          body: deleteResponse.body,
        },
        unexpected500,
      },
      databaseBefore: {
        cart: beforeDelete.cart,
        items: beforeDelete.items,
        cartTotal: beforeDelete.cartTotal.toFixed(2),
        payment: beforeDelete.payments,
        citas: beforeDelete.citas,
        refundCount: beforeDelete.refundCount,
        productionExposure: {
          citaA: beforeExposureA,
          citaB: beforeExposureB,
        },
      },
      databaseAfter: {
        cart: afterDelete.cart,
        items: afterDelete.items,
        cartTotal: afterDelete.cartTotal.toFixed(2),
        payment: afterDelete.payments,
        citas: afterDelete.citas,
        refundCount: afterDelete.refundCount,
        productionExposure: {
          citaA: afterExposureA,
          citaB: afterExposureB,
        },
        obligationA: obligationA.toFixed(2),
        overexposureA: overexposureA.toFixed(2),
        citaBExposureHistoryLost: afterExposureB.total === 0,
      },
      mutationGuardObserved: {
        processingBlocks: "YES (assertCartCanBeMutated static path)",
        approvedBlocks: deleteResponse.status === 409 ? "YES" : "NO",
      },
      invariant: {
        deleteRejectedWith409: deleteResponse.status === 409,
        bothItemsRemain: Boolean(afterItemA) && Boolean(afterItemB),
        allocationsStable,
        perCitaExposureWithinObligation:
          afterExposureA.total <= obligationA && afterExposureB.total <= 900,
      },
      approvedMutationViolation,
    };

    console.log(
      "[QA-SPA-FIN-CANDIDATE-050]",
      JSON.stringify(evidence, null, 2),
    );

    expect.soft(unexpected500).toBe(false);
    expect.soft(deleteResponse.status).toBe(409);
    expect.soft(afterItemA).toBeDefined();
    expect.soft(afterItemB).toBeDefined();
    expect.soft(afterDelete.items).toHaveLength(2);
    expect.soft(afterDelete.cartTotal).toBe(1000);
    expect.soft(afterDelete.payments).toEqual(beforeDelete.payments);
    expect.soft(afterDelete.citas).toEqual(beforeDelete.citas);
    expect.soft(afterDelete.refundCount).toBe(0);
    expect.soft(afterExposureA).toEqual(beforeExposureA);
    expect.soft(afterExposureB).toEqual(beforeExposureB);
    expect.soft(afterExposureA.total).toBeLessThanOrEqual(obligationA);
    expect.soft(approvedMutationViolation).toBe(false);
    for (const forbiddenCall of Object.values(stripeGuard)) {
      expect.soft(forbiddenCall).not.toHaveBeenCalled();
    }
  });
});
