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
  createSalonEvento,
  createReservaEventoFixture,
} from "../fixtures/eventos";

import {
  createServicioEvento,
  createReservaEventoServicioFixture,
} from "../fixtures/eventoServicios";

describe(
  "Servicios de reservas de evento",
  () => {
    it(
      "1. propietario puede listar servicios de una reserva vacía",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const response =
          await request(app)
            .get(
              `/api/reservas-evento/${reserva.id}/servicios`
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
        ).toEqual([]);
      }
    );

    it(
      "2. propietario puede agregar un servicio",
      async () => {
        const salon =
          await createSalonEvento({
            tarifa_base:
              5000,
          });

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            total:
              5000,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento({
            precio:
              300,
          });

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                2,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .item
            .servicio_evento_id
        ).toBe(
          servicio.id
        );

        expect(
          response.body.data
            .item
            .cantidad
        ).toBe(2);
      }
    );

    it(
      "3. calcula subtotal con precio por cantidad",
      async () => {
        const salon =
          await createSalonEvento({
            tarifa_base:
              5000,
          });

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            total:
              5000,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento({
            precio:
              325.50,
          });

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                2,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          Number(
            response.body.data
              .item
              .subtotal
          )
        ).toBeCloseTo(
          651,
          2
        );

        expect(
          Number(
            response.body.data
              .reserva
              .total
          )
        ).toBeCloseTo(
          5651,
          2
        );
      }
    );

    it(
      "4. cantidad omitida utiliza valor 1",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento({
            precio:
              400,
          });

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .item
            .cantidad
        ).toBe(1);

        expect(
          Number(
            response.body.data
              .item
              .subtotal
          )
        ).toBeCloseTo(
          400,
          2
        );
      }
    );

    it(
      "5. rechaza servicio inexistente",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                999999,

              cantidad:
                1,
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "EVENT_SERVICE_NOT_FOUND"
        );
      }
    );

    it(
      "6. rechaza agregar dos veces el mismo servicio",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento();

        const payload = {
          servicio_evento_id:
            servicio.id,

          cantidad:
            1,
        };

        const first =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
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
              `/api/reservas-evento/${reserva.id}/servicios`
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
          "EVENT_SERVICE_ALREADY_ADDED"
        );
      }
    );

    it(
      "7. otro usuario no puede agregar servicios",
      async () => {
        const salon =
          await createSalonEvento();

        const owner =
          await createAuthenticatedUser();

        const intruso =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              owner.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento();

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${intruso.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                1,
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
      "8. admin puede agregar servicios a reserva de otro usuario",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento();

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                1,
            });

        expect(
          response.status
        ).toBe(201);
      }
    );

    it(
      "9. no permite agregar servicio a reserva confirmada",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "confirmada",
          });

        const servicio =
          await createServicioEvento();

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                1,
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "EVENT_RESERVATION_NOT_EDITABLE"
        );
      }
    );

    it(
      "10. no permite agregar servicio a reserva cancelada",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cancelada",
          });

        const servicio =
          await createServicioEvento();

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                1,
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "EVENT_RESERVATION_NOT_EDITABLE"
        );
      }
    );

    it(
      "11. rechaza reservaId no numérico",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento/abc/servicios"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                1,

              cantidad:
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
      "12. rechaza servicio_evento_id inválido",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                0,

              cantidad:
                1,
            });

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "13. rechaza cantidad cero",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento();

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                0,
            });

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "14. rechaza campos adicionales",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento();

        const response =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                1,

              subtotal:
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
      "15. sin JWT no puede acceder al módulo",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/reservas-evento/1/servicios"
            );

        expect(
          response.status
        ).toBe(401);
      }
    );

    it(
      "16. propietario puede listar los servicios agregados",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento();

        await request(app)
          .post(
            `/api/reservas-evento/${reserva.id}/servicios`
          )
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            servicio_evento_id:
              servicio.id,

            cantidad:
              2,
          });

        const response =
          await request(app)
            .get(
              `/api/reservas-evento/${reserva.id}/servicios`
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
        ).toHaveLength(1);

        expect(
          response.body.data[0]
            .servicio_evento_id
        ).toBe(
          servicio.id
        );
      }
    );

    it(
      "17. otro usuario no puede listar servicios de la reserva",
      async () => {
        const salon =
          await createSalonEvento();

        const owner =
          await createAuthenticatedUser();

        const intruso =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              owner.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const response =
          await request(app)
            .get(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${intruso.token}`
            );

        expect(
          response.status
        ).toBe(403);
      }
    );

    it(
      "18. propietario puede consultar una asociación por ID",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const reserva =
          await createReservaEventoFixture({
            usuario_id:
              cliente.usuario.id,

            salon_id:
              salon.id,

            estado:
              "cotizacion",
          });

        const servicio =
          await createServicioEvento();

        const created =
          await request(app)
            .post(
              `/api/reservas-evento/${reserva.id}/servicios`
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              servicio_evento_id:
                servicio.id,

              cantidad:
                2,
            });

        const itemId =
          created.body.data
            .item.id;

        const response =
          await request(app)
            .get(
              `/api/reservas-evento/${reserva.id}/servicios/${itemId}`
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
  "19. asociación de otra reserva devuelve 404",
  async () => {
    const salonA =
      await createSalonEvento();

    const salonB =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    const reservaA =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salonA.id,

        estado:
          "cotizacion",
      });

    const reservaB =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salonB.id,

        estado:
          "cotizacion",
      });

    const servicio =
      await createServicioEvento();

    const item =
      await createReservaEventoServicioFixture({
        reserva_evento_id:
          reservaA.id,

        servicio_evento_id:
          servicio.id,

        cantidad:
          1,

        subtotal:
          300,
      });

    const response =
      await request(app)
        .get(
          `/api/reservas-evento/${reservaB.id}/servicios/${item.id}`
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
      "EVENT_RESERVATION_SERVICE_NOT_FOUND"
    );
  }
);

it(
  "20. admin puede listar servicios de una reserva ajena",
  async () => {
    const salon =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol:
          ROLES.ADMIN,
      });

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",
      });

    const servicio =
      await createServicioEvento();

    await createReservaEventoServicioFixture({
      reserva_evento_id:
        reserva.id,

      servicio_evento_id:
        servicio.id,

      cantidad:
        1,

      subtotal:
        300,
    });

    const response =
      await request(app)
        .get(
          `/api/reservas-evento/${reserva.id}/servicios`
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
    ).toHaveLength(1);
  }
);

it(
  "21. propietario puede actualizar cantidad",
  async () => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",

        total:
          5000,
      });

    const servicio =
      await createServicioEvento({
        precio:
          250,
      });

    const created =
      await request(app)
        .post(
          `/api/reservas-evento/${reserva.id}/servicios`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          servicio_evento_id:
            servicio.id,

          cantidad:
            2,
        });

    const itemId =
      created.body.data.item.id;

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}/servicios/${itemId}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          cantidad:
            4,
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data
        .item
        .cantidad
    ).toBe(4);

    expect(
      Number(
        response.body.data
          .item
          .subtotal
      )
    ).toBeCloseTo(
      1000,
      2
    );
  }
);

it(
  "22. actualizar cantidad conserva el precio unitario cotizado originalmente",
  async () => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",

        total:
          5000,
      });

    const servicio =
      await createServicioEvento({
        precio:
          100,
      });

    const created =
      await request(app)
        .post(
          `/api/reservas-evento/${reserva.id}/servicios`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          servicio_evento_id:
            servicio.id,

          cantidad:
            2,
        });

    const itemId =
      created.body.data.item.id;

    /**
     * El catálogo cambia después
     * de haber cotizado el servicio.
     */
    await servicio.update({
      precio:
        999,
    });

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}/servicios/${itemId}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          cantidad:
            3,
        });

    expect(
      response.status
    ).toBe(200);

    /**
     * Debe conservar el precio histórico:
     *
     * 100 × 3 = 300
     *
     * NO:
     * 999 × 3
     */
    expect(
      Number(
        response.body.data
          .item
          .subtotal
      )
    ).toBeCloseTo(
      300,
      2
    );
  }
);

it(
  "23. actualizar cantidad recalcula total y anticipo",
  async () => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",

        total:
          5000,
      });

    const servicio =
      await createServicioEvento({
        precio:
          250,
      });

    const created =
      await request(app)
        .post(
          `/api/reservas-evento/${reserva.id}/servicios`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          servicio_evento_id:
            servicio.id,

          cantidad:
            2,
        });

    const anticipoAnterior =
      Number(
        created.body.data
          .reserva
          .anticipo
      );

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}/servicios/${created.body.data.item.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          cantidad:
            4,
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      Number(
        response.body.data
          .reserva
          .total
      )
    ).toBeCloseTo(
      6000,
      2
    );

    expect(
      Number(
        response.body.data
          .reserva
          .anticipo
      )
    ).toBeGreaterThan(
      anticipoAnterior
    );
  }
);

it(
  "24. otro usuario no puede actualizar el servicio",
  async () => {
    const salon =
      await createSalonEvento();

    const owner =
      await createAuthenticatedUser();

    const intruso =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          owner.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",
      });

    const servicio =
      await createServicioEvento();

    const item =
      await createReservaEventoServicioFixture({
        reserva_evento_id:
          reserva.id,

        servicio_evento_id:
          servicio.id,

        cantidad:
          1,

        subtotal:
          300,
      });

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}/servicios/${item.id}`
        )
        .set(
          "Authorization",
          `Bearer ${intruso.token}`
        )
        .send({
          cantidad:
            2,
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
  "25. no permite actualizar servicio de reserva confirmada",
  async () => {
    const salon =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "confirmada",
      });

    const servicio =
      await createServicioEvento();

    const item =
      await createReservaEventoServicioFixture({
        reserva_evento_id:
          reserva.id,

        servicio_evento_id:
          servicio.id,

        cantidad:
          1,

        subtotal:
          300,
      });

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}/servicios/${item.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          cantidad:
            2,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "EVENT_RESERVATION_NOT_EDITABLE"
    );
  }
);

it(
  "26. PATCH rechaza cantidad cero",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const response =
      await request(app)
        .patch(
          "/api/reservas-evento/1/servicios/1"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          cantidad:
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
  "27. PATCH rechaza ID de asociación no numérico",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const response =
      await request(app)
        .patch(
          "/api/reservas-evento/1/servicios/abc"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          cantidad:
            2,
        });

    expect(
      response.status
    ).toBe(400);
  }
);

it(
  "28. propietario puede eliminar un servicio",
  async () => {
    const salon =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",
      });

    const servicio =
      await createServicioEvento();

    const item =
      await createReservaEventoServicioFixture({
        reserva_evento_id:
          reserva.id,

        servicio_evento_id:
          servicio.id,

        cantidad:
          1,

        subtotal:
          300,
      });

    const response =
      await request(app)
        .delete(
          `/api/reservas-evento/${reserva.id}/servicios/${item.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        );

    expect(
      response.status
    ).toBe(204);

    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEventoServicio,
    } = db;

    const persisted =
      await ReservaEventoServicio.findByPk(
        item.id
      );

    expect(
      persisted
    ).toBeNull();
  }
);

it(
  "29. eliminar servicio recalcula total a la tarifa base",
  async () => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",

        total:
          5000,
      });

    const servicio =
      await createServicioEvento({
        precio:
          500,
      });

    const created =
      await request(app)
        .post(
          `/api/reservas-evento/${reserva.id}/servicios`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          servicio_evento_id:
            servicio.id,

          cantidad:
            2,
        });

    expect(
      Number(
        created.body.data
          .reserva
          .total
      )
    ).toBeCloseTo(
      6000,
      2
    );

    const response =
      await request(app)
        .delete(
          `/api/reservas-evento/${reserva.id}/servicios/${created.body.data.item.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        );

    expect(
      response.status
    ).toBe(204);

    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEvento,
    } = db;

    const actualizada =
      await ReservaEvento.findByPk(
        reserva.id
      );

    expect(
      Number(
        actualizada.total
      )
    ).toBeCloseTo(
      5000,
      2
    );
  }
);

it(
  "30. otro usuario no puede eliminar el servicio",
  async () => {
    const salon =
      await createSalonEvento();

    const owner =
      await createAuthenticatedUser();

    const intruso =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          owner.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",
      });

    const servicio =
      await createServicioEvento();

    const item =
      await createReservaEventoServicioFixture({
        reserva_evento_id:
          reserva.id,

        servicio_evento_id:
          servicio.id,

        cantidad:
          1,

        subtotal:
          300,
      });

    const response =
      await request(app)
        .delete(
          `/api/reservas-evento/${reserva.id}/servicios/${item.id}`
        )
        .set(
          "Authorization",
          `Bearer ${intruso.token}`
        );

    expect(
      response.status
    ).toBe(403);
  }
);

it(
  "31. no permite eliminar servicio de reserva confirmada",
  async () => {
    const salon =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "confirmada",
      });

    const servicio =
      await createServicioEvento();

    const item =
      await createReservaEventoServicioFixture({
        reserva_evento_id:
          reserva.id,

        servicio_evento_id:
          servicio.id,

        cantidad:
          1,

        subtotal:
          300,
      });

    const response =
      await request(app)
        .delete(
          `/api/reservas-evento/${reserva.id}/servicios/${item.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        );

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "EVENT_RESERVATION_NOT_EDITABLE"
    );
  }
);

it(
  "32. DELETE de asociación perteneciente a otra reserva devuelve 404",
  async () => {
    const salonA =
      await createSalonEvento();

    const salonB =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    const reservaA =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salonA.id,

        estado:
          "cotizacion",
      });

    const reservaB =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salonB.id,

        estado:
          "cotizacion",
      });

    const servicio =
      await createServicioEvento();

    const item =
      await createReservaEventoServicioFixture({
        reserva_evento_id:
          reservaA.id,

        servicio_evento_id:
          servicio.id,

        cantidad:
          1,

        subtotal:
          300,
      });

    const response =
      await request(app)
        .delete(
          `/api/reservas-evento/${reservaB.id}/servicios/${item.id}`
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
      "EVENT_RESERVATION_SERVICE_NOT_FOUND"
    );
  }
);

it(
  "33. concurrencia duplicado: solo una solicitud puede agregar el mismo servicio",
  async () => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",

        total:
          5000,
      });

    const servicio =
      await createServicioEvento({
        precio:
          300,
      });

    /**
     * Las 20 peticiones compiten por agregar
     * exactamente el mismo servicio
     * a la misma reserva.
     */
    const responses =
      await Promise.all(
        Array.from(
          {
            length: 20,
          },
          () =>
            request(app)
              .post(
                `/api/reservas-evento/${reserva.id}/servicios`
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                servicio_evento_id:
                  servicio.id,

                cantidad:
                  2,
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
      "[QA CONCURRENCIA DUPLICADO SERVICIO EVENTO]",
      {
        total:
          responses.length,

        creadas:
          created.length,

        conflictos:
          conflicts.length,

        inesperadas:
          unexpected.map(
            (response) => ({
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
     * Todos los rechazos deben ser
     * específicamente por servicio duplicado.
     */
    for (
      const conflict of
      conflicts
    ) {
      expect(
        conflict.body.code
      ).toBe(
        "EVENT_SERVICE_ALREADY_ADDED"
      );
    }

    /**
     * Verificación directa en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEventoServicio,
      ReservaEvento,
    } = db;

    const asociaciones =
      await ReservaEventoServicio.count({
        where: {
          reserva_evento_id:
            reserva.id,

          servicio_evento_id:
            servicio.id,
        },
      });

    expect(
      asociaciones
    ).toBe(1);

    /**
     * tarifa salón:
     * 5000
     *
     * servicio:
     * 300 × 2 = 600
     *
     * total esperado:
     * 5600
     *
     * Si la carrera estuviera rota,
     * también podríamos detectar un total
     * incorrectamente multiplicado.
     */
    const reservaPersistida =
      await ReservaEvento.findByPk(
        reserva.id
      );

    expect(
      Number(
        reservaPersistida.total
      )
    ).toBeCloseTo(
      5600,
      2
    );
  }
);

it(
  "34. concurrencia múltiples servicios: conserva todas las asociaciones y el total exacto",
  async () => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",

        total:
          5000,
      });

    /**
     * Creamos 20 servicios diferentes.
     *
     * Cada servicio tendrá:
     *
     * 100, 110, 120, ... 290
     */
    const servicios = [];

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const servicio =
        await createServicioEvento({
          precio:
            100 +
            i * 10,
        });

      servicios.push(
        servicio
      );
    }

    /**
     * Calculamos nosotros mismos cuánto
     * deberían sumar todos los servicios.
     */
    const totalServicios =
      servicios.reduce(
        (
          accumulator,
          servicio
        ) =>
          accumulator +
          Number(
            servicio.precio
          ),
        0
      );

    const totalEsperado =
      5000 +
      totalServicios;

    /**
     * Lanzamos los 20 POST al mismo tiempo.
     *
     * Como son servicios diferentes,
     * TODOS deben ser aceptados.
     */
    const responses =
      await Promise.all(
        servicios.map(
          (servicio) =>
            request(app)
              .post(
                `/api/reservas-evento/${reserva.id}/servicios`
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                servicio_evento_id:
                  servicio.id,

                cantidad:
                  1,
              })
        )
      );

    const created =
      responses.filter(
        (response) =>
          response.status ===
          201
      );

    const unexpected =
      responses.filter(
        (response) =>
          response.status !==
          201
      );

    console.log(
      "[QA CONCURRENCIA MULTIPLES SERVICIOS EVENTO]",
      {
        total:
          responses.length,

        creadas:
          created.length,

        inesperadas:
          unexpected.map(
            (response) => ({
              status:
                response.status,

              code:
                response.body.code,

              body:
                response.body,
            })
          ),

        totalServicios,

        totalEsperado,
      }
    );

    expect(
      created
    ).toHaveLength(20);

    expect(
      unexpected
    ).toHaveLength(0);

    /**
     * Verificación directa en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEventoServicio,
      ReservaEvento,
    } = db;

    const asociaciones =
      await ReservaEventoServicio.findAll({
        where: {
          reserva_evento_id:
            reserva.id,
        },
      });

    expect(
      asociaciones
    ).toHaveLength(20);

    /**
     * Cada servicio fue agregado una sola vez.
     */
    const idsPersistidos =
      asociaciones.map(
        (item: any) =>
          item.servicio_evento_id
      );

    expect(
      new Set(
        idsPersistidos
      ).size
    ).toBe(20);

    /**
     * La suma real de subtotales también
     * debe coincidir.
     */
    const sumaSubtotales =
      asociaciones.reduce(
        (
          accumulator: number,
          item: any
        ) =>
          accumulator +
          Number(
            item.subtotal
          ),
        0
      );

    expect(
      sumaSubtotales
    ).toBeCloseTo(
      totalServicios,
      2
    );

    /**
     * Y lo más importante:
     *
     * tarifa_base + TODOS los servicios.
     *
     * Si hubiera lost updates durante
     * recalculateReservation(), aquí
     * aparecería un total inferior.
     */
    const reservaPersistida =
      await ReservaEvento.findByPk(
        reserva.id
      );

    expect(
      Number(
        reservaPersistida.total
      )
    ).toBeCloseTo(
      totalEsperado,
      2
    );
  }
);

it(
  "35. concurrencia PATCH: múltiples actualizaciones mantienen montos consistentes",
  async () => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",

        total:
          5000,
      });

    const servicio =
      await createServicioEvento({
        precio:
          250,
      });

    /**
     * Creamos primero la asociación normalmente.
     *
     * Precio histórico:
     * 250 por unidad.
     */
    const created =
      await request(app)
        .post(
          `/api/reservas-evento/${reserva.id}/servicios`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          servicio_evento_id:
            servicio.id,

          cantidad:
            1,
        });

    expect(
      created.status
    ).toBe(201);

    const itemId =
      created.body.data.item.id;

    /**
     * 20 cantidades diferentes:
     *
     * 1, 2, 3, ... 20
     *
     * Todas intentan actualizar simultáneamente
     * la misma asociación.
     */
    const cantidades =
      Array.from(
        {
          length: 20,
        },
        (_, index) =>
          index + 1
      );

    const responses =
      await Promise.all(
        cantidades.map(
          (cantidad) =>
            request(app)
              .patch(
                `/api/reservas-evento/${reserva.id}/servicios/${itemId}`
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                cantidad,
              })
        )
      );

    const updated =
      responses.filter(
        (response) =>
          response.status ===
          200
      );

    const unexpected =
      responses.filter(
        (response) =>
          response.status !==
          200
      );

    console.log(
      "[QA CONCURRENCIA PATCH SERVICIO EVENTO]",
      {
        total:
          responses.length,

        actualizadas:
          updated.length,

        inesperadas:
          unexpected.map(
            (response) => ({
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
     * Todas son operaciones válidas.
     */
    expect(
      updated
    ).toHaveLength(20);

    expect(
      unexpected
    ).toHaveLength(0);

    /**
     * Verificación directa en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEventoServicio,
      ReservaEvento,
    } = db;

    const itemPersistido =
      await ReservaEventoServicio.findByPk(
        itemId
      );

    expect(
      itemPersistido
    ).not.toBeNull();

    const cantidadFinal =
      Number(
        itemPersistido.cantidad
      );

    /**
     * El ganador final puede ser cualquiera
     * de las 20 cantidades enviadas.
     */
    expect(
      cantidades
    ).toContain(
      cantidadFinal
    );

    /**
     * El precio histórico debe seguir siendo 250.
     *
     * subtotal final =
     * cantidad final × 250.
     */
    const subtotalEsperado =
      cantidadFinal *
      250;

    expect(
      Number(
        itemPersistido.subtotal
      )
    ).toBeCloseTo(
      subtotalEsperado,
      2
    );

    /**
     * La reserva también debe quedar
     * perfectamente sincronizada.
     */
    const reservaPersistida =
      await ReservaEvento.findByPk(
        reserva.id
      );

    expect(
      Number(
        reservaPersistida.total
      )
    ).toBeCloseTo(
      5000 +
        subtotalEsperado,
      2
    );

    /**
     * Validamos también el anticipo.
     *
     * No necesitamos conocer aquí el
     * porcentaje exacto de configuración.
     * Solo comprobamos que sea positivo
     * y coherente con una reserva cotizada.
     */
    expect(
      Number(
        reservaPersistida.anticipo
      )
    ).toBeGreaterThan(0);

    console.log(
      "[QA ESTADO FINAL PATCH SERVICIO EVENTO]",
      {
        cantidadFinal,

        subtotalFinal:
          Number(
            itemPersistido.subtotal
          ),

        totalFinal:
          Number(
            reservaPersistida.total
          ),

        anticipoFinal:
          Number(
            reservaPersistida.anticipo
          ),
      }
    );
  }
);

it(
  "36. concurrencia DELETE: solo una solicitud puede eliminar la misma asociación",
  async () => {
    const salon =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        estado:
          "cotizacion",

        total:
          5000,
      });

    const servicio =
      await createServicioEvento({
        precio:
          500,
      });

    /**
     * Agregamos el servicio normalmente
     * para que total y anticipo también
     * queden calculados por el backend.
     */
    const created =
      await request(app)
        .post(
          `/api/reservas-evento/${reserva.id}/servicios`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          servicio_evento_id:
            servicio.id,

          cantidad:
            2,
        });

    expect(
      created.status
    ).toBe(201);

    expect(
      Number(
        created.body.data
          .reserva.total
      )
    ).toBeCloseTo(
      6000,
      2
    );

    const itemId =
      created.body.data
        .item.id;

    /**
     * Veinte solicitudes intentan
     * eliminar exactamente el mismo item.
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
                `/api/reservas-evento/${reserva.id}/servicios/${itemId}`
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
      "[QA CONCURRENCIA DELETE SERVICIO EVENTO]",
      {
        total:
          responses.length,

        eliminadas:
          deleted.length,

        noEncontradas:
          notFound.length,

        inesperadas:
          unexpected.map(
            (response) => ({
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

    expect(
      deleted
    ).toHaveLength(1);

    expect(
      notFound
    ).toHaveLength(19);

    expect(
      unexpected
    ).toHaveLength(0);

    /**
     * Las otras 19 solicitudes deben
     * descubrir que la asociación ya
     * fue eliminada por la ganadora.
     */
    for (
      const response of
      notFound
    ) {
      expect(
        response.body.code
      ).toBe(
        "EVENT_RESERVATION_SERVICE_NOT_FOUND"
      );
    }

    /**
     * Verificación directa en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEventoServicio,
      ReservaEvento,
    } = db;

    const itemPersistido =
      await ReservaEventoServicio.findByPk(
        itemId
      );

    expect(
      itemPersistido
    ).toBeNull();

    /**
     * Al quedar nuevamente sin servicios:
     *
     * total = tarifa base = 5000
     */
    const reservaPersistida =
      await ReservaEvento.findByPk(
        reserva.id
      );

    expect(
      Number(
        reservaPersistida.total
      )
    ).toBeCloseTo(
      5000,
      2
    );

    console.log(
      "[QA ESTADO FINAL DELETE SERVICIO EVENTO]",
      {
        itemExiste:
          itemPersistido !==
          null,

        totalFinal:
          Number(
            reservaPersistida.total
          ),

        anticipoFinal:
          Number(
            reservaPersistida.anticipo
          ),
      }
    );
  }
);

it(
  "37. concurrencia ADD vs CANCEL: mantiene un resultado serializable",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const casos: Array<{
      reservaId: number;
      servicioId: number;
    }> = [];

    /**
     * Creamos 20 escenarios independientes.
     *
     * Cada escenario tendrá:
     *
     * - una reserva en cotizacion
     * - un servicio todavía NO agregado
     */
    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const salon =
        await createSalonEvento({
          tarifa_base:
            5000,
        });

      const reserva =
        await createReservaEventoFixture({
          usuario_id:
            cliente.usuario.id,

          salon_id:
            salon.id,

          estado:
            "cotizacion",

          total:
            5000,
        });

      const servicio =
        await createServicioEvento({
          precio:
            300,
        });

      casos.push({
        reservaId:
          reserva.id,

        servicioId:
          servicio.id,
      });
    }

    /**
     * Por cada reserva lanzamos simultáneamente:
     *
     * POST servicio
     * vs
     * PATCH cancelar reserva
     */
    const resultados =
      await Promise.all(
        casos.map(
          async (
            caso
          ) => {
            const [
              addResponse,
              cancelResponse,
            ] =
              await Promise.all([
                request(app)
                  .post(
                    `/api/reservas-evento/${caso.reservaId}/servicios`
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  )
                  .send({
                    servicio_evento_id:
                      caso.servicioId,

                    cantidad:
                      1,
                  }),

                request(app)
                  .patch(
                    `/api/reservas-evento/${caso.reservaId}/cancelar`
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  ),
              ]);

            return {
              ...caso,
              addResponse,
              cancelResponse,
            };
          }
        )
      );

    const addOk =
      resultados.filter(
        ({
          addResponse,
        }) =>
          addResponse.status ===
          201
      );

    const addBlocked =
      resultados.filter(
        ({
          addResponse,
        }) =>
          addResponse.status ===
          409
      );

    const cancelOk =
      resultados.filter(
        ({
          cancelResponse,
        }) =>
          cancelResponse.status ===
          200
      );

    const unexpected =
      resultados.filter(
        ({
          addResponse,
          cancelResponse,
        }) =>
          ![
            201,
            409,
          ].includes(
            addResponse.status
          ) ||
          cancelResponse.status !==
            200
      );

    console.log(
      "[QA CONCURRENCIA ADD SERVICIO VS CANCEL EVENTO]",
      {
        totalCasos:
          resultados.length,

        serviciosAgregados:
          addOk.length,

        serviciosBloqueados:
          addBlocked.length,

        cancelacionesExitosas:
          cancelOk.length,

        inesperadas:
          unexpected.map(
            ({
              reservaId,
              addResponse,
              cancelResponse,
            }) => ({
              reservaId,

              addStatus:
                addResponse.status,

              addCode:
                addResponse.body.code,

              cancelStatus:
                cancelResponse.status,

              cancelCode:
                cancelResponse.body.code,
            })
          ),
      }
    );

    /**
     * Todas las cancelaciones deben
     * completarse correctamente.
     */
    expect(
      cancelOk
    ).toHaveLength(20);

    /**
     * ADD solamente puede:
     *
     * 201 -> ganó antes del CANCEL
     * 409 -> CANCEL ganó primero
     */
    expect(
      addOk.length +
        addBlocked.length
    ).toBe(20);

    expect(
      unexpected
    ).toHaveLength(0);

    for (
      const {
        addResponse,
      } of resultados
    ) {
      if (
        addResponse.status ===
        409
      ) {
        expect(
          addResponse.body.code
        ).toBe(
          "EVENT_RESERVATION_NOT_EDITABLE"
        );
      }
    }

    /**
     * Verificación directa en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEvento,
      ReservaEventoServicio,
    } = db;

    for (
      const resultado of
      resultados
    ) {
      const reservaPersistida =
        await ReservaEvento.findByPk(
          resultado.reservaId
        );

      expect(
        reservaPersistida
      ).not.toBeNull();

      /**
       * Sin importar quién ganó primero,
       * todas deben terminar canceladas.
       */
      expect(
        reservaPersistida.estado
      ).toBe(
        "cancelada"
      );

      const itemPersistido =
        await ReservaEventoServicio.findOne({
          where: {
            reserva_evento_id:
              resultado.reservaId,

            servicio_evento_id:
              resultado.servicioId,
          },
        });

      if (
        resultado.addResponse
          .status ===
        201
      ) {
        /**
         * ADD ganó primero.
         *
         * El servicio debe existir y:
         *
         * 5000 + 300 = 5300
         */
        expect(
          itemPersistido
        ).not.toBeNull();

        expect(
          Number(
            reservaPersistida.total
          )
        ).toBeCloseTo(
          5300,
          2
        );
      } else {
        /**
         * CANCEL ganó primero.
         *
         * ADD fue rechazado,
         * por lo que no puede existir
         * ninguna asociación.
         */
        expect(
          itemPersistido
        ).toBeNull();

        expect(
          Number(
            reservaPersistida.total
          )
        ).toBeCloseTo(
          5000,
          2
        );
      }
    }
  }
);

it(
  "38. concurrencia UPDATE vs CANCEL: mantiene servicio y montos serializables",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const casos: Array<{
      reservaId: number;
      itemId: number;
    }> = [];

    /**
     * Creamos 20 escenarios independientes.
     *
     * Cada reserva empieza:
     *
     * tarifa base = 5000
     * servicio    = 300 × 1
     * total       = 5300
     */
    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const salon =
        await createSalonEvento({
          tarifa_base:
            5000,
        });

      const reserva =
        await createReservaEventoFixture({
          usuario_id:
            cliente.usuario.id,

          salon_id:
            salon.id,

          estado:
            "cotizacion",

          total:
            5000,
        });

      const servicio =
        await createServicioEvento({
          precio:
            300,
        });

      const created =
        await request(app)
          .post(
            `/api/reservas-evento/${reserva.id}/servicios`
          )
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            servicio_evento_id:
              servicio.id,

            cantidad:
              1,
          });

      expect(
        created.status
      ).toBe(201);

      casos.push({
        reservaId:
          reserva.id,

        itemId:
          created.body.data
            .item.id,
      });
    }

    /**
     * Cada caso recibe simultáneamente:
     *
     * PATCH cantidad 1 -> 2
     *
     * vs
     *
     * CANCEL reserva
     */
    const resultados =
      await Promise.all(
        casos.map(
          async (
            caso
          ) => {
            const [
              updateResponse,
              cancelResponse,
            ] =
              await Promise.all([
                request(app)
                  .patch(
                    `/api/reservas-evento/${caso.reservaId}/servicios/${caso.itemId}`
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  )
                  .send({
                    cantidad:
                      2,
                  }),

                request(app)
                  .patch(
                    `/api/reservas-evento/${caso.reservaId}/cancelar`
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  ),
              ]);

            return {
              ...caso,
              updateResponse,
              cancelResponse,
            };
          }
        )
      );

    const updatesOk =
      resultados.filter(
        ({
          updateResponse,
        }) =>
          updateResponse.status ===
          200
      );

    const updatesBlocked =
      resultados.filter(
        ({
          updateResponse,
        }) =>
          updateResponse.status ===
          409
      );

    const cancelsOk =
      resultados.filter(
        ({
          cancelResponse,
        }) =>
          cancelResponse.status ===
          200
      );

    const unexpected =
      resultados.filter(
        ({
          updateResponse,
          cancelResponse,
        }) =>
          ![
            200,
            409,
          ].includes(
            updateResponse.status
          ) ||
          cancelResponse.status !==
            200
      );

    console.log(
      "[QA CONCURRENCIA UPDATE SERVICIO VS CANCEL EVENTO]",
      {
        totalCasos:
          resultados.length,

        actualizacionesExitosas:
          updatesOk.length,

        actualizacionesBloqueadas:
          updatesBlocked.length,

        cancelacionesExitosas:
          cancelsOk.length,

        inesperadas:
          unexpected.map(
            ({
              reservaId,
              updateResponse,
              cancelResponse,
            }) => ({
              reservaId,

              updateStatus:
                updateResponse.status,

              updateCode:
                updateResponse.body.code,

              cancelStatus:
                cancelResponse.status,

              cancelCode:
                cancelResponse.body.code,
            })
          ),
      }
    );

    /**
     * Todas las reservas deben poder
     * terminar canceladas.
     */
    expect(
      cancelsOk
    ).toHaveLength(20);

    /**
     * UPDATE solo puede:
     *
     * 200 -> ganó antes del CANCEL
     * 409 -> CANCEL ganó primero
     */
    expect(
      updatesOk.length +
        updatesBlocked.length
    ).toBe(20);

    expect(
      unexpected
    ).toHaveLength(0);

    for (
      const {
        updateResponse,
      } of resultados
    ) {
      if (
        updateResponse.status ===
        409
      ) {
        expect(
          updateResponse.body.code
        ).toBe(
          "EVENT_RESERVATION_NOT_EDITABLE"
        );
      }
    }

    /**
     * Verificamos el estado real
     * persistido.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEvento,
      ReservaEventoServicio,
    } = db;

    for (
      const resultado of
      resultados
    ) {
      const reservaPersistida =
        await ReservaEvento.findByPk(
          resultado.reservaId
        );

      const itemPersistido =
        await ReservaEventoServicio.findByPk(
          resultado.itemId
        );

      expect(
        reservaPersistida
      ).not.toBeNull();

      expect(
        itemPersistido
      ).not.toBeNull();

      /**
       * En ambos órdenes la reserva
       * debe terminar cancelada.
       */
      expect(
        reservaPersistida.estado
      ).toBe(
        "cancelada"
      );

      if (
        resultado.updateResponse
          .status ===
        200
      ) {
        /**
         * UPDATE ganó primero.
         *
         * 300 × 2 = 600
         * 5000 + 600 = 5600
         */
        expect(
          Number(
            itemPersistido.cantidad
          )
        ).toBe(2);

        expect(
          Number(
            itemPersistido.subtotal
          )
        ).toBeCloseTo(
          600,
          2
        );

        expect(
          Number(
            reservaPersistida.total
          )
        ).toBeCloseTo(
          5600,
          2
        );
      } else {
        /**
         * CANCEL ganó primero.
         *
         * UPDATE fue rechazado.
         */
        expect(
          Number(
            itemPersistido.cantidad
          )
        ).toBe(1);

        expect(
          Number(
            itemPersistido.subtotal
          )
        ).toBeCloseTo(
          300,
          2
        );

        expect(
          Number(
            reservaPersistida.total
          )
        ).toBeCloseTo(
          5300,
          2
        );
      }
    }
  }
);

it(
  "39. concurrencia DELETE vs CANCEL: mantiene eliminación y montos serializables",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const casos: Array<{
      reservaId: number;
      itemId: number;
    }> = [];

    /**
     * 20 escenarios independientes.
     *
     * Estado inicial por caso:
     *
     * tarifa base = 5000
     * servicio    = 300 × 1
     * total       = 5300
     */
    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const salon =
        await createSalonEvento({
          tarifa_base:
            5000,
        });

      const reserva =
        await createReservaEventoFixture({
          usuario_id:
            cliente.usuario.id,

          salon_id:
            salon.id,

          estado:
            "cotizacion",

          total:
            5000,
        });

      const servicio =
        await createServicioEvento({
          precio:
            300,
        });

      const created =
        await request(app)
          .post(
            `/api/reservas-evento/${reserva.id}/servicios`
          )
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            servicio_evento_id:
              servicio.id,

            cantidad:
              1,
          });

      expect(
        created.status
      ).toBe(201);

      casos.push({
        reservaId:
          reserva.id,

        itemId:
          created.body.data
            .item.id,
      });
    }

    /**
     * Cada caso recibe simultáneamente:
     *
     * DELETE servicio
     *
     * vs
     *
     * CANCEL reserva
     */
    const resultados =
      await Promise.all(
        casos.map(
          async (
            caso
          ) => {
            const [
              deleteResponse,
              cancelResponse,
            ] =
              await Promise.all([
                request(app)
                  .delete(
                    `/api/reservas-evento/${caso.reservaId}/servicios/${caso.itemId}`
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  ),

                request(app)
                  .patch(
                    `/api/reservas-evento/${caso.reservaId}/cancelar`
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  ),
              ]);

            return {
              ...caso,
              deleteResponse,
              cancelResponse,
            };
          }
        )
      );

    const deletesOk =
      resultados.filter(
        ({
          deleteResponse,
        }) =>
          deleteResponse.status ===
          204
      );

    const deletesBlocked =
      resultados.filter(
        ({
          deleteResponse,
        }) =>
          deleteResponse.status ===
          409
      );

    const cancelsOk =
      resultados.filter(
        ({
          cancelResponse,
        }) =>
          cancelResponse.status ===
          200
      );

    const unexpected =
      resultados.filter(
        ({
          deleteResponse,
          cancelResponse,
        }) =>
          ![
            204,
            409,
          ].includes(
            deleteResponse.status
          ) ||
          cancelResponse.status !==
            200
      );

    console.log(
      "[QA CONCURRENCIA DELETE SERVICIO VS CANCEL EVENTO]",
      {
        totalCasos:
          resultados.length,

        eliminacionesExitosas:
          deletesOk.length,

        eliminacionesBloqueadas:
          deletesBlocked.length,

        cancelacionesExitosas:
          cancelsOk.length,

        inesperadas:
          unexpected.map(
            ({
              reservaId,
              deleteResponse,
              cancelResponse,
            }) => ({
              reservaId,

              deleteStatus:
                deleteResponse.status,

              deleteCode:
                deleteResponse.body.code,

              cancelStatus:
                cancelResponse.status,

              cancelCode:
                cancelResponse.body.code,
            })
          ),
      }
    );

    /**
     * Todas las cancelaciones deben finalizar.
     */
    expect(
      cancelsOk
    ).toHaveLength(20);

    /**
     * DELETE solamente puede:
     *
     * 204 -> ganó antes de CANCEL
     * 409 -> CANCEL ganó primero
     */
    expect(
      deletesOk.length +
        deletesBlocked.length
    ).toBe(20);

    expect(
      unexpected
    ).toHaveLength(0);

    for (
      const {
        deleteResponse,
      } of resultados
    ) {
      if (
        deleteResponse.status ===
        409
      ) {
        expect(
          deleteResponse.body.code
        ).toBe(
          "EVENT_RESERVATION_NOT_EDITABLE"
        );
      }
    }

    /**
     * Verificación directa contra PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEvento,
      ReservaEventoServicio,
    } = db;

    for (
      const resultado of
      resultados
    ) {
      const reservaPersistida =
        await ReservaEvento.findByPk(
          resultado.reservaId
        );

      const itemPersistido =
        await ReservaEventoServicio.findByPk(
          resultado.itemId
        );

      expect(
        reservaPersistida
      ).not.toBeNull();

      /**
       * Todas terminan canceladas.
       */
      expect(
        reservaPersistida.estado
      ).toBe(
        "cancelada"
      );

      if (
        resultado.deleteResponse
          .status ===
        204
      ) {
        /**
         * DELETE ganó primero.
         *
         * item eliminado
         * total vuelve a tarifa base
         */
        expect(
          itemPersistido
        ).toBeNull();

        expect(
          Number(
            reservaPersistida.total
          )
        ).toBeCloseTo(
          5000,
          2
        );
      } else {
        /**
         * CANCEL ganó primero.
         *
         * DELETE fue rechazado,
         * así que el item permanece.
         */
        expect(
          itemPersistido
        ).not.toBeNull();

        expect(
          Number(
            itemPersistido.cantidad
          )
        ).toBe(1);

        expect(
          Number(
            itemPersistido.subtotal
          )
        ).toBeCloseTo(
          300,
          2
        );

        expect(
          Number(
            reservaPersistida.total
          )
        ).toBeCloseTo(
          5300,
          2
        );
      }
    }
  }
);
  }
);