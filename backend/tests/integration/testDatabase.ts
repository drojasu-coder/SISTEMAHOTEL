import fs from "node:fs";
import path from "node:path";
import { Sequelize } from "sequelize";

export type TestDatabase = Record<string, any> & {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
};

const EXPECTED_DATABASE_URL =
  "postgres://hotel_test_user:hotel_test_password@127.0.0.1:55432/hotel_test_db";

export const createIsolatedTestDatabase = async (): Promise<TestDatabase> => {
  const url = process.env.TEST_DATABASE_URL;
  if (url !== EXPECTED_DATABASE_URL) {
    throw new Error(
      "Refusing database tests: TEST_DATABASE_URL is not the isolated hotel_test_db URL",
    );
  }

  const sequelize = new Sequelize(url, {
    dialect: "postgres",
    logging: false,
  });
  await sequelize.authenticate();

  const modelsDirectory = path.resolve(__dirname, "../../src/models");
  const database = {
    sequelize,
    Sequelize,
  } as TestDatabase;

  for (const file of fs
    .readdirSync(modelsDirectory)
    .filter((name) => name.endsWith(".js") && name !== "index.js")
    .sort()) {
    const modelFactory = require(path.join(modelsDirectory, file));
    const model = modelFactory(sequelize, Sequelize.DataTypes);
    database[model.name] = model;
  }

  for (const model of Object.values(database)) {
    if (model && typeof model.associate === "function") {
      model.associate(database);
    }
  }

  const modelIndexPath = require.resolve("../../src/models/index.js");
  require.cache[modelIndexPath] = {
    exports: database,
  } as NodeModule;

  return database;
};

export const clearTestTables = async (database: TestDatabase) => {
  for (const model of Object.values(database)) {
    if (model?.destroy && model !== database.sequelize) {
      await model.destroy({ where: {}, force: true });
    }
  }
};
