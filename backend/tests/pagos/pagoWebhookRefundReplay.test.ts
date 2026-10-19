import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const stripeMock = vi.hoisted(() => {
  const forbidden = (method: string) =>
    vi.fn(() => {
      throw new Error(
        `${method} no permitido en este test`
      );
    });

  return {
    createPaymentIntent: forbidden(
      "createPaymentIntent"
    ),
    retrievePaymentIntent: forbidden(
      "retrievePaymentIntent"
    ),
    cancelPaymentIntent: forbidden(
      "cancelPaymentIntent"
    ),
    createRefund: forbidden("createRefund"),
    constructEvent: forbidden("constructEvent"),
  };
});

/**
 * Mock completo y local: stripe.service.ts y el SDK real de Stripe no se
 * evalúan. Ningún método externo está permitido en esta reproducción.
 */
vi.mock(
  "../../src/services/stripe.service",
  () => ({
    toStripeAmount: (
      amount: number | string,
      _currency: string
    ) => Math.round(Number(amount) * 100),
    stripeService: stripeMock,
  })
);

import request from "supertest";

import app from "../../src/app";
import {
  ROLES,
} from "../../src/constants/roles";
import {
  processStripeWebhook,
} from "../../src/services/pago.service";
import {
  createRecursoActividad,
} from "../fixtures/actividades";
import {
  createAuthenticatedUser,
} from "../helpers/auth";

const db = require("../../src/models");

const {
  Pago,
  Reembolso,
  ReservaActividad,
} = db;

type ReplayCase = {
  label: "TOTAL" | "PARTIAL";
  initialState:
    | "reembolsado"
    | "reembolsado_parcial";
  refundAmount: number;
  expectedNet: number;
  intentId: string;
  refundExternalId: string;
};

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) /
  100;

const paymentSnapshot = async (paymentId: number) => {
  const payment = await Pago.findByPk(paymentId);
  const refunds = await Reembolso.findAll({
    where: {
      pago_id: paymentId,
      estado: "aprobado",
    },
    order: [["id", "ASC"]],
  });
  const refunded = round(
    refunds.reduce(
      (sum: number, refund: any) =>
        sum + Number(refund.monto),
      0
    )
  );

  return {
    payment,
    refunds,
    refunded,
    net: round(Number(payment?.monto ?? 0) - refunded),
  };
};

const reproduceSucceededReplay = async (
  replayCase: ReplayCase
) => {
  const cliente = await createAuthenticatedUser({
    rol: ROLES.CLIENTE,
  });
  const recurso = await createRecursoActividad({
    precio_hora: "100.00",
  });

  const reservaResponse = await request(app)
    .post("/api/reservas-actividad")
    .set(
      "Authorization",
      `Bearer ${cliente.token}`
    )
    .send({
      recurso_id: recurso.id,
      fecha: "2027-06-10",
      hora_inicio: "10:00",
      hora_fin: "11:00",
      con_equipo: false,
    });

  if (
    reservaResponse.status !== 201 ||
    reservaResponse.body.data?.total !== "100.00"
  ) {
    throw new Error(
      `Setup reserva inválido: HTTP ${reservaResponse.status} ${JSON.stringify(reservaResponse.body)}`
    );
  }

  const reserva = await ReservaActividad.findByPk(
    reservaResponse.body.data.id
  );

  if (!reserva || reserva.total !== "100.00") {
    throw new Error(
      `Setup reserva no persistido con Q100.00: ${JSON.stringify(reserva?.toJSON() ?? null)}`
    );
  }

  const carritoResponse = await request(app)
    .post("/api/carritos")
    .set(
      "Authorization",
      `Bearer ${cliente.token}`
    )
    .send({});

  if (carritoResponse.status !== 201) {
    throw new Error(
      `Setup carrito inválido: HTTP ${carritoResponse.status} ${JSON.stringify(carritoResponse.body)}`
    );
  }

  const carritoId = Number(carritoResponse.body.data.id);
  const itemResponse = await request(app)
    .post(`/api/carritos/${carritoId}/items`)
    .set(
      "Authorization",
      `Bearer ${cliente.token}`
    )
    .send({
      tipo_item: "actividad",
      referencia_id: reserva.id,
    });

  if (
    itemResponse.status !== 201 ||
    itemResponse.body.data?.precio !== "100.00"
  ) {
    throw new Error(
      `Setup item inválido: HTTP ${itemResponse.status} ${JSON.stringify(itemResponse.body)}`
    );
  }

  const payment = await Pago.create({
    reserva_habitacion_id: null,
    carrito_id: carritoId,
    monto: "100.00",
    metodo: "tarjeta",
    estado: replayCase.initialState,
    id_transaccion_externo: replayCase.intentId,
    moneda: "GTQ",
    tipo_pago: "total",
    pasarela: "stripe",
    fecha_pago: new Date("2027-06-10T17:00:00.000Z"),
  });
  const refund = await Reembolso.create({
    pago_id: payment.id,
    monto: replayCase.refundAmount.toFixed(2),
    moneda: "GTQ",
    motivo: "requested_by_customer",
    estado: "aprobado",
    fecha_reembolso: new Date(
      "2027-06-10T18:00:00.000Z"
    ),
    id_reembolso_externo:
      replayCase.refundExternalId,
  });

  const before = await paymentSnapshot(payment.id);
  const intentObject = {
    id: replayCase.intentId,
    amount: 10000,
    currency: "gtq",
    metadata: {
      pago_id: String(payment.id),
    },
  };
  const webhookResult = await processStripeWebhook(
    intentObject,
    "payment_intent.succeeded"
  );
  const after = await paymentSnapshot(payment.id);
  const paymentRowPreserved =
    Number(after.payment?.id) === Number(payment.id);
  const refundRowPreserved =
    after.refunds.length === 1 &&
    Number(after.refunds[0].id) === Number(refund.id) &&
    after.refunds[0].id_reembolso_externo ===
      replayCase.refundExternalId;

  console.log(
    `[QA-PAY-DATA-CANDIDATE-009 ${replayCase.label}]`,
    JSON.stringify(
      {
        stripeMode: "MOCK",
        realStripeCharges: false,
        rows: {
          paymentId: payment.id,
          refundId: refund.id,
          paymentRowPreserved,
          refundRowPreserved,
        },
        before: {
          state: before.payment?.estado ?? null,
          paymentAmount:
            before.payment?.monto ?? null,
          approvedRefundAmount:
            before.refunded.toFixed(2),
          net: before.net.toFixed(2),
        },
        webhookEvent: {
          type: "payment_intent.succeeded",
          object: intentObject,
        },
        webhookResult: {
          paymentId: webhookResult?.id ?? null,
          state: webhookResult?.estado ?? null,
        },
        after: {
          state: after.payment?.estado ?? null,
          paymentAmount:
            after.payment?.monto ?? null,
          approvedRefundAmount:
            after.refunded.toFixed(2),
          net: after.net.toFixed(2),
          refundIds: after.refunds.map(
            (persistedRefund: any) =>
              persistedRefund.id
          ),
        },
      },
      null,
      2
    )
  );

  expect(before.payment).not.toBeNull();
  expect(before.payment.estado).toBe(
    replayCase.initialState
  );
  expect(before.payment.monto).toBe("100.00");
  expect(before.refunds).toHaveLength(1);
  expect(before.refunds[0].id).toBe(refund.id);
  expect(before.refunds[0].estado).toBe("aprobado");
  expect(Number(before.refunds[0].monto)).toBe(
    replayCase.refundAmount
  );
  expect(before.refunded).toBe(
    replayCase.refundAmount
  );
  expect(before.net).toBe(replayCase.expectedNet);

  expect(webhookResult).not.toBeNull();
  expect(webhookResult.id).toBe(payment.id);
  expect(after.payment).not.toBeNull();
  expect(paymentRowPreserved).toBe(true);
  expect(refundRowPreserved).toBe(true);
  expect(after.payment.monto).toBe("100.00");
  expect(after.payment.id_transaccion_externo).toBe(
    replayCase.intentId
  );
  expect.soft(
    after.payment.estado,
    "Un replay succeeded no debe revivir un pago que ya conserva reembolsos aprobados"
  ).toBe(replayCase.initialState);
  expect(after.refunds).toHaveLength(1);
  expect(after.refunds[0].estado).toBe("aprobado");
  expect(Number(after.refunds[0].monto)).toBe(
    replayCase.refundAmount
  );
  expect(after.refunded).toBe(replayCase.refundAmount);
  expect(after.net).toBe(replayCase.expectedNet);

  for (const method of Object.values(stripeMock)) {
    expect(method).not.toHaveBeenCalled();
  }
};

describe(
  "Replay de webhook succeeded sobre pagos reembolsados",
  () => {
    it(
      "QA-PAY-DATA-CANDIDATE-009 TOTAL",
      async () => {
        await reproduceSucceededReplay({
          label: "TOTAL",
          initialState: "reembolsado",
          refundAmount: 100,
          expectedNet: 0,
          intentId: "pi_replay_001",
          refundExternalId:
            "re_replay_total_001",
        });
      },
      30000
    );

    it(
      "QA-PAY-DATA-CANDIDATE-009 PARTIAL",
      async () => {
        await reproduceSucceededReplay({
          label: "PARTIAL",
          initialState: "reembolsado_parcial",
          refundAmount: 40,
          expectedNet: 60,
          intentId: "pi_replay_partial_001",
          refundExternalId:
            "re_replay_partial_001",
        });
      },
      30000
    );
  }
);
