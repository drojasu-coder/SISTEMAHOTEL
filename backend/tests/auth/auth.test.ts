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
  TEST_PASSWORD,
} from "../fixtures/users";

describe(
  "Auth API",
  () => {
    it(
      "POST /register crea un cliente",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/register"
            )
            .send({
              nombre:
                "Cliente QA",

              email:
                "Cliente.QA@Hotel.COM",

              password:
                TEST_PASSWORD,

              telefono:
                "55551234",
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body
        ).toMatchObject({
          success: true,
          statusCode: 201,

          data: {
            nombre:
              "Cliente QA",

            email:
              "cliente.qa@hotel.com",

            rol:
              ROLES.CLIENTE,

            activo:
              true,
          },
        });

        expect(
          response.body.data
        ).not.toHaveProperty(
          "password_hash"
        );

        expect(
          response.body.data
        ).not.toHaveProperty(
          "password"
        );
      }
    );

    it(
      "POST /register no permite elegir rol admin",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/auth/register"
            )
            .send({
              nombre:
                "Ataque QA",

              email:
                "ataque@hotel.test",

              password:
                TEST_PASSWORD,

              rol:
                "admin",
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body
            .code
        ).toBe(
          "VALIDATION_ERROR"
        );
      }
    );

    it(
      "POST /register rechaza email duplicado",
      async () => {
        const payload = {
          nombre:
            "Cliente QA",

          email:
            "duplicado@hotel.test",

          password:
            TEST_PASSWORD,
        };

        const first =
          await request(app)
            .post(
              "/api/auth/register"
            )
            .send(payload);

        expect(
          first.status
        ).toBe(201);

        const second =
          await request(app)
            .post(
              "/api/auth/register"
            )
            .send(payload);

        expect(
          second.status
        ).toBe(409);

        expect(
          second.body.code
        ).toBe(
          "EMAIL_ALREADY_REGISTERED"
        );
      }
    );

    it(
      "POST /login devuelve JWT con credenciales válidas",
      async () => {
        const {
          usuario,
        } =
          await createTestUser();

        const response =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                usuario.email,

              password:
                TEST_PASSWORD,
            });

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body
            .data
            .accessToken
        ).toEqual(
          expect.any(String)
        );

        expect(
          response.body
            .data
            .usuario
            .id
        ).toBe(
          usuario.id
        );
      }
    );

    it(
      "POST /login rechaza contraseña incorrecta",
      async () => {
        const {
          usuario,
        } =
          await createTestUser();

        const response =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                usuario.email,

              password:
                "PasswordIncorrecto123",
            });

        expect(
          response.status
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "INVALID_CREDENTIALS"
        );
      }
    );

    it(
      "POST /login rechaza usuarios inactivos",
      async () => {
        const {
          usuario,
        } =
          await createTestUser({
            activo: false,
          });

        const response =
          await request(app)
            .post(
              "/api/auth/login"
            )
            .send({
              email:
                usuario.email,

              password:
                TEST_PASSWORD,
            });

        expect(
          response.status
        ).toBe(403);

        expect(
          response.body.code
        ).toBe(
          "USER_INACTIVE"
        );
      }
    );

    it(
      "GET /me devuelve el usuario autenticado",
      async () => {
        const auth =
          await createAuthenticatedUser({
            rol:
              ROLES.CLIENTE,
          });

        const response =
          await request(app)
            .get(
              "/api/auth/me"
            )
            .set(
              "Authorization",
              `Bearer ${auth.token}`
            );

        expect(
          response.status
        ).toBe(200);

        expect(
          response.body.data.id
        ).toBe(
          auth.usuario.id
        );

        expect(
          response.body
            .data
            .rol
        ).toBe(
          ROLES.CLIENTE
        );
      }
    );

    it(
      "GET /me sin token devuelve 401",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/auth/me"
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
  }
);