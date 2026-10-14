import {
  defineConfig,
} from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    /**
     * Se ejecuta UNA VEZ antes de toda la suite.
     * Comprueba físicamente que Sequelize esté
     * conectado a hotel_test_db.
     */
    globalSetup: [
      "./tests/setup/dbGuard.global.ts",
    ],

    /**
     * Se ejecutan dentro del entorno de cada
     * archivo de pruebas.
     *
     * 1. env.ts configura NODE_ENV y variables QA.
     * 2. database.ts limpia hotel_test_db antes
     *    de cada test.
     */
    setupFiles: [
      "./tests/setup/env.ts",
      "./tests/setup/database.ts",
    ],

    /**
     * Todos nuestros tests automáticos.
     */
    include: [
      "tests/**/*.test.ts",
    ],

    /**
     * Por ahora todos los archivos utilizan
     * la misma hotel_test_db, así que evitamos
     * ejecución paralela entre archivos.
     */
    fileParallelism: false,

    /**
     * Un único worker.
     */
    maxWorkers: 1,

    /**
     * Algunos tests usarán PostgreSQL,
     * bcrypt, transacciones y concurrencia.
     */
    testTimeout: 15000,
    hookTimeout: 30000,

    clearMocks: true,
    restoreMocks: true,
  },
});