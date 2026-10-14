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
  createParqueo,
} from "../fixtures/hotel";

describe(
  "Reservas de parqueo",
  () => {
    it(
      "1. admin crea una reserva válida de parqueo",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",

              fecha_salida:
                "2027-01-10T12:00:00.000Z",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .parqueo_id
        ).toBe(
          parqueo.id
        );
      }
    );

    it(
      "2. recepcionista puede crear reserva de parqueo",
      async () => {
        const parqueo =
          await createParqueo();

        const recepcionista =
          await createAuthenticatedUser({
            rol:
              ROLES.RECEPCIONISTA,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${recepcionista.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",

              fecha_salida:
                "2027-01-10T12:00:00.000Z",
            });

        expect(
          response.status
        ).toBe(201);
      }
    );

    it(
      "3. gerente de habitaciones puede crear reserva de parqueo",
      async () => {
        const parqueo =
          await createParqueo();

        const gerente =
          await createAuthenticatedUser({
            rol:
              ROLES.GERENTE_HABITACIONES,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${gerente.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",

              fecha_salida:
                "2027-01-10T12:00:00.000Z",
            });

        expect(
          response.status
        ).toBe(201);
      }
    );

    it(
      "4. cliente no puede crear reserva de parqueo",
      async () => {
        const parqueo =
          await createParqueo();

        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",

              fecha_salida:
                "2027-01-10T12:00:00.000Z",
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
      "5. sin JWT no puede crear reserva de parqueo",
      async () => {
        const parqueo =
          await createParqueo();

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",
            });

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
      "6. rechaza parqueo inexistente",
      async () => {
        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                999999,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",

              fecha_salida:
                "2027-01-10T12:00:00.000Z",
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "PARQUEO_NOT_FOUND"
        );
      }
    );

    it(
      "7. rechaza reserva de habitación inexistente",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              reserva_habitacion_id:
                999999,

              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",

              fecha_salida:
                "2027-01-10T12:00:00.000Z",
            });

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
      "8. rechaza fecha de salida igual a entrada",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",

              fecha_salida:
                "2027-01-10T10:00:00.000Z",
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
      "9. permite reserva abierta sin fecha_salida",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .fecha_salida
        ).toBeNull();
      }
    );

    it(
      "10. rechaza campos adicionales",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-01-10T10:00:00.000Z",

              placa_secreta:
                "ABC123",
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
      "11. rechaza traslape exacto",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const payload = {
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-02-10T10:00:00.000Z",

          fecha_salida:
            "2027-02-10T12:00:00.000Z",
        };

        const first =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send(payload);

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send(payload);

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "PARQUEO_NO_DISPONIBLE"
        );
      }
    );

    it(
      "12. rechaza traslape parcial",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const first =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-02-10T10:00:00.000Z",

              fecha_salida:
                "2027-02-10T12:00:00.000Z",
            });

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-02-10T11:00:00.000Z",

              fecha_salida:
                "2027-02-10T13:00:00.000Z",
            });

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "PARQUEO_NO_DISPONIBLE"
        );
      }
    );

    it(
      "13. permite reservas consecutivas",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const first =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-02-10T10:00:00.000Z",

              fecha_salida:
                "2027-02-10T12:00:00.000Z",
            });

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-02-10T12:00:00.000Z",

              fecha_salida:
                "2027-02-10T14:00:00.000Z",
            });

        expect(
          second.status
        ).toBe(201);
      }
    );

    it(
      "14. una reserva sin fecha_salida bloquea reservas posteriores",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const first =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-02-10T10:00:00.000Z",
            });

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-02-10T12:00:00.000Z",

              fecha_salida:
                "2027-02-10T14:00:00.000Z",
            });

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "PARQUEO_NO_DISPONIBLE"
        );
      }
    );

    it(
      "15. permite mismo horario en parqueos diferentes",
      async () => {
        const parqueoA =
          await createParqueo();

        const parqueoB =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const first =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueoA.id,

              fecha_entrada:
                "2027-02-10T10:00:00.000Z",

              fecha_salida:
                "2027-02-10T12:00:00.000Z",
            });

        const second =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueoB.id,

              fecha_entrada:
                "2027-02-10T10:00:00.000Z",

              fecha_salida:
                "2027-02-10T12:00:00.000Z",
            });

        expect(
          first.status
        ).toBe(201);

        expect(
          second.status
        ).toBe(201);
      }
    );

    it(
      "16. DELETE elimina físicamente la reserva de parqueo",
      async () => {
        const parqueo =
          await createParqueo();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const created =
          await request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-02-10T10:00:00.000Z",

              fecha_salida:
                "2027-02-10T12:00:00.000Z",
            });

        expect(
          created.status
        ).toBe(201);

        const id =
          created.body.data.id;

        const deleted =
          await request(app)
            .delete(
              `/api/reservas-parqueo/${id}`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            );

        expect(
          deleted.status
        ).toBe(200);

        const get =
          await request(app)
            .get(
              `/api/reservas-parqueo/${id}`
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            );

        expect(
          get.status
        ).toBe(404);

        expect(
          get.body.code
        ).toBe(
          "RESERVA_PARQUEO_NOT_FOUND"
        );
      }
    );

    it(
  "17. admin puede listar reservas de parqueo",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",

          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    expect(
      created.status
    ).toBe(201);

    const response =
      await request(app)
        .get("/api/reservas-parqueo")
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

    expect(
      response.body.data[0].id
    ).toBe(
      created.body.data.id
    );
  }
);

it(
  "18. cliente no puede listar todas las reservas de parqueo",
  async () => {
    const cliente =
      await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });

    const response =
      await request(app)
        .get("/api/reservas-parqueo")
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
  "19. admin puede consultar una reserva de parqueo por ID",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",

          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-parqueo/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
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
  "20. cliente no puede consultar una reserva global de parqueo por ID",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const cliente =
      await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });

    const created =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",

          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-parqueo/${created.body.data.id}`
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
  "21. admin puede actualizar una reserva de parqueo",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",

          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-parqueo/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          fecha_salida:
            "2027-03-10T13:00:00.000Z",
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      new Date(
        response.body.data.fecha_salida
      ).toISOString()
    ).toBe(
      "2027-03-10T13:00:00.000Z"
    );
  }
);

it(
  "22. cliente no puede actualizar una reserva de parqueo",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const cliente =
      await createAuthenticatedUser({
        rol: ROLES.CLIENTE,
      });

    const created =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",

          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-parqueo/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          fecha_salida:
            "2027-03-10T13:00:00.000Z",
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
  "23. PATCH rechaza un ID no numérico",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-parqueo/abc"
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          fecha_salida:
            "2027-03-10T13:00:00.000Z",
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
  "24. PATCH devuelve 404 para una reserva inexistente",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-parqueo/999999"
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          fecha_salida:
            "2027-03-10T13:00:00.000Z",
        });

    expect(
      response.status
    ).toBe(404);

    expect(
      response.body.code
    ).toBe(
      "RESERVA_PARQUEO_NOT_FOUND"
    );
  }
);

it(
  "25. PATCH vacío debe ser rechazado",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",

          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-parqueo/${created.body.data.id}`
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
  "26. PATCH no permite provocar un traslape con otra reserva",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const first =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",

          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    const second =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T13:00:00.000Z",

          fecha_salida:
            "2027-03-10T15:00:00.000Z",
        });

    expect(
      first.status
    ).toBe(201);

    expect(
      second.status
    ).toBe(201);

    const response =
      await request(app)
        .patch(
          `/api/reservas-parqueo/${second.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          fecha_entrada:
            "2027-03-10T11:00:00.000Z",

          fecha_salida:
            "2027-03-10T14:00:00.000Z",
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "PARQUEO_NO_DISPONIBLE"
    );
  }
);

it(
  "27. PATCH permite cerrar una reserva abierta",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",
        });

    expect(
      created.status
    ).toBe(201);

    const response =
      await request(app)
        .patch(
          `/api/reservas-parqueo/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      new Date(
        response.body.data.fecha_salida
      ).toISOString()
    ).toBe(
      "2027-03-10T12:00:00.000Z"
    );
  }
);

it(
  "28. PATCH permite convertir fecha_salida a null",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-03-10T10:00:00.000Z",

          fecha_salida:
            "2027-03-10T12:00:00.000Z",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-parqueo/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          fecha_salida: null,
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data.fecha_salida
    ).toBeNull();
  }
);

it(
  "29. DELETE rechaza un ID inválido",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .delete(
          "/api/reservas-parqueo/abc"
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
  "30. rechaza una fecha calendario imposible con hora",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .post("/api/reservas-parqueo")
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          parqueo_id:
            parqueo.id,

          fecha_entrada:
            "2027-02-30T10:00:00.000Z",

          fecha_salida:
            "2027-03-02T12:00:00.000Z",
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
  "31. concurrencia: solo una solicitud puede reservar el mismo parqueo y horario",
  async () => {
    const parqueo =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol:
          ROLES.ADMIN,
      });

    const requests =
      Array.from(
        {
          length: 20,
        },
        () =>
          request(app)
            .post(
              "/api/reservas-parqueo"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              parqueo_id:
                parqueo.id,

              fecha_entrada:
                "2027-12-10T10:00:00.000Z",

              fecha_salida:
                "2027-12-10T12:00:00.000Z",
            })
      );

    /**
     * Las 20 solicitudes salen
     * prácticamente al mismo tiempo.
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
      "[QA CONCURRENCIA PARQUEO]",
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
     * un parqueo no puede quedar
     * reservado más de una vez
     * para el mismo rango horario.
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
     * Comprobación adicional directa
     * sobre PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaParqueo,
    } = db;

    const reservasPersistidas =
      await ReservaParqueo.count({
        where: {
          parqueo_id:
            parqueo.id,
        },
      });

    expect(
      reservasPersistidas
    ).toBe(1);
  }
);

it(
  "32. concurrencia PATCH: solo una reserva puede moverse al mismo parqueo y horario",
  async () => {
    const parqueoDestino =
      await createParqueo();

    const admin =
      await createAuthenticatedUser({
        rol:
          ROLES.ADMIN,
      });

    /**
     * Creamos 20 reservas válidas,
     * cada una en un parqueo distinto.
     */
    const reservas: number[] = [];

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const parqueoOrigen =
        await createParqueo();

      const created =
        await request(app)
          .post(
            "/api/reservas-parqueo"
          )
          .set(
            "Authorization",
            `Bearer ${admin.token}`
          )
          .send({
            parqueo_id:
              parqueoOrigen.id,

            fecha_entrada:
              "2027-12-20T10:00:00.000Z",

            fecha_salida:
              "2027-12-20T12:00:00.000Z",
          });

      expect(
        created.status
      ).toBe(201);

      reservas.push(
        created.body.data.id
      );
    }

    /**
     * Intentamos mover las 20 reservas
     * simultáneamente al mismo parqueo.
     */
    const responses =
      await Promise.all(
        reservas.map(
          (id) =>
            request(app)
              .patch(
                `/api/reservas-parqueo/${id}`
              )
              .set(
                "Authorization",
                `Bearer ${admin.token}`
              )
              .send({
                parqueo_id:
                  parqueoDestino.id,
              })
        )
      );

    const updated =
      responses.filter(
        (response) =>
          response.status ===
          200
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
            200,
            409,
          ].includes(
            response.status
          )
      );

    console.log(
      "[QA CONCURRENCIA PATCH PARQUEO]",
      {
        total:
          responses.length,

        actualizadas:
          updated.length,

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
     * Regla:
     * solamente una reserva puede terminar
     * ocupando ese parqueo y horario.
     */
    expect(
      updated
    ).toHaveLength(1);

    expect(
      conflicts
    ).toHaveLength(19);

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
      ReservaParqueo,
    } = db;

    const persistidas =
      await ReservaParqueo.count({
        where: {
          parqueo_id:
            parqueoDestino.id,
        },
      });

    expect(
      persistidas
    ).toBe(1);
  }
);
  }
);