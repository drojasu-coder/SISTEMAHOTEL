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
  createAmenidad,
  createReservaAmenidadFixture,
} from "../fixtures/amenidades";

describe(
  "Reservas de amenidad",
  () => {
    it(
      "1. cliente crea una reserva válida",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
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
          response.body.data.amenidad_id
        ).toBe(
          amenidad.id
        );

        expect(
          response.body.data.estado
        ).toBe(
          "confirmada"
        );
      }
    );

    it(
      "2. genera automáticamente un código QR",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data.codigo_qr
        ).toEqual(
          expect.stringMatching(
            /^AMENITY-/
          )
        );
      }
    );

    it(
      "3. mobiliario omitido se guarda como ninguno",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data.mobiliario
        ).toBe(
          "ninguno"
        );
      }
    );

    it(
      "4. normaliza espacios de la franja horaria",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00 - 11:00",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .franja_horaria
        ).toBe(
          "10:00-11:00"
        );
      }
    );

    it(
      "5. admin no puede crear reservas de amenidad",
      async () => {
        const amenidad =
          await createAmenidad();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
            });

        expect(
          response.status
        ).toBe(403);
      }
    );

    it(
      "6. sin JWT no puede reservar",
      async () => {
        const amenidad =
          await createAmenidad();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
            });

        expect(
          response.status
        ).toBe(401);
      }
    );

    it(
      "7. cliente no puede enviar usuario_id",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              usuario_id:
                999999,

              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
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
      "8. rechaza amenidad inexistente",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                999999,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
            });

        expect(
          response.status
        ).toBe(404);

        expect(
          response.body.code
        ).toBe(
          "AMENITY_NOT_FOUND"
        );
      }
    );

    it(
      "9. rechaza fecha calendario imposible",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-02-30",

              franja_horaria:
                "10:00-11:00",
            });

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "10. rechaza fecha pasada",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2026-01-01",

              franja_horaria:
                "10:00-11:00",
            });

        expect(
          response.status
        ).toBe(422);

        expect(
          response.body.code
        ).toBe(
          "AMENITY_DATE_IN_PAST"
        );
      }
    );

    it(
      "11. rechaza franja con formato inválido",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10 a 11",
            });

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "12. rechaza franja con inicio igual al fin",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-10:00",
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.code
        ).toBe(
          "INVALID_AMENITY_TIME_SLOT"
        );
      }
    );

    it(
      "13. rechaza franja invertida",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "12:00-10:00",
            });

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "14. rechaza campos adicionales",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",

              vip:
                true,
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
      "15. mismo usuario no puede duplicar la misma franja",
      async () => {
        const amenidad =
          await createAmenidad({
            aforo_maximo: 5,
          });

        const cliente =
          await createAuthenticatedUser();

        const payload = {
          amenidad_id:
            amenidad.id,

          fecha:
            "2027-06-10",

          franja_horaria:
            "10:00-11:00",
        };

        const first =
          await request(app)
            .post(
              "/api/reservas-amenidad"
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
              "/api/reservas-amenidad"
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
          "AMENITY_RESERVATION_ALREADY_EXISTS"
        );
      }
    );

    it(
      "16. mismo usuario no puede reservar una franja parcialmente superpuesta",
      async () => {
        const amenidad =
          await createAmenidad({
            aforo_maximo: 5,
          });

        const cliente =
          await createAuthenticatedUser();

        await request(app)
          .post(
            "/api/reservas-amenidad"
          )
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            amenidad_id:
              amenidad.id,

            fecha:
              "2027-06-10",

            franja_horaria:
              "10:00-11:00",
          });

        const response =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:30-11:30",
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "AMENITY_RESERVATION_ALREADY_EXISTS"
        );
      }
    );

    it(
      "17. permite franjas consecutivas del mismo usuario",
      async () => {
        const amenidad =
          await createAmenidad({
            aforo_maximo: 5,
          });

        const cliente =
          await createAuthenticatedUser();

        const first =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
            });

        const second =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "11:00-12:00",
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
      "18. permite llenar exactamente el aforo máximo",
      async () => {
        const amenidad =
          await createAmenidad({
            aforo_maximo: 3,
          });

        for (
          let i = 0;
          i < 3;
          i += 1
        ) {
          const cliente =
            await createAuthenticatedUser();

          const response =
            await request(app)
              .post(
                "/api/reservas-amenidad"
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                amenidad_id:
                  amenidad.id,

                fecha:
                  "2027-06-10",

                franja_horaria:
                  "10:00-11:00",
              });

          expect(
            response.status
          ).toBe(201);
        }
      }
    );

    it(
      "19. rechaza exceder el aforo máximo",
      async () => {
        const amenidad =
          await createAmenidad({
            aforo_maximo: 2,
          });

        const clientes = [
          await createAuthenticatedUser(),
          await createAuthenticatedUser(),
          await createAuthenticatedUser(),
        ];

        for (
          let i = 0;
          i < 2;
          i += 1
        ) {
          const response =
            await request(app)
              .post(
                "/api/reservas-amenidad"
              )
              .set(
                "Authorization",
                `Bearer ${clientes[i].token}`
              )
              .send({
                amenidad_id:
                  amenidad.id,

                fecha:
                  "2027-06-10",

                franja_horaria:
                  "10:00-11:00",
              });

          expect(
            response.status
          ).toBe(201);
        }

        const overflow =
          await request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${clientes[2].token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-06-10",

              franja_horaria:
                "10:00-11:00",
            });

        expect(
          overflow.status
        ).toBe(409);

        expect(
          overflow.body.code
        ).toBe(
          "AMENITY_CAPACITY_FULL"
        );
      }
    );

    it(
      "20. aforo considera solapamiento parcial real",
      async () => {
        const amenidad =
          await createAmenidad({
            aforo_maximo: 2,
          });

        const clienteA =
          await createAuthenticatedUser();

        const clienteB =
          await createAuthenticatedUser();

        const clienteC =
          await createAuthenticatedUser();

        await request(app)
          .post("/api/reservas-amenidad")
          .set(
            "Authorization",
            `Bearer ${clienteA.token}`
          )
          .send({
            amenidad_id:
              amenidad.id,
            fecha:
              "2027-06-10",
            franja_horaria:
              "10:00-11:00",
          });

        await request(app)
          .post("/api/reservas-amenidad")
          .set(
            "Authorization",
            `Bearer ${clienteB.token}`
          )
          .send({
            amenidad_id:
              amenidad.id,
            fecha:
              "2027-06-10",
            franja_horaria:
              "10:30-11:30",
          });

        const response =
          await request(app)
            .post("/api/reservas-amenidad")
            .set(
              "Authorization",
              `Bearer ${clienteC.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,
              fecha:
                "2027-06-10",
              franja_horaria:
                "10:45-11:15",
            });

        expect(
          response.status
        ).toBe(409);

        expect(
          response.body.code
        ).toBe(
          "AMENITY_CAPACITY_FULL"
        );
      }
    );

    it(
      "21. franjas consecutivas no consumen aforo simultáneamente",
      async () => {
        const amenidad =
          await createAmenidad({
            aforo_maximo: 1,
          });

        const clienteA =
          await createAuthenticatedUser();

        const clienteB =
          await createAuthenticatedUser();

        const first =
          await request(app)
            .post("/api/reservas-amenidad")
            .set(
              "Authorization",
              `Bearer ${clienteA.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,
              fecha:
                "2027-06-10",
              franja_horaria:
                "10:00-11:00",
            });

        const second =
          await request(app)
            .post("/api/reservas-amenidad")
            .set(
              "Authorization",
              `Bearer ${clienteB.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,
              fecha:
                "2027-06-10",
              franja_horaria:
                "11:00-12:00",
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
      "22. admin puede listar reservas",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        await request(app)
          .post("/api/reservas-amenidad")
          .set(
            "Authorization",
            `Bearer ${cliente.token}`
          )
          .send({
            amenidad_id:
              amenidad.id,
            fecha:
              "2027-06-10",
            franja_horaria:
              "10:00-11:00",
          });

        const response =
          await request(app)
            .get(
              "/api/reservas-amenidad"
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
      "23. cliente no puede listar todas las reservas",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .get(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            );

        expect(
          response.status
        ).toBe(403);
      }
    );

    it(
      "24. admin puede consultar reserva por ID",
      async () => {
        const amenidad =
          await createAmenidad();

        const cliente =
          await createAuthenticatedUser();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const created =
          await request(app)
            .post("/api/reservas-amenidad")
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,
              fecha:
                "2027-06-10",
              franja_horaria:
                "10:00-11:00",
            });

        const response =
          await request(app)
            .get(
              `/api/reservas-amenidad/${created.body.data.id}`
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
  "25. cliente no puede consultar una reserva global por ID",
  async () => {
    const amenidad =
      await createAmenidad();

    const owner =
      await createAuthenticatedUser();

    const intruso =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-amenidad")
        .set(
          "Authorization",
          `Bearer ${owner.token}`
        )
        .send({
          amenidad_id:
            amenidad.id,
          fecha:
            "2027-07-10",
          franja_horaria:
            "10:00-11:00",
        });

    const response =
      await request(app)
        .get(
          `/api/reservas-amenidad/${created.body.data.id}`
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
  "26. GET rechaza ID no numérico",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .get(
          "/api/reservas-amenidad/abc"
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
  "27. GET devuelve 404 para reserva inexistente",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .get(
          "/api/reservas-amenidad/999999"
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
      "AMENITY_RESERVATION_NOT_FOUND"
    );
  }
);

it(
  "28. admin puede cancelar una reserva confirmada",
  async () => {
    const amenidad =
      await createAmenidad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-amenidad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          amenidad_id:
            amenidad.id,
          fecha:
            "2027-07-10",
          franja_horaria:
            "10:00-11:00",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-amenidad/${created.body.data.id}/estado`
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
  "29. admin puede marcar una reserva confirmada como usada",
  async () => {
    const amenidad =
      await createAmenidad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const created =
      await request(app)
        .post("/api/reservas-amenidad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          amenidad_id:
            amenidad.id,
          fecha:
            "2027-07-10",
          franja_horaria:
            "10:00-11:00",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-amenidad/${created.body.data.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "usada",
        });

    expect(
      response.status
    ).toBe(200);

    expect(
      response.body.data.estado
    ).toBe(
      "usada"
    );
  }
);

it(
  "30. cliente no puede cambiar el estado",
  async () => {
    const amenidad =
      await createAmenidad();

    const cliente =
      await createAuthenticatedUser();

    const created =
      await request(app)
        .post("/api/reservas-amenidad")
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          amenidad_id:
            amenidad.id,
          fecha:
            "2027-07-10",
          franja_horaria:
            "10:00-11:00",
        });

    const response =
      await request(app)
        .patch(
          `/api/reservas-amenidad/${created.body.data.id}/estado`
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
  "31. PATCH rechaza ID no numérico",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-amenidad/abc/estado"
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
  "32. PATCH rechaza un estado inválido",
  async () => {
    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const response =
      await request(app)
        .patch(
          "/api/reservas-amenidad/1/estado"
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
    ).toBe(400);

    expect(
      response.body.code
    ).toBe(
      "VALIDATION_ERROR"
    );
  }
);

it(
  "33. rechaza cambiar al mismo estado que ya posee",
  async () => {
    const amenidad =
      await createAmenidad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const reserva =
      await createReservaAmenidadFixture({
        usuario_id:
          cliente.usuario.id,

        amenidad_id:
          amenidad.id,

        estado:
          "cancelada",
      });

    const response =
      await request(app)
        .patch(
          `/api/reservas-amenidad/${reserva.id}/estado`
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
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "AMENITY_RESERVATION_STATUS_UNCHANGED"
    );
  }
);

it(
  "34. una reserva en estado final no puede cambiar a otro estado final",
  async () => {
    const amenidad =
      await createAmenidad();

    const cliente =
      await createAuthenticatedUser();

    const admin =
      await createAuthenticatedUser({
        rol: ROLES.ADMIN,
      });

    const reserva =
      await createReservaAmenidadFixture({
        usuario_id:
          cliente.usuario.id,

        amenidad_id:
          amenidad.id,

        estado:
          "cancelada",
      });

    const response =
      await request(app)
        .patch(
          `/api/reservas-amenidad/${reserva.id}/estado`
        )
        .set(
          "Authorization",
          `Bearer ${admin.token}`
        )
        .send({
          estado:
            "usada",
        });

    expect(
      response.status
    ).toBe(409);

    expect(
      response.body.code
    ).toBe(
      "AMENITY_RESERVATION_STATUS_FINAL"
    );
  }
);

it(
  "35. cancelar una reserva libera aforo para otro usuario",
  async () => {
    const amenidad =
      await createAmenidad({
        aforo_maximo: 1,
      });

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
        .post("/api/reservas-amenidad")
        .set(
          "Authorization",
          `Bearer ${clienteA.token}`
        )
        .send({
          amenidad_id:
            amenidad.id,
          fecha:
            "2027-07-10",
          franja_horaria:
            "10:00-11:00",
        });

    expect(
      first.status
    ).toBe(201);

    const blocked =
      await request(app)
        .post("/api/reservas-amenidad")
        .set(
          "Authorization",
          `Bearer ${clienteB.token}`
        )
        .send({
          amenidad_id:
            amenidad.id,
          fecha:
            "2027-07-10",
          franja_horaria:
            "10:00-11:00",
        });

    expect(
      blocked.status
    ).toBe(409);

    const cancelled =
      await request(app)
        .patch(
          `/api/reservas-amenidad/${first.body.data.id}/estado`
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

    const retry =
      await request(app)
        .post("/api/reservas-amenidad")
        .set(
          "Authorization",
          `Bearer ${clienteB.token}`
        )
        .send({
          amenidad_id:
            amenidad.id,
          fecha:
            "2027-07-10",
          franja_horaria:
            "10:00-11:00",
        });

    expect(
      retry.status
    ).toBe(201);
  }
);

it(
  "36. concurrencia aforo: nunca permite superar el aforo máximo",
  async () => {
    const amenidad =
      await createAmenidad({
        aforo_maximo: 5,
      });

    /**
     * Creamos 20 usuarios diferentes.
     *
     * De esta forma ningún conflicto puede
     * deberse a duplicado del mismo usuario.
     * Solamente estamos probando aforo.
     */
    const clientes = [];

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      const cliente =
        await createAuthenticatedUser({
          rol:
            ROLES.CLIENTE,
        });

      clientes.push(
        cliente
      );
    }

    /**
     * Los 20 usuarios intentan entrar
     * exactamente a la misma amenidad,
     * fecha y franja.
     */
    const responses =
      await Promise.all(
        clientes.map(
          (cliente) =>
            request(app)
              .post(
                "/api/reservas-amenidad"
              )
              .set(
                "Authorization",
                `Bearer ${cliente.token}`
              )
              .send({
                amenidad_id:
                  amenidad.id,

                fecha:
                  "2027-12-10",

                franja_horaria:
                  "10:00-11:00",
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
      "[QA CONCURRENCIA AFORO AMENIDAD]",
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

    /**
     * Aforo = 5.
     *
     * Exactamente cinco deben entrar.
     */
    expect(
      created
    ).toHaveLength(5);

    expect(
      conflicts
    ).toHaveLength(15);

    expect(
      unexpected
    ).toHaveLength(0);

    /**
     * Los 15 conflictos deberían deberse
     * exclusivamente al aforo completo.
     */
    for (
      const conflict of
      conflicts
    ) {
      expect(
        conflict.body.code
      ).toBe(
        "AMENITY_CAPACITY_FULL"
      );
    }

    /**
     * Comprobación directa contra PostgreSQL.
     *
     * Aunque hubiera algún error en las
     * respuestas HTTP, la BD jamás debería
     * contener más de cinco confirmadas.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaAmenidad,
    } = db;

    const confirmadas =
      await ReservaAmenidad.count({
        where: {
          amenidad_id:
            amenidad.id,

          fecha:
            "2027-12-10",

          franja_horaria:
            "10:00-11:00",

          estado:
            "confirmada",
        },
      });

    expect(
      confirmadas
    ).toBe(5);
  }
);

it(
  "37. concurrencia duplicado: un mismo usuario solo puede crear una reserva superpuesta",
  async () => {
    const amenidad =
      await createAmenidad({
        aforo_maximo: 50,
      });

    const cliente =
      await createAuthenticatedUser({
        rol:
          ROLES.CLIENTE,
      });

    /**
     * Aforo deliberadamente alto.
     *
     * Así cualquier 409 debe provenir
     * exclusivamente de la regla de
     * duplicado del usuario y no del aforo.
     */
    const requests =
      Array.from(
        {
          length: 20,
        },
        () =>
          request(app)
            .post(
              "/api/reservas-amenidad"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              amenidad_id:
                amenidad.id,

              fecha:
                "2027-12-15",

              franja_horaria:
                "10:00-11:00",
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
      "[QA CONCURRENCIA DUPLICADO AMENIDAD]",
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
     * Todos los conflictos deben producirse
     * por la regla anti-duplicado.
     */
    for (
      const conflict of
      conflicts
    ) {
      expect(
        conflict.body.code
      ).toBe(
        "AMENITY_RESERVATION_ALREADY_EXISTS"
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
      ReservaAmenidad,
    } = db;

    const persistidas =
      await ReservaAmenidad.count({
        where: {
          usuario_id:
            cliente.usuario.id,

          amenidad_id:
            amenidad.id,

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
  "38. concurrencia estado: solo una transición terminal puede ganar",
  async () => {
    const amenidad =
      await createAmenidad();

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

    const created =
      await request(app)
        .post(
          "/api/reservas-amenidad"
        )
        .set(
          "Authorization",
          `Bearer ${cliente.token}`
        )
        .send({
          amenidad_id:
            amenidad.id,

          fecha:
            "2027-12-20",

          franja_horaria:
            "10:00-11:00",
        });

    expect(
      created.status
    ).toBe(201);

    const reservaId =
      created.body.data.id;

    /**
     * Construimos 20 cambios simultáneos:
     *
     * 10 quieren cancelar.
     * 10 quieren marcar como usada.
     *
     * Ambos son estados terminales.
     */
    const targets =
      Array.from(
        {
          length: 20,
        },
        (_, index) =>
          index % 2 === 0
            ? "cancelada"
            : "usada"
      );

    const responses =
      await Promise.all(
        targets.map(
          (estado) =>
            request(app)
              .patch(
                `/api/reservas-amenidad/${reservaId}/estado`
              )
              .set(
                "Authorization",
                `Bearer ${admin.token}`
              )
              .send({
                estado,
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
      "[QA CONCURRENCIA ESTADO AMENIDAD]",
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

        ganadores:
          updated.map(
            (response) =>
              response.body.data.estado
          ),
      }
    );

    /**
     * Solo UNA petición puede llevar
     * la reserva desde confirmada hacia
     * un estado terminal.
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
     * Los 409 válidos pueden ser:
     *
     * - ya posee exactamente ese estado;
     * - ya alcanzó el otro estado terminal.
     */
    for (
      const conflict of
      conflicts
    ) {
      expect(
        [
          "AMENITY_RESERVATION_STATUS_UNCHANGED",
          "AMENITY_RESERVATION_STATUS_FINAL",
        ]
      ).toContain(
        conflict.body.code
      );
    }

    /**
     * El ganador puede ser cualquiera:
     * cancelada o usada.
     *
     * Lo importante es que solamente exista
     * una transición efectiva.
     */
    expect(
      [
        "cancelada",
        "usada",
      ]
    ).toContain(
      updated[0].body.data.estado
    );

    /**
     * Verificación directa de PostgreSQL.
     */
    const db =
      require(
        "../../src/models"
      );

    const {
      ReservaAmenidad,
    } = db;

    const persistida =
      await ReservaAmenidad.findByPk(
        reservaId
      );

    expect(
      persistida
    ).not.toBeNull();

    expect(
      [
        "cancelada",
        "usada",
      ]
    ).toContain(
      persistida.estado
    );
  }
);
  }
);