import { QueryTypes } from "sequelize";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const stripeGuard = vi.hoisted(() => {
  const forbiddenCall = vi.fn(() => {
    throw new Error(
      "Stripe no debe ejecutarse en QA-SPA-FIN-CANDIDATE-049",
    );
  });

  return { forbiddenCall };
});

vi.mock("../../src/services/stripe.service", () => ({
  toStripeAmount: (amount: number | string) => Math.round(Number(amount) * 100),
  stripeService: {
    createPaymentIntent: stripeGuard.forbiddenCall,
    updatePaymentIntentMetadata: stripeGuard.forbiddenCall,
    retrievePaymentIntent: stripeGuard.forbiddenCall,
    cancelPaymentIntent: stripeGuard.forbiddenCall,
    createRefund: stripeGuard.forbiddenCall,
    constructEvent: stripeGuard.forbiddenCall,
  },
}));

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";
import { sequelize } from "../helpers/db";

const TEST_NAME =
  "QA-SPA-FIN-CANDIDATE-049: rechaza aprobar tarde una transferencia si la cita ya fue pagada en otro carrito";
const MAXIMUM_LEGITIMATE_EXPOSURE = 350;
const approvedLikeStates = new Set([
  "aprobado",
  "reembolsado_parcial",
  "reembolsado",
]);

interface CitaRow {
  id: number;
  usuario_id: number;
  terapeuta_id: number;
  servicio_bienestar_id: number;
  estado: string;
}

interface CartItemRow {
  id: number;
  carrito_id: number;
  carrito_estado: string;
  tipo_item: string;
  referencia_id: number;
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

interface RefundRow {
  id: number;
  pago_id: number;
  monto: string;
  estado: string;
  id_reembolso_externo: string | null;
}

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

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

const persistedReferenceSnapshot = async (citaId: number) => {
  const citas = (await sequelize.query(
    `
      SELECT
        id,
        usuario_id,
        terapeuta_id,
        servicio_bienestar_id,
        estado
      FROM citas_bienestar
      WHERE id = :citaId;
    `,
    { replacements: { citaId }, type: QueryTypes.SELECT },
  )) as CitaRow[];
  const items = (await sequelize.query(
    `
      SELECT
        ci.id,
        ci.carrito_id,
        c.estado AS carrito_estado,
        ci.tipo_item,
        ci.referencia_id,
        ci.precio::numeric(10, 2)::text AS precio,
        ci.cantidad
      FROM carrito_items ci
      INNER JOIN carritos c ON c.id = ci.carrito_id
      WHERE ci.tipo_item = 'bienestar'
        AND ci.referencia_id = :citaId
      ORDER BY ci.id ASC;
    `,
    { replacements: { citaId }, type: QueryTypes.SELECT },
  )) as CartItemRow[];
  const cartIds = [...new Set(items.map((item) => Number(item.carrito_id)))];
  const payments = cartIds.length === 0
    ? []
    : ((await sequelize.query(
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
          WHERE carrito_id IN (:cartIds)
          ORDER BY id ASC;
        `,
        { replacements: { cartIds }, type: QueryTypes.SELECT },
      )) as PaymentRow[]);
  const paymentIds = payments.map((payment) => Number(payment.id));
  const refunds = paymentIds.length === 0
    ? []
    : ((await sequelize.query(
        `
          SELECT
            id,
            pago_id,
            monto::numeric(10, 2)::text AS monto,
            estado,
            id_reembolso_externo
          FROM reembolsos
          WHERE pago_id IN (:paymentIds)
          ORDER BY id ASC;
        `,
        { replacements: { paymentIds }, type: QueryTypes.SELECT },
      )) as RefundRow[]);
  const approvedNetByPayment = new Map<number, number>();
  for (const payment of payments) {
    const approvedRefunds = refunds
      .filter(
        (refund) =>
          Number(refund.pago_id) === Number(payment.id) &&
          refund.estado === "aprobado",
      )
      .reduce((sum, refund) => sum + Number(refund.monto), 0);
    approvedNetByPayment.set(
      Number(payment.id),
      approvedLikeStates.has(payment.estado)
        ? round(Math.max(0, Number(payment.monto) - approvedRefunds))
        : 0,
    );
  }
  const approvedNet = round(
    [...approvedNetByPayment.values()].reduce((sum, amount) => sum + amount, 0),
  );
  const processing = round(
    payments
      .filter((payment) => payment.estado === "procesando")
      .reduce((sum, payment) => sum + Number(payment.monto), 0),
  );
  const pendingTransferAmount = round(
    payments
      .filter(
        (payment) =>
          payment.estado === "pendiente" && payment.metodo === "transferencia",
      )
      .reduce((sum, payment) => sum + Number(payment.monto), 0),
  );

  return {
    cita: citas[0] ?? null,
    items,
    payments,
    refunds,
    approvedNetByPayment,
    approvedNet,
    processing,
    pendingTransferAmount,
    totalActiveExposure: round(approvedNet + processing),
  };
};

const paymentFrom = (
  snapshot: Awaited<ReturnType<typeof persistedReferenceSnapshot>>,
  paymentId: number,
) => snapshot.payments.find((payment) => Number(payment.id) === paymentId);

const itemFromCart = (
  snapshot: Awaited<ReturnType<typeof persistedReferenceSnapshot>>,
  cartId: number,
) => snapshot.items.find((item) => Number(item.carrito_id) === cartId);

describe("Aprobación tardía y exposición financiera de CitaBienestar", () => {
  it(
    TEST_NAME,
    async () => {
      const databaseRows = (await sequelize.query(
        "SELECT current_database() AS database;",
        { type: QueryTypes.SELECT },
      )) as Array<{ database: string }>;
      expect(databaseRows[0]?.database).toBe("hotel_test_db");

      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const admin = await createAuthenticatedUser({ rol: ROLES.ADMIN });
      const clientAuthorization = `Bearer ${cliente.token}`;
      const adminAuthorization = `Bearer ${admin.token}`;

      const therapistResponse = await request(app)
        .post("/api/terapeutas")
        .set("Authorization", adminAuthorization)
        .send({ nombre: "Terapeuta QA SPA FIN 049", activo: true });
      expect(therapistResponse.status, JSON.stringify(therapistResponse.body)).toBe(201);
      const therapistId = Number(therapistResponse.body.data.id);

      const serviceResponse = await request(app)
        .post("/api/servicios-spa")
        .set("Authorization", adminAuthorization)
        .send({
          nombre: "Masaje QA SPA FIN 049",
          duracion_minutos: 60,
          precio: 350,
        });
      expect(serviceResponse.status, JSON.stringify(serviceResponse.body)).toBe(201);
      expect(Number(serviceResponse.body.data.precio)).toBe(350);
      const serviceId = Number(serviceResponse.body.data.id);

      const citaResponse = await request(app)
        .post("/api/citas-spa")
        .set("Authorization", clientAuthorization)
        .send({
          terapeuta_id: therapistId,
          servicio_bienestar_id: serviceId,
          fecha: futureHotelDate(30),
          hora_inicio: "10:00",
        });
      expect(citaResponse.status, JSON.stringify(citaResponse.body)).toBe(201);
      expect(citaResponse.body.data.estado).toBe("confirmada");
      expect(Number(citaResponse.body.data.usuario_id)).toBe(
        Number(cliente.usuario.id),
      );
      const citaId = Number(citaResponse.body.data.id);

      const cart1Response = await request(app)
        .post("/api/carritos")
        .set("Authorization", clientAuthorization)
        .send({});
      expect(cart1Response.status, JSON.stringify(cart1Response.body)).toBe(201);
      const cart1Id = Number(cart1Response.body.data.id);

      const add1Response = await request(app)
        .post(`/api/carritos/${cart1Id}/items`)
        .set("Authorization", clientAuthorization)
        .send({ tipo_item: "bienestar", referencia_id: citaId });
      expect(add1Response.status, JSON.stringify(add1Response.body)).toBe(201);
      expect(Number(add1Response.body.data.precio)).toBe(350);
      const cart1ItemId = Number(add1Response.body.data.id);

      const transferResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", clientAuthorization)
        .send({
          carrito_id: cart1Id,
          monto: "350.00",
          metodo: "transferencia",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-spa-fin-candidate-049-transfer-c1",
        });
      expect(transferResponse.status, JSON.stringify(transferResponse.body)).toBe(201);
      const payment1Id = Number(transferResponse.body.data.id);

      const clientApprovalResponse = await request(app)
        .post(`/api/pagos/${payment1Id}/aprobar-transferencia`)
        .set("Authorization", clientAuthorization)
        .send({});
      expect(clientApprovalResponse.status).toBe(403);

      const afterP1 = await persistedReferenceSnapshot(citaId);
      const payment1BeforeApproval = paymentFrom(afterP1, payment1Id);
      expect(payment1BeforeApproval).toMatchObject({
        id: payment1Id,
        carrito_id: cart1Id,
        monto: "350.00",
        metodo: "transferencia",
        estado: "pendiente",
        pasarela: null,
        id_transaccion_externo: null,
      });
      expect(afterP1.approvedNet).toBe(0);
      expect(afterP1.processing).toBe(0);
      expect(afterP1.pendingTransferAmount).toBe(350);

      const cash1Response = await request(app)
        .post("/api/pagos")
        .set("Authorization", adminAuthorization)
        .send({
          carrito_id: cart1Id,
          monto: "350.00",
          metodo: "efectivo",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-spa-fin-candidate-049-cash-c1",
        });
      expect(cash1Response.status, JSON.stringify(cash1Response.body)).toBe(201);
      const payment2Id = Number(cash1Response.body.data.id);
      const afterP2 = await persistedReferenceSnapshot(citaId);
      expect(paymentFrom(afterP2, payment2Id)).toMatchObject({
        monto: "350.00",
        metodo: "efectivo",
        estado: "aprobado",
      });
      expect(itemFromCart(afterP2, cart1Id)?.carrito_estado).toBe("pagado");
      expect(afterP2.approvedNet).toBe(350);
      expect(afterP2.pendingTransferAmount).toBe(350);

      const refundResponse = await request(app)
        .post(`/api/pagos/${payment2Id}/reembolso`)
        .set("Authorization", adminAuthorization)
        .send({
          monto: "350.00",
          motivo: "requested_by_customer",
          idempotency_key: "qa-spa-fin-candidate-049-refund-p2",
        });
      if (refundResponse.status !== 200) {
        console.log(
          "[QA-SPA-FIN-CANDIDATE-049-BLOCKED]",
          JSON.stringify(
            {
              database: databaseRows[0]?.database,
              refundHttp: refundResponse.status,
              refundCode: refundResponse.body.code ?? null,
              refundBody: refundResponse.body,
              afterP2,
              realStripeCalls: 0,
            },
            null,
            2,
          ),
        );
        throw new Error(
          `BLOCKED: el endpoint real no reembolsó el pago cash P2 (HTTP ${refundResponse.status})`,
        );
      }
      const refundId = Number(refundResponse.body.data.id);
      const afterRefund = await persistedReferenceSnapshot(citaId);
      const persistedRefund = afterRefund.refunds.find(
        (refund) => Number(refund.id) === refundId,
      );
      expect(persistedRefund).toMatchObject({
        pago_id: payment2Id,
        monto: "350.00",
        estado: "aprobado",
        id_reembolso_externo: "qa-spa-fin-candidate-049-refund-p2",
      });
      expect(paymentFrom(afterRefund, payment2Id)?.estado).toBe("reembolsado");
      expect(afterRefund.approvedNet).toBe(0);
      expect(itemFromCart(afterRefund, cart1Id)?.carrito_estado).toBe("pagado");
      expect(afterRefund.cita?.estado).toBe("confirmada");

      const cart2Response = await request(app)
        .post("/api/carritos")
        .set("Authorization", clientAuthorization)
        .send({});
      expect(cart2Response.status, JSON.stringify(cart2Response.body)).toBe(201);
      const cart2Id = Number(cart2Response.body.data.id);

      const add2Response = await request(app)
        .post(`/api/carritos/${cart2Id}/items`)
        .set("Authorization", clientAuthorization)
        .send({ tipo_item: "bienestar", referencia_id: citaId });
      const afterC2Add = await persistedReferenceSnapshot(citaId);

      if (add2Response.status === 409) {
        const evidence = {
          qaId: "QA-SPA-FIN-CANDIDATE-049",
          result: "NOT_REPRODUCED",
          database: databaseRows[0]?.database,
          realStripeCalls: 0,
          ids: {
            clientId: Number(cliente.usuario.id),
            adminId: Number(admin.usuario.id),
            therapistId,
            serviceId,
            citaId,
            cart1Id,
            cart1ItemId,
            payment1Id,
            payment2Id,
            refundId,
            cart2Id,
          },
          http: {
            transferCreate: transferResponse.status,
            clientTransferApproval: clientApprovalResponse.status,
            cashP2Create: cash1Response.status,
            refundP2: refundResponse.status,
            addC2: {
              status: add2Response.status,
              code: add2Response.body.code ?? null,
              body: add2Response.body,
            },
            cashP3Create: "NOT RUN",
            lateP1Approval: "NOT RUN",
          },
          databaseAfterP1: afterP1,
          databaseAfterP2: afterP2,
          databaseAfterRefund: afterRefund,
          databaseAfterC2Add: afterC2Add,
          exposure: {
            approvedNet: afterC2Add.approvedNet.toFixed(2),
            processing: afterC2Add.processing.toFixed(2),
            pendingTransferAmount:
              afterC2Add.pendingTransferAmount.toFixed(2),
            totalActiveExposure:
              afterC2Add.totalActiveExposure.toFixed(2),
            maximumLegitimateExposure:
              MAXIMUM_LEGITIMATE_EXPOSURE.toFixed(2),
          },
        };
        console.log(
          "[QA-SPA-FIN-CANDIDATE-049]",
          JSON.stringify(evidence, null, 2),
        );

        expect(add2Response.body.code).toBe("CART_REFERENCE_NOT_AVAILABLE");
        expect(itemFromCart(afterC2Add, cart2Id)).toBeUndefined();
        expect(paymentFrom(afterC2Add, payment1Id)?.estado).toBe("pendiente");
        expect(afterC2Add.totalActiveExposure).toBeLessThanOrEqual(
          MAXIMUM_LEGITIMATE_EXPOSURE,
        );
        expect(afterC2Add.cita?.estado).toBe("confirmada");
        expect(stripeGuard.forbiddenCall).not.toHaveBeenCalled();
        return;
      }

      expect(add2Response.status, JSON.stringify(add2Response.body)).toBe(201);
      const cart2ItemId = Number(add2Response.body.data.id);
      expect(itemFromCart(afterC2Add, cart2Id)).toMatchObject({
        id: cart2ItemId,
        precio: "350.00",
        cantidad: 1,
      });

      const cash2Response = await request(app)
        .post("/api/pagos")
        .set("Authorization", adminAuthorization)
        .send({
          carrito_id: cart2Id,
          monto: "350.00",
          metodo: "efectivo",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-spa-fin-candidate-049-cash-c2",
        });
      expect(cash2Response.status, JSON.stringify(cash2Response.body)).toBe(201);
      const payment3Id = Number(cash2Response.body.data.id);
      const afterP3 = await persistedReferenceSnapshot(citaId);
      expect(paymentFrom(afterP3, payment3Id)).toMatchObject({
        monto: "350.00",
        metodo: "efectivo",
        estado: "aprobado",
      });
      expect(itemFromCart(afterP3, cart2Id)?.carrito_estado).toBe("pagado");
      expect(afterP3.approvedNet).toBe(350);
      expect(afterP3.pendingTransferAmount).toBe(350);
      expect(afterP3.cita?.estado).toBe("confirmada");

      const lateApprovalResponse = await request(app)
        .post(`/api/pagos/${payment1Id}/aprobar-transferencia`)
        .set("Authorization", adminAuthorization)
        .send({});
      const final = await persistedReferenceSnapshot(citaId);
      const finalP1 = paymentFrom(final, payment1Id);
      const finalP2 = paymentFrom(final, payment2Id);
      const finalP3 = paymentFrom(final, payment3Id);
      const p1ApprovedNet = final.approvedNetByPayment.get(payment1Id) ?? 0;
      const p3ApprovedNet = final.approvedNetByPayment.get(payment3Id) ?? 0;
      const doubleApprovedExposure =
        p1ApprovedNet === 350 && p3ApprovedNet === 350;
      const financialViolation =
        final.totalActiveExposure > MAXIMUM_LEGITIMATE_EXPOSURE;
      const unexpected500 = [
        therapistResponse,
        serviceResponse,
        citaResponse,
        cart1Response,
        add1Response,
        transferResponse,
        clientApprovalResponse,
        cash1Response,
        refundResponse,
        cart2Response,
        add2Response,
        cash2Response,
        lateApprovalResponse,
      ].some((response) => response.status === 500);

      const evidence = {
        qaId: "QA-SPA-FIN-CANDIDATE-049",
        result:
          lateApprovalResponse.status === 200 &&
          finalP1?.estado === "aprobado" &&
          final.approvedNet === 700
            ? "CONFIRMED"
            : "NOT_REPRODUCED",
        invariant:
          "Para una CitaBienestar Q350, pagos approved-like brutos menos reembolsos aprobados más pagos procesando, a través de todos sus carritos históricos, no puede superar Q350.00",
        database: databaseRows[0]?.database,
        realStripeCalls: 0,
        actors: {
          clientId: Number(cliente.usuario.id),
          clientRole: cliente.usuario.rol,
          adminId: Number(admin.usuario.id),
          adminRole: admin.usuario.rol,
          clientDeniedAdminOperation: clientApprovalResponse.status === 403,
        },
        ids: {
          therapistId,
          serviceId,
          citaId,
          cart1Id,
          cart1ItemId,
          payment1Id,
          payment2Id,
          refundId,
          cart2Id,
          cart2ItemId,
          payment3Id,
        },
        service: { price: "350.00", durationMinutes: 60 },
        http: {
          transferCreate: {
            status: transferResponse.status,
            code: transferResponse.body.code ?? null,
            state: transferResponse.body.data?.estado ?? null,
          },
          clientTransferApproval: {
            status: clientApprovalResponse.status,
            code: clientApprovalResponse.body.code ?? null,
          },
          cashP2Create: {
            status: cash1Response.status,
            code: cash1Response.body.code ?? null,
            state: cash1Response.body.data?.estado ?? null,
          },
          refundP2: {
            status: refundResponse.status,
            code: refundResponse.body.code ?? null,
            state: refundResponse.body.data?.estado ?? null,
          },
          addC2: {
            status: add2Response.status,
            code: add2Response.body.code ?? null,
          },
          cashP3Create: {
            status: cash2Response.status,
            code: cash2Response.body.code ?? null,
            state: cash2Response.body.data?.estado ?? null,
          },
          lateP1Approval: {
            endpoint: `/api/pagos/${payment1Id}/aprobar-transferencia`,
            status: lateApprovalResponse.status,
            code: lateApprovalResponse.body.code ?? null,
            body: lateApprovalResponse.body,
          },
          unexpected500,
        },
        databaseAfterP1: afterP1,
        databaseAfterP2: afterP2,
        databaseAfterRefund: afterRefund,
        databaseAfterC2Add: afterC2Add,
        databaseAfterP3: afterP3,
        databaseFinal: {
          cita: final.cita,
          items: final.items,
          payments: final.payments,
          refunds: final.refunds,
        },
        finalSemantics: {
          citaState: final.cita?.estado ?? null,
          cart1State: itemFromCart(final, cart1Id)?.carrito_estado ?? null,
          cart2State: itemFromCart(final, cart2Id)?.carrito_estado ?? null,
          p1State: finalP1?.estado ?? null,
          p1Amount: finalP1?.monto ?? null,
          p1ApprovedNet: p1ApprovedNet.toFixed(2),
          p2State: finalP2?.estado ?? null,
          p2Amount: finalP2?.monto ?? null,
          p3State: finalP3?.estado ?? null,
          p3Amount: finalP3?.monto ?? null,
          p3ApprovedNet: p3ApprovedNet.toFixed(2),
          approvedNet: final.approvedNet.toFixed(2),
          processing: final.processing.toFixed(2),
          pendingTransferAmount: final.pendingTransferAmount.toFixed(2),
          totalActiveExposure: final.totalActiveExposure.toFixed(2),
          maximumLegitimateExposure:
            MAXIMUM_LEGITIMATE_EXPOSURE.toFixed(2),
          doubleApprovedExposure,
          financialViolation,
        },
        expectedSafeBehavior: {
          lateP1Approval: "HTTP 409 o rechazo de negocio 4xx equivalente",
          p1State: "pendiente",
          p3State: "aprobado",
          maximumTotalActiveExposure: "350.00",
          citaState: "confirmada",
        },
      };
      console.log(
        "[QA-SPA-FIN-CANDIDATE-049]",
        JSON.stringify(evidence, null, 2),
      );

      expect.soft(unexpected500, "No debe existir ningún HTTP 500").toBe(false);
      expect.soft(
        [409, 422],
        "La aprobación tardía debe rechazarse mediante un conflicto de negocio controlado",
      ).toContain(lateApprovalResponse.status);
      expect.soft(
        finalP1?.estado,
        "P1 debe permanecer pendiente si aprobarla excedería la exposición de la cita",
      ).toBe("pendiente");
      expect.soft(finalP2?.estado).toBe("reembolsado");
      expect.soft(finalP3?.estado).toBe("aprobado");
      expect.soft(
        final.totalActiveExposure,
        "La exposición activa agregada de la cita no debe superar Q350.00",
      ).toBeLessThanOrEqual(MAXIMUM_LEGITIMATE_EXPOSURE);
      expect.soft(doubleApprovedExposure).toBe(false);
      expect.soft(financialViolation).toBe(false);
      expect.soft(final.cita?.estado).toBe("confirmada");
      expect(stripeGuard.forbiddenCall).not.toHaveBeenCalled();
    },
    30000,
  );
});
