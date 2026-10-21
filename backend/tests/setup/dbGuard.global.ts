/**
 * Protección global de la base de datos de QA.
 *
 * Este archivo se ejecuta antes de TODA la suite.
 * Si Sequelize no está conectado específicamente
 * a hotel_test_db, Vitest aborta inmediatamente.
 */

import "./env";

export default async function setup() {
  process.env.NODE_ENV = "test";

  const db =
    require("../../src/models");

  const sequelize =
    db.sequelize;

  try {
    const [rows] =
      await sequelize.query(
        "SELECT current_database() AS database;"
      );

    const result =
      rows as Array<{
        database: string;
      }>;

    const currentDatabase =
      result[0]?.database;

    console.log(
      `[QA DB GUARD] Base de datos detectada: ${currentDatabase}`
    );

    if (
      currentDatabase !==
      "hotel_test_db"
    ) {
      throw new Error(
        [
          "",
          "======================================================",
          "🛑 QA ABORTADO POR SEGURIDAD",
          "======================================================",
          `Base detectada: ${currentDatabase}`,
          "Base requerida: hotel_test_db",
          "",
          "Los tests automáticos NO pueden ejecutarse",
          "sobre la base de datos de desarrollo.",
          "======================================================",
          "",
        ].join("\n")
      );
    }

    console.log(
      "[QA DB GUARD] ✅ Entorno de pruebas seguro"
    );
  } finally {
    /**
     * Este setup corre separado de los tests,
     * por lo que podemos cerrar esta conexión.
     *
     * Los tests abrirán su propia instancia/pool
     * cuando importen la aplicación.
     */
    await sequelize.close();
  }
}