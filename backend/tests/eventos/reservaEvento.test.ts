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
  createAuthenticatedUser,
} from "../helpers/auth";

import {
  createSalonEvento,
createReservaEventoFixture,
} from "../fixtures/eventos";

import {
  ROLES,
} from "../../src/constants/roles";

describe(
  "Reservas de evento",
  () => {
    it(
      "1. usuario autenticado crea una cotización válida",
      async () => {
        const salon =
          await createSalonEvento({
            capacidad_maxima: 100,
            tarifa_base: 5000,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "14:00",

              numero_invitados:
                80,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.usuario_id
        ).toBe(
          cliente.usuario.id
        );

        expect(
          response.body.data.salon_id
        ).toBe(
          salon.id
        );

        expect(
          response.body.data.estado
        ).toBe(
          "cotizacion"
        );
      }
    );

    it(
      "2. calcula total automáticamente desde la tarifa del salón",
      async () => {
        const salon =
          await createSalonEvento({
            tarifa_base: 7250.50,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "ejecutivo",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                20,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          Number(
            response.body.data.total
          )
        ).toBeCloseTo(
          7250.50,
          2
        );

        expect(
          Number(
            response.body.data.anticipo
          )
        ).toBeGreaterThan(0);
      }
    );

    it(
      "3. sin JWT no puede crear una cotización",
      async () => {
        const salon =
          await createSalonEvento();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(401);
      }
    );

    it(
      "4. no permite enviar usuario_id manualmente",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              usuario_id:
                999999,

              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,
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
      "5. rechaza un salón inexistente",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                999999,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "EVENT_ROOM_NOT_FOUND"
        );
      }
    );

    it(
      "6. rechaza salón perteneciente a sucursal inactiva",
      async () => {
        const salon =
          await createSalonEvento({
            sucursal_activa:
              false,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "BRANCH_INACTIVE"
        );
      }
    );

    it(
      "7. rechaza invitados que exceden la capacidad",
      async () => {
        const salon =
          await createSalonEvento({
            capacidad_maxima:
              50,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "cumpleanos",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                51,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "EVENT_CAPACITY_EXCEEDED"
        );
      }
    );

    it(
      "8. permite exactamente la capacidad máxima",
      async () => {
        const salon =
          await createSalonEvento({
            capacidad_maxima:
              50,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "cumpleanos",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(201);
      }
    );

    it(
      "9. rechaza una fecha en el pasado",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2026-01-01",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "EVENT_DATE_IN_PAST"
        );
      }
    );

    it(
      "10. rechaza una fecha calendario inexistente",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-02-30",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,
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
      "11. rechaza hora final igual a inicial",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "10:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "INVALID_EVENT_TIME_RANGE"
        );
      }
    );

    it(
      "12. rechaza hora final anterior a inicial",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "12:00",

              hora_fin:
                "10:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(422);
      }
    );

    it(
      "13. rechaza formato de hora inválido",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "25:00",

              hora_fin:
                "26:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "14. rechaza tipo de evento no permitido",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "concierto",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,
            });

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "15. rechaza campos adicionales",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,

              tipo_evento:
                "boda",

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "12:00",

              numero_invitados:
                50,

              total:
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
      "16. rechaza traslape exacto del mismo salón",
      async () => {
        const salon =
          await createSalonEvento();

        const clienteA =
          await createAuthenticatedUser();

        const clienteB =
          await createAuthenticatedUser();

        const payload = {
          salon_id:
            salon.id,
          tipo_evento:
            "boda",
          fecha:
            "2027-06-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            50,
        };

        const first =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${clienteA.token}`
            )
            .send(payload);

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${clienteB.token}`
            )
            .send(payload);

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "EVENT_ROOM_NOT_AVAILABLE"
        );
      }
    );

    it(
      "17. permite reservas consecutivas sin traslape",
      async () => {
        const salon =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const first =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,
              tipo_evento:
                "boda",
              fecha:
                "2027-06-10",
              hora_inicio:
                "10:00",
              hora_fin:
                "12:00",
              numero_invitados:
                50,
            });

        const second =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salon.id,
              tipo_evento:
                "convivio",
              fecha:
                "2027-06-10",
              hora_inicio:
                "12:00",
              hora_fin:
                "14:00",
              numero_invitados:
                50,
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
      "18. permite el mismo horario en salones diferentes",
      async () => {
        const salonA =
          await createSalonEvento();

        const salonB =
          await createSalonEvento();

        const cliente =
          await createAuthenticatedUser();

        const first =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salonA.id,
              tipo_evento:
                "boda",
              fecha:
                "2027-06-10",
              hora_inicio:
                "10:00",
              hora_fin:
                "12:00",
              numero_invitados:
                50,
            });

        const second =
          await request(app)
            .post(
              "/api/reservas-evento"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              salon_id:
                salonB.id,
              tipo_evento:
                "boda",
              fecha:
                "2027-06-10",
              hora_inicio:
                "10:00",
              hora_fin:
                "12:00",
              numero_invitados:
                50,
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
  "19. cliente al listar solo puede ver sus propias reservas",
  async () => {
    const salon =
      await createSalonEvento();

    const clienteA =
      await createAuthenticatedUser();

    const clienteB =
      await createAuthenticatedUser();

    await request(app)
      .post("/api/reservas-evento")
      .set(
        "Authorization",
        `Bearer ${clienteA.token}`
      )
      .send({
        salon_id:
          salon.id,

        tipo_evento:
          "boda",

        fecha:
          "2027-07-10",

        hora_inicio:
          "10:00",

        hora_fin:
          "12:00",

        numero_invitados:
          50,
      });

    /**
     * Usamos otro salón para evitar traslape.
     */
    const salonB =
      await createSalonEvento();

    await request(app)
      .post("/api/reservas-evento")
      .set(
        "Authorization",
        `Bearer ${clienteB.token}`
      )
      .send({
        salon_id:
          salonB.id,

        tipo_evento:
          "convivio",

        fecha:
          "2027-07-10",

        hora_inicio:
          "10:00",

        hora_fin:
          "12:00",

        numero_invitados:
          30,
      });

    const response =
      await request(app)
        .get(
          "/api/reservas-evento"
        )
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
      response.body.data[0]
        .usuario_id
    ).toBe(
      clienteA.usuario.id
    );
  }
);

it(
  "20. admin puede listar reservas de todos los usuarios",
  async () => {
    const salonA =
      await createSalonEvento();

    const salonB =
      await createSalonEvento();

    const clienteA =
      await createAuthenticatedUser();

    const clienteB =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol:
          ROLES.ADMIN,
      });

    await request(app)
      .post("/api/reservas-evento")
      .set(
        "Authorization",
        `Bearer ${clienteA.token}`
      )
      .send({
        salon_id:
          salonA.id,
        tipo_evento:
          "boda",
        fecha:
          "2027-07-10",
        hora_inicio:
          "10:00",
        hora_fin:
          "12:00",
        numero_invitados:
          50,
      });

    await request(app)
      .post("/api/reservas-evento")
      .set(
        "Authorization",
        `Bearer ${clienteB.token}`
      )
      .send({
        salon_id:
          salonB.id,
        tipo_evento:
          "ejecutivo",
        fecha:
          "2027-07-10",
        hora_inicio:
          "10:00",
        hora_fin:
          "12:00",
        numero_invitados:
          30,
      });

    const response =
      await request(app)
        .get(
          "/api/reservas-evento"
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
    ).toHaveLength(2);
  }
);

it(
  "21. cliente puede consultar su propia reserva por ID",
  async () => {
    const salon =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-evento")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          salon_id:
            salon.id,
          tipo_evento:
            "boda",
          fecha:
            "2027-07-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            50,
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-evento/${created.body.data.id}`
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
  "22. cliente no puede consultar reserva de otro usuario",
  async () => {
    const salon =
      await createSalonEvento();

    const owner =
      await createAuthenticatedUser();

    const intruso =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-evento")
        .set(
          "Authorization",
          `Bearer ${owner.token}`
        )
        .send({
          salon_id:
            salon.id,
          tipo_evento:
            "boda",
          fecha:
            "2027-07-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            50,
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-evento/${created.body.data.id}`
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
  "23. GET devuelve 404 para reserva inexistente",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const response =
      await request(app)
        .get(
          "/api/reservas-evento/999999"
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
      "EVENT_RESERVATION_NOT_FOUND"
    );
  }
);

it(
  "24. cliente puede modificar su cotización",
  async () => {
    const salon =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-evento")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          salon_id:
            salon.id,
          tipo_evento:
            "boda",
          fecha:
            "2027-07-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            50,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          numero_invitados:
            75,
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data
        .numero_invitados
    ).toBe(75);
  }
);

it(
  "25. cliente no puede modificar cotización de otro usuario",
  async () => {
    const salon =
      await createSalonEvento();

    const owner =
      await createAuthenticatedUser();

    const intruso =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-evento")
        .set(
          "Authorization",
          `Bearer ${owner.token}`
        )
        .send({
          salon_id:
            salon.id,
          tipo_evento:
            "boda",
          fecha:
            "2027-07-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            50,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${intruso.token}`
        )
        .send({
          numero_invitados:
            60,
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
  "26. admin puede modificar cotización de otro usuario",
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

    const created =
      await request(app)
        .post("/api/reservas-evento")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          salon_id:
            salon.id,
          tipo_evento:
            "ejecutivo",
          fecha:
            "2027-07-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            30,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          numero_invitados:
            40,
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data
        .numero_invitados
    ).toBe(40);
  }
);

it(
  "27. PATCH vacío debe ser rechazado",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const response =
      await request(app)
        .patch(
          "/api/reservas-evento/1"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
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
  "28. PATCH rechaza campos adicionales",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const response =
      await request(app)
        .patch(
          "/api/reservas-evento/1"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          total:
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
  "29. no permite editar una reserva confirmada",
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

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          numero_invitados:
            60,
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
  "30. PATCH vuelve a validar capacidad",
  async () => {
    const salon =
      await createSalonEvento({
        capacidad_maxima:
          50,
      });

    const cliente =
      await createAuthenticatedUser();

    const reserva =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        numero_invitados:
          30,

        estado:
          "cotizacion",
      });

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          numero_invitados:
            51,
        });

    expect(
      response.status
    ).toBe(422);

    expect(
      response.body.code
    ).toBe(
      "EVENT_CAPACITY_EXCEEDED"
    );
  }
);

it(
  "31. PATCH no permite provocar traslape con otra reserva",
  async () => {
    const salon =
      await createSalonEvento();

    const cliente =
      await createAuthenticatedUser();

    await createReservaEventoFixture({
      usuario_id:
        cliente.usuario.id,

      salon_id:
        salon.id,

      fecha:
        "2027-08-10",

      hora_inicio:
        "10:00:00",

      hora_fin:
        "12:00:00",

      estado:
        "cotizacion",
    });

    const movable =
      await createReservaEventoFixture({
        usuario_id:
          cliente.usuario.id,

        salon_id:
          salon.id,

        fecha:
          "2027-08-10",

        hora_inicio:
          "14:00:00",

        hora_fin:
          "16:00:00",

        estado:
          "cotizacion",
    });

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${movable.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          hora_inicio:
            "11:00",

          hora_fin:
            "13:00",
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "EVENT_ROOM_NOT_AVAILABLE"
    );
  }
);

it(
  "32. cambiar de salón recalcula total y anticipo",
  async () => {
    const salonA =
      await createSalonEvento({
        tarifa_base:
          5000,
      });

    const salonB =
      await createSalonEvento({
        tarifa_base:
          8000,
      });

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-evento")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          salon_id:
            salonA.id,
          tipo_evento:
            "boda",
          fecha:
            "2027-09-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            50,
        });

    const anticipoOriginal =
      Number(
        created.body.data
          .anticipo
      );

    const response =
      await request(app)
        .patch(
          `/api/reservas-evento/${created.body.data.id}`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          salon_id:
            salonB.id,
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      Number(
        response.body.data.total
      )
    ).toBeCloseTo(
      8000,
      2
    );

    expect(
      Number(
        response.body.data
          .anticipo
      )
    ).toBeGreaterThan(
      anticipoOriginal
    );
  }
);

it(
  "33. cliente puede cancelar su propia reserva",
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
        .patch(
          `/api/reservas-evento/${reserva.id}/cancelar`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        );

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data.estado
    ).toBe(
      "cancelada"
    );
  }
);

it(
  "34. cliente no puede cancelar reserva de otro usuario",
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
        .patch(
          `/api/reservas-evento/${reserva.id}/cancelar`
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
  "35. rechaza cancelar dos veces la misma reserva",
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

    const first =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}/cancelar`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        );

    expect(
      first.status
    ).toBe(200);

    const second =
      await request(app)
        .patch(
          `/api/reservas-evento/${reserva.id}/cancelar`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        );

    expect(
      second.status
    ).toBe(409);

    expect(
      second.body.code
    ).toBe(
      "EVENT_RESERVATION_ALREADY_CANCELLED"
    );
  }
);

it(
  "36. una reserva cancelada libera el salón",
  async () => {
    const salon =
      await createSalonEvento();

    const clienteA =
      await createAuthenticatedUser();

    const clienteB =
      await createAuthenticatedUser();

    const first =
      await request(app)
        .post("/api/reservas-evento")
        .set(
          "Authorization",
          `Bearer ${clienteA.token}`
        )
        .send({
          salon_id:
            salon.id,
          tipo_evento:
            "boda",
          fecha:
            "2027-10-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            50,
        });

    expect(
      first.status
    ).toBe(201);

    await request(app)
      .patch(
        `/api/reservas-evento/${first.body.data.id}/cancelar`
      )
      .set(
        "Authorization",
        `Bearer ${clienteA.token}`
      );

    const second =
      await request(app)
        .post("/api/reservas-evento")
        .set(
          "Authorization",
          `Bearer ${clienteB.token}`
        )
        .send({
          salon_id:
            salon.id,
          tipo_evento:
            "convivio",
          fecha:
            "2027-10-10",
          hora_inicio:
            "10:00",
          hora_fin:
            "12:00",
          numero_invitados:
            40,
        });

    expect(
      second.status
    ).toBe(201);
  }
);

it(
  "37. concurrencia creación: solo una solicitud puede reservar el mismo salón y horario",
  async () => {
    const salon =
      await createSalonEvento({
        capacidad_maxima:
          100,
      });

    const cliente =
      await createAuthenticatedUser();

    /**
     * Las 20 solicitudes compiten por:
     *
     * - mismo salón
     * - misma fecha
     * - mismo horario
     *
     * Como "cotizacion" es un estado
     * bloqueante, solo una debe persistirse.
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
                "/api/reservas-evento"
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                salon_id:
                  salon.id,

                tipo_evento:
                  "boda",

                fecha:
                  "2027-12-10",

                hora_inicio:
                  "10:00",

                hora_fin:
                  "12:00",

                numero_invitados:
                  50,
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
      "[QA CONCURRENCIA CREACION EVENTO]",
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
     * Todos los conflictos deberían
     * corresponder a indisponibilidad
     * del salón.
     */
    for (
      const conflict of
      conflicts
    ) {
      expect(
        conflict.body.code
      ).toBe(
        "EVENT_ROOM_NOT_AVAILABLE"
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
      ReservaEvento,
    } = db;

    const persistidas =
      await ReservaEvento.count({
        where: {
          salon_id:
            salon.id,

          fecha:
            "2027-12-10",

          estado:
            "cotizacion",
        },
      });

    expect(
      persistidas
    ).toBe(1);
  }
);

it(
  "38. concurrencia PATCH: solo una reserva puede moverse al mismo salón y horario",
  async () => {
    const salonDestino =
      await createSalonEvento({
        capacidad_maxima:
          100,
      });

    const cliente =
      await createAuthenticatedUser();

    /**
     * Cada reserva comienza en un salón
     * diferente para que todas sean
     * perfectamente válidas antes del PATCH.
     */
    const reservas: number[] = [];

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const salonOrigen =
        await createSalonEvento({
          capacidad_maxima:
            100,
        });

      const reserva =
        await createReservaEventoFixture({
          usuario_id:
            cliente.usuario.id,

          salon_id:
            salonOrigen.id,

          tipo_evento:
            "boda",

          fecha:
            "2027-12-15",

          hora_inicio:
            "10:00:00",

          hora_fin:
            "12:00:00",

          numero_invitados:
            50,

          estado:
            "cotizacion",
        });

      reservas.push(
        reserva.id
      );
    }

    /**
     * Las 20 reservas intentan moverse
     * simultáneamente al mismo salón.
     */
    const responses =
      await Promise.all(
        reservas.map(
          (id) =>
            request(app)
              .patch(
                `/api/reservas-evento/${id}`
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                salon_id:
                  salonDestino.id,
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
      "[QA CONCURRENCIA PATCH EVENTO]",
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

              code:
                response.body.code,

              body:
                response.body,
            })
          ),
      }
    );

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
     * Todos los rechazos deberían deberse
     * al traslape generado por la primera
     * reserva que ganó.
     */
    for (
      const conflict of
      conflicts
    ) {
      expect(
        conflict.body.code
      ).toBe(
        "EVENT_ROOM_NOT_AVAILABLE"
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
      ReservaEvento,
    } = db;

    const movidas =
      await ReservaEvento.count({
        where: {
          salon_id:
            salonDestino.id,

          fecha:
            "2027-12-15",

          estado:
            "cotizacion",
        },
      });

    expect(
      movidas
    ).toBe(1);
  }
);

it(
  "39. concurrencia cancelación: solo una solicitud puede cancelar la misma reserva",
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

        tipo_evento:
          "boda",

        fecha:
          "2027-12-20",

        hora_inicio:
          "10:00:00",

        hora_fin:
          "12:00:00",

        numero_invitados:
          50,

        estado:
          "cotizacion",
      });

    /**
     * Las 20 solicitudes intentan cancelar
     * exactamente la misma reserva al mismo tiempo.
     */
    const responses =
      await Promise.all(
        Array.from(
          {
            length: 20,
          },
          () =>
            request(app)
              .patch(
                `/api/reservas-evento/${reserva.id}/cancelar`
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
      )
    );

    const cancelled =
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
      "[QA CONCURRENCIA CANCELACION EVENTO]",
      {
        total:
          responses.length,

        canceladas:
          cancelled.length,

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

    /**
     * Una sola petición debe realizar
     * realmente la transición:
     *
     * cotizacion -> cancelada
     *
     * Las demás deben encontrarla
     * ya cancelada.
     */
    expect(
      cancelled
    ).toHaveLength(1);

    expect(
      conflicts
    ).toHaveLength(19);

    expect(
      unexpected
    ).toHaveLength(0);

    for (
      const conflict of
      conflicts
    ) {
      expect(
        conflict.body.code
      ).toBe(
        "EVENT_RESERVATION_ALREADY_CANCELLED"
      );
    }

    /**
     * Comprobación directa en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEvento,
    } = db;

    const persistida =
      await ReservaEvento.findByPk(
        reserva.id
      );

    expect(
      persistida
    ).not.toBeNull();

    expect(
      persistida.estado
    ).toBe(
      "cancelada"
    );
  }
);

it(
  "40. concurrencia edición vs cancelación: mantiene un resultado serializable",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const reservas: Array<{
      id: number;
      invitadosOriginales: number;
    }> = [];

    /**
     * Creamos 20 reservas independientes.
     * Cada una usa su propio salón para evitar
     * que el conflicto sea por disponibilidad.
     */
    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const salon =
        await createSalonEvento({
          capacidad_maxima:
            100,
        });

      const reserva =
        await createReservaEventoFixture({
          usuario_id:
            cliente.usuario.id,

          salon_id:
            salon.id,

          tipo_evento:
            "ejecutivo",

          fecha:
            "2027-12-25",

          hora_inicio:
            "10:00:00",

          hora_fin:
            "12:00:00",

          numero_invitados:
            40,

          estado:
            "cotizacion",
        });

      reservas.push({
        id:
          reserva.id,

        invitadosOriginales:
          40,
      });
    }

    /**
     * Por cada reserva lanzamos al mismo tiempo:
     *
     * - una edición 40 -> 60 invitados
     * - una cancelación
     *
     * En total son 40 requests concurrentes.
     */
    const resultados =
      await Promise.all(
        reservas.map(
          async (
            reserva
          ) => {
            const [
              editResponse,
              cancelResponse,
            ] =
              await Promise.all([
                request(app)
                  .patch(
                    `/api/reservas-evento/${reserva.id}`
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  )
                  .send({
                    numero_invitados:
                      60,
                  }),

                request(app)
                  .patch(
                    `/api/reservas-evento/${reserva.id}/cancelar`
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  ),
              ]);

            return {
              id:
                reserva.id,

              editResponse,
              cancelResponse,
            };
          }
        )
      );

    const editsOk =
      resultados.filter(
        ({
          editResponse,
        }) =>
          editResponse.status ===
          200
      );

    const editsConflict =
      resultados.filter(
        ({
          editResponse,
        }) =>
          editResponse.status ===
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
          editResponse,
          cancelResponse,
        }) =>
          ![
            200,
            409,
          ].includes(
            editResponse.status
          ) ||
          cancelResponse.status !==
            200
      );

    console.log(
      "[QA CONCURRENCIA EDICION VS CANCELACION EVENTO]",
      {
        totalReservas:
          resultados.length,

        edicionesExitosas:
          editsOk.length,

        edicionesBloqueadas:
          editsConflict.length,

        cancelacionesExitosas:
          cancelsOk.length,

        inesperadas:
          unexpected.map(
            ({
              id,
              editResponse,
              cancelResponse,
            }) => ({
              id,

              editStatus:
                editResponse.status,

              editCode:
                editResponse.body.code,

              cancelStatus:
                cancelResponse.status,

              cancelCode:
                cancelResponse.body.code,
            })
          ),
      }
    );

    /**
     * Todas las cancelaciones deben poder
     * finalizar correctamente.
     */
    expect(
      cancelsOk
    ).toHaveLength(20);

    /**
     * Cada edición solamente puede:
     *
     * 200 -> ganó antes de la cancelación
     * 409 -> la cancelación ganó primero
     */
    expect(
      editsOk.length +
        editsConflict.length
    ).toBe(20);

    expect(
      unexpected
    ).toHaveLength(0);

    for (
      const {
        editResponse,
      } of resultados
    ) {
      if (
        editResponse.status ===
        409
      ) {
        expect(
          editResponse.body.code
        ).toBe(
          "EVENT_RESERVATION_NOT_EDITABLE"
        );
      }
    }

    /**
     * Ahora verificamos el estado REAL
     * persistido en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaEvento,
    } = db;

    for (
      const resultado of
      resultados
    ) {
      const persistida =
        await ReservaEvento.findByPk(
          resultado.id
        );

      expect(
        persistida
      ).not.toBeNull();

      /**
       * Sin importar quién ganó primero,
       * todas deben terminar canceladas.
       */
      expect(
        persistida.estado
      ).toBe(
        "cancelada"
      );

      if (
        resultado.editResponse
          .status ===
        200
      ) {
        /**
         * EDIT ocurrió primero:
         * el dato editado debe conservarse.
         */
        expect(
          persistida
            .numero_invitados
        ).toBe(60);
      } else {
        /**
         * CANCEL ocurrió primero:
         * el UPDATE fue rechazado y el dato
         * original debe permanecer intacto.
         */
        expect(
          persistida
            .numero_invitados
        ).toBe(40);
      }
    }
  }
);
  }
);