import {
  QueryTypes,
} from "sequelize";

/**
 * Segunda barrera de seguridad.
 * Los helpers destructivos solo pueden
 * trabajar con NODE_ENV=test.
 */
if (
  process.env.NODE_ENV !==
  "test"
) {
  throw new Error(
    "Los helpers de QA solo pueden cargarse con NODE_ENV=test"
  );
}

const db =
  require("../../src/models");

export const sequelize =
  db.sequelize;

/**
 * Comprueba nuevamente la BD real.
 *
 * No confiamos solamente en NODE_ENV.
 */
export const assertTestDatabase =
  async () => {
    const rows =
      await sequelize.query(
        "SELECT current_database() AS database;",
        {
          type:
            QueryTypes.SELECT,
        }
      ) as Array<{
        database: string;
      }>;

    const currentDatabase =
      rows[0]?.database;

    if (
      currentDatabase !==
      "hotel_test_db"
    ) {
      throw new Error(
        [
          "",
          "🛑 OPERACIÓN DE QA BLOQUEADA",
          `Base detectada: ${currentDatabase}`,
          "Base requerida: hotel_test_db",
          "",
        ].join("\n")
      );
    }

    return currentDatabase;
  };

/**
 * Vacía todas las tablas funcionales,
 * conserva SequelizeMeta y reinicia IDs.
 *
 * Esto nos proporciona un estado limpio
 * antes de cada prueba.
 */
export const resetDatabase =
  async () => {
    await assertTestDatabase();

    const tables =
      await sequelize.query(
        `
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
            AND tablename <> 'SequelizeMeta'
          ORDER BY tablename;
        `,
        {
          type:
            QueryTypes.SELECT,
        }
      ) as Array<{
        tablename: string;
      }>;

    if (
      tables.length === 0
    ) {
      return;
    }

    const queryInterface =
      sequelize.getQueryInterface();

    const quotedTables =
      tables
        .map(
          ({
            tablename,
          }) =>
            queryInterface
              .quoteIdentifier(
                tablename
              )
        )
        .join(", ");

    await sequelize.query(
      `
        TRUNCATE TABLE
        ${quotedTables}
        RESTART IDENTITY
        CASCADE;
      `
    );
  };

export const closeDatabase =
  async () => {
    await sequelize.close();
  };