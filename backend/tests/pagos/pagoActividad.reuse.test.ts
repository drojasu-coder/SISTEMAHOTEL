import {
  describe,
  expect,
  it,
} from "vitest";

import {
  Op,
} from "sequelize";
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

const db =
  require("../../src/models");

const {
  Carrito,
  CarritoItem,
  Pago,
  Reembolso,
  ReservaActividad,
} = db;

const TEST_NAME =
  "QA-RA-FIN-CANDIDATE-008: rechaza reutilizar una reserva de actividad con dinero aprobado";

const paymentStatesWithApprovedMoney =
  new Set([
    "aprobado",
    "reembolsado_parcial",
    "reembolsado",
  ]);

const calculateNetApproved = async (
  cartIds: number[]
) => {
  if (
    cartIds.length === 0
  ) {
    return {
      payments: [],
      refunds: [],
      net: 0,
    };
  }

  const payments =
    await Pago.findAll({
      where: {
        carrito_id: {
          [Op.in]:
            cartIds,
        },
      },
      order: [
        [
          "id",
          "ASC",
        ],
      ],
    });

  const paymentIds =
    payments.map(
      (payment: any) =>
        Number(payment.id)
    );

  const refunds =
    paymentIds.length > 0
      ? await Reembolso.findAll({
          where: {
            pago_id: {
              [Op.in]:
                paymentIds,
            },
          },
          order: [
            [
              "id",
              "ASC",
            ],
          ],
        })
      : [];

  const net =
    payments.reduce(
      (
        total: number,
        payment: any
      ) => {
        if (
          !paymentStatesWithApprovedMoney.has(
            payment.estado
          )
        ) {
          return total;
        }

        const approvedRefunds =
          refunds
            .filter(
              (refund: any) =>
                Number(
                  refund.pago_id
                ) ===
                  Number(
                    payment.id
                  ) &&
                refund.estado ===
                  "aprobado"
            )
            .reduce(
              (
                refunded: number,
                refund: any
              ) =>
                refunded +
                Number(
                  refund.monto
                ),
              0
            );

        return total +
          Math.max(
            0,
            Number(
              payment.monto
            ) -
              approvedRefunds
          );
      },
      0
    );

  return {
    payments,
    refunds,
    net:
      Math.round(
        (
          net +
          Number.EPSILON
        ) * 100
      ) / 100,
  };
};

describe(
  "Reutilización financiera de reserva de actividad",
  () => {
    it(
      TEST_NAME,
      async () => {
        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const recurso =
          await createRecursoActividad({
            precio_hora:
              "100.00",
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

        const reservaId =
          Number(
            reservaResponse.body.data.id
          );
        const reservaPersistida =
          await ReservaActividad.findByPk(
            reservaId
          );

        expect(
          reservaPersistida
        ).not.toBeNull();
        expect(
          reservaPersistida.total
        ).toBe("100.00");

        const cartAResponse =
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
          cartAResponse.status
        ).toBe(201);

        const cartAId =
          Number(
            cartAResponse.body.data.id
          );
        const addAResponse =
          await request(app)
            .post(
              `/api/carritos/${cartAId}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "actividad",
              referencia_id:
                reservaId,
            });

        expect(
          addAResponse.status
        ).toBe(201);
        expect(
          addAResponse.body.data.precio
        ).toBe("100.00");

        const paymentAResponse =
          await request(app)
            .post(
              "/api/pagos"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              carrito_id:
                cartAId,
              monto:
                "100.00",
              metodo:
                "efectivo",
              tipo_pago:
                "total",
              moneda:
                "GTQ",
              idempotency_key:
                "qa-ra-fin-candidate-008-a",
            });

        expect(
          paymentAResponse.status
        ).toBe(201);
        expect(
          paymentAResponse.body.data.estado
        ).toBe("aprobado");
        expect(
          paymentAResponse.body.data.monto
        ).toBe("100.00");

        const paymentA =
          await Pago.findByPk(
            paymentAResponse.body.data.id
          );
        const cartA =
          await Carrito.findByPk(
            cartAId
          );
        const firstFinancialState =
          await calculateNetApproved([
            cartAId,
          ]);

        expect(
          paymentA
        ).not.toBeNull();
        expect(
          paymentA.estado
        ).toBe("aprobado");
        expect(
          paymentA.monto
        ).toBe("100.00");
        expect(
          cartA.estado
        ).toBe("pagado");
        expect(
          firstFinancialState.net
        ).toBe(100);

        const cartBResponse =
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
          cartBResponse.status
        ).toBe(201);

        const cartBId =
          Number(
            cartBResponse.body.data.id
          );
        const addBResponse =
          await request(app)
            .post(
              `/api/carritos/${cartBId}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "actividad",
              referencia_id:
                reservaId,
            });

        const itemB =
          await CarritoItem.findOne({
            where: {
              carrito_id:
                cartBId,
              tipo_item:
                "actividad",
              referencia_id:
                reservaId,
            },
          });

        let paymentBResponse:
          any = null;

        if (
          addBResponse.status ===
          201
        ) {
          paymentBResponse =
            await request(app)
              .post(
                "/api/pagos"
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                carrito_id:
                  cartBId,
                monto:
                  "100.00",
                metodo:
                  "efectivo",
                tipo_pago:
                  "total",
                moneda:
                  "GTQ",
                idempotency_key:
                  "qa-ra-fin-candidate-008-b",
              });
        }

        const referenceItems =
          await CarritoItem.findAll({
            where: {
              tipo_item:
                "actividad",
              referencia_id:
                reservaId,
            },
            order: [
              [
                "id",
                "ASC",
              ],
            ],
          });
        const referenceCartIds = [
          ...new Set<number>(
            referenceItems.map(
              (item: any) =>
                Number(
                  item.carrito_id
                )
            )
          ),
        ];
        const finalFinancialState =
          await calculateNetApproved(
            referenceCartIds
          );
        const finalCarts =
          await Carrito.findAll({
            where: {
              id: {
                [Op.in]: [
                  cartAId,
                  cartBId,
                ],
              },
            },
            order: [
              [
                "id",
                "ASC",
              ],
            ],
          });

        const referenceReuseViolation =
          itemB !== null;
        const doubleChargeViolation =
          finalFinancialState.net >
          100;
        const secondPaymentResult =
          paymentBResponse
            ? `HTTP ${paymentBResponse.status} ${paymentBResponse.body.data?.estado ?? paymentBResponse.body.code ?? "NO_STATE"} Q${paymentBResponse.body.data?.monto ?? "NO_AMOUNT"}`
            : "NOT RUN";

        console.log(
          "[QA-RA-FIN-CANDIDATE-008]",
          JSON.stringify(
            {
              paymentMethod:
                "efectivo",
              realStripeCharges:
                false,
              reservation: {
                id:
                  reservaId,
                httpStatus:
                  reservaResponse.status,
                httpTotal:
                  reservaResponse.body.data.total,
                databaseTotal:
                  reservaPersistida.total,
              },
              addA: {
                status:
                  addAResponse.status,
                code:
                  addAResponse.body.code ??
                  null,
                itemId:
                  addAResponse.body.data?.id ??
                  null,
              },
              paymentA: {
                httpStatus:
                  paymentAResponse.status,
                httpEstado:
                  paymentAResponse.body.data.estado,
                httpMonto:
                  paymentAResponse.body.data.monto,
                database: {
                  id:
                    paymentA.id,
                  estado:
                    paymentA.estado,
                  monto:
                    paymentA.monto,
                },
                netApproved:
                  firstFinancialState.net.toFixed(2),
              },
              cartA: {
                id:
                  cartAId,
                estado:
                  cartA.estado,
              },
              addB: {
                status:
                  addBResponse.status,
                code:
                  addBResponse.body.code ??
                  null,
                body:
                  addBResponse.body,
              },
              itemB:
                itemB
                  ? itemB.toJSON()
                  : null,
              paymentB:
                paymentBResponse
                  ? {
                      status:
                        paymentBResponse.status,
                      code:
                        paymentBResponse.body.code ??
                        null,
                      data:
                        paymentBResponse.body.data ??
                        null,
                    }
                  : "NOT RUN",
              cartB:
                finalCarts
                  .find(
                    (cart: any) =>
                      Number(cart.id) ===
                      cartBId
                  )
                  ?.toJSON() ??
                null,
              referenceItems:
                referenceItems.map(
                  (item: any) =>
                    item.toJSON()
                ),
              payments:
                finalFinancialState.payments.map(
                  (payment: any) =>
                    payment.toJSON()
                ),
              refunds:
                finalFinancialState.refunds.map(
                  (refund: any) =>
                    refund.toJSON()
                ),
              totalNetApprovedForReference:
                finalFinancialState.net.toFixed(2),
              maxLegitimateNetApproved:
                "100.00",
              referenceReuseViolation,
              doubleChargeViolation,
            },
            null,
            2
          )
        );

        expect.soft(
          addBResponse.status,
          "Una actividad con dinero aprobado debe rechazarse al agregarla a otro carrito"
        ).toBe(409);
        expect.soft(
          addBResponse.body.code,
          "Debe reutilizarse el código financiero existente"
        ).toBe(
          "CART_REFERENCE_NOT_AVAILABLE"
        );
        expect.soft(
          itemB,
          "El segundo carrito no debe persistir la referencia financieramente comprometida"
        ).toBeNull();
        expect.soft(
          secondPaymentResult,
          "El segundo pago no debe ejecutarse porque el segundo add debe rechazarse"
        ).toBe("NOT RUN");
        expect.soft(
          finalFinancialState.net,
          "El dinero neto aprobado atribuible a la actividad no debe superar Q100.00"
        ).toBeLessThanOrEqual(100);
      },
      30000
    );
  }
);
