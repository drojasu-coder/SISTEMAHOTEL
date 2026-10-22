import {
  describe,
  expect,
  it,
} from "vitest";
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
  Reembolso,
  ReservaActividad,
} = db;

const TEST_NAME =
  "QA-RA-FIN-CANDIDATE-017: rechaza pagar una actividad cancelada después de agregarla al carrito";

describe(
  "Pago de actividad cancelada después del ADD",
  () => {
    it(
      TEST_NAME,
      async () => {
        const cliente =
          await createAuthenticatedUser({
            rol: ROLES.CLIENTE,
          });
        const admin =
          await createAuthenticatedUser({
            rol: ROLES.ADMIN,
          });
        const recurso =
          await createRecursoActividad({
            precio_hora: "100.00",
          });
        const clientAuthorization =
          `Bearer ${cliente.token}`;
        const adminAuthorization =
          `Bearer ${admin.token}`;

        const reservationResponse =
          await request(app)
            .post("/api/reservas-actividad")
            .set(
              "Authorization",
              clientAuthorization
            )
            .send({
              recurso_id: recurso.id,
              fecha: "2027-06-10",
              hora_inicio: "10:00",
              hora_fin: "11:00",
              con_equipo: false,
            });

        expect(
          reservationResponse.status
        ).toBe(201);
        expect(
          reservationResponse.body.data.estado
        ).toBe("confirmada");
        expect(
          reservationResponse.body.data.total
        ).toBe("100.00");

        const reservationId =
          Number(
            reservationResponse.body.data.id
          );
        const reservationAfterCreate =
          await ReservaActividad.findByPk(
            reservationId
          );

        expect(
          reservationAfterCreate
        ).not.toBeNull();
        expect(
          reservationAfterCreate.estado
        ).toBe("confirmada");
        expect(
          reservationAfterCreate.total
        ).toBe("100.00");

        const cartResponse =
          await request(app)
            .post("/api/carritos")
            .set(
              "Authorization",
              clientAuthorization
            )
            .send({});

        expect(
          cartResponse.status
        ).toBe(201);

        const cartId =
          Number(
            cartResponse.body.data.id
          );
        const addResponse =
          await request(app)
            .post(
              `/api/carritos/${cartId}/items`
            )
            .set(
              "Authorization",
              clientAuthorization
            )
            .send({
              tipo_item: "actividad",
              referencia_id: reservationId,
            });

        expect(
          addResponse.status
        ).toBe(201);
        expect(
          addResponse.body.data.precio
        ).toBe("100.00");

        const cartItemsResponse =
          await request(app)
            .get(
              `/api/carritos/${cartId}/items`
            )
            .set(
              "Authorization",
              clientAuthorization
            );

        expect(
          cartItemsResponse.status
        ).toBe(200);
        expect(
          cartItemsResponse.body.data.items
        ).toHaveLength(1);
        expect(
          Number(
            cartItemsResponse.body.data.total
          )
        ).toBe(100);

        const itemAfterAdd =
          await CarritoItem.findOne({
            where: {
              carrito_id: cartId,
              tipo_item: "actividad",
              referencia_id: reservationId,
            },
          });
        const persistedCartTotal =
          Number(itemAfterAdd?.precio ?? 0) *
          Number(itemAfterAdd?.cantidad ?? 0);

        expect(
          itemAfterAdd
        ).not.toBeNull();
        expect(
          persistedCartTotal
        ).toBe(100);

        const cancelResponse =
          await request(app)
            .patch(
              `/api/reservas-actividad/${reservationId}/estado`
            )
            .set(
              "Authorization",
              adminAuthorization
            )
            .send({
              estado: "cancelada",
            });

        expect(
          cancelResponse.status
        ).toBe(200);
        expect(
          cancelResponse.body.data.estado
        ).toBe("cancelada");

        const reservationBeforePayment =
          await ReservaActividad.findByPk(
            reservationId
          );

        expect(
          reservationBeforePayment.estado
        ).toBe("cancelada");

        const cartBeforePayment =
          await Carrito.findByPk(
            cartId
          );
        const itemBeforePayment =
          await CarritoItem.findOne({
            where: {
              carrito_id: cartId,
              tipo_item: "actividad",
              referencia_id: reservationId,
            },
          });

        expect(
          cartBeforePayment.estado
        ).toBe("activo");
        expect(
          itemBeforePayment
        ).not.toBeNull();

        const paymentResponse =
          await request(app)
            .post("/api/pagos")
            .set(
              "Authorization",
              clientAuthorization
            )
            .send({
              carrito_id: cartId,
              monto: "100.00",
              metodo: "efectivo",
              tipo_pago: "total",
              moneda: "GTQ",
              idempotency_key:
                "qa-ra-fin-candidate-017-payment",
            });

        const persistedPayments =
          await Pago.findAll({
            where: {
              carrito_id: cartId,
            },
            order: [["id", "ASC"]],
          });
        const paymentIds =
          persistedPayments.map(
            (payment: any) =>
              Number(payment.id)
          );
        const refunds =
          paymentIds.length > 0
            ? await Reembolso.findAll({
                where: {
                  pago_id: paymentIds,
                  estado: "aprobado",
                },
              })
            : [];
        const approvedAmount =
          persistedPayments
            .filter(
              (payment: any) =>
                [
                  "aprobado",
                  "reembolsado_parcial",
                  "reembolsado",
                ].includes(payment.estado)
            )
            .reduce(
              (
                total: number,
                payment: any
              ) =>
                total +
                Number(payment.monto),
              0
            );
        const approvedRefunds =
          refunds.reduce(
            (
              total: number,
              refund: any
            ) =>
              total +
              Number(refund.monto),
            0
          );
        const netApproved =
          approvedAmount -
          approvedRefunds;
        const finalCart =
          await Carrito.findByPk(
            cartId
          );
        const finalReservation =
          await ReservaActividad.findByPk(
            reservationId
          );
        const finalItem =
          await CarritoItem.findOne({
            where: {
              carrito_id: cartId,
              tipo_item: "actividad",
              referencia_id: reservationId,
            },
          });
        const canceledServiceCharged =
          finalReservation?.estado ===
            "cancelada" &&
          finalItem !== null &&
          (
            approvedAmount > 0 ||
            finalCart?.estado === "pagado"
          );

        console.log(
          "[QA-RA-FIN-CANDIDATE-017]",
          JSON.stringify(
            {
              database: "hotel_test_db",
              paymentMethod: "efectivo",
              realStripeCharges: false,
              reservationCreate: {
                status:
                  reservationResponse.status,
                state:
                  reservationAfterCreate.estado,
              },
              reservationTotal: {
                http:
                  reservationResponse.body.data.total,
                persisted:
                  reservationAfterCreate.total,
              },
              cartAdd: {
                status: addResponse.status,
                itemId:
                  addResponse.body.data.id,
                price:
                  addResponse.body.data.precio,
                httpTotal:
                  cartItemsResponse.body.data.total,
                persistedTotal:
                  persistedCartTotal.toFixed(2),
              },
              cartItemPersisted:
                itemAfterAdd !== null,
              reservationCancel: {
                status: cancelResponse.status,
                state:
                  cancelResponse.body.data.estado,
              },
              reservationStateBeforePayment:
                reservationBeforePayment.estado,
              cartStateBeforePayment:
                cartBeforePayment.estado,
              cartItemBeforePayment:
                itemBeforePayment !== null,
              paymentAttempt: {
                status: paymentResponse.status,
                code:
                  paymentResponse.body.code ??
                  null,
              },
              paymentPersisted:
                persistedPayments.length > 0,
              paymentState:
                persistedPayments[0]?.estado ??
                null,
              cartState:
                finalCart?.estado ?? null,
              reservationStateAfterPayment:
                finalReservation?.estado ?? null,
              cartItemAfterPayment:
                finalItem !== null,
              approvedAmount:
                approvedAmount.toFixed(2),
              approvedRefunds:
                approvedRefunds.toFixed(2),
              netApproved:
                netApproved.toFixed(2),
              canceledServiceCharged,
              financialViolation:
                canceledServiceCharged,
            },
            null,
            2
          )
        );

        expect.soft(
          paymentResponse.status,
          "El pago debe rechazarse antes de aprobar dinero para una actividad cancelada"
        ).toBe(409);
        expect.soft(
          paymentResponse.body.code,
          "El pago debe identificar que la referencia del carrito ya no está disponible"
        ).toBe(
          "CART_REFERENCE_NOT_AVAILABLE"
        );
        expect.soft(
          persistedPayments,
          "El intento rechazado no debe persistir Pago"
        ).toHaveLength(0);
        expect.soft(
          finalCart?.estado
        ).toBe("activo");
        expect.soft(
          finalReservation?.estado
        ).toBe("cancelada");
        expect.soft(
          finalItem
        ).not.toBeNull();
        expect.soft(
          approvedAmount
        ).toBe(0);
        expect.soft(
          netApproved
        ).toBe(0);
        expect.soft(
          canceledServiceCharged
        ).toBe(false);
      },
      30000
    );
  }
);
