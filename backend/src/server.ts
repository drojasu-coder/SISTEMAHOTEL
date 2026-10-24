import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const db = require("./models");

async function startServer() {
  try {
    // 1. Autenticar conexión con la base de datos configurada
    await db.sequelize.authenticate();

    // 2. Consultar nombre de base y puerto interno de PostgreSQL
    const [queryResult] = await db.sequelize.query(
      "SELECT current_database(), inet_server_port();"
    );
    const dbInfo =
      (queryResult as Array<{ current_database: string; inet_server_port: number }>)[0] || {};
    const confirmedDb = dbInfo.current_database || "desconocida";
    const internalDbPort = dbInfo.inet_server_port || "desconocido";

    // 3. Extraer host y puerto externo configurados sin exponer credenciales
    const rawUrl = env.NODE_ENV === "test" ? env.TEST_DATABASE_URL! : env.DATABASE_URL!;
    const parsedUrl = new URL(rawUrl);
    const configuredHost = parsedUrl.hostname;
    const configuredPort = parsedUrl.port || "5432";

    // 4. Verificación estricta contra inconsistencias de entorno
    if (
      env.NODE_ENV === "development" &&
      (confirmedDb === "hotel_test_db" ||
        configuredPort === "55432" ||
        configuredPort === "55433")
    ) {
      const msg = `Configuración contradictoria: NODE_ENV=${env.NODE_ENV} pero está conectado a la base de pruebas '${confirmedDb}' en puerto ${configuredPort}. En desarrollo habitual debe usar hotel_db:5432. Para pruebas manuales ejecute 'npm run dev:test'.`;
      logger.error("server.startup_aborted", { reason: msg });
      console.error(`\n[ERROR DE ARRANQUE] ${msg}\n`);
      process.exit(1);
    }

    if (env.NODE_ENV === "test" && confirmedDb !== "hotel_test_db") {
      const msg = `Configuración contradictoria: NODE_ENV=${env.NODE_ENV} pero está conectado a la base '${confirmedDb}' en lugar de 'hotel_test_db'. En modo test debe apuntar a hotel_test_db:55432. Para desarrollo habitual ejecute 'npm run dev'.`;
      logger.error("server.startup_aborted", { reason: msg });
      console.error(`\n[ERROR DE ARRANQUE] ${msg}\n`);
      process.exit(1);
    }

    // 5. Resumen de arranque legible (sin secretos ni credenciales)
    const divider = "═".repeat(60);
    console.log(`\n${divider}`);
    console.log(" HOTEL HUNAPÚ - Backend Server");
    console.log(divider);
    console.log(` Entorno:             ${env.NODE_ENV}`);
    console.log(` Puerto HTTP:         ${env.PORT}`);
    console.log(` Host configurado:    ${configuredHost}`);
    console.log(` Puerto externo:      ${configuredPort} (Host / Docker port)`);
    console.log(` Puerto interno DB:   ${internalDbPort} (PostgreSQL server port)`);
    console.log(` Base confirmada:     ${confirmedDb}`);
    console.log(` Estado conexión:     Satisfactoria`);
    console.log(`${divider}\n`);

    // 6. Iniciar servidor Express
    app.listen(env.PORT, () => {
      logger.info("server.started", {
        port: env.PORT,
        env: env.NODE_ENV,
        database: confirmedDb,
      });
    });
  } catch (error: any) {
    logger.error("server.startup_failed", { error: error?.message || error });
    console.error(`\n[ERROR DE CONEXIÓN A BASE DE DATOS] ${error?.message || error}\n`);
    process.exit(1);
  }
}

startServer();
