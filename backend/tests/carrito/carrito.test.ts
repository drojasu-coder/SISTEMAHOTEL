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

const db =
  require("../../src/models");

const {
  Carrito,
} = db;

describe(
  "Carritos",
  () => {
    it(
      "1. cliente crea un carrito activo para sí mismo",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const before =
          Date.now();

        const response =
          await request(app)
            .post(
              "/api/carritos"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({});

        const after =
          Date.now();

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .usuario_id
        ).toBe(
          cliente.usuario.id
        );

        expect(
          response.body.data.estado
        ).toBe(
          "activo"
        );

        const expiresAt =
          new Date(
            response.body.data
              .expira_en
          ).getTime();

        expect(
          expiresAt
        ).toBeGreaterThanOrEqual(
          before +
            14 *
              60 *
              1000
        );

        expect(
          expiresAt
        ).toBeLessThanOrEqual(
          after +
            16 *
              60 *
              1000
        );
      }
    );

    it(
      "2. sin JWT no puede crear carrito",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/carritos"
            )
            .send({});

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
      "3. admin no puede crear carrito",
      async () => {
        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        const response =
          await request(app)
            .post(
              "/api/carritos"
            )
            .set(
              "Authorization",
              `Bearer ${admin.token}`
            )
            .send({});

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
      "4. backend ignora usuario estado y expiración enviados por el cliente",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const otro =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .post(
              "/api/carritos"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({
              usuario_id:
                otro.usuario.id,

              estado:
                "pagado",

              expira_en:
                "2099-12-31T23:59:59.000Z",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.data
            .usuario_id
        ).toBe(
          cliente.usuario.id
        );

        expect(
          response.body.data.estado
        ).toBe(
          "activo"
        );

        expect(
          response.body.data
            .expira_en
        ).not.toBe(
          "2099-12-31T23:59:59.000Z"
        );
      }
    );

    it(
      "5. rechaza crear un segundo carrito activo",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const first =
          await request(app)
            .post(
              "/api/carritos"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({});

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              "/api/carritos"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({});

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "CART_ALREADY_ACTIVE"
        );
      }
    );

    it(
      "6. GET actual devuelve el carrito activo del usuario",
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
              "/api/carritos/actual"
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
          carrito.id
        );

        expect(
          response.body.data.estado
        ).toBe(
          "activo"
        );
      }
    );

    it(
      "7. GET actual devuelve 404 si no existe carrito activo",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .get(
              "/api/carritos/actual"
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
          "ACTIVE_CART_NOT_FOUND"
        );
      }
    );

    it(
      "8. cliente puede consultar su propio carrito por ID",
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
              `/api/carritos/${carrito.id}`
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
          carrito.id
        );
      }
    );

    it(
      "9. cliente no puede consultar carrito de otro usuario",
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
              `/api/carritos/${carrito.id}`
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
      "10. admin puede consultar carrito de cualquier usuario",
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

        const response =
          await request(app)
            .get(
              `/api/carritos/${carrito.id}`
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
          carrito.id
        );
      }
    );

    it(
      "11. GET por ID rechaza identificador no numérico",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const response =
          await request(app)
            .get(
              "/api/carritos/abc"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
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
      "12. cliente al listar solo obtiene sus propios carritos",
      async () => {
        const clienteA =
          await createAuthenticatedUser();

        const clienteB =
          await createAuthenticatedUser();

        await createCarritoFixture({
          usuario_id:
            clienteA.usuario.id,

          estado:
            "expirado",

          expira_en:
            new Date(
              Date.now() -
                60 *
                  1000
            ),
        });

        await createCarritoFixture({
          usuario_id:
            clienteA.usuario.id,
        });

        await createCarritoFixture({
          usuario_id:
            clienteB.usuario.id,
        });

        const response =
          await request(app)
            .get(
              "/api/carritos"
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
        ).toHaveLength(2);

        for (
          const carrito of
          response.body.data
        ) {
          expect(
            carrito.usuario_id
          ).toBe(
            clienteA.usuario.id
          );
        }
      }
    );

    it(
      "13. admin al listar obtiene carritos de todos los usuarios",
      async () => {
        const clienteA =
          await createAuthenticatedUser();

        const clienteB =
          await createAuthenticatedUser();

        const admin =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        await createCarritoFixture({
          usuario_id:
            clienteA.usuario.id,
        });

        await createCarritoFixture({
          usuario_id:
            clienteB.usuario.id,
        });

        const response =
          await request(app)
            .get(
              "/api/carritos"
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
      "14. GET actual expira automáticamente un carrito vencido",
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

        const response =
          await request(app)
            .get(
              "/api/carritos/actual"
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
          "ACTIVE_CART_NOT_FOUND"
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
      "15. cliente puede crear un carrito nuevo después de que el anterior expiró",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const anterior =
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

        const response =
          await request(app)
            .post(
              "/api/carritos"
            )
            .set(
              "Authorization",
              `Bearer ${cliente.token}`
            )
            .send({});

        expect(
          response.status
        ).toBe(201);

        await anterior.reload();

        expect(
          anterior.estado
        ).toBe(
          "expirado"
        );

        expect(
          response.body.data.id
        ).not.toBe(
          anterior.id
        );

        expect(
          response.body.data.estado
        ).toBe(
          "activo"
        );

        const activos =
          await Carrito.count({
            where: {
              usuario_id:
                cliente.usuario.id,

              estado:
                "activo",
            },
          });

        expect(
          activos
        ).toBe(1);
      }
    );

    it(
      "16. listar carritos persiste como expirado cualquier carrito vencido",
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

        const response =
          await request(app)
            .get(
              "/api/carritos"
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
            .estado
        ).toBe(
          "expirado"
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
      "17. concurrencia: solo una solicitud puede crear carrito activo para el mismo usuario",
      async () => {
        const cliente =
          await createAuthenticatedUser();

        const responses =
          await Promise.all(
            Array.from(
              {
                length: 20,
              },
              () =>
                request(app)
                  .post(
                    "/api/carritos"
                  )
                  .set(
                    "Authorization",
                    `Bearer ${cliente.token}`
                  )
                  .send({})
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
          "[QA CONCURRENCIA CARRITO]",
          {
            total:
              responses.length,

            creados:
              created.length,

            conflictos:
              conflicts.length,

            inesperados:
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

        for (
          const conflict of
          conflicts
        ) {
          expect(
            conflict.body.code
          ).toBe(
            "CART_ALREADY_ACTIVE"
          );
        }

        const activos =
          await Carrito.count({
            where: {
              usuario_id:
                cliente.usuario.id,

              estado:
                "activo",
            },
          });

        expect(
          activos
        ).toBe(1);
      }
    );
  }
);