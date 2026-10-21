import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createCarritoFixture,
} from "../fixtures/carrito";
import {
  createHotelFixture,
} from "../fixtures/hotel";
import {
  createTestUser,
} from "../fixtures/users";

const db = require("../../src/models");

const {
  Pago,
  Reembolso,
  ReservaHabitacion,
} = db;

type IntegrityAttempt = {
  label: string;
  expected: string;
  create: () => Promise<unknown>;
  findPersisted: () => Promise<any[]>;
};

const attemptInvalidCreate = async ({
  label,
  expected,
  create,
  findPersisted,
}: IntegrityAttempt) => {
  let accepted = false;
  let error: unknown = null;

  try {
    await create();
    accepted = true;
  } catch (caughtError) {
    error = caughtError;
  }

  const persistedRows = await findPersisted();

  console.log(
    `[QA-PAY-DATA-CANDIDATE-012][${label}]`,
    JSON.stringify(
      {
        accepted,
        error: {
          name:
            error instanceof Error
              ? error.name
              : null,
          message:
            error instanceof Error
              ? error.message
              : null,
        },
        persisted: {
          count: persistedRows.length,
          row:
            persistedRows[0]?.toJSON?.() ??
            persistedRows[0] ??
            null,
        },
      },
      null,
      2
    )
  );

  expect(
    accepted,
    expected
  ).toBe(false);
  expect(
    persistedRows.length,
    `${expected}; tampoco debe existir una fila persistida`
  ).toBe(0);
};

const createValidCart = async (
  label: string
) => {
  const { usuario } = await createTestUser({
    email: `qa-pay-data-012-${label}@hotel.test`,
  });
  const carrito = await createCarritoFixture({
    usuario_id: usuario.id,
  });

  return {
    usuario,
    carrito,
  };
};

const validPaymentValues = (
  carritoId: number,
  idempotencyKey: string
) => ({
  reserva_habitacion_id: null,
  carrito_id: carritoId,
  monto: "100.00",
  metodo: "efectivo",
  estado: "aprobado",
  moneda: "GTQ",
  tipo_pago: "total",
  pasarela: null,
  idempotency_key: idempotencyKey,
  fecha_pago: new Date("2031-01-10T16:00:00.000Z"),
});

describe(
  "Integridad persistida de Pago y Reembolso",
  () => {
    it(
      "QA-PAY-DATA-CANDIDATE-012 A Pago rechaza monto -1",
      async () => {
        const { carrito } = await createValidCart("a");
        const idempotencyKey =
          "qa-pay-data-012-a-negative-amount";

        await attemptInvalidCreate({
          label: "A",
          expected:
            "Pago.create debe rechazar monto=-1.00",
          create: () =>
            Pago.create({
              ...validPaymentValues(
                carrito.id,
                idempotencyKey
              ),
              monto: "-1.00",
            }),
          findPersisted: () =>
            Pago.findAll({
              where: {
                idempotency_key: idempotencyKey,
              },
            }),
        });
      }
    );

    it(
      "QA-PAY-DATA-CANDIDATE-012 B Pago rechaza ambos orígenes null",
      async () => {
        const idempotencyKey =
          "qa-pay-data-012-b-no-origin";

        await attemptInvalidCreate({
          label: "B",
          expected:
            "Pago.create debe exigir exactamente un origen",
          create: () =>
            Pago.create({
              ...validPaymentValues(
                1,
                idempotencyKey
              ),
              carrito_id: null,
              reserva_habitacion_id: null,
            }),
          findPersisted: () =>
            Pago.findAll({
              where: {
                idempotency_key: idempotencyKey,
              },
            }),
        });
      }
    );

    it(
      "QA-PAY-DATA-CANDIDATE-012 C Pago rechaza ambos orígenes válidos",
      async () => {
        const {
          usuario,
          carrito,
        } = await createValidCart("c");
        const { habitacion } =
          await createHotelFixture({
            capacidad: 2,
            tarifa: 100,
          });
        const reservaHabitacion =
          await ReservaHabitacion.create({
            usuario_id: usuario.id,
            habitacion_id: habitacion.id,
            fecha_entrada: "2031-01-10",
            fecha_salida: "2031-01-11",
            numero_huespedes: 1,
            estado: "confirmada",
            total: "100.00",
          });
        const idempotencyKey =
          "qa-pay-data-012-c-two-origins";

        await attemptInvalidCreate({
          label: "C",
          expected:
            "Pago.create debe rechazar dos orígenes simultáneos",
          create: () =>
            Pago.create({
              ...validPaymentValues(
                carrito.id,
                idempotencyKey
              ),
              reserva_habitacion_id:
                reservaHabitacion.id,
            }),
          findPersisted: () =>
            Pago.findAll({
              where: {
                idempotency_key: idempotencyKey,
              },
            }),
        });
      }
    );

    it(
      "QA-PAY-DATA-CANDIDATE-012 D Pago rechaza estado inventado",
      async () => {
        const { carrito } = await createValidCart("d");
        const idempotencyKey =
          "qa-pay-data-012-d-invalid-state";

        await attemptInvalidCreate({
          label: "D",
          expected:
            "Pago.create debe rechazar estado='inventado'",
          create: () =>
            Pago.create({
              ...validPaymentValues(
                carrito.id,
                idempotencyKey
              ),
              estado: "inventado",
            }),
          findPersisted: () =>
            Pago.findAll({
              where: {
                idempotency_key: idempotencyKey,
              },
            }),
        });
      }
    );

    it(
      "QA-PAY-DATA-CANDIDATE-012 E Pago rechaza método inventado",
      async () => {
        const { carrito } = await createValidCart("e");
        const idempotencyKey =
          "qa-pay-data-012-e-invalid-method";

        await attemptInvalidCreate({
          label: "E",
          expected:
            "Pago.create debe rechazar metodo='inventado'",
          create: () =>
            Pago.create({
              ...validPaymentValues(
                carrito.id,
                idempotencyKey
              ),
              metodo: "inventado",
            }),
          findPersisted: () =>
            Pago.findAll({
              where: {
                idempotency_key: idempotencyKey,
              },
            }),
        });
      }
    );

    it(
      "QA-PAY-DATA-CANDIDATE-012 F Pago rechaza tipo_pago inventado",
      async () => {
        const { carrito } = await createValidCart("f");
        const idempotencyKey =
          "qa-pay-data-012-f-invalid-type";

        await attemptInvalidCreate({
          label: "F",
          expected:
            "Pago.create debe rechazar tipo_pago='inventado'",
          create: () =>
            Pago.create({
              ...validPaymentValues(
                carrito.id,
                idempotencyKey
              ),
              tipo_pago: "inventado",
            }),
          findPersisted: () =>
            Pago.findAll({
              where: {
                idempotency_key: idempotencyKey,
              },
            }),
        });
      }
    );

    it(
      "QA-PAY-DATA-CANDIDATE-012 G Reembolso rechaza monto -1",
      async () => {
        const { carrito } = await createValidCart("g");
        const pago = await Pago.create(
          validPaymentValues(
            carrito.id,
            "qa-pay-data-012-g-valid-payment"
          )
        );
        const externalRefundId =
          "qa-pay-data-012-g-negative-refund";

        await attemptInvalidCreate({
          label: "G",
          expected:
            "Reembolso.create debe rechazar monto=-1.00",
          create: () =>
            Reembolso.create({
              pago_id: pago.id,
              monto: "-1.00",
              moneda: "GTQ",
              estado: "aprobado",
              id_reembolso_externo:
                externalRefundId,
              motivo: "QA integrity negative amount",
              fecha_reembolso: new Date(
                "2031-01-10T17:00:00.000Z"
              ),
            }),
          findPersisted: () =>
            Reembolso.findAll({
              where: {
                id_reembolso_externo:
                  externalRefundId,
              },
            }),
        });
      }
    );

    it(
      "QA-PAY-DATA-CANDIDATE-012 H Reembolso rechaza estado inventado",
      async () => {
        const { carrito } = await createValidCart("h");
        const pago = await Pago.create(
          validPaymentValues(
            carrito.id,
            "qa-pay-data-012-h-valid-payment"
          )
        );
        const externalRefundId =
          "qa-pay-data-012-h-invalid-state";

        await attemptInvalidCreate({
          label: "H",
          expected:
            "Reembolso.create debe rechazar estado='inventado'",
          create: () =>
            Reembolso.create({
              pago_id: pago.id,
              monto: "10.00",
              moneda: "GTQ",
              estado: "inventado",
              id_reembolso_externo:
                externalRefundId,
              motivo: "QA integrity invalid state",
              fecha_reembolso: new Date(
                "2031-01-10T17:00:00.000Z"
              ),
            }),
          findPersisted: () =>
            Reembolso.findAll({
              where: {
                id_reembolso_externo:
                  externalRefundId,
              },
            }),
        });
      }
    );
  }
);
