import {
  describe,
  expect,
  it,
} from "vitest";

import request
  from "supertest";

import app
  from "../../src/app";

import {
  ROLES,
} from "../../src/constants/roles";

import {
  createAuthenticatedUser,
} from "../helpers/auth";

import {
  createCarritoFixture,
} from "../fixtures/carrito";

import {
  createSalonEvento,
  createReservaEventoFixture,
} from "../fixtures/eventos";

import {
  createHotelFixture,
} from "../fixtures/hotel";

const db =
  require("../../src/models");

const {
  CarritoItem,
  ReservaHabitacion,
  Pago,
  Reembolso,
    CitaBienestar,
  ServicioBienestar,
  BoletoParque,
} = db;

/**
 * Helper local para crear rápidamente
 * una reserva de evento válida para carrito.
 */
const createEventoParaUsuario =
  async (
    usuarioId: number,
    options: {
      estado?: string;
      total?: number;
    } = {}
  ) => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          options.total ??
          5000,
      });

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          usuarioId,

        salon_id:
          salon.id,

        estado:
          options.estado ??
          "cotizacion",

        total:
          options.total ??
          5000,

        anticipo:
          1000,
      });

    return {
      salon,
      reserva,
    };
  };

describe(
  "Ítems de carrito",
  () => {
    it(
      "1. cliente puede agregar su reserva de evento al carrito",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id,
            {
              total:
                5000,
            }
          );

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .carrito_id
        ).toBe(
          carrito.id
        );

        expect(
          response.body.data
            .tipo_item
        ).toBe(
          "evento"
        );

        expect(
          response.body.data
            .referencia_id
        ).toBe(
          reserva.id
        );

        /**
         * El precio debe venir del backend,
         * no del frontend.
         */
        expect(
          Number(
            response.body.data
              .precio
          )
        ).toBeCloseTo(
          5000,
          2
        );

        expect(
          response.body.data
            .cantidad
        ).toBe(1);

        expect(
          response.body.data
            .descripcion
        ).toContain(
          "Evento"
        );
      }
    );

    it(
      "2. sin JWT no puede agregar ítems",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                1,
            });

        expect(
          response.status
        ).toBe(401);
      }
    );

    it(
      "3. admin no puede agregar ítems al carrito",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id
          );

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        expect(
          response.status
        ).toBe(403);

        expect(
          response.body.code
        ).toBe(
          "INSUFFICIENT_PERMISSIONS"
        );
      }
    );

    it(
      "4. POST rechaza carritoId no numérico",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/carritos/abc/items"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                1,
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.code
        ).toBe(
          "VALIDATION_ERROR"
        );
      }
    );

    it(
      "5. rechaza un tipo de ítem inexistente",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "producto_inventado",

              referencia_id:
                1,
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.code
        ).toBe(
          "VALIDATION_ERROR"
        );
      }
    );

    it(
      "6. rechaza referencia_id cero",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                0,
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.code
        ).toBe(
          "VALIDATION_ERROR"
        );
      }
    );

    it(
      "7. rechaza precio cantidad y descripción manipulados por el cliente",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id
          );

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,

              /**
               * Intento de manipulación.
               */
              precio:
                1,

              cantidad:
                999,

              descripcion:
                "Evento gratis",
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.code
        ).toBe(
          "VALIDATION_ERROR"
        );
      }
    );

    it(
      "8. rechaza una referencia de evento inexistente",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                999999,
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "CART_REFERENCE_NOT_FOUND"
        );
      }
    );

    it(
      "9. no permite agregar una reserva perteneciente a otro usuario",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const otro =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            otro.usuario.id
          );

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        expect(
          response.status
        ).toBe(403);

        expect(
          response.body.code
        ).toBe(
          "CART_REFERENCE_NOT_OWNED"
        );
      }
    );

    it(
      "10. no permite agregar un evento cancelado",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id,
            {
              estado:
                "cancelada",
            }
          );

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "CART_REFERENCE_NOT_AVAILABLE"
        );
      }
    );

    it(
      "11. no permite agregar un evento expirado",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id,
            {
              estado:
                "expirada",
            }
          );

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "CART_REFERENCE_NOT_AVAILABLE"
        );
      }
    );

    it(
      "12. no permite agregar dos veces la misma referencia",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id
          );

        const payload = {
          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        };

        const first =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send(payload);

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send(payload);

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "CART_ITEM_ALREADY_EXISTS"
        );
      }
    );

    it(
      "13. listar carrito vacío devuelve items vacíos y total cero",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const response =
          await request(app)
            .get(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data
            .items
        ).toEqual([]);

        expect(
          Number(
            response.body.data
              .total
          )
        ).toBe(0);
      }
    );

    it(
      "14. listado calcula correctamente el total de varios ítems",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const eventoA =
          await createEventoParaUsuario(
            cliente.usuario.id,
            {
              total:
                5000,
            }
          );

        const eventoB =
          await createEventoParaUsuario(
            cliente.usuario.id,
            {
              total:
                2500,
            }
          );

        for (
          const reserva of [
            eventoA.reserva,
            eventoB.reserva,
          ]
        ) {
          const created =
            await request(app)
              .post(
                `/api/carritos/${carrito.id}/items`
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                tipo_item:
                  "evento",

                referencia_id:
                  reserva.id,
              });

          expect(
            created.status
          ).toBe(201);
        }

        const response =
          await request(app)
            .get(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data
            .items
        ).toHaveLength(2);

        expect(
          Number(
            response.body.data
              .total
          )
        ).toBeCloseTo(
          7500,
          2
        );
      }
    );

    it(
      "15. cliente no puede listar items de carrito ajeno",
      async () => {
        const owner =
          await createAuthenticatedUser();

        const intruso =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              owner.usuario.id,
          });

        const response =
          await request(app)
            .get(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${intruso.token}`
            );

        expect(
          response.status
        ).toBe(403);

        expect(
          response.body.code
        ).toBe(
          "INSUFFICIENT_PERMISSIONS"
        );
      }
    );

    it(
      "16. admin puede listar items de cualquier carrito",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id
          );

        await request(app)
          .post(
            `/api/carritos/${carrito.id}/items`
          )
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            tipo_item:
              "evento",

            referencia_id:
              reserva.id,
          });

        const response =
          await request(app)
            .get(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data
            .items
        ).toHaveLength(1);
      }
    );

    it(
      "17. propietario puede consultar un item por ID",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id
          );

        const created =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        const itemId =
          created.body.data.id;

        const response =
          await request(app)
            .get(
              `/api/carritos/${carrito.id}/items/${itemId}`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data.id
        ).toBe(
          itemId
        );
      }
    );

    it(
      "18. item perteneciente a otro carrito devuelve 404",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carritoA =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,

            estado:
              "activo",
          });

        const carritoB =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,

            estado:
              "expirado",

            expira_en:
              new Date(
                Date.now() -
                  60 *
                    1000
              ),
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id
          );

        const created =
          await request(app)
            .post(
              `/api/carritos/${carritoA.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        expect(
          created.status
        ).toBe(201);

        const response =
          await request(app)
            .get(
              `/api/carritos/${carritoB.id}/items/${created.body.data.id}`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "CART_ITEM_NOT_FOUND"
        );
      }
    );

    it(
      "19. no permite agregar items a un carrito expirado",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,

            estado:
              "activo",

            expira_en:
              new Date(
                Date.now() -
                  60 *
                    1000
              ),
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id
          );

        const response =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "CART_NOT_ACTIVE"
        );

        await carrito.reload();

        expect(
          carrito.estado
        ).toBe(
          "expirado"
        );
      }
    );

    it(
      "20. propietario puede eliminar un item y el total vuelve a cero",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const carrito =
          await createCarritoFixture({
            usuario_id:
              cliente.usuario.id,
          });

        const {
          reserva,
        } =
          await createEventoParaUsuario(
            cliente.usuario.id,
            {
              total:
                5000,
            }
          );

        const created =
          await request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            });

        expect(
          created.status
        ).toBe(201);

        const itemId =
          created.body.data.id;

        const deleted =
          await request(app)
            .delete(
              `/api/carritos/${carrito.id}/items/${itemId}`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );

        expect(
          deleted.status
        ).toBe(204);

        const persisted =
          await CarritoItem.findByPk(
            itemId
          );

        expect(
          persisted
        ).toBeNull();

        const response =
          await request(app)
            .get(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data
            .items
        ).toHaveLength(0);

        expect(
          Number(
            response.body.data
              .total
          )
        ).toBe(0);
      }
    );

    it(
  "21. no permite agregar una reserva de habitación finalizada",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const {
      habitacion,
    } =
      await createHotelFixture({
        capacidad:
          4,

        tarifa:
          400,
      });

    /**
     * Creamos directamente una reserva ya finalizada.
     *
     * No tiene pagos asociados.
     *
     * Aun así, una reserva finalizada ya terminó
     * su ciclo de vida y no debería poder entrar
     * nuevamente al carrito.
     */
    const reserva =
      await ReservaHabitacion.create({
        usuario_id:
          cliente.usuario.id,

        habitacion_id:
          habitacion.id,

        fecha_entrada:
          "2026-09-01",

        fecha_salida:
          "2026-09-03",

        numero_huespedes:
          2,

        estado:
          "finalizada",

        total:
          800,
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "habitacion",

          referencia_id:
            reserva.id,
        });

    console.log(
      "[QA HABITACION FINALIZADA EN CARRITO]",
      {
        status:
          response.status,

        code:
          response.body.code,

        data:
          response.body.data,
      }
    );

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    /**
     * Tampoco debe haberse persistido
     * ningún item.
     */
    const item =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carrito.id,

          tipo_item:
            "habitacion",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      item
    ).toBeNull();
  }
);

it(
  "22. permite agregar una reserva de habitación pendiente y toma el total desde backend",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const {
      habitacion,
    } =
      await createHotelFixture({
        capacidad:
          4,

        tarifa:
          400,
      });

    const reserva =
      await ReservaHabitacion.create({
        usuario_id:
          cliente.usuario.id,

        habitacion_id:
          habitacion.id,

        fecha_entrada:
          "2027-01-10",

        fecha_salida:
          "2027-01-12",

        numero_huespedes:
          2,

        estado:
          "pendiente",

        total:
          800,
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "habitacion",

          referencia_id:
            reserva.id,
        });

    expect(
      response.status
    ).toBe(201);

    expect(
      response.body.data
        .tipo_item
    ).toBe(
      "habitacion"
    );

    expect(
      response.body.data
        .referencia_id
    ).toBe(
      reserva.id
    );

    expect(
      Number(
        response.body.data
          .precio
      )
    ).toBeCloseTo(
      800,
      2
    );

    expect(
      response.body.data
        .cantidad
    ).toBe(1);
  }
);

it(
  "23. no permite agregar una reserva de habitación cancelada",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const {
      habitacion,
    } =
      await createHotelFixture();

    const reserva =
      await ReservaHabitacion.create({
        usuario_id:
          cliente.usuario.id,

        habitacion_id:
          habitacion.id,

        fecha_entrada:
          "2027-01-10",

        fecha_salida:
          "2027-01-12",

        numero_huespedes:
          2,

        estado:
          "cancelada",

        total:
          800,
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "habitacion",

          referencia_id:
            reserva.id,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    const item =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carrito.id,

          tipo_item:
            "habitacion",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      item
    ).toBeNull();
  }
);

it(
  "24. no permite agregar una reserva de habitación completamente pagada",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const {
      habitacion,
    } =
      await createHotelFixture({
        tarifa:
          400,
      });

    const reserva =
      await ReservaHabitacion.create({
        usuario_id:
          cliente.usuario.id,

        habitacion_id:
          habitacion.id,

        fecha_entrada:
          "2027-02-10",

        fecha_salida:
          "2027-02-12",

        numero_huespedes:
          2,

        estado:
          "confirmada",

        total:
          800,
      });

    /**
     * Simulamos un pago total aprobado
     * directamente asociado a la reserva.
     */
    await Pago.create({
      reserva_habitacion_id:
        reserva.id,

      carrito_id:
        null,

      monto:
        800,

      metodo:
        "efectivo",

      estado:
        "aprobado",

      moneda:
        "GTQ",

      tipo_pago:
        "total",

      pasarela:
        null,

      fecha_pago:
        new Date(),
    });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "habitacion",

          referencia_id:
            reserva.id,
        });

    console.log(
      "[QA HABITACION PAGADA EN CARRITO]",
      {
        status:
          response.status,

        code:
          response.body.code,

        data:
          response.body.data,
      }
    );

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    /**
     * La referencia pagada tampoco
     * puede quedar persistida.
     */
    const item =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carrito.id,

          tipo_item:
            "habitacion",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      item
    ).toBeNull();
  }
); 

it(
  "25. no permite agregar nuevamente un evento ya completamente pagado en otro carrito",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    /**
     * Creamos el evento.
     *
     * Lo dejamos confirmado para representar
     * una reserva válida que ya atravesó
     * su proceso de pago.
     */
    const {
      reserva,
    } =
      await createEventoParaUsuario(
        cliente.usuario.id,
        {
          estado:
            "confirmada",

          total:
            5000,
        }
      );

    /**
     * Carrito histórico ya pagado.
     */
    const carritoPagado =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "pagado",

        expira_en:
          new Date(
            Date.now() -
              60 *
                1000
          ),
      });

    /**
     * Simulamos la fotografía histórica
     * del evento dentro del carrito pagado.
     */
    await CarritoItem.create({
      carrito_id:
        carritoPagado.id,

      tipo_item:
        "evento",

      referencia_id:
        reserva.id,

      descripcion:
        `Evento ${reserva.tipo_evento} - ${reserva.fecha}`,

      precio:
        5000,

      cantidad:
        1,

      promocion_id:
        null,
    });

    /**
     * Pago total aprobado del carrito anterior.
     */
    await Pago.create({
      reserva_habitacion_id:
        null,

      carrito_id:
        carritoPagado.id,

      monto:
        5000,

      metodo:
        "efectivo",

      estado:
        "aprobado",

      moneda:
        "GTQ",

      tipo_pago:
        "total",

      pasarela:
        null,

      fecha_pago:
        new Date(),
    });

    /**
     * El cliente posteriormente crea
     * un carrito nuevo.
     */
    const carritoNuevo =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "activo",
      });

    /**
     * Intentamos volver a comprar
     * exactamente el mismo evento.
     */
    const response =
      await request(app)
        .post(
          `/api/carritos/${carritoNuevo.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        });

    console.log(
      "[QA EVENTO YA PAGADO EN NUEVO CARRITO]",
      {
        status:
          response.status,

        code:
          response.body.code,

        data:
          response.body.data,
      }
    );

    /**
     * Una referencia completamente pagada
     * no debería poder comprarse nuevamente.
     */
    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    /**
     * El nuevo carrito no puede contener
     * la referencia.
     */
    const itemNuevo =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carritoNuevo.id,

          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      itemNuevo
    ).toBeNull();
  }
);

it(
  "26. no permite agregar a otro carrito un evento con pagos parciales pendientes",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    /**
     * Evento de Q5,000.
     */
    const {
      reserva,
    } =
      await createEventoParaUsuario(
        cliente.usuario.id,
        {
          estado:
            "confirmada",

          total:
            5000,
        }
      );

    /**
     * Carrito histórico.
     *
     * Lo colocamos expirado para simular
     * que ya no puede seguir utilizándose
     * normalmente.
     */
    const carritoAnterior =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "expirado",

        expira_en:
          new Date(
            Date.now() -
              60 *
                1000
          ),
      });

    /**
     * El evento estuvo en ese carrito.
     */
    await CarritoItem.create({
      carrito_id:
        carritoAnterior.id,

      tipo_item:
        "evento",

      referencia_id:
        reserva.id,

      descripcion:
        `Evento ${reserva.tipo_evento} - ${reserva.fecha}`,

      precio:
        5000,

      cantidad:
        1,

      promocion_id:
        null,
    });

    /**
     * Solo se pagaron Q1,500.
     *
     * Es un anticipo parcial:
     *
     * total evento = Q5,000
     * pagado       = Q1,500
     * saldo        = Q3,500
     */
    await Pago.create({
      reserva_habitacion_id:
        null,

      carrito_id:
        carritoAnterior.id,

      monto:
        1500,

      metodo:
        "efectivo",

      estado:
        "aprobado",

      moneda:
        "GTQ",

      tipo_pago:
        "anticipo",

      pasarela:
        null,

      fecha_pago:
        new Date(),
    });

    /**
     * Creamos otro carrito activo.
     */
    const carritoNuevo =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "activo",
      });

    /**
     * Intentamos agregar otra vez
     * exactamente el mismo evento.
     */
    const response =
      await request(app)
        .post(
          `/api/carritos/${carritoNuevo.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        });

    console.log(
      "[QA EVENTO PARCIALMENTE PAGADO EN NUEVO CARRITO]",
      {
        status:
          response.status,

        code:
          response.body.code,

        data:
          response.body.data,
      }
    );

    /**
     * Mientras exista dinero aprobado
     * asociado a la compra anterior,
     * no podemos recrear la referencia
     * como si nunca hubiese sido pagada.
     *
     * De lo contrario el nuevo carrito
     * volvería a partir de Q5,000.
     */
    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    const itemNuevo =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carritoNuevo.id,

          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      itemNuevo
    ).toBeNull();
  }
);

it(
  "27. permite agregar nuevamente un evento después de un reembolso total",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    /**
     * Evento original de Q5,000.
     */
    const {
      reserva,
    } =
      await createEventoParaUsuario(
        cliente.usuario.id,
        {
          estado:
            "confirmada",

          total:
            5000,
        }
      );

    /**
     * Carrito histórico donde originalmente
     * se compró el evento.
     */
    const carritoAnterior =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "pagado",

        expira_en:
          new Date(
            Date.now() -
              60 *
                1000
          ),
      });

    await CarritoItem.create({
      carrito_id:
        carritoAnterior.id,

      tipo_item:
        "evento",

      referencia_id:
        reserva.id,

      descripcion:
        `Evento ${reserva.tipo_evento} - ${reserva.fecha}`,

      precio:
        5000,

      cantidad:
        1,

      promocion_id:
        null,
    });

    /**
     * Pago completo original.
     */
    const pago =
      await Pago.create({
        reserva_habitacion_id:
          null,

        carrito_id:
          carritoAnterior.id,

        monto:
          5000,

        metodo:
          "efectivo",

        estado:
          "aprobado",

        moneda:
          "GTQ",

        tipo_pago:
          "total",

        pasarela:
          null,

        fecha_pago:
          new Date(),
      });

    /**
     * Posteriormente se devuelve TODO
     * el dinero al cliente.
     *
     * Neto financiero:
     *
     * Q5,000 pagados
     * - Q5,000 reembolsados
     * -------------------
     * Q0 comprometidos
     */
    await Reembolso.create({
      pago_id:
        pago.id,

      monto:
        5000,

      moneda:
        "GTQ",

      motivo:
        "requested_by_customer",

      estado:
        "aprobado",

      fecha_reembolso:
        new Date(),

      id_reembolso_externo:
        `qa-refund-total-${pago.id}`,
    });

    /**
     * Dejamos también el estado del pago
     * consistente con un reembolso total.
     */
    await pago.update({
      estado:
        "reembolsado",
    });

    /**
     * Nuevo carrito del mismo cliente.
     */
    const carritoNuevo =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "activo",
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carritoNuevo.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        });

    console.log(
      "[QA EVENTO CON REEMBOLSO TOTAL EN NUEVO CARRITO]",
      {
        status:
          response.status,

        code:
          response.body.code,

        data:
          response.body.data,
      }
    );

    /**
     * Al no quedar dinero neto comprometido,
     * debe poder volver a agregarse.
     */
    expect(
      response.status
    ).toBe(201);

    expect(
      response.body.data
        .tipo_item
    ).toBe(
      "evento"
    );

    expect(
      response.body.data
        .referencia_id
    ).toBe(
      reserva.id
    );

    expect(
      Number(
        response.body.data
          .precio
      )
    ).toBeCloseTo(
      5000,
      2
    );

    /**
     * Y debe existir realmente en
     * el carrito nuevo.
     */
    const itemNuevo =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carritoNuevo.id,

          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      itemNuevo
    ).not.toBeNull();
  }
);

it(
  "28. no permite agregar nuevamente un evento después de un reembolso parcial",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    /**
     * Evento original de Q5,000.
     */
    const {
      reserva,
    } =
      await createEventoParaUsuario(
        cliente.usuario.id,
        {
          estado:
            "confirmada",

          total:
            5000,
        }
      );

    /**
     * Carrito histórico donde estuvo
     * originalmente el evento.
     */
    const carritoAnterior =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "pagado",

        expira_en:
          new Date(
            Date.now() -
              60 *
                1000
          ),
      });

    await CarritoItem.create({
      carrito_id:
        carritoAnterior.id,

      tipo_item:
        "evento",

      referencia_id:
        reserva.id,

      descripcion:
        `Evento ${reserva.tipo_evento} - ${reserva.fecha}`,

      precio:
        5000,

      cantidad:
        1,

      promocion_id:
        null,
    });

    /**
     * Pago completo original.
     */
    const pago =
      await Pago.create({
        reserva_habitacion_id:
          null,

        carrito_id:
          carritoAnterior.id,

        monto:
          5000,

        metodo:
          "efectivo",

        estado:
          "reembolsado_parcial",

        moneda:
          "GTQ",

        tipo_pago:
          "total",

        pasarela:
          null,

        fecha_pago:
          new Date(),
      });

    /**
     * Solo se devuelven Q2,000.
     *
     * Neto todavía comprometido:
     *
     * 5000 - 2000 = 3000
     */
    await Reembolso.create({
      pago_id:
        pago.id,

      monto:
        2000,

      moneda:
        "GTQ",

      motivo:
        "requested_by_customer",

      estado:
        "aprobado",

      fecha_reembolso:
        new Date(),

      id_reembolso_externo:
        `qa-refund-partial-${pago.id}`,
    });

    /**
     * Nuevo carrito activo.
     */
    const carritoNuevo =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "activo",
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carritoNuevo.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        });

    console.log(
      "[QA EVENTO CON REEMBOLSO PARCIAL EN NUEVO CARRITO]",
      {
        status:
          response.status,

        code:
          response.body.code,

        data:
          response.body.data,
      }
    );

    /**
     * Como todavía existen Q3,000 netos
     * aprobados, la referencia continúa
     * financieramente comprometida.
     */
    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    const itemNuevo =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carritoNuevo.id,

          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      itemNuevo
    ).toBeNull();
  }
);

it(
  "29. permite agregar una cita de bienestar confirmada y toma el precio del servicio",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const servicio =
      await ServicioBienestar.create({
        nombre:
          "Masaje relajante QA",

        duracion_minutos:
          60,

        precio:
          350,
      });

    const cita =
      await CitaBienestar.create({
        usuario_id:
          cliente.usuario.id,

        servicio_bienestar_id:
          servicio.id,

        terapeuta_id:
          null,

        fecha:
          "2027-07-10",

        hora_inicio:
          "10:00:00",

        hora_fin:
          "11:00:00",

        estado:
          "confirmada",
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "bienestar",

          referencia_id:
            cita.id,
        });

    expect(
      response.status
    ).toBe(201);

    expect(
      response.body.data
        .tipo_item
    ).toBe(
      "bienestar"
    );

    expect(
      response.body.data
        .referencia_id
    ).toBe(
      cita.id
    );

    expect(
      Number(
        response.body.data
          .precio
      )
    ).toBeCloseTo(
      350,
      2
    );

    expect(
      response.body.data
        .cantidad
    ).toBe(1);

    expect(
      response.body.data
        .descripcion
    ).toContain(
      "Masaje relajante QA"
    );
  }
);

it(
  "30. no permite agregar una cita de bienestar cancelada",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const servicio =
      await ServicioBienestar.create({
        nombre:
          "Terapia bienestar QA",

        duracion_minutos:
          45,

        precio:
          275,
      });

    const cita =
      await CitaBienestar.create({
        usuario_id:
          cliente.usuario.id,

        servicio_bienestar_id:
          servicio.id,

        terapeuta_id:
          null,

        fecha:
          "2027-07-11",

        hora_inicio:
          "09:00:00",

        hora_fin:
          "09:45:00",

        estado:
          "cancelada",
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "bienestar",

          referencia_id:
            cita.id,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    const item =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carrito.id,

          tipo_item:
            "bienestar",

          referencia_id:
            cita.id,
        },
      });

    expect(
      item
    ).toBeNull();
  }
);

it(
  "31. no permite agregar una cita de bienestar perteneciente a otro usuario",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const otro =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const servicio =
      await ServicioBienestar.create({
        nombre:
          "Spa QA",

        duracion_minutos:
          90,

        precio:
          500,
      });

    const cita =
      await CitaBienestar.create({
        usuario_id:
          otro.usuario.id,

        servicio_bienestar_id:
          servicio.id,

        terapeuta_id:
          null,

        fecha:
          "2027-07-12",

        hora_inicio:
          "14:00:00",

        hora_fin:
          "15:30:00",

        estado:
          "confirmada",
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "bienestar",

          referencia_id:
            cita.id,
        });

    expect(
      response.status
    ).toBe(403);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_OWNED"
    );
  }
);

it(
  "32. no permite agregar a otro carrito una cita de bienestar con pagos aprobados",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    /**
     * Servicio de bienestar de Q350.
     */
    const servicio =
      await ServicioBienestar.create({
        nombre:
          "Masaje financiero QA",

        duracion_minutos:
          60,

        precio:
          350,
      });

    /**
     * Cita válida del cliente.
     */
    const cita =
      await CitaBienestar.create({
        usuario_id:
          cliente.usuario.id,

        servicio_bienestar_id:
          servicio.id,

        terapeuta_id:
          null,

        fecha:
          "2027-08-10",

        hora_inicio:
          "10:00:00",

        hora_fin:
          "11:00:00",

        estado:
          "confirmada",
      });

    /**
     * Carrito histórico donde ya estuvo
     * incluida la cita.
     */
    const carritoAnterior =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "pagado",

        expira_en:
          new Date(
            Date.now() -
              60 *
                1000
          ),
      });

    await CarritoItem.create({
      carrito_id:
        carritoAnterior.id,

      tipo_item:
        "bienestar",

      referencia_id:
        cita.id,

      descripcion:
        `${servicio.nombre} - ${cita.fecha} ${cita.hora_inicio}`,

      precio:
        350,

      cantidad:
        1,

      promocion_id:
        null,
    });

    /**
     * Pago aprobado completo de la cita.
     */
    await Pago.create({
      reserva_habitacion_id:
        null,

      carrito_id:
        carritoAnterior.id,

      monto:
        350,

      metodo:
        "efectivo",

      estado:
        "aprobado",

      moneda:
        "GTQ",

      tipo_pago:
        "total",

      pasarela:
        null,

      fecha_pago:
        new Date(),
    });

    /**
     * Nuevo carrito activo.
     */
    const carritoNuevo =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "activo",
      });

    /**
     * Intentamos volver a comprar
     * exactamente la misma cita.
     */
    const response =
      await request(app)
        .post(
          `/api/carritos/${carritoNuevo.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "bienestar",

          referencia_id:
            cita.id,
        });

    console.log(
      "[QA BIENESTAR PAGADO EN NUEVO CARRITO]",
      {
        status:
          response.status,

        code:
          response.body.code,

        data:
          response.body.data,
      }
    );

    /**
     * Una cita que ya tiene dinero aprobado
     * no puede volver a introducirse como
     * una compra nueva.
     */
    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    const itemNuevo =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carritoNuevo.id,

          tipo_item:
            "bienestar",

          referencia_id:
            cita.id,
        },
      });

    expect(
      itemNuevo
    ).toBeNull();
  }
);

it(
  "33. permite agregar un boleto de parque válido y toma el precio desde backend",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const boleto =
      await BoletoParque.create({
        usuario_id:
          cliente.usuario.id,

        fecha_visita:
          "2027-09-10",

        tipo_boleto:
          "adulto",

        precio:
          250,

        codigo_qr:
          "QA-BOLETO-001",

        estado:
          "valido",
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "boleto_parque",

          referencia_id:
            boleto.id,
        });

    expect(
      response.status
    ).toBe(201);

    expect(
      response.body.data
        .tipo_item
    ).toBe(
      "boleto_parque"
    );

    expect(
      response.body.data
        .referencia_id
    ).toBe(
      boleto.id
    );

    expect(
      Number(
        response.body.data
          .precio
      )
    ).toBeCloseTo(
      250,
      2
    );

    expect(
      response.body.data
        .cantidad
    ).toBe(1);

    expect(
      response.body.data
        .descripcion
    ).toContain(
      "adulto"
    );
  }
);

it(
  "34. no permite agregar un boleto de parque usado",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const boleto =
      await BoletoParque.create({
        usuario_id:
          cliente.usuario.id,

        fecha_visita:
          "2027-09-11",

        tipo_boleto:
          "adulto",

        precio:
          250,

        codigo_qr:
          "QA-BOLETO-002",

        estado:
          "usado",
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "boleto_parque",

          referencia_id:
            boleto.id,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    const item =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carrito.id,

          tipo_item:
            "boleto_parque",

          referencia_id:
            boleto.id,
        },
      });

    expect(
      item
    ).toBeNull();
  }
);

it(
  "35. no permite agregar un boleto de parque perteneciente a otro usuario",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const otro =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const boleto =
      await BoletoParque.create({
        usuario_id:
          otro.usuario.id,

        fecha_visita:
          "2027-09-12",

        tipo_boleto:
          "familiar",

        precio:
          600,

        codigo_qr:
          "QA-BOLETO-003",

        estado:
          "valido",
      });

    const response =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "boleto_parque",

          referencia_id:
            boleto.id,
        });

    expect(
      response.status
    ).toBe(403);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_OWNED"
    );
  }
);

it(
  "36. no permite agregar a otro carrito un boleto de parque con pagos aprobados",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    /**
     * Boleto válido de Q250.
     */
    const boleto =
      await BoletoParque.create({
        usuario_id:
          cliente.usuario.id,

        fecha_visita:
          "2027-10-10",

        tipo_boleto:
          "adulto",

        precio:
          250,

        codigo_qr:
          "QA-BOLETO-PAGADO-001",

        estado:
          "valido",
      });

    /**
     * Carrito histórico donde el boleto
     * ya fue comprado.
     */
    const carritoAnterior =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "pagado",

        expira_en:
          new Date(
            Date.now() -
              60 *
                1000
          ),
      });

    await CarritoItem.create({
      carrito_id:
        carritoAnterior.id,

      tipo_item:
        "boleto_parque",

      referencia_id:
        boleto.id,

      descripcion:
        `Boleto ${boleto.tipo_boleto} - ${boleto.fecha_visita}`,

      precio:
        250,

      cantidad:
        1,

      promocion_id:
        null,
    });

    /**
     * Pago completo aprobado.
     */
    await Pago.create({
      reserva_habitacion_id:
        null,

      carrito_id:
        carritoAnterior.id,

      monto:
        250,

      metodo:
        "efectivo",

      estado:
        "aprobado",

      moneda:
        "GTQ",

      tipo_pago:
        "total",

      pasarela:
        null,

      fecha_pago:
        new Date(),
    });

    /**
     * Nuevo carrito del mismo cliente.
     */
    const carritoNuevo =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,

        estado:
          "activo",
      });

    /**
     * Intentamos volver a agregar
     * exactamente el mismo boleto.
     */
    const response =
      await request(app)
        .post(
          `/api/carritos/${carritoNuevo.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "boleto_parque",

          referencia_id:
            boleto.id,
        });

    console.log(
      "[QA BOLETO PARQUE PAGADO EN NUEVO CARRITO]",
      {
        status:
          response.status,

        code:
          response.body.code,

        data:
          response.body.data,
      }
    );

    /**
     * Un boleto que ya posee dinero
     * aprobado no debe poder comprarse
     * nuevamente en otro carrito.
     */
    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "CART_REFERENCE_NOT_AVAILABLE"
    );

    /**
     * Tampoco debe persistirse
     * en el carrito nuevo.
     */
    const itemNuevo =
      await CarritoItem.findOne({
        where: {
          carrito_id:
            carritoNuevo.id,

          tipo_item:
            "boleto_parque",

          referencia_id:
            boleto.id,
        },
      });

    expect(
      itemNuevo
    ).toBeNull();
  }
);

it(
  "37. concurrencia: solo una solicitud puede agregar la misma referencia al carrito",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const {
      reserva,
    } =
      await createEventoParaUsuario(
        cliente.usuario.id,
        {
          estado:
            "cotizacion",

          total:
            5000,
        }
      );

    const responses =
      await Promise.all(
        Array.from(
          {
            length: 20,
          },
          () =>
            request(app)
              .post(
                `/api/carritos/${carrito.id}/items`
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                tipo_item:
                  "evento",

                referencia_id:
                  reserva.id,
              })
        )
      );

    const created =
      responses.filter(
        (response) =>
          response.status ===
          201
      );

    const conflicts =
      responses.filter(
        (response) =>
          response.status ===
          409
      );

    const unexpected =
      responses.filter(
        (response) =>
          ![
            201,
            409,
          ].includes(
            response.status
          )
      );

    console.log(
      "[QA CONCURRENCIA DUPLICADO CARRITO ITEM]",
      {
        total:
          responses.length,

        creados:
          created.length,

        conflictos:
          conflicts.length,

        inesperados:
          unexpected.map(
            (
              response
            ) => ({
              status:
                response.status,

              code:
                response.body.code,

              body:
                response.body,
            })
          ),
      }
    );

    /**
     * Solo una petición puede ganar.
     */
    expect(
      created
    ).toHaveLength(1);

    expect(
      conflicts
    ).toHaveLength(19);

    expect(
      unexpected
    ).toHaveLength(0);

    /**
     * Todas las que perdieron deben hacerlo
     * por duplicado y no por errores internos.
     */
    for (
      const conflict of
      conflicts
    ) {
      expect(
        conflict.body.code
      ).toBe(
        "CART_ITEM_ALREADY_EXISTS"
      );
    }

    /**
     * Verificación directa en PostgreSQL:
     * físicamente debe existir una sola fila.
     */
    const persisted =
      await CarritoItem.findAll({
        where: {
          carrito_id:
            carrito.id,

          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      persisted
    ).toHaveLength(1);

    expect(
      Number(
        persisted[0].precio
      )
    ).toBeCloseTo(
      5000,
      2
    );

    expect(
      persisted[0].cantidad
    ).toBe(1);
  }
);

it(
  "38. concurrencia DELETE: solo una solicitud puede eliminar el mismo item",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    const {
      reserva,
    } =
      await createEventoParaUsuario(
        cliente.usuario.id,
        {
          estado:
            "cotizacion",

          total:
            5000,
        }
      );

    /**
     * Primero agregamos normalmente
     * el item mediante la API.
     */
    const createResponse =
      await request(app)
        .post(
          `/api/carritos/${carrito.id}/items`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        });

    expect(
      createResponse.status
    ).toBe(201);

    const itemId =
      createResponse.body.data.id;

    /**
     * Lanzamos 20 DELETE simultáneos
     * contra exactamente el mismo item.
     */
    const responses =
      await Promise.all(
        Array.from(
          {
            length: 20,
          },
          () =>
            request(app)
              .delete(
                `/api/carritos/${carrito.id}/items/${itemId}`
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
        )
      );

    const deleted =
      responses.filter(
        (response) =>
          response.status ===
          204
      );

    const notFound =
      responses.filter(
        (response) =>
          response.status ===
          404
      );

    const unexpected =
      responses.filter(
        (response) =>
          ![
            204,
            404,
          ].includes(
            response.status
          )
      );

    console.log(
      "[QA CONCURRENCIA DELETE CARRITO ITEM]",
      {
        total:
          responses.length,

        eliminados:
          deleted.length,

        noEncontrados:
          notFound.length,

        inesperados:
          unexpected.map(
            (
              response
            ) => ({
              status:
                response.status,

              code:
                response.body.code,

              body:
                response.body,
            })
          ),
      }
    );

    /**
     * Solamente una petición puede
     * eliminar físicamente el item.
     */
    expect(
      deleted
    ).toHaveLength(1);

    /**
     * Las demás deben encontrar que
     * el item ya desapareció.
     */
    expect(
      notFound
    ).toHaveLength(19);

    expect(
      unexpected
    ).toHaveLength(0);

    /**
     * Los 19 perdedores deben recibir
     * específicamente el error esperado,
     * nunca un 500.
     */
    for (
      const response of
      notFound
    ) {
      expect(
        response.body.code
      ).toBe(
        "CART_ITEM_NOT_FOUND"
      );
    }

    /**
     * Verificación directa en BD:
     * después de toda la carrera el
     * item debe haber desaparecido.
     */
    const persisted =
      await CarritoItem.findByPk(
        itemId
      );

    expect(
      persisted
    ).toBeNull();

    /**
     * Y tampoco debe quedar ninguna
     * fila equivalente en el carrito.
     */
    const remaining =
      await CarritoItem.count({
        where: {
          carrito_id:
            carrito.id,

          tipo_item:
            "evento",

          referencia_id:
            reserva.id,
        },
      });

    expect(
      remaining
    ).toBe(0);
  }
);
it(
  "39. concurrencia ADD vs DELETE: mantiene un resultado serializable",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const carrito =
      await createCarritoFixture({
        usuario_id:
          cliente.usuario.id,
      });

    let addSuccess =
      0;

    let addConflicts =
      0;

    let deleteSuccess =
      0;

    const unexpected:
      Array<{
        caso: number;
        operacion: string;
        status: number;
        code?: string;
      }> = [];

    /**
     * Ejecutamos 20 carreras independientes.
     *
     * En cada una:
     *
     * 1. Existe inicialmente un item.
     * 2. Un POST intenta volver a agregarlo.
     * 3. Un DELETE intenta eliminar el existente.
     *
     * Dependiendo del orden del lock:
     *
     * A)
     * POST -> 409
     * DELETE -> 204
     * final -> 0 filas
     *
     * B)
     * DELETE -> 204
     * POST -> 201
     * final -> 1 fila
     *
     * Ambos resultados son correctos.
     */
    for (
      let i = 0;
      i < 20;
      i++
    ) {
      const {
        reserva,
      } =
        await createEventoParaUsuario(
          cliente.usuario.id,
          {
            estado:
              "cotizacion",

            total:
              5000 + i,
          }
        );

      /**
       * Sembramos el item inicial.
       */
      const initial =
        await request(app)
          .post(
            `/api/carritos/${carrito.id}/items`
          )
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            tipo_item:
              "evento",

            referencia_id:
              reserva.id,
          });

      expect(
        initial.status
      ).toBe(201);

      const originalItemId =
        initial.body.data.id;

      /**
       * Ahora provocamos la carrera:
       *
       * - volver a agregar la referencia
       * - eliminar la fila existente
       */
      const [
        addResponse,
        deleteResponse,
      ] =
        await Promise.all([
          request(app)
            .post(
              `/api/carritos/${carrito.id}/items`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              tipo_item:
                "evento",

              referencia_id:
                reserva.id,
            }),

          request(app)
            .delete(
              `/api/carritos/${carrito.id}/items/${originalItemId}`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            ),
        ]);

      /**
       * DELETE siempre debe poder eliminar
       * la fila original.
       */
      if (
        deleteResponse.status ===
        204
      ) {
        deleteSuccess++;
      } else {
        unexpected.push({
          caso:
            i + 1,

          operacion:
            "DELETE",

          status:
            deleteResponse.status,

          code:
            deleteResponse.body
              ?.code,
        });
      }

      /**
       * ADD puede:
       *
       * 201 -> DELETE ganó primero
       *
       * 409 -> ADD vio primero
       *        la fila existente
       */
      if (
        addResponse.status ===
        201
      ) {
        addSuccess++;
      } else if (
        addResponse.status ===
        409
      ) {
        addConflicts++;

        expect(
          addResponse.body.code
        ).toBe(
          "CART_ITEM_ALREADY_EXISTS"
        );
      } else {
        unexpected.push({
          caso:
            i + 1,

          operacion:
            "ADD",

          status:
            addResponse.status,

          code:
            addResponse.body
              ?.code,
        });
      }

      /**
       * Verificamos directamente el estado
       * final de PostgreSQL.
       */
      const persisted =
        await CarritoItem.findAll({
          where: {
            carrito_id:
              carrito.id,

            tipo_item:
              "evento",

            referencia_id:
              reserva.id,
          },

          order: [
            [
              "id",
              "ASC",
            ],
          ],
        });

      /**
       * Invariante principal:
       *
       * JAMÁS pueden existir dos copias.
       */
      expect(
        persisted.length
      ).toBeLessThanOrEqual(
        1
      );

      /**
       * Si ADD obtuvo 201,
       * DELETE ocurrió primero y posteriormente
       * se creó una fila nueva.
       */
      if (
        addResponse.status ===
        201
      ) {
        expect(
          persisted
        ).toHaveLength(1);

        expect(
          persisted[0].id
        ).not.toBe(
          originalItemId
        );

        expect(
          persisted[0]
            .referencia_id
        ).toBe(
          reserva.id
        );
      }

      /**
       * Si ADD obtuvo 409,
       * primero detectó el item original
       * y después DELETE lo eliminó.
       */
      if (
        addResponse.status ===
        409
      ) {
        expect(
          persisted
        ).toHaveLength(0);
      }
    }

    console.log(
      "[QA CONCURRENCIA ADD VS DELETE CARRITO ITEM]",
      {
        totalCasos:
          20,

        addsExitosos:
          addSuccess,

        addsBloqueados:
          addConflicts,

        deletesExitosos:
          deleteSuccess,

        inesperados:
          unexpected,
      }
    );

    /**
     * Todas las carreras deben haber
     * terminado dentro de alguno de los
     * dos órdenes serializables.
     */
    expect(
      addSuccess +
        addConflicts
    ).toBe(20);

    expect(
      deleteSuccess
    ).toBe(20);

    expect(
      unexpected
    ).toHaveLength(0);
  }
);
  }
);