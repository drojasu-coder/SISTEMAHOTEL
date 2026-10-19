import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const stripeMock = vi.hoisted(
  () => {
    let sequence = 0;

    return {
      createPaymentIntent:
        vi.fn(
          async (
            amount: number | string,
            currency: string,
            metadata: Record<string, string>,
            idempotencyKey?: string
          ) => {
            sequence += 1;

            const id =
              `pi_qa_${String(sequence).padStart(3, "0")}`;

            return {
              id,
              status:
                "requires_payment_method",
              client_secret:
                `${id}_secret_qa_local`,
              amount:
                Math.round(
                  Number(amount) *
                    100
                ),
              currency:
                currency.toLowerCase(),
              metadata,
              idempotency_key:
                idempotencyKey,
            };
          }
        ),
    };
  }
);

/**
 * Mock completo y local del módulo: el archivo de producción que instancia
 * el SDK de Stripe no se evalúa en este test.
 */
vi.mock(
  "../../src/services/stripe.service",
  () => ({
    toStripeAmount: (
      amount: number | string,
      currency: string
    ) => {
      if (currency !== "GTQ") {
        throw new Error(
          "Moneda inesperada en mock Stripe QA"
        );
      }

      return Math.round(
        Number(amount) * 100
      );
    },

    stripeService: {
      createPaymentIntent:
        stripeMock.createPaymentIntent,

      retrievePaymentIntent:
        vi.fn(() => {
          throw new Error(
            "retrievePaymentIntent no permitido en este test"
          );
        }),

      cancelPaymentIntent:
        vi.fn(() => {
          throw new Error(
            "cancelPaymentIntent no permitido en este test"
          );
        }),

      createRefund:
        vi.fn(() => {
          throw new Error(
            "createRefund no permitido en este test"
          );
        }),

      constructEvent:
        vi.fn(() => {
          throw new Error(
            "constructEvent no permitido en este test"
          );
        }),
    },
  })
);

import request from "supertest";

import app from "../../src/app";

import {
  ROLES,
} from "../../src/constants/roles";

import {
  createAuthenticatedUser,
} from "../helpers/auth";

import {
  createRecursoActividad,
} from "../fixtures/actividades";

const db =
  require("../../src/models");

const {
  Carrito,
  CarritoItem,
  Pago,
  ReservaActividad,
} = db;

const TEST_NAME =
  "QA-PAY-FIN-CANDIDATE-007: limita a una sola exposición pendiente el pago concurrente del mismo carrito";

describe(
  "Pagos concurrentes de actividad",
  () => {
    it(
      TEST_NAME,
      async () => {
        const recurso =
          await createRecursoActividad({
            precio_hora:
              "100.00",
          });

        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const reservaResponse =
          await request(app)
            .post(
              "/api/reservas-actividad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              recurso_id:
                recurso.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",

              con_equipo:
                false,
            });

        expect(
          reservaResponse.status
        ).toBe(201);

        expect(
          reservaResponse.body.data.total
        ).toBe("100.00");

        const reservaPersistida =
          await ReservaActividad.findByPk(
            reservaResponse.body.data.id
          );

        expect(
          reservaPersistida
        ).not.toBeNull();

        expect(
          reservaPersistida.total
        ).toBe("100.00");

        const carritoResponse =
          await request(app)
            .post(
              "/api/carritos"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({});

        expect(
          carritoResponse.status
        ).toBe(201);

        const carritoId =
          carritoResponse.body.data.id;

        const itemResponse =
          await request(app)
            .post(
              `/api/carritos/${carritoId}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "actividad",

              referencia_id:
                reservaPersistida.id,
            });

        expect(
          itemResponse.status
        ).toBe(201);

        expect(
          itemResponse.body.data.precio
        ).toBe("100.00");

        const itemsResponse =
          await request(app)
            .get(
              `/api/carritos/${carritoId}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );

        expect(
          itemsResponse.status
        ).toBe(200);

        expect(
          Number(
            itemsResponse.body.data.total
          )
        ).toBe(100);

        const itemsPersistidos =
          await CarritoItem.findAll({
            where: {
              carrito_id:
                carritoId,
            },
          });

        const totalPersistido =
          itemsPersistidos.reduce(
            (
              total: number,
              item: any
            ) =>
              total +
              Number(item.precio) *
                Number(item.cantidad),
            0
          );

        expect(
          totalPersistido
        ).toBe(100);

        const concurrentRequests =
          Array.from(
            {
              length: 20,
            },
            (_, index) =>
              request(app)
                .post(
                  "/api/pagos"
                )
                .set(
                  "Authorization",
                  `Bearer ${cliente.token}`
                )
                .send({
                  carrito_id:
                    carritoId,

                  monto:
                    "100.00",

                  metodo:
                    "tarjeta",

                  tipo_pago:
                    "saldo",

                  moneda:
                    "GTQ",

                  idempotency_key:
                    `qa-pay-fin-007-${String(index + 1).padStart(2, "0")}`,
                })
          );

        const responses =
          await Promise.all(
            concurrentRequests
          );

        const pagosPersistidos =
          await Pago.findAll({
            where: {
              carrito_id:
                carritoId,
            },

            order: [
              [
                "id",
                "ASC",
              ],
            ],
          });

        const carritoPersistido =
          await Carrito.findByPk(
            carritoId
          );

        const statusDistribution =
          responses.reduce(
            (
              distribution: Record<string, number>,
              response
            ) => {
              const key =
                `${response.status}:${response.body.code ?? "NO_CODE"}`;

              distribution[key] =
                (distribution[key] ?? 0) +
                1;

              return distribution;
            },
            {}
          );

        const mockCalls =
          stripeMock.createPaymentIntent
            .mock.calls.map(
              (
                [
                  amount,
                  currency,
                  metadata,
                  idempotencyKey,
                ],
                index
              ) => ({
                id:
                  `pi_qa_${String(index + 1).padStart(3, "0")}`,

                amount,

                amountMinorUnits:
                  Math.round(
                    Number(amount) *
                      100
                  ),

                amountEquivalent:
                  Number(amount),

                currency,

                metadata,

                idempotencyKey,
              })
            );

        const processingPayments =
          pagosPersistidos.filter(
            (payment: any) =>
              payment.estado ===
              "procesando"
          );

        const pendingPayments =
          pagosPersistidos.filter(
            (payment: any) =>
              payment.estado ===
              "pendiente"
          );

        const approvedPayments =
          pagosPersistidos.filter(
            (payment: any) =>
              payment.estado ===
              "aprobado"
          );

        const processingAmount =
          processingPayments.reduce(
            (
              total: number,
              payment: any
            ) =>
              total +
              Number(payment.monto),
            0
          );

        const pendingExposure =
          processingAmount +
          pendingPayments.reduce(
            (
              total: number,
              payment: any
            ) =>
              total +
              Number(payment.monto),
            0
          );

        const approvedAmount =
          approvedPayments.reduce(
            (
              total: number,
              payment: any
            ) =>
              total +
              Number(payment.monto),
            0
          );

        const successfulResponses =
          responses.filter(
            (response) =>
              response.status === 201
          );

        const unexpectedServerErrors =
          responses.filter(
            (response) =>
              response.status >= 500
          );

        console.log(
          "[QA-PAY-FIN-CANDIDATE-007]",
          JSON.stringify(
            {
              stripeMode:
                "MOCK",

              realStripeCharges:
                false,

              cart: {
                id:
                  carritoId,

                httpTotal:
                  itemsResponse.body.data.total,

                databaseTotal:
                  totalPersistido.toFixed(2),

                state:
                  carritoPersistido?.estado ??
                  null,
              },

              concurrentRequests:
                responses.length,

              http: {
                distribution:
                  statusDistribution,

                successfulCount:
                  successfulResponses.length,

                results:
                  responses.map(
                    (response) => ({
                      status:
                        response.status,

                      code:
                        response.body.code ??
                        null,

                      paymentId:
                        response.body.data?.pago_id ??
                        null,

                      paymentIntentId:
                        response.body.data?.payment_intent_id ??
                        null,
                    })
                  ),
              },

              paymentIntents: {
                created:
                  mockCalls.length,

                calls:
                  mockCalls,
              },

              database: {
                localPaymentsCreated:
                  pagosPersistidos.length,

                states:
                  pagosPersistidos.reduce(
                    (
                      states: Record<string, number>,
                      payment: any
                    ) => {
                      states[payment.estado] =
                        (states[payment.estado] ?? 0) +
                        1;

                      return states;
                    },
                    {}
                  ),

                payments:
                  pagosPersistidos.map(
                    (payment: any) => ({
                      id:
                        payment.id,

                      estado:
                        payment.estado,

                      monto:
                        payment.monto,

                      idTransaccionExterno:
                        payment.id_transaccion_externo,

                      idempotencyKey:
                        payment.idempotency_key,
                    })
                  ),

                processingAmount:
                  processingAmount.toFixed(2),

                pendingExposure:
                  pendingExposure.toFixed(2),

                approvedAmount:
                  approvedAmount.toFixed(2),
              },

              maxLegitimateExposure:
                "100.00",
            },
            null,
            2
          )
        );

        expect(
          responses
        ).toHaveLength(20);

        expect(
          unexpectedServerErrors
        ).toHaveLength(0);

        expect(
          successfulResponses.length,
          "Solo una solicitud puede reservar el saldo completo"
        ).toBeLessThanOrEqual(1);

        expect(
          mockCalls.length,
          "Como máximo debe crearse un PaymentIntent para el saldo de Q100.00"
        ).toBeLessThanOrEqual(1);

        expect(
          mockCalls.reduce(
            (
              total,
              call
            ) =>
              total +
              call.amountEquivalent,
            0
          ),
          "La exposición externa total no debe superar Q100.00"
        ).toBeLessThanOrEqual(100);

        expect(
          processingPayments.length,
          "Como máximo debe persistirse un pago procesando para el saldo"
        ).toBeLessThanOrEqual(1);

        expect(
          pendingExposure,
          "La exposición pendiente persistida no debe superar Q100.00"
        ).toBeLessThanOrEqual(100);

        expect(
          pendingExposure +
            approvedAmount,
          "La exposición pendiente más lo aprobado no debe superar el total del carrito"
        ).toBeLessThanOrEqual(100);
      },
      30000
    );
  }
);
