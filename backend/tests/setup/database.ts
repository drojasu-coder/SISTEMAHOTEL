import {
  afterAll,
  beforeEach,
} from "vitest";

import {
  closeDatabase,
  resetDatabase,
} from "../helpers/db";
import { resetAuthRateLimitersForTests } from "../../src/routes/auth.routes";

/**
 * Cada prueba comienza desde una BD
 * completamente limpia y determinista.
 */
beforeEach(
  async () => {
    resetAuthRateLimitersForTests();
    await resetDatabase();
  }
);

/**
 * Cierra el pool de Sequelize al terminar
 * el archivo de pruebas.
 */
afterAll(
  async () => {
    await closeDatabase();
  }
);