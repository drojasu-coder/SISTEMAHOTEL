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
  createRecursoActividad,
  createInstructor,
    createReservaActividadFixture,
} from "../fixtures/actividades";

describe(
  "Reservas de actividad",
  () => {
    it(
      "1. cliente crea una reserva válida sin instructor",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const response =
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
          response.status
        ).toBe(201);

        expect(
          response.body.status
        ).toBe(
          "success"
        );

        expect(
          response.body.data.usuario_id
        ).toBe(
          cliente.usuario.id
        );

        expect(
          response.body.data.recurso_id
        ).toBe(
          recurso.id
        );

        expect(
          response.body.data.instructor_id
        ).toBeNull();

        expect(
          response.body.data.estado
        ).toBe(
          "confirmada"
        );
      }
    );

    it(
      "2. cliente crea reserva válida con instructor activo",
      async () => {
        const recurso =
          await createRecursoActividad();

        const instructor =
          await createInstructor();

        const cliente =
          await createAuthenticatedUser();

        const response =
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

              instructor_id:
                instructor.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",

              con_equipo:
                true,
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data.instructor_id
        ).toBe(
          instructor.id
        );

        expect(
          response.body.data.con_equipo
        ).toBe(true);
      }
    );

    it(
      "3. instructor_id null es válido",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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

              instructor_id:
                null,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data.instructor_id
        ).toBeNull();
      }
    );

    it(
      "4. admin no puede crear reserva de actividad",
      async () => {
        const recurso =
          await createRecursoActividad();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-actividad"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
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
      "5. sin JWT no puede crear reserva",
      async () => {
        const recurso =
          await createRecursoActividad();

        const response =
          await request(app)
            .post(
              "/api/reservas-actividad"
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
      "6. cliente no puede enviar usuario_id manualmente",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-actividad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              usuario_id:
                999999,

              recurso_id:
                recurso.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
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
      "7. rechaza recurso inexistente",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
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
                999999,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "RESOURCE_NOT_FOUND"
        );
      }
    );

    it(
      "8. rechaza instructor inexistente",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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

              instructor_id:
                999999,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "INSTRUCTOR_NOT_FOUND"
        );
      }
    );

    it(
      "9. rechaza instructor inactivo",
      async () => {
        const recurso =
          await createRecursoActividad();

        const instructor =
          await createInstructor({
            activo: false,
          });

        const cliente =
          await createAuthenticatedUser();

        const response =
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

              instructor_id:
                instructor.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "INSTRUCTOR_INACTIVE"
        );
      }
    );

    it(
      "10. rechaza hora fin igual a hora inicio",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
                "10:00",
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.code
        ).toBe(
          "INVALID_TIME_RANGE"
        );
      }
    );

    it(
      "11. rechaza hora fin anterior a hora inicio",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
                "11:00",

              hora_fin:
                "10:00",
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.code
        ).toBe(
          "INVALID_TIME_RANGE"
        );
      }
    );

    it(
      "12. rechaza duración menor de 30 minutos",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
                "10:29",
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "INVALID_ACTIVITY_DURATION"
        );
      }
    );

    it(
      "13. permite duración exacta de 30 minutos",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
                "10:30",
            });

        expect(
          response.status
        ).toBe(201);
      }
    );

    it(
      "14. permite duración exacta de 120 minutos",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
                "12:00",
            });

        expect(
          response.status
        ).toBe(201);
      }
    );

    it(
      "15. rechaza duración mayor de 120 minutos",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
                "12:01",
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "INVALID_ACTIVITY_DURATION"
        );
      }
    );

    it(
      "16. rechaza fecha calendario imposible",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
                "2027-02-30",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
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
      "17. rechaza hora inválida",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
                "25:00",

              hora_fin:
                "26:00",
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
      "18. rechaza campos adicionales",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const response =
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
      "19. rechaza traslape del mismo recurso",
      async () => {
        const recurso =
          await createRecursoActividad();

        const clienteA =
          await createAuthenticatedUser();

        const clienteB =
          await createAuthenticatedUser();

        const first =
          await request(app)
            .post(
              "/api/reservas-actividad"
            )
            .set(
              "Authorization",
              `Bearer ${clienteA.token}`
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
            });

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              "/api/reservas-actividad"
            )
            .set(
              "Authorization",
              `Bearer ${clienteB.token}`
            )
            .send({
              recurso_id:
                recurso.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:30",

              hora_fin:
                "11:30",
            });

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "RESOURCE_OVERLAP"
        );
      }
    );

    it(
      "20. permite reservas consecutivas del mismo recurso",
      async () => {
        const recurso =
          await createRecursoActividad();

        const cliente =
          await createAuthenticatedUser();

        const first =
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
            });

        const second =
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
                "11:00",

              hora_fin:
                "12:00",
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
      "21. rechaza traslape del mismo instructor aunque sean recursos distintos",
      async () => {
        const recursoA =
          await createRecursoActividad();

        const recursoB =
          await createRecursoActividad();

        const instructor =
          await createInstructor();

        const cliente =
          await createAuthenticatedUser();

        const first =
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
                recursoA.id,

              instructor_id:
                instructor.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
            });

        expect(
          first.status
        ).toBe(201);

        const second =
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
                recursoB.id,

              instructor_id:
                instructor.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:30",

              hora_fin:
                "11:30",
            });

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "INSTRUCTOR_OVERLAP"
        );
      }
    );

    it(
      "22. permite el mismo horario con recursos e instructores distintos",
      async () => {
        const recursoA =
          await createRecursoActividad();

        const recursoB =
          await createRecursoActividad();

        const instructorA =
          await createInstructor();

        const instructorB =
          await createInstructor();

        const cliente =
          await createAuthenticatedUser();

        const first =
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
                recursoA.id,

              instructor_id:
                instructorA.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
            });

        const second =
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
                recursoB.id,

              instructor_id:
                instructorB.id,

              fecha:
                "2027-06-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",
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
  "23. admin puede listar todas las reservas de actividad",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    expect(
      created.status
    ).toBe(201);

    const response =
      await request(app)
        .get(
          "/api/reservas-actividad"
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
  "24. cliente no puede listar todas las reservas de actividad",
  async () => {
    const cliente =
      await createAuthenticatedUser();

    const response =
      await request(app)
        .get(
          "/api/reservas-actividad"
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
  "25. admin puede consultar una reserva por ID",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-actividad/${created.body.data.id}`
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
  "26. cliente no puede consultar una reserva global por ID",
  async () => {
    const recurso =
      await createRecursoActividad();

    const owner =
      await createAuthenticatedUser();

    const intruso =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${owner.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-actividad/${created.body.data.id}`
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
  "27. GET rechaza un ID no numérico",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .get(
          "/api/reservas-actividad/abc"
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
  "28. PATCH devuelve 404 para una reserva inexistente",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-actividad/999999/estado"
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
      "RESERVATION_NOT_FOUND"
    );
  }
);

it(
  "29. admin puede cancelar una reserva confirmada",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-actividad/${created.body.data.id}/estado`
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
  "30. cliente no puede modificar estado ni equipo",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-actividad/${created.body.data.id}/estado`
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
  "31. admin puede modificar únicamente con_equipo",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",

          con_equipo:
            false,
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-actividad/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          con_equipo:
            true,
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data.con_equipo
    ).toBe(true);

    expect(
      response.body.data.estado
    ).toBe(
      "confirmada"
    );
  }
);

it(
  "32. PATCH vacío debe ser rechazado",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-actividad/1/estado"
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
  "33. PATCH rechaza estado inválido",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-actividad/1/estado"
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
  "34. una reserva cancelada libera el recurso",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const first =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    await request(app)
      .patch(
        `/api/reservas-actividad/${first.body.data.id}/estado`
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
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    expect(
      second.status
    ).toBe(201);
  }
);

it(
  "35. una reserva completada libera el recurso",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const first =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    await request(app)
      .patch(
        `/api/reservas-actividad/${first.body.data.id}/estado`
      )
      .set(
        "Authorization",
        `Bearer ${admin.token}`
      )
      .send({
        estado:
          "completada",
      });

    const second =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    expect(
      second.status
    ).toBe(201);
  }
);

it(
  "36. una reserva cancelada puede reactivarse si recurso e instructor siguen disponibles",
  async () => {
    const recurso =
      await createRecursoActividad();

    const instructor =
      await createInstructor();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          instructor_id:
            instructor.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    await request(app)
      .patch(
        `/api/reservas-actividad/${created.body.data.id}/estado`
      )
      .set(
        "Authorization",
        `Bearer ${admin.token}`
      )
      .send({
        estado:
          "cancelada",
      });

    const response =
      await request(app)
        .patch(
          `/api/reservas-actividad/${created.body.data.id}/estado`
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
    ).toBe(200);

    expect(
      response.body.data.estado
    ).toBe(
      "confirmada"
    );
  }
);

it(
  "37. no permite reactivar si el recurso ya fue ocupado por otra reserva",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const reservaCancelada =
      await createReservaActividadFixture({
        usuario_id:
          cliente.usuario.id,

        recurso_id:
          recurso.id,

        fecha:
          "2027-07-10",

        hora_inicio:
          "10:00:00",

        hora_fin:
          "11:00:00",

        estado:
          "cancelada",
      });

    const activa =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recurso.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    expect(
      activa.status
    ).toBe(201);

    const response =
      await request(app)
        .patch(
          `/api/reservas-actividad/${reservaCancelada.id}/estado`
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
      "RESOURCE_OVERLAP"
    );
  }
);

it(
  "38. no permite reactivar si el instructor ahora está inactivo",
  async () => {
    const recurso =
      await createRecursoActividad();

    const instructor =
      await createInstructor({
        activo: true,
      });

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const reserva =
      await createReservaActividadFixture({
        usuario_id:
          cliente.usuario.id,

        recurso_id:
          recurso.id,

        instructor_id:
          instructor.id,

        fecha:
          "2027-07-10",

        hora_inicio:
          "10:00:00",

        hora_fin:
          "11:00:00",

        estado:
          "cancelada",
      });

    await instructor.update({
      activo:
        false,
    });

    const response =
      await request(app)
        .patch(
          `/api/reservas-actividad/${reserva.id}/estado`
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
      "INSTRUCTOR_INACTIVE"
    );
  }
);

it(
  "39. no permite reactivar si el instructor está ocupado en otro recurso",
  async () => {
    const recursoA =
      await createRecursoActividad();

    const recursoB =
      await createRecursoActividad();

    const instructor =
      await createInstructor();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const cancelada =
      await createReservaActividadFixture({
        usuario_id:
          cliente.usuario.id,

        recurso_id:
          recursoA.id,

        instructor_id:
          instructor.id,

        fecha:
          "2027-07-10",

        hora_inicio:
          "10:00:00",

        hora_fin:
          "11:00:00",

        estado:
          "cancelada",
      });

    const activa =
      await request(app)
        .post("/api/reservas-actividad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          recurso_id:
            recursoB.id,

          instructor_id:
            instructor.id,

          fecha:
            "2027-07-10",

          hora_inicio:
            "10:00",

          hora_fin:
            "11:00",
        });

    expect(
      activa.status
    ).toBe(201);

    const response =
      await request(app)
        .patch(
          `/api/reservas-actividad/${cancelada.id}/estado`
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
      "INSTRUCTOR_OVERLAP"
    );
  }
);

it(
  "40. no permite reactivar una reserva cuya fecha ya está en el pasado",
  async () => {
    const recurso =
      await createRecursoActividad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const reserva =
      await createReservaActividadFixture({
        usuario_id:
          cliente.usuario.id,

        recurso_id:
          recurso.id,

        fecha:
          "2026-01-01",

        hora_inicio:
          "10:00:00",

        hora_fin:
          "11:00:00",

        estado:
          "cancelada",
      });

    const response =
      await request(app)
        .patch(
          `/api/reservas-actividad/${reserva.id}/estado`
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
      "ACTIVITY_DATE_IN_PAST"
    );
  }
);

it(
  "41. concurrencia recurso: solo una solicitud puede reservar el mismo recurso y horario",
  async () => {
    const recurso =
      await createRecursoActividad();

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
                "2027-12-10",

              hora_inicio:
                "10:00",

              hora_fin:
                "11:00",

              con_equipo:
                false,
            })
      );

    /**
     * Lanzamos las 20 solicitudes
     * sin esperar la respuesta de la anterior.
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
      "[QA CONCURRENCIA RECURSO ACTIVIDAD]",
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
     * Regla:
     * un recurso solamente puede tener
     * una reserva confirmada para ese
     * intervalo.
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
     * Verificación directa en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaActividad,
    } = db;

    const persistidas =
      await ReservaActividad.count({
        where: {
          recurso_id:
            recurso.id,

          fecha:
            "2027-12-10",

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
  "42. concurrencia instructor: solo una solicitud puede usar el mismo instructor y horario",
  async () => {
    const instructor =
      await createInstructor({
        activo: true,
      });

    const cliente =
      await createAuthenticatedUser({
        rol:
          ROLES.CLIENTE,
      });

    /**
     * Creamos 20 recursos diferentes.
     *
     * Así eliminamos al recurso como punto
     * de conflicto y aislamos exclusivamente
     * la concurrencia del instructor.
     */
    const recursos = [];

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const recurso =
        await createRecursoActividad();

      recursos.push(
        recurso
      );
    }

    /**
     * Las 20 reservas usan:
     *
     * - recursos distintos
     * - mismo instructor
     * - misma fecha
     * - mismo horario
     */
    const responses =
      await Promise.all(
        recursos.map(
          (recurso) =>
            request(app)
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

                instructor_id:
                  instructor.id,

                fecha:
                  "2027-12-15",

                hora_inicio:
                  "10:00",

                hora_fin:
                  "11:00",

                con_equipo:
                  false,
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
      "[QA CONCURRENCIA INSTRUCTOR ACTIVIDAD]",
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
     * Regla:
     *
     * Un instructor no puede impartir
     * múltiples actividades simultáneamente,
     * aunque cada actividad utilice un
     * recurso diferente.
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
     * Comprobamos también la persistencia
     * directamente en PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaActividad,
    } = db;

    const persistidas =
      await ReservaActividad.count({
        where: {
          instructor_id:
            instructor.id,

          fecha:
            "2027-12-15",

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
  "43. concurrencia reactivación recurso: solo una reserva puede confirmarse para el mismo recurso y horario",
  async () => {
    const recurso =
      await createRecursoActividad();

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
     * Creamos 20 reservas canceladas
     * sobre el mismo recurso y horario.
     *
     * Al estar canceladas no bloquean
     * actualmente el recurso.
     */
    const reservas: number[] = [];

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const reserva =
        await createReservaActividadFixture({
          usuario_id:
            cliente.usuario.id,

          recurso_id:
            recurso.id,

          instructor_id:
            null,

          fecha:
            "2027-12-20",

          hora_inicio:
            "10:00:00",

          hora_fin:
            "11:00:00",

          estado:
            "cancelada",
        });

      reservas.push(
        reserva.id
      );
    }

    /**
     * Reactivamos las 20 al mismo tiempo.
     */
    const responses =
      await Promise.all(
        reservas.map(
          (id) =>
            request(app)
              .patch(
                `/api/reservas-actividad/${id}/estado`
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
      "[QA CONCURRENCIA REACTIVACION RECURSO ACTIVIDAD]",
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

    /**
     * Regla de negocio:
     * solamente una reserva puede volver
     * a bloquear ese recurso y horario.
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
      ReservaActividad,
    } = db;

    const confirmadas =
      await ReservaActividad.count({
        where: {
          recurso_id:
            recurso.id,

          fecha:
            "2027-12-20",

          estado:
            "confirmada",
        },
      });

    expect(
      confirmadas
    ).toBe(1);
  }
);

it(
  "44. concurrencia reactivación instructor: solo una reserva puede confirmarse con el mismo instructor y horario",
  async () => {
    const instructor =
      await createInstructor({
        activo: true,
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
     * Creamos 20 reservas canceladas.
     *
     * Cada una utiliza un recurso diferente,
     * pero todas comparten:
     *
     * - mismo instructor
     * - misma fecha
     * - mismo horario
     *
     * Así aislamos exclusivamente la
     * concurrencia del instructor.
     */
    const reservas: number[] = [];

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const recurso =
        await createRecursoActividad();

      const reserva =
        await createReservaActividadFixture({
          usuario_id:
            cliente.usuario.id,

          recurso_id:
            recurso.id,

          instructor_id:
            instructor.id,

          fecha:
            "2027-12-22",

          hora_inicio:
            "10:00:00",

          hora_fin:
            "11:00:00",

          estado:
            "cancelada",
        });

      reservas.push(
        reserva.id
      );
    }

    /**
     * Reactivamos las 20 reservas
     * simultáneamente.
     */
    const responses =
      await Promise.all(
        reservas.map(
          (id) =>
            request(app)
              .patch(
                `/api/reservas-actividad/${id}/estado`
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
      "[QA CONCURRENCIA REACTIVACION INSTRUCTOR ACTIVIDAD]",
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

    /**
     * Regla:
     *
     * El mismo instructor no puede terminar
     * asignado simultáneamente a múltiples
     * actividades confirmadas en el mismo horario.
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
      ReservaActividad,
    } = db;

    const confirmadas =
      await ReservaActividad.count({
        where: {
          instructor_id:
            instructor.id,

          fecha:
            "2027-12-22",

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