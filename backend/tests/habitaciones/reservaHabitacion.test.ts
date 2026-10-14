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
  createAuthenticatedUser,
} from "../helpers/auth";

import {
  createTestUser,
} from "../fixtures/users";

import {
  createHotelFixture,
} from "../fixtures/hotel";

describe(
  "Reservas de habitación",
  () => {
    it(
      "1. cliente crea una reserva válida para sí mismo",
      async () => {
        const hotel =
          await createHotelFixture({
            capacidad: 4,
            tarifa: 100,
          });

        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-13",

              numero_huespedes:
                2,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body
            .data
            .usuario_id
        ).toBe(
          cliente.usuario.id
        );

        expect(
          response.body
            .data
            .habitacion_id
        ).toBe(
          hotel.habitacion.id
        );

        expect(
          response.body
            .data
            .estado
        ).toBe(
          "pendiente"
        );

        /**
         * 3 noches x Q100.
         */
        expect(
          Number(
            response.body
              .data
              .total
          )
        ).toBe(300);
      }
    );

    it(
      "2. cliente no puede reservar a nombre de otro usuario",
      async () => {
        const hotel =
          await createHotelFixture();

        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const otroUsuario =
          await createTestUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              /**
               * Intentamos falsificar
               * el propietario.
               */
              usuario_id:
                otroUsuario
                  .usuario
                  .id,

              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-12",

              numero_huespedes:
                2,
            });

        expect(
          response.status
        ).toBe(201);

        /**
         * El controller debe ignorar
         * usuario_id del cliente y usar
         * siempre req.user.id.
         */
        expect(
          response.body
            .data
            .usuario_id
        ).toBe(
          cliente.usuario.id
        );

        expect(
          response.body
            .data
            .usuario_id
        ).not.toBe(
          otroUsuario
            .usuario
            .id
        );
      }
    );

    it(
      "3. admin debe indicar usuario_id al crear una reserva",
      async () => {
        const hotel =
          await createHotelFixture();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-12",

              numero_huespedes:
                2,
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
      "4. admin puede crear reserva para un usuario existente",
      async () => {
        const hotel =
          await createHotelFixture();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const cliente =
          await createTestUser({
            rol:
              ROLES.CLIENTE,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              usuario_id:
                cliente.usuario.id,

              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-12",

              numero_huespedes:
                2,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body
            .data
            .usuario_id
        ).toBe(
          cliente.usuario.id
        );
      }
    );

    it(
      "5. rechaza una habitación inexistente",
      async () => {
        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                999999,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-12",

              numero_huespedes:
                2,
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "HABITACION_NOT_FOUND"
        );
      }
    );

    it(
      "6. admin no puede reservar para un usuario inexistente",
      async () => {
        const hotel =
          await createHotelFixture();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              usuario_id:
                999999,

              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-12",

              numero_huespedes:
                2,
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "USUARIO_NOT_FOUND"
        );
      }
    );

    it(
      "7. rechaza huéspedes que exceden la capacidad máxima",
      async () => {
        const hotel =
          await createHotelFixture({
            capacidad: 2,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-12",

              numero_huespedes:
                3,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "CAPACIDAD_EXCEDIDA"
        );
      }
    );

    it(
      "8. permite exactamente la capacidad máxima",
      async () => {
        const hotel =
          await createHotelFixture({
            capacidad: 2,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-12",

              numero_huespedes:
                2,
            });

        expect(
          response.status
        ).toBe(201);
      }
    );

    it(
      "9. rechaza habitación en mantenimiento",
      async () => {
        const hotel =
          await createHotelFixture({
            estadoHabitacion:
              "mantenimiento",
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-12",

              numero_huespedes:
                1,
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "HABITACION_EN_MANTENIMIENTO"
        );
      }
    );

    it(
      "10. rechaza una fecha de entrada en el pasado",
      async () => {
        const hotel =
          await createHotelFixture();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2026-01-10",

              fecha_salida:
                "2026-01-12",

              numero_huespedes:
                1,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "ROOM_RESERVATION_DATE_IN_PAST"
        );
      }
    );

    it(
      "11. rechaza salida igual a entrada",
      async () => {
        const hotel =
          await createHotelFixture();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-06-10",

              fecha_salida:
                "2027-06-10",

              numero_huespedes:
                1,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "FECHAS_INVALIDAS"
        );
      }
    );

    it(
      "12. rechaza una fecha calendario inexistente",
      async () => {
        const hotel =
          await createHotelFixture();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-02-30",

              fecha_salida:
                "2027-03-03",

              numero_huespedes:
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
  "13. rechaza un traslape exacto",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const token =
      cliente.token;

    const reservaBase =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-07-10",
          fecha_salida:
            "2027-07-15",
          numero_huespedes: 2,
        });

    expect(
      reservaBase.status
    ).toBe(201);

    const response =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-07-10",
          fecha_salida:
            "2027-07-15",
          numero_huespedes: 2,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "HABITACION_NO_DISPONIBLE"
    );
  }
);

it(
  "14. rechaza traslape parcial por el inicio",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    await request(app)
      .post(
        "/api/reservas-habitacion"
      )
      .set(
        "Authorization",
        `Bearer ${cliente.token}`
      )
      .send({
        habitacion_id:
          hotel.habitacion.id,
        fecha_entrada:
          "2027-07-10",
        fecha_salida:
          "2027-07-15",
        numero_huespedes: 2,
      });

    const response =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-07-08",
          fecha_salida:
            "2027-07-12",
          numero_huespedes: 2,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "HABITACION_NO_DISPONIBLE"
    );
  }
);

it(
  "15. rechaza traslape parcial por el final",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    await request(app)
      .post(
        "/api/reservas-habitacion"
      )
      .set(
        "Authorization",
        `Bearer ${cliente.token}`
      )
      .send({
        habitacion_id:
          hotel.habitacion.id,
        fecha_entrada:
          "2027-07-10",
        fecha_salida:
          "2027-07-15",
        numero_huespedes: 2,
      });

    const response =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-07-13",
          fecha_salida:
            "2027-07-18",
          numero_huespedes: 2,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "HABITACION_NO_DISPONIBLE"
    );
  }
);

it(
  "16. rechaza una reserva contenida dentro de otra",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    await request(app)
      .post(
        "/api/reservas-habitacion"
      )
      .set(
        "Authorization",
        `Bearer ${cliente.token}`
      )
      .send({
        habitacion_id:
          hotel.habitacion.id,
        fecha_entrada:
          "2027-07-10",
        fecha_salida:
          "2027-07-20",
        numero_huespedes: 2,
      });

    const response =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-07-12",
          fecha_salida:
            "2027-07-15",
          numero_huespedes: 2,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "HABITACION_NO_DISPONIBLE"
    );
  }
);

it(
  "17. rechaza una reserva que contiene completamente otra",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    await request(app)
      .post(
        "/api/reservas-habitacion"
      )
      .set(
        "Authorization",
        `Bearer ${cliente.token}`
      )
      .send({
        habitacion_id:
          hotel.habitacion.id,
        fecha_entrada:
          "2027-07-12",
        fecha_salida:
          "2027-07-15",
        numero_huespedes: 2,
      });

    const response =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-07-10",
          fecha_salida:
            "2027-07-20",
          numero_huespedes: 2,
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "HABITACION_NO_DISPONIBLE"
    );
  }
);

it(
  "18. permite reservas consecutivas sin traslape",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const first =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-07-10",
          fecha_salida:
            "2027-07-15",
          numero_huespedes: 2,
        });

    expect(
      first.status
    ).toBe(201);

    const second =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-07-15",
          fecha_salida:
            "2027-07-20",
          numero_huespedes: 2,
        });

    expect(
      second.status
    ).toBe(201);
  }
);

it(
  "19. una reserva cancelada libera la habitación",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol:
          ROLES.ADMIN,
      });

    const first =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-08-10",
          fecha_salida:
            "2027-08-15",
          numero_huespedes: 2,
        });

    expect(
      first.status
    ).toBe(201);

    const reservationId =
      first.body.data.id;

    const cancel =
      await request(app)
        .delete(
          `/api/reservas-habitacion/${reservationId}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        );

    expect(
      cancel.status
    ).toBe(200);

    expect(
      cancel.body.data.estado
    ).toBe(
      "cancelada"
    );

    const second =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-08-10",
          fecha_salida:
            "2027-08-15",
          numero_huespedes: 2,
        });

    expect(
      second.status
    ).toBe(201);
  }
);

it(
  "20. una reserva finalizada no bloquea nuevas reservas",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol:
          ROLES.ADMIN,
      });

    const first =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-09-10",
          fecha_salida:
            "2027-09-15",
          numero_huespedes: 2,
        });

    expect(
      first.status
    ).toBe(201);

    const update =
      await request(app)
        .patch(
          `/api/reservas-habitacion/${first.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "finalizada",
        });

    expect(
      update.status
    ).toBe(200);

    const second =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-09-10",
          fecha_salida:
            "2027-09-15",
          numero_huespedes: 2,
        });

    expect(
      second.status
    ).toBe(201);
  }
);

it(
  "21. una reserva expirada no bloquea nuevas reservas",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol:
          ROLES.ADMIN,
      });

    const first =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-10-10",
          fecha_salida:
            "2027-10-15",
          numero_huespedes: 2,
        });

    expect(
      first.status
    ).toBe(201);

    const update =
      await request(app)
        .patch(
          `/api/reservas-habitacion/${first.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "expirada",
        });

    expect(
      update.status
    ).toBe(200);

    const second =
      await request(app)
        .post(
          "/api/reservas-habitacion"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-10-10",
          fecha_salida:
            "2027-10-15",
          numero_huespedes: 2,
        });

    expect(
      second.status
    ).toBe(201);
  }
);

it(
  "22. cliente al listar solo puede ver sus propias reservas",
  async () => {
    const hotelA =
      await createHotelFixture();

    const hotelB =
      await createHotelFixture();

    const clienteA =
      await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });

    const clienteB =
      await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });

    const reservaA =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${clienteA.token}`
        )
        .send({
          habitacion_id:
            hotelA.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const reservaB =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${clienteB.token}`
        )
        .send({
          habitacion_id:
            hotelB.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    expect(
      reservaA.status
    ).toBe(201);

    expect(
      reservaB.status
    ).toBe(201);

    const response =
      await request(app)
        .get("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${clienteA.token}`
        );

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data
    ).toHaveLength(1);

    expect(
      response.body.data[0].usuario_id
    ).toBe(
      clienteA.usuario.id
    );

    expect(
      response.body.data[0].id
    ).toBe(
      reservaA.body.data.id
    );
  }
);

it(
  "23. admin al listar puede ver reservas de todos los usuarios",
  async () => {
    const hotelA =
      await createHotelFixture();

    const hotelB =
      await createHotelFixture();

    const clienteA =
      await createAuthenticatedUser();

    const clienteB =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    await request(app)
      .post("/api/reservas-habitacion")
      .set(
        "Authorization",
        `Bearer ${clienteA.token}`
      )
      .send({
        habitacion_id:
          hotelA.habitacion.id,
        fecha_entrada:
          "2027-11-10",
        fecha_salida:
          "2027-11-12",
        numero_huespedes: 1,
      });

    await request(app)
      .post("/api/reservas-habitacion")
      .set(
        "Authorization",
        `Bearer ${clienteB.token}`
      )
      .send({
        habitacion_id:
          hotelB.habitacion.id,
        fecha_entrada:
          "2027-11-10",
        fecha_salida:
          "2027-11-12",
        numero_huespedes: 1,
      });

    const response =
      await request(app)
        .get("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        );

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data
    ).toHaveLength(2);
  }
);

it(
  "24. cliente puede consultar su propia reserva por ID",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-habitacion/${created.body.data.id}`
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
      created.body.data.id
    );
  }
);

it(
  "25. cliente no puede consultar la reserva de otro usuario",
  async () => {
    const hotel =
      await createHotelFixture();

    const propietario =
      await createAuthenticatedUser();

    const intruso =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${propietario.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-habitacion/${created.body.data.id}`
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
  "26. cliente no puede modificar una reserva",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-habitacion/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          numero_huespedes: 1,
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
  "27. admin puede modificar una reserva",
  async () => {
    const hotel =
      await createHotelFixture({
        capacidad: 4,
      });

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-habitacion/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          numero_huespedes: 3,
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data.numero_huespedes
    ).toBe(3);
  }
);

it(
  "28. cliente no puede cancelar una reserva mediante DELETE",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const response =
      await request(app)
        .delete(
          `/api/reservas-habitacion/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
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
  "29. DELETE administrativo es lógico y conserva la reserva como cancelada",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const id =
      created.body.data.id;

    const deleted =
      await request(app)
        .delete(
          `/api/reservas-habitacion/${id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        );

    expect(
      deleted.status
    ).toBe(200);

    expect(
      deleted.body.data.estado
    ).toBe(
      "cancelada"
    );

    /**
     * Debe seguir existiendo.
     */
    const get =
      await request(app)
        .get(
          `/api/reservas-habitacion/${id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        );

    expect(
      get.status
    ).toBe(200);

    expect(
      get.body.data.estado
    ).toBe(
      "cancelada"
    );
  }
);

it(
  "30. rechaza ID no numérico",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .get(
          "/api/reservas-habitacion/abc"
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        );

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
  "31. devuelve 404 para una reserva inexistente",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .get(
          "/api/reservas-habitacion/999999"
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        );

    expect(
      response.status
    ).toBe(404);

    expect(
      response.body.code
    ).toBe(
      "RESERVA_HABITACION_NOT_FOUND"
    );
  }
);

it(
  "32. rechaza campos adicionales en la creación",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const response =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,

          /**
           * Propiedad que el contrato
           * no reconoce.
           */
          descuento_secreto: 99,
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
  "33. rechaza un estado no permitido",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-habitacion/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "hackeada",
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
  "34. rechaza PATCH vacío",
  async () => {
    const hotel =
      await createHotelFixture();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-habitacion")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          habitacion_id:
            hotel.habitacion.id,
          fecha_entrada:
            "2027-11-10",
          fecha_salida:
            "2027-11-12",
          numero_huespedes: 2,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-habitacion/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({});

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
  "35. sin JWT no permite consultar reservas",
  async () => {
    const response =
      await request(app)
        .get(
          "/api/reservas-habitacion"
        );

    expect(
      response.status
    ).toBe(401);

    expect(
      response.body.code
    ).toBe(
      "AUTH_TOKEN_REQUIRED"
    );
  }
);

it(
  "36. concurrencia: solo una solicitud puede reservar la misma habitación y fechas",
  async () => {
    const hotel =
      await createHotelFixture({
        capacidad: 4,
      });

    const cliente =
      await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });

    const requests =
      Array.from(
        {
          length: 20,
        },
        () =>
          request(app)
            .post(
              "/api/reservas-habitacion"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              habitacion_id:
                hotel.habitacion.id,

              fecha_entrada:
                "2027-12-10",

              fecha_salida:
                "2027-12-15",

              numero_huespedes:
                2,
            })
      );

    /**
     * Las 20 peticiones salen sin esperar
     * la respuesta de la anterior.
     */
    const responses =
      await Promise.all(
        requests
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
      "[QA CONCURRENCIA HABITACION]",
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

              body:
                response.body,
            })
          ),
      }
    );

    /**
     * Regla de negocio:
     *
     * 20 solicitudes simultáneas
     * sobre la misma habitación y fechas
     * solo pueden producir UNA reserva.
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
     * No confiamos únicamente en HTTP.
     * Comprobamos también la realidad
     * persistida en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaHabitacion,
    } = db;

    const reservasPersistidas =
      await ReservaHabitacion.count({
        where: {
          habitacion_id:
            hotel.habitacion.id,

          estado: [
            "pendiente",
            "confirmada",
          ],
        },
      });

    expect(
      reservasPersistidas
    ).toBe(1);
  }
);
  }
);