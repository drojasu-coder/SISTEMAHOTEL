import request from "supertest";

import app from "../../src/app";

import {
  Role,
} from "../../src/constants/roles";

import {
  createTestUser,
} from "../fixtures/users";

interface AuthenticatedUserOptions {
  rol?: Role;
  activo?: boolean;
  email?: string;
  password?: string;
}

export const createAuthenticatedUser =
  async (
    options:
      AuthenticatedUserOptions = {}
  ) => {
    const {
      usuario,
      password,
    } =
      await createTestUser(
        options
      );

    const response =
      await request(app)
        .post(
          "/api/auth/login"
        )
        .send({
          email:
            usuario.email,

          password,
        });

    if (
      response.status !==
      200
    ) {
      throw new Error(
        `No fue posible autenticar usuario QA. HTTP ${response.status}: ${JSON.stringify(response.body)}`
      );
    }

    return {
      usuario,

      token:
        response.body
          .data
          .accessToken as string,

      password,
    };
  };