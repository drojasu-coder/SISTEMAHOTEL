"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (
  testDatabaseUrl &&
  (!/^postgres(?:ql)?:\/\/[^/]+@(?:127\.0\.0\.1|localhost):(55432|55433)\/hotel_test_db(?:\?.*)?$/.test(
    testDatabaseUrl,
  ))
) {
  throw new Error(
    "TEST_DATABASE_URL debe apuntar exclusivamente a localhost:55432 o 55433 /hotel_test_db",
  );
}

const activeEnvironment = process.env.NODE_ENV || "development";
if (!["development", "test", "production"].includes(activeEnvironment)) {
  throw new Error(
    `NODE_ENV inválido: ${activeEnvironment}. Use development, test o production`,
  );
}

const configFor = (environment) => {
  const variable = environment === "test" ? "TEST_DATABASE_URL" : "DATABASE_URL";
  const url = process.env[variable];
  if (environment === activeEnvironment && !url) {
    throw new Error(`${variable} es obligatoria para Sequelize en el ambiente ${environment}`);
  }

  return {
    use_env_variable: variable,
    dialect: "postgres",
    logging: false,
  };
};

module.exports = {
  development: configFor("development"),
  test: configFor("test"),
  production: configFor("production"),
};
