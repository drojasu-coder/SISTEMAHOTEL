import bcrypt from "bcryptjs";

import {
  ROLES,
  Role,
} from "../../src/constants/roles";

const db =
  require("../../src/models");

const {
  Usuario,
} = db;

export const TEST_PASSWORD =
  "Hotel1234";

let sequence = 0;

interface CreateTestUserOptions {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: Role;
  telefono?: string | null;
  activo?: boolean;
}

export const createTestUser =
  async (
    options:
      CreateTestUserOptions = {}
  ) => {
    sequence += 1;

    const password =
      options.password ??
      TEST_PASSWORD;

    /**
     * Usamos pocas rondas únicamente en QA
     * para acelerar cientos de pruebas.
     *
     * Producción sigue utilizando 12.
     */
    const passwordHash =
      await bcrypt.hash(
        password,
        4
      );

    const rol =
      options.rol ??
      ROLES.CLIENTE;

    const email =
      options.email ??
      `qa-${rol}-${sequence}@hotel.test`;

    const usuario =
      await Usuario.create({
        nombre:
          options.nombre ??
          `Usuario QA ${sequence}`,

        email,

        password_hash:
          passwordHash,

        rol,

        telefono:
          options.telefono ??
          "55551234",

        activo:
          options.activo ??
          true,
      });

    return {
      usuario,
      password,
    };
  };