const path = require("path");
const { createRequire } = require("module");

const backendPackage = path.resolve(
  __dirname,
  "../../backend/package.json"
);

const backendRequire = createRequire(backendPackage);

const { Sequelize } = backendRequire("sequelize");
const config = backendRequire("./src/config/config.json").test;

(async () => {
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: false,
    }
  );

  try {
    const [rows] = await sequelize.query(
      "SELECT current_database() AS database;"
    );

    const database = rows[0]?.database;

    console.log(
      "[QA DB GUARD] Base detectada:",
      database
    );

    if (database !== "hotel_test_db") {
      console.error(
        "[QA DB GUARD] BLOQUEADO. Se requiere hotel_test_db."
      );

      process.exitCode = 2;
      return;
    }

    console.log(
      "[QA DB GUARD] Entorno de pruebas seguro."
    );
  } finally {
    await sequelize.close();
  }
})().catch((error) => {
  console.error("[QA DB GUARD] ERROR:");
  console.error(error);

  process.exitCode = 1;
});