import {
  afterAll,
  beforeEach,
} from "vitest";

import {
  closeDatabase,
  resetDatabase,
} from "../helpers/db";

/**
 * Cada prueba comienza desde una BD
 * completamente limpia y determinista.
 */
beforeEach(
  async () => {
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