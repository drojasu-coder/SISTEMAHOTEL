import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const stripeMock = vi.hoisted(
  () => {
    const intentIds = [
      "pi_orphan_001",
      "pi_orphan_002",
    ];
    const events: Array<Record<string, unknown>> = [];
    const calls: Array<Record<string, unknown>> = [];
    const createdIntentIds: string[] = [];
    const compensatedIntentIds: string[] = [];

    const createPaymentIntent = vi.fn(
      async (
        amount: number | string,
        currency: string,
        metadata: Record<string, string>,
        idempotencyKey?: string
      ) => {
        const callNumber = calls.length + 1;
        const id = intentIds[callNumber - 1];

        if (!id) {
          throw new Error(
            "createPaymentIntent recibió una llamada Stripe inesperada"
          );
        }

        events.push({
          event: "STRIPE_CREATE_CALLED",
          callNumber,
          id,
        });

        const intent = {
          id,
          status: "requires_payment_method",
          client_secret: `${id}_secret_qa_local`,
          amount: Math.round(Number(amount) * 100),
          currency: currency.toLowerCase(),
          metadata,
          idempotency_key: idempotencyKey,
        };

        calls.push({
          callNumber,
          amount,
          amountMinorUnits: intent.amount,
          currency,
          metadata,
          idempotencyKey: idempotencyKey ?? null,
          result: "SUCCESS",
          id,
        });
        createdIntentIds.push(id);
        events.push({
          event: "STRIPE_CREATE_SUCCESS",
          callNumber,
          id,
        });

        return intent;
      }
    );

    const forbidden = (method: string) =>
      vi.fn(() => {
        throw new Error(
          `${method} no permitido en este test`
        );
      });

    const cancelPaymentIntent = vi.fn(
      async (id: string) => {
        events.push({
          event: "STRIPE_CANCEL_CALLED",
          id,
        });

        if (!createdIntentIds.includes(id)) {
          throw new Error(
            `cancelPaymentIntent recibió un intent desconocido: ${id}`
          );
        }

        if (compensatedIntentIds.includes(id)) {
          throw new Error(
            `cancelPaymentIntent recibió un intent ya compensado: ${id}`
          );
        }

        compensatedIntentIds.push(id);
        events.push({
          event: "STRIPE_CANCEL_SUCCESS",
          id,
          status: "canceled",
        });

        return {
          id,
          status: "canceled",
        };
      }
    );

    return {
      events,
      calls,
      createdIntentIds,
      compensatedIntentIds,
      createPaymentIntent,
      retrievePaymentIntent: forbidden(
        "retrievePaymentIntent"
      ),
      cancelPaymentIntent,
      createRefund: forbidden(
        "createRefund"
      ),
      constructEvent: forbidden(
        "constructEvent"
      ),
    };
  }
);

/**
 * Mock completo y local: stripe.service.ts y el SDK real de Stripe no se
 * evalúan. Este archivo no puede generar tráfico, credenciales ni cargos.
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

      return Math.round(Number(amount) * 100);
    },
    stripeService: {
      createPaymentIntent:
        stripeMock.createPaymentIntent,
      retrievePaymentIntent:
        stripeMock.retrievePaymentIntent,
      cancelPaymentIntent:
        stripeMock.cancelPaymentIntent,
      createRefund:
        stripeMock.createRefund,
      constructEvent:
        stripeMock.constructEvent,
    },
  })
);

import request from "supertest";

import app from "../../src/app";
import {
  ROLES,
} from "../../src/constants/roles";
import {
  createRecursoActividad,
} from "../fixtures/actividades";
import {
  createAuthenticatedUser,
} from "../helpers/auth";

const db = require("../../src/models");

const {
  Carrito,
  CarritoItem,
  Pago,
  ReservaActividad,
} = db;

const TEST_NAME =
  "QA-PAY-FIN-CANDIDATE-010: evita PaymentIntent huérfano tras éxito externo y rollback local sin idempotency key";

describe(
  "Atomicidad externa de pago de actividad",
  () => {
    it(
      TEST_NAME,
      async () => {
        const cliente =
          await createAuthenticatedUser({
            rol: ROLES.CLIENTE,
          });
        const recurso =
          await createRecursoActividad({
            precio_hora: "100.00",
          });

        const reservaResponse =
          await request(app)
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

        expect(reservaResponse.status).toBe(201);
        expect(
          reservaResponse.body.data.total
        ).toBe("100.00");

        const reservaPersistida =
          await ReservaActividad.findByPk(
            reservaResponse.body.data.id
          );

        expect(reservaPersistida).not.toBeNull();
        expect(reservaPersistida.total).toBe(
          "100.00"
        );

        const carritoResponse =
          await request(app)
            .post("/api/carritos")
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({});

        expect(carritoResponse.status).toBe(201);

        const carritoId = Number(
          carritoResponse.body.data.id
        );
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
              tipo_item: "actividad",
              referencia_id:
                reservaPersistida.id,
            });

        expect(itemResponse.status).toBe(201);
        expect(itemResponse.body.data.precio).toBe(
          "100.00"
        );

        const itemsResponse =
          await request(app)
            .get(
              `/api/carritos/${carritoId}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );
        const itemsPersistidos =
          await CarritoItem.findAll({
            where: {
              carrito_id: carritoId,
            },
          });
        const totalPersistido =
          itemsPersistidos.reduce(
            (total: number, item: any) =>
              total +
              Number(item.precio) *
                Number(item.cantidad),
            0
          );

        expect(itemsResponse.status).toBe(200);
        expect(
          Number(itemsResponse.body.data.total)
        ).toBe(100);
        expect(totalPersistido).toBe(100);

        const paymentPayload = {
          carrito_id: carritoId,
          monto: "100.00",
          metodo: "tarjeta",
          tipo_pago: "saldo",
          moneda: "GTQ",
        };
        const originalPagoUpdate =
          Pago.prototype.update;
        let injectedFailureCount = 0;

        const updateSpy = vi
          .spyOn(Pago.prototype, "update")
          .mockImplementation(
            async function (
              this: any,
              values: Record<string, unknown>,
              options?: Record<string, unknown>
            ) {
              if (
                injectedFailureCount === 0 &&
                Object.prototype.hasOwnProperty.call(
                  values,
                  "id_transaccion_externo"
                ) &&
                values.id_transaccion_externo ===
                  "pi_orphan_001"
              ) {
                injectedFailureCount += 1;
                stripeMock.events.push({
                  event:
                    "LOCAL_PAGO_UPDATE_FAILURE",
                  paymentId: this.id,
                  idTransaccionExterno:
                    values.id_transaccion_externo,
                });
                throw new Error(
                  "QA injected Pago.update failure for pi_orphan_001"
                );
              }

              return originalPagoUpdate.call(
                this,
                values,
                options
              );
            }
          );

        let firstResponse: any;

        try {
          firstResponse = await request(app)
            .post("/api/pagos")
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send(paymentPayload);
        } finally {
          updateSpy.mockRestore();
        }

        const paymentsAfterFirst =
          await Pago.findAll({
            where: {
              carrito_id: carritoId,
            },
            order: [["id", "ASC"]],
          });
        const firstIntentLocalPayment =
          await Pago.findOne({
            where: {
              id_transaccion_externo:
                "pi_orphan_001",
            },
          });
        const cartAfterFirst =
          await Carrito.findByPk(carritoId);

        const retryResponse =
          await request(app)
            .post("/api/pagos")
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send(paymentPayload);

        const finalPayments =
          await Pago.findAll({
            where: {
              carrito_id: carritoId,
            },
            order: [["id", "ASC"]],
          });
        const finalFirstIntentLocalPayment =
          await Pago.findOne({
            where: {
              id_transaccion_externo:
                "pi_orphan_001",
            },
          });
        const externalIntentIds = [
          ...stripeMock.createdIntentIds,
        ];
        const compensatedExternalIntentIds = [
          ...stripeMock.compensatedIntentIds,
        ];
        const localExternalIntentIds =
          finalPayments
            .map((payment: any) =>
              payment.id_transaccion_externo
            )
            .filter(Boolean);
        const orphanedExternalIntents =
          externalIntentIds.filter(
            (id) =>
              !localExternalIntentIds.includes(id) &&
              !compensatedExternalIntentIds.includes(
                id
              )
          );
        const activeUncompensatedExternalIntents =
          externalIntentIds.filter(
            (id) =>
              !compensatedExternalIntentIds.includes(
                id
              )
          );
        const stripeSuccessIndex =
          stripeMock.events.findIndex(
            (event) =>
              event.event ===
                "STRIPE_CREATE_SUCCESS" &&
              event.id === "pi_orphan_001"
          );
        const localFailureIndex =
          stripeMock.events.findIndex(
            (event) =>
              event.event ===
              "LOCAL_PAGO_UPDATE_FAILURE"
          );
        const failureOccurredAfterStripeSuccess =
          stripeSuccessIndex >= 0 &&
          localFailureIndex > stripeSuccessIndex;
        const transactionRollback =
          paymentsAfterFirst.length === 0;
        const firstIntentCompensated =
          compensatedExternalIntentIds.includes(
            "pi_orphan_001"
          );
        const firstIntentOrphaned =
          orphanedExternalIntents.includes(
            "pi_orphan_001"
          );
        const duplicatedActiveExternalAttempt =
          activeUncompensatedExternalIntents.length >
          1;
        const cancelCalledWithFirstIntent =
          stripeMock.cancelPaymentIntent.mock.calls.some(
            ([id]) => id === "pi_orphan_001"
          );

        console.log(
          "[QA-PAY-FIN-CANDIDATE-010]",
          JSON.stringify(
            {
              stripeMode: "MOCK",
              realStripeCharges: false,
              setupTotal: {
                reservationHttp:
                  reservaResponse.body.data.total,
                reservationDatabase:
                  reservaPersistida.total,
                cartHttp:
                  itemsResponse.body.data.total,
                cartDatabase:
                  totalPersistido.toFixed(2),
              },
              chronologicalEvents:
                stripeMock.events,
              firstHttp: {
                status: firstResponse.status,
                code:
                  firstResponse.body.code ?? null,
                body: firstResponse.body,
              },
              stripe: {
                calls: stripeMock.calls,
                callCount:
                  stripeMock.calls.length,
                createdIntentIds:
                  externalIntentIds,
                compensatedIntentIds:
                  compensatedExternalIntentIds,
                activeUncompensatedExternalIntents,
                orphanedExternalIntents,
              },
              firstDatabase: {
                paymentCount:
                  paymentsAfterFirst.length,
                firstPaymentId:
                  paymentsAfterFirst[0]?.id ??
                  null,
                paymentWithFirstIntent:
                  firstIntentLocalPayment?.id ??
                  null,
                cartState:
                  cartAfterFirst?.estado ?? null,
              },
              rollback: transactionRollback,
              retryHttp: {
                status: retryResponse.status,
                code:
                  retryResponse.body.code ?? null,
                data:
                  retryResponse.body.data ?? null,
              },
              finalDatabase: {
                paymentCount:
                  finalPayments.length,
                payments: finalPayments.map(
                  (payment: any) => ({
                    id: payment.id,
                    estado: payment.estado,
                    monto: payment.monto,
                    externalId:
                      payment.id_transaccion_externo,
                  })
                ),
                localPaymentExternalId:
                  finalPayments[0]
                    ?.id_transaccion_externo ?? null,
              },
              invariant: {
                CANCEL_FIRST_INTENT_CALLED:
                  cancelCalledWithFirstIntent,
                FIRST_INTENT_COMPENSATED:
                  firstIntentCompensated,
                FIRST_INTENT_ORPHANED:
                  firstIntentOrphaned,
                DUPLICATED_ACTIVE_EXTERNAL_ATTEMPT:
                  duplicatedActiveExternalAttempt,
              },
            },
            null,
            2
          )
        );

        expect.soft(firstResponse.status).toBe(500);
        expect.soft(firstResponse.body.code).toBe(
          "PAYMENT_LOCAL_PERSISTENCE_FAILED"
        );
        expect(
          stripeMock.calls[0]?.result
        ).toBe("SUCCESS");
        expect(externalIntentIds[0]).toBe(
          "pi_orphan_001"
        );
        expect(injectedFailureCount).toBe(1);
        expect(
          failureOccurredAfterStripeSuccess
        ).toBe(true);
        expect(transactionRollback).toBe(true);
        expect(paymentsAfterFirst).toHaveLength(0);
        expect(firstIntentLocalPayment).toBeNull();
        expect(cartAfterFirst.estado).toBe("activo");
        expect(retryResponse.status).toBe(201);
        expect(
          retryResponse.body.data
            .payment_intent_id
        ).toBe("pi_orphan_002");
        expect(stripeMock.calls).toHaveLength(2);
        expect(finalPayments).toHaveLength(1);
        expect(finalPayments[0].estado).toBe(
          "procesando"
        );
        expect(
          finalPayments[0]
            .id_transaccion_externo
        ).toBe("pi_orphan_002");
        expect(
          finalFirstIntentLocalPayment
        ).toBeNull();
        expect(
          stripeMock.retrievePaymentIntent
        ).not.toHaveBeenCalled();
        expect(
          stripeMock.createRefund
        ).not.toHaveBeenCalled();
        expect(
          stripeMock.constructEvent
        ).not.toHaveBeenCalled();

        expect(
          {
            CANCEL_FIRST_INTENT_CALLED:
              cancelCalledWithFirstIntent,
            FIRST_INTENT_COMPENSATED:
              firstIntentCompensated,
            FIRST_INTENT_ORPHANED:
              firstIntentOrphaned,
            ACTIVE_UNCOMPENSATED_EXTERNAL_INTENTS:
              activeUncompensatedExternalIntents,
            DUPLICATED_ACTIVE_EXTERNAL_ATTEMPT:
              duplicatedActiveExternalAttempt,
          },
          "Un éxito externo no debe quedar huérfano ni repetirse como un nuevo intento externo tras rollback local"
        ).toEqual({
          CANCEL_FIRST_INTENT_CALLED: true,
          FIRST_INTENT_COMPENSATED: true,
          FIRST_INTENT_ORPHANED: false,
          ACTIVE_UNCOMPENSATED_EXTERNAL_INTENTS: [
            "pi_orphan_002",
          ],
          DUPLICATED_ACTIVE_EXTERNAL_ATTEMPT: false,
        });
      },
      30000
    );
  }
);
