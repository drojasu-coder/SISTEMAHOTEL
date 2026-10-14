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
  createMesa,
    createReservaMesaFixture,
} from "../fixtures/restaurante";

describe(
  "Reservas de mesa",
  () => {
    it(
      "1. cliente crea una reserva válida para sí mismo",
      async () => {
        const mesa =
          await createMesa({
            capacidad: 4,
          });

        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.status
        ).toBe(
          "success"
        );

        expect(
          response.body.data
            .usuario_id
        ).toBe(
          cliente.usuario.id
        );

        expect(
          response.body.data
            .mesa_id
        ).toBe(
          mesa.id
        );

        expect(
          response.body.data
            .estado
        ).toBe(
          "confirmada"
        );
      }
    );

    it(
      "2. admin no puede crear reservas de mesa",
      async () => {
        const mesa =
          await createMesa();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
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
      "3. sin JWT no puede crear una reserva",
      async () => {
        const mesa =
          await createMesa();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
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
      "4. cliente no puede enviar usuario_id manualmente",
      async () => {
        const mesa =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              usuario_id:
                999999,

              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        /**
         * createReservaMesaSchema es strict()
         * y usuario_id no pertenece al contrato.
         */
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
      "5. rechaza una mesa inexistente",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                999999,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "TABLE_NOT_FOUND"
        );
      }
    );

    it(
      "6. rechaza una mesa en mantenimiento",
      async () => {
        const mesa =
          await createMesa({
            estado:
              "mantenimiento",
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "TABLE_IN_MAINTENANCE"
        );
      }
    );

    it(
      "7. rechaza comensales que exceden la capacidad",
      async () => {
        const mesa =
          await createMesa({
            capacidad: 2,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                3,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "TABLE_CAPACITY_EXCEEDED"
        );
      }
    );

    it(
      "8. permite exactamente la capacidad máxima",
      async () => {
        const mesa =
          await createMesa({
            capacidad: 2,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        expect(
          response.status
        ).toBe(201);
      }
    );

    it(
      "9. rechaza una fecha en el pasado",
      async () => {
        const mesa =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2026-01-01",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "TABLE_RESERVATION_DATE_IN_PAST"
        );
      }
    );

    it(
      "10. rechaza una fecha calendario imposible",
      async () => {
        const mesa =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-02-30",

              hora:
                "10:00",

              numero_comensales:
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
      "11. rechaza una hora inválida",
      async () => {
        const mesa =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "25:00",

              numero_comensales:
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
      "12. rechaza campos adicionales",
      async () => {
        const mesa =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,

              descuento_secreto:
                99,
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
      "13. rechaza una reserva duplicada para la misma mesa fecha y hora",
      async () => {
        const mesa =
          await createMesa();

        const clienteA =
          await createAuthenticatedUser();

        const clienteB =
          await createAuthenticatedUser();

        const payload = {
          mesa_id:
            mesa.id,

          fecha:
            "2027-06-10",

          hora:
            "10:00",

          numero_comensales:
            2,
        };

        const first =
          await request(app)
            .post(
              "/api/reservas-mesa"
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
              "/api/reservas-mesa"
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
          "TABLE_UNAVAILABLE"
        );
      }
    );

    it(
      "14. permite el mismo horario en mesas diferentes",
      async () => {
        const mesaA =
          await createMesa();

        const mesaB =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const first =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesaA.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        const second =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesaB.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
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
      "15. permite horas diferentes en la misma mesa",
      async () => {
        const mesa =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const first =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        const second =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "11:00",

              numero_comensales:
                2,
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
      "16. admin puede listar todas las reservas",
      async () => {
        const mesaA =
          await createMesa();

        const mesaB =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        await request(app)
          .post(
            "/api/reservas-mesa"
          )
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            mesa_id:
              mesaA.id,

            fecha:
              "2027-06-10",

            hora:
              "10:00",

            numero_comensales:
              2,
          });

        await request(app)
          .post(
            "/api/reservas-mesa"
          )
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            mesa_id:
              mesaB.id,

            fecha:
              "2027-06-10",

            hora:
              "11:00",

            numero_comensales:
              2,
          });

        const response =
          await request(app)
            .get(
              "/api/reservas-mesa"
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
      "17. cliente no puede listar todas las reservas",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .get(
              "/api/reservas-mesa"
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
      "18. admin puede consultar una reserva por ID",
      async () => {
        const mesa =
          await createMesa();

        const cliente =
          await createAuthenticatedUser();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const created =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        const response =
          await request(app)
            .get(
              `/api/reservas-mesa/${created.body.data.id}`
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
      "19. cliente no puede consultar una reserva global por ID",
      async () => {
        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const cliente =
          await createAuthenticatedUser();

        const mesa =
          await createMesa();

        const owner =
          await createAuthenticatedUser();

        const created =
          await request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${owner.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-06-10",

              hora:
                "10:00",

              numero_comensales:
                2,
            });

        /**
         * Evitamos una variable no usada en caso
         * de configuraciones TS estrictas.
         */
        expect(
          admin.usuario.id
        ).toBeGreaterThan(0);

        const response =
          await request(app)
            .get(
              `/api/reservas-mesa/${created.body.data.id}`
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
      "20. GET rechaza un ID no numérico",
      async () => {
        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .get(
              "/api/reservas-mesa/abc"
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
  "21. admin puede cancelar una reserva confirmada",
  async () => {
    const mesa =
      await createMesa();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-mesa")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          mesa_id:
            mesa.id,
          fecha:
            "2027-07-10",
          hora:
            "10:00",
          numero_comensales:
            2,
        });

    expect(
      created.status
    ).toBe(201);

    const response =
      await request(app)
        .patch(
          `/api/reservas-mesa/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "cancelada",
        });

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
  "22. rechaza cambiar una reserva al estado que ya posee",
  async () => {
    const mesa =
      await createMesa();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-mesa")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          mesa_id:
            mesa.id,
          fecha:
            "2027-07-10",
          hora:
            "10:00",
          numero_comensales:
            2,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-mesa/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "confirmada",
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "TABLE_RESERVATION_STATUS_UNCHANGED"
    );
  }
);

it(
  "23. cliente no puede cambiar el estado de una reserva",
  async () => {
    const mesa =
      await createMesa();

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-mesa")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          mesa_id:
            mesa.id,
          fecha:
            "2027-07-10",
          hora:
            "10:00",
          numero_comensales:
            2,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-mesa/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          estado:
            "cancelada",
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
  "24. PATCH estado devuelve 404 para una reserva inexistente",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-mesa/999999/estado"
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "cancelada",
        });

    expect(
      response.status
    ).toBe(404);

    expect(
      response.body.code
    ).toBe(
      "TABLE_RESERVATION_NOT_FOUND"
    );
  }
);

it(
  "25. PATCH estado rechaza ID no numérico",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-mesa/abc/estado"
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "cancelada",
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
  "26. PATCH estado rechaza un estado inválido",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-mesa/1/estado"
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
  "27. PATCH estado rechaza campos adicionales",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-mesa/1/estado"
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "cancelada",

          razon_secreta:
            "QA",
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
  "28. una reserva cancelada puede reactivarse si la mesa sigue disponible",
  async () => {
    const mesa =
      await createMesa();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-mesa")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          mesa_id:
            mesa.id,
          fecha:
            "2027-07-10",
          hora:
            "10:00",
          numero_comensales:
            2,
        });

    const cancelled =
      await request(app)
        .patch(
          `/api/reservas-mesa/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "cancelada",
        });

    expect(
      cancelled.status
    ).toBe(200);

    const reactivated =
      await request(app)
        .patch(
          `/api/reservas-mesa/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "confirmada",
        });

    expect(
      reactivated.status
    ).toBe(200);

    expect(
      reactivated.body.data.estado
    ).toBe(
      "confirmada"
    );
  }
);

it(
  "29. no permite reactivar una reserva si otra confirmada ocupa la mesa",
  async () => {
    const mesa =
      await createMesa();

    const clienteA =
      await createAuthenticatedUser();

    const clienteB =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const first =
      await request(app)
        .post("/api/reservas-mesa")
        .set(
          "Authorization",
          `Bearer ${clienteA.token}`
        )
        .send({
          mesa_id:
            mesa.id,
          fecha:
            "2027-07-10",
          hora:
            "10:00",
          numero_comensales:
            2,
        });

    await request(app)
      .patch(
        `/api/reservas-mesa/${first.body.data.id}/estado`
      )
      .set(
        "Authorization",
        `Bearer ${admin.token}`
      )
      .send({
        estado:
          "cancelada",
      });

    const second =
      await request(app)
        .post("/api/reservas-mesa")
        .set(
          "Authorization",
          `Bearer ${clienteB.token}`
        )
        .send({
          mesa_id:
            mesa.id,
          fecha:
            "2027-07-10",
          hora:
            "10:00",
          numero_comensales:
            2,
        });

    expect(
      second.status
    ).toBe(201);

    const response =
      await request(app)
        .patch(
          `/api/reservas-mesa/${first.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "confirmada",
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "TABLE_UNAVAILABLE"
    );
  }
);

it(
  "30. no permite reactivar si la mesa entró en mantenimiento",
  async () => {
    const mesa =
      await createMesa();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-mesa")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          mesa_id:
            mesa.id,
          fecha:
            "2027-07-10",
          hora:
            "10:00",
          numero_comensales:
            2,
        });

    await request(app)
      .patch(
        `/api/reservas-mesa/${created.body.data.id}/estado`
      )
      .set(
        "Authorization",
        `Bearer ${admin.token}`
      )
      .send({
        estado:
          "cancelada",
      });

    await mesa.update({
      estado:
        "mantenimiento",
    });

    const response =
      await request(app)
        .patch(
          `/api/reservas-mesa/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "confirmada",
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "TABLE_IN_MAINTENANCE"
    );
  }
);

it(
  "31. no permite reactivar si la capacidad actual de la mesa ya no alcanza",
  async () => {
    const mesa =
      await createMesa({
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
        .post("/api/reservas-mesa")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          mesa_id:
            mesa.id,
          fecha:
            "2027-07-10",
          hora:
            "10:00",
          numero_comensales:
            4,
        });

    await request(app)
      .patch(
        `/api/reservas-mesa/${created.body.data.id}/estado`
      )
      .set(
        "Authorization",
        `Bearer ${admin.token}`
      )
      .send({
        estado:
          "cancelada",
      });

    await mesa.update({
      capacidad: 2,
    });

    const response =
      await request(app)
        .patch(
          `/api/reservas-mesa/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "confirmada",
        });

    expect(
      response.status
    ).toBe(422);

    expect(
      response.body.code
    ).toBe(
      "TABLE_CAPACITY_EXCEEDED"
    );
  }
);

it(
  "32. no permite reactivar una reserva cuya fecha ya quedó en el pasado",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const mesa =
      await createMesa();

    const {
      createReservaMesaFixture,
    } =
      await import(
        "../fixtures/restaurante"
      );

    const reserva =
      await createReservaMesaFixture({
        usuario_id:
          cliente.usuario.id,

        mesa_id:
          mesa.id,

        fecha:
          "2026-01-01",

        hora:
          "10:00:00",

        numero_comensales:
          2,

        estado:
          "cancelada",
      });

    const response =
      await request(app)
        .patch(
          `/api/reservas-mesa/${reserva.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "confirmada",
        });

    expect(
      response.status
    ).toBe(422);

    expect(
      response.body.code
    ).toBe(
      "TABLE_RESERVATION_DATE_IN_PAST"
    );
  }
);

it(
  "33. concurrencia: solo una solicitud puede reservar la misma mesa fecha y hora",
  async () => {
    const mesa =
      await createMesa({
        capacidad: 4,
      });

    const cliente =
      await createAuthenticatedUser({
        rol:
          ROLES.CLIENTE,
      });

    const requests =
      Array.from(
        {
          length: 20,
        },
        () =>
          request(app)
            .post(
              "/api/reservas-mesa"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              mesa_id:
                mesa.id,

              fecha:
                "2027-12-10",

              hora:
                "20:00",

              numero_comensales:
                2,
            })
      );

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
      "[QA CONCURRENCIA MESA]",
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
     * Verificación directa contra PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaMesa,
    } = db;

    const persistidas =
      await ReservaMesa.count({
        where: {
          mesa_id:
            mesa.id,

          fecha:
            "2027-12-10",

          hora:
            "20:00:00",

          estado:
            "confirmada",
        },
      });

    expect(
      persistidas
    ).toBe(1);
  }
);

it(
  "34. concurrencia reactivación: solo una reserva cancelada puede confirmarse para la misma mesa fecha y hora",
  async () => {
    const mesa =
      await createMesa({
        capacidad: 4,
      });

    const cliente =
      await createAuthenticatedUser({
        rol:
          ROLES.CLIENTE,
      });

    const admin =
      await createAuthenticatedUser({
        rol:
          ROLES.ADMIN,
      });

    /**
     * Creamos directamente 20 reservas canceladas
     * para el mismo slot.
     *
     * Al estar canceladas, no deberían bloquearse
     * entre sí hasta intentar reactivarlas.
     */
    const reservas: number[] = [];

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const reserva =
        await createReservaMesaFixture({
          usuario_id:
            cliente.usuario.id,

          mesa_id:
            mesa.id,

          fecha:
            "2027-12-20",

          hora:
            "20:00:00",

          numero_comensales:
            2,

          estado:
            "cancelada",
        });

      reservas.push(
        reserva.id
      );
    }

    /**
     * Intentamos confirmar las 20 al mismo tiempo.
     */
    const responses =
      await Promise.all(
        reservas.map(
          (id) =>
            request(app)
              .patch(
                `/api/reservas-mesa/${id}/estado`
              )
              .set(
                "Authorization",
                `Bearer ${admin.token}`
              )
              .send({
                estado:
                  "confirmada",
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
      "[QA CONCURRENCIA REACTIVACION MESA]",
      {
        total:
          responses.length,

        reactivadas:
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
      ReservaMesa,
    } = db;

    const confirmadas =
      await ReservaMesa.count({
        where: {
          mesa_id:
            mesa.id,

          fecha:
            "2027-12-20",

          hora:
            "20:00:00",

          estado:
            "confirmada",
        },
      });

    expect(
      confirmadas
    ).toBe(1);
  }
);
  }
);