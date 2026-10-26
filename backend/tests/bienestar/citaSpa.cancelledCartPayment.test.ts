import { describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../src/app";
import { ROLES } from "../../src/constants/roles";
import { createAuthenticatedUser } from "../helpers/auth";

const db = require("../../src/models");
const {
  Carrito,
  CarritoItem,
  CitaBienestar,
  Pago,
  Reembolso,
} = db;

const TEST_NAME =
  "QA-SPA-FIN-CANDIDATE-046: rechaza pagar una cita de bienestar cancelada después de agregarla al carrito";

describe("Pago de CitaBienestar cancelada después del ADD", () => {
  it(
    TEST_NAME,
    async () => {
      const cliente = await createAuthenticatedUser({ rol: ROLES.CLIENTE });
      const paymentActor = await createAuthenticatedUser({ rol: ROLES.ADMIN });
      const clientAuthorization = `Bearer ${cliente.token}`;
      const paymentActorAuthorization = `Bearer ${paymentActor.token}`;

      const therapistResponse = await request(app)
        .post("/api/terapeutas")
        .set("Authorization", paymentActorAuthorization)
        .send({
          nombre: "Terapeuta QA SPA FIN 046",
          activo: true,
        });
      expect(therapistResponse.status).toBe(201);
      const therapistId = Number(therapistResponse.body.data.id);

      const serviceResponse = await request(app)
        .post("/api/servicios-spa")
        .set("Authorization", paymentActorAuthorization)
        .send({
          nombre: "Masaje QA SPA FIN 046",
          duracion_minutos: 60,
          precio: 350,
        });
      expect(serviceResponse.status).toBe(201);
      expect(Number(serviceResponse.body.data.precio)).toBe(350);
      const serviceId = Number(serviceResponse.body.data.id);

      const citaResponse = await request(app)
        .post("/api/citas-spa")
        .set("Authorization", clientAuthorization)
        .send({
          terapeuta_id: therapistId,
          servicio_bienestar_id: serviceId,
          fecha: "2035-10-25",
          hora_inicio: "10:00",
        });
      expect(citaResponse.status).toBe(201);
      expect(citaResponse.body.data.estado).toBe("confirmada");
      expect(Number(citaResponse.body.data.usuario_id)).toBe(
        Number(cliente.usuario.id)
      );
      const citaId = Number(citaResponse.body.data.id);

      const cartResponse = await request(app)
        .post("/api/carritos")
        .set("Authorization", clientAuthorization)
        .send({});
      expect(cartResponse.status).toBe(201);
      const cartId = Number(cartResponse.body.data.id);

      const addResponse = await request(app)
        .post(`/api/carritos/${cartId}/items`)
        .set("Authorization", clientAuthorization)
        .send({
          tipo_item: "bienestar",
          referencia_id: citaId,
        });
      expect(addResponse.status).toBe(201);
      const cartItemId = Number(addResponse.body.data.id);

      const citaBeforeCancel = await CitaBienestar.findByPk(citaId);
      const cartBeforeCancel = await Carrito.findByPk(cartId);
      const itemBeforeCancel = await CarritoItem.findByPk(cartItemId);
      const paymentsBefore = await Pago.findAll({
        where: { carrito_id: cartId },
        order: [["id", "ASC"]],
      });

      expect(citaBeforeCancel).not.toBeNull();
      expect(citaBeforeCancel.estado).toBe("confirmada");
      expect(cartBeforeCancel).not.toBeNull();
      expect(cartBeforeCancel.estado).toBe("activo");
      expect(itemBeforeCancel).not.toBeNull();
      expect(itemBeforeCancel.tipo_item).toBe("bienestar");
      expect(Number(itemBeforeCancel.referencia_id)).toBe(citaId);
      expect(Number(itemBeforeCancel.precio)).toBe(350);
      expect(paymentsBefore).toHaveLength(0);

      const cancelResponse = await request(app)
        .patch(`/api/citas-spa/${citaId}/estado`)
        .set("Authorization", paymentActorAuthorization)
        .send({ estado: "cancelada" });
      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.data.estado).toBe("cancelada");

      const citaAfterCancel = await CitaBienestar.findByPk(citaId);
      const cartAfterCancel = await Carrito.findByPk(cartId);
      const itemAfterCancel = await CarritoItem.findByPk(cartItemId);
      const paymentsAfterCancel = await Pago.findAll({
        where: { carrito_id: cartId },
        order: [["id", "ASC"]],
      });

      expect(citaAfterCancel).not.toBeNull();
      expect(citaAfterCancel.estado).toBe("cancelada");
      expect(cartAfterCancel).not.toBeNull();
      expect(cartAfterCancel.estado).toBe("activo");
      expect(itemAfterCancel).not.toBeNull();
      expect(Number(itemAfterCancel.precio)).toBe(350);
      expect(paymentsAfterCancel).toHaveLength(0);

      const paymentResponse = await request(app)
        .post("/api/pagos")
        .set("Authorization", paymentActorAuthorization)
        .send({
          carrito_id: cartId,
          monto: "350.00",
          metodo: "efectivo",
          tipo_pago: "total",
          moneda: "GTQ",
          idempotency_key: "qa-spa-fin-candidate-046-cash",
        });

      const finalCita = await CitaBienestar.findByPk(citaId);
      const finalCart = await Carrito.findByPk(cartId);
      const finalItem = await CarritoItem.findByPk(cartItemId);
      const finalPayments = await Pago.findAll({
        where: { carrito_id: cartId },
        order: [["id", "ASC"]],
      });
      const paymentIds = finalPayments.map((payment: any) => Number(payment.id));
      const finalRefunds = paymentIds.length === 0
        ? []
        : await Reembolso.findAll({
            where: { pago_id: paymentIds },
            order: [["id", "ASC"]],
          });
      const approvedStates = new Set([
        "aprobado",
        "reembolsado_parcial",
        "reembolsado",
      ]);
      const approvedAmount = finalPayments
        .filter((payment: any) => approvedStates.has(String(payment.estado)))
        .reduce(
          (total: number, payment: any) => total + Number(payment.monto),
          0
        );
      const approvedRefunds = finalRefunds
        .filter((refund: any) => refund.estado === "aprobado")
        .reduce(
          (total: number, refund: any) => total + Number(refund.monto),
          0
        );
      const netApproved = approvedAmount - approvedRefunds;
      const durableFinancialCommitment =
        finalPayments.length > 0 ||
        approvedAmount > 0 ||
        finalCart?.estado === "pagado";
      const canceledReferencePaid =
        finalCita?.estado === "cancelada" &&
        (netApproved > 0 || finalCart?.estado === "pagado");

      console.log(
        "[QA-SPA-FIN-CANDIDATE-046]",
        JSON.stringify(
          {
            qaId: "QA-SPA-FIN-CANDIDATE-046",
            database: "hotel_test_db",
            invariant:
              "Una CitaBienestar cancelada no puede originar un nuevo compromiso financiero desde un CarritoItem histórico",
            actors: {
              clientId: Number(cliente.usuario.id),
              paymentActorId: Number(paymentActor.usuario.id),
              paymentActorRole: paymentActor.usuario.rol,
              cancellationActorId: Number(paymentActor.usuario.id),
              cancellationActorRole: paymentActor.usuario.rol,
            },
            ids: {
              therapistId,
              serviceId,
              citaId,
              cartId,
              cartItemId,
              paymentIds,
            },
            service: {
              price: Number(serviceResponse.body.data.precio).toFixed(2),
              durationMinutes: Number(
                serviceResponse.body.data.duracion_minutos
              ),
            },
            http: {
              citaCreate: citaResponse.status,
              cartCreate: cartResponse.status,
              addItem: addResponse.status,
              cancel: {
                status: cancelResponse.status,
                code: cancelResponse.body.code ?? null,
                state: cancelResponse.body.data?.estado ?? null,
              },
              payment: {
                status: paymentResponse.status,
                code: paymentResponse.body.code ?? null,
                body: paymentResponse.body,
              },
            },
            databaseBeforeCancel: {
              cita: citaBeforeCancel?.toJSON() ?? null,
              cart: cartBeforeCancel?.toJSON() ?? null,
              item: itemBeforeCancel?.toJSON() ?? null,
              payments: paymentsBefore.map((payment: any) => payment.toJSON()),
            },
            databaseAfterCancel: {
              cita: citaAfterCancel?.toJSON() ?? null,
              cart: cartAfterCancel?.toJSON() ?? null,
              item: itemAfterCancel?.toJSON() ?? null,
              payments: paymentsAfterCancel.map((payment: any) =>
                payment.toJSON()
              ),
            },
            databaseAfterPaymentAttempt: {
              cita: finalCita?.toJSON() ?? null,
              cart: finalCart?.toJSON() ?? null,
              item: finalItem?.toJSON() ?? null,
              payments: finalPayments.map((payment: any) => payment.toJSON()),
              refunds: finalRefunds.map((refund: any) => refund.toJSON()),
            },
            financial: {
              paymentMethod: "efectivo",
              paymentCount: finalPayments.length,
              paymentState: finalPayments[0]?.estado ?? null,
              paymentAmount: finalPayments[0]?.monto ?? null,
              approvedAmount: approvedAmount.toFixed(2),
              approvedRefunds: approvedRefunds.toFixed(2),
              netApproved: netApproved.toFixed(2),
              durableFinancialCommitment,
              canceledReferencePaid,
              financialViolation: durableFinancialCommitment,
            },
            stripe: {
              realCalls: 0,
              rationale:
                "El intento usa efectivo; no se importó ni simuló Stripe y la rama de tarjeta no se ejecutó",
            },
            expectedSafeBehavior: {
              payment: "HTTP 409 CART_REFERENCE_NOT_AVAILABLE",
              paymentRows: 0,
              cartState: "activo",
              citaState: "cancelada",
              itemMayPersist: true,
              approvedAmount: "0.00",
            },
          },
          null,
          2
        )
      );

      expect.soft(
        paymentResponse.status,
        "El pago debe revalidar la CitaBienestar cancelada"
      ).toBe(409);
      expect.soft(paymentResponse.body.code).toBe(
        "CART_REFERENCE_NOT_AVAILABLE"
      );
      expect.soft(
        finalPayments,
        "El intento rechazado no debe persistir ningún Pago"
      ).toHaveLength(0);
      expect.soft(finalRefunds).toHaveLength(0);
      expect.soft(finalCart?.estado).toBe("activo");
      expect.soft(finalCita?.estado).toBe("cancelada");
      expect.soft(finalItem).not.toBeNull();
      expect.soft(approvedAmount).toBe(0);
      expect.soft(netApproved).toBe(0);
      expect.soft(durableFinancialCommitment).toBe(false);
      expect.soft(canceledReferencePaid).toBe(false);
    },
    30000
  );
});
