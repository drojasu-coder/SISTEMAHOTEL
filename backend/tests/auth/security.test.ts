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
  signQaToken,
} from "../helpers/token";

import {
  createTestUser,
} from "../fixtures/users";

describe(
  "JWT y autorización - seguridad",
  () => {
    it(
      "rechaza un Authorization con formato incorrecto",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/auth/me"
            )
            .set(
              "Authorization",
              "Basic abc123"
            );

        expect(
          response.status
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "INVALID_AUTH_FORMAT"
        );
      }
    );

    it(
      "rechaza un JWT firmado con otro secreto",
      async () => {
        const {
          usuario,
        } =
          await createTestUser();

        const token =
          signQaToken({
            sub:
              usuario.id,

            secret:
              "secret-totalmente-falso-para-qa-123456789",
          });

        const response =
          await request(app)
            .get(
              "/api/auth/me"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            );

        expect(
          response.status
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "INVALID_TOKEN"
        );
      }
    );

    it(
      "rechaza un JWT expirado",
      async () => {
        const {
          usuario,
        } =
          await createTestUser();

        const token =
          signQaToken({
            sub:
              usuario.id,

            /**
             * Expiró un segundo
             * antes de emitirse.
             */
            expiresIn: -1,
          });

        const response =
          await request(app)
            .get(
              "/api/auth/me"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            );

        expect(
          response.status
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "TOKEN_EXPIRED"
        );
      }
    );

    it(
      "rechaza un JWT con issuer incorrecto",
      async () => {
        const {
          usuario,
        } =
          await createTestUser();

        const token =
          signQaToken({
            sub:
              usuario.id,

            issuer:
              "sistema-atacante",
          });

        const response =
          await request(app)
            .get(
              "/api/auth/me"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            );

        expect(
          response.status
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "INVALID_TOKEN"
        );
      }
    );

    it(
      "rechaza un JWT con audience incorrecta",
      async () => {
        const {
          usuario,
        } =
          await createTestUser();

        const token =
          signQaToken({
            sub:
              usuario.id,

            audience:
              "aplicacion-atacante",
          });

        const response =
          await request(app)
            .get(
              "/api/auth/me"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            );

        expect(
          response.status
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "INVALID_TOKEN"
        );
      }
    );

    it(
      "rechaza un token que no sea de tipo access",
      async () => {
        const {
          usuario,
        } =
          await createTestUser();

        const token =
          signQaToken({
            sub:
              usuario.id,

            tipo:
              "refresh",
          });

        const response =
          await request(app)
            .get(
              "/api/auth/me"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            );

        expect(
          response.status
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "INVALID_TOKEN"
        );
      }
    );

    it(
      "rechaza un JWT con subject inválido",
      async () => {
        const token =
          signQaToken({
            sub:
              "abc",
          });

        const response =
          await request(app)
            .get(
              "/api/auth/me"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
            );

        expect(
          response.status
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "INVALID_TOKEN"
        );
      }
    );

    it(
      "invalida una sesión si el usuario fue eliminado después de emitir el token",
      async () => {
        const auth =
          await createAuthenticatedUser();

        await auth.usuario.destroy();

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
        ).toBe(401);

        expect(
          response.body.code
        ).toBe(
          "USER_NOT_FOUND"
        );
      }
    );

    it(
      "invalida permisos si el usuario fue desactivado después del login",
      async () => {
        const auth =
          await createAuthenticatedUser();

        await auth.usuario.update({
          activo: false,
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
        ).toBe(403);

        expect(
          response.body.code
        ).toBe(
          "USER_INACTIVE"
        );
      }
    );

    it(
      "rechaza un usuario cuyo rol actual en BD no es reconocido",
      async () => {
        const auth =
          await createAuthenticatedUser();

        await auth.usuario.update({
          rol:
            "superadmin-inventado",
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
        ).toBe(403);

        expect(
          response.body.code
        ).toBe(
          "INVALID_USER_ROLE"
        );
      }
    );

    it(
      "no permite escalar privilegios agregando rol admin dentro del JWT",
      async () => {
        const {
          usuario,
        } =
          await createTestUser({
            rol:
              ROLES.CLIENTE,
          });

        /**
         * Intentamos falsificar un claim:
         *
         * rol = admin
         *
         * El middleware NO debe confiar
         * en ese dato.
         */
        const token =
          signQaToken({
            sub:
              usuario.id,

            payload: {
              rol:
                ROLES.ADMIN,
            },
          });

        const response =
          await request(app)
            .get(
              "/api/usuarios"
            )
            .set(
              "Authorization",
              `Bearer ${token}`
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
      "un token de admin pierde permisos inmediatamente si el rol cambia en BD",
      async () => {
        const auth =
          await createAuthenticatedUser({
            rol:
              ROLES.ADMIN,
          });

        /**
         * Con rol admin actual:
         * debe funcionar.
         */
        const before =
          await request(app)
            .get(
              "/api/usuarios"
            )
            .set(
              "Authorization",
              `Bearer ${auth.token}`
            );

        expect(
          before.status
        ).toBe(200);

        /**
         * Lo degradamos a cliente
         * SIN generar otro token.
         */
        await auth.usuario.update({
          rol:
            ROLES.CLIENTE,
        });

        /**
         * El mismo JWT ya NO debe
         * conservar privilegios admin.
         */
        const after =
          await request(app)
            .get(
              "/api/usuarios"
            )
            .set(
              "Authorization",
              `Bearer ${auth.token}`
            );

        expect(
          after.status
        ).toBe(403);

        expect(
          after.body.code
        ).toBe(
          "INSUFFICIENT_PERMISSIONS"
        );
      }
    );
  }
);