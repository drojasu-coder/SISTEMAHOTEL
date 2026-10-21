import { defineConfig } from "vitest/config";

/**
 * Dos proyectos comparten la base aislada hotel_test_db (puerto 55432):
 *
 * - baseline: pruebas unitarias e integración de la arquitectura refactorizada.
 * - qa: suite QA de endpoints; vacía las tablas antes de cada prueba y
 *   verifica con un guard global que la conexión apunta a hotel_test_db.
 *
 * Como comparten base de datos, los archivos se ejecutan en serie.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
    maxWorkers: 1,
    projects: [
      {
        extends: true,
        test: {
          name: "baseline",
          environment: "node",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
          globals: true,
          reporters: ["default"],
        },
      },
      {
        extends: true,
        test: {
          name: "qa",
          environment: "node",
          globalSetup: ["./tests/setup/dbGuard.global.ts"],
          setupFiles: ["./tests/setup/env.ts", "./tests/setup/database.ts"],
          include: ["tests/**/*.test.ts"],
          exclude: [
            "tests/unit/**",
            "tests/integration/**",
            "**/node_modules/**",
          ],
          testTimeout: 15000,
          hookTimeout: 30000,
          clearMocks: true,
          restoreMocks: true,
        },
      },
    ],
  },
});
